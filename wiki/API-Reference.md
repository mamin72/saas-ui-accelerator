# API Reference

For runnable access-control examples, see [Access Control Primitives](Access-Control-Primitives).
For runnable resilience examples, see [Resilience Primitives](Resilience-Primitives).
For runnable localization examples, see [Localization Primitives](Localization-Primitives).
For runnable auth examples, see [Auth Kit](Auth-Kit).

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

## Localization Primitives

### createTranslationKeyContract

```ts
createTranslationKeyContract(input: {
  key: string;
  description?: string;
  placeholders?: readonly {
    name: string;
    type?: "string" | "number" | "boolean" | "date";
    required?: boolean;
  }[];
  fallbackMessage?: string;
}): TranslationKeyContract
```

Creates normalized translation key contracts for message templates.

### createMessageFormatterContract

```ts
createMessageFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  timeZone?: string;
  missingKeyPolicy?: "throw" | "fallback-message" | "return-key";
}): MessageFormatterContract
```

Creates formatter contracts that control locale, fallback locale, timezone, and missing-key behavior.

### createMessageCatalog

```ts
createMessageCatalog(entries: readonly MessageCatalogEntry[]): MessageCatalog
```

Creates a locale-keyed message catalog for message template resolution.

### formatMessage

```ts
formatMessage(input: {
  contract: TranslationKeyContract;
  formatter: MessageFormatterContract;
  catalog: MessageCatalog;
  values?: Readonly<Record<string, unknown>>;
  localeOverride?: string;
}): MessageFormatResult
```

Formats template messages using locale/fallback behavior and placeholder rendering.

### createLocaleNumberFormatterContract

```ts
createLocaleNumberFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  useGrouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: "standard" | "scientific" | "engineering" | "compact";
}): LocaleNumberFormatterContract
```

Creates locale-aware number formatter contracts with validation.

### createLocaleCurrencyFormatterContract

```ts
createLocaleCurrencyFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  currency: string;
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
  currencySign?: "standard" | "accounting";
  useGrouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): LocaleCurrencyFormatterContract
```

Creates locale-aware currency formatter contracts with ISO-4217 validation.

### formatLocaleNumber

```ts
formatLocaleNumber(input: {
  value: number;
  contract: LocaleNumberFormatterContract;
  localeOverride?: string;
}): LocalizedFormatResult
```

Formats numbers with locale-aware grouping, fraction, and notation settings.

### formatLocaleCurrency

```ts
formatLocaleCurrency(input: {
  value: number;
  contract: LocaleCurrencyFormatterContract;
  localeOverride?: string;
}): LocalizedFormatResult
```

Formats currency values with locale-aware symbol/code and precision settings.

### createLocaleDateTimeFormatterContract

```ts
createLocaleDateTimeFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  timeZone: string;
  dateStyle?: "short" | "medium" | "long" | "full";
  timeStyle?: "short" | "medium" | "long" | "full";
}): LocaleDateTimeFormatterContract
```

Creates timezone-safe date-time formatter contracts.

### createLocaleDateParseContract

```ts
createLocaleDateParseContract(input: {
  inputTimeZone: string;
  outputTimeZone?: string;
  fallbackTimeZone?: string;
}): LocaleDateParseContract
```

Creates timezone parse contracts for normalized date parsing workflows.

### formatLocaleDateTime

```ts
formatLocaleDateTime(input: {
  value: Date | string | number;
  contract: LocaleDateTimeFormatterContract;
  localeOverride?: string;
  timeZoneOverride?: string;
}): LocalizedDateTimeResult
```

Formats date-time values with locale and timezone override/fallback handling.

### parseZonedDateTime

```ts
parseZonedDateTime(input: {
  value: string | Date | number;
  contract: LocaleDateParseContract;
}): ParsedZonedDateTimeResult
```

Parses date-time inputs and returns parsed date metadata with timezone fallback details.

### convertDateTimeToTimeZone

```ts
convertDateTimeToTimeZone(input: {
  value: Date | string | number;
  fromTimeZone: string;
  toTimeZone: string;
  locale?: string;
}): ParsedZonedDateTimeResult
```

