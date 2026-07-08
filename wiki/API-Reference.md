# API Reference

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
