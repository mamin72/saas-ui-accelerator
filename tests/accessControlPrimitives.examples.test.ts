import { describe, expect, it } from 'vitest';
import {
  combinePolicyEvaluationDecisions,
  createActionAccessPolicy,
  createComponentAccessPolicy,
  createFieldAccessPolicy,
  createPageAccessContract,
  createTenantScopedActionAccessPolicy,
  createTenantScopedComponentAccessPolicy,
  createTenantScopedFieldAccessPolicy,
  evaluateActionAccess,
  evaluateComponentAccess,
  evaluateFieldAccess,
  evaluatePageAccess,
  evaluateTenantScopedActionAccess,
  evaluateTenantScopedComponentAccess,
  evaluateTenantScopedFieldAccess,
  fieldEquals,
} from '../src/index';

describe('access control primitives examples', () => {
  it('demonstrates page, component, action, and field access flows', () => {
    const principal = {
      userId: 'u-1',
      roles: ['admin'],
      permissions: ['users:read', 'users:write', 'users:archive'],
      tenantId: 'tenant-a',
    };

    const pagePolicy = createPageAccessContract({
      pageKey: 'users.page',
      requiredRoles: ['admin'],
      allowedTenants: ['tenant-a'],
    });

    const componentPolicy = createComponentAccessPolicy({
      componentKey: 'users-table',
      requiredPermissions: ['users:read'],
    });

    const actionPolicy = createActionAccessPolicy({
      componentKey: 'users-table',
      actionKey: 'archive',
      requiredPermissions: ['users:archive'],
    });

    type UserRecord = {
      amount: number;
      status: 'draft' | 'published';
    };

    const fieldPolicy = createFieldAccessPolicy<UserRecord, 'amount'>({
      fieldKey: 'amount',
      mode: 'write',
      requiredPermissions: ['users:write'],
      conditions: [fieldEquals<UserRecord, 'status'>('status', 'draft')],
    });

    const pageResult = evaluatePageAccess(pagePolicy, principal);
    const componentResult = evaluateComponentAccess(componentPolicy, principal);
    const actionResult = evaluateActionAccess(actionPolicy, principal);
    const fieldResult = evaluateFieldAccess(fieldPolicy, {
      principal,
      record: {
        amount: 10,
        status: 'draft',
      },
    });

    expect(pageResult.allowed).toBe(true);
    expect(componentResult.allowed).toBe(true);
    expect(actionResult.allowed).toBe(true);
    expect(fieldResult.allowed).toBe(true);
  });

  it('demonstrates tenant scoped composition', () => {
    const principal = {
      userId: 'u-2',
      roles: ['admin'],
      permissions: ['users:read', 'users:archive'],
      tenantId: 'tenant-a',
    };

    const tenantComponentPolicy = createTenantScopedComponentAccessPolicy({
      componentKey: 'users-table',
      requiredPermissions: ['users:read'],
      allowedTenants: ['tenant-a'],
    });

    const tenantActionPolicy = createTenantScopedActionAccessPolicy({
      componentKey: 'users-table',
      actionKey: 'archive',
      requiredPermissions: ['users:archive'],
      allowedTenants: ['tenant-a'],
    });

    type TenantRecord = {
      amount: number;
      status: 'draft' | 'published';
    };

    const tenantFieldPolicy = createTenantScopedFieldAccessPolicy<TenantRecord, 'amount'>({
      fieldKey: 'amount',
      mode: 'write',
      requiredPermissions: ['users:archive'],
      conditions: [fieldEquals<TenantRecord, 'status'>('status', 'draft')],
      allowedTenants: ['tenant-a'],
    });

    const componentResult = evaluateTenantScopedComponentAccess(tenantComponentPolicy, principal);
    const actionResult = evaluateTenantScopedActionAccess(tenantActionPolicy, principal);
    const fieldResult = evaluateTenantScopedFieldAccess(tenantFieldPolicy, {
      principal,
      record: {
        amount: 100,
        status: 'draft',
      },
    });

    const combinedDecision = combinePolicyEvaluationDecisions([
      componentResult,
      actionResult,
      fieldResult,
    ]);

    expect(combinedDecision.allowed).toBe(true);
    expect(combinedDecision.decision).toBe('allow');
  });
});
