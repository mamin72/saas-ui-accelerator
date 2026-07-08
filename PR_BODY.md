## Summary
Adds transport-agnostic audit metadata hooks for row actions in the table component.

## What Changed
- Added new action audit event model with outcomes: started, confirmed, cancelled, completed, failed.
- Added optional onAudit hook to action column definitions and default MUI action column options.
- Emitted structured audit events around action execution lifecycle, including row identity, timestamps, confirmation state, and error details.
- Ensured audit hook failures are side-effect safe and never block action execution.
- Added tests for success, cancellation, failure, and audit-hook-throws scenarios.
- Updated README, wiki docs, and roadmap status for item 12.

## Key Files
- src/tableComponent.ts
- tests/tableComponent.test.ts
- README.md
- wiki/Table-Component.md
- roadmap.md

## Validation
- npm run quality:check
- pwsh ./scripts/publish-wiki.ps1

## Notes
- Backward compatibility is preserved: existing action definitions continue to work without onAudit.
- Next roadmap item is item 13 (permission-aware action predicates).

## Reuse Checklist
- [x] I searched existing modules before adding new code.
- [x] I reused existing utilities/components where possible.
- [x] I only introduced new code where no reusable path existed.
