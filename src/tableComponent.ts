/* c8 ignore start */
import { parseRecords } from './formatSupport';
import { sortByRules } from './sortByRules';

export type TableDataType = 'text' | 'number' | 'decimal' | 'currency' | 'date' | 'datetime' | 'boolean';
export type DateLocaleStyle = 'US' | 'UK' | 'Chinese';
export type DateLength = 'short' | 'long';
export type BooleanDisplayStyle = 'yes-no' | 'icon';
export type CellAlignment = 'left' | 'right' | 'center';
export type TableSortDirection = 'asc' | 'desc';
export type TableFilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'eq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'isTrue'
  | 'isFalse';
export type TableActionId = 'view' | 'edit' | 'archive' | 'delete';
export type MuiActionIconName = 'Visibility' | 'Edit' | 'Archive' | 'Delete';

export interface TableActionRouter {
  navigate(to: string): void;
}

export interface TableActionDefinition<T extends Record<string, unknown>> {
  readonly id: TableActionId;
  readonly label?: string;
  readonly muiIcon?: MuiActionIconName;
  readonly route?: string | ((row: T) => string);
  readonly onAction?: (row: T) => void | Promise<void>;
  readonly requiresConfirmation?: boolean;
  readonly confirmationMessage?: string;
  readonly visible?: (row: T) => boolean;
  readonly enabled?: (row: T) => boolean;
}

export interface TableActionColumn<T extends Record<string, unknown>> {
  readonly key?: string;
  readonly header?: string;
  readonly actions: readonly TableActionDefinition<T>[];
  readonly router?: TableActionRouter;
  readonly confirm?: (input: { actionId: TableActionId; message: string; row: T }) => boolean | Promise<boolean>;
}

export interface TableDefaultActionColumnOptions<T extends Record<string, unknown>> {
  readonly key?: string;
  readonly header?: string;
  readonly router: TableActionRouter;
  readonly confirm?: (input: { actionId: TableActionId; message: string; row: T }) => boolean | Promise<boolean>;
  readonly getViewRoute?: (row: T) => string;
  readonly getEditRoute?: (row: T) => string;
  readonly getArchiveRoute?: (row: T) => string;
  readonly getDeleteRoute?: (row: T) => string;
  readonly onView?: (row: T) => void | Promise<void>;
  readonly onEdit?: (row: T) => void | Promise<void>;
  readonly onArchive?: (row: T) => void | Promise<void>;
  readonly onDelete?: (row: T) => void | Promise<void>;
}

export interface TableActionState {
  readonly id: TableActionId;
  readonly label: string;
  readonly muiIcon: MuiActionIconName;
  readonly disabled: boolean;
  execute(): Promise<boolean>;
}

export interface TableColumn<T extends Record<string, unknown>> {
  readonly key: Extract<keyof T, string> | string;
  readonly header: string;
  readonly dataType: TableDataType | 'enum';
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

export interface TableFilter<T extends Record<string, unknown>> {
  readonly columnKey: Extract<keyof T, string> | string;
  readonly operator: TableFilterOperator;
  readonly value?: unknown;
  readonly valueTo?: unknown;
  readonly caseSensitive?: boolean;
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
  readonly actions?: readonly TableActionState[];
}

export interface TableRowState {
  readonly source: Record<string, unknown>;
  readonly cells: readonly TableCellState[];
}

export interface JsonTableComponentOptions<T extends Record<string, unknown>> {
  readonly data: string | readonly T[];
  readonly columns: readonly TableColumn<T>[];
  readonly actionColumn?: TableActionColumn<T>;
}

export class JsonTableComponent<T extends Record<string, unknown>> {
  private readonly rows: readonly T[];
  private readonly columns: readonly TableColumn<T>[];
  private readonly actionColumn: TableActionColumn<T> | undefined;
  private sortState: readonly SortState[];
  private filterState: readonly TableFilter<T>[];

  constructor(options: JsonTableComponentOptions<T>) {
    this.rows = this.parseData(options.data);
    this.columns = this.normalizeColumns(options.columns);
    this.actionColumn = options.actionColumn;
    this.sortState = [];
    this.filterState = [];
  }

