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
30. [x] Phase 5/Foundation Track 2 chunk 5: add tests, docs, and examples for data/state primitives.
31. [x] Phase 5/Foundation Track 2 completion gate: all chunk outputs integrated and validated.
32. [x] Phase 5/Foundation Track 3 chunk 1: define page-level access control contracts.
33. [x] Phase 5/Foundation Track 3 chunk 2: define component and action-level policy primitives.
34. [x] Phase 5/Foundation Track 3 chunk 3: implement field-level guard utilities with typed conditions.
35. [x] Phase 5/Foundation Track 3 chunk 4: integrate tenant scoping and policy evaluation helpers.
36. [x] Phase 5/Foundation Track 3 chunk 5: add tests, docs, and examples for access control primitives.
37. [x] Phase 5/Foundation Track 3 completion gate: all chunk outputs integrated and validated.
38. [x] Phase 5/Foundation Track 4 chunk 1: define error boundary and fallback view contracts.
39. [x] Phase 5/Foundation Track 4 chunk 2: implement retry wrappers with policy configuration.
40. [x] Phase 5/Foundation Track 4 chunk 3: add skeleton/loading-state primitives and conventions.
41. [x] Phase 5/Foundation Track 4 chunk 4: implement optimistic rollback and recovery helpers.
42. [ ] Phase 5/Foundation Track 4 chunk 5: add tests, docs, and examples for resilience primitives.
43. [ ] Phase 5/Foundation Track 4 completion gate: all chunk outputs integrated and validated.
44. [ ] Phase 5/Foundation Track 5 chunk 1: define i18n message formatting and translation key contracts.
45. [ ] Phase 5/Foundation Track 5 chunk 2: implement locale-aware number and currency formatting helpers.
46. [ ] Phase 5/Foundation Track 5 chunk 3: implement timezone-safe date formatting and parsing helpers.
47. [ ] Phase 5/Foundation Track 5 chunk 4: implement locale-aware sort and filter utilities.
48. [ ] Phase 5/Foundation Track 5 chunk 5: add tests, docs, and examples for localization primitives.
49. [ ] Phase 5/Foundation Track 5 completion gate: all chunk outputs integrated and validated.
50. [ ] Phase 6/Auth Kit chunk 1: define sign-in/sign-up form schemas, typed submission contracts, and validation/error mapping helpers.
51. [ ] Phase 6/Auth Kit chunk 2: implement password recovery and magic-link workflows with token lifecycle, expiry handling, and typed callbacks.
52. [ ] Phase 6/Auth Kit chunk 3: add social login adapter contracts and MFA challenge primitives with pluggable provider interfaces.
53. [ ] Phase 6/Auth Kit chunk 4: implement route/component session guards with unauthenticated fallback and revalidation behavior.
54. [ ] Phase 6/Auth Kit chunk 5: add role/permission evaluators and tenant-aware auth context composition utilities.
55. [ ] Phase 6/Auth Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
56. [ ] Phase 7/Billing Kit chunk 1: define typed plan catalog models, comparison metadata, and pricing presentation helpers.
57. [ ] Phase 7/Billing Kit chunk 2: implement checkout flow contracts and provider-agnostic payment adapter interfaces with lifecycle events.
58. [ ] Phase 7/Billing Kit chunk 3: add customer portal launcher contracts and billing account action primitives with capability checks.
59. [ ] Phase 7/Billing Kit chunk 4: implement usage metering records, invoice list models, and billing history query helpers.
60. [ ] Phase 7/Billing Kit chunk 5: add entitlement and trial-state evaluators plus typed upgrade/downgrade transition helpers.
61. [ ] Phase 7/Billing Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
62. [ ] Phase 8/Tenant and Org Kit chunk 1: implement organization/workspace switcher contracts, selectors, and active-context state helpers.
63. [ ] Phase 8/Tenant and Org Kit chunk 2: define invite lifecycle contracts and acceptance/revocation flow primitives with status tracking.
64. [ ] Phase 8/Tenant and Org Kit chunk 3: add team role assignment and seat allocation/reclamation primitives with policy validation.
65. [ ] Phase 8/Tenant and Org Kit chunk 4: implement workspace settings scaffold models, typed config registries, and serialization helpers.
66. [ ] Phase 8/Tenant and Org Kit chunk 5: add tenant resolver strategies and tenant-safe route guard evaluation utilities.
67. [ ] Phase 8/Tenant and Org Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
68. [ ] Phase 9/Data Grid Pro chunk 1: implement advanced filter rule-group contracts, operator registries, and composition/evaluation helpers.
69. [ ] Phase 9/Data Grid Pro chunk 2: add faceted-search state primitives and saved-view CRUD contracts with persistence adapters.
70. [ ] Phase 9/Data Grid Pro chunk 3: implement server-side pagination/sort/filter request builders and response normalization adapters.
71. [ ] Phase 9/Data Grid Pro chunk 4: add column pinning/visibility preset contracts and layout persistence serialization helpers.
72. [ ] Phase 9/Data Grid Pro chunk 5: implement row selection + bulk-action orchestration with CSV export and inline-edit state guards.
73. [ ] Phase 9/Data Grid Pro release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
74. [ ] Phase 10/Forms and Validation Kit chunk 1: implement schema-driven form contracts, typed field registries, and field-render mapping helpers.
75. [ ] Phase 10/Forms and Validation Kit chunk 2: add sync/async validation pipeline primitives with typed error aggregation strategies.
76. [ ] Phase 10/Forms and Validation Kit chunk 3: implement dependent-field condition contracts and reactive recalculation helpers.
77. [ ] Phase 10/Forms and Validation Kit chunk 4: add autosave draft lifecycle primitives and dirty-state navigation guard evaluators.
78. [ ] Phase 10/Forms and Validation Kit chunk 5: implement error summary models and resilient file-upload retry orchestration helpers.
79. [ ] Phase 10/Forms and Validation Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
80. [ ] Phase 11/Workflow and Automation UI chunk 1: define visual rule-builder node/edge contracts and typed condition/action registries.
81. [ ] Phase 11/Workflow and Automation UI chunk 2: implement trigger-action editor state models and reusable pattern composition helpers.
82. [ ] Phase 11/Workflow and Automation UI chunk 3: add cron scheduler parsing/validation primitives with timezone-safe schedule helpers.
83. [ ] Phase 11/Workflow and Automation UI chunk 4: implement webhook tester request/response contracts and inspector normalization utilities.
84. [ ] Phase 11/Workflow and Automation UI chunk 5: add execution log models with retry/replay command primitives and status evaluators.
85. [ ] Phase 11/Workflow and Automation UI release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
86. [ ] Phase 12/Analytics and Dashboard Kit chunk 1: define KPI card contracts, trend/delta semantics, and formatter-ready metric models.
87. [ ] Phase 12/Analytics and Dashboard Kit chunk 2: implement time-series dataset contracts and zoom/range state coordination helpers.
88. [ ] Phase 12/Analytics and Dashboard Kit chunk 3: add typed cohort/funnel data-shape adapters and visualization input normalization utilities.
89. [ ] Phase 12/Analytics and Dashboard Kit chunk 4: implement retention breakdown contracts with segmentation and comparison helpers.
90. [ ] Phase 12/Analytics and Dashboard Kit chunk 5: add dashboard layout persistence contracts with saved preset/share-link primitives.
91. [ ] Phase 12/Analytics and Dashboard Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
92. [ ] Phase 13/Notifications and Inbox Kit chunk 1: implement global toast contracts for severity, queue policy, dedupe, and dismissal behavior.
93. [ ] Phase 13/Notifications and Inbox Kit chunk 2: add notification-center grouping/filter state contracts and list virtualization helpers.
94. [ ] Phase 13/Notifications and Inbox Kit chunk 3: define template/channel configuration models and delivery routing adapter contracts.
95. [ ] Phase 13/Notifications and Inbox Kit chunk 4: implement user preference schemas and channel-level opt-in/opt-out evaluator helpers.
96. [ ] Phase 13/Notifications and Inbox Kit chunk 5: add unread-counter derivation and actionable interaction lifecycle primitives.
97. [ ] Phase 13/Notifications and Inbox Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
98. [ ] Phase 14/Admin and Ops Console Kit chunk 1: define feature-flag targeting contracts and environment-scoped configuration helpers.
99. [ ] Phase 14/Admin and Ops Console Kit chunk 2: implement impersonation session indicator contracts and guardrail/safety policy evaluators.
100. [ ] Phase 14/Admin and Ops Console Kit chunk 3: add audit timeline event contracts and actor/event filter composition helpers.
101. [ ] Phase 14/Admin and Ops Console Kit chunk 4: implement system health panel contracts with diagnostics status aggregation primitives.
102. [ ] Phase 14/Admin and Ops Console Kit chunk 5: add support tooling and API key lifecycle helpers including rotation/revocation contracts.
103. [ ] Phase 14/Admin and Ops Console Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.
104. [ ] Phase 15/Onboarding and Adoption Kit chunk 1: define guided-tour step contracts and orchestration lifecycle helpers.
105. [ ] Phase 15/Onboarding and Adoption Kit chunk 2: implement checklist progress-state contracts with persistence and completion evaluators.
106. [ ] Phase 15/Onboarding and Adoption Kit chunk 3: add reusable empty-state template contracts and contextual action mapping helpers.
107. [ ] Phase 15/Onboarding and Adoption Kit chunk 4: implement contextual help panel contracts and in-product support prompt orchestration helpers.
108. [ ] Phase 15/Onboarding and Adoption Kit chunk 5: add feedback, NPS, and CSAT collection contracts with typed scoring/analytics payload helpers.
109. [ ] Phase 15/Onboarding and Adoption Kit release-ready gate: integrate chunks 1-5, export public APIs, and validate with integration tests, docs, and usage examples.

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

- Item 33: Phase 5/Foundation Track 3 chunk 2 - define component and action-level policy primitives.
- Scope for next implementation:
- Define typed component-level policy contracts and action-level guard models.
- Add composition helpers for combining policy predicates and guard outcomes.
- Add tests and README examples for component/action policy enforcement.
