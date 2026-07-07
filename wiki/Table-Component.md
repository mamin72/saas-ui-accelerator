# Table Component

## Overview

`JsonTableComponent` accepts JSON input and provides a table-ready model with:

- header-driven toggle sorting (`asc` / `desc`)
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

## Supported Column Data Types

- `text`
- `number`
- `decimal`
- `currency`
- `date`
- `datetime`
- `boolean`

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
