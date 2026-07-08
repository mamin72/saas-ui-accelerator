# Migration Guide Framework

This folder defines the migration guide framework for future major versions.

## Purpose

Use migration guides to make upgrades predictable when APIs change.

## Structure

- `MIGRATION_GUIDE_TEMPLATE.md`: Canonical template for future release migration docs.
- `examples/`: Example migration guides showing expected detail and format.

## When To Write A Migration Guide

Create or update a migration guide when:

- API names, exports, or signatures change.
- Behavior changes in a way that may impact consumers.
- Deprecations are introduced or removed.
- Configuration, defaults, or runtime assumptions change.

## Authoring Process

1. Start from `MIGRATION_GUIDE_TEMPLATE.md`.
2. Fill every required section and keep examples copy-paste ready.
3. Include both non-breaking and breaking impacts.
4. Add a validation checklist before publishing.
5. Reference the migration guide in release notes.
