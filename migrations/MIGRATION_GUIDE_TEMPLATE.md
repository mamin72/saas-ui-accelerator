# Migration Guide: vX.Y.Z -> vA.B.C

## Summary

- Scope of the migration.
- Who is affected.

## Impact Level

- Breaking changes: yes/no
- Non-breaking changes: yes/no
- Estimated migration effort: low/medium/high

## Upgrade Steps

1. Update package version.
2. Run quality checks and existing tests.
3. Apply API/configuration changes listed below.
4. Validate behavior in staging.

## Breaking Changes

List each breaking change with the old and new behavior.

### Breaking Change 1

- Old behavior:
- New behavior:
- Why this changed:
- Required action:

## Non-Breaking Changes

List additive or compatibility-preserving changes.

### Non-Breaking Change 1

- Description:
- Optional action:

## Deprecations

- Deprecated API:
- Replacement API:
- Planned removal version:

## API Rename Examples

```ts
// Before
legacyApiCall();

// After
modernApiCall();
```

## Behavioral Change Examples

```ts
// Before
const result = runLegacyMode();

// After
const result = runModernMode();
```

## Validation Checklist

- [ ] Updated to the target package version.
- [ ] All code references to renamed/deprecated APIs are migrated.
- [ ] `npm run quality:check` passes in the consumer project.
- [ ] Release notes and internal docs are updated.
- [ ] Rollback plan is documented.

## Rollback Plan

- Steps to revert safely if post-upgrade issues are discovered.
