# Access Control Primitives

Use access-control primitives to gate page, component, action, and field behavior with tenant-aware policy composition.

## Quick Example

```ts
import {
  combinePolicyEvaluationDecisions,
  createActionAccessPolicy,
  createComponentAccessPolicy,
  createFieldAccessPolicy,
  createPageAccessContract,
  createTenantScopedActionAccessPolicy,
  createTenantScopedComponentAccessPolicy,
  createTenantScopedFieldAccessPolicy,
  evaluateActionAccess,
  evaluateComponentAccess,
  evaluateFieldAccess,
  evaluatePageAccess,
  evaluateTenantScopedActionAccess,
  evaluateTenantScopedComponentAccess,
  evaluateTenantScopedFieldAccess,
  fieldEquals,
} from "saas-ui-accelerator";

const principal = {
  userId: "u-1",
  roles: ["admin"],
  permissions: ["users:read", "users:write", "users:archive"],
  tenantId: "tenant-a",
};

const pagePolicy = createPageAccessContract({
  pageKey: "users.page",
  requiredRoles: ["admin"],
  allowedTenants: ["tenant-a"],
});

const componentPolicy = createComponentAccessPolicy({
  componentKey: "users-table",
  requiredPermissions: ["users:read"],
});

const actionPolicy = createActionAccessPolicy({
  componentKey: "users-table",
  actionKey: "archive",
  requiredPermissions: ["users:archive"],
});

type UserRecord = {
  amount: number;
  status: "draft" | "published";
};

const fieldPolicy = createFieldAccessPolicy<UserRecord, "amount">({
  fieldKey: "amount",
  mode: "write",
  requiredPermissions: ["users:write"],
  conditions: [fieldEquals<UserRecord, "status">("status", "draft")],
});

const pageResult = evaluatePageAccess(pagePolicy, principal);
const componentResult = evaluateComponentAccess(componentPolicy, principal);
const actionResult = evaluateActionAccess(actionPolicy, principal);
const fieldResult = evaluateFieldAccess(fieldPolicy, {
  principal,
  record: { amount: 10, status: "draft" },
});

const tenantComponentPolicy = createTenantScopedComponentAccessPolicy({
  componentKey: "users-table",
  requiredPermissions: ["users:read"],
  allowedTenants: ["tenant-a"],
});

const tenantActionPolicy = createTenantScopedActionAccessPolicy({
  componentKey: "users-table",
  actionKey: "archive",
  requiredPermissions: ["users:archive"],
  allowedTenants: ["tenant-a"],
});

const tenantFieldPolicy = createTenantScopedFieldAccessPolicy<UserRecord, "amount">({
  fieldKey: "amount",
  mode: "write",
  requiredPermissions: ["users:archive"],
  conditions: [fieldEquals<UserRecord, "status">("status", "draft")],
  allowedTenants: ["tenant-a"],
});

const tenantComponentResult = evaluateTenantScopedComponentAccess(tenantComponentPolicy, principal);
const tenantActionResult = evaluateTenantScopedActionAccess(tenantActionPolicy, principal);
const tenantFieldResult = evaluateTenantScopedFieldAccess(tenantFieldPolicy, {
  principal,
  record: { amount: 10, status: "draft" },
});

const decision = combinePolicyEvaluationDecisions([
  pageResult,
  componentResult,
  actionResult,
  fieldResult,
  tenantComponentResult,
  tenantActionResult,
  tenantFieldResult,
]);

console.log(decision.allowed); // true
```

## Notes

- Use page policies for route-level protection.
- Use component/action policies for UI control boundaries.
- Use field policies for read/write and condition-driven guard logic.
- Use tenant-scoped wrappers to enforce tenant boundaries consistently.
- Use decision combination when a single allow/deny output is needed for orchestration.
