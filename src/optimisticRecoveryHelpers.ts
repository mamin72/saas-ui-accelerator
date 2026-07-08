export interface OptimisticRollbackPolicyContract {
  policyKey: string;
  maxRecoveryAttempts: number;
  recoveryDelayMs: number;
  maxRecoveryDelayMs: number;
  useExponentialBackoff: boolean;
  preserveFailedOptimisticValue: boolean;
}

export type OptimisticRecoveryStatus =
  | 'pending'
  | 'committed'
  | 'rolled-back'
  | 'recovered'
  | 'failed'
  | 'idle';

export type OptimisticRecoveryEventType =
  | 'optimistic-applied'
  | 'committed'
  | 'rolled-back'
  | 'recovery-planned'
  | 'recovered'
  | 'failed'
  | 'reset';

export interface OptimisticRecoveryState<TValue = unknown, TError = unknown> {
  key: string;
  status: OptimisticRecoveryStatus;
  attempt: number;
  baselineValue: TValue;
  optimisticValue: TValue;
  committedValue?: TValue;
  recoveredValue?: TValue;
  error?: TError;
  updatedAtEpochMs: number;
}

export interface OptimisticRecoveryEvent<TValue = unknown, TError = unknown> {
  type: OptimisticRecoveryEventType;
  key: string;
  state: OptimisticRecoveryState<TValue, TError>;
  atEpochMs: number;
}

export interface OptimisticRecoveryPlan {
  allowed: boolean;
  nextAttempt: number;
  delayMs: number;
  reason?: string;
}

export interface OptimisticRecoveryController<TValue = unknown, TError = unknown> {
  getState(): OptimisticRecoveryState<TValue, TError>;
  listEvents(): readonly OptimisticRecoveryEvent<TValue, TError>[];
  getPolicy(): OptimisticRollbackPolicyContract;
  commit(value: TValue): OptimisticRecoveryState<TValue, TError>;
  rollback(error?: TError): OptimisticRecoveryState<TValue, TError>;
  planRecovery(): OptimisticRecoveryPlan;
  recover(value: TValue): OptimisticRecoveryState<TValue, TError>;
  fail(error: TError): OptimisticRecoveryState<TValue, TError>;
  reset(): OptimisticRecoveryState<TValue, TError>;
}

export function createOptimisticRollbackPolicyContract(input: {
  policyKey: string;
  maxRecoveryAttempts?: number;
  recoveryDelayMs?: number;
  maxRecoveryDelayMs?: number;
  useExponentialBackoff?: boolean;
  preserveFailedOptimisticValue?: boolean;
}): OptimisticRollbackPolicyContract {
  const policyKey = input.policyKey.trim();
  if (policyKey.length === 0) {
    throw new Error('Optimistic rollback policy key must be non-empty.');
  }

  const maxRecoveryAttempts = input.maxRecoveryAttempts ?? 2;
  if (!Number.isInteger(maxRecoveryAttempts) || maxRecoveryAttempts < 0) {
    throw new Error('Max recovery attempts must be an integer greater than or equal to 0.');
  }

  const recoveryDelayMs = input.recoveryDelayMs ?? 200;
  if (!Number.isFinite(recoveryDelayMs) || recoveryDelayMs < 0) {
    throw new Error('Recovery delay must be greater than or equal to 0 ms.');
  }

  const maxRecoveryDelayMs = input.maxRecoveryDelayMs ?? 2000;
  if (!Number.isFinite(maxRecoveryDelayMs) || maxRecoveryDelayMs < recoveryDelayMs) {
    throw new Error('Max recovery delay must be greater than or equal to recovery delay.');
  }

  return {
    policyKey,
    maxRecoveryAttempts,
    recoveryDelayMs,
    maxRecoveryDelayMs,
    useExponentialBackoff: input.useExponentialBackoff ?? false,
    preserveFailedOptimisticValue: input.preserveFailedOptimisticValue ?? false,
  };
}

export function calculateRecoveryDelayMs(
  policy: OptimisticRollbackPolicyContract,
  attempt: number
): number {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new Error('Recovery attempt must be an integer greater than or equal to 1.');
  }

  if (!policy.useExponentialBackoff) {
    return policy.recoveryDelayMs;
  }

  return Math.min(policy.maxRecoveryDelayMs, policy.recoveryDelayMs * 2 ** (attempt - 1));
}

