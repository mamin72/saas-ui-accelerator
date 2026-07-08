# saas-ui-accelerator

Reusable TypeScript sorting component library.

## Unified Namespace

The package now exposes a unified namespace so you can consume all kits from one import.

```ts
import { component } from "saas-ui-accelerator";

const auth = component.authKit.createContext({
	tenantId: "tenant-1",
	userId: "user-1",
	roles: ["admin"],
	permissions: ["billing:manage"]
});

const hasBilling = component.billingKit.createEntitlementChecker({
	features: ["billing", "analytics"]
});

const table = component.dataGridPro.createTable({
	data: [{ id: "1", name: "Alice" }],
	columns: [{ key: "name", header: "Name", dataType: "text" }],
	rowKey: "id"
});
```

Kebab-case aliases are available through string keys:

```ts
component["auth-kit"];
component["billing-kit"];
component["data-grid-pro"];
```

Note: `component.auth-kit` is not valid JavaScript syntax. Use `component.authKit` or bracket access.

Progressive roadmap enablement:

```ts
import { createEnabledComponent } from "saas-ui-accelerator";

const runtime = createEnabledComponent({
	enabledKits: ["data-grid-pro", "foundation-primitives"]
});

runtime.isEnabled("data-grid-pro"); // true
runtime.isEnabled("auth-kit"); // false

// Enabled
runtime.component.dataGridPro;

// Disabled kits throw if used until enabled in roadmap progression
// runtime.component.authKit.createContext(...)
```

## Feature Status

### Available Now

- Core sorting engine: `sortByRules`
- Built-in format codecs and parse+sort APIs: JSON, JSONL/NDJSON, CSV, TSV, XML, YAML
- Table engine: `JsonTableComponent` with sortable headers and datatype-aware formatting
- Multi-column sorting support with stable precedence (`setSortRules`, `appendSort`)
- Table filtering engine with AND-combined filters (`contains`, `equals`, `startsWith`, `eq`, `gt`, `gte`, `lt`, `lte`, `between`, `isTrue`, `isFalse`)
- Client-side pagination helpers with page controls and metadata (`setPagination`, `setPageSize`, `setPageIndex`, `getPageInfo`)
- Column visibility state helpers (`setColumnVisibility`, `toggleColumnVisibility`, `setColumnVisibilityMap`, `clearColumnVisibility`)
- Row selection and bulk action helpers (`selectRowByKey`, `selectAllFilteredRows`, `getSelectionInfo`, `executeBulkAction`)
- CSV export utility (`exportCsv` with all/filtered/sorted/paginated/selected scopes)
- Formatter preset helpers (`currencyPacks`, `localePacks`, `timezonePacks`, `createCurrencyPreset`, `createDateFormatterPreset`, `createDateTimeFormatterPreset`, `createTimezonePreset`)
- Validation helpers for column configs, row keys, delimiter checks, and supported format errors
- Starter templates for table and parse+sort setup (`createTableStarterTemplate`, `createParseAndSortStarterTemplate`, `parseAndSortWithStarterTemplate`)
- Schema-driven column builder utilities (`createColumnSchemaBuilder`, `defineTableColumns`)
- Strong TypeScript row/column inference helpers (`createTypedTableOptions`, `createTypedTableComponent`)
- Saved views model for table state round-trip (`createSavedView`, `applySavedView`, `saveView`, `loadView`, `listSavedViews`)
- Server-side mode adapters for API-ready request models (`toServerSortRules`, `toServerFilterRules`, `toServerPaginationRequest`, `createServerTableRequest`)
- Action audit metadata hooks for row actions (`onAudit` with structured lifecycle events)
- Permission-aware action predicates (`permissions`, `permissionResolver`, predicate context helpers)
- Usage telemetry hooks for table interactions (`telemetry` on `JsonTableComponent`)
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

`saas-ui-accelerator` now supports modern input formats directly through built-in codecs.

Supported formats:

- JSON
- JSONL / NDJSON
- CSV
- TSV
- XML
- YAML

You can still sort typed arrays directly with `sortByRules`, or use parse-and-sort APIs when the input is not already an array.

```ts
import { parseAndSort, sortByRules } from "saas-ui-accelerator";

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
import { parseAndSortFromStream } from "saas-ui-accelerator";

const sorted = await parseAndSortFromStream(stream, {
	format: "jsonl",
	rules,
});
```

## Json Table Component

The package also includes a reusable table component model that accepts JSON and
supports click-style header toggle sorting.

