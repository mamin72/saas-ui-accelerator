# Quick Start

## Install

```bash
npm install sort_component
```

## Basic Example

```ts
import { sortByRules, type SortRule } from "sort_component";

type Person = {
  lastName: string;
  givenNames: string[];
};

const rules: SortRule<Person>[] = [
  { id: "last", direction: "asc", selector: (x) => x.lastName },
  { id: "g1", direction: "asc", selector: (x) => x.givenNames[0] },
  { id: "g2", direction: "asc", selector: (x) => x.givenNames[1] }
];

const sorted = sortByRules(data, rules);
```

## Quality Commands (for contributors)

```bash
npm run quality:check
```
