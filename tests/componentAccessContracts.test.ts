import { describe, expect, it } from 'vitest';
import {
  createActionAccessEvaluator,
  createActionAccessPolicy,
  createComponentAccessEvaluator,
  createComponentAccessPolicy,
  evaluateActionAccess,
  evaluateComponentAccess,
  type ComponentAccessPrincipal,
} from '../src/index';

describe('component access contracts', () => {
  const principal: ComponentAccessPrincipal = {
    userId: 'u1',
    roles: ['admin', 'support'],
    permissions: ['users:read', 'users:write', 'users:archive'],
    tenantId: 'tenant-a',
  };

  it('creates normalized component policies with defaults', () => {
    const policy = createComponentAccessPolicy({
      componentKey: ' users-table ',
      requiredRoles: ['admin', 'admin', ' '],
      requiredPermissions: ['users:read', 'users:read'],
    });

    expect(policy.componentKey).toBe('users-table');
    expect(policy.requiredRoles).toEqual(['admin']);
    expect(policy.requiredPermissions).toEqual(['users:read']);
    expect(policy.requireAllPermissions).toBe(true);
    expect(policy.denyWhenUnauthenticated).toBe(true);
  });

  it('rejects empty component keys', () => {
    expect(() => createComponentAccessPolicy({ componentKey: '   ' })).toThrow(
      'Component access policy key must be non-empty.'
    );
  });

  it('allows component access when requirements are met', () => {
    const policy = createComponentAccessPolicy({
      componentKey: 'users-table',
      requiredRoles: ['admin'],
      requiredPermissions: ['users:read'],
    });

    const result = evaluateComponentAccess(policy, principal);

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('allow');
    expect(result.reasons).toEqual([]);
    expect(result.scope).toBe('component');
  });

  it('denies component access with role and permission metadata', () => {
    const policy = createComponentAccessPolicy({
      componentKey: 'billing-panel',
      requiredRoles: ['billing-admin'],
      requiredPermissions: ['billing:read'],
    });

    const result = evaluateComponentAccess(policy, principal);

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('deny');
    expect(result.missingRoles).toEqual(['billing-admin']);
    expect(result.missingPermissions).toEqual(['billing:read']);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['missing-roles', 'missing-permissions']);
  });

  it('supports any-permission mode for component policies', () => {
    const policy = createComponentAccessPolicy({
      componentKey: 'reports-panel',
      requiredPermissions: ['reports:view', 'users:write'],
      requireAllPermissions: false,
    });

    const result = evaluateComponentAccess(policy, principal);
    expect(result.allowed).toBe(true);
  });

  it('allows unauthenticated component access when explicitly configured', () => {
    const policy = createComponentAccessPolicy({
      componentKey: 'public-banner',
      denyWhenUnauthenticated: false,
    });

    const result = evaluateComponentAccess(policy);
    expect(result.allowed).toBe(true);
  });

  it('creates normalized action policies and evaluates action access', () => {
    const policy = createActionAccessPolicy({
      componentKey: ' users-table ',
      actionKey: ' archive ',
      requiredPermissions: ['users:archive'],
    });

    expect(policy.componentKey).toBe('users-table');
    expect(policy.actionKey).toBe('archive');

    const result = evaluateActionAccess(policy, principal);
    expect(result.allowed).toBe(true);
    expect(result.scope).toBe('action');
  });

  it('denies unauthenticated action access by default', () => {
    const policy = createActionAccessPolicy({
      componentKey: 'users-table',
      actionKey: 'delete',
    });

    const result = evaluateActionAccess(policy);
    expect(result.allowed).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['unauthenticated']);
  });

  it('rejects empty action keys', () => {
    expect(() =>
      createActionAccessPolicy({
        componentKey: 'users-table',
        actionKey: '  ',
      })
    ).toThrow('Action access policy key must be non-empty.');
  });

  it('evaluates component policy registrations through evaluator helper', () => {
    const evaluator = createComponentAccessEvaluator([
      createComponentAccessPolicy({
        componentKey: 'users-table',
        requiredRoles: ['admin'],
      }),
      createComponentAccessPolicy({
        componentKey: 'reports-panel',
      }),
    ]);

    expect(evaluator.hasComponent('users-table')).toBe(true);
    expect(evaluator.listComponentKeys()).toEqual(['reports-panel', 'users-table']);

    const allowedResult = evaluator.evaluate('users-table', principal);
    expect(allowedResult.allowed).toBe(true);

    const missingResult = evaluator.evaluate('missing-component', principal);
    expect(missingResult.allowed).toBe(false);
    expect(missingResult.reasons.map((reason) => reason.code)).toEqual(['component-not-registered']);
  });

  it('evaluates action policy registrations through evaluator helper', () => {
    const evaluator = createActionAccessEvaluator([
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
        componentKey: 'reports-panel',
        actionKey: 'export',
      }),
    ]);

    expect(evaluator.hasAction('users-table', 'archive')).toBe(true);
    expect(evaluator.hasAction('users-table', 'missing')).toBe(false);
    expect(evaluator.listActions('users-table')).toEqual(['archive', 'delete']);
    expect(evaluator.listActions()).toEqual(['archive', 'delete', 'export']);

    const allowedResult = evaluator.evaluate('users-table', 'archive', principal);
    expect(allowedResult.allowed).toBe(true);

    const deniedResult = evaluator.evaluate('users-table', 'delete', principal);
    expect(deniedResult.allowed).toBe(false);
    expect(deniedResult.reasons.map((reason) => reason.code)).toEqual(['missing-permissions']);

    const missingResult = evaluator.evaluate('users-table', 'missing', principal);
    expect(missingResult.allowed).toBe(false);
    expect(missingResult.reasons.map((reason) => reason.code)).toEqual(['action-not-registered']);
  });

  it('returns empty action list for unknown component keys', () => {
    const evaluator = createActionAccessEvaluator([
      createActionAccessPolicy({
        componentKey: 'users-table',
        actionKey: 'archive',
      }),
    ]);

    expect(evaluator.listActions('unknown-component')).toEqual([]);
  });

  it('denies any-permission mode for action policies when no required permission is present', () => {
    const policy = createActionAccessPolicy({
      componentKey: 'users-table',
      actionKey: 'export',
      requiredPermissions: ['reports:export', 'analytics:export'],
      requireAllPermissions: false,
    });

    const result = evaluateActionAccess(policy, principal);

    expect(result.allowed).toBe(false);
    expect(result.missingPermissions).toEqual(['reports:export', 'analytics:export']);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['missing-permissions']);
  });
});