  public getHeaders(): readonly TableHeaderState[] {
    const headers = this.columns.map((column) => ({
      key: column.key,
      header: column.header,
      sortable: column.sortable !== false,
      sortDirection: this.getColumnSortDirection(column.key),
    }));

    if (this.actionColumn != null) {
      headers.push({
        key: this.getActionColumnKey(),
        header: this.actionColumn.header ?? 'Actions',
        sortable: false,
        sortDirection: undefined,
      });
    }

    return headers;
  }

  public getSortState(): SortState | undefined {
    return this.sortState[0];
  }

  public getSortRules(): readonly SortState[] {
    return this.sortState;
  }

  public setSortRules(sortRules: readonly SortState[]): readonly SortState[] {
    this.sortState = this.normalizeSortRules(sortRules);
    return this.sortState;
  }

  public appendSort(columnKey: string, direction: TableSortDirection = 'asc'): readonly SortState[] {
    this.assertSortableColumn(columnKey);
    this.sortState = this.normalizeSortRules([...this.sortState, { columnKey, direction }]);
    return this.sortState;
  }

  public getFilters(): readonly TableFilter<T>[] {
    return this.filterState;
  }

  public setFilters(filters: readonly TableFilter<T>[]): readonly TableFilter<T>[] {
    for (const filter of filters) {
      this.validateFilter(filter);
    }

    this.filterState = [...filters];
    return this.filterState;
  }

  public clearFilters(): void {
    this.filterState = [];
  }

  public clearSort(): void {
    this.sortState = [];
  }

  public toggleSort(columnKey: string): SortState | undefined {
    const column = this.columns.find((item) => item.key === columnKey);
    if (column == null || column.sortable === false) {
      return this.sortState[0];
    }

    const current = this.sortState[0];
    if (current == null || current.columnKey !== columnKey) {
      this.sortState = [{ columnKey, direction: 'asc' }];
      return this.sortState[0];
    }

    this.sortState = [{
      columnKey,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    }];

    return this.sortState[0];
  }

  public getSortedRows(): T[] {
    const sourceRows = this.getFilteredRows();

    if (this.sortState.length === 0) {
      return sourceRows;
    }

    const sortRules = this.sortState
      .map((rule, index) => {
        const column = this.columns.find((item) => item.key === rule.columnKey);
        if (column == null || column.sortable === false) {
          return undefined;
        }

        return {
          id: `${column.key}-${index}`,
          direction: rule.direction,
          nulls: 'last' as const,
          selector: (row: T) => this.toSortableValue(this.getColumnValue(row, column), column),
        };
      })
      .filter((rule): rule is NonNullable<typeof rule> => rule != null);

    if (sortRules.length === 0) {
      return sourceRows;
    }

    return sortByRules(sourceRows, sortRules);
  }

  public getTableRows(): readonly TableRowState[] {
    return this.getSortedRows().map((row) => ({
      source: row,
      cells: this.toCells(row),
    }));
  }

  public getFilteredRows(): T[] {
    if (this.filterState.length === 0) {
      return [...this.rows];
    }

    return this.rows.filter((row) => this.filterState.every((filter) => this.matchesFilter(row, filter)));
  }

  private toCells(row: T): TableCellState[] {
    const cells = this.columns.map((column) => this.toCell(row, column));
    if (this.actionColumn != null) {
      cells.push(this.toActionCell(row));
    }

    return cells;
  }

  private toActionCell(row: T): TableCellState {
    const actionColumn = this.actionColumn;
    if (actionColumn == null) {
      return {
        key: this.getActionColumnKey(),
        rawValue: undefined,
        displayValue: '',
        align: 'left',
      };
    }

    const visibleActions = actionColumn.actions.filter((action) => action.visible?.(row) ?? true);
    const actionStates = visibleActions.map((action) => this.toActionState(action, row, actionColumn));

    return {
      key: this.getActionColumnKey(),
      rawValue: undefined,
      displayValue: '',
      align: 'center',
      actions: actionStates,
    };
  }