export function createOptimisticRecoveryController<TValue = unknown, TError = unknown>(input: {
  key: string;
  baselineValue: TValue;
  optimisticValue: TValue;
  policy?: OptimisticRollbackPolicyContract;
  nowEpochMs?: () => number;
  maxEvents?: number;
}): OptimisticRecoveryController<TValue, TError> {
  const key = input.key.trim();
  if (key.length === 0) {
    throw new Error('Optimistic recovery key must be non-empty.');
  }

  const policy = input.policy ?? createOptimisticRollbackPolicyContract({ policyKey: `${key}.policy` });
  const nowEpochMs = input.nowEpochMs ?? (() => Date.now());
  const maxEvents = input.maxEvents ?? 100;

  const events: OptimisticRecoveryEvent<TValue, TError>[] = [];

  let state: OptimisticRecoveryState<TValue, TError> = {
    key,
    status: 'pending',
    attempt: 0,
    baselineValue: input.baselineValue,
    optimisticValue: input.optimisticValue,
    updatedAtEpochMs: nowEpochMs(),
  };

  const emit = (type: OptimisticRecoveryEventType): void => {
    const event: OptimisticRecoveryEvent<TValue, TError> = {
      type,
      key,
      state: { ...state },
      atEpochMs: state.updatedAtEpochMs,
    };

    events.push(event);
    if (events.length > maxEvents) {
      events.splice(0, events.length - maxEvents);
    }
  };

  emit('optimistic-applied');

  return {
    getState(): OptimisticRecoveryState<TValue, TError> {
      return { ...state };
    },
    listEvents(): readonly OptimisticRecoveryEvent<TValue, TError>[] {
      return [...events];
    },
    getPolicy(): OptimisticRollbackPolicyContract {
      return policy;
    },
    commit(value: TValue): OptimisticRecoveryState<TValue, TError> {
      state = {
        ...state,
        status: 'committed',
        committedValue: value,
        error: undefined,
        updatedAtEpochMs: nowEpochMs(),
      };
      emit('committed');
      return { ...state };
    },
    rollback(error?: TError): OptimisticRecoveryState<TValue, TError> {
      state = {
        ...state,
        status: 'rolled-back',
        committedValue: undefined,
        recoveredValue: undefined,
        error,
        updatedAtEpochMs: nowEpochMs(),
      };
      emit('rolled-back');
      return { ...state };
    },
    planRecovery(): OptimisticRecoveryPlan {
      const nextAttempt = state.attempt + 1;

      if (state.status !== 'rolled-back') {
        return {
          allowed: false,
          nextAttempt,
          delayMs: 0,
          reason: 'Recovery is only available after rollback.',
        };
      }

      if (nextAttempt > policy.maxRecoveryAttempts) {
        return {
          allowed: false,
          nextAttempt,
          delayMs: 0,
          reason: `Recovery attempts exceeded max of ${policy.maxRecoveryAttempts}.`,
        };
      }

      const delayMs = calculateRecoveryDelayMs(policy, nextAttempt);
      state = {
        ...state,
        updatedAtEpochMs: nowEpochMs(),
      };
      emit('recovery-planned');

      return {
        allowed: true,
        nextAttempt,
        delayMs,
      };
    },
    recover(value: TValue): OptimisticRecoveryState<TValue, TError> {
      const plan = this.planRecovery();
      if (!plan.allowed) {
        throw new Error(plan.reason ?? 'Recovery attempt not allowed.');
      }

      state = {
        ...state,
        status: 'recovered',
        attempt: plan.nextAttempt,
        recoveredValue: value,
        error: undefined,
        updatedAtEpochMs: nowEpochMs(),
      };
      emit('recovered');
      return { ...state };
    },
    fail(error: TError): OptimisticRecoveryState<TValue, TError> {
      state = {
        ...state,
        status: 'failed',
        error,
        optimisticValue: policy.preserveFailedOptimisticValue ? state.optimisticValue : state.baselineValue,
        updatedAtEpochMs: nowEpochMs(),
      };
      emit('failed');
      return { ...state };
    },
    reset(): OptimisticRecoveryState<TValue, TError> {
      state = {
        key,
        status: 'idle',
        attempt: 0,
        baselineValue: state.baselineValue,
        optimisticValue: state.baselineValue,
        committedValue: undefined,
        recoveredValue: undefined,
        error: undefined,
        updatedAtEpochMs: nowEpochMs(),
      };
      emit('reset');
      return { ...state };
    },
  };
}
