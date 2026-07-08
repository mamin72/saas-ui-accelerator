import { describe, expect, it } from 'vitest';
import * as auth from '../src/index';

describe('phase 6 auth kit completion gate', () => {
  it('exposes public APIs for auth kit chunks 1 through 5', () => {
    expect(typeof auth.createSignInFormSchema).toBe('function');
    expect(typeof auth.createSignUpFormSchema).toBe('function');
    expect(typeof auth.createAuthSubmissionContract).toBe('function');
    expect(typeof auth.validateAuthFormValues).toBe('function');
    expect(typeof auth.mapAuthProviderError).toBe('function');

    expect(typeof auth.createPasswordRecoveryRequestContract).toBe('function');
    expect(typeof auth.createMagicLinkRequestContract).toBe('function');
    expect(typeof auth.issueAuthTokenLifecycle).toBe('function');
    expect(typeof auth.evaluateAuthTokenExpiry).toBe('function');
    expect(typeof auth.consumeAuthTokenLifecycle).toBe('function');
    expect(typeof auth.executeRecoveryOrMagicLinkFlow).toBe('function');

    expect(typeof auth.createSocialLoginAdapterContract).toBe('function');
    expect(typeof auth.startSocialLogin).toBe('function');
    expect(typeof auth.finishSocialLogin).toBe('function');
    expect(typeof auth.createMfaChallengeContract).toBe('function');
    expect(typeof auth.evaluateMfaChallenge).toBe('function');
    expect(typeof auth.verifyMfaChallenge).toBe('function');

    expect(typeof auth.createRouteSessionGuardContract).toBe('function');
    expect(typeof auth.createComponentSessionGuardContract).toBe('function');
    expect(typeof auth.evaluateSessionGuard).toBe('function');
    expect(typeof auth.evaluateSessionGuardWithRevalidation).toBe('function');

    expect(typeof auth.createTenantAuthIdentity).toBe('function');
    expect(typeof auth.createTenantAuthContext).toBe('function');
    expect(typeof auth.resolveActiveTenantIdentity).toBe('function');
    expect(typeof auth.evaluateTenantAuthAccess).toBe('function');
    expect(typeof auth.createTenantAuthAccessEvaluator).toBe('function');
  });

  it('validates integrated happy path across auth kit chunks', async () => {
    const signInSchema = auth.createSignInFormSchema({ includeTenantId: true });

    const submission = auth.createAuthSubmissionContract({
      schema: signInSchema,
      values: {
        email: 'member@example.com',
        password: 'StrongPass-123',
        rememberMe: true,
        tenantId: 'tenant-a',
      },
      submittedAtUtc: '2026-03-01T08:00:00.000Z',
    });

    const recoveryRequest = auth.createPasswordRecoveryRequestContract({
      email: submission.values.email,
      tenantId: submission.values.tenantId,
      redirectUri: 'https://app.example.com/auth/reset',
      requestedAtUtc: '2026-03-01T08:01:00.000Z',
    });

    const token = auth.issueAuthTokenLifecycle({
      subject: recoveryRequest.email,
      purpose: 'password-reset',
      ttlSeconds: 300,
      issuedAtUtc: '2026-03-01T08:01:00.000Z',
      tokenIdFactory: () => 'reset-token',
    });

    const flow = await auth.executeRecoveryOrMagicLinkFlow({
      request: recoveryRequest,
      token,
      nowUtc: '2026-03-01T08:02:00.000Z',
    });

    expect(flow.consumed).toBe(true);

    const social = auth.createSocialLoginAdapterContract({
      provider: 'microsoft',
      clientId: 'ms-client',
      authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      exchangeCodeForIdentity: ({ code }) => Promise.resolve({ userId: `u-${code}`, email: submission.values.email }),
    });

    const socialStart = auth.startSocialLogin({
      adapter: social,
      redirectUri: 'https://app.example.com/auth/social-callback',
      stateFactory: () => 'state-1',
    });

    expect(socialStart.state).toBe('state-1');

    const socialIdentity = await auth.finishSocialLogin({
      adapter: social,
      code: '123',
      redirectUri: 'https://app.example.com/auth/social-callback',
    });

    expect(socialIdentity.userId).toBe('u-123');

    const challenge = auth.createMfaChallengeContract({
      challengeId: 'challenge-1',
      userId: socialIdentity.userId,
      method: 'totp',
      issuedAtUtc: '2026-03-01T08:02:00.000Z',
      ttlSeconds: 120,
    });

    const verified = auth.verifyMfaChallenge({
      challenge,
      nowUtc: '2026-03-01T08:02:30.000Z',
    });

    expect(verified.verifiedAtUtc).toBe('2026-03-01T08:02:30.000Z');

    const authContext = auth.createTenantAuthContext({
      activeTenantId: 'tenant-a',
      identities: [
        auth.createTenantAuthIdentity({
          tenantId: 'tenant-a',
          userId: socialIdentity.userId,
          roles: ['admin'],
          permissions: ['users:read', 'users:write'],
        }),
      ],
    });

    const access = auth.evaluateTenantAuthAccess({
      context: authContext,
      requirement: {
        requiredTenantId: 'tenant-a',
        requiredPermissions: ['users:write'],
      },
    });

    expect(access.allowed).toBe(true);

    const guard = auth.createRouteSessionGuardContract({
      routeKey: 'settings.route',
      requiredPermissions: ['users:read'],
      fallbackPath: '/sign-in',
      revalidateOnAccess: true,
    });

    const guardResult = await auth.evaluateSessionGuardWithRevalidation({
      guard,
      session: {
        userId: socialIdentity.userId,
        tenantId: 'tenant-a',
        roles: ['admin'],
        permissions: ['users:read', 'users:write'],
        status: 'authenticated',
      },
      revalidate: () => Promise.resolve({ ok: true }),
    });

    expect(guardResult.allowed).toBe(true);
  });
});
