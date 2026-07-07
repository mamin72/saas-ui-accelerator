/* c8 ignore start */
import { parseRecords } from './formatSupport';

export type TableDataType = 'text' | 'number' | 'decimal' | 'currency' | 'date' | 'datetime' | 'boolean';
export type DateLocaleStyle = 'US' | 'UK' | 'Chinese';
export type DateLength = 'short' | 'long';
export type BooleanDisplayStyle = 'yes-no' | 'icon';
export type CellAlignment = 'left' | 'right' | 'center';
export type TableSortDirection = 'asc' | 'desc';

export interface TableColumn<T extends Record<string, unknown>> {
  readonly key: Extract<keyof T, string> | string;
  readonly header: string;
  readonly dataType: TableDataType;
  readonly sortable?: boolean;
  readonly decimalPlaces?: number;
  readonly currencyCode?: string;
  readonly dateLocale?: DateLocaleStyle;
  readonly dateLength?: DateLength;
  readonly temporalType?: 'date' | 'datetime';
  readonly convertUtcToClientLocal?: boolean;
  readonly booleanDisplay?: BooleanDisplayStyle;
  readonly accessor?: (row: T) => unknown;
}

export interface SortState {
  readonly columnKey: string;
  readonly direction: TableSortDirection;
}

export interface TableHeaderState {
  readonly key: string;
  readonly header: string;
  readonly sortable: boolean;
  readonly sortDirection?: TableSortDirection;
}

export interface TableCellState {
  readonly key: string;
  readonly rawValue: unknown;
  readonly displayValue: string;
  readonly align: CellAlignment;
}

export interface TableRowState {
  readonly source: Record<string, unknown>;
  readonly cells: readonly TableCellState[];
}

export interface JsonTableComponentOptions<T extends Record<string, unknown>> {
  readonly data: string | readonly T[];
  readonly columns: readonly TableColumn<T>[];
}

export class JsonTableComponent<T extends Record<string, unknown>> {
  private readonly rows: readonly T[];
  private readonly columns: readonly TableColumn<T>[];
  private sortState: SortState | undefined;

  constructor(options: JsonTableComponentOptions<T>) {
    this.rows = this.parseData(options.data);
    this.columns = this.normalizeColumns(options.columns);
  }

  public getHeaders(): readonly TableHeaderState[] {
    return this.columns.map((column) => ({
      key: column.key,
      header: column.header,
      sortable: column.sortable !== false,
      sortDirection: this.sortState?.columnKey === column.key ? this.sortState.direction : undefined,
    }));
  }

  public getSortState(): SortState | undefined {
    return this.sortState;
  }

  public clearSort(): void {
    this.sortState = undefined;
  }

  public toggleSort(columnKey: string): SortState | undefined {
    const column = this.columns.find((item) => item.key === columnKey);
    if (column == null || column.sortable === false) {
      return this.sortState;
    }

    if (this.sortState == null || this.sortState.columnKey !== columnKey) {
      this.sortState = { columnKey, direction: 'asc' };
      return this.sortState;
    }

    this.sortState = {
      columnKey,
      direction: this.sortState.direction === 'asc' ? 'desc' : 'asc',
    };

    return this.sortState;
  }

  public getSortedRows(): T[] {
    if (this.sortState == null) {
      return [...this.rows];
    }

    const column = this.columns.find((item) => item.key === this.sortState?.columnKey);
    if (column == null) {
      return [...this.rows];
    }

    const output = [...this.rows];
    output.sort((left, right) => {
      const compareResult = this.compareRows(left, right, column);
      return this.sortState?.direction === 'asc' ? compareResult : -compareResult;
    });

    return output;
  }

  public getTableRows(): readonly TableRowState[] {
    return this.getSortedRows().map((row) => ({
      source: row,
      cells: this.columns.map((column) => this.toCell(row, column)),
    }));
  }

  private parseData(data: string | readonly T[]): readonly T[] {
    if (typeof data !== 'string') {
      return [...data];
    }

    const parsed = parseRecords(data, { format: 'json' });
    return parsed.map((row) => row as T);
  }

  private normalizeColumns(columns: readonly TableColumn<T>[]): readonly TableColumn<T>[] {
    for (const column of columns) {
      if (column.dataType === 'currency') {
        const currency = column.currencyCode ?? 'USD';
        this.assertCurrencyCode(currency);
      }
    }

    return [...columns];
  }

