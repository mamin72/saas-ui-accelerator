# SaaS UI Accelerator Roadmap

This roadmap is designed for incremental delivery: complete one scoped item fully before starting the next.

## Current State

- Core sorting engine is implemented (`sortByRules`).
- Multi-format parsing and parse+sort APIs are implemented (`formatSupport`).
- Table engine with sortable headers, data formatting, and action column support is implemented (`tableComponent`).
- Facade aliases are implemented (`myComponent`).

## Roadmap Strategy

- Ship one feature at a time on short branches.
- Every feature must include API docs, tests, and examples before merge.
- Keep backward compatibility stable; use deprecation before breaking changes.

## Phases

## Comprehensive SaaS Component Backlog

These are the full target modules for a complete SaaS-ready library.

- Auth Kit: Sign in, sign up, forgot password, magic link, social login, MFA, session guard, role and permission guards, tenant-aware auth context.
- Billing Kit: Plans, checkout, customer portal launcher, usage metering helpers, invoice list, entitlement checks, trial management, upgrade and downgrade flows.
- Tenant and Org Kit: Organization switcher, invite members, team roles, seat management, workspace settings, tenant resolver, tenant-safe route guards.
- Data Grid Pro: Advanced filtering, faceted search, saved views, server-side pagination, column pinning, column visibility, row selection, bulk actions, CSV export, inline edit.
- Forms and Validation Kit: Schema-driven form builder, async validation, dependent fields, autosave drafts, dirty-state guards, error summary, file upload with retry.
- Workflow and Automation UI: Rule builder, trigger-action editor, cron scheduler UI, webhook tester, execution log viewer, retry and replay controls.
- Analytics and Dashboard Kit: KPI cards, time-series charts, cohort tables, funnel chart, retention chart, configurable dashboard layout with saved presets.
- Notifications and Inbox Kit: Toast system, in-app notification center, templates, delivery channels, preferences center, unread counters, actionable notifications.
- Admin and Ops Console Kit: Feature flags UI, user impersonation banner, audit timeline, system health panel, support tools, API key management.
- Onboarding and Adoption Kit: Guided tours, checklist widget, empty-state templates, contextual help panel, feedback widget, NPS and CSAT components.

## Foundation Tracks (Required Across All Phases)

- Design tokens and theming: Brand packs, semantic color tokens, density modes, RTL, dark/light, high-contrast, white-label support.
- Data and state primitives: Query hooks, cache adapters, optimistic updates, offline-friendly patterns, mutation state primitives.
- Access control primitives: Page, component, action, and field-level gates with tenant scoping.
- Error and resilience primitives: Error boundaries, retry wrappers, fallback views, skeletons, optimistic rollback helpers.
- Internationalization and localization: Message formatting, number and currency formatting, timezone-safe date handling, locale-aware sort and filter.

## Phase 1: Data Grid Essentials

1. [x] Add filtering engine (text, number, date, boolean, enum operators).
2. [x] Add multi-column sorting support in table API.
3. [x] Add pagination helpers (client-side first).
4. [x] Add column visibility controls.
5. [x] Add row selection and bulk action state helpers.
6. [x] CSV export utility.

## Phase 2: Developer Experience

1. [x] Add schema-driven column builder utilities.
2. [x] Add stronger TypeScript inference for row and column contracts.
3. [x] Add preset formatters (currency packs, locale packs, timezone helpers).
4. [x] Add better error messages and validation utilities.
5. [x] Add starter templates and copy-paste examples.

## Phase 3: SaaS Accelerators

1. [x] Add saved views model (filters, sort, visible columns, page size).
2. [x] Add server-side mode adapters (sorting/filtering/pagination request model).
3. [x] Add audit metadata hooks for row actions.
4. [x] Add permission-aware action predicates.
5. [x] Add usage telemetry hooks for component interaction events.

## Phase 4: Production Hardening

1. [x] Add benchmark suite for large datasets.
2. [x] Add fuzz/property tests for parser and sorting correctness.
3. [x] Add compatibility test matrix across Node versions.
4. [x] Add release automation with changelog and version policy enforcement.
5. [x] Add migration guide framework for future major versions.

## One-Thing-At-A-Time Backlog

Work strictly from top to bottom. Do not start the next item until the current item is complete.

1. [x] Filtering engine for table rows.
2. [x] Multi-column sorting in table API.
3. [x] Pagination helpers.
4. [x] Column visibility state helpers.
5. [x] Row selection and bulk action state helpers.
6. [x] CSV export utility.
7. [x] Add preset formatters (currency packs, locale packs, timezone helpers).
8. [x] Add better error messages and validation utilities.
9. [x] Add starter templates and copy-paste examples.
10. [x] Add saved views model (filters, sort, visible columns, page size).
11. [x] Add server-side mode adapters (sorting/filtering/pagination request model).
12. [x] Add audit metadata hooks for row actions.
13. [x] Add permission-aware action predicates.
14. [x] Add usage telemetry hooks for component interaction events.
15. [x] Add benchmark suite for large datasets.
16. [x] Add fuzz/property tests for parser and sorting correctness.
17. [x] Add compatibility test matrix across Node versions.
18. [x] Add release automation with changelog and version policy enforcement.
19. [x] Add migration guide framework for future major versions.

## Definition Of Done (for each item)

1. Implementation is complete and typed.
2. Unit tests are added and passing.
3. `npm run quality:check` passes.
4. README is updated with usage examples.
5. Wiki page is updated and published.
6. PR includes Summary, What Changed, Key Files, Validation, Notes.

## Next Item To Execute

- All items in the current roadmap are complete.
- Next step: define the next roadmap cycle (v2) and prioritize new backlog items.
