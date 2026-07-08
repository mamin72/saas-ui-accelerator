export interface FieldAccessPrincipal {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
  tenantId?: string;
}

export type FieldAccessMode = 'read' | 'write';

export type FieldKeyOf<TRecord extends Record<string, unknown>> = Extract<keyof TRecord, string | number>;

export type FieldAccessCondition<TRecord extends Record<string, unknown>> = {
  [K in FieldKeyOf<TRecord>]:
    | {
        field: K;
        operator: 'equals';
        value: TRecord[K];
      }
    | {
        field: K;
        operator: 'not-equals';
        value: TRecord[K];
      }
    | {
        field: K;
        operator: 'in';
        value: readonly TRecord[K][];
      }
    | {
        field: K;
        operator: 'not-in';
        value: readonly TRecord[K][];
      }
    | (TRecord[K] extends boolean
        ? {
            field: K;
            operator: 'is-true' | 'is-false';
          }
        : never);
}[FieldKeyOf<TRecord>];

export interface FieldAccessPolicy<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord> = FieldKeyOf<TRecord>
> {
  fieldKey: TField;
  mode: FieldAccessMode;
  requiredRoles: readonly string[];
  requiredPermissions: readonly string[];
  requireAllPermissions: boolean;
  denyWhenUnauthenticated: boolean;
  conditions: readonly FieldAccessCondition<TRecord>[];
}

export interface FieldAccessContext<
  TRecord extends Record<string, unknown>,
  TPrincipal extends FieldAccessPrincipal = FieldAccessPrincipal
> {
  principal?: TPrincipal;
  record?: TRecord;
}

export type FieldAccessReasonCode =
  | 'unauthenticated'
  | 'missing-roles'
  | 'missing-permissions'
  | 'missing-record-context'
  | 'conditions-not-met'
  | 'field-not-registered';

export interface FieldAccessReason {
  code: FieldAccessReasonCode;
  message: string;
}

export interface FieldAccessResult<TRecord extends Record<string, unknown>> {
  fieldKey: string;
  mode: FieldAccessMode;
  allowed: boolean;
  decision: 'allow' | 'deny';
  reasons: readonly FieldAccessReason[];
  missingRoles: readonly string[];
  missingPermissions: readonly string[];
  failedConditions: readonly FieldAccessCondition<TRecord>[];
}

export function createFieldAccessPolicy<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(input: {
  fieldKey: TField;
  mode?: FieldAccessMode;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  denyWhenUnauthenticated?: boolean;
  conditions?: readonly FieldAccessCondition<TRecord>[];
}): FieldAccessPolicy<TRecord, TField> {
  const fieldKey = normalizeFieldKey(input.fieldKey);

  return {
    fieldKey: fieldKey as TField,
    mode: input.mode ?? 'read',
    requiredRoles: normalizeList(input.requiredRoles),
    requiredPermissions: normalizeList(input.requiredPermissions),
    requireAllPermissions: input.requireAllPermissions ?? true,
    denyWhenUnauthenticated: input.denyWhenUnauthenticated ?? true,
    conditions: input.conditions ?? [],
  };
}

export function evaluateFieldAccess<TRecord extends Record<string, unknown>>(
  policy: FieldAccessPolicy<TRecord>,
  context: FieldAccessContext<TRecord> = {}
): FieldAccessResult<TRecord> {
  const reasons: FieldAccessReason[] = [];
  const missingRoles: string[] = [];
  const missingPermissions: string[] = [];
  const failedConditions: Array<FieldAccessCondition<TRecord>> = [];

  const principal = context.principal;

  if (!principal) {
    if (policy.denyWhenUnauthenticated) {
      reasons.push({
        code: 'unauthenticated',
        message: 'Principal is required for this field policy.',
      });
    }

    return toResult(policy.fieldKey, policy.mode, reasons, missingRoles, missingPermissions, failedConditions);
  }

  for (const role of policy.requiredRoles) {
    if (!principal.roles.includes(role)) {
      missingRoles.push(role);
    }
  }

  if (missingRoles.length > 0) {
    reasons.push({
      code: 'missing-roles',
      message: `Missing required roles: ${missingRoles.join(', ')}`,
    });
  }

  if (policy.requiredPermissions.length > 0) {
    if (policy.requireAllPermissions) {
      for (const permission of policy.requiredPermissions) {
        if (!principal.permissions.includes(permission)) {
          missingPermissions.push(permission);
        }
      }
    } else if (!policy.requiredPermissions.some((permission) => principal.permissions.includes(permission))) {
      missingPermissions.push(...policy.requiredPermissions);
    }

    if (missingPermissions.length > 0) {
      reasons.push({
        code: 'missing-permissions',
        message: `Missing required permissions: ${missingPermissions.join(', ')}`,
      });
    }
  }

  if (policy.conditions.length > 0) {
    if (!context.record) {
      reasons.push({
        code: 'missing-record-context',
        message: `Record context is required to evaluate field policy for '${String(policy.fieldKey)}'.`,
      });
    } else {
      for (const condition of policy.conditions) {
        if (!evaluateCondition(condition, context.record)) {
          failedConditions.push(condition);
        }
      }

      if (failedConditions.length > 0) {
        reasons.push({
          code: 'conditions-not-met',
          message: `Field policy conditions failed (${failedConditions.length}/${policy.conditions.length}).`,
        });
      }
    }
  }

  return toResult(policy.fieldKey, policy.mode, reasons, missingRoles, missingPermissions, failedConditions);
}