```ts
import { JsonTableComponent, currencyPacks } from "saas-ui-accelerator";

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

table.setSortRules([
	{ columnKey: "createdUtc", direction: "desc" },
	{ columnKey: "name", direction: "asc" }
]);

table.appendSort("amount", "desc");
const activeSortRules = table.getSortRules();

table.setPagination({ pageIndex: 0, pageSize: 25 });
table.setPageIndex(1);
table.setPageSize(50, { resetToFirstPage: true });

const pageRows = table.getPaginatedRows();
const pageInfo = table.getPageInfo();

table.setColumnVisibility("amount", false);
table.toggleColumnVisibility("name");
table.setColumnVisibilityMap({
	name: true,
	age: true,
	score: true,
	amount: false,
	createdUtc: true,
	active: true
});

const visibility = table.getColumnVisibility();

table.setSelectedRowKeys([0]);
table.selectAllFilteredRows();
const selectedKeys = table.getSelectedRowKeys();
const selectedRows = table.getSelectedRows();
const selectionInfo = table.getSelectionInfo();

const bulkResult = await table.executeBulkAction((context) => {
	return {
		count: context.selectedRows.length,
		selectedKeys: context.selectedRowKeys
	};
});

const csvAll = table.exportCsv();
const csvVisibleOnly = table.exportCsv({ scope: "sorted", delimiter: ";" });
const csvSelected = table.exportCsv({ scope: "selected", includeHeaders: false });

const eurAmountColumn = {
	key: "amount",
	header: "Amount",
	...currencyPacks.eur
};


table.setFilters([
	{ columnKey: "name", operator: "contains", value: "ali" },
	{ columnKey: "age", operator: "gte", value: 30 }
]);

const filteredRows = table.getFilteredRows();
```

Column data types and formatting:

- `text`
- `number` (right aligned)
- `decimal` (right aligned, configurable decimal places)
- `currency` (right aligned, default 2 decimals, ISO currency code)
- `date` and `datetime` (US, UK, Chinese locales; short or long format; UTC-to-local option)
- `boolean` (`Yes/No` or `✓/✗`)
- `enum` (text semantics; useful for fixed-value columns like plans/statuses)

Filter operators by datatype:

- text/enum: `contains`, `equals`, `startsWith`
- number/decimal/currency/date/datetime: `eq`, `gt`, `gte`, `lt`, `lte`, `between`
- boolean: `isTrue`, `isFalse`, `eq`

Sorting APIs:

- `toggleSort(columnKey)` (backward-compatible single-column toggle)
- `setSortRules([{ columnKey, direction }, ...])` (replace with multi-column precedence)
- `appendSort(columnKey, direction?)` (append or update a column in precedence order)
- `getSortRules()` (read active multi-sort precedence)

Pagination APIs:

- `setPagination({ pageIndex, pageSize })`
- `setPageIndex(pageIndex)`
- `setPageSize(pageSize, { resetToFirstPage? })`
- `getPaginatedRows()`
- `getPageInfo()`
- `clearPagination()`

Column visibility APIs:

- `getColumnVisibility()`
- `setColumnVisibility(columnKey, isVisible)`
- `toggleColumnVisibility(columnKey)`
- `setColumnVisibilityMap({ [columnKey]: boolean })`
- `clearColumnVisibility()`

Row selection APIs:

- `setSelectedRowKeys(keys)`
- `getSelectedRowKeys()`
- `selectRowByKey(key)` / `deselectRowByKey(key)` / `toggleRowSelectionByKey(key)`
- `selectRow(row)` / `deselectRow(row)` / `toggleRowSelection(row)`
- `selectAllRows()` / `selectAllFilteredRows()` / `selectAllPaginatedRows()`
- `clearSelection()`
- `getSelectedRows()` / `getSelectedFilteredRows()` / `getSelectedPaginatedRows()`
- `getSelectionInfo()`
- `executeBulkAction(handler)`

CSV export API:

- `exportCsv()`
- scopes: `all`, `filtered`, `sorted`, `paginated`, `selected`
- options: `delimiter`, `includeHeaders`, `includeHiddenColumns`

Saved views API:

- `createSavedView()`
- `applySavedView(view, { resetToFirstPage? })`
- `saveView(name)`
- `loadView(name, { resetToFirstPage? })`
- `getSavedView(name)`
- `listSavedViews()`
- `deleteSavedView(name)`
- `clearSavedViews()`

Saved view example:

```ts
const initial = table.createSavedView();
table.saveView("Default");

table.setFilters([{ columnKey: "active", operator: "isTrue" }]);
table.setSortRules([{ columnKey: "name", direction: "asc" }]);

table.saveView("Active Users");
table.loadView("Default");
table.applySavedView(initial);
```

Server-side mode adapters:

- `toServerSortRules(sortRules)`
- `toServerFilterRules(filters)`
- `toServerPaginationRequest(pagination)`
- `createServerTableRequest({ sortRules, filters, pagination })`

Server request example:

```ts
const request = createServerTableRequest({
	sortRules: table.getSortRules(),
	filters: table.getFilters(),
	pagination: table.getPagination()
});

// request => { sort: [...], filters: [...], pagination: { pageIndex, pageSize, offset, limit } }
```

Formatter preset helpers:

- `currencyPacks`, `localePacks`, `timezonePacks`
- `createCurrencyPreset(currencyCode, decimalPlaces?)`
- `createDateFormatterPreset(dateLocale, dateLength?, options?)`
- `createDateTimeFormatterPreset(dateLocale, dateLength?, options?)`
- `createTimezonePreset(convertUtcToClientLocal)`

