export interface PageAccessPrincipal {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
  tenantId?: string;
}

export interface PageAccessContract {
  pageKey: string;
  requiredRoles: readonly string[];
  requiredPermissions: readonly string[];
  requireAllPermissions: boolean;
  allowedTenants: readonly string[];
  denyWhenUnauthenticated: boolean;
}

export type PageAccessReasonCode =
  | 'unauthenticated'
  | 'missing-roles'
  | 'missing-permissions'
  | 'tenant-mismatch'
  | 'page-not-registered';

export interface PageAccessReason {
  code: PageAccessReasonCode;
  message: string;
}

export interface PageAccessResult {
  pageKey: string;
  allowed: boolean;
  decision: 'allow' | 'deny';
  reasons: readonly PageAccessReason[];
  missingRoles: readonly string[];
  missingPermissions: readonly string[];
}

export function createPageAccessContract(input: {
  pageKey: string;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  allowedTenants?: readonly string[];
  denyWhenUnauthenticated?: boolean;
}): PageAccessContract {
  const pageKey = input.pageKey.trim();
  if (pageKey.length === 0) {
    throw new Error('Page access contract key must be non-empty.');
  }

  return {
    pageKey,
    requiredRoles: normalizeList(input.requiredRoles),
    requiredPermissions: normalizeList(input.requiredPermissions),
    requireAllPermissions: input.requireAllPermissions ?? true,
    allowedTenants: normalizeList(input.allowedTenants),
    denyWhenUnauthenticated: input.denyWhenUnauthenticated ?? true,
  };
}

export function evaluatePageAccess(
  contract: PageAccessContract,
  principal?: PageAccessPrincipal
): PageAccessResult {
  const reasons: PageAccessReason[] = [];
  const missingRoles: string[] = [];
  const missingPermissions: string[] = [];

  if (!principal) {
    if (contract.denyWhenUnauthenticated) {
      reasons.push({
        code: 'unauthenticated',
        message: 'Principal is required for this page.',
      });
    }

    return toResult(contract.pageKey, reasons, missingRoles, missingPermissions);
  }

  for (const role of contract.requiredRoles) {
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

  if (contract.requiredPermissions.length > 0) {
    if (contract.requireAllPermissions) {
      for (const permission of contract.requiredPermissions) {
        if (!principal.permissions.includes(permission)) {
          missingPermissions.push(permission);
        }
      }
    } else if (!contract.requiredPermissions.some((permission) => principal.permissions.includes(permission))) {
      missingPermissions.push(...contract.requiredPermissions);
    }

    if (missingPermissions.length > 0) {
      reasons.push({
        code: 'missing-permissions',
        message: `Missing required permissions: ${missingPermissions.join(', ')}`,
      });
    }
  }

  if (contract.allowedTenants.length > 0 && !contract.allowedTenants.includes(principal.tenantId ?? '')) {
    reasons.push({
      code: 'tenant-mismatch',
      message: `Tenant '${principal.tenantId ?? 'unknown'}' is not allowed for page '${contract.pageKey}'.`,
    });
  }

  return toResult(contract.pageKey, reasons, missingRoles, missingPermissions);
}

export function createPageAccessEvaluator(contracts: readonly PageAccessContract[]): {
  evaluate(pageKey: string, principal?: PageAccessPrincipal): PageAccessResult;
  hasPage(pageKey: string): boolean;
  listPageKeys(): readonly string[];
} {
  const entries = new Map<string, PageAccessContract>();

  for (const contract of contracts) {
    entries.set(contract.pageKey, contract);
  }

  return {
    evaluate(pageKey: string, principal?: PageAccessPrincipal): PageAccessResult {
      const normalizedPageKey = pageKey.trim();
      const contract = entries.get(normalizedPageKey);

      if (!contract) {
        return {
          pageKey: normalizedPageKey,
          allowed: false,
          decision: 'deny',
          missingRoles: [],
          missingPermissions: [],
          reasons: [
            {
              code: 'page-not-registered',
              message: `No page access contract is registered for '${normalizedPageKey}'.`,
            },
          ],
        };
      }

      return evaluatePageAccess(contract, principal);
    },
    hasPage(pageKey: string): boolean {
      return entries.has(pageKey.trim());
    },
    listPageKeys(): readonly string[] {
      return Array.from(entries.keys()).sort((left, right) => left.localeCompare(right));
    },
  };
}

function normalizeList(values?: readonly string[]): readonly string[] {
  if (!values) {
    return [];
  }

  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

function toResult(
  pageKey: string,
  reasons: readonly PageAccessReason[],
  missingRoles: readonly string[],
  missingPermissions: readonly string[]
): PageAccessResult {
  const allowed = reasons.length === 0;

  return {
    pageKey,
    allowed,
    decision: allowed ? 'allow' : 'deny',
    reasons,
    missingRoles,
    missingPermissions,
  };
}
