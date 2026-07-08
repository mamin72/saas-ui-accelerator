import { describe, expect, it } from 'vitest';
import {
  calculateRecoveryDelayMs,
  createOptimisticRecoveryController,
  createOptimisticRollbackPolicyContract,
} from '../src/index';

describe('optimistic recovery helpers', () => {
  it('creates normalized rollback policies with defaults', () => {
    const policy = createOptimisticRollbackPolicyContract({
      policyKey: ' users.update ',
    });

    expect(policy.policyKey).toBe('users.update');
    expect(policy.maxRecoveryAttempts).toBe(2);
    expect(policy.recoveryDelayMs).toBe(200);
    expect(policy.maxRecoveryDelayMs).toBe(2000);
    expect(policy.useExponentialBackoff).toBe(false);
    expect(policy.preserveFailedOptimisticValue).toBe(false);
  });

  it('rejects invalid rollback policy inputs', () => {
    expect(() => createOptimisticRollbackPolicyContract({ policyKey: ' ' })).toThrow(
      'Optimistic rollback policy key must be non-empty.'
    );

    expect(() =>
      createOptimisticRollbackPolicyContract({
        policyKey: 'x',
        maxRecoveryAttempts: -1,
      })
    ).toThrow('Max recovery attempts must be an integer greater than or equal to 0.');

    expect(() =>
      createOptimisticRollbackPolicyContract({
        policyKey: 'x',
        recoveryDelayMs: -1,
      })
    ).toThrow('Recovery delay must be greater than or equal to 0 ms.');

    expect(() =>
      createOptimisticRollbackPolicyContract({
        policyKey: 'x',
        recoveryDelayMs: 20,
        maxRecoveryDelayMs: 10,
      })
    ).toThrow('Max recovery delay must be greater than or equal to recovery delay.');
  });

  it('calculates fixed and exponential recovery delays', () => {
    const fixed = createOptimisticRollbackPolicyContract({
      policyKey: 'fixed',
      recoveryDelayMs: 50,
      maxRecoveryDelayMs: 1000,
      useExponentialBackoff: false,
    });

    const exponential = createOptimisticRollbackPolicyContract({
      policyKey: 'exp',
      recoveryDelayMs: 50,
      maxRecoveryDelayMs: 120,
      useExponentialBackoff: true,
    });

    expect(calculateRecoveryDelayMs(fixed, 1)).toBe(50);
    expect(calculateRecoveryDelayMs(exponential, 1)).toBe(50);
    expect(calculateRecoveryDelayMs(exponential, 2)).toBe(100);
    expect(calculateRecoveryDelayMs(exponential, 3)).toBe(120);
  });

  it('rejects invalid recovery attempt number', () => {
    const policy = createOptimisticRollbackPolicyContract({ policyKey: 'delay' });
    expect(() => calculateRecoveryDelayMs(policy, 0)).toThrow(
      'Recovery attempt must be an integer greater than or equal to 1.'
    );
  });

  it('initializes optimistic recovery controller with optimistic-applied event', () => {
    const controller = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
    });

    const policy = controller.getPolicy();
    expect(policy.policyKey).toBe('users.update.policy');

    const state = controller.getState();
    expect(state.status).toBe('pending');
    expect(state.attempt).toBe(0);

    const events = controller.listEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('optimistic-applied');
  });

  it('commits and resets optimistic state through controller', () => {
    let now = 100;
    const controller = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
      nowEpochMs: () => now,
    });

    now = 110;
    const committed = controller.commit({ status: 'saved' });
    expect(committed.status).toBe('committed');
    expect(committed.committedValue).toEqual({ status: 'saved' });

    now = 120;
    const reset = controller.reset();
    expect(reset.status).toBe('idle');
    expect(reset.optimisticValue).toEqual({ status: 'stable' });

    const eventTypes = controller.listEvents().map((event) => event.type);
    expect(eventTypes).toEqual(['optimistic-applied', 'committed', 'reset']);
  });

  it('rolls back and recovers when policy allows recovery', () => {
    let now = 200;
    const policy = createOptimisticRollbackPolicyContract({
      policyKey: 'recover',
      maxRecoveryAttempts: 2,
      recoveryDelayMs: 25,
    });

    const controller = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
      policy,
      nowEpochMs: () => now,
    });

    now = 210;
    const rolledBack = controller.rollback('offline');
    expect(rolledBack.status).toBe('rolled-back');
    expect(rolledBack.error).toBe('offline');

    const plan = controller.planRecovery();
    expect(plan).toEqual({
      allowed: true,
      nextAttempt: 1,
      delayMs: 25,
    });

    now = 220;
    const recovered = controller.recover({ status: 'stable-after-retry' });
    expect(recovered.status).toBe('recovered');
    expect(recovered.attempt).toBe(1);
    expect(recovered.recoveredValue).toEqual({ status: 'stable-after-retry' });

    const eventTypes = controller.listEvents().map((event) => event.type);
    expect(eventTypes).toEqual([
      'optimistic-applied',
      'rolled-back',
      'recovery-planned',
      'recovery-planned',
      'recovered',
    ]);
  });

  it('returns recovery plan denial when not rolled back', () => {
    const controller = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
    });

    const plan = controller.planRecovery();
    expect(plan.allowed).toBe(false);
    expect(plan.reason).toBe('Recovery is only available after rollback.');
  });

  it('enforces max recovery attempts and throws when recovering beyond plan', () => {
    const policy = createOptimisticRollbackPolicyContract({
      policyKey: 'limited',
      maxRecoveryAttempts: 1,
      recoveryDelayMs: 10,
    });

    const controller = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
      policy,
    });

    controller.rollback('network');
    controller.recover({ status: 'recovered-once' });
    controller.rollback('network-again');

    const deniedPlan = controller.planRecovery();
    expect(deniedPlan.allowed).toBe(false);
    expect(deniedPlan.reason).toContain('Recovery attempts exceeded max');

    expect(() => controller.recover({ status: 'should-fail' })).toThrow(
      'Recovery attempts exceeded max of 1.'
    );
  });

  it('fails and resets optimistic value according to preservation policy', () => {
    const preservingPolicy = createOptimisticRollbackPolicyContract({
      policyKey: 'preserve',
      preserveFailedOptimisticValue: true,
    });

    const revertingPolicy = createOptimisticRollbackPolicyContract({
      policyKey: 'revert',
      preserveFailedOptimisticValue: false,
    });

    const preservingController = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
      policy: preservingPolicy,
    });

    const revertingController = createOptimisticRecoveryController({
      key: 'users.update-2',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'optimistic' },
      policy: revertingPolicy,
      maxEvents: 2,
    });

    const preservedFailed = preservingController.fail('hard-error');
    expect(preservedFailed.status).toBe('failed');
    expect(preservedFailed.optimisticValue).toEqual({ status: 'optimistic' });

    const revertedFailed = revertingController.fail('hard-error');
    expect(revertedFailed.optimisticValue).toEqual({ status: 'stable' });

    revertingController.reset();
    revertingController.commit({ status: 'saved' });

    const trimmedEvents = revertingController.listEvents();
    expect(trimmedEvents).toHaveLength(2);
    expect(trimmedEvents.map((event) => event.type)).toEqual(['reset', 'committed']);
  });

  it('rejects empty optimistic recovery keys', () => {
    expect(() =>
      createOptimisticRecoveryController({
        key: ' ',
        baselineValue: { status: 'stable' },
        optimisticValue: { status: 'optimistic' },
      })
    ).toThrow('Optimistic recovery key must be non-empty.');
  });
});
