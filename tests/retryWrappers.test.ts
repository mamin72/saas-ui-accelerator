import { describe, expect, it } from 'vitest';
import {
  calculateRetryDelayMs,
  createRetryPolicyContract,
  executeWithRetry,
  isRetryableError,
} from '../src/index';

type RetryTestError = Error & {
  code?: string;
  statusCode?: number;
  response?: {
    status?: number;
  };
};

function createRetryError(input: {
  name?: string;
  code?: string;
  statusCode?: number;
  responseStatus?: number;
}): RetryTestError {
  const error = new Error('retry test error') as RetryTestError;

  if (input.name) {
    error.name = input.name;
  }

  if (input.code) {
    error.code = input.code;
  }

  if (input.statusCode != null) {
    error.statusCode = input.statusCode;
  }

  if (input.responseStatus != null) {
    error.response = {
      status: input.responseStatus,
    };
  }

  return error;
}

describe('retry wrappers', () => {
  it('creates normalized retry policy contracts with defaults', () => {
    const policy = createRetryPolicyContract({
      policyKey: ' http-policy ',
      retryableErrorTypes: ['TimeoutError', 'TimeoutError', ' '],
      retryableStatusCodes: [429, 429, 503],
    });

    expect(policy.policyKey).toBe('http-policy');
    expect(policy.maxAttempts).toBe(3);
    expect(policy.initialDelayMs).toBe(200);
    expect(policy.maxDelayMs).toBe(5000);
    expect(policy.backoff).toBe('exponential');
    expect(policy.jitterRatio).toBe(0);
    expect(policy.retryableErrorTypes).toEqual(['TimeoutError']);
    expect(policy.retryableStatusCodes).toEqual([429, 503]);
  });

  it('rejects invalid retry policy key and attempts', () => {
    expect(() => createRetryPolicyContract({ policyKey: ' ' })).toThrow('Retry policy key must be non-empty.');

    expect(() =>
      createRetryPolicyContract({
        policyKey: 'x',
        maxAttempts: 0,
      })
    ).toThrow('Retry policy max attempts must be an integer greater than or equal to 1.');
  });

  it('rejects invalid delay and jitter configuration', () => {
    expect(() =>
      createRetryPolicyContract({
        policyKey: 'x',
        initialDelayMs: -1,
      })
    ).toThrow('Retry policy initial delay must be greater than or equal to 0 ms.');

    expect(() =>
      createRetryPolicyContract({
        policyKey: 'x',
        initialDelayMs: 10,
        maxDelayMs: 5,
      })
    ).toThrow('Retry policy max delay must be greater than or equal to initial delay.');

    expect(() =>
      createRetryPolicyContract({
        policyKey: 'x',
        jitterRatio: 2,
      })
    ).toThrow('Retry policy jitter ratio must be between 0 and 1.');
  });

  it('normalizes retryable status code list to valid unique HTTP codes', () => {
    const policy = createRetryPolicyContract({
      policyKey: 'status-policy',
      retryableStatusCodes: [99, 200, 200, 700, 503],
    });

    expect(policy.retryableStatusCodes).toEqual([200, 503]);
  });

  it('calculates fixed and exponential delays with and without jitter', () => {
    const fixedPolicy = createRetryPolicyContract({
      policyKey: 'fixed',
      backoff: 'fixed',
      initialDelayMs: 100,
      maxDelayMs: 200,
    });

    const exponentialPolicy = createRetryPolicyContract({
      policyKey: 'exp',
      backoff: 'exponential',
      initialDelayMs: 100,
      maxDelayMs: 250,
      jitterRatio: 0.2,
    });

    expect(calculateRetryDelayMs(fixedPolicy, 1)).toBe(100);
    expect(calculateRetryDelayMs(exponentialPolicy, 1, 1)).toBe(120);
    expect(calculateRetryDelayMs(exponentialPolicy, 2, 0)).toBe(160);
    expect(calculateRetryDelayMs(exponentialPolicy, 3, 0.5)).toBe(250);
    expect(calculateRetryDelayMs(exponentialPolicy, 1, -1)).toBe(80);
  });

  it('rejects invalid failed attempt when calculating retry delay', () => {
    const policy = createRetryPolicyContract({ policyKey: 'delay' });
    expect(() => calculateRetryDelayMs(policy, 0)).toThrow(
      'Failed attempt must be an integer greater than or equal to 1.'
    );
  });

  it('treats all errors as retryable when no filters are configured', () => {
    const policy = createRetryPolicyContract({ policyKey: 'all-errors' });
    expect(isRetryableError(policy, new Error('random'))).toBe(true);
    expect(isRetryableError(policy, { statusCode: 500 })).toBe(true);
  });

  it('supports retryable error matching by type and status', () => {
    const policy = createRetryPolicyContract({
      policyKey: 'typed',
      retryableErrorTypes: ['TimeoutError'],
      retryableStatusCodes: [429],
    });

    expect(isRetryableError(policy, { name: 'TimeoutError' })).toBe(true);
    expect(isRetryableError(policy, { response: { status: 429 } })).toBe(true);
    expect(
      isRetryableError(
        policy,
        createRetryError({
          code: 'EAGAIN',
        })
      )
    ).toBe(false);

    const codeOnlyPolicy = createRetryPolicyContract({
      policyKey: 'code-only',
      retryableErrorTypes: ['EAGAIN'],
    });

    expect(
      isRetryableError(
        codeOnlyPolicy,
        createRetryError({
          name: 'IgnoredName',
          code: 'EAGAIN',
        })
      )
    ).toBe(false);

    expect(
      isRetryableError(
        codeOnlyPolicy,
        {
          code: 'EAGAIN',
        }
      )
    ).toBe(true);

    expect(isRetryableError(codeOnlyPolicy, null)).toBe(false);
    expect(isRetryableError(codeOnlyPolicy, 123)).toBe(false);
  });

  it('executes retry wrapper until success with captured events', async () => {
    const policy = createRetryPolicyContract({
      policyKey: 'network',
      maxAttempts: 4,
      initialDelayMs: 25,
      maxDelayMs: 100,
      backoff: 'fixed',
      retryableErrorTypes: ['TimeoutError'],
    });

    const delays: number[] = [];
    let callCount = 0;

    const result = await executeWithRetry(
      () => {
        callCount += 1;
        if (callCount < 3) {
          throw createRetryError({
            name: 'TimeoutError',
          });
        }

        return Promise.resolve('ok');
      },
      policy,
      {
        sleep: (delayMs) => {
          delays.push(delayMs);
          return Promise.resolve();
        },
        random: () => 0.5,
      }
    );

    expect(result.success).toBe(true);
    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(3);
    expect(result.events).toHaveLength(2);
    expect(delays).toEqual([25, 25]);
  });

  it('stops immediately when error is not retryable', async () => {
    const policy = createRetryPolicyContract({
      policyKey: 'strict',
      maxAttempts: 3,
      retryableErrorTypes: ['TimeoutError'],
    });

    const result = await executeWithRetry(
      () => {
        throw createRetryError({
          name: 'ValidationError',
        });
      },
      policy,
      {
        sleep: () => {
          throw new Error('sleep should not be called for non-retryable errors');
        },
      }
    );

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.events).toEqual([]);
  });

  it('returns final failure after max attempts are exhausted', async () => {
    const policy = createRetryPolicyContract({
      policyKey: 'exhausted',
      maxAttempts: 2,
      initialDelayMs: 10,
      maxDelayMs: 10,
      retryableStatusCodes: [503],
    });

    const delays: number[] = [];
    const result = await executeWithRetry(
      () => {
        throw createRetryError({
          responseStatus: 503,
        });
      },
      policy,
      {
        sleep: (delayMs) => {
          delays.push(delayMs);
          return Promise.resolve();
        },
      }
    );

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(2);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.statusCode).toBe(503);
    expect(delays).toEqual([10]);
  });

  it('supports direct statusCode matching and non-integer status rejection', () => {
    const policy = createRetryPolicyContract({
      policyKey: 'status-only',
      retryableStatusCodes: [500],
    });

    expect(
      isRetryableError(
        policy,
        createRetryError({
          statusCode: 500,
        })
      )
    ).toBe(true);

    expect(
      isRetryableError(
        policy,
        {
          statusCode: 500.5,
        }
      )
    ).toBe(false);
  });

  it('uses built-in retry sleep when no sleep override is provided', async () => {
    const policy = createRetryPolicyContract({
      policyKey: 'default-sleep',
      maxAttempts: 2,
      initialDelayMs: 0,
      maxDelayMs: 0,
      retryableErrorTypes: ['TimeoutError'],
    });

    let callCount = 0;
    const result = await executeWithRetry(
      () => {
        callCount += 1;

        if (callCount === 1) {
          throw createRetryError({
            name: 'TimeoutError',
          });
        }

        return Promise.resolve('done');
      },
      policy,
      {
        random: () => 0.5,
      }
    );

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
    expect(result.events).toHaveLength(1);
  });
});
