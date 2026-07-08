# Table Component

## Overview

`JsonTableComponent` accepts JSON input and provides a table-ready model with:

- header-driven toggle sorting (`asc` / `desc`)
- reusable AND-based filtering engine
- per-column datatype configuration
- datatype-aware formatting and alignment

## Create a Table Model

```ts
import { JsonTableComponent } from "saas-ui-accelerator";

const table = new JsonTableComponent({
  data: jsonString,
  columns: [
    { key: "name", header: "Name", dataType: "text", sortable: true },
    { key: "count", header: "Count", dataType: "number", sortable: true },
    { key: "score", header: "Score", dataType: "decimal", decimalPlaces: 3 },
    { key: "amount", header: "Amount", dataType: "currency", currencyCode: "USD" },
    {
      key: "createdUtc",
      header: "Created",
      dataType: "date",
      temporalType: "datetime",
      dateLocale: "US",
      dateLength: "short",
      convertUtcToClientLocal: true
    },
    { key: "active", header: "Active", dataType: "boolean", booleanDisplay: "icon" }
  ]
});
```

## Header Toggle Sort

Use your UI header click handler to call:

```ts
table.toggleSort("name");
```

Then read current state:

```ts
const headers = table.getHeaders();
const rows = table.getTableRows();
```

## Multi-Column Sorting API

Use explicit sort rules when you need deterministic precedence across multiple columns.

```ts
table.setSortRules([
  { columnKey: "createdUtc", direction: "desc" },
  { columnKey: "name", direction: "asc" }
]);

table.appendSort("amount", "desc");

const sortRules = table.getSortRules();
```

Notes:

- `setSortRules(...)` replaces the current rule list
- `appendSort(...)` appends or updates a rule while keeping a stable precedence order
- `toggleSort(...)` remains backward-compatible and switches to single-column sorting mode

## Filtering API

Set filters using `setFilters(...)`. Filters are combined with logical AND.

```ts
table.setFilters([
  { columnKey: "name", operator: "contains", value: "ali" },
  { columnKey: "age", operator: "gte", value: 30 }
]);

const filteredRows = table.getFilteredRows();
```

Clear filters:

```ts
table.clearFilters();
```

Supported operators by datatype:

- text and enum: `contains`, `equals`, `startsWith`
- number, decimal, currency, date, datetime: `eq`, `gt`, `gte`, `lt`, `lte`, `between`
- boolean: `isTrue`, `isFalse`, `eq`

## Pagination API

Pagination is client-side and is applied after filtering and sorting.

```ts
table.setPagination({ pageIndex: 0, pageSize: 25 });
table.setPageIndex(1);
table.setPageSize(50, { resetToFirstPage: true });

const pageRows = table.getPaginatedRows();
const pageInfo = table.getPageInfo();
```

`getPageInfo()` returns:

- `pageIndex`
- `pageSize`
- `totalRows`
- `totalPages`
- `hasPreviousPage`
- `hasNextPage`
- `startRow`
- `endRow`

## Column Visibility API

Column visibility controls which data columns appear in headers and rendered cells.

```ts
table.setColumnVisibility("amount", false);
table.toggleColumnVisibility("name");

table.setColumnVisibilityMap({
  name: true,
  count: true,
  score: true,
  amount: false,
  createdUtc: true,
  active: true
});

const visibility = table.getColumnVisibility();
```

Notes:

- Hidden columns are removed from table headers and cell output
- Sorting and filtering on hidden columns remain stable and supported
- `clearColumnVisibility()` restores defaults (all visible)

## Row Selection And Bulk Helpers

Selection is managed by stable row keys. By default, index-based keys are used; you can pass `rowKey` in component options for domain keys.

```ts
const table = new JsonTableComponent({
  data: jsonString,
  columns,
  rowKey: "id"
});

table.setSelectedRowKeys(["u1"]);
table.selectAllFilteredRows();

const selectedKeys = table.getSelectedRowKeys();
const selectedRows = table.getSelectedRows();
const selectionInfo = table.getSelectionInfo();

const output = await table.executeBulkAction((context) => ({
  count: context.selectedRows.length,
  keys: context.selectedRowKeys
}));
```