  private toActionState(
    action: TableActionDefinition<T>,
    row: T,
    actionColumn: TableActionColumn<T>
  ): TableActionState {
    const route = this.resolveRoute(action, row);
    const hasHandler = route != null || action.onAction != null;
    const explicitlyEnabled = action.enabled?.(row) ?? true;
    const disabled = !hasHandler || !explicitlyEnabled;

    return {
      id: action.id,
      label: action.label ?? this.defaultActionLabel(action.id),
      muiIcon: action.muiIcon ?? defaultMuiActionIconMap[action.id],
      disabled,
      execute: async (): Promise<boolean> => {
        if (disabled) {
          return false;
        }

        const needsConfirmation = action.requiresConfirmation ?? (action.id === 'archive' || action.id === 'delete');
        if (needsConfirmation) {
          const approved = await this.requestConfirmation(action, row, actionColumn);
          if (!approved) {
            return false;
          }
        }

        if (route != null) {
          actionColumn.router?.navigate(route);
        }

        if (action.onAction != null) {
          await action.onAction(row);
        }

        return true;
      },
    };
  }

  private resolveRoute(action: TableActionDefinition<T>, row: T): string | undefined {
    if (action.route == null) {
      return undefined;
    }

    if (typeof action.route === 'string') {
      return action.route;
    }

    return action.route(row);
  }

  private async requestConfirmation(
    action: TableActionDefinition<T>,
    row: T,
    actionColumn: TableActionColumn<T>
  ): Promise<boolean> {
    const confirmFn = actionColumn.confirm ?? defaultConfirm;
    const message = action.confirmationMessage ?? `Are you sure you want to ${this.defaultActionLabel(action.id).toLowerCase()} this record?`;
    return Promise.resolve(confirmFn({ actionId: action.id, message, row }));
  }

  private defaultActionLabel(actionId: TableActionId): string {
    switch (actionId) {
      case 'view':
        return 'View';
      case 'edit':
        return 'Edit';
      case 'archive':
        return 'Archive';
      case 'delete':
        return 'Delete';
      default:
        return actionId;
    }
  }

  private getActionColumnKey(): string {
    return this.actionColumn?.key ?? '__actions__';
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

  private getColumnSortDirection(columnKey: string): TableSortDirection | undefined {
    return this.sortState.find((rule) => rule.columnKey === columnKey)?.direction;
  }

  private normalizeSortRules(sortRules: readonly SortState[]): readonly SortState[] {
    const normalized: SortState[] = [];
    const seen = new Set<string>();

    for (let index = sortRules.length - 1; index >= 0; index -= 1) {
      const rule = sortRules[index];
      if (rule == null || seen.has(rule.columnKey)) {
        continue;
      }

      this.assertSortableColumn(rule.columnKey);
      seen.add(rule.columnKey);
      normalized.unshift({
        columnKey: rule.columnKey,
        direction: rule.direction,
      });
    }

    return normalized;
  }

  private assertSortableColumn(columnKey: string): void {
    const column = this.columns.find((item) => item.key === columnKey);
    if (column == null) {
      throw new Error(`Invalid sort column '${columnKey}'.`);
    }

    if (column.sortable === false) {
      throw new Error(`Column '${columnKey}' is not sortable.`);
    }
  }

  private validateFilter(filter: TableFilter<T>): void {
    const column = this.columns.find((item) => item.key === filter.columnKey);
    if (column == null) {
      throw new Error(`Invalid filter column '${filter.columnKey}'.`);
    }

    if (!this.isOperatorAllowed(column, filter.operator)) {
      throw new Error(`Filter operator '${filter.operator}' is not supported for column '${filter.columnKey}'.`);
    }

    if (filter.operator === 'between' && (filter.value == null || filter.valueTo == null)) {
      throw new Error(`Filter operator 'between' requires both value and valueTo for column '${filter.columnKey}'.`);
    }
  }

  private isOperatorAllowed(column: TableColumn<T>, operator: TableFilterOperator): boolean {
    if (column.dataType === 'text' || column.dataType === 'enum') {
      return operator === 'contains' || operator === 'equals' || operator === 'startsWith';
    }

    if (
      column.dataType === 'number' ||
      column.dataType === 'decimal' ||
      column.dataType === 'currency' ||
      column.dataType === 'date' ||
      column.dataType === 'datetime'
    ) {
      return operator === 'eq' || operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte' || operator === 'between';
    }

    if (column.dataType === 'boolean') {
      return operator === 'isTrue' || operator === 'isFalse' || operator === 'eq';
    }

    return false;
  }

  private matchesFilter(row: T, filter: TableFilter<T>): boolean {
    const column = this.columns.find((item) => item.key === filter.columnKey);
    if (column == null) {
      return false;
    }

    const rawValue = this.getColumnValue(row, column);

    if (filter.operator === 'contains' || filter.operator === 'equals' || filter.operator === 'startsWith') {
      const actual = this.toFilterText(rawValue, filter.caseSensitive ?? false);
      const expected = this.toFilterText(filter.value, filter.caseSensitive ?? false);
      if (actual == null || expected == null) {
        return false;
      }

      if (filter.operator === 'contains') {
        return actual.includes(expected);
      }

      if (filter.operator === 'startsWith') {
        return actual.startsWith(expected);
      }

      return actual === expected;
    }

    if (filter.operator === 'isTrue' || filter.operator === 'isFalse') {
      const actualBoolean = this.toBoolean(rawValue);
      if (actualBoolean == null) {
        return false;
      }

      return filter.operator === 'isTrue' ? actualBoolean : !actualBoolean;
    }

    if (column.dataType === 'boolean' && filter.operator === 'eq') {
      const actualBoolean = this.toBoolean(rawValue);
      const expectedBoolean = this.toBoolean(filter.value);
      return actualBoolean != null && expectedBoolean != null && actualBoolean === expectedBoolean;
    }

    const actual = this.toFilterComparableNumber(rawValue, column);
    const expected = this.toFilterComparableNumber(filter.value, column);

    if (actual == null || expected == null) {
      return false;
    }

    switch (filter.operator) {
      case 'eq':
        return actual === expected;
      case 'gt':
        return actual > expected;
      case 'gte':
        return actual >= expected;
      case 'lt':
        return actual < expected;
      case 'lte':
        return actual <= expected;
      case 'between': {
        const second = this.toFilterComparableNumber(filter.valueTo, column);
        if (second == null) {
          return false;
        }

        const lower = Math.min(expected, second);
        const upper = Math.max(expected, second);
        return actual >= lower && actual <= upper;
      }
      default:
        return false;
    }
  }

  private toFilterText(value: unknown, caseSensitive: boolean): string | null {
    if (value == null) {
      return null;
    }

    const text = this.valueToText(value);
    return caseSensitive ? text : text.toLowerCase();
  }

  private valueToText(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return `${value}`;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value == null) {
      return '';
    }

    return JSON.stringify(value) ?? '';
  }

