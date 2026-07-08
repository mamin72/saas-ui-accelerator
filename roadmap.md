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

## Historical Delivery Phases (Completed)

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

## V2 Delivery Phases (Foundation First, Then Components)

## Phase 5: Foundation Tracks (Required Before Component Phases)

1. [ ] Design tokens and theming: Brand packs, semantic color tokens, density modes, RTL, dark/light, high-contrast, white-label support.
2. [ ] Data and state primitives: Query hooks, cache adapters, optimistic updates, offline-friendly patterns, mutation state primitives.
3. [ ] Access control primitives: Page, component, action, and field-level gates with tenant scoping.
4. [ ] Error and resilience primitives: Error boundaries, retry wrappers, fallback views, skeletons, optimistic rollback helpers.
5. [ ] Internationalization and localization: Message formatting, number and currency formatting, timezone-safe date handling, locale-aware sort and filter.

## Phase 6: Auth Kit (Release Ready)

1. [ ] Chunk 1: Sign-in and sign-up flows with typed form contracts.
2. [ ] Chunk 2: Password recovery and magic-link authentication flows.
3. [ ] Chunk 3: Social login adapters and multi-factor authentication components.
4. [ ] Chunk 4: Session guard primitives for route and component protection.
5. [ ] Chunk 5: Role, permission, and tenant-aware auth context helpers.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 7: Billing Kit (Release Ready)

1. [ ] Chunk 1: Plan catalog and plan comparison components.
2. [ ] Chunk 2: Checkout flow components and provider-agnostic payment adapters.
3. [ ] Chunk 3: Customer portal launcher and billing account management actions.
4. [ ] Chunk 4: Usage metering, invoice list, and billing history components.
5. [ ] Chunk 5: Entitlement, trial, upgrade, and downgrade flow helpers.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 8: Tenant and Org Kit (Release Ready)

1. [ ] Chunk 1: Organization and workspace switcher primitives.
2. [ ] Chunk 2: Member invitation, acceptance, and lifecycle management flows.
3. [ ] Chunk 3: Team role assignment and seat management components.
4. [ ] Chunk 4: Workspace settings scaffolds with typed configuration models.
5. [ ] Chunk 5: Tenant resolver and tenant-safe route guard helpers.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 9: Data Grid Pro (Release Ready)

1. [ ] Chunk 1: Advanced filtering with composable rule groups and operators.
2. [ ] Chunk 2: Faceted search and saved-view management components.
3. [ ] Chunk 3: Server-side pagination, sorting, and filtering integration adapters.
4. [ ] Chunk 4: Column pinning, visibility presets, and layout persistence.
5. [ ] Chunk 5: Row selection, bulk actions, CSV export, and inline editing flows.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 10: Forms and Validation Kit (Release Ready)

1. [ ] Chunk 1: Schema-driven form builder with typed field registries.
2. [ ] Chunk 2: Synchronous and asynchronous validation pipelines.
3. [ ] Chunk 3: Dependent and conditional field behavior helpers.
4. [ ] Chunk 4: Autosave drafts and dirty-state navigation guard primitives.
5. [ ] Chunk 5: Error summary patterns and resilient file upload with retry.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 11: Workflow and Automation UI (Release Ready)

1. [ ] Chunk 1: Visual rule builder with typed condition and action nodes.
2. [ ] Chunk 2: Trigger-action editor components for common automation patterns.
3. [ ] Chunk 3: Cron scheduler UI with validation and timezone awareness.
4. [ ] Chunk 4: Webhook tester and request inspector utilities.
5. [ ] Chunk 5: Execution log viewer with retry and replay controls.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 12: Analytics and Dashboard Kit (Release Ready)

1. [ ] Chunk 1: KPI card components with trend and delta indicators.
2. [ ] Chunk 2: Time-series chart components with zoom and range controls.
3. [ ] Chunk 3: Cohort and funnel visualization primitives.
4. [ ] Chunk 4: Retention analysis components with configurable breakdowns.
5. [ ] Chunk 5: Configurable dashboard layouts with saved presets and sharing hooks.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 13: Notifications and Inbox Kit (Release Ready)

1. [ ] Chunk 1: Global toast system with severity, queueing, and dismissal policies.
2. [ ] Chunk 2: In-app notification center with grouping and filtering.
3. [ ] Chunk 3: Notification template and delivery-channel configuration primitives.
4. [ ] Chunk 4: User preferences center for notification controls.
5. [ ] Chunk 5: Unread counters and actionable notification interaction patterns.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 14: Admin and Ops Console Kit (Release Ready)