Selection helpers:

- select by key: `selectRowByKey`, `deselectRowByKey`, `toggleRowSelectionByKey`
- select by row object: `selectRow`, `deselectRow`, `toggleRowSelection`
- select-all modes: `selectAllRows`, `selectAllFilteredRows`, `selectAllPaginatedRows`
- read helpers: `getSelectedRows`, `getSelectedFilteredRows`, `getSelectedPaginatedRows`, `getSelectionInfo`
- clear helpers: `setSelectedRowKeys`, `clearSelection`

## CSV Export

Export the table state to CSV text with configurable scope and formatting.

```ts
const csvAll = table.exportCsv();
const csvFiltered = table.exportCsv({ scope: "filtered" });
const csvPaginated = table.exportCsv({ scope: "paginated", delimiter: ";" });
const csvSelected = table.exportCsv({ scope: "selected", includeHeaders: false });
```

Options:

- `scope`: `all`, `filtered`, `sorted`, `paginated`, `selected`
- `delimiter`: single-character delimiter, defaults to `,`
- `includeHeaders`: defaults to `true`
- `includeHiddenColumns`: defaults to `false`

Notes:

- Visible columns are exported by default
- Hidden columns can be included explicitly
- Values are exported using table display formatting and CSV-safe escaping

## Saved Views

Saved views provide deterministic round-trip state for table filters, sorting, visibility, and page size.

```ts
const initial = table.createSavedView();
table.saveView("Default");

table.setFilters([{ columnKey: "active", operator: "isTrue" }]);
table.setSortRules([{ columnKey: "name", direction: "asc" }]);

table.saveView("Active Users");
table.loadView("Default");
table.applySavedView(initial);
```

APIs:

- `createSavedView()`
- `applySavedView(view, { resetToFirstPage? })`
- `saveView(name)`
- `loadView(name, { resetToFirstPage? })`
- `getSavedView(name)`
- `listSavedViews()`
- `deleteSavedView(name)`
- `clearSavedViews()`

## Server-Side Mode Adapters

Use adapters to convert client-side table state into deterministic API-ready request models.

```ts
import { createServerTableRequest } from "saas-ui-accelerator";

const request = createServerTableRequest({
  sortRules: table.getSortRules(),
  filters: table.getFilters(),
  pagination: table.getPagination()
});
```

Adapter APIs:

- `toServerSortRules(sortRules)`
- `toServerFilterRules(filters)`
- `toServerPaginationRequest(pagination)`
- `createServerTableRequest({ sortRules, filters, pagination })`

## Schema-Driven Column Builder

Build typed table columns from row schemas and keep row/column contracts strongly inferred.

```ts
import {
  createColumnSchemaBuilder,
  createTypedTableComponent,
  defineTableColumns
} from 'saas-ui-accelerator';

type UserRow = {
  id: string;
  fullName: string;
  age: number;
  active: boolean;
};

const schema = createColumnSchemaBuilder<UserRow>();

const columns = defineTableColumns(
  schema.text('fullName', 'Full Name', { sortable: true }),
  schema.number('age', 'Age', { sortable: true }),
  schema.boolean('active', 'Active')
);

const table = createTypedTableComponent({
  data: [{ id: 'u1', fullName: 'Alice', age: 31, active: true }],
  columns,
  rowKey: 'id'
});
```

Helper APIs:

- `createColumnSchemaBuilder<Row>()`
- `defineTableColumns(...columns)`
- `createTypedTableOptions({ data, columns, ... })`
- `createTypedTableComponent({ data, columns, ... })`

## Action Audit Hooks

Action columns support transport-agnostic audit metadata hooks around action execution.

```ts
const actionColumn = createDefaultMuiActionColumn({
  router: { navigate: (to) => router.navigate(to) },
  getViewRoute: (row) => `/users/${row.id}`,
  onAudit: (event) => {
    console.log(event.actionId, event.outcome, event.rowKey, event.timestamp);
  }
});
```

