# Use in Your App

A good pattern is to wrap this library in your app's common components layer.

## Example Adapter

```ts
import { sortByRules, type SortRule } from "saas-ui-accelerator";

export interface PersonName {
  readonly lastName: string;
  readonly givenNames: readonly string[];
}

const rules: readonly SortRule<PersonName>[] = [
  { id: "lastName", direction: "asc", selector: (x) => x.lastName },
  { id: "given1", direction: "asc", selector: (x) => x.givenNames[0] },
  { id: "given2", direction: "asc", selector: (x) => x.givenNames[1] }
];

export function sortPersonNames(items: readonly PersonName[]): PersonName[] {
  return sortByRules(items, rules);
}
```

## Tips

- Keep your rule definitions close to your domain model.
- Prefer one adapter per domain object to avoid duplicated sorting logic.
- Add tests around edge cases such as null values and tie-breakers.
- Parse text/stream/JSON/XML into typed arrays before calling the sorter.

For source format specifics, see [Data Formats](Data-Formats).

