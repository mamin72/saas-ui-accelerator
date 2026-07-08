import { describe, expect, it, vi } from 'vitest';
import {
  applyOptimisticCacheUpdate,
  commitOptimisticCacheUpdate,
  createOfflineQueue,
  createInMemoryCacheAdapter,
  createQueryCacheKey,
  createQueryHookContract,
  replayOfflineQueue,
  rollbackOptimisticCacheUpdate,
} from '../src/index';

describe('query contracts', () => {
  it('creates deterministic cache keys for object params', () => {
    const keyA = createQueryCacheKey('users.list', {
      page: 1,
      filters: {
        role: 'admin',
        active: true,
      },
    });

    const keyB = createQueryCacheKey('users.list', {
      filters: {
        active: true,
        role: 'admin',
      },
      page: 1,
    });

    expect(keyA).toBe(keyB);
  });

  it('throws when resource name is empty', () => {
    expect(() => createQueryCacheKey('   ', { id: 1 })).toThrow(
      'Query resource name must be non-empty.'
    );
  });

  it('supports null and array params when generating keys', () => {
    expect(createQueryCacheKey('users.list', null)).toBe('users.list::null');

    const withArray = createQueryCacheKey('users.list', {
      ids: [3, 1, 2],
      include: ['roles', 'permissions'],
    });

    expect(withArray).toContain('"ids":[3,1,2]');
    expect(withArray).toContain('"include":["roles","permissions"]');
  });

  it('supports cache adapter set/get/has/delete/clear boundaries', () => {
    const cache = createInMemoryCacheAdapter<number>();

    cache.set('counter', {
      value: 1,
      createdAtEpochMs: Date.now(),
    });

    expect(cache.has('counter')).toBe(true);
    expect(cache.get('counter')?.value).toBe(1);

    expect(cache.delete('counter')).toBe(true);
    expect(cache.get('counter')).toBeUndefined();
    expect(cache.delete('counter')).toBe(false);

    cache.set('a', { value: 10, createdAtEpochMs: Date.now() });
    cache.set('b', { value: 20, createdAtEpochMs: Date.now() });
    expect(cache.keys()).toEqual(['a', 'b']);

    cache.clear();
    expect(cache.keys()).toEqual([]);
  });

  it('evicts expired cache entries on read', () => {
    const cache = createInMemoryCacheAdapter<string>();

    cache.set('expired', {
      value: 'stale',
      createdAtEpochMs: Date.now() - 1000,
      expiresAtEpochMs: Date.now() - 1,
    });

    expect(cache.get('expired')).toBeUndefined();
    expect(cache.has('expired')).toBe(false);
  });

  it('creates query hook contracts with default and custom initial states', async () => {
    const defaultContract = createQueryHookContract({
      key: 'users.list',
      run: (request: { key: string; params: { page: number } }) =>
        Promise.resolve({
          data: [{ id: 'u1', page: request.params.page }],
          receivedAtUtc: new Date(0).toISOString(),
        }),
    });

    expect(defaultContract.createInitialState()).toEqual({ status: 'idle' });

    const response = await defaultContract.run({
      key: 'users.list',
      params: { page: 2 },
    });

    expect(response.data).toEqual([{ id: 'u1', page: 2 }]);

    const customContract = createQueryHookContract({
      key: 'users.byId',
      run: () =>
        Promise.resolve({
          data: { id: 'u1' },
          receivedAtUtc: new Date(0).toISOString(),
        }),
      createInitialState: () => ({ status: 'loading' as const }),
    });

    expect(customContract.createInitialState()).toEqual({ status: 'loading' });
  });

  it('rejects empty hook contract keys', () => {
    expect(() =>
      createQueryHookContract({
        key: '   ',
        run: () =>
          Promise.resolve({
            data: { ok: true },
            receivedAtUtc: new Date(0).toISOString(),
          }),
      })
    ).toThrow('Query hook contract key must be non-empty.');
  });

  it('applies and commits optimistic cache updates', () => {
    const cache = createInMemoryCacheAdapter<{ count: number }>();

    cache.set('counter', {
      value: { count: 1 },
      createdAtEpochMs: 10,
    });

    const session = applyOptimisticCacheUpdate(cache, 'counter', { count: 2 }, { nowEpochMs: 20 });

    expect(session.previousEntry?.value).toEqual({ count: 1 });
    expect(cache.get('counter')?.value).toEqual({ count: 2 });

    const committed = commitOptimisticCacheUpdate(cache, session, { count: 3 }, { nowEpochMs: 30 });

    expect(committed.value).toEqual({ count: 3 });
    expect(cache.get('counter')?.value).toEqual({ count: 3 });
  });

  it('rolls back optimistic updates to previous cache snapshots', () => {
    const cache = createInMemoryCacheAdapter<{ status: string }>();

    cache.set('mutation', {
      value: { status: 'original' },
      createdAtEpochMs: 100,
    });

    const session = applyOptimisticCacheUpdate(cache, 'mutation', { status: 'optimistic' }, { nowEpochMs: 110 });
    expect(cache.get('mutation')?.value).toEqual({ status: 'optimistic' });

    rollbackOptimisticCacheUpdate(cache, session);
    expect(cache.get('mutation')?.value).toEqual({ status: 'original' });
  });

  it('deletes cache entries on rollback when no previous snapshot exists', () => {
    const cache = createInMemoryCacheAdapter<{ status: string }>();

    const session = applyOptimisticCacheUpdate(cache, 'new-mutation', { status: 'optimistic' }, { nowEpochMs: 1 });
    expect(cache.has('new-mutation')).toBe(true);

    rollbackOptimisticCacheUpdate(cache, session);
    expect(cache.has('new-mutation')).toBe(false);
  });

  it('uses Date.now defaults when optimistic lifecycle options are omitted', () => {
    const cache = createInMemoryCacheAdapter<{ status: string }>();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(777);

    try {
      const session = applyOptimisticCacheUpdate(cache, 'default-clock', { status: 'optimistic' });
      expect(session.optimisticEntry.createdAtEpochMs).toBe(777);
      expect(session.optimisticEntry.expiresAtEpochMs).toBeUndefined();

      const committed = commitOptimisticCacheUpdate(cache, session, { status: 'committed' });
      expect(committed.createdAtEpochMs).toBe(777);
      expect(committed.expiresAtEpochMs).toBeUndefined();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('supports explicit expiry configuration for optimistic and committed entries', () => {
    const cache = createInMemoryCacheAdapter<{ status: string }>();

    const session = applyOptimisticCacheUpdate(
      cache,
      'expiring',
      { status: 'optimistic' },
      { nowEpochMs: 1000, optimisticExpiresAtEpochMs: 2000 }
    );

    expect(session.optimisticEntry.expiresAtEpochMs).toBe(2000);

    const committed = commitOptimisticCacheUpdate(
      cache,
      session,
      { status: 'committed' },
      { nowEpochMs: 1100, committedExpiresAtEpochMs: 3000 }
    );

    expect(committed.expiresAtEpochMs).toBe(3000);
  });

  it('supports offline queue ordering with enqueue/peek/dequeue semantics', () => {
    const queue = createOfflineQueue<{ action: string }>({
      nowEpochMs: () => 100,
      idFactory: () => 'id-fixed',
    });

    queue.enqueue({ key: 'k1', payload: { action: 'first' } });
    queue.enqueue({ key: 'k2', payload: { action: 'second' } });

    expect(queue.size()).toBe(2);
    expect(queue.peek()?.key).toBe('k1');
    expect(queue.list().map((item) => item.key)).toEqual(['k1', 'k2']);

    const first = queue.dequeue();
    expect(first?.key).toBe('k1');
    expect(queue.peek()?.key).toBe('k2');

    queue.clear();
    expect(queue.size()).toBe(0);
  });

  it('replays offline queue in order and reports processed counts', async () => {
    const queue = createOfflineQueue<{ value: number }>({
      nowEpochMs: () => 200,
      idFactory: (() => {
        let next = 0;
        return () => `id-${next++}`;
      })(),
    });

    queue.enqueue({ key: 'a', payload: { value: 1 } });
    queue.enqueue({ key: 'b', payload: { value: 2 } });

    const observed: string[] = [];

    const result = await replayOfflineQueue({
      queue,
      process: (item) => {
        observed.push(item.key);
        return Promise.resolve();
      },
    });

    expect(observed).toEqual(['a', 'b']);
    expect(result).toEqual({ processed: 2, failed: 0, remaining: 0 });
  });

  it('requeues failed offline queue items with incremented attempts', async () => {
    const queue = createOfflineQueue<{ value: number }>({
      nowEpochMs: () => 300,
      idFactory: (() => {
        let next = 0;
        return () => `retry-${next++}`;
      })(),
    });

    queue.enqueue({ key: 'retry-key', payload: { value: 7 } });

    const requeues: number[] = [];

    const result = await replayOfflineQueue({
      queue,
      process: () => Promise.reject(new Error('offline')),
      onRequeue: (item) => {
        requeues.push(item.attempts);
      },
    });

    expect(result.processed).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(1);
    expect(requeues).toEqual([1]);
    expect(queue.peek()?.attempts).toBe(1);
  });

  it('supports default offline queue factory options', () => {
    const queue = createOfflineQueue<{ ok: boolean }>();

    const item = queue.enqueue({ key: 'default', payload: { ok: true } });

    expect(item.id.length).toBeGreaterThan(0);
    expect(item.attempts).toBe(0);
    expect(item.enqueuedAtEpochMs).toBeGreaterThan(0);
    expect(queue.peek()?.key).toBe('default');
  });

  it('handles defensive replay path when dequeue returns undefined', async () => {
    const queue = {
      enqueue: () => ({
        id: 'x',
        key: 'x',
        payload: {},
        enqueuedAtEpochMs: 0,
        attempts: 0,
      }),
      peek: () => undefined,
      dequeue: () => undefined,
      size: () => 1,
      clear: () => undefined,
      list: () => [],
    };

    const result = await replayOfflineQueue({
      queue,
      process: () => Promise.resolve(),
    });

    expect(result).toEqual({ processed: 0, failed: 0, remaining: 1 });
  });
});
