# Open Source Publishing Guide for saas-ui-accelerator

This document explains how to prepare, publish, and consume this component as an open-source npm package.

## 1) Goals

- Keep the library easy to consume in application projects.
- Publish a stable npm package with clear versioning.
- Support community contribution and basic security hygiene.

## 2) Current Package Layout

The project currently ships TypeScript source from src and compiles to dist through TypeScript compiler.

Required files are already present:

- package.json
- tsconfig.json
- src/index.ts
- README.md

## 3) Make package.json Open-Source Ready

Before publishing, update package.json with public metadata and publish settings.

Recommended fields:

- name: use a globally unique package name, or scoped name like @your-scope/sort-component
- version: semantic version, for example 1.0.0
- description: short package summary
- license: MIT (or your preferred SPDX license)
- repository: GitHub URL
- homepage: project homepage URL
- bugs: issue tracker URL
- keywords: npm search terms
- files: include only dist and docs you want published
- publishConfig.access: public (required for scoped public packages)

Suggested package.json additions:

```json
{
  "type": "commonjs",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mamin72/saas-ui-accelerator.git"
  },
  "homepage": "https://github.com/mamin72/saas-ui-accelerator#readme",
  "bugs": {
    "url": "https://github.com/mamin72/saas-ui-accelerator/issues"
  },
  "keywords": [
    "sorting",
    "typescript",
    "utility",
    "rules"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

## 4) Add Open-Source Standard Files

Create these files at repository root:

- LICENSE
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md
- CHANGELOG.md

What each file should contain:

- LICENSE: legal terms for usage and distribution (MIT is common for libraries)
- CONTRIBUTING.md: branch, PR, test, and coding workflow
- CODE_OF_CONDUCT.md: expected behavior in community spaces
- SECURITY.md: vulnerability reporting process
- CHANGELOG.md: release notes by version

## 5) Pre-Publish Quality Checklist

Run these commands:

- npm ci
- npm run quality:check
- npm run build
- npm pack --dry-run

Verify from dry run:

- dist output is included
- source files not intended for publishing are excluded
- README and LICENSE are included

## 6) Publishing Steps

1. Login to npm:

   npm login

2. Ensure build output is current:

   npm run build

3. Publish:

   npm publish

For scoped package with public access:

   npm publish --access public

## 7) Versioning Strategy

Use Semantic Versioning:

- Patch: bug fixes only
- Minor: backward-compatible features
- Major: breaking changes

Version commands:

- npm version patch
- npm version minor
- npm version major

After version bump:

- Push commit and tags
- Publish the new version
- Update CHANGELOG.md

## 8) GitHub Release Workflow (Recommended)

Recommended flow:

1. Merge PR into main
2. Run CI (typecheck, lint, tests, coverage)
3. Build package
4. Publish to npm
5. Create GitHub release with changelog notes

Optional automation:

- Add GitHub Actions workflow to run quality checks on pull requests
- Add manual publish workflow protected by repository permissions

## 9) Consumer Integration in an App

Install:

- npm install saas-ui-accelerator

Use in your app common components layer:

```ts
import { sortByRules, type SortRule } from "saas-ui-accelerator";

type PersonName = {
  lastName: string;
  givenNames: string[];
};

const rules: SortRule<PersonName>[] = [
  { id: "last", direction: "asc", selector: (x) => x.lastName },
  { id: "g1", direction: "asc", selector: (x) => x.givenNames[0] },
  { id: "g2", direction: "asc", selector: (x) => x.givenNames[1] }
];

export function sortPersonNames(items: PersonName[]): PersonName[] {
  return sortByRules(items, rules);
}
```

## 10) Recommended Next Improvements

- Add explicit exports map in package.json for future ESM/CJS compatibility.
- Add API docs section in README with examples for strings, numbers, dates, and null behavior.
- Add benchmark and large-input tests for performance confidence.
- Add release automation when the package stabilizes.

## 11) Quick Start Checklist

- Update package.json metadata
- Add LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md
- Run npm run quality:check
- Run npm run build
- Run npm pack --dry-run
- Publish with npm publish --access public
- Tag release in GitHub

