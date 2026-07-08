import { describe, expect, it } from 'vitest';
import {
  createPageAccessContract,
  createPageAccessEvaluator,
  evaluatePageAccess,
  type PageAccessPrincipal,
} from '../src/index';

describe('page access contracts', () => {
  const adminPrincipal: PageAccessPrincipal = {
    userId: 'u1',
    roles: ['admin', 'support'],
    permissions: ['users:read', 'users:write', 'billing:read'],
    tenantId: 'tenant-a',
  };

  it('creates normalized page access contracts', () => {
    const contract = createPageAccessContract({
      pageKey: ' users.settings ',
      requiredRoles: ['admin', 'admin', ' '],
      requiredPermissions: ['users:write', 'users:write'],
      allowedTenants: ['tenant-a', 'tenant-a', 'tenant-b'],
    });

    expect(contract.pageKey).toBe('users.settings');
    expect(contract.requiredRoles).toEqual(['admin']);
    expect(contract.requiredPermissions).toEqual(['users:write']);
    expect(contract.allowedTenants).toEqual(['tenant-a', 'tenant-b']);
    expect(contract.requireAllPermissions).toBe(true);
    expect(contract.denyWhenUnauthenticated).toBe(true);
  });

  it('rejects empty contract page keys', () => {
    expect(() => createPageAccessContract({ pageKey: '   ' })).toThrow(
      'Page access contract key must be non-empty.'
    );
  });

  it('allows access when role, permission, and tenant requirements are met', () => {
    const contract = createPageAccessContract({
      pageKey: 'users.settings',
      requiredRoles: ['admin'],
      requiredPermissions: ['users:write'],
      allowedTenants: ['tenant-a'],
    });

    const result = evaluatePageAccess(contract, adminPrincipal);

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('allow');
    expect(result.reasons).toEqual([]);
  });

  it('returns deny metadata for missing access requirements', () => {
    const contract = createPageAccessContract({
      pageKey: 'billing.admin',
      requiredRoles: ['billing-admin'],
      requiredPermissions: ['billing:write'],
      allowedTenants: ['tenant-b'],
    });

    const result = evaluatePageAccess(contract, adminPrincipal);

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny');
    expect(result.missingRoles).toEqual(['billing-admin']);
    expect(result.missingPermissions).toEqual(['billing:write']);
    expect(result.reasons.map((reason) => reason.code)).toEqual([
      'missing-roles',
      'missing-permissions',
      'tenant-mismatch',
    ]);
  });

  it('supports any-permission evaluation mode', () => {
    const contract = createPageAccessContract({
      pageKey: 'reports',
      requiredPermissions: ['reports:view', 'billing:read'],
      requireAllPermissions: false,
    });

    const result = evaluatePageAccess(contract, adminPrincipal);
    expect(result.allowed).toBe(true);
  });

  it('denies any-permission mode when no required permission is present', () => {
    const contract = createPageAccessContract({
      pageKey: 'reports.strict',
      requiredPermissions: ['reports:view', 'audit:read'],
      requireAllPermissions: false,
    });

    const result = evaluatePageAccess(contract, adminPrincipal);
    expect(result.allowed).toBe(false);
    expect(result.missingPermissions).toEqual(['reports:view', 'audit:read']);
    expect(result.reasons.map((reason) => reason.code)).toContain('missing-permissions');
  });

  it('denies unauthenticated access by default', () => {
    const contract = createPageAccessContract({
      pageKey: 'secure.page',
    });

    const result = evaluatePageAccess(contract);

    expect(result.allowed).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['unauthenticated']);
  });

  it('can allow unauthenticated access when explicitly configured', () => {
    const contract = createPageAccessContract({
      pageKey: 'public.page',
      denyWhenUnauthenticated: false,
    });

    const result = evaluatePageAccess(contract);
    expect(result.allowed).toBe(true);
  });

  it('evaluates page registrations through evaluator helper', () => {
    const evaluator = createPageAccessEvaluator([
      createPageAccessContract({
        pageKey: 'users.settings',
        requiredRoles: ['admin'],
      }),
      createPageAccessContract({
        pageKey: 'billing.dashboard',
      }),
    ]);

    expect(evaluator.hasPage('users.settings')).toBe(true);
    expect(evaluator.listPageKeys()).toEqual(['billing.dashboard', 'users.settings']);

    const allowedResult = evaluator.evaluate('users.settings', adminPrincipal);
    expect(allowedResult.allowed).toBe(true);

    const missingPageResult = evaluator.evaluate('missing.page', adminPrincipal);
    expect(missingPageResult.allowed).toBe(false);
    expect(missingPageResult.reasons.map((reason) => reason.code)).toEqual(['page-not-registered']);
  });

  it('reports tenant mismatch with unknown tenant when principal tenant is absent', () => {
    const contract = createPageAccessContract({
      pageKey: 'tenant.boundary',
      allowedTenants: ['tenant-a'],
    });

    const result = evaluatePageAccess(contract, {
      userId: 'u3',
      roles: ['admin'],
      permissions: ['users:read'],
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons[0]?.code).toBe('tenant-mismatch');
    expect(result.reasons[0]?.message).toContain("Tenant 'unknown'");
  });
});
