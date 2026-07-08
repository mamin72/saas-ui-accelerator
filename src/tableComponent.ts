/* c8 ignore start */
import { parseRecords } from './formatSupport';
import { sortByRules } from './sortByRules';
import { assertCsvDelimiter, assertTableColumnConfig, assertValidRowKeyValue } from './validation';

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
export type TableActionAuditOutcome = 'started' | 'confirmed' | 'cancelled' | 'completed' | 'failed';

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
  readonly onAudit?: (event: TableActionAuditEvent<T>) => void | Promise<void>;
}

export interface TableActionAuditEvent<T extends Record<string, unknown>> {
  readonly actionId: TableActionId;
  readonly outcome: TableActionAuditOutcome;
  readonly row: T;
  readonly rowKey: TableRowKey;
  readonly timestamp: string;
  readonly route?: string;
  readonly requiresConfirmation: boolean;
  readonly confirmed?: boolean;
  readonly success?: boolean;
  readonly errorMessage?: string;
}

export interface TableDefaultActionColumnOptions<T extends Record<string, unknown>> {
  readonly key?: string;
  readonly header?: string;
  readonly router: TableActionRouter;
  readonly confirm?: (input: { actionId: TableActionId; message: string; row: T }) => boolean | Promise<boolean>;
  readonly onAudit?: (event: TableActionAuditEvent<T>) => void | Promise<void>;
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

export interface TablePaginationState {
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface TableSavedView<T extends Record<string, unknown>> {
  readonly filters: readonly TableFilter<T>[];
  readonly sortRules: readonly SortState[];
  readonly columnVisibility: TableColumnVisibilityState;
  readonly pageSize?: number;
}

export type TableColumnVisibilityState = Readonly<Record<string, boolean>>;
export type TableRowKey = string | number;
export type TableCsvExportScope = 'all' | 'filtered' | 'sorted' | 'paginated' | 'selected';

export interface TableCsvExportOptions {
  readonly scope?: TableCsvExportScope;
  readonly delimiter?: string;
  readonly includeHeaders?: boolean;
  readonly includeHiddenColumns?: boolean;
}

export interface TableSelectionInfo {
  readonly selectedCount: number;
  readonly selectedFilteredCount: number;
  readonly selectedPaginatedCount: number;
  readonly allFilteredSelected: boolean;
  readonly allPaginatedSelected: boolean;
}

export interface TableBulkSelectionContext<T extends Record<string, unknown>> {
  readonly selectedRowKeys: readonly TableRowKey[];
  readonly selectedRows: readonly T[];
  readonly selectedFilteredRows: readonly T[];
  readonly selectedPaginatedRows: readonly T[];
  readonly filteredRows: readonly T[];
  readonly sortedRows: readonly T[];
  readonly paginatedRows: readonly T[];
}

export type TableBulkActionHandler<T extends Record<string, unknown>, TResult = void> = (
  context: TableBulkSelectionContext<T>
) => TResult | Promise<TResult>;

export interface TablePageInfo {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalRows: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  readonly startRow: number;
  readonly endRow: number;
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
  readonly rowKey?: Extract<keyof T, string> | ((row: T, index: number) => TableRowKey);
}

export class JsonTableComponent<T extends Record<string, unknown>> {
  private readonly rows: readonly T[];
  private readonly columns: readonly TableColumn<T>[];
  private readonly actionColumn: TableActionColumn<T> | undefined;
  private sortState: readonly SortState[];
  private filterState: readonly TableFilter<T>[];
  private paginationState: TablePaginationState | undefined;
  private columnVisibilityState: TableColumnVisibilityState;
  private readonly rowKeyTokenToKey: Map<string, TableRowKey>;
  private readonly rowKeyTokenToRow: Map<string, T>;
  private readonly rowReferenceToToken: Map<T, string>;
  private readonly rowKeyResolver: (row: T, index: number) => TableRowKey;
  private selectedRowKeyTokens: Set<string>;
  private readonly savedViews: Map<string, TableSavedView<T>>;