Validation helpers:

- `assertCsvDelimiter(delimiter)`
- `assertCurrencyCode(code)`
- `assertTableColumnConfig(column)`
- `assertValidRowKeyValue(rowKey, value)`
- `assertSupportedFormat(format, supportedFormats)`

Starter templates:

- `createTableStarterTemplate(options)`
- `createParseAndSortStarterTemplate(options)`
- `parseAndSortWithStarterTemplate(input, options)`

Schema-driven column builder and inference helpers:

- `createColumnSchemaBuilder<Row>()`
- `defineTableColumns(...columns)`
- `createTypedTableOptions({ data, columns, ... })`
- `createTypedTableComponent({ data, columns, ... })`

Schema-driven builder example:

```ts
import {
	createColumnSchemaBuilder,
	createTypedTableComponent,
	defineTableColumns
} from "saas-ui-accelerator";

type UserRow = {
	id: string;
	fullName: string;
	age: number;
	active: boolean;
};

const schema = createColumnSchemaBuilder<UserRow>();

const columns = defineTableColumns(
	schema.text("fullName", "Full Name", { sortable: true }),
	schema.number("age", "Age", { sortable: true }),
	schema.boolean("active", "Active")
);

const table = createTypedTableComponent({
	data: [{ id: "u1", fullName: "Alice", age: 31, active: true }],
	columns,
	rowKey: "id"
});
```

Starter template example:

```ts
import { createTableStarterTemplate, parseAndSortWithStarterTemplate } from "saas-ui-accelerator";

const tableTemplate = createTableStarterTemplate({
	data: [{ id: 1, fullName: "Alice", active: true }],
	rowKey: "id",
	initialSortRules: [{ columnKey: "fullName", direction: "asc" }]
});

const table = tableTemplate.createComponent();

const sorted = parseAndSortWithStarterTemplate("name,amount\nA,2\nB,10", {
	format: "csv",
	sortBy: "amount",
	direction: "desc",
	mapper: (record) => ({
		name: String(record.name),
		amount: Number(record.amount)
	})
});
```

Copy-paste examples:

```ts
// Selector example (derived sortable value)
const amountRule = { id: "amount", direction: "desc", selector: (row) => Number(row.amount) };

// Formatter example (currency preset on a column)
const amountColumn = { key: "amount", header: "Amount", ...currencyPacks.usd };

// Action example (default MUI actions + routing)
const actionColumn = createDefaultMuiActionColumn({
	router: { navigate: (to) => router.navigate(to) },
	getViewRoute: (row) => `/users/${row.id}`,
	getEditRoute: (row) => `/users/${row.id}/edit`
});
```


Action column support:

- built-in `view`, `edit`, `archive`, `delete` actions
- MUI icon names included (`Visibility`, `Edit`, `Archive`, `Delete`)
- router navigation hooks for each action
- built-in confirmation before `archive` and `delete`
- audit metadata hooks (`onAudit`) for action lifecycle observability
- permission-aware predicate context for `visible` and `enabled`

Permission-aware predicate example:

```ts
import { andActionPredicates, requireAllPermissions, requirePermission } from "saas-ui-accelerator";

const actionColumn = createDefaultMuiActionColumn({
	router: { navigate: (to) => router.navigate(to) },
	permissions: ['users:view', 'users:archive'],
	getArchiveRoute: (row) => `/users/${row.id}/archive`
});

const archiveAction = {
	id: 'archive' as const,
	route: (row: { id: string }) => `/users/${row.id}/archive`,
	visible: (_row: { id: string }, context) =>
		andActionPredicates(
			requirePermission('users:view'),
			requireAllPermissions(['users:archive'])
		)(context),
};
```

Action audit hook example:

```ts
const actionColumn = createDefaultMuiActionColumn({
	router: { navigate: (to) => router.navigate(to) },
	getViewRoute: (row) => `/users/${row.id}`,
	onAudit: (event) => {
		// event includes actionId, outcome, row, rowKey, timestamp, route, and status fields
		console.log(event);
	}
});
```

Usage telemetry hook example:

```ts
const table = new JsonTableComponent({
	data: [{ id: "u1", name: "Alice" }],
	columns: [{ key: "name", header: "Name", dataType: "text", sortable: true }],
	rowKey: "id",
	telemetry: (event) => {
		console.log(event.type, event.timestamp, event.metadata);
	}
});

table.setFilters([{ columnKey: "name", operator: "contains", value: "A" }]);
table.toggleSort("name");
table.setPagination({ pageIndex: 0, pageSize: 25 });
table.selectRowByKey("u1");
```

Telemetry callbacks are observational and side-effect safe: callback failures are ignored.

```ts
import { JsonTableComponent, createDefaultMuiActionColumn } from "saas-ui-accelerator";

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
import { myComponent } from "saas-ui-accelerator";

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
	- https://github.com/mamin72/saas-ui-accelerator/wiki
2. Run the publish script:

```powershell
pwsh ./scripts/publish-wiki.ps1
```