Converts a date-time snapshot to a target timezone representation.

### createLocaleTextSortContract

```ts
createLocaleTextSortContract(input: {
  locale: string;
  fallbackLocale?: string;
  sensitivity?: Intl.CollatorOptions["sensitivity"];
  caseFirst?: Intl.CollatorOptions["caseFirst"];
  ignorePunctuation?: boolean;
  numeric?: boolean;
}): LocaleTextSortContract
```

Creates locale collation contracts for text sorting behavior.

### sortByLocaleRules

```ts
sortByLocaleRules<T>(items: readonly T[], rules: readonly LocaleSortRule<T>[], contract: LocaleTextSortContract): T[]
```

Sorts rows using locale-aware collation and mixed-type comparisons.

### createLocaleFilterContract

```ts
createLocaleFilterContract(input: {
  locale: string;
  fallbackLocale?: string;
  timeZone?: string;
  caseSensitive?: boolean;
}): LocaleFilterContract
```

Creates locale filter contracts with timezone and case-sensitivity controls.

### evaluateLocaleFilterPredicate

```ts
evaluateLocaleFilterPredicate(
  input: LocaleFilterPredicateInput,
  contract: LocaleFilterContract
): boolean
```

Evaluates locale-aware text/number/date filter predicates including range checks.

## createErrorBoundaryContract

```ts
createErrorBoundaryContract(input: {
  boundaryKey: string;
  scope?: "global" | "route" | "page" | "component";
  fallbackViewKey: string;
  captureErrorTypes?: readonly string[];
  tags?: readonly string[];
  rethrowInDevelopment?: boolean;
}): ErrorBoundaryContract
```

Creates a normalized error boundary contract mapped to a fallback view.

## createFallbackViewContract

```ts
createFallbackViewContract(input: {
  viewKey: string;
  title: string;
  message: string;
  severity?: "info" | "warning" | "error" | "fatal";
  allowRetry?: boolean;
  supportReferenceId?: string;
}): FallbackViewContract
```

Creates a normalized fallback view contract for resilience rendering.

## createErrorResilienceRegistry

```ts
createErrorResilienceRegistry(input: {
  boundaries: readonly ErrorBoundaryContract[];
  fallbackViews: readonly FallbackViewContract[];
}): {
  hasBoundary(boundaryKey: string): boolean;
  hasFallbackView(viewKey: string): boolean;
  listBoundaryKeys(): readonly string[];
  listFallbackViewKeys(): readonly string[];
  resolveFallback(boundaryKey: string): ErrorBoundaryResolution;
}
```

Registers and resolves error boundary to fallback mappings with reason metadata.

## createRetryPolicyContract

```ts
createRetryPolicyContract(input: {
  policyKey: string;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoff?: "fixed" | "exponential";
  jitterRatio?: number;
  retryableErrorTypes?: readonly string[];
  retryableStatusCodes?: readonly number[];
}): RetryPolicyContract
```

Creates a normalized retry policy used by retry wrappers.

## calculateRetryDelayMs

```ts
calculateRetryDelayMs(policy: RetryPolicyContract, failedAttempt: number, randomValue?: number): number
```

Calculates retry delay for fixed/exponential backoff with optional jitter.

## executeWithRetry

```ts
executeWithRetry<TValue>(
  operation: (attempt: number) => Promise<TValue>,
  policy: RetryPolicyContract,
  options?: {
    sleep?: (delayMs: number) => Promise<void>;
    random?: () => number;
  }
): Promise<RetryExecutionResult<TValue>>
```

Runs async operations with retry policy enforcement and event capture.

## createLoadingStateContract

```ts
createLoadingStateContract(input: {
  stateKey: string;
  skeletonViewKey: string;
  showAfterMs?: number;
  minVisibleMs?: number;
  preservePreviousContent?: boolean;
  announceLoading?: boolean;
}): LoadingStateContract
```

Creates loading-state conventions including timing and announcement behavior.

## createSkeletonViewContract

