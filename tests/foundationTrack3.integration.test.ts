import { describe, expect, it } from 'vitest';
import {
  combinePolicyEvaluationDecisions,
  createActionAccessEvaluator,
  createActionAccessPolicy,
  createComponentAccessEvaluator,
  createComponentAccessPolicy,
  createFieldAccessEvaluator,
  createFieldAccessPolicy,
  createTenantScopedActionAccessPolicy,
  createTenantScopedComponentAccessPolicy,
  createTenantScopedFieldAccessPolicy,
  evaluateTenantScopedActionAccess,
  evaluateTenantScopedComponentAccess,
  evaluateTenantScopedFieldAccess,
  fieldEquals,
  fieldIsTrue,
  type ComponentAccessPrincipal,
} from '../src/index';

describe('foundation track 3 integration', () => {
  it('combines component and action access policies in a shared principal flow', () => {
    const principal: ComponentAccessPrincipal = {
      userId: 'u1',
      roles: ['admin', 'support'],
      permissions: ['users:read', 'users:archive'],
      tenantId: 'tenant-a',
    };

    const componentEvaluator = createComponentAccessEvaluator([
      createComponentAccessPolicy({
        componentKey: 'users-table',
        requiredRoles: ['admin'],
        requiredPermissions: ['users:read'],
      }),
      createComponentAccessPolicy({
        componentKey: 'audit-panel',
        requiredPermissions: ['audit:read'],
      }),
    ]);

    const actionEvaluator = createActionAccessEvaluator([
      createActionAccessPolicy({
        componentKey: 'users-table',
        actionKey: 'archive',
        requiredPermissions: ['users:archive'],
      }),
      createActionAccessPolicy({
        componentKey: 'users-table',
        actionKey: 'delete',
        requiredPermissions: ['users:delete'],
      }),
      createActionAccessPolicy({
        componentKey: 'audit-panel',
        actionKey: 'export',
        requiredPermissions: ['audit:export'],
        requireAllPermissions: false,
      }),
    ]);

    const componentAllowed = componentEvaluator.evaluate('users-table', principal);
    const componentDenied = componentEvaluator.evaluate('audit-panel', principal);

    expect(componentAllowed.allowed).toBe(true);
    expect(componentDenied.allowed).toBe(false);
    expect(componentDenied.reasons.map((reason) => reason.code)).toEqual(['missing-permissions']);

    const archiveAllowed = actionEvaluator.evaluate('users-table', 'archive', principal);
    const deleteDenied = actionEvaluator.evaluate('users-table', 'delete', principal);

    expect(archiveAllowed.allowed).toBe(true);
    expect(deleteDenied.allowed).toBe(false);
    expect(deleteDenied.reasons.map((reason) => reason.code)).toEqual(['missing-permissions']);

    expect(actionEvaluator.listActions('users-table')).toEqual(['archive', 'delete']);
    expect(actionEvaluator.listActions()).toEqual(['archive', 'delete', 'export']);

    type FieldRecord = {
      status: 'draft' | 'published';
      isOwner: boolean;
      amount: number;
    };

    const fieldEvaluator = createFieldAccessEvaluator<FieldRecord>([
      createFieldAccessPolicy<FieldRecord, 'amount'>({
        fieldKey: 'amount',
        mode: 'write',
        requiredPermissions: ['users:archive'],
        conditions: [
          fieldEquals<FieldRecord, 'status'>('status', 'draft'),
          fieldIsTrue<FieldRecord, 'isOwner'>('isOwner'),
        ],
      }),
    ]);

    const fieldAllowed = fieldEvaluator.evaluate('amount', 'write', {
      principal,
      record: {
        status: 'draft',
        isOwner: true,
        amount: 100,
      },
    });

    const fieldDenied = fieldEvaluator.evaluate('amount', 'write', {
      principal,
      record: {
        status: 'published',
        isOwner: false,
        amount: 100,
      },
    });

    expect(fieldAllowed.allowed).toBe(true);
    expect(fieldDenied.allowed).toBe(false);
    expect(fieldDenied.reasons.map((reason) => reason.code)).toEqual(['conditions-not-met']);

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

    type TenantFieldRecord = {
      amount: number;
      status: 'draft' | 'published';
    };

    const tenantFieldPolicy = createTenantScopedFieldAccessPolicy<TenantFieldRecord, 'amount'>({
      fieldKey: 'amount',
      mode: 'write',
      requiredPermissions: ['users:archive'],
      conditions: [fieldEquals<TenantFieldRecord, 'status'>('status', 'draft')],
      allowedTenants: ['tenant-a'],
    });

    const tenantComponentResult = evaluateTenantScopedComponentAccess(tenantComponentPolicy, principal);
    const tenantActionResult = evaluateTenantScopedActionAccess(tenantActionPolicy, principal);
    const tenantFieldResult = evaluateTenantScopedFieldAccess(tenantFieldPolicy, {
      principal,
      record: {
        amount: 10,
        status: 'draft',
      },
    });

    expect(tenantComponentResult.allowed).toBe(true);
    expect(tenantActionResult.allowed).toBe(true);
    expect(tenantFieldResult.allowed).toBe(true);

    const combinedDecision = combinePolicyEvaluationDecisions([
      tenantComponentResult,
      tenantActionResult,
      tenantFieldResult,
    ]);
    expect(combinedDecision.allowed).toBe(true);
    expect(combinedDecision.decision).toBe('allow');
  });

  it('supports public component and action access policies when unauthenticated', () => {
    const componentEvaluator = createComponentAccessEvaluator([
      createComponentAccessPolicy({
        componentKey: 'public-banner',
        denyWhenUnauthenticated: false,
      }),
    ]);

    const actionEvaluator = createActionAccessEvaluator([
      createActionAccessPolicy({
        componentKey: 'public-banner',
        actionKey: 'dismiss',
        denyWhenUnauthenticated: false,
      }),
    ]);

    expect(componentEvaluator.evaluate('public-banner').allowed).toBe(true);
    expect(actionEvaluator.evaluate('public-banner', 'dismiss').allowed).toBe(true);
  });
});