1. [ ] Chunk 1: Feature flag management UI with environment targeting.
2. [ ] Chunk 2: User impersonation flow indicators and safety controls.
3. [ ] Chunk 3: Audit timeline components with actor and event filtering.
4. [ ] Chunk 4: System health and diagnostics panel primitives.
5. [ ] Chunk 5: Support tooling and API key management components.
6. [ ] Completion gate: satisfy release-ready exit criteria.

## Phase 15: Onboarding and Adoption Kit (Release Ready)

1. [ ] Chunk 1: Guided tour framework with step orchestration.
2. [ ] Chunk 2: Onboarding checklist widget with progress persistence.
3. [ ] Chunk 3: Reusable empty-state templates with contextual actions.
4. [ ] Chunk 4: Contextual help panel and in-product support prompts.
5. [ ] Chunk 5: Feedback, NPS, and CSAT collection components.
6. [ ] Completion gate: satisfy release-ready exit criteria.

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
20. [x] Phase 5/Foundation Track 1 chunk 1: define token schema, semantic aliases, and naming conventions.
21. [x] Phase 5/Foundation Track 1 chunk 2: implement baseline theme packs (light, dark, high-contrast).
22. [x] Phase 5/Foundation Track 1 chunk 3: implement density modes and RTL-safe token mapping.
23. [x] Phase 5/Foundation Track 1 chunk 4: add typed theme resolver utilities and fallback behavior.
24. [x] Phase 5/Foundation Track 1 chunk 5: add tests, docs, and examples for token and theme usage.
25. [x] Phase 5/Foundation Track 1 completion gate: all chunk outputs integrated and validated.
26. [x] Phase 5/Foundation Track 2 chunk 1: define query hook contracts and cache adapter interfaces.
27. [x] Phase 5/Foundation Track 2 chunk 2: implement optimistic update and rollback primitives.
28. [x] Phase 5/Foundation Track 2 chunk 3: add offline-aware state sync and queueing patterns.
29. [x] Phase 5/Foundation Track 2 chunk 4: add mutation lifecycle state primitives and events.
30. [ ] Phase 5/Foundation Track 2 chunk 5: add tests, docs, and examples for data/state primitives.
31. [ ] Phase 5/Foundation Track 2 completion gate: all chunk outputs integrated and validated.
32. [ ] Phase 5/Foundation Track 3 chunk 1: define page-level access control contracts.
33. [ ] Phase 5/Foundation Track 3 chunk 2: define component and action-level policy primitives.
34. [ ] Phase 5/Foundation Track 3 chunk 3: implement field-level guard utilities with typed conditions.
35. [ ] Phase 5/Foundation Track 3 chunk 4: integrate tenant scoping and policy evaluation helpers.
36. [ ] Phase 5/Foundation Track 3 chunk 5: add tests, docs, and examples for access control primitives.
37. [ ] Phase 5/Foundation Track 3 completion gate: all chunk outputs integrated and validated.
38. [ ] Phase 5/Foundation Track 4 chunk 1: define error boundary and fallback view contracts.
39. [ ] Phase 5/Foundation Track 4 chunk 2: implement retry wrappers with policy configuration.
40. [ ] Phase 5/Foundation Track 4 chunk 3: add skeleton/loading-state primitives and conventions.
41. [ ] Phase 5/Foundation Track 4 chunk 4: implement optimistic rollback and recovery helpers.
42. [ ] Phase 5/Foundation Track 4 chunk 5: add tests, docs, and examples for resilience primitives.
43. [ ] Phase 5/Foundation Track 4 completion gate: all chunk outputs integrated and validated.
44. [ ] Phase 5/Foundation Track 5 chunk 1: define i18n message formatting and translation key contracts.
45. [ ] Phase 5/Foundation Track 5 chunk 2: implement locale-aware number and currency formatting helpers.
46. [ ] Phase 5/Foundation Track 5 chunk 3: implement timezone-safe date formatting and parsing helpers.
47. [ ] Phase 5/Foundation Track 5 chunk 4: implement locale-aware sort and filter utilities.
48. [ ] Phase 5/Foundation Track 5 chunk 5: add tests, docs, and examples for localization primitives.
49. [ ] Phase 5/Foundation Track 5 completion gate: all chunk outputs integrated and validated.
50. [ ] Phase 6/Auth Kit chunk 1: sign-in and sign-up flows with typed form contracts.
51. [ ] Phase 6/Auth Kit chunk 2: password recovery and magic-link authentication flows.
52. [ ] Phase 6/Auth Kit chunk 3: social login adapters and multi-factor authentication components.
53. [ ] Phase 6/Auth Kit chunk 4: session guard primitives for route and component protection.
54. [ ] Phase 6/Auth Kit chunk 5: role, permission, and tenant-aware auth context helpers.
55. [ ] Phase 6/Auth Kit release-ready gate: satisfy release-ready exit criteria.
56. [ ] Phase 7/Billing Kit chunk 1: plan catalog and plan comparison components.
57. [ ] Phase 7/Billing Kit chunk 2: checkout flow components and provider-agnostic payment adapters.
58. [ ] Phase 7/Billing Kit chunk 3: customer portal launcher and billing account management actions.
59. [ ] Phase 7/Billing Kit chunk 4: usage metering, invoice list, and billing history components.
60. [ ] Phase 7/Billing Kit chunk 5: entitlement, trial, upgrade, and downgrade flow helpers.
61. [ ] Phase 7/Billing Kit release-ready gate: satisfy release-ready exit criteria.
62. [ ] Phase 8/Tenant and Org Kit chunk 1: organization and workspace switcher primitives.
63. [ ] Phase 8/Tenant and Org Kit chunk 2: member invitation, acceptance, and lifecycle management flows.
64. [ ] Phase 8/Tenant and Org Kit chunk 3: team role assignment and seat management components.
65. [ ] Phase 8/Tenant and Org Kit chunk 4: workspace settings scaffolds with typed configuration models.
66. [ ] Phase 8/Tenant and Org Kit chunk 5: tenant resolver and tenant-safe route guard helpers.
67. [ ] Phase 8/Tenant and Org Kit release-ready gate: satisfy release-ready exit criteria.
68. [ ] Phase 9/Data Grid Pro chunk 1: advanced filtering with composable rule groups and operators.
69. [ ] Phase 9/Data Grid Pro chunk 2: faceted search and saved-view management components.
70. [ ] Phase 9/Data Grid Pro chunk 3: server-side pagination, sorting, and filtering integration adapters.
71. [ ] Phase 9/Data Grid Pro chunk 4: column pinning, visibility presets, and layout persistence.
72. [ ] Phase 9/Data Grid Pro chunk 5: row selection, bulk actions, CSV export, and inline editing flows.
73. [ ] Phase 9/Data Grid Pro release-ready gate: satisfy release-ready exit criteria.
74. [ ] Phase 10/Forms and Validation Kit chunk 1: schema-driven form builder with typed field registries.
75. [ ] Phase 10/Forms and Validation Kit chunk 2: synchronous and asynchronous validation pipelines.
76. [ ] Phase 10/Forms and Validation Kit chunk 3: dependent and conditional field behavior helpers.
77. [ ] Phase 10/Forms and Validation Kit chunk 4: autosave drafts and dirty-state navigation guard primitives.
78. [ ] Phase 10/Forms and Validation Kit chunk 5: error summary patterns and resilient file upload with retry.
79. [ ] Phase 10/Forms and Validation Kit release-ready gate: satisfy release-ready exit criteria.
80. [ ] Phase 11/Workflow and Automation UI chunk 1: visual rule builder with typed condition and action nodes.
81. [ ] Phase 11/Workflow and Automation UI chunk 2: trigger-action editor components for common automation patterns.
82. [ ] Phase 11/Workflow and Automation UI chunk 3: cron scheduler UI with validation and timezone awareness.
83. [ ] Phase 11/Workflow and Automation UI chunk 4: webhook tester and request inspector utilities.
84. [ ] Phase 11/Workflow and Automation UI chunk 5: execution log viewer with retry and replay controls.
85. [ ] Phase 11/Workflow and Automation UI release-ready gate: satisfy release-ready exit criteria.
86. [ ] Phase 12/Analytics and Dashboard Kit chunk 1: KPI card components with trend and delta indicators.
87. [ ] Phase 12/Analytics and Dashboard Kit chunk 2: time-series chart components with zoom and range controls.
88. [ ] Phase 12/Analytics and Dashboard Kit chunk 3: cohort and funnel visualization primitives.
89. [ ] Phase 12/Analytics and Dashboard Kit chunk 4: retention analysis components with configurable breakdowns.
90. [ ] Phase 12/Analytics and Dashboard Kit chunk 5: configurable dashboard layouts with saved presets and sharing hooks.
91. [ ] Phase 12/Analytics and Dashboard Kit release-ready gate: satisfy release-ready exit criteria.
92. [ ] Phase 13/Notifications and Inbox Kit chunk 1: global toast system with severity, queueing, and dismissal policies.
93. [ ] Phase 13/Notifications and Inbox Kit chunk 2: in-app notification center with grouping and filtering.
94. [ ] Phase 13/Notifications and Inbox Kit chunk 3: notification template and delivery-channel configuration primitives.
95. [ ] Phase 13/Notifications and Inbox Kit chunk 4: user preferences center for notification controls.
96. [ ] Phase 13/Notifications and Inbox Kit chunk 5: unread counters and actionable notification interaction patterns.
97. [ ] Phase 13/Notifications and Inbox Kit release-ready gate: satisfy release-ready exit criteria.
98. [ ] Phase 14/Admin and Ops Console Kit chunk 1: feature flag management UI with environment targeting.
99. [ ] Phase 14/Admin and Ops Console Kit chunk 2: user impersonation flow indicators and safety controls.
100. [ ] Phase 14/Admin and Ops Console Kit chunk 3: audit timeline components with actor and event filtering.
101. [ ] Phase 14/Admin and Ops Console Kit chunk 4: system health and diagnostics panel primitives.
102. [ ] Phase 14/Admin and Ops Console Kit chunk 5: support tooling and API key management components.
103. [ ] Phase 14/Admin and Ops Console Kit release-ready gate: satisfy release-ready exit criteria.
104. [ ] Phase 15/Onboarding and Adoption Kit chunk 1: guided tour framework with step orchestration.
105. [ ] Phase 15/Onboarding and Adoption Kit chunk 2: onboarding checklist widget with progress persistence.
106. [ ] Phase 15/Onboarding and Adoption Kit chunk 3: reusable empty-state templates with contextual actions.
107. [ ] Phase 15/Onboarding and Adoption Kit chunk 4: contextual help panel and in-product support prompts.
108. [ ] Phase 15/Onboarding and Adoption Kit chunk 5: feedback, NPS, and CSAT collection components.
109. [ ] Phase 15/Onboarding and Adoption Kit release-ready gate: satisfy release-ready exit criteria.

