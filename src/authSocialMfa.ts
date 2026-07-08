export type SocialProviderName = 'google' | 'microsoft' | 'github' | 'custom';

export interface SocialLoginAdapter {
  provider: SocialProviderName;
  clientId: string;
  scopes: readonly string[];
  authorizeUrl: string;
  exchangeCodeForIdentity(input: { code: string; redirectUri: string }): Promise<{ userId: string; email: string }>;
}

export interface SocialLoginStartResult {
  provider: SocialProviderName;
  authorizeUrl: string;
  state: string;
}

export type MfaMethod = 'totp' | 'sms' | 'email' | 'webauthn';

export interface MfaChallengeContract {
  challengeId: string;
  userId: string;
  method: MfaMethod;
  issuedAtUtc: string;
  expiresAtUtc: string;
  maxAttempts: number;
  attemptsUsed: number;
  verifiedAtUtc?: string;
}

export interface MfaChallengeEvaluationResult {
  allowed: boolean;
  reason: 'ok' | 'expired' | 'max-attempts-reached' | 'already-verified';
}

export function createSocialLoginAdapterContract(input: {
  provider: SocialProviderName;
  clientId: string;
  scopes?: readonly string[];
  authorizeUrl: string;
  exchangeCodeForIdentity: SocialLoginAdapter['exchangeCodeForIdentity'];
}): SocialLoginAdapter {
  const clientId = input.clientId.trim();
  if (clientId.length === 0) {
    throw new Error('Social login clientId must be non-empty.');
  }

  const authorizeUrl = input.authorizeUrl.trim();
  if (!/^https?:\/\//.test(authorizeUrl)) {
    throw new Error('Social login authorizeUrl must be an absolute http/https URL.');
  }

  const scopes = normalizeScopes(input.scopes);

  return {
    provider: input.provider,
    clientId,
    scopes,
    authorizeUrl,
    exchangeCodeForIdentity: input.exchangeCodeForIdentity,
  };
}

export function startSocialLogin(input: {
  adapter: SocialLoginAdapter;
  redirectUri: string;
  stateFactory?: () => string;
}): SocialLoginStartResult {
  const redirectUri = input.redirectUri.trim();
  if (!/^https?:\/\//.test(redirectUri)) {
    throw new Error('Social login redirectUri must be an absolute http/https URL.');
  }

  const state = input.stateFactory ? input.stateFactory() : `state-${Date.now()}`;
  const query = new URLSearchParams({
    client_id: input.adapter.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: input.adapter.scopes.join(' '),
    state,
  });

  return {
    provider: input.adapter.provider,
    authorizeUrl: `${input.adapter.authorizeUrl}?${query.toString()}`,
    state,
  };
}

export async function finishSocialLogin(input: {
  adapter: SocialLoginAdapter;
  code: string;
  redirectUri: string;
}): Promise<{ provider: SocialProviderName; userId: string; email: string }> {
  const code = input.code.trim();
  if (code.length === 0) {
    throw new Error('Social login code must be non-empty.');
  }

  const identity = await input.adapter.exchangeCodeForIdentity({
    code,
    redirectUri: input.redirectUri,
  });

  return {
    provider: input.adapter.provider,
    userId: identity.userId,
    email: identity.email,
  };
}

export function createMfaChallengeContract(input: {
  challengeId: string;
  userId: string;
  method: MfaMethod;
  issuedAtUtc?: string;
  ttlSeconds: number;
  maxAttempts?: number;
}): MfaChallengeContract {
  const challengeId = input.challengeId.trim();
  const userId = input.userId.trim();

  if (challengeId.length === 0 || userId.length === 0) {
    throw new Error('MFA challengeId and userId must be non-empty.');
  }

  if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds <= 0) {
    throw new Error('MFA ttlSeconds must be a positive integer.');
  }

  const issuedAtUtc = normalizeUtcTimestamp(input.issuedAtUtc ?? new Date().toISOString(), 'MFA issuedAtUtc');
  const maxAttempts = input.maxAttempts ?? 3;

  if (!Number.isInteger(maxAttempts) || maxAttempts <= 0) {
    throw new Error('MFA maxAttempts must be a positive integer.');
  }

  const issuedAtMs = new Date(issuedAtUtc).getTime();

  return {
    challengeId,
    userId,
    method: input.method,
    issuedAtUtc,
    expiresAtUtc: new Date(issuedAtMs + input.ttlSeconds * 1000).toISOString(),
    maxAttempts,
    attemptsUsed: 0,
    verifiedAtUtc: undefined,
  };
}

export function evaluateMfaChallenge(input: {
  challenge: MfaChallengeContract;
  nowUtc?: string;
}): MfaChallengeEvaluationResult {
  if (input.challenge.verifiedAtUtc) {
    return {
      allowed: false,
      reason: 'already-verified',
    };
  }

  if (input.challenge.attemptsUsed >= input.challenge.maxAttempts) {
    return {
      allowed: false,
      reason: 'max-attempts-reached',
    };
  }

  const nowUtc = normalizeUtcTimestamp(input.nowUtc ?? new Date().toISOString(), 'MFA nowUtc');
  const expired = new Date(nowUtc).getTime() >= new Date(input.challenge.expiresAtUtc).getTime();

  if (expired) {
    return {
      allowed: false,
      reason: 'expired',
    };
  }

  return {
    allowed: true,
    reason: 'ok',
  };
}

export function registerMfaAttempt(challenge: MfaChallengeContract): MfaChallengeContract {
  return {
    ...challenge,
    attemptsUsed: challenge.attemptsUsed + 1,
  };
}

export function verifyMfaChallenge(input: {
  challenge: MfaChallengeContract;
  nowUtc?: string;
}): MfaChallengeContract {
  const evaluation = evaluateMfaChallenge({
    challenge: input.challenge,
    nowUtc: input.nowUtc,
  });

  if (!evaluation.allowed) {
    return {
      ...input.challenge,
      attemptsUsed: input.challenge.attemptsUsed + 1,
    };
  }

  return {
    ...input.challenge,
    verifiedAtUtc: normalizeUtcTimestamp(input.nowUtc ?? new Date().toISOString(), 'MFA nowUtc'),
  };
}

function normalizeScopes(scopes: readonly string[] | undefined): readonly string[] {
  if (!scopes || scopes.length === 0) {
    return ['openid', 'profile', 'email'];
  }

  return Array.from(new Set(scopes.map((scope) => scope.trim()).filter((scope) => scope.length > 0))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function normalizeUtcTimestamp(value: string, label: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} '${value}' is invalid.`);
  }

  return parsed.toISOString();
}
