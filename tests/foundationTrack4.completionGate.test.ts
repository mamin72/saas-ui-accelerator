import { describe, expect, it } from 'vitest';
import * as foundation from '../src/index';

describe('foundation track 4 completion gate', () => {
  it('exposes all expected public APIs for chunk 1 through chunk 4 deliverables', () => {
    expect(typeof foundation.createErrorBoundaryContract).toBe('function');
    expect(typeof foundation.createFallbackViewContract).toBe('function');
    expect(typeof foundation.createErrorResilienceRegistry).toBe('function');

    expect(typeof foundation.createRetryPolicyContract).toBe('function');
    expect(typeof foundation.calculateRetryDelayMs).toBe('function');
    expect(typeof foundation.executeWithRetry).toBe('function');

    expect(typeof foundation.createLoadingStateContract).toBe('function');
    expect(typeof foundation.createSkeletonViewContract).toBe('function');
    expect(typeof foundation.createLoadingStateRegistry).toBe('function');
    expect(typeof foundation.deriveLoadingStatePresentation).toBe('function');

    expect(typeof foundation.createOptimisticRollbackPolicyContract).toBe('function');
    expect(typeof foundation.calculateRecoveryDelayMs).toBe('function');
    expect(typeof foundation.createOptimisticRecoveryController).toBe('function');
  });

  it('validates integrated resilience flow across error, retry, loading, and recovery primitives', async () => {
    const errorRegistry = foundation.createErrorResilienceRegistry({
      boundaries: [
        foundation.createErrorBoundaryContract({
          boundaryKey: 'users.table.boundary',
          fallbackViewKey: 'users.table.fallback',
        }),
      ],
      fallbackViews: [
        foundation.createFallbackViewContract({
          viewKey: 'users.table.fallback',
          title: 'Users unavailable',
          message: 'Try reloading.',
          allowRetry: true,
        }),
      ],
    });

    const loadingRegistry = foundation.createLoadingStateRegistry({
      loadingStates: [
        foundation.createLoadingStateContract({
          stateKey: 'users.table',
          skeletonViewKey: 'users.table.skeleton',
          showAfterMs: 120,
          preservePreviousContent: true,
        }),
      ],
      skeletonViews: [
        foundation.createSkeletonViewContract({
          viewKey: 'users.table.skeleton',
          variant: 'table-row',
          lineCount: 6,
        }),
      ],
    });

    const retryPolicy = foundation.createRetryPolicyContract({
      policyKey: 'users.fetch.retry',
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 20,
      backoff: 'fixed',
      retryableErrorTypes: ['TimeoutError'],
    });

    const recoveryPolicy = foundation.createOptimisticRollbackPolicyContract({
      policyKey: 'users.update.recovery',
      maxRecoveryAttempts: 2,
      recoveryDelayMs: 15,
      useExponentialBackoff: true,
      preserveFailedOptimisticValue: false,
    });

    const recoveryController = foundation.createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'pending-save' },
      policy: recoveryPolicy,
    });

    const errorResolution = errorRegistry.resolveFallback('users.table.boundary');
    expect(errorResolution.resolved).toBe(true);
    expect(errorResolution.fallbackView?.allowRetry).toBe(true);

    const loadingResolution = loadingRegistry.resolveSkeleton('users.table');
    expect(loadingResolution.resolved).toBe(true);

    const presentation = foundation.deriveLoadingStatePresentation({
      contract: loadingResolution.loadingState!,
      status: 'loading',
      isFetching: true,
      elapsedLoadingMs: 150,
      hasPreviousContent: true,
    });

    expect(presentation).toEqual({
      showSkeleton: true,
      usePreviousContent: false,
      announceLoading: true,
    });

    let invocation = 0;
    const retryResult = await foundation.executeWithRetry(
      () => {
        invocation += 1;

        if (invocation < 3) {
          const timeoutError = new Error('temporary timeout');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }

        return Promise.resolve({ status: 'saved' });
      },
      retryPolicy,
      {
        sleep: () => Promise.resolve(),
        random: () => 0.5,
      }
    );

    expect(retryResult.success).toBe(true);
    expect(retryResult.attempts).toBe(3);

    const rolledBack = recoveryController.rollback('network-timeout');
    expect(rolledBack.status).toBe('rolled-back');

    const recovered = recoveryController.recover({ status: 'saved' });
    expect(recovered.status).toBe('recovered');
    expect(recovered.attempt).toBe(1);
    expect(recovered.recoveredValue).toEqual({ status: 'saved' });
  });
});
