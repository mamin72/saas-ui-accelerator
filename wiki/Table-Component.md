# Table Component

## Overview

`JsonTableComponent` accepts JSON input and provides a table-ready model with:

- header-driven toggle sorting (`asc` / `desc`)
- reusable AND-based filtering engine
- per-column datatype configuration
- datatype-aware formatting and alignment

## Create a Table Model

```ts
import { JsonTableComponent } from "sort_component";

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

## Facade Access Pattern

If your app wants one namespace-style entry point:

```ts
import { myComponent } from "sort_component";

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