export function createFieldAccessEvaluator<TRecord extends Record<string, unknown>>(
  policies: readonly FieldAccessPolicy<TRecord>[]
): {
  evaluate(
    fieldKey: FieldKeyOf<TRecord> | string | number,
    mode?: FieldAccessMode,
    context?: FieldAccessContext<TRecord>
  ): FieldAccessResult<TRecord>;
  hasField(fieldKey: FieldKeyOf<TRecord> | string | number, mode?: FieldAccessMode): boolean;
  listFields(mode?: FieldAccessMode): readonly string[];
} {
  const entries = new Map<string, FieldAccessPolicy<TRecord>>();

  for (const policy of policies) {
    entries.set(toPolicyMapKey(policy.fieldKey, policy.mode), policy);
  }

  return {
    evaluate(
      fieldKey: FieldKeyOf<TRecord> | string | number,
      mode: FieldAccessMode = 'read',
      context: FieldAccessContext<TRecord> = {}
    ): FieldAccessResult<TRecord> {
      const normalizedFieldKey = normalizeFieldKey(fieldKey);
      const policy = entries.get(toPolicyMapKey(normalizedFieldKey, mode));

      if (!policy) {
        return {
          fieldKey: normalizedFieldKey,
          mode,
          allowed: false,
          decision: 'deny',
          missingRoles: [],
          missingPermissions: [],
          failedConditions: [],
          reasons: [
            {
              code: 'field-not-registered',
              message: `No field access policy is registered for '${mode}:${normalizedFieldKey}'.`,
            },
          ],
        };
      }

      return evaluateFieldAccess(policy, context);
    },
    hasField(fieldKey: FieldKeyOf<TRecord> | string | number, mode: FieldAccessMode = 'read'): boolean {
      return entries.has(toPolicyMapKey(fieldKey, mode));
    },
    listFields(mode?: FieldAccessMode): readonly string[] {
      const keys = Array.from(entries.values())
        .filter((policy) => (mode ? policy.mode === mode : true))
        .map((policy) => String(policy.fieldKey));

      return Array.from(new Set(keys)).sort((left, right) => left.localeCompare(right));
    },
  };
}

export function fieldEquals<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(field: TField, value: TRecord[TField]): FieldAccessCondition<TRecord> {
  return { field, operator: 'equals', value };
}

export function fieldNotEquals<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(field: TField, value: TRecord[TField]): FieldAccessCondition<TRecord> {
  return { field, operator: 'not-equals', value };
}

export function fieldIn<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(field: TField, value: readonly TRecord[TField][]): FieldAccessCondition<TRecord> {
  return { field, operator: 'in', value };
}

export function fieldNotIn<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(field: TField, value: readonly TRecord[TField][]): FieldAccessCondition<TRecord> {
  return { field, operator: 'not-in', value };
}

export function fieldIsTrue<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(field: TRecord[TField] extends boolean ? TField : never): FieldAccessCondition<TRecord> {
  return { field, operator: 'is-true' } as unknown as FieldAccessCondition<TRecord>;
}

export function fieldIsFalse<
  TRecord extends Record<string, unknown>,
  TField extends FieldKeyOf<TRecord>
>(field: TRecord[TField] extends boolean ? TField : never): FieldAccessCondition<TRecord> {
  return { field, operator: 'is-false' } as unknown as FieldAccessCondition<TRecord>;
}

function evaluateCondition<TRecord extends Record<string, unknown>>(
  condition: FieldAccessCondition<TRecord>,
  record: TRecord
): boolean {
  const fieldValue = record[condition.field as keyof TRecord];

  switch (condition.operator) {
    case 'equals':
      return areValuesEqual(fieldValue, condition.value);
    case 'not-equals':
      return !areValuesEqual(fieldValue, condition.value);
    case 'in':
      return condition.value.some((expected) => areValuesEqual(fieldValue, expected));
    case 'not-in':
      return !condition.value.some((expected) => areValuesEqual(fieldValue, expected));
    case 'is-true':
      return fieldValue === true;
    case 'is-false':
      return fieldValue === false;
  }

  const exhaustiveCondition: never = condition;
  return exhaustiveCondition;
}

function normalizeFieldKey(fieldKey: string | number): string {
  const normalized = String(fieldKey).trim();
  if (normalized.length === 0) {
    throw new Error('Field access policy key must be non-empty.');
  }

  return normalized;
}

function normalizeList(values?: readonly string[]): readonly string[] {
  if (!values) {
    return [];
  }

  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

function toPolicyMapKey(fieldKey: string | number, mode: FieldAccessMode): string {
  return `${mode}:${normalizeFieldKey(fieldKey)}`;
}

function toResult<TRecord extends Record<string, unknown>>(
  fieldKey: string | number,
  mode: FieldAccessMode,
  reasons: readonly FieldAccessReason[],
  missingRoles: readonly string[],
  missingPermissions: readonly string[],
  failedConditions: readonly FieldAccessCondition<TRecord>[]
): FieldAccessResult<TRecord> {
  const allowed = reasons.length === 0;

  return {
    fieldKey: normalizeFieldKey(fieldKey),
    mode,
    allowed,
    decision: allowed ? 'allow' : 'deny',
    reasons,
    missingRoles,
    missingPermissions,
    failedConditions,
  };
}

function areValuesEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }

  return left === right;
}
