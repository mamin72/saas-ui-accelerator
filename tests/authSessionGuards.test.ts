import { describe, expect, it, vi } from 'vitest';
import {
  createComponentSessionGuardContract,
  createRouteSessionGuardContract,
  evaluateSessionGuard,
  evaluateSessionGuardWithRevalidation,
} from '../src/index';

describe('auth session guards', () => {
  const authenticatedSession = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin', 'editor'],
    permissions: ['users:read', 'users:write'],
    status: 'authenticated' as const,
  };

  it('creates route and component session guards with normalized values', () => {
    const routeGuard = createRouteSessionGuardContract({
      routeKey: 'settings.route',
      requiredRoles: ['admin', ' admin '],
      requiredPermissions: ['users:write', 'users:read'],
      requireAllPermissions: true,
      fallbackPath: 'login',
    });

    const componentGuard = createComponentSessionGuardContract({
      componentKey: 'settings.panel',
      requiredPermissions: ['users:read'],
      fallbackComponentKey: 'auth.prompt',
    });

    expect(routeGuard.fallbackPath).toBe('/login');
    expect(routeGuard.requiredRoles).toEqual(['admin']);
    expect(componentGuard.fallbackComponentKey).toBe('auth.prompt');
  });

  it('rejects empty route/component keys', () => {
    expect(() =>
      createRouteSessionGuardContract({
        routeKey: '   ',
      })
    ).toThrow('Route session guard routeKey must be non-empty.');

    expect(() =>
      createComponentSessionGuardContract({
        componentKey: '   ',
      })
    ).toThrow('Component session guard componentKey must be non-empty.');
  });

  it('evaluates unauthenticated, expired, role, and permission denial paths', () => {
    const guard = createRouteSessionGuardContract({
      routeKey: 'settings.route',
      requiredRoles: ['admin'],
      requiredPermissions: ['users:write'],
      fallbackPath: '/sign-in',
    });

    const unauthenticated = evaluateSessionGuard({
      guard,
      session: undefined,
    });

    expect(unauthenticated).toEqual({
      allowed: false,
      reason: 'unauthenticated',
      fallbackPath: '/sign-in',
      fallbackComponentKey: undefined,
    });

    const expired = evaluateSessionGuard({
      guard,
      session: {
        ...authenticatedSession,
        status: 'expired',
      },
    });

    expect(expired.reason).toBe('expired');

    const missingRole = evaluateSessionGuard({
      guard,
      session: {
        ...authenticatedSession,
        roles: ['viewer'],
      },
    });

    expect(missingRole.reason).toBe('missing-role');

    const missingPermission = evaluateSessionGuard({
      guard,
      session: {
        ...authenticatedSession,
        permissions: ['users:read'],
      },
    });

    expect(missingPermission.reason).toBe('missing-permission');
  });

  it('supports any-claim and all-claim matching with session expiry fallback', () => {
    const anyGuard = createComponentSessionGuardContract({
      componentKey: 'users.list',
      requiredRoles: ['admin', 'support'],
      requireAllRoles: false,
      requiredPermissions: ['users:read', 'users:delete'],
      requireAllPermissions: false,
      fallbackComponentKey: 'forbidden.banner',
    });

    const anyAllowed = evaluateSessionGuard({
      guard: anyGuard,
      session: {
        ...authenticatedSession,
        roles: ['support'],
        permissions: ['users:read'],
      },
    });

    expect(anyAllowed.allowed).toBe(true);

    const expiredByTimestamp = evaluateSessionGuard({
      guard: anyGuard,
      session: {
        ...authenticatedSession,
        expiresAtUtc: 'invalid-date',
      },
    });

    expect(expiredByTimestamp.reason).toBe('expired');
  });

  it('evaluates revalidation success/failure and async revalidation branch', async () => {
    const guard = createRouteSessionGuardContract({
      routeKey: 'billing.route',
      revalidateOnAccess: true,
      requiredPermissions: ['users:read'],
      fallbackPath: '/auth/revalidate',
    });

    const failedRevalidation = evaluateSessionGuard({
      guard,
      session: authenticatedSession,
      revalidation: { ok: false },
    });

    expect(failedRevalidation.reason).toBe('revalidation-failed');

    const passedRevalidation = evaluateSessionGuard({
      guard,
      session: authenticatedSession,
      revalidation: { ok: true },
    });

    expect(passedRevalidation.allowed).toBe(true);

    const revalidate = vi.fn(() => Promise.resolve({ ok: true }));
    const asyncAllowed = await evaluateSessionGuardWithRevalidation({
      guard,
      session: authenticatedSession,
      revalidate,
    });

    expect(asyncAllowed.allowed).toBe(true);
    expect(revalidate).toHaveBeenCalledTimes(1);

    const noRevalidateNeeded = await evaluateSessionGuardWithRevalidation({
      guard: createRouteSessionGuardContract({ routeKey: 'public', requireAuthenticated: false }),
      session: undefined,
    });

    expect(noRevalidateNeeded.allowed).toBe(true);
  });
});
