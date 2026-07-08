import { describe, expect, it } from 'vitest';
import {
  createTenantAuthAccessEvaluator,
  createTenantAuthContext,
  createTenantAuthIdentity,
  evaluateTenantAuthAccess,
  hasRequiredPermissions,
  hasRequiredRoles,
  resolveActiveTenantIdentity,
} from '../src/index';

describe('auth context and access evaluators', () => {
  it('creates tenant identities with normalized claims and validates required fields', () => {
    const identity = createTenantAuthIdentity({
      tenantId: ' tenant-a ',
      userId: ' user-1 ',
      roles: ['admin', ' admin ', 'editor'],
      permissions: ['users:read', 'users:write', 'users:read'],
    });

    expect(identity).toEqual({
      tenantId: 'tenant-a',
      userId: 'user-1',
      roles: ['admin', 'editor'],
      permissions: ['users:read', 'users:write'],
    });

    expect(() =>
      createTenantAuthIdentity({
        tenantId: ' ',
        userId: 'user-1',
      })
    ).toThrow('Tenant auth identity tenantId and userId must be non-empty.');
  });

  it('creates tenant context and resolves active identity', () => {
    const context = createTenantAuthContext({
      activeTenantId: 'tenant-a',
      identities: [
        createTenantAuthIdentity({ tenantId: 'tenant-a', userId: 'user-1', roles: ['admin'], permissions: ['users:read'] }),
        createTenantAuthIdentity({ tenantId: 'tenant-b', userId: 'user-1', roles: ['viewer'], permissions: ['users:read'] }),
      ],
    });

    const activeIdentity = resolveActiveTenantIdentity(context);
    expect(activeIdentity?.tenantId).toBe('tenant-a');

    expect(() =>
      createTenantAuthContext({
        activeTenantId: ' ',
        identities: [],
      })
    ).toThrow('Tenant auth context activeTenantId must be non-empty.');
  });

  it('evaluates role and permission requirements with all/any semantics', () => {
    const identity = createTenantAuthIdentity({
      tenantId: 'tenant-a',
      userId: 'user-1',
      roles: ['admin', 'support'],
      permissions: ['users:read', 'users:write'],
    });

    expect(hasRequiredRoles({ identity, requiredRoles: ['admin'] })).toBe(true);
    expect(hasRequiredRoles({ identity, requiredRoles: ['admin', 'owner'], requireAll: false })).toBe(true);
    expect(hasRequiredRoles({ identity, requiredRoles: ['admin', 'owner'], requireAll: true })).toBe(false);

    expect(hasRequiredPermissions({ identity, requiredPermissions: ['users:read'] })).toBe(true);
    expect(hasRequiredPermissions({ identity, requiredPermissions: ['users:read', 'users:delete'], requireAll: false })).toBe(true);
    expect(hasRequiredPermissions({ identity, requiredPermissions: ['users:read', 'users:delete'], requireAll: true })).toBe(false);
  });

  it('evaluates tenant auth access for allow and deny outcomes', () => {
    const context = createTenantAuthContext({
      activeTenantId: 'tenant-a',
      identities: [
        createTenantAuthIdentity({
          tenantId: 'tenant-a',
          userId: 'user-1',
          roles: ['admin'],
          permissions: ['users:read', 'users:write'],
        }),
      ],
    });

    const allowed = evaluateTenantAuthAccess({
      context,
      requirement: {
        requiredRoles: ['admin'],
        requiredPermissions: ['users:write'],
        requiredTenantId: 'tenant-a',
      },
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.reason).toBe('allowed');

    const tenantMismatch = evaluateTenantAuthAccess({
      context,
      requirement: {
        requiredTenantId: 'tenant-b',
      },
    });

    expect(tenantMismatch.reason).toBe('tenant-mismatch');

    const missingRole = evaluateTenantAuthAccess({
      context,
      requirement: {
        requiredRoles: ['owner'],
      },
    });

    expect(missingRole.reason).toBe('missing-role');

    const missingPermission = evaluateTenantAuthAccess({
      context,
      requirement: {
        requiredPermissions: ['users:delete'],
      },
    });

    expect(missingPermission.reason).toBe('missing-permission');

    const missingIdentity = evaluateTenantAuthAccess({
      context: createTenantAuthContext({ activeTenantId: 'tenant-c', identities: context.identities }),
    });

    expect(missingIdentity.reason).toBe('identity-not-found');
  });

  it('provides evaluator helpers for requirement checks and tenant lookups', () => {
    const context = createTenantAuthContext({
      activeTenantId: 'tenant-b',
      identities: [
        createTenantAuthIdentity({ tenantId: 'tenant-a', userId: 'user-1', roles: ['admin'], permissions: ['users:read'] }),
        createTenantAuthIdentity({ tenantId: 'tenant-b', userId: 'user-1', roles: ['viewer'], permissions: ['users:read'] }),
      ],
    });

    const evaluator = createTenantAuthAccessEvaluator(context);

    expect(evaluator.hasTenant('tenant-a')).toBe(true);
    expect(evaluator.hasTenant('tenant-z')).toBe(false);
    expect(evaluator.listTenants()).toEqual(['tenant-a', 'tenant-b']);

    const denied = evaluator.evaluate({ requiredRoles: ['admin'] });
    expect(denied.reason).toBe('missing-role');

    const allowed = evaluator.evaluate({ requiredPermissions: ['users:read'] });
    expect(allowed.allowed).toBe(true);
  });
});
