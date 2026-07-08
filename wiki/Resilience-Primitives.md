# Resilience Primitives

This guide covers the Phase 5 Foundation Track 4 resilience primitives:

- Error boundary and fallback view contracts
- Retry wrappers with policy configuration
- Loading-state and skeleton conventions
- Optimistic rollback and recovery helpers

## Error Boundary and Fallback Contracts

```ts
import {
  createErrorBoundaryContract,
  createErrorResilienceRegistry,
  createFallbackViewContract
} from "saas-ui-accelerator";

const registry = createErrorResilienceRegistry({
  boundaries: [
    createErrorBoundaryContract({
      boundaryKey: "users.table.boundary",
      fallbackViewKey: "users.table.fallback",
      scope: "component"
    })
  ],
  fallbackViews: [
    createFallbackViewContract({
      viewKey: "users.table.fallback",
      title: "Users are unavailable",
      message: "Try again in a moment.",
      allowRetry: true
    })
  ]
});

const resolution = registry.resolveFallback("users.table.boundary");
```

## Retry Wrappers

```ts
import { createRetryPolicyContract, executeWithRetry } from "saas-ui-accelerator";

const retryPolicy = createRetryPolicyContract({
  policyKey: "users.fetch.retry",
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 1000,
  backoff: "exponential",
  jitterRatio: 0.2,
  retryableErrorTypes: ["TimeoutError"],
  retryableStatusCodes: [429, 503]
});

const result = await executeWithRetry(async (attempt) => {
  return { attempt, status: "ok" };
}, retryPolicy);
```

## Loading-State and Skeleton Conventions

```ts
import {
  createLoadingStateContract,
  createLoadingStateRegistry,
  createSkeletonViewContract,
  deriveLoadingStatePresentation
} from "saas-ui-accelerator";

const loadingRegistry = createLoadingStateRegistry({
  loadingStates: [
    createLoadingStateContract({
      stateKey: "users.table",
      skeletonViewKey: "users.table.skeleton",
      showAfterMs: 120,
      preservePreviousContent: true
    })
  ],
  skeletonViews: [
    createSkeletonViewContract({
      viewKey: "users.table.skeleton",
      variant: "table-row",
      lineCount: 6,
      density: "comfortable"
    })
  ]
});

const loadingResolution = loadingRegistry.resolveSkeleton("users.table");

const presentation = deriveLoadingStatePresentation({
  contract: loadingResolution.loadingState!,
  status: "loading",
  isFetching: true,
  elapsedLoadingMs: 250,
  hasPreviousContent: true
});
```

## Optimistic Rollback and Recovery

```ts
import {
  createOptimisticRecoveryController,
  createOptimisticRollbackPolicyContract
} from "saas-ui-accelerator";

const recoveryPolicy = createOptimisticRollbackPolicyContract({
  policyKey: "users.update.recovery",
  maxRecoveryAttempts: 2,
  recoveryDelayMs: 50,
  useExponentialBackoff: true,
  preserveFailedOptimisticValue: false
});

const recovery = createOptimisticRecoveryController({
  key: "users.update",
  baselineValue: { status: "stable" },
  optimisticValue: { status: "pending-save" },
  policy: recoveryPolicy
});

recovery.rollback("network-timeout");
const plan = recovery.planRecovery();

if (plan.allowed) {
  recovery.recover({ status: "saved" });
}
```

## End-to-End Example Pattern

```ts
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
  executeWithRetry
} from "saas-ui-accelerator";

const loadingRegistry = createLoadingStateRegistry({
  loadingStates: [createLoadingStateContract({ stateKey: "users.table", skeletonViewKey: "users.table.skeleton" })],
  skeletonViews: [createSkeletonViewContract({ viewKey: "users.table.skeleton", variant: "table-row", lineCount: 6 })]
});

const errorRegistry = createErrorResilienceRegistry({
  boundaries: [createErrorBoundaryContract({ boundaryKey: "users.table.boundary", fallbackViewKey: "users.table.fallback" })],
  fallbackViews: [createFallbackViewContract({ viewKey: "users.table.fallback", title: "Users unavailable", message: "Try again." })]
});

const retryPolicy = createRetryPolicyContract({ policyKey: "users.fetch.retry", retryableErrorTypes: ["TimeoutError"] });
const recoveryPolicy = createOptimisticRollbackPolicyContract({ policyKey: "users.update.recovery", maxRecoveryAttempts: 2 });
const recovery = createOptimisticRecoveryController({
  key: "users.update",
  baselineValue: { status: "stable" },
  optimisticValue: { status: "pending-save" },
  policy: recoveryPolicy
});

const loadingResolution = loadingRegistry.resolveSkeleton("users.table");
const fallbackResolution = errorRegistry.resolveFallback("users.table.boundary");

const presentation = deriveLoadingStatePresentation({
  contract: loadingResolution.loadingState!,
  status: "loading",
  isFetching: true,
  elapsedLoadingMs: 200,
  hasPreviousContent: true
});

await executeWithRetry(async () => ({ status: "ok" }), retryPolicy);
recovery.rollback("network-timeout");
recovery.recover({ status: "saved" });

presentation.showSkeleton;
fallbackResolution.resolved;
```