  private toFilterComparableNumber(value: unknown, column: TableColumn<T>): number | null {
    if (column.dataType === 'date' || column.dataType === 'datetime') {
      return this.toDateTime(value)?.getTime() ?? null;
    }

    return this.toNumber(value);
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
      case 'enum':
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
      case 'enum':
        return 'left';
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
      case 'enum':
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

const defaultMuiActionIconMap: Record<TableActionId, MuiActionIconName> = {
  view: 'Visibility',
  edit: 'Edit',
  archive: 'Archive',
  delete: 'Delete',
};

const defaultConfirm: NonNullable<TableActionColumn<Record<string, unknown>>['confirm']> = ({ message }) => {
  const globalWithConfirm = globalThis as { confirm?: (prompt: string) => boolean };
  if (typeof globalWithConfirm.confirm === 'function') {
    return globalWithConfirm.confirm(message);
  }

  return true;
};

export function createDefaultMuiActionColumn<T extends Record<string, unknown>>(
  options: TableDefaultActionColumnOptions<T>
): TableActionColumn<T> {
  return {
    key: options.key ?? '__actions__',
    header: options.header ?? 'Actions',
    router: options.router,
    confirm: options.confirm,
    actions: [
      {
        id: 'view',
        muiIcon: 'Visibility',
        route: options.getViewRoute,
        onAction: options.onView,
      },
      {
        id: 'edit',
        muiIcon: 'Edit',
        route: options.getEditRoute,
        onAction: options.onEdit,
      },
      {
        id: 'archive',
        muiIcon: 'Archive',
        route: options.getArchiveRoute,
        onAction: options.onArchive,
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to archive this record?',
      },
      {
        id: 'delete',
        muiIcon: 'Delete',
        route: options.getDeleteRoute,
        onAction: options.onDelete,
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to delete this record?',
      },
    ],
  };
}

/* c8 ignore end */
