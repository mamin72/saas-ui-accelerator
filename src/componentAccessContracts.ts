export interface ComponentAccessPrincipal {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
  tenantId?: string;
}

export interface ComponentAccessPolicy {
  componentKey: string;
  requiredRoles: readonly string[];
  requiredPermissions: readonly string[];
  requireAllPermissions: boolean;
  denyWhenUnauthenticated: boolean;
}

export interface ActionAccessPolicy {
  componentKey: string;
  actionKey: string;
  requiredRoles: readonly string[];
  requiredPermissions: readonly string[];
  requireAllPermissions: boolean;
  denyWhenUnauthenticated: boolean;
}

export type ComponentActionAccessReasonCode =
  | 'unauthenticated'
  | 'missing-roles'
  | 'missing-permissions'
  | 'component-not-registered'
  | 'action-not-registered';

export interface ComponentActionAccessReason {
  code: ComponentActionAccessReasonCode;
  message: string;
}

export interface ComponentAccessResult {
  scope: 'component';
  componentKey: string;
  allowed: boolean;
  decision: 'allow' | 'deny';
  reasons: readonly ComponentActionAccessReason[];
  missingRoles: readonly string[];
  missingPermissions: readonly string[];
}

export interface ActionAccessResult {
  scope: 'action';
  componentKey: string;
  actionKey: string;
  allowed: boolean;
  decision: 'allow' | 'deny';
  reasons: readonly ComponentActionAccessReason[];
  missingRoles: readonly string[];
  missingPermissions: readonly string[];
}

export function createComponentAccessPolicy(input: {
  componentKey: string;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  denyWhenUnauthenticated?: boolean;
}): ComponentAccessPolicy {
  const componentKey = normalizeKey(input.componentKey);

  return {
    componentKey,
    requiredRoles: normalizeList(input.requiredRoles),
    requiredPermissions: normalizeList(input.requiredPermissions),
    requireAllPermissions: input.requireAllPermissions ?? true,
    denyWhenUnauthenticated: input.denyWhenUnauthenticated ?? true,
  };
}

export function createActionAccessPolicy(input: {
  componentKey: string;
  actionKey: string;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  denyWhenUnauthenticated?: boolean;
}): ActionAccessPolicy {
  const componentKey = normalizeKey(input.componentKey);
  const actionKey = normalizeActionKey(input.actionKey);

  return {
    componentKey,
    actionKey,
    requiredRoles: normalizeList(input.requiredRoles),
    requiredPermissions: normalizeList(input.requiredPermissions),
    requireAllPermissions: input.requireAllPermissions ?? true,
    denyWhenUnauthenticated: input.denyWhenUnauthenticated ?? true,
  };
}

export function evaluateComponentAccess(
  policy: ComponentAccessPolicy,
  principal?: ComponentAccessPrincipal
): ComponentAccessResult {
  const reasons: ComponentActionAccessReason[] = [];
  const missingRoles: string[] = [];
  const missingPermissions: string[] = [];

  evaluatePolicy(policy, principal, reasons, missingRoles, missingPermissions);

  return toComponentResult(policy.componentKey, reasons, missingRoles, missingPermissions);
}

export function evaluateActionAccess(
  policy: ActionAccessPolicy,
  principal?: ComponentAccessPrincipal
): ActionAccessResult {
  const reasons: ComponentActionAccessReason[] = [];
  const missingRoles: string[] = [];
  const missingPermissions: string[] = [];

  evaluatePolicy(policy, principal, reasons, missingRoles, missingPermissions);

  return toActionResult(policy.componentKey, policy.actionKey, reasons, missingRoles, missingPermissions);
}

export function createComponentAccessEvaluator(policies: readonly ComponentAccessPolicy[]): {
  evaluate(componentKey: string, principal?: ComponentAccessPrincipal): ComponentAccessResult;
  hasComponent(componentKey: string): boolean;
  listComponentKeys(): readonly string[];
} {
  const entries = new Map<string, ComponentAccessPolicy>();

  for (const policy of policies) {
    entries.set(policy.componentKey, policy);
  }

  return {
    evaluate(componentKey: string, principal?: ComponentAccessPrincipal): ComponentAccessResult {
      const normalizedComponentKey = normalizeKey(componentKey);
      const policy = entries.get(normalizedComponentKey);

      if (!policy) {
        return {
          scope: 'component',
          componentKey: normalizedComponentKey,
          allowed: false,
          decision: 'deny',
          missingRoles: [],
          missingPermissions: [],
          reasons: [
            {
              code: 'component-not-registered',
              message: `No component access policy is registered for '${normalizedComponentKey}'.`,
            },
          ],
        };
      }

      return evaluateComponentAccess(policy, principal);
    },
    hasComponent(componentKey: string): boolean {
      return entries.has(componentKey.trim());
    },
    listComponentKeys(): readonly string[] {
      return Array.from(entries.keys()).sort((left, right) => left.localeCompare(right));
    },
  };
}

