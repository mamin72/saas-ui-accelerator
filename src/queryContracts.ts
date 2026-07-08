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

export interface OfflineQueueItem<TPayload = unknown> {
  id: string;
  key: string;
  payload: TPayload;
  enqueuedAtEpochMs: number;
  attempts: number;
}

export interface OfflineQueue<TPayload = unknown> {
  enqueue(
    item: Omit<OfflineQueueItem<TPayload>, 'id' | 'enqueuedAtEpochMs' | 'attempts'> & {
      attempts?: number;
      enqueuedAtEpochMs?: number;
    }
  ): OfflineQueueItem<TPayload>;
  peek(): OfflineQueueItem<TPayload> | undefined;
  dequeue(): OfflineQueueItem<TPayload> | undefined;
  size(): number;
  clear(): void;
  list(): readonly OfflineQueueItem<TPayload>[];
}

export type MutationLifecycleStatus = 'idle' | 'pending' | 'committed' | 'rolled-back' | 'failed';

export type MutationLifecycleEventType =
  | 'optimistic-applied'
  | 'committed'
  | 'rolled-back'
  | 'retry'
  | 'failed';

export interface MutationLifecycleState<TValue = unknown, TError = unknown> {
  key: string;
  status: MutationLifecycleStatus;
  attempt: number;
  optimisticValue?: TValue;
  committedValue?: TValue;
  error?: TError;
  updatedAtEpochMs: number;
}

export interface MutationLifecycleEvent<TValue = unknown, TError = unknown> {
  type: MutationLifecycleEventType;
  key: string;
  state: MutationLifecycleState<TValue, TError>;
  atEpochMs: number;
}

