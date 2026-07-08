export type AuthRecoveryFlow = 'password-recovery' | 'magic-link';

export type AuthTokenPurpose = 'password-reset' | 'magic-link';

export interface AuthRecoveryRequestContract {
  flow: AuthRecoveryFlow;
  email: string;
  tenantId?: string;
  redirectUri?: string;
  requestedAtUtc: string;
}

export interface AuthTokenLifecycle {
  tokenId: string;
  purpose: AuthTokenPurpose;
  subject: string;
  issuedAtUtc: string;
  expiresAtUtc: string;
  consumedAtUtc?: string;
  expired: boolean;
}

export interface AuthTokenExpiryResult {
  expired: boolean;
  expiresInSeconds: number;
}

export interface AuthFlowCallbacks {
  onRequested?: (request: AuthRecoveryRequestContract) => void;
  onDelivered?: (request: AuthRecoveryRequestContract, token: AuthTokenLifecycle) => void;
  onConsumed?: (token: AuthTokenLifecycle) => void;
  onExpired?: (token: AuthTokenLifecycle) => void;
  onFailed?: (error: unknown) => void;
}

export interface AuthFlowExecutionResult {
  request: AuthRecoveryRequestContract;
  token: AuthTokenLifecycle;
  consumed: boolean;
  expired: boolean;
}

export function createPasswordRecoveryRequestContract(input: {
  email: string;
  tenantId?: string;
  redirectUri?: string;
  requestedAtUtc?: string;
}): AuthRecoveryRequestContract {
  return createRecoveryRequestContract('password-recovery', input);
}

export function createMagicLinkRequestContract(input: {
  email: string;
  tenantId?: string;
  redirectUri?: string;
  requestedAtUtc?: string;
}): AuthRecoveryRequestContract {
  return createRecoveryRequestContract('magic-link', input);
}

export function issueAuthTokenLifecycle(input: {
  subject: string;
  purpose: AuthTokenPurpose;
  ttlSeconds: number;
  issuedAtUtc?: string;
  tokenIdFactory?: () => string;
}): AuthTokenLifecycle {
  const subject = input.subject.trim();
  if (subject.length === 0) {
    throw new Error('Token subject must be non-empty.');
  }

  if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds <= 0) {
    throw new Error('Token ttlSeconds must be a positive integer.');
  }

  const issuedAtUtc = normalizeUtcTimestamp(input.issuedAtUtc ?? new Date().toISOString(), 'Token issuedAtUtc');
  const issuedAtMs = new Date(issuedAtUtc).getTime();
  const expiresAtUtc = new Date(issuedAtMs + input.ttlSeconds * 1000).toISOString();

  return {
    tokenId: input.tokenIdFactory ? input.tokenIdFactory() : `${input.purpose}-${issuedAtMs}`,
    purpose: input.purpose,
    subject,
    issuedAtUtc,
    expiresAtUtc,
    consumedAtUtc: undefined,
    expired: false,
  };
}

export function evaluateAuthTokenExpiry(input: {
  issuedAtUtc: string;
  expiresAtUtc: string;
  nowUtc?: string;
}): AuthTokenExpiryResult {
  const issuedAtUtc = normalizeUtcTimestamp(input.issuedAtUtc, 'Token issuedAtUtc');
  const expiresAtUtc = normalizeUtcTimestamp(input.expiresAtUtc, 'Token expiresAtUtc');
  const nowUtc = normalizeUtcTimestamp(input.nowUtc ?? new Date().toISOString(), 'Token nowUtc');

  const issuedAtMs = new Date(issuedAtUtc).getTime();
  const expiresAtMs = new Date(expiresAtUtc).getTime();
  const nowMs = new Date(nowUtc).getTime();

  if (expiresAtMs < issuedAtMs) {
    throw new Error('Token expiresAtUtc must be greater than or equal to issuedAtUtc.');
  }

  const remainingSeconds = Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
  return {
    expired: nowMs >= expiresAtMs,
    expiresInSeconds: remainingSeconds,
  };
}

export function consumeAuthTokenLifecycle(input: {
  token: AuthTokenLifecycle;
  consumedAtUtc?: string;
}): AuthTokenLifecycle {
  if (input.token.consumedAtUtc) {
    return {
      ...input.token,
      expired: true,
    };
  }

  const consumedAtUtc = normalizeUtcTimestamp(input.consumedAtUtc ?? new Date().toISOString(), 'Token consumedAtUtc');
  const expiry = evaluateAuthTokenExpiry({
    issuedAtUtc: input.token.issuedAtUtc,
    expiresAtUtc: input.token.expiresAtUtc,
    nowUtc: consumedAtUtc,
  });

  if (expiry.expired) {
    return {
      ...input.token,
      expired: true,
    };
  }

  return {
    ...input.token,
    consumedAtUtc,
    expired: false,
  };
}

export async function executeRecoveryOrMagicLinkFlow(input: {
  request: AuthRecoveryRequestContract;
  token: AuthTokenLifecycle;
  callbacks?: AuthFlowCallbacks;
  shouldConsumeToken?: boolean;
  nowUtc?: string;
}): Promise<AuthFlowExecutionResult> {
  await Promise.resolve();
  const callbacks = input.callbacks;

  try {
    callbacks?.onRequested?.(input.request);

    const expiry = evaluateAuthTokenExpiry({
      issuedAtUtc: input.token.issuedAtUtc,
      expiresAtUtc: input.token.expiresAtUtc,
      nowUtc: input.nowUtc,
    });

    if (expiry.expired) {
      const expiredToken = {
        ...input.token,
        expired: true,
      };

      callbacks?.onExpired?.(expiredToken);
      return {
        request: input.request,
        token: expiredToken,
        consumed: false,
        expired: true,
      };
    }

    callbacks?.onDelivered?.(input.request, input.token);

    const shouldConsumeToken = input.shouldConsumeToken ?? true;
    if (!shouldConsumeToken) {
      return {
        request: input.request,
        token: input.token,
        consumed: false,
        expired: false,
      };
    }

    const consumedToken = consumeAuthTokenLifecycle({
      token: input.token,
      consumedAtUtc: input.nowUtc,
    });

    callbacks?.onConsumed?.(consumedToken);

    return {
      request: input.request,
      token: consumedToken,
      consumed: true,
      expired: false,
    };
  } catch (error) {
    callbacks?.onFailed?.(error);
    throw error;
  }
}

function createRecoveryRequestContract(
  flow: AuthRecoveryFlow,
  input: {
    email: string;
    tenantId?: string;
    redirectUri?: string;
    requestedAtUtc?: string;
  }
): AuthRecoveryRequestContract {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Recovery request email '${input.email}' is invalid.`);
  }

  const redirectUri = normalizeOptionalString(input.redirectUri);
  if (redirectUri && !/^https?:\/\//.test(redirectUri)) {
    throw new Error('Recovery request redirectUri must be an absolute http/https URL when provided.');
  }

  return {
    flow,
    email,
    tenantId: normalizeOptionalString(input.tenantId),
    redirectUri,
    requestedAtUtc: normalizeUtcTimestamp(input.requestedAtUtc ?? new Date().toISOString(), 'Recovery request requestedAtUtc'),
  };
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeUtcTimestamp(value: string, label: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} '${value}' is invalid.`);
  }

  return parsed.toISOString();
}
