# Quick Start

## Install

```bash
npm install saas-ui-accelerator
```

## Basic Example

```ts
import { sortByRules, type SortRule } from "saas-ui-accelerator";

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

## Supported Input Formats

The library supports:

- direct typed arrays (`sortByRules`)
- JSON, JSONL, CSV, TSV, XML, YAML (`parseAndSort`)
- text streams (`parseAndSortFromStream`)

```ts
import { parseAndSort } from "saas-ui-accelerator";

const sorted = parseAndSort("name,score\\nA,1\\nB,3", {
  format: "csv",
  rules: [{ id: "score", direction: "desc", selector: (x) => Number(x.score) }]
});
```

See [Data Formats](Data-Formats) for full details.

## Quality Commands (for contributors)

```bash
npm run quality:check
```