## Phase-to-Backlog Mapping

| Phase | Backlog Item | Scope Anchor | Current Status |
| --- | --- | --- | --- |
| Phase 5: Foundation Tracks | 20-49 | Foundation checklist items 1-5 | Not started |
| Phase 6: Auth Kit | 50-55 | Auth checklist items 1-5 + release-ready criteria | Not started |
| Phase 7: Billing Kit | 56-61 | Billing checklist items 1-5 + release-ready criteria | Not started |
| Phase 8: Tenant and Org Kit | 62-67 | Tenant and Org checklist items 1-5 + release-ready criteria | Not started |
| Phase 9: Data Grid Pro | 68-73 | Data Grid Pro checklist items 1-5 + release-ready criteria | Not started |
| Phase 10: Forms and Validation Kit | 74-79 | Forms and Validation checklist items 1-5 + release-ready criteria | Not started |
| Phase 11: Workflow and Automation UI | 80-85 | Workflow and Automation UI checklist items 1-5 + release-ready criteria | Not started |
| Phase 12: Analytics and Dashboard Kit | 86-91 | Analytics and Dashboard checklist items 1-5 + release-ready criteria | Not started |
| Phase 13: Notifications and Inbox Kit | 92-97 | Notifications and Inbox checklist items 1-5 + release-ready criteria | Not started |
| Phase 14: Admin and Ops Console Kit | 98-103 | Admin and Ops checklist items 1-5 + release-ready criteria | Not started |
| Phase 15: Onboarding and Adoption Kit | 104-109 | Onboarding and Adoption checklist items 1-5 + release-ready criteria | Not started |

## Definition Of Done (for each item)

1. Implementation is complete and typed.
2. Unit tests are added and passing.
3. `npm run quality:check` passes.
4. README is updated with usage examples.
5. Wiki page is updated and published.
6. PR includes Summary, What Changed, Key Files, Validation, Notes.

## Release-Ready Exit Criteria (for each component phase)

1. Public API surface is documented, versioned, and backward-compatibility reviewed.
2. End-to-end happy-path flows are implemented and test-covered.
3. Security and access-control checks are integrated (role/permission/tenant scope where relevant).
4. Observability is integrated (audit/telemetry/error reporting where relevant).
5. Performance and resilience checks are completed for critical user flows.
6. Migration notes (if any behavioral/API changes) are captured using the migration framework.

## Next Item To Execute

- Item 30: Phase 5/Foundation Track 2 chunk 5 - tests, docs, and examples for data/state primitives.
- Scope for next implementation:
- Expand integration tests across query, optimistic, offline queue, and mutation lifecycle contracts.
- Add consolidated Foundation Track 2 examples in README for query and mutation workflows.
- Confirm public API completeness for Track 2 ahead of completion gate item 31.