```ts
createSkeletonViewContract(input: {
  viewKey: string;
  variant?: "text" | "card" | "table-row" | "chart" | "custom";
  lineCount?: number;
  animated?: boolean;
  density?: "compact" | "comfortable";
}): SkeletonViewContract
```

Creates typed skeleton view contracts used during loading states.

## createLoadingStateRegistry

```ts
createLoadingStateRegistry(input: {
  loadingStates: readonly LoadingStateContract[];
  skeletonViews: readonly SkeletonViewContract[];
}): {
  hasLoadingState(stateKey: string): boolean;
  hasSkeletonView(viewKey: string): boolean;
  listLoadingStateKeys(): readonly string[];
  listSkeletonViewKeys(): readonly string[];
  resolveSkeleton(stateKey: string): LoadingStateResolution;
}
```

Resolves loading states to skeleton views with standardized reason metadata.

## deriveLoadingStatePresentation

```ts
deriveLoadingStatePresentation(input: {
  contract: LoadingStateContract;
  status: "idle" | "loading" | "success" | "error";
  isFetching: boolean;
  elapsedLoadingMs: number;
  hasPreviousContent?: boolean;
}): LoadingStatePresentation
```

Derives show/hide skeleton and previous-content behavior from loading conventions.

## createOptimisticRollbackPolicyContract

```ts
createOptimisticRollbackPolicyContract(input: {
  policyKey: string;
  maxRecoveryAttempts?: number;
  recoveryDelayMs?: number;
  maxRecoveryDelayMs?: number;
  useExponentialBackoff?: boolean;
  preserveFailedOptimisticValue?: boolean;
}): OptimisticRollbackPolicyContract
```

Creates normalized policy contracts for optimistic rollback and recovery behavior.

## calculateRecoveryDelayMs

```ts
calculateRecoveryDelayMs(policy: OptimisticRollbackPolicyContract, attempt: number): number
```

Calculates recovery delay using fixed or exponential policy configuration.

## createOptimisticRecoveryController

```ts
createOptimisticRecoveryController<TValue, TError>(input: {
  key: string;
  baselineValue: TValue;
  optimisticValue: TValue;
  policy?: OptimisticRollbackPolicyContract;
  nowEpochMs?: () => number;
  maxEvents?: number;
}): OptimisticRecoveryController<TValue, TError>
```

Creates lifecycle helpers for optimistic commit, rollback, recovery planning, and reset flows.

## Auth Kit Primitives

### Sign-In and Sign-Up Contracts

```ts
createSignInFormSchema(...)
createSignUpFormSchema(...)
createAuthSubmissionContract(...)
validateAuthFormValues(...)
mapAuthValidationIssuesToFieldErrors(...)
mapAuthProviderError(...)
```

Typed form schema, submission, and validation helpers for sign-in/sign-up flows.

### Password Recovery and Magic Link

```ts
createPasswordRecoveryRequestContract(...)
createMagicLinkRequestContract(...)
issueAuthTokenLifecycle(...)
evaluateAuthTokenExpiry(...)
consumeAuthTokenLifecycle(...)
executeRecoveryOrMagicLinkFlow(...)
```

Recovery request contracts and token lifecycle orchestration helpers with callback hooks.

### Social Login and MFA

```ts
createSocialLoginAdapterContract(...)
startSocialLogin(...)
finishSocialLogin(...)
createMfaChallengeContract(...)
evaluateMfaChallenge(...)
registerMfaAttempt(...)
verifyMfaChallenge(...)
```

Pluggable social login adapter contracts and MFA challenge primitives.

### Session Guards and Tenant Auth Access

```ts
createRouteSessionGuardContract(...)
createComponentSessionGuardContract(...)
evaluateSessionGuard(...)
evaluateSessionGuardWithRevalidation(...)
createTenantAuthIdentity(...)
createTenantAuthContext(...)
resolveActiveTenantIdentity(...)
hasRequiredRoles(...)
hasRequiredPermissions(...)
evaluateTenantAuthAccess(...)
createTenantAuthAccessEvaluator(...)
```

Route/component session guard primitives and tenant-aware role/permission evaluator helpers.
