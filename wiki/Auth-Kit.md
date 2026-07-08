# Auth Kit

Runnable examples for Phase 6/Auth Kit primitives.

## Included Modules

- Sign-in and sign-up form contracts with typed submission and validation helpers.
- Password recovery and magic-link workflows with token lifecycle and expiry evaluation.
- Social login adapters and MFA challenge lifecycle helpers.
- Route and component session guards with fallback and revalidation support.
- Tenant-aware role and permission evaluators for composed auth context checks.

## Quick Example

```ts
import {
  createAuthSubmissionContract,
  createComponentSessionGuardContract,
  createMagicLinkRequestContract,
  createMfaChallengeContract,
  createSignInFormSchema,
  createTenantAuthAccessEvaluator,
  createTenantAuthContext,
  createTenantAuthIdentity,
  evaluateSessionGuard,
  executeRecoveryOrMagicLinkFlow,
  issueAuthTokenLifecycle,
  verifyMfaChallenge
} from "saas-ui-accelerator";

const signInSchema = createSignInFormSchema({ includeTenantId: true });

const submission = createAuthSubmissionContract({
  schema: signInSchema,
  values: {
    email: "member@example.com",
    password: "StrongPass-123",
    rememberMe: true,
    tenantId: "tenant-a"
  }
});

const magicRequest = createMagicLinkRequestContract({
  email: submission.values.email,
  tenantId: submission.values.tenantId,
  redirectUri: "https://app.example.com/auth/callback"
});

const token = issueAuthTokenLifecycle({
  subject: magicRequest.email,
  purpose: "magic-link",
  ttlSeconds: 300
});

await executeRecoveryOrMagicLinkFlow({
  request: magicRequest,
  token
});

const challenge = createMfaChallengeContract({
  challengeId: "mfa-1",
  userId: "u-1",
  method: "totp",
  ttlSeconds: 120
});

const verified = verifyMfaChallenge({ challenge });

const context = createTenantAuthContext({
  activeTenantId: "tenant-a",
  identities: [
    createTenantAuthIdentity({
      tenantId: "tenant-a",
      userId: "u-1",
      roles: ["admin"],
      permissions: ["users:read", "users:write"]
    })
  ]
});

const access = createTenantAuthAccessEvaluator(context).evaluate({
  requiredPermissions: ["users:write"]
});

const guard = createComponentSessionGuardContract({
  componentKey: "settings.panel",
  requiredPermissions: ["users:read"],
  fallbackComponentKey: "auth.prompt"
});

const guardResult = evaluateSessionGuard({
  guard,
  session: {
    userId: "u-1",
    tenantId: "tenant-a",
    roles: ["admin"],
    permissions: ["users:read", "users:write"],
    status: "authenticated"
  }
});

access.allowed;
verified.verifiedAtUtc;
guardResult.allowed;
```

## References

- API details: [API Reference](API-Reference)
- Runnable test examples: tests/authKit.examples.test.ts
- Phase completion gate: tests/phase6AuthKit.completionGate.test.ts
