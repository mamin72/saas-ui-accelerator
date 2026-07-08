import { describe, expect, it, vi } from 'vitest';
import {
  consumeAuthTokenLifecycle,
  createMagicLinkRequestContract,
  createPasswordRecoveryRequestContract,
  evaluateAuthTokenExpiry,
  executeRecoveryOrMagicLinkFlow,
  issueAuthTokenLifecycle,
} from '../src/index';

describe('auth recovery and magic-link workflows', () => {
  it('creates normalized password-recovery and magic-link request contracts', () => {
    const recovery = createPasswordRecoveryRequestContract({
      email: ' USER@Example.COM ',
      tenantId: ' tenant-1 ',
      redirectUri: 'https://example.com/reset',
      requestedAtUtc: '2026-01-01T00:00:00.000Z',
    });

    const magicLink = createMagicLinkRequestContract({
      email: 'member@example.com',
      requestedAtUtc: '2026-01-01T00:00:00.000Z',
    });

    expect(recovery.flow).toBe('password-recovery');
    expect(recovery.email).toBe('user@example.com');
    expect(recovery.tenantId).toBe('tenant-1');
    expect(magicLink.flow).toBe('magic-link');
    expect(magicLink.redirectUri).toBeUndefined();
  });

  it('rejects invalid recovery contract input', () => {
    expect(() =>
      createPasswordRecoveryRequestContract({
        email: 'invalid-email',
      })
    ).toThrow("Recovery request email 'invalid-email' is invalid.");

    expect(() =>
      createMagicLinkRequestContract({
        email: 'member@example.com',
        redirectUri: '/relative-path',
      })
    ).toThrow('Recovery request redirectUri must be an absolute http/https URL when provided.');
  });

  it('issues tokens, evaluates expiry windows, and validates timestamp ordering', () => {
    const token = issueAuthTokenLifecycle({
      subject: 'user-1',
      purpose: 'password-reset',
      ttlSeconds: 120,
      issuedAtUtc: '2026-01-01T00:00:00.000Z',
      tokenIdFactory: () => 'token-1',
    });

    const active = evaluateAuthTokenExpiry({
      issuedAtUtc: token.issuedAtUtc,
      expiresAtUtc: token.expiresAtUtc,
      nowUtc: '2026-01-01T00:01:00.000Z',
    });

    expect(token.tokenId).toBe('token-1');
    expect(active.expired).toBe(false);
    expect(active.expiresInSeconds).toBe(60);

    const expired = evaluateAuthTokenExpiry({
      issuedAtUtc: token.issuedAtUtc,
      expiresAtUtc: token.expiresAtUtc,
      nowUtc: token.expiresAtUtc,
    });

    expect(expired.expired).toBe(true);
    expect(expired.expiresInSeconds).toBe(0);

    expect(() =>
      evaluateAuthTokenExpiry({
        issuedAtUtc: '2026-01-01T00:01:00.000Z',
        expiresAtUtc: '2026-01-01T00:00:00.000Z',
      })
    ).toThrow('Token expiresAtUtc must be greater than or equal to issuedAtUtc.');

    expect(() =>
      issueAuthTokenLifecycle({
        subject: '  ',
        purpose: 'magic-link',
        ttlSeconds: 10,
      })
    ).toThrow('Token subject must be non-empty.');

    expect(() =>
      issueAuthTokenLifecycle({
        subject: 'user-default',
        purpose: 'magic-link',
        ttlSeconds: 0,
      })
    ).toThrow('Token ttlSeconds must be a positive integer.');

    const defaultToken = issueAuthTokenLifecycle({
      subject: 'user-default',
      purpose: 'magic-link',
      ttlSeconds: 10,
      issuedAtUtc: '2026-01-01T00:00:00.000Z',
    });

    expect(defaultToken.tokenId).toBe('magic-link-1767225600000');
  });

  it('consumes tokens and marks already-consumed or expired tokens as expired', () => {
    const token = issueAuthTokenLifecycle({
      subject: 'user-2',
      purpose: 'magic-link',
      ttlSeconds: 60,
      issuedAtUtc: '2026-01-01T00:00:00.000Z',
    });

    const consumed = consumeAuthTokenLifecycle({
      token,
      consumedAtUtc: '2026-01-01T00:00:30.000Z',
    });

    expect(consumed.consumedAtUtc).toBe('2026-01-01T00:00:30.000Z');
    expect(consumed.expired).toBe(false);

    const consumedAgain = consumeAuthTokenLifecycle({
      token: consumed,
      consumedAtUtc: '2026-01-01T00:00:40.000Z',
    });

    expect(consumedAgain.expired).toBe(true);

    const expiredConsume = consumeAuthTokenLifecycle({
      token,
      consumedAtUtc: '2026-01-01T00:02:00.000Z',
    });

    expect(expiredConsume.expired).toBe(true);
  });

  it('executes flow callbacks for delivered/consumed, expiry, and failure branches', async () => {
    const request = createPasswordRecoveryRequestContract({
      email: 'flow@example.com',
      requestedAtUtc: '2026-01-01T00:00:00.000Z',
    });

    const token = issueAuthTokenLifecycle({
      subject: request.email,
      purpose: 'password-reset',
      ttlSeconds: 120,
      issuedAtUtc: '2026-01-01T00:00:00.000Z',
      tokenIdFactory: () => 'flow-token',
    });

    const onRequested = vi.fn();
    const onDelivered = vi.fn();
    const onConsumed = vi.fn();
    const onExpired = vi.fn();

    const consumedResult = await executeRecoveryOrMagicLinkFlow({
      request,
      token,
      nowUtc: '2026-01-01T00:00:30.000Z',
      callbacks: { onRequested, onDelivered, onConsumed, onExpired },
    });

    expect(consumedResult.consumed).toBe(true);
    expect(consumedResult.expired).toBe(false);
    expect(onRequested).toHaveBeenCalledTimes(1);
    expect(onDelivered).toHaveBeenCalledTimes(1);
    expect(onConsumed).toHaveBeenCalledTimes(1);
    expect(onExpired).toHaveBeenCalledTimes(0);

    const noConsume = await executeRecoveryOrMagicLinkFlow({
      request,
      token,
      shouldConsumeToken: false,
      nowUtc: '2026-01-01T00:00:10.000Z',
    });

    expect(noConsume.consumed).toBe(false);
    expect(noConsume.expired).toBe(false);

    const expiredResult = await executeRecoveryOrMagicLinkFlow({
      request,
      token,
      nowUtc: '2026-01-01T00:03:00.000Z',
      callbacks: { onExpired },
    });

    expect(expiredResult.expired).toBe(true);
    expect(onExpired).toHaveBeenCalled();

    const onFailed = vi.fn();
    await expect(
      executeRecoveryOrMagicLinkFlow({
        request,
        token,
        nowUtc: 'invalid-date',
        callbacks: { onFailed },
      })
    ).rejects.toThrow("Token nowUtc 'invalid-date' is invalid.");
    expect(onFailed).toHaveBeenCalledTimes(1);
  });

  it('normalizes optional tenant/redirect values when non-string payloads are provided', () => {
    const request = createMagicLinkRequestContract({
      email: 'optional@example.com',
      tenantId: 10 as unknown as string,
      redirectUri: null as unknown as string,
      requestedAtUtc: '2026-01-01T00:00:00.000Z',
    });

    expect(request.tenantId).toBeUndefined();
    expect(request.redirectUri).toBeUndefined();
  });

  it('uses Date-based defaults for request and token timestamps when omitted', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    try {
      const request = createPasswordRecoveryRequestContract({
        email: 'default-time@example.com',
      });

      expect(typeof request.requestedAtUtc).toBe('string');

      const token = issueAuthTokenLifecycle({
        subject: 'default-time@example.com',
        purpose: 'password-reset',
        ttlSeconds: 60,
      });

      const consumed = consumeAuthTokenLifecycle({ token });
      expect(typeof consumed.consumedAtUtc).toBe('string');
      expect(consumed.expired).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
