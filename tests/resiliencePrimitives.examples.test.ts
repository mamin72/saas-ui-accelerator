import { describe, expect, it } from 'vitest';
import {
  createErrorBoundaryContract,
  createErrorResilienceRegistry,
  createFallbackViewContract,
  createLoadingStateContract,
  createLoadingStateRegistry,
  createOptimisticRecoveryController,
  createOptimisticRollbackPolicyContract,
  createRetryPolicyContract,
  createSkeletonViewContract,
  deriveLoadingStatePresentation,
  executeWithRetry,
} from '../src/index';

describe('resilience primitives examples', () => {
  it('coordinates loading skeleton presentation and fallback mapping in one flow', () => {
    const loadingRegistry = createLoadingStateRegistry({
      loadingStates: [
        createLoadingStateContract({
          stateKey: 'users.table',
          skeletonViewKey: 'users.table.skeleton',
          showAfterMs: 120,
        }),
      ],
      skeletonViews: [
        createSkeletonViewContract({
          viewKey: 'users.table.skeleton',
          variant: 'table-row',
          lineCount: 6,
        }),
      ],
    });

    const errorRegistry = createErrorResilienceRegistry({
      boundaries: [
        createErrorBoundaryContract({
          boundaryKey: 'users.table.boundary',
          fallbackViewKey: 'users.table.fallback',
        }),
      ],
      fallbackViews: [
        createFallbackViewContract({
          viewKey: 'users.table.fallback',
          title: 'Users are unavailable',
          message: 'Try reloading the page.',
          allowRetry: true,
        }),
      ],
    });

    const loadingResolution = loadingRegistry.resolveSkeleton('users.table');
    expect(loadingResolution.resolved).toBe(true);
    expect(loadingResolution.skeletonView?.variant).toBe('table-row');

    const loadingPresentation = deriveLoadingStatePresentation({
      contract: loadingResolution.loadingState!,
      status: 'loading',
      isFetching: true,
      elapsedLoadingMs: 150,
      hasPreviousContent: true,
    });

    expect(loadingPresentation).toEqual({
      showSkeleton: true,
      usePreviousContent: false,
      announceLoading: true,
    });

    const errorResolution = errorRegistry.resolveFallback('users.table.boundary');
    expect(errorResolution.resolved).toBe(true);
    expect(errorResolution.fallbackView?.allowRetry).toBe(true);
  });

  it('combines retry policy and optimistic recovery to stabilize failed mutations', async () => {
    const retryPolicy = createRetryPolicyContract({
      policyKey: 'users.update.retry',
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 40,
      backoff: 'fixed',
      retryableErrorTypes: ['TimeoutError'],
    });

    const recoveryPolicy = createOptimisticRollbackPolicyContract({
      policyKey: 'users.update.recovery',
      maxRecoveryAttempts: 2,
      recoveryDelayMs: 15,
      useExponentialBackoff: true,
      preserveFailedOptimisticValue: false,
    });

    const recoveryController = createOptimisticRecoveryController({
      key: 'users.update',
      baselineValue: { status: 'stable' },
      optimisticValue: { status: 'pending-save' },
      policy: recoveryPolicy,
    });

    let invocation = 0;
    const retryResult = await executeWithRetry(
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

    recoveryController.rollback('mutation-timeout');
    const recovered = recoveryController.recover({ status: 'saved' });

    expect(recovered.status).toBe('recovered');
    expect(recovered.attempt).toBe(1);
    expect(recovered.recoveredValue).toEqual({ status: 'saved' });
  });
});
