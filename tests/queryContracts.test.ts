import { describe, expect, it } from 'vitest';
import {
  createInMemoryCacheAdapter,
  createQueryCacheKey,
  createQueryHookContract,
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
});
