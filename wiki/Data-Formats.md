# Data Formats

## Core Contract

`saas-ui-accelerator` supports both:

- direct array sorting with `sortByRules`
- format-aware parsing + sorting with `parseAndSort` and `parseAndSortFromStream`

## Built-in Formats

- JSON
- JSONL / NDJSON
- CSV
- TSV
- XML
- YAML

## API Options

### 1. Direct array sorting

```ts
sortByRules<T>(items: readonly T[], rules: readonly SortRule<T>[]): T[]
```

### 2. Parse and sort (text/object input)

```ts
parseAndSort<T>(input: unknown, options: ParseAndSortOptions<T>): T[]
```

### 3. Parse and sort from stream

```ts
parseAndSortFromStream<T>(stream: Readable, options: ParseAndSortOptions<T>): Promise<T[]>
```

## Mapping to Domain Models

If parsed rows do not match your app model exactly, pass `mapper`:

```ts
parseAndSort(csvText, {
  format: "csv",
  mapper: (row) => ({
    id: String(row.id),
    score: Number(row.score),
  }),
  rules,
});
```

## Practical Rule

Use `sortByRules` for already-typed arrays.
Use `parseAndSort` for external payload formats.

## Integration Pattern

Keep rules in your app common components layer, and call format-aware APIs directly for file or stream payloads.

