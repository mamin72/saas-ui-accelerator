export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryRequest<TParams = unknown> {
  key: string;
  params: TParams;
  signal?: AbortSignal;
}

export interface QueryResponse<TData = unknown> {
  data: TData;
  receivedAtUtc: string;
}

export interface QueryState<TData = unknown, TError = unknown> {
  status: QueryStatus;
  data?: TData;
  error?: TError;
  updatedAtEpochMs?: number;
}

export interface QueryHookOptions {
  enabled?: boolean;
  staleTimeMs?: number;
  cacheTimeMs?: number;
}

export interface QueryHookContract<TParams, TData, TError = unknown> {
  readonly key: string;
  run(request: QueryRequest<TParams>): Promise<QueryResponse<TData>>;
  createInitialState(): QueryState<TData, TError>;
}

export interface CacheEntry<TValue = unknown> {
  value: TValue;
  createdAtEpochMs: number;
  expiresAtEpochMs?: number;
}

export interface CacheAdapter<TValue = unknown> {
  get(key: string): CacheEntry<TValue> | undefined;
  set(key: string, entry: CacheEntry<TValue>): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  keys(): readonly string[];
}

export interface OptimisticUpdateSession<TValue = unknown> {
  key: string;
  previousEntry?: CacheEntry<TValue>;
  optimisticEntry: CacheEntry<TValue>;
}

export function createInMemoryCacheAdapter<TValue = unknown>(): CacheAdapter<TValue> {
  const storage = new Map<string, CacheEntry<TValue>>();

  return {
    get(key: string): CacheEntry<TValue> | undefined {
      const entry = storage.get(key);
      if (!entry) {
        return undefined;
      }

      if (entry.expiresAtEpochMs != null && Date.now() > entry.expiresAtEpochMs) {
        storage.delete(key);
        return undefined;
      }

      return entry;
    },
    set(key: string, entry: CacheEntry<TValue>): void {
      storage.set(key, entry);
    },
    has(key: string): boolean {
      return this.get(key) != null;
    },
    delete(key: string): boolean {
      return storage.delete(key);
    },
    clear(): void {
      storage.clear();
    },
    keys(): readonly string[] {
      return Array.from(storage.keys()).sort((a, b) => a.localeCompare(b));
    },
  };
}

export function createQueryCacheKey(resource: string, params?: unknown): string {
  const normalizedResource = resource.trim();

  if (normalizedResource.length === 0) {
    throw new Error('Query resource name must be non-empty.');
  }

  const serializedParams = params == null ? 'null' : stableSerialize(params);
  return `${normalizedResource}::${serializedParams}`;
}

export function createQueryHookContract<TParams, TData, TError = unknown>(input: {
  key: string;
  run: (request: QueryRequest<TParams>) => Promise<QueryResponse<TData>>;
  createInitialState?: () => QueryState<TData, TError>;
}): QueryHookContract<TParams, TData, TError> {
  if (input.key.trim().length === 0) {
    throw new Error('Query hook contract key must be non-empty.');
  }

  return {
    key: input.key,
    run: input.run,
    createInitialState: input.createInitialState ?? (() => ({ status: 'idle' })),
  };
}

export function applyOptimisticCacheUpdate<TValue>(
  cache: CacheAdapter<TValue>,
  key: string,
  optimisticValue: TValue,
  options?: {
    optimisticExpiresAtEpochMs?: number;
    nowEpochMs?: number;
  }
): OptimisticUpdateSession<TValue> {
  const previousEntry = cache.get(key);
  const createdAtEpochMs = options?.nowEpochMs ?? Date.now();

  const optimisticEntry: CacheEntry<TValue> = {
    value: optimisticValue,
    createdAtEpochMs,
    expiresAtEpochMs: options?.optimisticExpiresAtEpochMs,
  };

  cache.set(key, optimisticEntry);

  return {
    key,
    previousEntry,
    optimisticEntry,
  };
}

export function commitOptimisticCacheUpdate<TValue>(
  cache: CacheAdapter<TValue>,
  session: OptimisticUpdateSession<TValue>,
  committedValue: TValue,
  options?: {
    committedExpiresAtEpochMs?: number;
    nowEpochMs?: number;
  }
): CacheEntry<TValue> {
  const committedEntry: CacheEntry<TValue> = {
    value: committedValue,
    createdAtEpochMs: options?.nowEpochMs ?? Date.now(),
    expiresAtEpochMs: options?.committedExpiresAtEpochMs,
  };

  cache.set(session.key, committedEntry);
  return committedEntry;
}

export function rollbackOptimisticCacheUpdate<TValue>(
  cache: CacheAdapter<TValue>,
  session: OptimisticUpdateSession<TValue>
): void {
  if (session.previousEntry) {
    cache.set(session.key, session.previousEntry);
    return;
  }

  cache.delete(session.key);
}

function stableSerialize(value: unknown): string {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);

  return `{${entries.join(',')}}`;
}
