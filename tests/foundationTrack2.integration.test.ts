import { describe, expect, it } from 'vitest';
import {
  applyOptimisticCacheUpdate,
  commitOptimisticCacheUpdate,
  createInMemoryCacheAdapter,
  createMutationLifecycle,
  createOfflineQueue,
  createQueryCacheKey,
  createQueryHookContract,
  replayOfflineQueue,
  rollbackOptimisticCacheUpdate,
} from '../src/index';

describe('foundation track 2 integration', () => {
  it('orchestrates query contract with cache storage', async () => {
    const usersContract = createQueryHookContract<{ page: number }, Array<{ id: string }>>({
      key: 'users.list',
      run: (request) =>
        Promise.resolve({
          data: [{ id: `u-${request.params.page}` }],
          receivedAtUtc: new Date(0).toISOString(),
        }),
    });

    const cache = createInMemoryCacheAdapter<Array<{ id: string }>>();
    const cacheKey = createQueryCacheKey(usersContract.key, { page: 1 });

    const response = await usersContract.run({
      key: usersContract.key,
      params: { page: 1 },
    });

    cache.set(cacheKey, {
      value: response.data,
      createdAtEpochMs: 123,
    });

    expect(cache.get(cacheKey)?.value).toEqual([{ id: 'u-1' }]);
    expect(usersContract.createInitialState().status).toBe('idle');
  });

  it('coordinates optimistic mutation lifecycle with offline queue replay', async () => {
    const cache = createInMemoryCacheAdapter<{ status: string }>();
    const mutationKey = createQueryCacheKey('users.update', { id: 'u1' });

    cache.set(mutationKey, {
      value: { status: 'idle' },
      createdAtEpochMs: 100,
    });

    const lifecycle = createMutationLifecycle<{ status: string }, string>({
      key: mutationKey,
      nowEpochMs: (() => {
        let now = 1000;
        return () => {
          now += 10;
          return now;
        };
      })(),
    });

    const firstSession = applyOptimisticCacheUpdate(cache, mutationKey, { status: 'saving' }, { nowEpochMs: 110 });
    lifecycle.applyOptimistic({ status: 'saving' });

    const queue = createOfflineQueue<{ id: string; status: string }>({
      nowEpochMs: () => 200,
      idFactory: (() => {
        let next = 0;
        return () => `job-${next++}`;
      })(),
    });

    queue.enqueue({
      key: mutationKey,
      payload: { id: 'u1', status: 'saved' },
    });

    lifecycle.rollback('offline');
    rollbackOptimisticCacheUpdate(cache, firstSession);

    expect(cache.get(mutationKey)?.value).toEqual({ status: 'idle' });
    expect(lifecycle.getState().status).toBe('rolled-back');

    const retrySession = applyOptimisticCacheUpdate(cache, mutationKey, { status: 'saving' }, { nowEpochMs: 120 });
    lifecycle.retry();

    const replayResult = await replayOfflineQueue({
      queue,
      process: (item) => {
        commitOptimisticCacheUpdate(
          cache,
          retrySession,
          { status: item.payload.status },
          { nowEpochMs: 130 }
        );

        lifecycle.commit({ status: item.payload.status });
        return Promise.resolve();
      },
    });

    expect(replayResult).toEqual({ processed: 1, failed: 0, remaining: 0 });
    expect(cache.get(mutationKey)?.value).toEqual({ status: 'saved' });

    const lifecycleEventTypes = lifecycle.listEvents().map((event) => event.type);
    expect(lifecycleEventTypes).toEqual(['optimistic-applied', 'rolled-back', 'retry', 'committed']);
    expect(lifecycle.getState().status).toBe('committed');
  });
});
