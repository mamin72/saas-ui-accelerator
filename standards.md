# Engineering And Product Standards

These standards are mandatory for all work in this repository.

## Product Vision

Build a top-class commercial component library that lets teams ship SaaS products in days, not months.

## Non-Negotiable Rules

1. Minimum 95% test coverage on everything.
2. Reuse everything across the library whenever possible.
3. Do not rewrite existing logic if it can be extracted or reused as a shared component.
4. No "minimum API" mindset. APIs must be complete, ergonomic, and production-ready.
5. Every shipped feature must feel commercial-grade in design, behavior, DX, and documentation.

## Reusability First Policy

1. Before writing new code, search for existing utilities, types, engines, and helpers that can be reused.
2. Prefer composition over duplication.
3. If logic appears in two places, extract it to a shared module.
4. New features must be designed as reusable primitives plus optional higher-level convenience APIs.
5. Public APIs should be generic, extensible, and strongly typed.

## API Quality Standards

1. Design APIs for real-world SaaS use cases, not toy scenarios.
2. Avoid narrow one-off APIs when a composable API can solve the same problem.
3. Preserve backward compatibility. Use deprecations before removals.
4. Provide practical defaults with full override capabilities.
5. Ensure naming consistency across modules and facade exports.

## Testing Standards

1. Every new behavior requires unit tests.
2. Critical paths require branch-focused tests, not only happy-path assertions.
3. Regression tests are required for every bug fix.
4. Test coverage target:
- Statements: >= 95%
- Branches: >= 95%
- Functions: >= 95%
- Lines: >= 95%
5. Do not merge changes that reduce quality gate thresholds.

## Quality Gate

All PRs must pass:

1. Type checking with strict settings.
2. Lint with zero warnings.
3. Full test suite with coverage thresholds enforced.
4. Documentation updates for user-visible changes.

Command:

`npm run quality:check`

## Documentation Standards

1. README must reflect the current public API.
2. Wiki pages must be updated for all new features and behavioral changes.
3. Every major API should include copy-paste-ready examples.
4. Document defaults, edge cases, and extension points.
5. Avoid vague wording; document expected inputs and outputs explicitly.

## Pull Request Standards

Each PR description must include:

1. Summary
2. What Changed
3. Key Files
4. Validation
5. Notes

Additional PR rules:

1. Keep PR scope focused on one roadmap item at a time.
2. Include migration or compatibility notes when applicable.
3. If tradeoffs were made, explain why and what alternatives were considered.

## Performance And Reliability Standards

1. Avoid unnecessary allocations and repeated parsing in hot paths.
2. Keep component behavior deterministic and side-effect aware.
3. Validate and fail fast on invalid configuration.
4. Provide stable behavior for null, undefined, malformed, and mixed-type inputs.
5. Prefer predictable outcomes over implicit magic.

## Commercial Readiness Checklist (Per Feature)

1. Reusable architecture with no unnecessary duplication.
2. Complete API surface for practical SaaS usage.
3. Strong typing and clear runtime validation.
4. High-confidence test coverage and regression safety.
5. Documentation and examples ready for immediate adoption.
6. Merge-ready PR with quality checks passing.

## Working Agreement

1. Tackle one roadmap item at a time.
2. Finish implementation, tests, docs, and validation before moving to the next item.
3. Maintain these standards as the default policy for all future changes.