Audit event metadata includes:

- `actionId`
- `outcome` (`started`, `confirmed`, `cancelled`, `completed`, `failed`)
- `row` and `rowKey`
- `timestamp`
- `route`, `requiresConfirmation`, `confirmed`, `success`, `errorMessage`

## Permission-Aware Action Predicates

Action definitions can now use permission-aware context in `visible` and `enabled` callbacks.

```ts
import {
  createDefaultMuiActionColumn,
  andActionPredicates,
  requireAllPermissions,
  requirePermission
} from 'saas-ui-accelerator';

const actionColumn = createDefaultMuiActionColumn({
  router: { navigate: (to) => router.navigate(to) },
  permissions: ['users:view', 'users:archive']
});

const archiveAction = {
  id: 'archive' as const,
  route: '/archive',
  visible: (_row: unknown, context) =>
    andActionPredicates(requirePermission('users:view'), requireAllPermissions(['users:archive']))(context)
};
```

Context capabilities:

- `permissions` (readonly set)
- `hasPermission(permission)`
- `hasAnyPermissions(permissions)`
- `hasAllPermissions(permissions)`
- `actionId`, `row`, `rowKey`

## Usage Telemetry Hooks

The table component supports optional telemetry hooks for filtering, sorting, pagination, and selection interactions.

```ts
const table = new JsonTableComponent({
  data: [{ id: 'u1', name: 'Alice' }],
  columns: [{ key: 'name', header: 'Name', dataType: 'text', sortable: true }],
  rowKey: 'id',
  telemetry: (event) => {
    console.log(event.type, event.timestamp, event.metadata);
  }
});

table.setFilters([{ columnKey: 'name', operator: 'contains', value: 'A' }]);
table.toggleSort('name');
table.setPagination({ pageIndex: 0, pageSize: 25 });
table.selectRowByKey('u1');
```

Supported interaction categories:

- Filtering (`filter:set`, `filter:clear`)
- Sorting (`sort:set-rules`, `sort:append`, `sort:clear`, `sort:toggle`)
- Pagination (`pagination:set`, `pagination:clear`, `pagination:set-index`, `pagination:set-size`)
- Selection (`selection:*` event family)

Telemetry callbacks are observational only: failures are swallowed to avoid impacting table behavior.

## Formatter Presets

The package also exports reusable formatter preset helpers for common regional defaults.

```ts
import { currencyPacks, createDateFormatterPreset, createDateTimeFormatterPreset, timezonePacks } from "saas-ui-accelerator";

const amountColumn = {
  key: "amount",
  header: "Amount",
  ...currencyPacks.usd
};

const createdColumn = {
  key: "createdUtc",
  header: "Created",
  dataType: "datetime",
  ...createDateTimeFormatterPreset("UK", "long", { convertUtcToClientLocal: false })
};
```

Helpers:

- `currencyPacks`, `localePacks`, `timezonePacks`
- `createCurrencyPreset(currencyCode, decimalPlaces?)`
- `createDateFormatterPreset(dateLocale, dateLength?, options?)`
- `createDateTimeFormatterPreset(dateLocale, dateLength?, options?)`
- `createTimezonePreset(convertUtcToClientLocal)`

## Validation Helpers

Reusable validation helpers are exported for stricter input handling.

```ts
import { assertCsvDelimiter, assertCurrencyCode, assertSupportedFormat, assertTableColumnConfig, assertValidRowKeyValue } from "saas-ui-accelerator";
```

Helpers:

- `assertCsvDelimiter(delimiter)`
- `assertCurrencyCode(code)`
- `assertTableColumnConfig(column)`
- `assertValidRowKeyValue(rowKey, value)`
- `assertSupportedFormat(format, supportedFormats)`

## Starter Templates

Use starter templates for fast table and parse+sort bootstrapping.

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

Helpers:

