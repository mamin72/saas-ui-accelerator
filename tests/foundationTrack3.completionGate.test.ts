import { describe, expect, it } from 'vitest';
import * as foundation from '../src/index';

describe('foundation track 3 completion gate', () => {
  it('exposes all expected public APIs for chunk 1 through chunk 3 deliverables', () => {
    expect(typeof foundation.createPageAccessContract).toBe('function');
    expect(typeof foundation.evaluatePageAccess).toBe('function');
    expect(typeof foundation.createPageAccessEvaluator).toBe('function');

    expect(typeof foundation.createComponentAccessPolicy).toBe('function');
    expect(typeof foundation.evaluateComponentAccess).toBe('function');
    expect(typeof foundation.createComponentAccessEvaluator).toBe('function');

    expect(typeof foundation.createActionAccessPolicy).toBe('function');
    expect(typeof foundation.evaluateActionAccess).toBe('function');
    expect(typeof foundation.createActionAccessEvaluator).toBe('function');

    expect(typeof foundation.createFieldAccessPolicy).toBe('function');
    expect(typeof foundation.evaluateFieldAccess).toBe('function');
    expect(typeof foundation.createFieldAccessEvaluator).toBe('function');
    expect(typeof foundation.fieldEquals).toBe('function');
    expect(typeof foundation.fieldIsTrue).toBe('function');
  });

  it('validates integrated page, component, and action policy evaluation through public exports', () => {
    const principal: foundation.PageAccessPrincipal = {
      userId: 'u1',
      roles: ['admin'],
      permissions: ['users:read', 'users:archive'],
      tenantId: 'tenant-a',
    };

    const pageEvaluator = foundation.createPageAccessEvaluator([
      foundation.createPageAccessContract({
        pageKey: 'users.page',
        requiredRoles: ['admin'],
        requiredPermissions: ['users:read'],
      }),
    ]);

    const componentEvaluator = foundation.createComponentAccessEvaluator([
      foundation.createComponentAccessPolicy({
        componentKey: 'users-table',
        requiredPermissions: ['users:read'],
      }),
    ]);

    const actionEvaluator = foundation.createActionAccessEvaluator([
      foundation.createActionAccessPolicy({
        componentKey: 'users-table',
        actionKey: 'archive',
        requiredPermissions: ['users:archive'],
      }),
    ]);

    type FieldRecord = {
      amount: number;
      status: 'draft' | 'published';
      isOwner: boolean;
    };

    const fieldEvaluator = foundation.createFieldAccessEvaluator<FieldRecord>([
      foundation.createFieldAccessPolicy<FieldRecord, 'amount'>({
        fieldKey: 'amount',
        mode: 'write',
        requiredPermissions: ['users:archive'],
        conditions: [
          foundation.fieldEquals<FieldRecord, 'status'>('status', 'draft'),
          foundation.fieldIsTrue<FieldRecord, 'isOwner'>('isOwner'),
        ],
      }),
    ]);

    expect(pageEvaluator.evaluate('users.page', principal).allowed).toBe(true);
    expect(componentEvaluator.evaluate('users-table', principal).allowed).toBe(true);
    expect(actionEvaluator.evaluate('users-table', 'archive', principal).allowed).toBe(true);
    expect(
      fieldEvaluator.evaluate('amount', 'write', {
        principal,
        record: {
          amount: 500,
          status: 'draft',
          isOwner: true,
        },
      }).allowed
    ).toBe(true);

    const deniedAction = actionEvaluator.evaluate('users-table', 'delete', principal);
    expect(deniedAction.allowed).toBe(false);
    expect(deniedAction.reasons.map((reason) => reason.code)).toEqual(['action-not-registered']);

    const deniedField = fieldEvaluator.evaluate('amount', 'write', {
      principal,
      record: {
        amount: 500,
        status: 'published',
        isOwner: false,
      },
    });
    expect(deniedField.allowed).toBe(false);
    expect(deniedField.reasons.map((reason) => reason.code)).toEqual(['conditions-not-met']);
  });
});
