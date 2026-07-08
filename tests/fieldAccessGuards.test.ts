import { describe, expect, it } from 'vitest';
import {
  createFieldAccessEvaluator,
  createFieldAccessPolicy,
  evaluateFieldAccess,
  fieldEquals,
  fieldIn,
  fieldIsFalse,
  fieldIsTrue,
  fieldNotEquals,
  fieldNotIn,
  type FieldAccessPolicy,
  type FieldAccessPrincipal,
} from '../src/index';

type UserRecord = {
  id: string;
  status: 'draft' | 'published';
  isOwner: boolean;
  region: 'us' | 'eu';
  amount: number;
};

describe('fieldAccessGuards', () => {
  const principal: FieldAccessPrincipal = {
    userId: 'u1',
    roles: ['editor'],
    permissions: ['users:read', 'users:write'],
    tenantId: 'tenant-a',
  };

  it('creates normalized field policies with defaults', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'amount'>({
      fieldKey: 'amount',
      requiredRoles: ['editor', 'editor', ' '],
      requiredPermissions: ['users:write', 'users:write'],
      conditions: [fieldEquals<UserRecord, 'status'>('status', 'draft')],
    });

    expect(policy.fieldKey).toBe('amount');
    expect(policy.mode).toBe('read');
    expect(policy.requiredRoles).toEqual(['editor']);
    expect(policy.requiredPermissions).toEqual(['users:write']);
    expect(policy.requireAllPermissions).toBe(true);
    expect(policy.denyWhenUnauthenticated).toBe(true);
    expect(policy.conditions).toHaveLength(1);
  });

  it('rejects empty field keys', () => {
    expect(() =>
      createFieldAccessPolicy<Record<string, unknown>, 'name'>({
        fieldKey: '   ' as unknown as 'name',
      })
    ).toThrow('Field access policy key must be non-empty.');
  });

  it('allows access when auth requirements and typed conditions are met', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'amount'>({
      fieldKey: 'amount',
      mode: 'write',
      requiredRoles: ['editor'],
      requiredPermissions: ['users:write'],
      conditions: [fieldEquals<UserRecord, 'status'>('status', 'draft'), fieldIsTrue<UserRecord, 'isOwner'>('isOwner')],
    });

    const result = evaluateFieldAccess(policy, {
      principal,
      record: {
        id: 'r1',
        status: 'draft',
        isOwner: true,
        region: 'us',
        amount: 100,
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('allow');
    expect(result.reasons).toEqual([]);
  });

  it('denies when conditions do not match and tracks failed conditions', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'amount'>({
      fieldKey: 'amount',
      mode: 'write',
      conditions: [
        fieldEquals<UserRecord, 'status'>('status', 'draft'),
        fieldIsTrue<UserRecord, 'isOwner'>('isOwner'),
        fieldIn<UserRecord, 'region'>('region', ['us']),
      ],
      requiredPermissions: ['users:write'],
    });

    const result = evaluateFieldAccess(policy, {
      principal,
      record: {
        id: 'r2',
        status: 'published',
        isOwner: false,
        region: 'eu',
        amount: 200,
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['conditions-not-met']);
    expect(result.failedConditions).toHaveLength(3);
  });

  it('denies when record context is missing for condition evaluation', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'status'>({
      fieldKey: 'status',
      conditions: [fieldNotEquals<UserRecord, 'status'>('status', 'published')],
    });

    const result = evaluateFieldAccess(policy, { principal });

    expect(result.allowed).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['missing-record-context']);
  });

  it('supports any-permission mode and unauthenticated override', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'status'>({
      fieldKey: 'status',
      requiredPermissions: ['users:admin', 'users:read'],
      requireAllPermissions: false,
      denyWhenUnauthenticated: false,
    });

    expect(evaluateFieldAccess(policy).allowed).toBe(true);
    expect(evaluateFieldAccess(policy, { principal }).allowed).toBe(true);
  });

  it('denies unauthenticated access by default', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'amount'>({
      fieldKey: 'amount',
    });

    const result = evaluateFieldAccess(policy);

    expect(result.allowed).toBe(false);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['unauthenticated']);
  });

  it('denies when required role is missing', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'status'>({
      fieldKey: 'status',
      requiredRoles: ['admin'],
    });

    const result = evaluateFieldAccess(policy, { principal });

    expect(result.allowed).toBe(false);
    expect(result.missingRoles).toEqual(['admin']);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['missing-roles']);
  });

  it('denies any-permission mode when none of the permissions are available', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'status'>({
      fieldKey: 'status',
      requiredPermissions: ['admin:read', 'audit:read'],
      requireAllPermissions: false,
    });

    const result = evaluateFieldAccess(policy, { principal });

    expect(result.allowed).toBe(false);
    expect(result.missingPermissions).toEqual(['admin:read', 'audit:read']);
    expect(result.reasons.map((reason) => reason.code)).toEqual(['missing-permissions']);
  });

  it('supports additional typed condition operators', () => {
    const policy = createFieldAccessPolicy<UserRecord, 'status'>({
      fieldKey: 'status',
      conditions: [
        fieldNotIn<UserRecord, 'region'>('region', ['eu']),
        fieldIsFalse<UserRecord, 'isOwner'>('isOwner'),
      ],
      denyWhenUnauthenticated: false,
    });

    const result = evaluateFieldAccess(policy, {
      principal,
      record: {
        id: 'r3',
        status: 'draft',
        isOwner: false,
        region: 'us',
        amount: 300,
      },
    });

    expect(result.allowed).toBe(true);
  });

  it('supports date equality conditions', () => {
    type DateRecord = {
      effectiveAt: Date;
      status: 'open' | 'closed';
    };

    const effectiveAt = new Date('2026-01-01T00:00:00.000Z');
    const policy = createFieldAccessPolicy<DateRecord, 'status'>({
      fieldKey: 'status',
      conditions: [fieldEquals<DateRecord, 'effectiveAt'>('effectiveAt', new Date('2026-01-01T00:00:00.000Z'))],
      denyWhenUnauthenticated: false,
    });

    const result = evaluateFieldAccess(policy, {
      principal,
      record: {
        effectiveAt,
        status: 'open',
      },
    });

    expect(result.allowed).toBe(true);
  });

  it('evaluates registered policies through field evaluator helper', () => {
    const policies: Array<FieldAccessPolicy<UserRecord>> = [
      createFieldAccessPolicy<UserRecord, 'amount'>({
        fieldKey: 'amount',
        mode: 'read',
        requiredPermissions: ['users:read'],
      }),
      createFieldAccessPolicy<UserRecord, 'amount'>({
        fieldKey: 'amount',
        mode: 'write',
        requiredPermissions: ['users:write'],
      }),
    ];

    const evaluator = createFieldAccessEvaluator(policies);

    expect(evaluator.hasField('amount')).toBe(true);
    expect(evaluator.hasField('amount', 'write')).toBe(true);
    expect(evaluator.hasField('missing')).toBe(false);
    expect(evaluator.listFields()).toEqual(['amount']);
    expect(evaluator.listFields('write')).toEqual(['amount']);

    const allowedRead = evaluator.evaluate('amount', 'read', { principal });
    expect(allowedRead.allowed).toBe(true);

    const deniedWrite = evaluator.evaluate('amount', 'write', {
      principal: {
        ...principal,
        permissions: ['users:read'],
      },
    });
    expect(deniedWrite.allowed).toBe(false);
    expect(deniedWrite.reasons.map((reason) => reason.code)).toEqual(['missing-permissions']);

    const missingPolicy = evaluator.evaluate('status', 'write', { principal });
    expect(missingPolicy.allowed).toBe(false);
    expect(missingPolicy.reasons.map((reason) => reason.code)).toEqual(['field-not-registered']);

    expect(evaluator.listFields('write')).toEqual(['amount']);
    expect(evaluator.listFields('read')).toEqual(['amount']);

    const defaultModeResult = evaluator.evaluate('amount', undefined, { principal });
    expect(defaultModeResult.allowed).toBe(true);
  });

  it('returns false for mode mismatch in hasField lookups', () => {
    const evaluator = createFieldAccessEvaluator<UserRecord>([
      createFieldAccessPolicy<UserRecord, 'amount'>({
        fieldKey: 'amount',
        mode: 'read',
      }),
    ]);

    expect(evaluator.hasField('amount', 'write')).toBe(false);
  });
});
