# Migration Guide: v1.x -> v2.0.0 (Example)

## Summary

This example shows how to document API renames, deprecations, and behavior changes.

## Impact Level

- Breaking changes: yes
- Non-breaking changes: yes
- Estimated migration effort: medium

## Upgrade Steps

1. Upgrade package dependency to `v2.0.0`.
2. Replace renamed APIs listed below.
3. Run `npm run quality:check` in your consuming project.
4. Verify table sorting/filtering behavior in staging.

## Breaking Changes

### `createLegacyTable` renamed to `createTypedTableComponent`

- Old behavior: `createLegacyTable(options)`
- New behavior: `createTypedTableComponent(options)`
- Why this changed: align naming with typed schema builder APIs.
- Required action: rename imports and constructor usage.

## Non-Breaking Changes

### Added migration-aware release policy checks

- Description: release workflows now include migration-framework validation.
- Optional action: adopt the same release checks in downstream CI.

## Deprecations

- Deprecated API: `legacySort`.
- Replacement API: `sortByRules`.
- Planned removal version: `3.0.0`.

## API Rename Examples

```ts
// Before
import { createLegacyTable } from "saas-ui-accelerator";
const table = createLegacyTable(options);

// After
import { createTypedTableComponent } from "saas-ui-accelerator";
const table = createTypedTableComponent(options);
```

## Behavioral Change Examples

```ts
// Before
const rows = table.getRows(); // implied unsorted read in legacy mode

// After
const rows = table.getTableRows(); // explicit sorted/filtered pipeline
```

## Validation Checklist

- [x] Updated to the target package version.
- [x] All code references to renamed/deprecated APIs are migrated.
- [x] `npm run quality:check` passes in the consumer project.
- [x] Release notes and internal docs are updated.
- [x] Rollback plan is documented.

## Rollback Plan

1. Revert dependency to latest `v1.x`.
2. Revert migration commits.
3. Redeploy with previous stable build.