- `createTableStarterTemplate(options)`
- `createParseAndSortStarterTemplate(options)`
- `parseAndSortWithStarterTemplate(input, options)`

## Copy-Paste Examples

```ts
// Selector example
const amountRule = { id: "amount", direction: "desc", selector: (row) => Number(row.amount) };

// Formatter example
const amountColumn = { key: "amount", header: "Amount", ...currencyPacks.usd };

// Action example
const actionColumn = createDefaultMuiActionColumn({
  router: { navigate: (to) => router.navigate(to) },
  getViewRoute: (row) => `/users/${row.id}`,
  getEditRoute: (row) => `/users/${row.id}/edit`
});
```

## Supported Column Data Types

- `text`
- `number`
- `decimal`
- `currency`
- `date`
- `datetime`
- `boolean`
- `enum`

## Formatting Rules

### Number

- Right aligned

### Decimal

- Right aligned
- `decimalPlaces` controls precision

### Currency

- Right aligned
- Defaults to 2 decimal places
- `currencyCode` must be valid ISO 4217 (for example `USD`, `EUR`, `INR`)

### Date / Datetime

- Locale: `US`, `UK`, `Chinese`
- Length: `short`, `long`
- Temporal mode: `date` or `datetime`
- `convertUtcToClientLocal`:
  - `true` converts UTC source date-time to client local timezone display
  - `false` keeps UTC display

### Boolean

- `yes-no` shows `Yes` / `No`
- `icon` shows `✓` / `✗`

## UI Integration Pattern

Keep rendering in your framework, and use this component as the state and formatting engine.

- Header cells read `getHeaders()` and call `toggleSort(...)` on click
- Body rows render from `getTableRows()`

## Action Column (MUI + Router)

Use the built-in helper to add `view`, `edit`, `archive`, and `delete` row actions.

- MUI icon names are provided (`Visibility`, `Edit`, `Archive`, `Delete`)
- Router navigation is supported per action
- `archive` and `delete` include built-in confirmation before execution

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

## Facade Access Pattern

If your app wants one namespace-style entry point:

```ts
import { myComponent } from "saas-ui-accelerator";

const sorted = myComponent.SortData(rows, rules);
const table = new myComponent.SortableTable({ data: jsonString, columns });

// Short aliases
const sorted2 = myComponent.Sort(rows, rules);
const table2 = new myComponent.Table({ data: jsonString, columns });
```

Compatibility aliases:

- `myComponent.Sort` (same as `SortData`)
- `myComponent.Table` (same as `SortableTable`)
- `myComponet` (typo-compatible alias)

## Benchmark Suite

The repository includes a deterministic benchmark harness for large datasets in `benchmarks/run-benchmarks.cjs`.

Operations measured:

- sorting
- filtering
- pagination
- selection

Run benchmark profiles:

```bash
npm run benchmark
npm run benchmark:quick
```

Custom benchmark invocation with JSON output:

```bash
node benchmarks/run-benchmarks.cjs --sizes 2000,10000 --iterations 15 --warmup 3 --out benchmark-results.json
```

The harness uses seeded input generation so benchmark datasets are reproducible.

## Property And Fuzz Tests

The repository includes deterministic property and parser fuzz-style tests in `tests/propertyAndFuzz.test.ts`.

Coverage focus:

- sorting invariants (monotonic ordering, idempotency, membership preservation)
- malformed parser inputs (JSON, JSONL, YAML) and bounded CSV edge-case handling

Run full validation:

```bash
npm run quality:check
```

Tests are intentionally deterministic and bounded for CI reliability.

## Node Compatibility Matrix

CI executes `npm run quality:check` across active Node LTS versions:

- Node 20
- Node 22

This keeps runtime compatibility checks deterministic and visible in CI.

## Release Automation And Policy

Release automation and policy enforcement are implemented with:

- `.github/workflows/release.yml` for manual and tag-driven releases
- changelog section extraction from `CHANGELOG.md`
- release policy checks in CI for version and changelog consistency

Commands:

```bash
npm run release:policy:check
npm run release:notes
```
