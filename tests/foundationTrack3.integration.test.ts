import { describe, expect, it } from 'vitest';
import {
  createActionAccessEvaluator,
  createActionAccessPolicy,
  createComponentAccessEvaluator,
  createComponentAccessPolicy,
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
