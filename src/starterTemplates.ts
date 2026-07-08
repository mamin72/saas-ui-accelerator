import { parseAndSort, type DataFormat, type ParseAndSortOptions, type ParseOptions, type ParsedRecord } from './formatSupport';
import { type SortDirection, type SortRule, type SortValue } from './sortByRules';
import {
  JsonTableComponent,
  type JsonTableComponentOptions,
  type SortState,
  type TableColumn,
  type TableFilter,
  type TablePaginationState,
  type TableRowKey,
} from './tableComponent';

type TableKey<T extends Record<string, unknown>> = Extract<keyof T, string>;

export interface TableStarterTemplateOptions<T extends Record<string, unknown>> {
  readonly data: readonly T[];
  readonly columns?: readonly TableColumn<T>[];
  readonly rowKey?: JsonTableComponentOptions<T>['rowKey'];
  readonly columnOverrides?: Partial<Record<TableKey<T>, Partial<TableColumn<T>>>>;
  readonly initialSortRules?: readonly SortState[];
  readonly initialFilters?: readonly TableFilter<T>[];
  readonly initialPagination?: TablePaginationState;
  readonly initialColumnVisibility?: Readonly<Record<string, boolean>>;
  readonly initialSelectedRowKeys?: readonly TableRowKey[];
}

export interface TableStarterTemplate<T extends Record<string, unknown>> {
  readonly tableOptions: JsonTableComponentOptions<T>;
  createComponent(): JsonTableComponent<T>;
}

export interface ParseAndSortStarterTemplateOptions<T extends ParsedRecord> {
  readonly format: DataFormat;
  readonly sortBy: Extract<keyof T, string> | ((row: T) => SortValue);
  readonly direction?: SortDirection;
  readonly nulls?: 'first' | 'last';
  readonly mapper?: (record: ParsedRecord) => T;
  readonly recordPath?: string;
  readonly delimiter?: string;
  readonly mimeType?: string;
}

export function createTableStarterTemplate<T extends Record<string, unknown>>(
  options: TableStarterTemplateOptions<T>
): TableStarterTemplate<T> {
  const resolvedColumns = options.columns ?? inferColumnsFromData(options.data);
  const columns = applyColumnOverrides(resolvedColumns, options.columnOverrides);

  const tableOptions: JsonTableComponentOptions<T> = {
    data: options.data,
    columns,
    rowKey: options.rowKey,
  };

  return {
    tableOptions,
    createComponent(): JsonTableComponent<T> {
      const component = new JsonTableComponent(tableOptions);

      if (options.initialSortRules != null) {
        component.setSortRules(options.initialSortRules);
      }

      if (options.initialFilters != null) {
        component.setFilters(options.initialFilters);
      }

      if (options.initialPagination != null) {
        component.setPagination(options.initialPagination);
      }

      if (options.initialColumnVisibility != null) {
        component.setColumnVisibilityMap(options.initialColumnVisibility);
      }

      if (options.initialSelectedRowKeys != null) {
        component.setSelectedRowKeys(options.initialSelectedRowKeys);
      }

      return component;
    },
  };
}

export function createParseAndSortStarterTemplate<T extends ParsedRecord>(
  options: ParseAndSortStarterTemplateOptions<T>
): ParseAndSortOptions<T> {
  const selector: (row: T) => SortValue =
    typeof options.sortBy === 'string'
      ? (() => {
          const key = options.sortBy;
          return (row: T) => toSortValue(row[key]);
        })()
      : options.sortBy;

  const sortRule: SortRule<T> = {
    id: typeof options.sortBy === 'string' ? options.sortBy : 'starter-rule',
    direction: options.direction ?? 'asc',
    nulls: options.nulls ?? 'last',
    selector,
  };

  const parseOptions: ParseOptions = {
    format: options.format,
    recordPath: options.recordPath,
    delimiter: options.delimiter,
    mimeType: options.mimeType,
  };

  return {
    ...parseOptions,
    mapper: options.mapper,
    rules: [sortRule],
  };
}

export function parseAndSortWithStarterTemplate<T extends ParsedRecord>(
  input: unknown,
  options: ParseAndSortStarterTemplateOptions<T>
): T[] {
  return parseAndSort(input, createParseAndSortStarterTemplate(options));
}

function inferColumnsFromData<T extends Record<string, unknown>>(data: readonly T[]): readonly TableColumn<T>[] {
  const sample = data[0];
  if (sample == null) {
    throw new Error('Unable to infer columns from empty data. Provide columns explicitly.');
  }

  const keys = Object.keys(sample) as TableKey<T>[];
  return keys.map((key) => ({
    key,
    header: keyToHeader(key),
    dataType: inferDataType(sample[key]),
    sortable: true,
  }));
}

function applyColumnOverrides<T extends Record<string, unknown>>(
  columns: readonly TableColumn<T>[],
  overrides: TableStarterTemplateOptions<T>['columnOverrides']
): readonly TableColumn<T>[] {
  if (overrides == null) {
    return [...columns];
  }

  return columns.map((column) => {
    const override = overrides[column.key as TableKey<T>];
    return override == null ? column : { ...column, ...override };
  });
}

function keyToHeader(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^.|\s+.)/g, (match) => match.toUpperCase());
}

function inferDataType(value: unknown): TableColumn<Record<string, unknown>>['dataType'] {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'number' : 'decimal';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (value instanceof Date) {
    return 'datetime';
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && /\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.includes('T') ? 'datetime' : 'date';
    }

    return 'text';
  }

  return 'text';
}

function toSortValue(value: unknown): SortValue {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && /\d{4}-\d{2}-\d{2}/.test(value)) {
      return new Date(parsed);
    }

    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
    return value;
  }

  return JSON.stringify(value);
}