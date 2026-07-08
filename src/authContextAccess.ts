export interface TenantAuthIdentity {
  tenantId: string;
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
}

export interface TenantAuthContext {
  activeTenantId: string;
  identities: readonly TenantAuthIdentity[];
}

export interface AuthAccessRequirement {
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
  requiredTenantId?: string;
}

export interface AuthAccessEvaluationResult {
  allowed: boolean;
  reason: 'allowed' | 'tenant-mismatch' | 'missing-role' | 'missing-permission' | 'identity-not-found';
  matchedIdentity?: TenantAuthIdentity;
}

export function createTenantAuthIdentity(input: {
  tenantId: string;
  userId: string;
  roles?: readonly string[];
  permissions?: readonly string[];
}): TenantAuthIdentity {
  const tenantId = input.tenantId.trim();
  const userId = input.userId.trim();

  if (tenantId.length === 0 || userId.length === 0) {
    throw new Error('Tenant auth identity tenantId and userId must be non-empty.');
  }

  return {
    tenantId,
    userId,
    roles: normalizeClaims(input.roles),
    permissions: normalizeClaims(input.permissions),
  };
}

export function createTenantAuthContext(input: {
  activeTenantId: string;
  identities: readonly TenantAuthIdentity[];
}): TenantAuthContext {
  const activeTenantId = input.activeTenantId.trim();
  if (activeTenantId.length === 0) {
    throw new Error('Tenant auth context activeTenantId must be non-empty.');
  }

  const identities = input.identities.filter((identity) => identity.tenantId.trim().length > 0);

  return {
    activeTenantId,
    identities,
  };
}

export function resolveActiveTenantIdentity(context: TenantAuthContext): TenantAuthIdentity | undefined {
  return context.identities.find((identity) => identity.tenantId === context.activeTenantId);
}

export function hasRequiredRoles(input: {
  identity: TenantAuthIdentity;
  requiredRoles?: readonly string[];
  requireAll?: boolean;
}): boolean {
  const requiredRoles = normalizeClaims(input.requiredRoles);
  if (requiredRoles.length === 0) {
    return true;
  }

  if (input.requireAll ?? false) {
    return requiredRoles.every((role) => input.identity.roles.includes(role));
  }

  return requiredRoles.some((role) => input.identity.roles.includes(role));
}

export function hasRequiredPermissions(input: {
  identity: TenantAuthIdentity;
  requiredPermissions?: readonly string[];
  requireAll?: boolean;
}): boolean {
  const requiredPermissions = normalizeClaims(input.requiredPermissions);
  if (requiredPermissions.length === 0) {
    return true;
  }

  if (input.requireAll ?? true) {
    return requiredPermissions.every((permission) => input.identity.permissions.includes(permission));
  }

  return requiredPermissions.some((permission) => input.identity.permissions.includes(permission));
}

export function evaluateTenantAuthAccess(input: {
  context: TenantAuthContext;
  requirement?: AuthAccessRequirement;
}): AuthAccessEvaluationResult {
  const requirement = input.requirement ?? {};
  const identity = resolveActiveTenantIdentity(input.context);

  if (!identity) {
    return {
      allowed: false,
      reason: 'identity-not-found',
    };
  }

  if (requirement.requiredTenantId && requirement.requiredTenantId.trim() !== identity.tenantId) {
    return {
      allowed: false,
      reason: 'tenant-mismatch',
      matchedIdentity: identity,
    };
  }

  const hasRoles = hasRequiredRoles({
    identity,
    requiredRoles: requirement.requiredRoles,
    requireAll: requirement.requireAllRoles,
  });

  if (!hasRoles) {
    return {
      allowed: false,
      reason: 'missing-role',
      matchedIdentity: identity,
    };
  }

  const hasPermissions = hasRequiredPermissions({
    identity,
    requiredPermissions: requirement.requiredPermissions,
    requireAll: requirement.requireAllPermissions,
  });

  if (!hasPermissions) {
    return {
      allowed: false,
      reason: 'missing-permission',
      matchedIdentity: identity,
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
    matchedIdentity: identity,
  };
}

export function createTenantAuthAccessEvaluator(context: TenantAuthContext): {
  evaluate(requirement?: AuthAccessRequirement): AuthAccessEvaluationResult;
  hasTenant(tenantId: string): boolean;
  listTenants(): readonly string[];
} {
  return {
    evaluate(requirement?: AuthAccessRequirement): AuthAccessEvaluationResult {
      return evaluateTenantAuthAccess({ context, requirement });
    },
    hasTenant(tenantId: string): boolean {
      return context.identities.some((identity) => identity.tenantId === tenantId.trim());
    },
    listTenants(): readonly string[] {
      return Array.from(new Set(context.identities.map((identity) => identity.tenantId))).sort((a, b) =>
        a.localeCompare(b)
      );
    },
  };
}

function normalizeClaims(values: readonly string[] | undefined): readonly string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))).sort((a, b) =>
    a.localeCompare(b)
  );
}
