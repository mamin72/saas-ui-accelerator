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

## Facade Access Pattern

If your app wants one namespace-style entry point:

```ts
import { myComponent } from "sort_component";

const sorted = myComponent.SortData(rows, rules);
const table = new myComponent.SortableTable({ data: jsonString, columns });
```

Compatibility aliases:

- `myComponent.SortDate` (same as `SortData`)
- `myComponet` (typo-compatible alias)