export function createActionAccessEvaluator(policies: readonly ActionAccessPolicy[]): {
  evaluate(componentKey: string, actionKey: string, principal?: ComponentAccessPrincipal): ActionAccessResult;
  hasAction(componentKey: string, actionKey: string): boolean;
  listActions(componentKey?: string): readonly string[];
} {
  const entries = new Map<string, Map<string, ActionAccessPolicy>>();

  for (const policy of policies) {
    const componentActions = entries.get(policy.componentKey) ?? new Map<string, ActionAccessPolicy>();
    componentActions.set(policy.actionKey, policy);
    entries.set(policy.componentKey, componentActions);
  }

  return {
    evaluate(componentKey: string, actionKey: string, principal?: ComponentAccessPrincipal): ActionAccessResult {
      const normalizedComponentKey = normalizeKey(componentKey);
      const normalizedActionKey = normalizeActionKey(actionKey);
      const componentActions = entries.get(normalizedComponentKey);
      const policy = componentActions?.get(normalizedActionKey);

      if (!policy) {
        return {
          scope: 'action',
          componentKey: normalizedComponentKey,
          actionKey: normalizedActionKey,
          allowed: false,
          decision: 'deny',
          missingRoles: [],
          missingPermissions: [],
          reasons: [
            {
              code: 'action-not-registered',
              message: `No action access policy is registered for '${normalizedComponentKey}:${normalizedActionKey}'.`,
            },
          ],
        };
      }

      return evaluateActionAccess(policy, principal);
    },
    hasAction(componentKey: string, actionKey: string): boolean {
      const componentActions = entries.get(componentKey.trim());
      return componentActions?.has(actionKey.trim()) ?? false;
    },
    listActions(componentKey?: string): readonly string[] {
      if (componentKey == null) {
        const allActionKeys = Array.from(entries.values()).flatMap((actions) => Array.from(actions.keys()));
        return Array.from(new Set(allActionKeys)).sort((left, right) => left.localeCompare(right));
      }

      const componentActions = entries.get(componentKey.trim());
      if (!componentActions) {
        return [];
      }

      return Array.from(componentActions.keys()).sort((left, right) => left.localeCompare(right));
    },
  };
}

function evaluatePolicy(
  policy: {
    requiredRoles: readonly string[];
    requiredPermissions: readonly string[];
    requireAllPermissions: boolean;
    denyWhenUnauthenticated: boolean;
  },
  principal: ComponentAccessPrincipal | undefined,
  reasons: ComponentActionAccessReason[],
  missingRoles: string[],
  missingPermissions: string[]
): void {
  if (!principal) {
    if (policy.denyWhenUnauthenticated) {
      reasons.push({
        code: 'unauthenticated',
        message: 'Principal is required for this policy.',
      });
    }

    return;
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
}

function normalizeKey(componentKey: string): string {
  const normalized = componentKey.trim();
  if (normalized.length === 0) {
    throw new Error('Component access policy key must be non-empty.');
  }

  return normalized;
}

function normalizeActionKey(actionKey: string): string {
  const normalized = actionKey.trim();
  if (normalized.length === 0) {
    throw new Error('Action access policy key must be non-empty.');
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

function toComponentResult(
  componentKey: string,
  reasons: readonly ComponentActionAccessReason[],
  missingRoles: readonly string[],
  missingPermissions: readonly string[]
): ComponentAccessResult {
  const allowed = reasons.length === 0;

  return {
    scope: 'component',
    componentKey,
    allowed,
    decision: allowed ? 'allow' : 'deny',
    reasons,
    missingRoles,
    missingPermissions,
  };
}

function toActionResult(
  componentKey: string,
  actionKey: string,
  reasons: readonly ComponentActionAccessReason[],
  missingRoles: readonly string[],
  missingPermissions: readonly string[]
): ActionAccessResult {
  const allowed = reasons.length === 0;

  return {
    scope: 'action',
    componentKey,
    actionKey,
    allowed,
    decision: allowed ? 'allow' : 'deny',
    reasons,
    missingRoles,
    missingPermissions,
  };
}