  constructor(options: JsonTableComponentOptions<T>) {
    this.rows = this.parseData(options.data);
    this.columns = this.normalizeColumns(options.columns);
    this.actionColumn = options.actionColumn;
    this.sortState = [];
    this.filterState = [];
    this.paginationState = undefined;
    this.columnVisibilityState = this.getDefaultColumnVisibility();
    this.rowKeyResolver = this.normalizeRowKeyResolver(options.rowKey);
    this.rowKeyTokenToKey = new Map();
    this.rowKeyTokenToRow = new Map();
    this.rowReferenceToToken = new Map();
    this.buildRowKeyIndex();
    this.selectedRowKeyTokens = new Set();
    this.savedViews = new Map();
  }

  public getHeaders(): readonly TableHeaderState[] {
    const headers = this.getVisibleColumns().map((column) => ({
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

  public getSelectedRowKeys(): readonly TableRowKey[] {
    return [...this.selectedRowKeyTokens]
      .map((token) => this.rowKeyTokenToKey.get(token))
      .filter((key): key is TableRowKey => key != null);
  }

  public getSelectedRows(): T[] {
    return this.rows.filter((row, index) => this.selectedRowKeyTokens.has(this.getRowToken(row, index)));
  }

  public getSelectedFilteredRows(): T[] {
    return this.getFilteredRows().filter((row) => this.selectedRowKeyTokens.has(this.getRowTokenByRow(row)));
  }

  public getSelectedPaginatedRows(): T[] {
    return this.getPaginatedRows().filter((row) => this.selectedRowKeyTokens.has(this.getRowTokenByRow(row)));
  }

  public getSelectionInfo(): TableSelectionInfo {
    const filteredRows = this.getFilteredRows();
    const paginatedRows = this.getPaginatedRows();
    const selectedFilteredCount = filteredRows.filter((row) => this.selectedRowKeyTokens.has(this.getRowTokenByRow(row))).length;
    const selectedPaginatedCount = paginatedRows.filter((row) => this.selectedRowKeyTokens.has(this.getRowTokenByRow(row))).length;

    return {
      selectedCount: this.selectedRowKeyTokens.size,
      selectedFilteredCount,
      selectedPaginatedCount,
      allFilteredSelected: filteredRows.length > 0 && selectedFilteredCount === filteredRows.length,
      allPaginatedSelected: paginatedRows.length > 0 && selectedPaginatedCount === paginatedRows.length,
    };
  }

  public setSelectedRowKeys(keys: readonly TableRowKey[]): readonly TableRowKey[] {
    const tokens = new Set<string>();
    for (const key of keys) {
      const token = this.encodeRowKey(key);
      this.assertKnownRowToken(token, key);
      tokens.add(token);
    }

    this.selectedRowKeyTokens = tokens;
    return this.getSelectedRowKeys();
  }

  public clearSelection(): void {
    this.selectedRowKeyTokens = new Set();
  }

  public selectRowByKey(key: TableRowKey): readonly TableRowKey[] {
    const token = this.encodeRowKey(key);
    this.assertKnownRowToken(token, key);
    this.selectedRowKeyTokens = new Set([...this.selectedRowKeyTokens, token]);
    return this.getSelectedRowKeys();
  }

  public deselectRowByKey(key: TableRowKey): readonly TableRowKey[] {
    const token = this.encodeRowKey(key);
    const next = new Set(this.selectedRowKeyTokens);
    next.delete(token);
    this.selectedRowKeyTokens = next;
    return this.getSelectedRowKeys();
  }

  public toggleRowSelectionByKey(key: TableRowKey): readonly TableRowKey[] {
    const token = this.encodeRowKey(key);
    this.assertKnownRowToken(token, key);
    const next = new Set(this.selectedRowKeyTokens);
    if (next.has(token)) {
      next.delete(token);
    } else {
      next.add(token);
    }

    this.selectedRowKeyTokens = next;
    return this.getSelectedRowKeys();
  }

  public isRowSelectedByKey(key: TableRowKey): boolean {
    return this.selectedRowKeyTokens.has(this.encodeRowKey(key));
  }

  public selectRow(row: T): readonly TableRowKey[] {
    const token = this.getRowTokenByRow(row);
    this.selectedRowKeyTokens = new Set([...this.selectedRowKeyTokens, token]);
    return this.getSelectedRowKeys();
  }

  public deselectRow(row: T): readonly TableRowKey[] {
    const token = this.getRowTokenByRow(row);
    const next = new Set(this.selectedRowKeyTokens);
    next.delete(token);
    this.selectedRowKeyTokens = next;
    return this.getSelectedRowKeys();
  }

  public toggleRowSelection(row: T): readonly TableRowKey[] {
    const token = this.getRowTokenByRow(row);
    const next = new Set(this.selectedRowKeyTokens);
    if (next.has(token)) {
      next.delete(token);
    } else {
      next.add(token);
    }

    this.selectedRowKeyTokens = next;
    return this.getSelectedRowKeys();
  }

  public isRowSelected(row: T): boolean {
    return this.selectedRowKeyTokens.has(this.getRowTokenByRow(row));
  }

  public selectAllRows(): readonly TableRowKey[] {
    this.selectedRowKeyTokens = new Set(this.rows.map((row, index) => this.getRowToken(row, index)));
    return this.getSelectedRowKeys();
  }

  public selectAllFilteredRows(): readonly TableRowKey[] {
    const tokens = this.getFilteredRows().map((row) => this.getRowTokenByRow(row));
    this.selectedRowKeyTokens = new Set([...this.selectedRowKeyTokens, ...tokens]);
    return this.getSelectedRowKeys();
  }

  public selectAllPaginatedRows(): readonly TableRowKey[] {
    const tokens = this.getPaginatedRows().map((row) => this.getRowTokenByRow(row));
    this.selectedRowKeyTokens = new Set([...this.selectedRowKeyTokens, ...tokens]);
    return this.getSelectedRowKeys();
  }

  public async executeBulkAction<TResult>(
    handler: TableBulkActionHandler<T, TResult>
  ): Promise<TResult> {
    const context: TableBulkSelectionContext<T> = {
      selectedRowKeys: this.getSelectedRowKeys(),
      selectedRows: this.getSelectedRows(),
      selectedFilteredRows: this.getSelectedFilteredRows(),
      selectedPaginatedRows: this.getSelectedPaginatedRows(),
      filteredRows: this.getFilteredRows(),
      sortedRows: this.getSortedRows(),
      paginatedRows: this.getPaginatedRows(),
    };

    return Promise.resolve(handler(context));
  }

  public exportCsv(options: TableCsvExportOptions = {}): string {
    const scope = options.scope ?? 'all';
    const delimiter = options.delimiter ?? ',';
    const includeHeaders = options.includeHeaders ?? true;
    const includeHiddenColumns = options.includeHiddenColumns ?? false;

    assertCsvDelimiter(delimiter);

    const columns = includeHiddenColumns ? [...this.columns] : this.getVisibleColumns();
    const rows = this.getCsvRowsForScope(scope);

    const lines: string[] = [];
    if (includeHeaders) {
      lines.push(columns.map((column) => this.escapeCsvValue(column.header, delimiter)).join(delimiter));
    }

    for (const row of rows) {
      const values = columns.map((column) => this.escapeCsvValue(this.getCsvCellValue(row, column), delimiter));
      lines.push(values.join(delimiter));
    }

    return lines.join('\r\n');
  }


  public getColumnVisibility(): TableColumnVisibilityState {
    return this.columnVisibilityState;
  }

  public setColumnVisibilityMap(visibility: TableColumnVisibilityState): TableColumnVisibilityState {
    const normalized = this.getDefaultColumnVisibility();

    for (const key of Object.keys(visibility)) {
      this.assertKnownColumn(key);
      normalized[key] = visibility[key] !== false;
    }

    this.columnVisibilityState = normalized;
    return this.columnVisibilityState;
  }

  public setColumnVisibility(columnKey: string, isVisible: boolean): TableColumnVisibilityState {
    this.assertKnownColumn(columnKey);
    this.columnVisibilityState = {
      ...this.columnVisibilityState,
      [columnKey]: isVisible,
    };

    return this.columnVisibilityState;
  }

  public toggleColumnVisibility(columnKey: string): TableColumnVisibilityState {
    this.assertKnownColumn(columnKey);
    const current = this.columnVisibilityState[columnKey] !== false;
    this.columnVisibilityState = {
      ...this.columnVisibilityState,
      [columnKey]: !current,
    };

    return this.columnVisibilityState;
  }

  public clearColumnVisibility(): TableColumnVisibilityState {
    this.columnVisibilityState = this.getDefaultColumnVisibility();
    return this.columnVisibilityState;
  }

  public getPagination(): TablePaginationState | undefined {
    return this.paginationState;
  }

  public setPagination(pagination: TablePaginationState | undefined): TablePaginationState | undefined {
    if (pagination == null) {
      this.paginationState = undefined;
      return this.paginationState;
    }

    this.assertValidPageIndex(pagination.pageIndex);
    this.assertValidPageSize(pagination.pageSize);
    this.paginationState = {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    };
    return this.paginationState;
  }

  public clearPagination(): void {
    this.paginationState = undefined;
  }

  public createSavedView(): TableSavedView<T> {
    return this.cloneSavedView({
      filters: this.getFilters(),
      sortRules: this.getSortRules(),
      columnVisibility: this.getColumnVisibility(),
      pageSize: this.getPagination()?.pageSize,
    });
  }

  public applySavedView(view: TableSavedView<T>, options?: { readonly resetToFirstPage?: boolean }): TableSavedView<T> {
    this.setFilters(view.filters);
    this.setSortRules(view.sortRules);
    this.setColumnVisibilityMap(view.columnVisibility);

    if (view.pageSize != null) {
      this.setPageSize(view.pageSize, { resetToFirstPage: options?.resetToFirstPage !== false });
    }

    return this.createSavedView();
  }

  public saveView(name: string): TableSavedView<T> {
    const normalized = this.normalizeViewName(name);
    const view = this.createSavedView();
    this.savedViews.set(normalized, view);
    return this.cloneSavedView(view);
  }

  public loadView(name: string, options?: { readonly resetToFirstPage?: boolean }): TableSavedView<T> {
    const normalized = this.normalizeViewName(name);
    const view = this.savedViews.get(normalized);
    if (view == null) {
      throw new Error(`Saved view '${normalized}' does not exist.`);
    }

    return this.applySavedView(view, options);
  }

  public getSavedView(name: string): TableSavedView<T> | undefined {
    const normalized = this.normalizeViewName(name);
    const view = this.savedViews.get(normalized);
    return view == null ? undefined : this.cloneSavedView(view);
  }

  public listSavedViews(): readonly string[] {
    return Array.from(this.savedViews.keys()).sort((a, b) => a.localeCompare(b));
  }

  public deleteSavedView(name: string): boolean {
    const normalized = this.normalizeViewName(name);
    return this.savedViews.delete(normalized);
  }

  public clearSavedViews(): void {
    this.savedViews.clear();
  }

  public setPageIndex(pageIndex: number): TablePaginationState {
    this.assertValidPageIndex(pageIndex);
    const current = this.paginationState ?? { pageIndex: 0, pageSize: 25 };
    this.paginationState = {
      pageIndex,
      pageSize: current.pageSize,
    };

    return this.paginationState;
  }

  public setPageSize(pageSize: number, options?: { readonly resetToFirstPage?: boolean }): TablePaginationState {
    this.assertValidPageSize(pageSize);
    const current = this.paginationState ?? { pageIndex: 0, pageSize };
    this.paginationState = {
      pageIndex: options?.resetToFirstPage === false ? current.pageIndex : 0,
      pageSize,
    };

    return this.paginationState;
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
    return this.getPaginatedRows().map((row) => ({
      source: row,
      cells: this.toCells(row),
    }));
  }

  public getPaginatedRows(): T[] {
    const sortedRows = this.getSortedRows();
    if (this.paginationState == null) {
      return sortedRows;
    }

    const { pageSize } = this.paginationState;
    const pageIndex = this.getEffectivePageIndex(sortedRows.length, pageSize, this.paginationState.pageIndex);
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return sortedRows.slice(start, end);
  }

  public getPageInfo(): TablePageInfo {
    const totalRows = this.getSortedRows().length;

    if (this.paginationState == null) {
      return {
        pageIndex: 0,
        pageSize: totalRows,
        totalRows,
        totalPages: totalRows > 0 ? 1 : 0,
        hasPreviousPage: false,
        hasNextPage: false,
        startRow: totalRows > 0 ? 1 : 0,
        endRow: totalRows,
      };
    }

    const { pageSize } = this.paginationState;
    const totalPages = totalRows > 0 ? Math.ceil(totalRows / pageSize) : 0;
    const pageIndex = this.getEffectivePageIndex(totalRows, pageSize, this.paginationState.pageIndex);
    const startRow = totalRows > 0 ? pageIndex * pageSize + 1 : 0;
    const endRow = totalRows > 0 ? Math.min((pageIndex + 1) * pageSize, totalRows) : 0;

    return {
      pageIndex,
      pageSize,
      totalRows,
      totalPages,
      hasPreviousPage: pageIndex > 0,
      hasNextPage: totalPages > 0 && pageIndex < totalPages - 1,
      startRow,
      endRow,
    };
  }

  public getFilteredRows(): T[] {
    if (this.filterState.length === 0) {
      return [...this.rows];
    }

    return this.rows.filter((row) => this.filterState.every((filter) => this.matchesFilter(row, filter)));
  }

  private toCells(row: T): TableCellState[] {
    const cells = this.getVisibleColumns().map((column) => this.toCell(row, column));
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
    const rowKey = this.getRowKeyByRow(row);
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
        await this.emitActionAudit(actionColumn, {
          actionId: action.id,
          outcome: 'started',
          row,
          rowKey,
          timestamp: new Date().toISOString(),
          route,
          requiresConfirmation: needsConfirmation,
        });

        try {
          if (needsConfirmation) {
            const approved = await this.requestConfirmation(action, row, actionColumn);
            await this.emitActionAudit(actionColumn, {
              actionId: action.id,
              outcome: approved ? 'confirmed' : 'cancelled',
              row,
              rowKey,
              timestamp: new Date().toISOString(),
              route,
              requiresConfirmation: needsConfirmation,
              confirmed: approved,
              success: approved,
            });

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

          await this.emitActionAudit(actionColumn, {
            actionId: action.id,
            outcome: 'completed',
            row,
            rowKey,
            timestamp: new Date().toISOString(),
            route,
            requiresConfirmation: needsConfirmation,
            success: true,
          });

          return true;
        } catch (error) {
          await this.emitActionAudit(actionColumn, {
            actionId: action.id,
            outcome: 'failed',
            row,
            rowKey,
            timestamp: new Date().toISOString(),
            route,
            requiresConfirmation: needsConfirmation,
            success: false,
            errorMessage: this.errorToMessage(error),
          });

          throw error;
        }
      },
    };
  }

  private getRowKeyByRow(row: T): TableRowKey {
    const token = this.getRowTokenByRow(row);
    const key = this.rowKeyTokenToKey.get(token);
    if (key == null) {
      throw new Error('Unable to resolve row key for action audit event.');
    }

    return key;
  }

  private async emitActionAudit(
    actionColumn: TableActionColumn<T>,
    event: TableActionAuditEvent<T>
  ): Promise<void> {
    if (actionColumn.onAudit == null) {
      return;
    }

    try {
      await Promise.resolve(actionColumn.onAudit(event));
    } catch {
      // Audit hooks are observational and should never block action execution.
    }
  }

  private errorToMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
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

  private normalizeRowKeyResolver(
    rowKey: JsonTableComponentOptions<T>['rowKey']
  ): (row: T, index: number) => TableRowKey {
    if (rowKey == null) {
      return (_row, index) => index;
    }

    if (typeof rowKey === 'function') {
      return rowKey;
    }

    return (row: T) => {
      return assertValidRowKeyValue(rowKey, row[rowKey]);
    };
  }

  private buildRowKeyIndex(): void {
    this.rows.forEach((row, index) => {
      const token = this.getRowToken(row, index);
      if (this.rowKeyTokenToRow.has(token)) {
        throw new Error(`Duplicate row key '${token}' detected at row index ${index}. Row keys must be unique.`);
      }

      this.rowKeyTokenToRow.set(token, row);
      this.rowKeyTokenToKey.set(token, this.decodeRowKeyToken(token));
      this.rowReferenceToToken.set(row, token);
    });
  }

  private getRowTokenByRow(row: T): string {
    const token = this.rowReferenceToToken.get(row);
    if (token == null) {
      throw new Error('Row is not part of the current table data set.');
    }

    return token;
  }

  private getRowToken(row: T, fallbackIndex: number): string {
    const key = this.rowKeyResolver(row, fallbackIndex);
    return this.encodeRowKey(key);
  }

  private encodeRowKey(key: TableRowKey): string {
    return typeof key === 'number' ? `n:${key}` : `s:${key}`;
  }

  private decodeRowKeyToken(token: string): TableRowKey {
    if (token.startsWith('n:')) {
      return Number(token.slice(2));
    }

    return token.slice(2);
  }

  private assertKnownRowToken(token: string, originalKey: TableRowKey): void {
    if (!this.rowKeyTokenToRow.has(token)) {
      throw new Error(`Unknown row key '${originalKey}'.`);
    }
  }

  private normalizeColumns(columns: readonly TableColumn<T>[]): readonly TableColumn<T>[] {
    for (const column of columns) {
      assertTableColumnConfig(column);
    }

    return [...columns];
  }

  private getDefaultColumnVisibility(): Record<string, boolean> {
    return this.columns.reduce<Record<string, boolean>>((accumulator, column) => {
      accumulator[column.key] = true;
      return accumulator;
    }, {});
  }

  private getVisibleColumns(): readonly TableColumn<T>[] {
    return this.columns.filter((column) => this.columnVisibilityState[column.key] !== false);
  }

  private getCsvRowsForScope(scope: TableCsvExportScope): readonly T[] {
    switch (scope) {
      case 'all':
        return [...this.rows];
      case 'filtered':
        return this.getFilteredRows();
      case 'sorted':
        return this.getSortedRows();
      case 'paginated':
        return this.getPaginatedRows();
      case 'selected':
        return this.getSelectedRows();
      default:
        return [...this.rows];
    }
  }

  private getCsvCellValue(row: T, column: TableColumn<T>): string {
    const rawValue = this.getColumnValue(row, column);
    return this.formatValue(rawValue, column);
  }

  private escapeCsvValue(value: string, delimiter: string): string {
    const needsQuotes = value.includes('"') || value.includes('\n') || value.includes('\r') || value.includes(delimiter);
    if (!needsQuotes) {
      return value;
    }

    return `"${value.replace(/"/g, '""')}"`;
  }

  private assertKnownColumn(columnKey: string): void {
    const availableColumns = this.columns.map((column) => column.key);
    if (!availableColumns.includes(columnKey)) {
      const suffix = availableColumns.length > 0 ? `Available columns: ${availableColumns.join(', ')}.` : 'No columns are configured.';
      throw new Error(`Unknown column '${columnKey}'. ${suffix}`);
    }
  }

  private normalizeViewName(name: string): string {
    const normalized = name.trim();
    if (normalized.length === 0) {
      throw new Error('Saved view name must be a non-empty string.');
    }

    return normalized;
  }

  private cloneSavedView(view: TableSavedView<T>): TableSavedView<T> {
    return {
      filters: view.filters.map((filter) => ({ ...filter })),
      sortRules: view.sortRules.map((rule) => ({ ...rule })),
      columnVisibility: { ...view.columnVisibility },
      pageSize: view.pageSize,
    };
  }

  private assertValidPageIndex(pageIndex: number): void {
    if (!Number.isInteger(pageIndex) || pageIndex < 0) {
      throw new Error(`Invalid page index '${pageIndex}'. pageIndex must be an integer >= 0.`);
    }
  }

  private assertValidPageSize(pageSize: number): void {
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      throw new Error(`Invalid page size '${pageSize}'. pageSize must be an integer > 0.`);
    }
  }

  private getEffectivePageIndex(totalRows: number, pageSize: number, requestedPageIndex: number): number {
    if (totalRows <= 0) {
      return 0;
    }

    const maxPageIndex = Math.max(0, Math.ceil(totalRows / pageSize) - 1);
    return Math.min(Math.max(0, requestedPageIndex), maxPageIndex);
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
      const availableColumns = this.columns.map((item) => item.key).join(', ');
      throw new Error(
        availableColumns.length > 0
          ? `Unknown sort column '${columnKey}'. Available columns: ${availableColumns}.`
          : `Unknown sort column '${columnKey}'. No columns are configured.`
      );
    }

    if (column.sortable === false) {
      const sortableColumns = this.columns.filter((item) => item.sortable !== false).map((item) => item.key).join(', ');
      throw new Error(
        sortableColumns.length > 0
          ? `Column '${columnKey}' is not sortable. Sortable columns: ${sortableColumns}.`
          : `Column '${columnKey}' is not sortable. No sortable columns are configured.`
      );
    }
  }

  private validateFilter(filter: TableFilter<T>): void {
    const column = this.columns.find((item) => item.key === filter.columnKey);
    if (column == null) {
      const availableColumns = this.columns.map((item) => item.key).join(', ');
      throw new Error(
        availableColumns.length > 0
          ? `Unknown filter column '${filter.columnKey}'. Available columns: ${availableColumns}.`
          : `Unknown filter column '${filter.columnKey}'. No columns are configured.`
      );
    }

    if (!this.isOperatorAllowed(column, filter.operator)) {
      const allowedOperators = this.getAllowedFilterOperators(column).join(', ');
      throw new Error(
        `Filter operator '${filter.operator}' is not supported for column '${filter.columnKey}'. Allowed operators: ${allowedOperators}.`
      );
    }

    if (filter.operator === 'between' && (filter.value == null || filter.valueTo == null)) {
      throw new Error(
        `Filter operator 'between' requires both value and valueTo for column '${filter.columnKey}'. Provide both bounds to continue.`
      );
    }
  }

  private getAllowedFilterOperators(column: TableColumn<T>): readonly TableFilterOperator[] {
    if (column.dataType === 'text' || column.dataType === 'enum') {
      return ['contains', 'equals', 'startsWith'];
    }

    if (
      column.dataType === 'number' ||
      column.dataType === 'decimal' ||
      column.dataType === 'currency' ||
      column.dataType === 'date' ||
      column.dataType === 'datetime'
    ) {
      return ['eq', 'gt', 'gte', 'lt', 'lte', 'between'];
    }

    if (column.dataType === 'boolean') {
      return ['isTrue', 'isFalse', 'eq'];
    }

    return [];
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
    onAudit: options.onAudit,
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
