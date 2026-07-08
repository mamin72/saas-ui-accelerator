import { describe, expect, it } from 'vitest';
import {
  createMfaChallengeContract,
  createSocialLoginAdapterContract,
  evaluateMfaChallenge,
  finishSocialLogin,
  registerMfaAttempt,
  startSocialLogin,
  verifyMfaChallenge,
} from '../src/index';

describe('auth social login and mfa primitives', () => {
  it('creates social login adapter contracts and start URLs', () => {
    const adapter = createSocialLoginAdapterContract({
      provider: 'google',
      clientId: 'client-id',
      scopes: ['openid', 'email', 'profile', 'email'],
      authorizeUrl: 'https://accounts.example.com/oauth/authorize',
      exchangeCodeForIdentity: () => Promise.resolve({ userId: 'u1', email: 'u1@example.com' }),
    });

    const started = startSocialLogin({
      adapter,
      redirectUri: 'https://app.example.com/callback',
      stateFactory: () => 'state-fixed',
    });

    expect(adapter.scopes).toEqual(['email', 'openid', 'profile']);
    expect(started.state).toBe('state-fixed');
    expect(started.authorizeUrl).toContain('client_id=client-id');
    expect(started.authorizeUrl).toContain('state=state-fixed');

    const defaultStateStart = startSocialLogin({
      adapter,
      redirectUri: 'https://app.example.com/callback',
    });

    expect(defaultStateStart.state.startsWith('state-')).toBe(true);
  });

  it('validates social adapter and start inputs', () => {
    expect(() =>
      createSocialLoginAdapterContract({
        provider: 'github',
        clientId: '   ',
        authorizeUrl: 'https://accounts.example.com/oauth/authorize',
        exchangeCodeForIdentity: () => Promise.resolve({ userId: 'u', email: 'u@example.com' }),
      })
    ).toThrow('Social login clientId must be non-empty.');

    expect(() =>
      createSocialLoginAdapterContract({
        provider: 'github',
        clientId: 'client',
        authorizeUrl: '/relative',
        exchangeCodeForIdentity: () => Promise.resolve({ userId: 'u', email: 'u@example.com' }),
      })
    ).toThrow('Social login authorizeUrl must be an absolute http/https URL.');

    const adapter = createSocialLoginAdapterContract({
      provider: 'github',
      clientId: 'client',
      authorizeUrl: 'https://accounts.example.com/oauth/authorize',
      exchangeCodeForIdentity: () => Promise.resolve({ userId: 'u', email: 'u@example.com' }),
    });

    expect(() =>
      startSocialLogin({
        adapter,
        redirectUri: '/local-callback',
      })
    ).toThrow('Social login redirectUri must be an absolute http/https URL.');
  });

  it('finishes social login and validates non-empty code', async () => {
    const adapter = createSocialLoginAdapterContract({
      provider: 'microsoft',
      clientId: 'client',
      authorizeUrl: 'https://login.example.com/oauth2/v2.0/authorize',
      exchangeCodeForIdentity: ({ code }) => Promise.resolve({ userId: `id-${code}`, email: 'user@example.com' }),
    });

    const identity = await finishSocialLogin({
      adapter,
      code: ' auth-code ',
      redirectUri: 'https://app.example.com/callback',
    });

    expect(identity).toEqual({
      provider: 'microsoft',
      userId: 'id-auth-code',
      email: 'user@example.com',
    });

    await expect(
      finishSocialLogin({
        adapter,
        code: '   ',
        redirectUri: 'https://app.example.com/callback',
      })
    ).rejects.toThrow('Social login code must be non-empty.');
  });

  it('creates and evaluates mfa challenges across state branches', () => {
    const challenge = createMfaChallengeContract({
      challengeId: 'challenge-1',
      userId: 'user-1',
      method: 'totp',
      issuedAtUtc: '2026-01-01T00:00:00.000Z',
      ttlSeconds: 120,
      maxAttempts: 2,
    });

    const okEvaluation = evaluateMfaChallenge({
      challenge,
      nowUtc: '2026-01-01T00:01:00.000Z',
    });

    expect(okEvaluation).toEqual({ allowed: true, reason: 'ok' });

    const attempted = registerMfaAttempt(registerMfaAttempt(challenge));
    const maxAttemptsReached = evaluateMfaChallenge({
      challenge: attempted,
      nowUtc: '2026-01-01T00:01:00.000Z',
    });

    expect(maxAttemptsReached).toEqual({ allowed: false, reason: 'max-attempts-reached' });

    const expired = evaluateMfaChallenge({
      challenge,
      nowUtc: '2026-01-01T00:03:00.000Z',
    });

    expect(expired).toEqual({ allowed: false, reason: 'expired' });

    const verified = verifyMfaChallenge({
      challenge,
      nowUtc: '2026-01-01T00:00:30.000Z',
    });

    expect(verified.verifiedAtUtc).toBe('2026-01-01T00:00:30.000Z');

    const alreadyVerified = evaluateMfaChallenge({
      challenge: verified,
      nowUtc: '2026-01-01T00:00:40.000Z',
    });

    expect(alreadyVerified).toEqual({ allowed: false, reason: 'already-verified' });

    const deniedVerification = verifyMfaChallenge({
      challenge: attempted,
      nowUtc: '2026-01-01T00:01:00.000Z',
    });

    expect(deniedVerification.attemptsUsed).toBe(3);

    const verifiedWithoutNow = verifyMfaChallenge({
      challenge: createMfaChallengeContract({
        challengeId: 'challenge-default-now',
        userId: 'user-2',
        method: 'email',
        ttlSeconds: 60,
      }),
    });

    expect(typeof verifiedWithoutNow.verifiedAtUtc).toBe('string');

    const defaultNowEvaluation = evaluateMfaChallenge({
      challenge: createMfaChallengeContract({
        challengeId: 'challenge-default-eval',
        userId: 'user-3',
        method: 'sms',
        ttlSeconds: 120,
      }),
    });

    expect(defaultNowEvaluation.reason).toBe('ok');
  });

  it('validates mfa challenge creation inputs', () => {
    expect(() =>
      createMfaChallengeContract({
        challengeId: ' ',
        userId: 'user-1',
        method: 'sms',
        ttlSeconds: 10,
      })
    ).toThrow('MFA challengeId and userId must be non-empty.');

    expect(() =>
      createMfaChallengeContract({
        challengeId: 'challenge',
        userId: 'user-1',
        method: 'sms',
        ttlSeconds: 0,
      })
    ).toThrow('MFA ttlSeconds must be a positive integer.');

    expect(() =>
      createMfaChallengeContract({
        challengeId: 'challenge',
        userId: 'user-1',
        method: 'sms',
        ttlSeconds: 60,
        maxAttempts: 0,
      })
    ).toThrow('MFA maxAttempts must be a positive integer.');

    const challenge = createMfaChallengeContract({
      challengeId: 'challenge',
      userId: 'user-1',
      method: 'sms',
      ttlSeconds: 60,
    });

    expect(() =>
      evaluateMfaChallenge({
        challenge,
        nowUtc: 'not-a-date',
      })
    ).toThrow("MFA nowUtc 'not-a-date' is invalid.");
  });
});
