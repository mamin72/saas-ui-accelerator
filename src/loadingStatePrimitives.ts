export type LoadingLifecycleStatus = 'idle' | 'loading' | 'success' | 'error';

export type SkeletonVariant = 'text' | 'card' | 'table-row' | 'chart' | 'custom';

export type SkeletonDensity = 'compact' | 'comfortable';

export interface LoadingStateContract {
  stateKey: string;
  skeletonViewKey: string;
  showAfterMs: number;
  minVisibleMs: number;
  preservePreviousContent: boolean;
  announceLoading: boolean;
}

export interface SkeletonViewContract {
  viewKey: string;
  variant: SkeletonVariant;
  lineCount: number;
  animated: boolean;
  density: SkeletonDensity;
}

export type LoadingStateReasonCode = 'loading-state-not-registered' | 'skeleton-view-not-registered';

export interface LoadingStateReason {
  code: LoadingStateReasonCode;
  message: string;
}

export interface LoadingStateResolution {
  stateKey: string;
  skeletonViewKey?: string;
  loadingState?: LoadingStateContract;
  skeletonView?: SkeletonViewContract;
  resolved: boolean;
  reasons: readonly LoadingStateReason[];
}

export interface LoadingStatePresentation {
  showSkeleton: boolean;
  usePreviousContent: boolean;
  announceLoading: boolean;
}

export function createLoadingStateContract(input: {
  stateKey: string;
  skeletonViewKey: string;
  showAfterMs?: number;
  minVisibleMs?: number;
  preservePreviousContent?: boolean;
  announceLoading?: boolean;
}): LoadingStateContract {
  const stateKey = input.stateKey.trim();
  if (stateKey.length === 0) {
    throw new Error('Loading state contract key must be non-empty.');
  }

  const skeletonViewKey = input.skeletonViewKey.trim();
  if (skeletonViewKey.length === 0) {
    throw new Error('Skeleton view key must be non-empty for loading state contract.');
  }

  const showAfterMs = input.showAfterMs ?? 150;
  if (!Number.isFinite(showAfterMs) || showAfterMs < 0) {
    throw new Error('Loading state show-after duration must be greater than or equal to 0 ms.');
  }

  const minVisibleMs = input.minVisibleMs ?? 300;
  if (!Number.isFinite(minVisibleMs) || minVisibleMs < 0) {
    throw new Error('Loading state minimum-visible duration must be greater than or equal to 0 ms.');
  }

  return {
    stateKey,
    skeletonViewKey,
    showAfterMs,
    minVisibleMs,
    preservePreviousContent: input.preservePreviousContent ?? true,
    announceLoading: input.announceLoading ?? true,
  };
}

export function createSkeletonViewContract(input: {
  viewKey: string;
  variant?: SkeletonVariant;
  lineCount?: number;
  animated?: boolean;
  density?: SkeletonDensity;
}): SkeletonViewContract {
  const viewKey = input.viewKey.trim();
  if (viewKey.length === 0) {
    throw new Error('Skeleton view contract key must be non-empty.');
  }

  const lineCount = input.lineCount ?? 3;
  if (!Number.isInteger(lineCount) || lineCount < 1) {
    throw new Error('Skeleton line count must be an integer greater than or equal to 1.');
  }

  return {
    viewKey,
    variant: input.variant ?? 'text',
    lineCount,
    animated: input.animated ?? true,
    density: input.density ?? 'comfortable',
  };
}

export function createLoadingStateRegistry(input: {
  loadingStates: readonly LoadingStateContract[];
  skeletonViews: readonly SkeletonViewContract[];
}): {
  hasLoadingState(stateKey: string): boolean;
  hasSkeletonView(viewKey: string): boolean;
  listLoadingStateKeys(): readonly string[];
  listSkeletonViewKeys(): readonly string[];
  resolveSkeleton(stateKey: string): LoadingStateResolution;
} {
  const loadingStates = new Map<string, LoadingStateContract>();
  const skeletonViews = new Map<string, SkeletonViewContract>();

  for (const loadingState of input.loadingStates) {
    loadingStates.set(loadingState.stateKey, loadingState);
  }

  for (const skeletonView of input.skeletonViews) {
    skeletonViews.set(skeletonView.viewKey, skeletonView);
  }

  return {
    hasLoadingState(stateKey: string): boolean {
      return loadingStates.has(stateKey.trim());
    },
    hasSkeletonView(viewKey: string): boolean {
      return skeletonViews.has(viewKey.trim());
    },
    listLoadingStateKeys(): readonly string[] {
      return Array.from(loadingStates.keys()).sort((left, right) => left.localeCompare(right));
    },
    listSkeletonViewKeys(): readonly string[] {
      return Array.from(skeletonViews.keys()).sort((left, right) => left.localeCompare(right));
    },
    resolveSkeleton(stateKey: string): LoadingStateResolution {
      const normalizedStateKey = stateKey.trim();
      const loadingState = loadingStates.get(normalizedStateKey);

      if (!loadingState) {
        return {
          stateKey: normalizedStateKey,
          resolved: false,
          reasons: [
            {
              code: 'loading-state-not-registered',
              message: `No loading state contract is registered for '${normalizedStateKey}'.`,
            },
          ],
        };
      }

      const skeletonView = skeletonViews.get(loadingState.skeletonViewKey);
      if (!skeletonView) {
        return {
          stateKey: loadingState.stateKey,
          skeletonViewKey: loadingState.skeletonViewKey,
          loadingState,
          resolved: false,
          reasons: [
            {
              code: 'skeleton-view-not-registered',
              message: `No skeleton view contract is registered for '${loadingState.skeletonViewKey}'.`,
            },
          ],
        };
      }

      return {
        stateKey: loadingState.stateKey,
        skeletonViewKey: skeletonView.viewKey,
        loadingState,
        skeletonView,
        resolved: true,
        reasons: [],
      };
    },
  };
}

export function deriveLoadingStatePresentation(input: {
  contract: LoadingStateContract;
  status: LoadingLifecycleStatus;
  isFetching: boolean;
  elapsedLoadingMs: number;
  hasPreviousContent?: boolean;
}): LoadingStatePresentation {
  const elapsedLoadingMs = Math.max(0, input.elapsedLoadingMs);
  const isLoading = input.status === 'loading' && input.isFetching;

  if (!isLoading) {
    return {
      showSkeleton: false,
      usePreviousContent: false,
      announceLoading: false,
    };
  }

  const shouldShowSkeleton = elapsedLoadingMs >= input.contract.showAfterMs;
  const shouldPreserveContent =
    input.contract.preservePreviousContent && (input.hasPreviousContent ?? false) && !shouldShowSkeleton;

  return {
    showSkeleton: shouldShowSkeleton,
    usePreviousContent: shouldPreserveContent,
    announceLoading: shouldShowSkeleton && input.contract.announceLoading,
  };
}
