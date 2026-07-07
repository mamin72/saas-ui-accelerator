# Contributing

Thank you for contributing to sort_component.

## Development Setup

1. Install dependencies:

   npm install

2. Run quality checks:

   npm run quality:check

3. Build the package:

   npm run build

## Branch and PR Workflow

1. Create a feature branch from main.
2. Keep each pull request focused on one concern.
3. Add or update tests for behavior changes.
4. Ensure quality checks pass before opening a PR.

## Coding Standards

- Use TypeScript with strict typing.
- Keep code modular and focused on single responsibility.
- Prefer clear naming over abbreviations.
- Keep comments short and only where needed.

## Test Expectations

- New logic should include unit tests.
- Coverage must remain at or above configured thresholds.

## Commit Messages

Use descriptive commit messages that explain intent.

Examples:

- feat: add null ordering option for rule selector
- fix: ensure date comparison is stable
- test: add coverage for mixed type fallback

## Pull Request Checklist

- Code compiles successfully
- Tests pass
- Lint passes
- Documentation updated when needed
- CHANGELOG updated for user-facing changes
