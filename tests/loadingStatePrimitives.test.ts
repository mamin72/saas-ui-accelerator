import { describe, expect, it } from 'vitest';
import {
  createLoadingStateContract,
  createLoadingStateRegistry,
  createSkeletonViewContract,
  deriveLoadingStatePresentation,
} from '../src/index';

describe('loading state primitives', () => {
  it('creates normalized loading state contracts with defaults', () => {
    const contract = createLoadingStateContract({
      stateKey: ' users.table ',
      skeletonViewKey: ' table.rows ',
    });

    expect(contract.stateKey).toBe('users.table');
    expect(contract.skeletonViewKey).toBe('table.rows');
    expect(contract.showAfterMs).toBe(150);
    expect(contract.minVisibleMs).toBe(300);
    expect(contract.preservePreviousContent).toBe(true);
    expect(contract.announceLoading).toBe(true);
  });

  it('rejects invalid loading state keys and durations', () => {
    expect(() =>
      createLoadingStateContract({
        stateKey: ' ',
        skeletonViewKey: 'table.rows',
      })
    ).toThrow('Loading state contract key must be non-empty.');

    expect(() =>
      createLoadingStateContract({
        stateKey: 'users.table',
        skeletonViewKey: ' ',
      })
    ).toThrow('Skeleton view key must be non-empty for loading state contract.');

    expect(() =>
      createLoadingStateContract({
        stateKey: 'users.table',
        skeletonViewKey: 'table.rows',
        showAfterMs: -1,
      })
    ).toThrow('Loading state show-after duration must be greater than or equal to 0 ms.');

    expect(() =>
      createLoadingStateContract({
        stateKey: 'users.table',
        skeletonViewKey: 'table.rows',
        minVisibleMs: -1,
      })
    ).toThrow('Loading state minimum-visible duration must be greater than or equal to 0 ms.');
  });

  it('creates normalized skeleton view contracts with defaults', () => {
    const view = createSkeletonViewContract({
      viewKey: ' table.rows ',
    });

    expect(view.viewKey).toBe('table.rows');
    expect(view.variant).toBe('text');
    expect(view.lineCount).toBe(3);
    expect(view.animated).toBe(true);
    expect(view.density).toBe('comfortable');
  });

  it('supports explicit skeleton variant conventions', () => {
    const view = createSkeletonViewContract({
      viewKey: 'dashboard.chart',
      variant: 'chart',
      lineCount: 1,
      animated: false,
      density: 'compact',
    });

    expect(view.variant).toBe('chart');
    expect(view.lineCount).toBe(1);
    expect(view.animated).toBe(false);
    expect(view.density).toBe('compact');
  });

  it('rejects invalid skeleton view key and line count', () => {
    expect(() =>
      createSkeletonViewContract({
        viewKey: ' ',
      })
    ).toThrow('Skeleton view contract key must be non-empty.');

    expect(() =>
      createSkeletonViewContract({
        viewKey: 'table.rows',
        lineCount: 0,
      })
    ).toThrow('Skeleton line count must be an integer greater than or equal to 1.');
  });

  it('resolves loading-state and skeleton mappings through registry', () => {
    const registry = createLoadingStateRegistry({
      loadingStates: [
        createLoadingStateContract({
          stateKey: 'users.table',
          skeletonViewKey: 'table.rows',
        }),
      ],
      skeletonViews: [
        createSkeletonViewContract({
          viewKey: 'table.rows',
          variant: 'table-row',
          lineCount: 5,
        }),
      ],
    });

    expect(registry.hasLoadingState('users.table')).toBe(true);
    expect(registry.hasSkeletonView('table.rows')).toBe(true);
    expect(registry.listLoadingStateKeys()).toEqual(['users.table']);
    expect(registry.listSkeletonViewKeys()).toEqual(['table.rows']);

    const result = registry.resolveSkeleton('users.table');
    expect(result.resolved).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.loadingState?.stateKey).toBe('users.table');
    expect(result.skeletonView?.viewKey).toBe('table.rows');
  });

  it('returns reason metadata for missing loading state', () => {
    const registry = createLoadingStateRegistry({
      loadingStates: [],
      skeletonViews: [],
    });

    const result = registry.resolveSkeleton('missing.state');
    expect(result.resolved).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['loading-state-not-registered']);
  });

  it('returns reason metadata for missing skeleton view', () => {
    const registry = createLoadingStateRegistry({
      loadingStates: [
        createLoadingStateContract({
          stateKey: 'users.table',
          skeletonViewKey: 'table.rows',
        }),
      ],
      skeletonViews: [],
    });

    const result = registry.resolveSkeleton('users.table');
    expect(result.resolved).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['skeleton-view-not-registered']);
  });

  it('returns sorted key lists when multiple entries exist', () => {
    const registry = createLoadingStateRegistry({
      loadingStates: [
        createLoadingStateContract({
          stateKey: 'z.state',
          skeletonViewKey: 'z.view',
        }),
        createLoadingStateContract({
          stateKey: 'a.state',
          skeletonViewKey: 'a.view',
        }),
      ],
      skeletonViews: [
        createSkeletonViewContract({
          viewKey: 'z.view',
        }),
        createSkeletonViewContract({
          viewKey: 'a.view',
        }),
      ],
    });

    expect(registry.listLoadingStateKeys()).toEqual(['a.state', 'z.state']);
    expect(registry.listSkeletonViewKeys()).toEqual(['a.view', 'z.view']);
  });

  it('derives hidden skeleton presentation when not loading', () => {
    const contract = createLoadingStateContract({
      stateKey: 'users.table',
      skeletonViewKey: 'table.rows',
    });

    const presentation = deriveLoadingStatePresentation({
      contract,
      status: 'success',
      isFetching: false,
      elapsedLoadingMs: 1000,
      hasPreviousContent: true,
    });

    expect(presentation).toEqual({
      showSkeleton: false,
      usePreviousContent: false,
      announceLoading: false,
    });
  });

  it('preserves previous content before skeleton show threshold', () => {
    const contract = createLoadingStateContract({
      stateKey: 'users.table',
      skeletonViewKey: 'table.rows',
      showAfterMs: 200,
      preservePreviousContent: true,
      announceLoading: true,
    });

    const presentation = deriveLoadingStatePresentation({
      contract,
      status: 'loading',
      isFetching: true,
      elapsedLoadingMs: 150,
      hasPreviousContent: true,
    });

    expect(presentation).toEqual({
      showSkeleton: false,
      usePreviousContent: true,
      announceLoading: false,
    });
  });

  it('shows and announces skeleton once loading threshold is reached', () => {
    const contract = createLoadingStateContract({
      stateKey: 'users.table',
      skeletonViewKey: 'table.rows',
      showAfterMs: 200,
      preservePreviousContent: true,
      announceLoading: true,
    });

    const presentation = deriveLoadingStatePresentation({
      contract,
      status: 'loading',
      isFetching: true,
      elapsedLoadingMs: -10,
      hasPreviousContent: true,
    });

    expect(presentation.showSkeleton).toBe(false);

    const shown = deriveLoadingStatePresentation({
      contract,
      status: 'loading',
      isFetching: true,
      elapsedLoadingMs: 250,
      hasPreviousContent: true,
    });

    expect(shown).toEqual({
      showSkeleton: true,
      usePreviousContent: false,
      announceLoading: true,
    });
  });
});
