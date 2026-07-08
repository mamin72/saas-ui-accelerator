import { describe, expect, it } from 'vitest';
import {
  createAuthSubmissionContract,
  createComponentSessionGuardContract,
  createMagicLinkRequestContract,
  createMfaChallengeContract,
  createSignInFormSchema,
  createSocialLoginAdapterContract,
  createTenantAuthAccessEvaluator,
  createTenantAuthContext,
  createTenantAuthIdentity,
  evaluateSessionGuard,
  executeRecoveryOrMagicLinkFlow,
  issueAuthTokenLifecycle,
  startSocialLogin,
  verifyMfaChallenge,
} from '../src/index';

describe('auth kit examples', () => {
  it('runs a typed sign-in through magic-link, social login, mfa, and session guards', async () => {
    const signInSchema = createSignInFormSchema({ includeTenantId: true });

    const submission = createAuthSubmissionContract({
      schema: signInSchema,
      values: {
        email: 'member@example.com',
        password: 'StrongPass-123',
        rememberMe: true,
        tenantId: 'tenant-a',
      },
      submittedAtUtc: '2026-02-01T10:00:00.000Z',
    });

    expect(submission.values.email).toBe('member@example.com');

    const magicRequest = createMagicLinkRequestContract({
      email: submission.values.email,
      tenantId: submission.values.tenantId,
      redirectUri: 'https://app.example.com/auth/callback',
      requestedAtUtc: '2026-02-01T10:00:00.000Z',
    });

    const magicToken = issueAuthTokenLifecycle({
      subject: magicRequest.email,
      purpose: 'magic-link',
      ttlSeconds: 300,
      issuedAtUtc: '2026-02-01T10:00:00.000Z',
      tokenIdFactory: () => 'magic-1',
    });

    const flowResult = await executeRecoveryOrMagicLinkFlow({
      request: magicRequest,
      token: magicToken,
      nowUtc: '2026-02-01T10:01:00.000Z',
    });

    expect(flowResult.consumed).toBe(true);

    const socialAdapter = createSocialLoginAdapterContract({
      provider: 'github',
      clientId: 'github-client',
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      exchangeCodeForIdentity: () =>
        Promise.resolve({
          userId: 'u-1',
          email: submission.values.email,
        }),
    });

    const socialStart = startSocialLogin({
      adapter: socialAdapter,
      redirectUri: 'https://app.example.com/auth/social-callback',
      stateFactory: () => 'social-state',
    });

    expect(socialStart.provider).toBe('github');
    expect(socialStart.authorizeUrl).toContain('state=social-state');

    const mfaChallenge = createMfaChallengeContract({
      challengeId: 'mfa-1',
      userId: 'u-1',
      method: 'totp',
      issuedAtUtc: '2026-02-01T10:01:00.000Z',
      ttlSeconds: 180,
    });

    const verifiedMfa = verifyMfaChallenge({
      challenge: mfaChallenge,
      nowUtc: '2026-02-01T10:01:20.000Z',
    });

    expect(verifiedMfa.verifiedAtUtc).toBe('2026-02-01T10:01:20.000Z');

    const context = createTenantAuthContext({
      activeTenantId: 'tenant-a',
      identities: [
        createTenantAuthIdentity({
          tenantId: 'tenant-a',
          userId: 'u-1',
          roles: ['admin'],
          permissions: ['users:read', 'users:write'],
        }),
      ],
    });

    const evaluator = createTenantAuthAccessEvaluator(context);
    const access = evaluator.evaluate({ requiredPermissions: ['users:write'] });

    expect(access.allowed).toBe(true);

    const guard = createComponentSessionGuardContract({
      componentKey: 'settings.panel',
      requiredPermissions: ['users:read'],
      fallbackComponentKey: 'auth.prompt',
    });

    const guardResult = evaluateSessionGuard({
      guard,
      session: {
        userId: 'u-1',
        tenantId: 'tenant-a',
        roles: ['admin'],
        permissions: ['users:read', 'users:write'],
        status: 'authenticated',
      },
    });

    expect(guardResult.allowed).toBe(true);
  });
});
