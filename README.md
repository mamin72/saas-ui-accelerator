# sort_component

Reusable TypeScript sorting component library.

## Feature Status

### Available Now

- Core sorting engine: `sortByRules`
- Built-in format codecs and parse+sort APIs: JSON, JSONL/NDJSON, CSV, TSV, XML, YAML
- Table engine: `JsonTableComponent` with sortable headers and datatype-aware formatting
- Action column support: `view`, `edit`, `archive`, `delete` with router hooks and confirmation support
- Facade API: `myComponent` with aliases (`SortData`, `Sort`, `SortableTable`, `Table`, `myComponet`)

### Planned (Future)

See [roadmap.md](roadmap.md) for phased delivery details. Summary of next major component tracks:

1. Auth Kit
2. Billing Kit
3. Tenant and Org Kit
4. Data Grid Pro expansion
5. Forms and Validation Kit
6. Workflow and Automation UI
7. Analytics and Dashboard Kit
10. Onboarding and Adoption Kit

### README Maintenance Rule

For every feature PR:

1. Add newly shipped capabilities to `Available Now`.
2. Remove completed items from `Planned (Future)` and keep them in `roadmap.md` as delivered milestones.
3. Keep examples and API references aligned with the current release state.

## Data Format Contract

`sort_component` now supports modern input formats directly through built-in codecs.

Supported formats:

- JSON
- JSONL / NDJSON
- CSV
- TSV
- XML
- YAML

You can still sort typed arrays directly with `sortByRules`, or use parse-and-sort APIs when the input is not already an array.

```ts
import { parseAndSort, sortByRules } from "sort_component";

// Direct array sorting
const sortedArray = sortByRules(items, rules);

// Format-aware parsing + sorting
const sortedFromCsv = parseAndSort(csvText, {
	format: "csv",
	rules,
});
```

For stream inputs:

```ts
import { parseAndSortFromStream } from "sort_component";

const sorted = await parseAndSortFromStream(stream, {
	format: "jsonl",
	rules,
});
```

## Json Table Component

The package also includes a reusable table component model that accepts JSON and
supports click-style header toggle sorting.

```ts
import { JsonTableComponent } from "sort_component";

const table = new JsonTableComponent({
	data: jsonString,
	columns: [
		{ key: "name", header: "Name", dataType: "text", sortable: true },
		{ key: "amount", header: "Amount", dataType: "currency", currencyCode: "USD" },
		{ key: "createdUtc", header: "Created", dataType: "date", temporalType: "datetime", convertUtcToClientLocal: true },
		{ key: "active", header: "Active", dataType: "boolean", booleanDisplay: "icon" }
	]
});

table.toggleSort("name");
const headers = table.getHeaders();
const rows = table.getTableRows();
```

Column data types and formatting:

- `text`
- `number` (right aligned)
- `decimal` (right aligned, configurable decimal places)
- `currency` (right aligned, default 2 decimals, ISO currency code)
- `date` and `datetime` (US, UK, Chinese locales; short or long format; UTC-to-local option)
- `boolean` (`Yes/No` or `✓/✗`)

Action column support:

- built-in `view`, `edit`, `archive`, `delete` actions
- MUI icon names included (`Visibility`, `Edit`, `Archive`, `Delete`)
- router navigation hooks for each action
- built-in confirmation before `archive` and `delete`

```ts
import { JsonTableComponent, createDefaultMuiActionColumn } from "sort_component";

const actionColumn = createDefaultMuiActionColumn({
	router: { navigate: (to) => router.navigate(to) },
	getViewRoute: (row) => `/users/${row.id}`,
	getEditRoute: (row) => `/users/${row.id}/edit`,
	getArchiveRoute: (row) => `/users/${row.id}/archive`,
	getDeleteRoute: (row) => `/users/${row.id}/delete`,
	confirm: ({ message }) => window.confirm(message)
});

const table = new JsonTableComponent({ data: jsonString, columns, actionColumn });
```

## Facade API (Requested Naming Style)

If you prefer a single entry object, use `myComponent`:

```ts
import { myComponent } from "sort_component";

const sorted = myComponent.SortData(rows, rules);
const table = new myComponent.SortableTable({ data: jsonString, columns });

// Short aliases
const sorted2 = myComponent.Sort(rows, rules);
const table2 = new myComponent.Table({ data: jsonString, columns });
```

Compatibility aliases are included:

- `myComponent.Sort` (alias of `SortData`)
- `myComponent.Table` (alias of `SortableTable`)
- `myComponet` (typo-compatible alias of `myComponent`)

## Licensing

This project uses a dual-license model:

- Non-commercial usage is allowed under the default repository license.
- Commercial usage requires a separate paid commercial license.

See [LICENSE](LICENSE) and [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md) for details.

For commercial licensing requests, contact the repository owner:
- https://github.com/mamin72

## Setup

```bash
npm install
```

## Scripts

```bash
npm run build
npm run test
npm run test:coverage
npm run lint
npm run typecheck
npm run quality:check
```

## Wiki

The project includes versioned wiki content in the `wiki/` folder:

- `Home.md`
- `Quick-Start.md`
- `Use-in-Your-App.md`
- `API-Reference.md`
- `Licensing.md`
- `FAQ.md`

Publish to GitHub wiki:

1. Create one initial wiki page in GitHub UI (this initializes the wiki git backend):
	- https://github.com/mamin72/sort_component/wiki
2. Run the publish script:

```powershell
pwsh ./scripts/publish-wiki.ps1
```