export interface MutationLifecycle<TValue = unknown, TError = unknown> {
  getState(): MutationLifecycleState<TValue, TError>;
  listEvents(): readonly MutationLifecycleEvent<TValue, TError>[];
  subscribe(
    listener: (event: MutationLifecycleEvent<TValue, TError>) => void
  ): () => void;
  applyOptimistic(value: TValue): MutationLifecycleState<TValue, TError>;
  commit(value: TValue): MutationLifecycleState<TValue, TError>;
  rollback(error?: TError): MutationLifecycleState<TValue, TError>;
  retry(): MutationLifecycleState<TValue, TError>;
  fail(error: TError): MutationLifecycleState<TValue, TError>;
  reset(): MutationLifecycleState<TValue, TError>;
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

export function createOfflineQueue<TPayload = unknown>(options?: {
  nowEpochMs?: () => number;
  idFactory?: () => string;
}): OfflineQueue<TPayload> {
  const nowEpochMs = options?.nowEpochMs ?? (() => Date.now());
  const idFactory = options?.idFactory ?? (() => `${nowEpochMs()}-${Math.random().toString(36).slice(2, 8)}`);
  const queue: OfflineQueueItem<TPayload>[] = [];

  return {
    enqueue(item): OfflineQueueItem<TPayload> {
      const next: OfflineQueueItem<TPayload> = {
        id: idFactory(),
        key: item.key,
        payload: item.payload,
        enqueuedAtEpochMs: item.enqueuedAtEpochMs ?? nowEpochMs(),
        attempts: item.attempts ?? 0,
      };

      queue.push(next);
      return next;
    },
    peek(): OfflineQueueItem<TPayload> | undefined {
      return queue[0];
    },
    dequeue(): OfflineQueueItem<TPayload> | undefined {
      return queue.shift();
    },
    size(): number {
      return queue.length;
    },
    clear(): void {
      queue.length = 0;
    },
    list(): readonly OfflineQueueItem<TPayload>[] {
      return [...queue];
    },
  };
}

export async function replayOfflineQueue<TPayload = unknown>(input: {
  queue: OfflineQueue<TPayload>;
  process: (item: OfflineQueueItem<TPayload>) => Promise<void>;
  onRequeue?: (item: OfflineQueueItem<TPayload>, error: unknown) => void;
}): Promise<{ processed: number; failed: number; remaining: number }> {
  let processed = 0;
  let failed = 0;
  const initialQueueSize = input.queue.size();

  for (let index = 0; index < initialQueueSize; index += 1) {
    const item = input.queue.dequeue();
    if (!item) {
      break;
    }

    try {
      await input.process(item);
      processed += 1;
    } catch (error) {
      failed += 1;

      const retryItem: OfflineQueueItem<TPayload> = {
        ...item,
        attempts: item.attempts + 1,
      };

      input.queue.enqueue({
        key: retryItem.key,
        payload: retryItem.payload,
        attempts: retryItem.attempts,
        enqueuedAtEpochMs: retryItem.enqueuedAtEpochMs,
      });

      input.onRequeue?.(retryItem, error);
    }
  }

  return {
    processed,
    failed,
    remaining: input.queue.size(),
  };
}

export function createMutationLifecycle<TValue = unknown, TError = unknown>(input: {
  key: string;
  nowEpochMs?: () => number;
  maxEvents?: number;
}): MutationLifecycle<TValue, TError> {
  const key = input.key.trim();
  if (key.length === 0) {
    throw new Error('Mutation lifecycle key must be non-empty.');
  }

  const nowEpochMs = input.nowEpochMs ?? (() => Date.now());
  const maxEvents = input.maxEvents ?? 100;
  const listeners = new Set<(event: MutationLifecycleEvent<TValue, TError>) => void>();
  const events: MutationLifecycleEvent<TValue, TError>[] = [];

  let state: MutationLifecycleState<TValue, TError> = {
    key,
    status: 'idle',
    attempt: 0,
    updatedAtEpochMs: nowEpochMs(),
  };

  const emit = (type: MutationLifecycleEventType): void => {
    const event: MutationLifecycleEvent<TValue, TError> = {
      type,
      key,
      state: { ...state },
      atEpochMs: state.updatedAtEpochMs,
    };

    events.push(event);
    if (events.length > maxEvents) {
      events.splice(0, events.length - maxEvents);
    }

    for (const listener of listeners) {
      listener(event);
    }
  };

  return {
    getState(): MutationLifecycleState<TValue, TError> {
      return { ...state };
    },
    listEvents(): readonly MutationLifecycleEvent<TValue, TError>[] {
      return events.map((event) => ({ ...event, state: { ...event.state } }));
    },
    subscribe(listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    applyOptimistic(value: TValue): MutationLifecycleState<TValue, TError> {
      state = {
        key,
        status: 'pending',
        attempt: state.attempt + 1,
        optimisticValue: value,
        committedValue: state.committedValue,
        updatedAtEpochMs: nowEpochMs(),
      };

      emit('optimistic-applied');
      return { ...state };
    },
    commit(value: TValue): MutationLifecycleState<TValue, TError> {
      state = {
        ...state,
        status: 'committed',
        committedValue: value,
        error: undefined,
        updatedAtEpochMs: nowEpochMs(),
      };

      emit('committed');
      return { ...state };
    },
    rollback(error?: TError): MutationLifecycleState<TValue, TError> {
      state = {
        ...state,
        status: 'rolled-back',
        error,
        updatedAtEpochMs: nowEpochMs(),
      };

      emit('rolled-back');
      return { ...state };
    },
    retry(): MutationLifecycleState<TValue, TError> {
      state = {
        ...state,
        status: 'pending',
        attempt: state.attempt + 1,
        error: undefined,
        updatedAtEpochMs: nowEpochMs(),
      };

      emit('retry');
      return { ...state };
    },
    fail(error: TError): MutationLifecycleState<TValue, TError> {
      state = {
        ...state,
        status: 'failed',
        error,
        updatedAtEpochMs: nowEpochMs(),
      };

      emit('failed');
      return { ...state };
    },
    reset(): MutationLifecycleState<TValue, TError> {
      state = {
        key,
        status: 'idle',
        attempt: 0,
        updatedAtEpochMs: nowEpochMs(),
      };

      return { ...state };
    },
  };
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
