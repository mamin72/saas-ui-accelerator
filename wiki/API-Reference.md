# API Reference

For runnable access-control examples, see [Access Control Primitives](Access-Control-Primitives).

## sortByRules

```ts
sortByRules<T>(items: readonly T[], rules: readonly SortRule<T>[]): T[]
```

Returns a new sorted array based on the ordered list of rules.

## SortRule

```ts
interface SortRule<T> {
  id: string;
  direction: "asc" | "desc";
  selector: (item: T) => string | number | boolean | Date | null | undefined;
  nulls?: "first" | "last";
}
```

### Behavior

- Rules are evaluated in order.
- First non-zero comparison decides order.
- If all rules tie, original relative order is preserved by sort semantics.

## parseAndSort

```ts
parseAndSort<T>(input: unknown, options: ParseAndSortOptions<T>): T[]
```

Parses supported formats and applies sorting in one call.

Supported formats:

- json
- jsonl
- csv
- tsv
- xml
- yaml

## parseAndSortFromStream

```ts
parseAndSortFromStream<T>(stream: Readable, options: ParseAndSortOptions<T>): Promise<T[]>
```

Reads stream content, parses by format, and returns sorted rows.

## parseRecords

```ts
parseRecords(input: unknown, options?: ParseOptions): ParsedRecord[]
```

Parses input without sorting; useful when you need pre-processing before ordering.

## registerCodec

```ts
registerCodec(codec: FormatCodec): void
```

Registers or overrides a format codec for custom parsing behavior.

See also: [Data Formats](Data-Formats)

## createPageAccessContract

```ts
createPageAccessContract(input: {
  pageKey: string;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  allowedTenants?: readonly string[];
  denyWhenUnauthenticated?: boolean;
}): PageAccessContract
```

Creates a normalized page access contract with role, permission, tenant, and unauthenticated behavior controls.

## evaluatePageAccess

```ts
evaluatePageAccess(contract: PageAccessContract, principal?: PageAccessPrincipal): PageAccessResult
```

Evaluates page-level access and returns allow/deny metadata with reason codes.

## createPageAccessEvaluator

```ts
createPageAccessEvaluator(contracts: readonly PageAccessContract[]): {
  evaluate(pageKey: string, principal?: PageAccessPrincipal): PageAccessResult;
  hasPage(pageKey: string): boolean;
  listPageKeys(): readonly string[];
}
```

Builds a keyed page evaluator for repeated checks across routes/pages.

## createComponentAccessPolicy

```ts
createComponentAccessPolicy(input: {
  componentKey: string;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  denyWhenUnauthenticated?: boolean;
}): ComponentAccessPolicy
```

Creates a normalized policy for component-level access checks.

## evaluateComponentAccess

```ts
evaluateComponentAccess(policy: ComponentAccessPolicy, principal?: ComponentAccessPrincipal): ComponentAccessResult
```

Evaluates component access and returns structured decision metadata.

## createComponentAccessEvaluator

```ts
createComponentAccessEvaluator(policies: readonly ComponentAccessPolicy[]): {
  evaluate(componentKey: string, principal?: ComponentAccessPrincipal): ComponentAccessResult;
  hasComponent(componentKey: string): boolean;
  listComponentKeys(): readonly string[];
}
```

Builds a keyed evaluator for component policy checks.

## createActionAccessPolicy

```ts
createActionAccessPolicy(input: {
  componentKey: string;
  actionKey: string;
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  denyWhenUnauthenticated?: boolean;
}): ActionAccessPolicy
```

Creates a normalized policy for action-level access checks within a component.

## evaluateActionAccess

```ts
evaluateActionAccess(policy: ActionAccessPolicy, principal?: ComponentAccessPrincipal): ActionAccessResult
```

Evaluates action access and returns structured decision metadata.

## createActionAccessEvaluator

```ts
createActionAccessEvaluator(policies: readonly ActionAccessPolicy[]): {
  evaluate(componentKey: string, actionKey: string, principal?: ComponentAccessPrincipal): ActionAccessResult;
  hasAction(componentKey: string, actionKey: string): boolean;
  listActions(componentKey?: string): readonly string[];
}
```

Builds a keyed evaluator for action policy checks across components.

## createFieldAccessPolicy

```ts
createFieldAccessPolicy<TRecord extends Record<string, unknown>, TField extends FieldKeyOf<TRecord>>(input: {
  fieldKey: TField;
  mode?: "read" | "write";
  requiredRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  denyWhenUnauthenticated?: boolean;
  conditions?: readonly FieldAccessCondition<TRecord>[];
}): FieldAccessPolicy<TRecord, TField>
```

Creates a normalized field access policy with typed conditions and permission requirements.

## evaluateFieldAccess

```ts
evaluateFieldAccess<TRecord extends Record<string, unknown>>(
  policy: FieldAccessPolicy<TRecord>,
  context?: FieldAccessContext<TRecord>
): FieldAccessResult<TRecord>
```

Evaluates field-level access and returns decision metadata with failed condition details.

## createFieldAccessEvaluator

```ts
createFieldAccessEvaluator<TRecord extends Record<string, unknown>>(
  policies: readonly FieldAccessPolicy<TRecord>[]
): {
  evaluate(fieldKey: FieldKeyOf<TRecord> | string | number, mode?: "read" | "write", context?: FieldAccessContext<TRecord>): FieldAccessResult<TRecord>;
  hasField(fieldKey: FieldKeyOf<TRecord> | string | number, mode?: "read" | "write"): boolean;
  listFields(mode?: "read" | "write"): readonly string[];
}
```

Builds a keyed evaluator for field policy checks across read and write modes.

## Typed Field Condition Helpers

```ts
fieldEquals(field, value)
fieldNotEquals(field, value)
fieldIn(field, value[])
fieldNotIn(field, value[])
fieldIsTrue(field)
fieldIsFalse(field)
```

Typed helper constructors for composing field-level access conditions.

## createTenantScope

```ts
createTenantScope(input?: {
  allowedTenants?: readonly string[];
  denyWhenTenantMissing?: boolean;
}): TenantScope
```

Creates a normalized tenant scope model used by tenant-aware policy wrappers.

## evaluateTenantScope

```ts
evaluateTenantScope(scope: TenantScope, tenantId?: string): TenantScopeResult
```

Evaluates tenant constraints and returns allow/deny reasons for tenant missing or mismatch states.

## Tenant-Scoped Policy Builders and Evaluators

```ts
createTenantScopedComponentAccessPolicy(...)
createTenantScopedActionAccessPolicy(...)
createTenantScopedFieldAccessPolicy(...)
evaluateTenantScopedComponentAccess(...)
evaluateTenantScopedActionAccess(...)
evaluateTenantScopedFieldAccess(...)
createTenantScopedComponentAccessEvaluator(...)
createTenantScopedActionAccessEvaluator(...)
```

Tenant-scoped wrappers that combine existing access-control checks with tenant constraints.

## combinePolicyEvaluationDecisions

```ts
combinePolicyEvaluationDecisions(results: readonly Array<{ allowed: boolean; reasons: readonly PolicyEvaluationReason[] }>): PolicyEvaluationDecision
```

Combines multiple policy evaluation results into a single allow/deny decision with merged reasons.