  private assertCurrencyCode(code: string): void {
    const normalized = code.toUpperCase();

    const intlWithSupportedValues = Intl as Intl.DateTimeFormatOptions & {
      supportedValuesOf?: (key: string) => string[];
    };

    if (typeof intlWithSupportedValues.supportedValuesOf === 'function') {
      const supported = intlWithSupportedValues.supportedValuesOf('currency');
      if (!supported.includes(normalized)) {
        throw new Error(`Invalid currency code '${code}'. Use a valid ISO 4217 code.`);
      }
      return;
    }

    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalized,
      });
      formatter.format(1);

      if (!/^[A-Z]{3}$/.test(normalized)) {
        throw new Error('Invalid ISO currency code pattern.');
      }
    } catch {
      throw new Error(`Invalid currency code '${code}'. Use a valid ISO 4217 code.`);
    }
  }

  private compareRows(left: T, right: T, column: TableColumn<T>): number {
    const leftSort = this.toSortableValue(this.getColumnValue(left, column), column);
    const rightSort = this.toSortableValue(this.getColumnValue(right, column), column);

    if (leftSort == null && rightSort == null) return 0;
    if (leftSort == null) return 1;
    if (rightSort == null) return -1;

    if (typeof leftSort === 'string' && typeof rightSort === 'string') {
      return leftSort.localeCompare(rightSort);
    }

    if (typeof leftSort === 'number' && typeof rightSort === 'number') {
      return leftSort - rightSort;
    }

    return 0;
  }

  private toSortableValue(value: unknown, column: TableColumn<T>): string | number | null {
    switch (column.dataType) {
      case 'number':
      case 'decimal':
      case 'currency':
        return this.toNumber(value);
      case 'date':
      case 'datetime':
        return this.toDateTime(value)?.getTime() ?? null;
      case 'boolean':
        return this.toBoolean(value) == null ? null : (this.toBoolean(value) ? 1 : 0);
      case 'text':
      default:
        if (value == null) return null;
        if (typeof value === 'string') return value.toLowerCase();
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
          return `${value}`.toLowerCase();
        }
        if (value instanceof Date) {
          return value.toISOString().toLowerCase();
        }

        return (JSON.stringify(value) ?? '').toLowerCase();
    }
  }

  private toCell(row: T, column: TableColumn<T>): TableCellState {
    const rawValue = this.getColumnValue(row, column);
    return {
      key: column.key,
      rawValue,
      displayValue: this.formatValue(rawValue, column),
      align: this.getAlignment(column),
    };
  }

  private getAlignment(column: TableColumn<T>): CellAlignment {
    switch (column.dataType) {
      case 'number':
      case 'decimal':
      case 'currency':
        return 'right';
      case 'boolean':
        return column.booleanDisplay === 'icon' ? 'center' : 'left';
      default:
        return 'left';
    }
  }

  private getColumnValue(row: T, column: TableColumn<T>): unknown {
    if (column.accessor != null) {
      return column.accessor(row);
    }

    return row[column.key];
  }

  private formatValue(value: unknown, column: TableColumn<T>): string {
    if (value == null) {
      return '';
    }

    switch (column.dataType) {
      case 'number': {
        const number = this.toNumber(value);
        return number == null ? '' : new Intl.NumberFormat('en-US').format(number);
      }
      case 'decimal': {
        const number = this.toNumber(value);
        if (number == null) return '';
        const digits = Math.max(0, column.decimalPlaces ?? 2);
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(number);
      }
      case 'currency': {
        const number = this.toNumber(value);
        if (number == null) return '';
        const currencyCode = column.currencyCode ?? 'USD';
        const digits = Math.max(0, column.decimalPlaces ?? 2);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(number);
      }
      case 'date':
      case 'datetime': {
        const date = this.toDateTime(value);
        if (date == null) return '';
        return this.formatDateTime(date, column);
      }
      case 'boolean': {
        const booleanValue = this.toBoolean(value);
        if (booleanValue == null) return '';
        if (column.booleanDisplay === 'icon') {
          return booleanValue ? '✓' : '✗';
        }

        return booleanValue ? 'Yes' : 'No';
      }
      case 'text':
      default:
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
          return `${value}`;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }

        return JSON.stringify(value) ?? '';
    }
  }

  private formatDateTime(date: Date, column: TableColumn<T>): string {
    const localeMap: Record<DateLocaleStyle, string> = {
      US: 'en-US',
      UK: 'en-GB',
      Chinese: 'zh-CN',
    };

    const locale = localeMap[column.dateLocale ?? 'US'];
    const length = column.dateLength ?? 'short';
    const temporalType = column.temporalType ?? (column.dataType === 'datetime' ? 'datetime' : 'date');

    const options: Intl.DateTimeFormatOptions =
      temporalType === 'datetime'
        ? {
            dateStyle: length,
            timeStyle: length === 'long' ? 'medium' : 'short',
          }
        : { dateStyle: length };

    if (column.convertUtcToClientLocal === false) {
      options.timeZone = 'UTC';
    }

    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '').trim();
      if (normalized.length === 0) {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toDateTime(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private toBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return null;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
      if (['false', 'no', 'n', '0'].includes(normalized)) return false;
    }

    return null;
  }
}

/* c8 ignore end */
