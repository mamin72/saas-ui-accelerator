# Sort Component Roadmap

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

1. Auth Kit
- Sign in, sign up, forgot password, magic link, social login, MFA, session guard, role and permission guards, tenant-aware auth context.

2. Billing Kit
- Plans, checkout, customer portal launcher, usage metering helpers, invoice list, entitlement checks, trial management, upgrade and downgrade flows.

3. Tenant and Org Kit
- Organization switcher, invite members, team roles, seat management, workspace settings, tenant resolver, tenant-safe route guards.

4. Data Grid Pro
- Advanced filtering, faceted search, saved views, server-side pagination, column pinning, column visibility, row selection, bulk actions, CSV export, inline edit.

5. Forms and Validation Kit
- Schema-driven form builder, async validation, dependent fields, autosave drafts, dirty-state guards, error summary, file upload with retry.

6. Workflow and Automation UI
- Rule builder, trigger-action editor, cron scheduler UI, webhook tester, execution log viewer, retry and replay controls.

7. Analytics and Dashboard Kit
- KPI cards, time-series charts, cohort tables, funnel chart, retention chart, configurable dashboard layout with saved presets.

8. Notifications and Inbox Kit
- Toast system, in-app notification center, templates, delivery channels, preferences center, unread counters, actionable notifications.

9. Admin and Ops Console Kit
- Feature flags UI, user impersonation banner, audit timeline, system health panel, support tools, API key management.

10. Onboarding and Adoption Kit
- Guided tours, checklist widget, empty-state templates, contextual help panel, feedback widget, NPS and CSAT components.

## Foundation Tracks (Required Across All Phases)

1. Design tokens and theming
- Brand packs, semantic color tokens, density modes, RTL, dark/light, high-contrast, white-label support.

2. Data and state primitives
- Query hooks, cache adapters, optimistic updates, offline-friendly patterns, mutation state primitives.

3. Access control primitives
- Page, component, action, and field-level gates with tenant scoping.

4. Error and resilience primitives
- Error boundaries, retry wrappers, fallback views, skeletons, optimistic rollback helpers.

5. Internationalization and localization
- Message formatting, number and currency formatting, timezone-safe date handling, locale-aware sort and filter.

## Phase 1: Data Grid Essentials

1. Add filtering engine (text, number, date, boolean, enum operators).
2. Add multi-column sorting support in table API.
3. Add pagination helpers (client-side first).
4. Add column visibility controls.
5. Add row selection and bulk action state helpers.
6. Add CSV export utility.

## Phase 2: Developer Experience

1. Add schema-driven column builder utilities.
2. Add stronger TypeScript inference for row and column contracts.
3. Add preset formatters (currency packs, locale packs, timezone helpers).
4. Add better error messages and validation utilities.
5. Add starter templates and copy-paste examples.

## Phase 3: SaaS Accelerators

1. Add saved views model (filters, sort, visible columns, page size).
2. Add server-side mode adapters (sorting/filtering/pagination request model).
3. Add audit metadata hooks for row actions.
4. Add permission-aware action predicates.
5. Add usage telemetry hooks for component interaction events.

## Phase 4: Production Hardening

1. Add benchmark suite for large datasets.
2. Add fuzz/property tests for parser and sorting correctness.
3. Add compatibility test matrix across Node versions.
4. Add release automation with changelog and version policy enforcement.
5. Add migration guide framework for future major versions.

## One-Thing-At-A-Time Backlog

Work strictly from top to bottom. Do not start the next item until the current item is complete.

1. [x] Filtering engine for table rows.
2. [x] Multi-column sorting in table API.
3. [ ] Pagination helpers.
4. [ ] Column visibility state helpers.
5. [ ] Row selection and bulk action state helpers.

## Definition Of Done (for each item)

1. Implementation is complete and typed.
2. Unit tests are added and passing.
3. `npm run quality:check` passes.
4. README is updated with usage examples.
5. Wiki page is updated and published.
6. PR includes Summary, What Changed, Key Files, Validation, Notes.

## Next Item To Execute

- Item 3: Pagination helpers.
- Scope for next implementation:
- Client-side paging API with page index and page size controls.
- Expose total rows and page metadata for UI rendering.
- Keep filtering and sorting behavior applied before paging.
