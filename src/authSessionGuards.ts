export type SessionGuardTarget = 'route' | 'component';

export type SessionStatus = 'authenticated' | 'unauthenticated' | 'expired';

export interface SessionSnapshot {
  userId?: string;
  tenantId?: string;
  roles: readonly string[];
  permissions: readonly string[];
  status: SessionStatus;
  expiresAtUtc?: string;
}

export interface SessionGuardContract {
  target: SessionGuardTarget;
  key: string;
  requireAuthenticated: boolean;
  requiredRoles: readonly string[];
  requiredPermissions: readonly string[];
  requireAllRoles: boolean;
  requireAllPermissions: boolean;
  fallbackPath?: string;
  fallbackComponentKey?: string;
  revalidateOnAccess: boolean;
}

export interface SessionGuardEvaluationResult {
  allowed: boolean;
  reason:
    | 'allowed'
    | 'unauthenticated'
    | 'expired'
    | 'missing-role'
    | 'missing-permission'
    | 'revalidation-failed';
  fallbackPath?: string;
  fallbackComponentKey?: string;
}

export function createRouteSessionGuardContract(input: {
  routeKey: string;
  requireAuthenticated?: boolean;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
  fallbackPath?: string;
  revalidateOnAccess?: boolean;
}): SessionGuardContract {
  const routeKey = input.routeKey.trim();
  if (routeKey.length === 0) {
    throw new Error('Route session guard routeKey must be non-empty.');
  }

  return {
    target: 'route',
    key: routeKey,
    requireAuthenticated: input.requireAuthenticated ?? true,
    requiredRoles: normalizeTokens(input.requiredRoles),
    requiredPermissions: normalizeTokens(input.requiredPermissions),
    requireAllRoles: input.requireAllRoles ?? false,
    requireAllPermissions: input.requireAllPermissions ?? true,
    fallbackPath: normalizeOptionalPath(input.fallbackPath),
    fallbackComponentKey: undefined,
    revalidateOnAccess: input.revalidateOnAccess ?? false,
  };
}

export function createComponentSessionGuardContract(input: {
  componentKey: string;
  requireAuthenticated?: boolean;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
  fallbackComponentKey?: string;
  revalidateOnAccess?: boolean;
}): SessionGuardContract {
  const componentKey = input.componentKey.trim();
  if (componentKey.length === 0) {
    throw new Error('Component session guard componentKey must be non-empty.');
  }

  return {
    target: 'component',
    key: componentKey,
    requireAuthenticated: input.requireAuthenticated ?? true,
    requiredRoles: normalizeTokens(input.requiredRoles),
    requiredPermissions: normalizeTokens(input.requiredPermissions),
    requireAllRoles: input.requireAllRoles ?? false,
    requireAllPermissions: input.requireAllPermissions ?? true,
    fallbackPath: undefined,
    fallbackComponentKey: normalizeOptionalToken(input.fallbackComponentKey),
    revalidateOnAccess: input.revalidateOnAccess ?? false,
  };
}

export function evaluateSessionGuard(input: {
  guard: SessionGuardContract;
  session?: SessionSnapshot;
  revalidation?: { ok: boolean };
}): SessionGuardEvaluationResult {
  const session = input.session;

  if (input.guard.requireAuthenticated) {
    if (!session || session.status === 'unauthenticated') {
      return deny('unauthenticated', input.guard);
    }

    if (session.status === 'expired' || isSessionExpired(session)) {
      return deny('expired', input.guard);
    }
  }

  if (input.guard.revalidateOnAccess && input.revalidation && !input.revalidation.ok) {
    return deny('revalidation-failed', input.guard);
  }

  const hasRoles = evaluateClaimSet({
    principalClaims: session?.roles ?? [],
    requiredClaims: input.guard.requiredRoles,
    requireAll: input.guard.requireAllRoles,
  });

  if (!hasRoles) {
    return deny('missing-role', input.guard);
  }

  const hasPermissions = evaluateClaimSet({
    principalClaims: session?.permissions ?? [],
    requiredClaims: input.guard.requiredPermissions,
    requireAll: input.guard.requireAllPermissions,
  });

  if (!hasPermissions) {
    return deny('missing-permission', input.guard);
  }

  return {
    allowed: true,
    reason: 'allowed',
    fallbackPath: input.guard.fallbackPath,
    fallbackComponentKey: input.guard.fallbackComponentKey,
  };
}

export async function evaluateSessionGuardWithRevalidation(input: {
  guard: SessionGuardContract;
  session?: SessionSnapshot;
  revalidate?: () => Promise<{ ok: boolean }>;
}): Promise<SessionGuardEvaluationResult> {
  if (!input.guard.revalidateOnAccess || !input.revalidate) {
    return evaluateSessionGuard({
      guard: input.guard,
      session: input.session,
    });
  }

  const revalidation = await input.revalidate();

  return evaluateSessionGuard({
    guard: input.guard,
    session: input.session,
    revalidation,
  });
}

function evaluateClaimSet(input: {
  principalClaims: readonly string[];
  requiredClaims: readonly string[];
  requireAll: boolean;
}): boolean {
  if (input.requiredClaims.length === 0) {
    return true;
  }

  if (input.requireAll) {
    return input.requiredClaims.every((claim) => input.principalClaims.includes(claim));
  }

  return input.requiredClaims.some((claim) => input.principalClaims.includes(claim));
}

function normalizeTokens(values: readonly string[] | undefined): readonly string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function normalizeOptionalToken(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalPath(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalToken(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function isSessionExpired(session: SessionSnapshot): boolean {
  if (!session.expiresAtUtc) {
    return false;
  }

  const expiresAt = new Date(session.expiresAtUtc);
  if (Number.isNaN(expiresAt.getTime())) {
    return true;
  }

  return Date.now() >= expiresAt.getTime();
}

function deny(reason: SessionGuardEvaluationResult['reason'], guard: SessionGuardContract): SessionGuardEvaluationResult {
  return {
    allowed: false,
    reason,
    fallbackPath: guard.fallbackPath,
    fallbackComponentKey: guard.fallbackComponentKey,
  };
}
