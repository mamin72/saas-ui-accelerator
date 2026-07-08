export type RetryBackoffStrategy = 'fixed' | 'exponential';

export interface RetryPolicyContract {
  policyKey: string;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoff: RetryBackoffStrategy;
  jitterRatio: number;
  retryableErrorTypes: readonly string[];
  retryableStatusCodes: readonly number[];
}

export interface RetryExecutionEvent {
  attempt: number;
  delayMs: number;
  errorType?: string;
  statusCode?: number;
}

export interface RetryExecutionResult<TValue = unknown> {
  policyKey: string;
  success: boolean;
  attempts: number;
  value?: TValue;
  error?: unknown;
  events: readonly RetryExecutionEvent[];
}

export function createRetryPolicyContract(input: {
  policyKey: string;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoff?: RetryBackoffStrategy;
  jitterRatio?: number;
  retryableErrorTypes?: readonly string[];
  retryableStatusCodes?: readonly number[];
}): RetryPolicyContract {
  const policyKey = input.policyKey.trim();
  if (policyKey.length === 0) {
    throw new Error('Retry policy key must be non-empty.');
  }

  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('Retry policy max attempts must be an integer greater than or equal to 1.');
  }

  const initialDelayMs = input.initialDelayMs ?? 200;
  if (!Number.isFinite(initialDelayMs) || initialDelayMs < 0) {
    throw new Error('Retry policy initial delay must be greater than or equal to 0 ms.');
  }

  const maxDelayMs = input.maxDelayMs ?? 5000;
  if (!Number.isFinite(maxDelayMs) || maxDelayMs < initialDelayMs) {
    throw new Error('Retry policy max delay must be greater than or equal to initial delay.');
  }

  const jitterRatio = input.jitterRatio ?? 0;
  if (!Number.isFinite(jitterRatio) || jitterRatio < 0 || jitterRatio > 1) {
    throw new Error('Retry policy jitter ratio must be between 0 and 1.');
  }

  return {
    policyKey,
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoff: input.backoff ?? 'exponential',
    jitterRatio,
    retryableErrorTypes: normalizeStringList(input.retryableErrorTypes),
    retryableStatusCodes: normalizeStatusCodes(input.retryableStatusCodes),
  };
}

export function calculateRetryDelayMs(
  policy: RetryPolicyContract,
  failedAttempt: number,
  randomValue = 0.5
): number {
  if (!Number.isInteger(failedAttempt) || failedAttempt < 1) {
    throw new Error('Failed attempt must be an integer greater than or equal to 1.');
  }

  const boundedRandom = Math.max(0, Math.min(1, randomValue));
  const baseDelay =
    policy.backoff === 'fixed'
      ? policy.initialDelayMs
      : Math.min(policy.maxDelayMs, policy.initialDelayMs * 2 ** (failedAttempt - 1));

  if (policy.jitterRatio === 0) {
    return Math.round(baseDelay);
  }

  const jitterWindow = baseDelay * policy.jitterRatio;
  const withJitter = baseDelay - jitterWindow + jitterWindow * 2 * boundedRandom;
  return Math.round(Math.min(policy.maxDelayMs, Math.max(0, withJitter)));
}

export function isRetryableError(policy: RetryPolicyContract, error: unknown): boolean {
  const hasTypeFilter = policy.retryableErrorTypes.length > 0;
  const hasStatusFilter = policy.retryableStatusCodes.length > 0;

  if (!hasTypeFilter && !hasStatusFilter) {
    return true;
  }

  const errorType = getErrorType(error);
  const statusCode = getStatusCode(error);

  if (hasTypeFilter && errorType && policy.retryableErrorTypes.includes(errorType)) {
    return true;
  }

  if (hasStatusFilter && statusCode != null && policy.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

export async function executeWithRetry<TValue>(
  operation: (attempt: number) => Promise<TValue>,
  policy: RetryPolicyContract,
  options?: {
    sleep?: (delayMs: number) => Promise<void>;
    random?: () => number;
  }
): Promise<RetryExecutionResult<TValue>> {
  const sleep = options?.sleep ?? (async (delayMs: number) => {
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  });

  const random = options?.random ?? (() => Math.random());
  const events: RetryExecutionEvent[] = [];

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      const value = await operation(attempt);
      return {
        policyKey: policy.policyKey,
        success: true,
        attempts: attempt,
        value,
        events,
      };
    } catch (error) {
      const retryable = isRetryableError(policy, error);
      const canRetry = retryable && attempt < policy.maxAttempts;

      if (!canRetry) {
        return {
          policyKey: policy.policyKey,
          success: false,
          attempts: attempt,
          error,
          events,
        };
      }

      const delayMs = calculateRetryDelayMs(policy, attempt, random());
      events.push({
        attempt,
        delayMs,
        errorType: getErrorType(error),
        statusCode: getStatusCode(error),
      });
      await sleep(delayMs);
    }
  }

  return {
    policyKey: policy.policyKey,
    success: false,
    attempts: policy.maxAttempts,
    error: new Error('Retry wrapper exhausted without completion.'),
    events,
  };
}

function normalizeStringList(values?: readonly string[]): readonly string[] {
  if (!values) {
    return [];
  }

  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

function normalizeStatusCodes(values?: readonly number[]): readonly number[] {
  if (!values) {
    return [];
  }

  const normalized = values
    .filter((value) => Number.isInteger(value) && value >= 100 && value <= 599)
    .map((value) => Number(value));

  return Array.from(new Set(normalized));
}

function getErrorType(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as { name?: unknown; code?: unknown };
  if (typeof candidate.name === 'string' && candidate.name.trim().length > 0) {
    return candidate.name.trim();
  }

  if (typeof candidate.code === 'string' && candidate.code.trim().length > 0) {
    return candidate.code.trim();
  }

  return undefined;
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as {
    statusCode?: unknown;
    response?: {
      status?: unknown;
    };
  };

  if (typeof candidate.statusCode === 'number' && Number.isInteger(candidate.statusCode)) {
    return candidate.statusCode;
  }

  const responseStatus = candidate.response?.status;
  if (typeof responseStatus === 'number' && Number.isInteger(responseStatus)) {
    return responseStatus;
  }

  return undefined;
}
