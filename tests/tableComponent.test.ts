import { describe, expect, it } from 'vitest';
import { JsonTableComponent, createDefaultMuiActionColumn } from '../src/index';
import type { TableActionPredicateContext } from '../src/index';

describe('JsonTableComponent', () => {
  const rows = [
    {
      name: 'Alice',
      age: 31,
      score: 10.456,
      amount: 1234.5,
      createdUtc: '2026-01-01T10:00:00.000Z',
      active: true,
      sortableFlag: 2,
    },
    {
      name: 'bob',
      age: 29,
      score: 2.3,
      amount: 95,
      createdUtc: '2026-01-01T09:00:00.000Z',
      active: false,
      sortableFlag: 1,
    },
  ] as const;

  const columns = [
    { key: 'name', header: 'Name', dataType: 'text', sortable: true },
    { key: 'age', header: 'Age', dataType: 'number', sortable: true },
    { key: 'score', header: 'Score', dataType: 'decimal', decimalPlaces: 3 },
    { key: 'amount', header: 'Amount', dataType: 'currency', currencyCode: 'USD' },
    {
      key: 'createdUtc',
      header: 'Created',
      dataType: 'date',
      temporalType: 'datetime',
      dateLocale: 'US',
      dateLength: 'short',
      convertUtcToClientLocal: false,
    },
    { key: 'active', header: 'Active', dataType: 'boolean', booleanDisplay: 'icon' },
    { key: 'sortableFlag', header: 'Flag', dataType: 'number', sortable: false },
  ] as const;

  it('accepts JSON string input', () => {
    const component = new JsonTableComponent({
      data: JSON.stringify(rows),
      columns,
    });

    expect(component.getSortedRows().length).toBe(2);
    expect(component.getSortedRows()[0]?.name).toBe('Alice');
  });

  it('throws for invalid currency code', () => {
    expect(
      () =>
        new JsonTableComponent({
          data: rows,
          columns: [{ key: 'amount', header: 'Amount', dataType: 'currency', currencyCode: 'BAD' }],
        })
    ).toThrow('Invalid currency code');
  });

  it('returns header state and sort direction', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.toggleSort('name');

    const headers = component.getHeaders();
    expect(headers.find((x) => x.key === 'name')?.sortDirection).toBe('asc');
    expect(headers.find((x) => x.key === 'sortableFlag')?.sortable).toBe(false);
  });

  it('toggles sorting asc then desc by clicked header', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.toggleSort('name');
    expect(component.getSortedRows().map((x) => x.name)).toEqual(['Alice', 'bob']);

    component.toggleSort('name');
    expect(component.getSortedRows().map((x) => x.name)).toEqual(['bob', 'Alice']);
  });

  it('ignores toggle requests for non-sortable columns', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.toggleSort('sortableFlag');
    expect(component.getSortState()).toBeUndefined();
  });

  it('clears sort state', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.toggleSort('age');
    expect(component.getSortState()).toBeDefined();
    component.clearSort();
    expect(component.getSortState()).toBeUndefined();
  });

  it('uses column accessor when provided', () => {
    const component = new JsonTableComponent({
      data: rows,
      columns: [
        {
          key: 'computed',
          header: 'Computed',
          dataType: 'number',
          accessor: (row) => Number(row.age) * 2,
        },
      ],
    });

    const tableRows = component.getTableRows();
    expect(tableRows[0]?.cells[0]?.displayValue).toBe('62');
    expect(tableRows[1]?.cells[0]?.displayValue).toBe('58');
  });

  it('formats number, decimal and currency with right alignment', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    const firstRow = component.getTableRows()[0];
    const ageCell = firstRow?.cells.find((x) => x.key === 'age');
    const scoreCell = firstRow?.cells.find((x) => x.key === 'score');
    const amountCell = firstRow?.cells.find((x) => x.key === 'amount');

    expect(ageCell?.align).toBe('right');
    expect(scoreCell?.displayValue).toBe('10.456');
    expect(amountCell?.displayValue).toContain('$');
    expect(amountCell?.align).toBe('right');
  });

  it('formats decimal using configured decimal places', () => {
    const component = new JsonTableComponent({
      data: [{ value: 1.2 }],
      columns: [{ key: 'value', header: 'Value', dataType: 'decimal', decimalPlaces: 4 }],
    });

    expect(component.getTableRows()[0]?.cells[0]?.displayValue).toBe('1.2000');
  });

  it('formats currency with default decimal places and custom code', () => {
    const component = new JsonTableComponent({
      data: [{ amount: 2 }],
      columns: [{ key: 'amount', header: 'Amount', dataType: 'currency', currencyCode: 'EUR' }],
    });

    const cell = component.getTableRows()[0]?.cells[0];
    expect(cell?.displayValue).toMatch(/€|EUR/);
    expect(cell?.align).toBe('right');
  });

  it('formats date in UK long style', () => {
    const component = new JsonTableComponent({
      data: [{ created: '2026-01-01T00:00:00.000Z' }],
      columns: [{ key: 'created', header: 'Created', dataType: 'date', dateLocale: 'UK', dateLength: 'long' }],
    });

    const display = component.getTableRows()[0]?.cells[0]?.displayValue;
    expect(display).toContain('2026');
  });

  it('formats date in Chinese short style', () => {
    const component = new JsonTableComponent({
      data: [{ created: '2026-01-01T00:00:00.000Z' }],
      columns: [{ key: 'created', header: 'Created', dataType: 'date', dateLocale: 'Chinese', dateLength: 'short' }],
    });

    const display = component.getTableRows()[0]?.cells[0]?.displayValue;
    expect(display).toContain('2026');
  });

  it('supports datetime formatting with UTC output control', () => {
    const value = '2026-01-01T12:00:00.000Z';

    const utcComponent = new JsonTableComponent({
      data: [{ dt: value }],
      columns: [{
        key: 'dt',
        header: 'DT',
        dataType: 'datetime',
        dateLocale: 'US',
        dateLength: 'short',
        convertUtcToClientLocal: false,
      }],
    });

    const expectedUtc = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(value));

    expect(utcComponent.getTableRows()[0]?.cells[0]?.displayValue).toBe(expectedUtc);
  });

  it('formats booleans as yes/no', () => {
    const component = new JsonTableComponent({
      data: [{ active: true }, { active: false }],
      columns: [{ key: 'active', header: 'Active', dataType: 'boolean', booleanDisplay: 'yes-no' }],
    });

    const output = component.getTableRows().map((row) => row.cells[0]?.displayValue);
    expect(output).toEqual(['Yes', 'No']);
  });

  it('formats booleans as tick and cross icons', () => {
    const component = new JsonTableComponent({
      data: [{ active: true }, { active: false }],
      columns: [{ key: 'active', header: 'Active', dataType: 'boolean', booleanDisplay: 'icon' }],
    });

    const output = component.getTableRows().map((row) => row.cells[0]?.displayValue);
    expect(output).toEqual(['✓', '✗']);
    expect(component.getTableRows()[0]?.cells[0]?.align).toBe('center');
  });

  it('handles unknown/invalid values with blank output', () => {
    const component = new JsonTableComponent({
      data: [{ n: 'NaN', d: 'invalid-date', b: 'unknown' }],
      columns: [
        { key: 'n', header: 'N', dataType: 'number' },
        { key: 'd', header: 'D', dataType: 'date' },
        { key: 'b', header: 'B', dataType: 'boolean' },
      ],
    });

    const cells = component.getTableRows()[0]?.cells;
    expect(cells?.map((x) => x.displayValue)).toEqual(['', '', '']);
  });

  it('sorts booleans and dates correctly', () => {
    const component = new JsonTableComponent({
      data: [
        { active: true, when: '2026-01-03T00:00:00Z' },
        { active: false, when: '2026-01-01T00:00:00Z' },
      ],
      columns: [
        { key: 'active', header: 'Active', dataType: 'boolean' },
        { key: 'when', header: 'When', dataType: 'date' },
      ],
    });

    component.toggleSort('active');
    expect(component.getSortedRows().map((x) => x.active)).toEqual([false, true]);

    component.toggleSort('when');
    expect(component.getSortedRows().map((x) => x.when)).toEqual(['2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z']);
  });

  it('supports multi-column sorting with stable precedence', () => {
    const component = new JsonTableComponent({
      data: [
        { name: 'Bob', age: 30 },
        { name: 'Alice', age: 30 },
        { name: 'Carol', age: 20 },
      ],
      columns: [
        { key: 'name', header: 'Name', dataType: 'text' },
        { key: 'age', header: 'Age', dataType: 'number' },
      ],
    });

    component.setSortRules([
      { columnKey: 'age', direction: 'asc' },
      { columnKey: 'name', direction: 'asc' },
    ]);

    expect(component.getSortedRows().map((x) => `${x.age}-${x.name}`)).toEqual(['20-Carol', '30-Alice', '30-Bob']);
  });

  it('supports appendSort convenience API for additional precedence rules', () => {
    const component = new JsonTableComponent({
      data: [
        { group: 'A', score: 2, name: 'Amy' },
        { group: 'A', score: 2, name: 'Zoe' },
        { group: 'A', score: 1, name: 'Ben' },
      ],
      columns: [
        { key: 'group', header: 'Group', dataType: 'text' },
        { key: 'score', header: 'Score', dataType: 'number' },
        { key: 'name', header: 'Name', dataType: 'text' },
      ],
    });

    component.appendSort('group', 'asc');
    component.appendSort('score', 'desc');
    component.appendSort('name', 'asc');

    expect(component.getSortRules()).toEqual([
      { columnKey: 'group', direction: 'asc' },
      { columnKey: 'score', direction: 'desc' },
      { columnKey: 'name', direction: 'asc' },
    ]);
    expect(component.getSortedRows().map((x) => x.name)).toEqual(['Amy', 'Zoe', 'Ben']);
  });

  it('deduplicates sort rules by keeping last rule for same column', () => {
    const component = new JsonTableComponent({
      data: rows,
      columns,
    });

    component.setSortRules([
      { columnKey: 'name', direction: 'asc' },
      { columnKey: 'age', direction: 'asc' },
      { columnKey: 'name', direction: 'desc' },
    ]);

    expect(component.getSortRules()).toEqual([
      { columnKey: 'age', direction: 'asc' },
      { columnKey: 'name', direction: 'desc' },
    ]);
  });

  it('keeps toggleSort backward compatible by replacing with single active sort', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.setSortRules([
      { columnKey: 'age', direction: 'asc' },
      { columnKey: 'name', direction: 'asc' },
    ]);

    component.toggleSort('name');
    expect(component.getSortRules()).toEqual([{ columnKey: 'name', direction: 'asc' }]);

    component.toggleSort('name');
    expect(component.getSortRules()).toEqual([{ columnKey: 'name', direction: 'desc' }]);
  });

  it('throws for invalid multi-sort column configuration', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    expect(() => component.setSortRules([{ columnKey: 'missing', direction: 'asc' }])).toThrow(
      "Unknown sort column 'missing'. Available columns: name, age, score, amount, createdUtc, active, sortableFlag."
    );
    expect(() => component.appendSort('sortableFlag', 'asc')).toThrow(
      "Column 'sortableFlag' is not sortable. Sortable columns: name, age, score, amount, createdUtc, active."
    );
  });

  it('keeps unsorted data order when sort column does not exist', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.toggleSort('missing');
    expect(component.getSortedRows().map((x) => x.name)).toEqual(['Alice', 'bob']);
  });

  it('filters text with contains, startsWith, and equals', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([{ columnKey: 'name', operator: 'contains', value: 'AL' }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['Alice']);

    component.setFilters([{ columnKey: 'name', operator: 'startsWith', value: 'bo' }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['bob']);

    component.setFilters([{ columnKey: 'name', operator: 'equals', value: 'alice' }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['Alice']);
  });

  it('filters numeric columns with gt and between', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([{ columnKey: 'age', operator: 'gt', value: 30 }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['Alice']);

    component.setFilters([{ columnKey: 'age', operator: 'between', value: 29, valueTo: 30 }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['bob']);
  });

  it('filters date and boolean columns', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([{ columnKey: 'createdUtc', operator: 'lte', value: '2026-01-01T09:30:00.000Z' }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['bob']);

    component.setFilters([{ columnKey: 'active', operator: 'isTrue' }]);
    expect(component.getFilteredRows().map((x) => x.name)).toEqual(['Alice']);
  });

  it('combines filters with logical AND and applies sorting to filtered results', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([
      { columnKey: 'active', operator: 'eq', value: true },
      { columnKey: 'age', operator: 'gte', value: 31 },
    ]);
    component.toggleSort('name');

    expect(component.getSortedRows().map((x) => x.name)).toEqual(['Alice']);
    expect(component.getTableRows().length).toBe(1);
  });

  it('clears filters and restores full row set', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([{ columnKey: 'name', operator: 'contains', value: 'ali' }]);
    expect(component.getFilteredRows().length).toBe(1);

    component.clearFilters();
    expect(component.getFilteredRows().length).toBe(2);
    expect(component.getFilters()).toEqual([]);
  });

  it('throws for invalid filter operators and missing between bounds', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    expect(() => component.setFilters([{ columnKey: 'age', operator: 'contains', value: '3' }])).toThrow(
      "Filter operator 'contains' is not supported"
    );

    expect(() => component.setFilters([{ columnKey: 'age', operator: 'between', value: 10 }])).toThrow(
      "Filter operator 'between' requires both value and valueTo"
    );
  });

  it('supports enum data type filtering with equals', () => {
    const enumComponent = new JsonTableComponent({
      data: [
        { plan: 'Pro' },
        { plan: 'Basic' },
      ],
      columns: [{ key: 'plan', header: 'Plan', dataType: 'enum' }],
    });

    enumComponent.setFilters([{ columnKey: 'plan', operator: 'equals', value: 'pro' }]);
    expect(enumComponent.getFilteredRows().map((x) => x.plan)).toEqual(['Pro']);
  });

  it('supports client-side pagination with page index and page size controls', () => {
    const component = new JsonTableComponent({
      data: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ],
      columns: [{ key: 'id', header: 'Id', dataType: 'number' }],
    });

    component.setPagination({ pageIndex: 1, pageSize: 2 });
    expect(component.getPaginatedRows().map((x) => x.id)).toEqual([3, 4]);
    expect(component.getTableRows().map((x) => x.source.id)).toEqual([3, 4]);
  });

  it('returns page metadata for paged and unpaged scenarios', () => {
    const component = new JsonTableComponent({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      columns: [{ key: 'id', header: 'Id', dataType: 'number' }],
    });

    expect(component.getPageInfo()).toEqual({
      pageIndex: 0,
      pageSize: 3,
      totalRows: 3,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      startRow: 1,
      endRow: 3,
    });

    component.setPagination({ pageIndex: 1, pageSize: 2 });
    expect(component.getPageInfo()).toEqual({
      pageIndex: 1,
      pageSize: 2,
      totalRows: 3,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
      startRow: 3,
      endRow: 3,
    });
  });

  it('applies filtering and sorting before pagination', () => {
    const component = new JsonTableComponent({
      data: [
        { name: 'Bob', active: true },
        { name: 'Alice', active: true },
        { name: 'Zed', active: false },
      ],
      columns: [
        { key: 'name', header: 'Name', dataType: 'text' },
        { key: 'active', header: 'Active', dataType: 'boolean' },
      ],
    });

    component.setFilters([{ columnKey: 'active', operator: 'isTrue' }]);
    component.setSortRules([{ columnKey: 'name', direction: 'asc' }]);
    component.setPagination({ pageIndex: 0, pageSize: 1 });

    expect(component.getPaginatedRows().map((x) => x.name)).toEqual(['Alice']);
  });

  it('supports setPageIndex and setPageSize controls', () => {
    const component = new JsonTableComponent({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      columns: [{ key: 'id', header: 'Id', dataType: 'number' }],
    });

    component.setPageSize(2);
    component.setPageIndex(1);
    expect(component.getPagination()).toEqual({ pageIndex: 1, pageSize: 2 });
    expect(component.getPaginatedRows().map((x) => x.id)).toEqual([3, 4]);

    component.setPageSize(3);
    expect(component.getPagination()).toEqual({ pageIndex: 0, pageSize: 3 });

    component.setPageSize(2, { resetToFirstPage: false });
    component.setPageIndex(1);
    component.setPageSize(3, { resetToFirstPage: false });
    expect(component.getPagination()).toEqual({ pageIndex: 1, pageSize: 3 });
  });

  it('clamps out-of-range page index based on current row count', () => {
    const component = new JsonTableComponent({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      columns: [{ key: 'id', header: 'Id', dataType: 'number' }],
    });

    component.setPagination({ pageIndex: 99, pageSize: 2 });
    expect(component.getPageInfo().pageIndex).toBe(1);
    expect(component.getPaginatedRows().map((x) => x.id)).toEqual([3]);
  });

  it('throws for invalid pagination arguments', () => {
    const component = new JsonTableComponent({
      data: [{ id: 1 }],
      columns: [{ key: 'id', header: 'Id', dataType: 'number' }],
    });

    expect(() => component.setPagination({ pageIndex: -1, pageSize: 10 })).toThrow('Invalid page index');
    expect(() => component.setPagination({ pageIndex: 0, pageSize: 0 })).toThrow('Invalid page size');
    expect(() => component.setPageIndex(-1)).toThrow('Invalid page index');
    expect(() => component.setPageSize(0)).toThrow('Invalid page size');
  });

  it('clears pagination state and returns full row set', () => {
    const component = new JsonTableComponent({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      columns: [{ key: 'id', header: 'Id', dataType: 'number' }],
    });

    component.setPagination({ pageIndex: 0, pageSize: 1 });
    expect(component.getTableRows().length).toBe(1);
    component.clearPagination();

    expect(component.getPagination()).toBeUndefined();
    expect(component.getTableRows().length).toBe(3);
  });

  it('defaults all columns to visible and supports full visibility map updates', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    expect(component.getColumnVisibility().name).toBe(true);
    expect(component.getHeaders().some((header) => header.key === 'name')).toBe(true);

    component.setColumnVisibilityMap({ name: false, age: true, score: false, amount: true, createdUtc: true, active: true, sortableFlag: true });
    expect(component.getHeaders().some((header) => header.key === 'name')).toBe(false);
    expect(component.getHeaders().some((header) => header.key === 'score')).toBe(false);
  });

  it('supports setting and toggling visibility for single columns', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setColumnVisibility('name', false);
    expect(component.getHeaders().some((header) => header.key === 'name')).toBe(false);

    component.toggleColumnVisibility('name');
    expect(component.getHeaders().some((header) => header.key === 'name')).toBe(true);
  });

  it('excludes hidden columns from table cells while preserving action column', () => {
    const actionColumn = createDefaultMuiActionColumn({
      router: { navigate: () => {} },
      getViewRoute: () => '/view',
    });

    const component = new JsonTableComponent({ data: rows, columns, actionColumn });
    component.setColumnVisibility('name', false);

    const row = component.getTableRows()[0];
    expect(row?.cells.some((cell) => cell.key === 'name')).toBe(false);
    expect(row?.cells.some((cell) => cell.key === '__actions__')).toBe(true);
  });

  it('keeps sorting and filtering stable on hidden columns', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setColumnVisibility('name', false);
    component.setFilters([{ columnKey: 'name', operator: 'contains', value: 'ali' }]);
    component.setSortRules([{ columnKey: 'name', direction: 'asc' }]);

    expect(component.getSortedRows().map((row) => row.name)).toEqual(['Alice']);
    const outputRow = component.getTableRows()[0];
    expect(outputRow?.cells.some((cell) => cell.key === 'name')).toBe(false);
  });

  it('clears visibility state and validates unknown column keys', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setColumnVisibility('name', false);
    expect(component.getHeaders().some((header) => header.key === 'name')).toBe(false);

    component.clearColumnVisibility();
    expect(component.getHeaders().some((header) => header.key === 'name')).toBe(true);

    expect(() => component.setColumnVisibility('missing', false)).toThrow(
      "Unknown column 'missing'. Available columns: name, age, score, amount, createdUtc, active, sortableFlag."
    );
    expect(() => component.setColumnVisibilityMap({ missing: false })).toThrow(
      "Unknown column 'missing'. Available columns: name, age, score, amount, createdUtc, active, sortableFlag."
    );
    expect(() => component.toggleColumnVisibility('missing')).toThrow(
      "Unknown column 'missing'. Available columns: name, age, score, amount, createdUtc, active, sortableFlag."
    );
  });

  it('supports selecting rows by key and row object', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.selectRowByKey(0);
    expect(component.getSelectedRowKeys()).toEqual([0]);
    expect(component.getSelectedRows().map((x) => x.name)).toEqual(['Alice']);

    const bob = component.getSortedRows().find((row) => row.name === 'bob');
    if (bob == null) {
      throw new Error('Expected bob row.');
    }

    component.selectRow(bob);
    expect(component.getSelectedRows().map((x) => x.name)).toEqual(['Alice', 'bob']);

    component.toggleRowSelectionByKey(0);
    expect(component.getSelectedRowKeys()).toEqual([1]);
    expect(component.isRowSelectedByKey(1)).toBe(true);
    expect(component.isRowSelected(bob)).toBe(true);
  });

  it('supports select-all helpers and selection info', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.setFilters([{ columnKey: 'active', operator: 'isTrue' }]);
    component.setPagination({ pageIndex: 0, pageSize: 1 });

    component.selectAllFilteredRows();
    expect(component.getSelectedFilteredRows().map((x) => x.name)).toEqual(['Alice']);
    expect(component.getSelectionInfo().allFilteredSelected).toBe(true);

    component.clearSelection();
    component.selectAllPaginatedRows();
    expect(component.getSelectedPaginatedRows().map((x) => x.name)).toEqual(['Alice']);
    expect(component.getSelectionInfo().allPaginatedSelected).toBe(true);

    component.clearSelection();
    component.selectAllRows();
    expect(component.getSelectedRows().length).toBe(2);
  });

  it('supports custom rowKey and validates unknown or duplicate row keys', () => {
    const component = new JsonTableComponent({
      data: [
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      rowKey: 'id',
    });

    component.setSelectedRowKeys(['u2']);
    expect(component.getSelectedRows().map((x) => x.name)).toEqual(['Bob']);
    expect(() => component.selectRowByKey('missing')).toThrow("Unknown row key 'missing'.");

    expect(
      () =>
        new JsonTableComponent({
          data: [
            { id: 'dup', name: 'A' },
            { id: 'dup', name: 'B' },
          ],
          columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
          rowKey: 'id',
        })
    ).toThrow('Duplicate row key');
  });

  it('executes bulk action handler with selected row context', async () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.selectRowByKey(0);

    const result = await component.executeBulkAction((context) => ({
      selected: context.selectedRows.map((x) => x.name),
      selectedKeys: context.selectedRowKeys,
      totalFiltered: context.filteredRows.length,
      totalPaginated: context.paginatedRows.length,
    }));

    expect(result).toEqual({
      selected: ['Alice'],
      selectedKeys: [0],
      totalFiltered: 2,
      totalPaginated: 2,
    });
  });

  it('exports visible columns by default and supports hidden column override', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.setColumnVisibility('amount', false);

    const csv = component.exportCsv();
    expect(csv.split('\r\n')[0]).toBe('Name,Age,Score,Created,Active,Flag');
    expect(csv).not.toContain('Amount');

    const includeHidden = component.exportCsv({ includeHiddenColumns: true });
    expect(includeHidden.split('\r\n')[0]).toBe('Name,Age,Score,Amount,Created,Active,Flag');
  });

  it('exports filtered, sorted, paginated, and selected scopes', () => {
    const component = new JsonTableComponent({
      data: [
        { id: 1, name: 'Charlie', active: true },
        { id: 2, name: 'Alice', active: true },
        { id: 3, name: 'Bob', active: false },
      ],
      columns: [
        { key: 'id', header: 'Id', dataType: 'number' },
        { key: 'name', header: 'Name', dataType: 'text' },
        { key: 'active', header: 'Active', dataType: 'boolean' },
      ],
      rowKey: 'id',
    });

    component.setFilters([{ columnKey: 'active', operator: 'isTrue' }]);
    component.setSortRules([{ columnKey: 'name', direction: 'asc' }]);
    component.setPagination({ pageIndex: 0, pageSize: 1 });
    component.setSelectedRowKeys([2]);

    expect(component.exportCsv({ scope: 'filtered' }).split('\r\n')[1]).toContain('Charlie');
    expect(component.exportCsv({ scope: 'sorted' }).split('\r\n')[1]).toContain('Alice');
    expect(component.exportCsv({ scope: 'paginated' }).split('\r\n')[1]).toContain('Alice');
    expect(component.exportCsv({ scope: 'selected' }).split('\r\n')[1]).toContain('Alice');
  });

  it('supports delimiter and header options and escapes quoted values', () => {
    const component = new JsonTableComponent({
      data: [{ name: 'A,"B"', amount: 10 }],
      columns: [
        { key: 'name', header: 'Name', dataType: 'text' },
        { key: 'amount', header: 'Amount', dataType: 'number' },
      ],
    });

    const csv = component.exportCsv({ delimiter: ';', includeHeaders: false });
    expect(csv).toBe('"A,""B""";10');

    expect(() => component.exportCsv({ delimiter: ',,' })).toThrow(
      "CSV delimiter must be exactly one character. Received ',,'."
    );
  });

  it('creates and applies saved views with round-trip state for filters, sort, visibility, and page size', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([{ columnKey: 'active', operator: 'isTrue' }]);
    component.setSortRules([{ columnKey: 'name', direction: 'asc' }]);
    component.setColumnVisibility('score', false);
    component.setPagination({ pageIndex: 1, pageSize: 1 });

    const saved = component.createSavedView();

    component.clearFilters();
    component.clearSort();
    component.clearColumnVisibility();
    component.setPagination({ pageIndex: 0, pageSize: 25 });

    const applied = component.applySavedView(saved);

    expect(applied.filters).toEqual([{ columnKey: 'active', operator: 'isTrue' }]);
    expect(applied.sortRules).toEqual([{ columnKey: 'name', direction: 'asc' }]);
    expect(applied.columnVisibility.score).toBe(false);
    expect(applied.pageSize).toBe(1);
    expect(component.getPagination()).toEqual({ pageIndex: 0, pageSize: 1 });
  });

  it('saves, lists, loads, deletes, and clears named views deterministically', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setFilters([{ columnKey: 'name', operator: 'contains', value: 'a' }]);
    component.saveView('Alpha');

    component.clearFilters();
    component.setSortRules([{ columnKey: 'age', direction: 'desc' }]);
    component.saveView('Beta');

    expect(component.listSavedViews()).toEqual(['Alpha', 'Beta']);

    component.loadView('Alpha');
    expect(component.getFilters()).toEqual([{ columnKey: 'name', operator: 'contains', value: 'a' }]);

    const fromStore = component.getSavedView('Beta');
    expect(fromStore?.sortRules).toEqual([{ columnKey: 'age', direction: 'desc' }]);

    expect(component.deleteSavedView('Alpha')).toBe(true);
    expect(component.listSavedViews()).toEqual(['Beta']);

    component.clearSavedViews();
    expect(component.listSavedViews()).toEqual([]);
  });

  it('supports load/apply saved view pagination behavior options and validates view names', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.setPagination({ pageIndex: 1, pageSize: 1 });
    component.saveView('Page View');

    component.setPagination({ pageIndex: 1, pageSize: 2 });
    component.loadView('Page View', { resetToFirstPage: false });
    expect(component.getPagination()).toEqual({ pageIndex: 1, pageSize: 1 });

    expect(() => component.saveView('   ')).toThrow('Saved view name must be a non-empty string.');
    expect(() => component.loadView('missing')).toThrow("Saved view 'missing' does not exist.");
  });

  it('supports selecting rows by key and row object', () => {
    const component = new JsonTableComponent({ data: rows, columns });

    component.selectRowByKey(0);
    expect(component.getSelectedRowKeys()).toEqual([0]);
    expect(component.getSelectedRows().map((x) => x.name)).toEqual(['Alice']);

    const bob = component.getSortedRows().find((row) => row.name === 'bob');
    if (bob == null) {
      throw new Error('Expected bob row.');
    }

    component.selectRow(bob);
    expect(component.getSelectedRows().map((x) => x.name)).toEqual(['Alice', 'bob']);

    component.toggleRowSelectionByKey(0);
    expect(component.getSelectedRowKeys()).toEqual([1]);
    expect(component.isRowSelectedByKey(1)).toBe(true);
    expect(component.isRowSelected(bob)).toBe(true);
  });

  it('supports select-all helpers and selection info', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.setFilters([{ columnKey: 'active', operator: 'isTrue' }]);
    component.setPagination({ pageIndex: 0, pageSize: 1 });

    component.selectAllFilteredRows();
    expect(component.getSelectedFilteredRows().map((x) => x.name)).toEqual(['Alice']);
    expect(component.getSelectionInfo().allFilteredSelected).toBe(true);

    component.clearSelection();
    component.selectAllPaginatedRows();
    expect(component.getSelectedPaginatedRows().map((x) => x.name)).toEqual(['Alice']);
    expect(component.getSelectionInfo().allPaginatedSelected).toBe(true);

    component.clearSelection();
    component.selectAllRows();
    expect(component.getSelectedRows().length).toBe(2);
  });

  it('supports custom rowKey and validates unknown or duplicate row keys', () => {
    const component = new JsonTableComponent({
      data: [
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      rowKey: 'id',
    });

    component.setSelectedRowKeys(['u2']);
    expect(component.getSelectedRows().map((x) => x.name)).toEqual(['Bob']);
    expect(() => component.selectRowByKey('missing')).toThrow("Unknown row key 'missing'.");

    expect(
      () =>
        new JsonTableComponent({
          data: [
            { id: 'dup', name: 'A' },
            { id: 'dup', name: 'B' },
          ],
          columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
          rowKey: 'id',
        })
    ).toThrow('Duplicate row key');
  });

  it('executes bulk action handler with selected row context', async () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.selectRowByKey(0);

    const result = await component.executeBulkAction((context) => ({
      selected: context.selectedRows.map((x) => x.name),
      selectedKeys: context.selectedRowKeys,
      totalFiltered: context.filteredRows.length,
      totalPaginated: context.paginatedRows.length,
    }));

    expect(result).toEqual({
      selected: ['Alice'],
      selectedKeys: [0],
      totalFiltered: 2,
      totalPaginated: 2,
    });
  });

  it('adds action column and exposes default mui action icons', () => {
    const routerCalls: string[] = [];
    const actionColumn = createDefaultMuiActionColumn({
      router: { navigate: (to) => routerCalls.push(to) },
      getViewRoute: (row) => `/users/${String(row.name).toLowerCase()}`,
    });

    const component = new JsonTableComponent({ data: rows, columns, actionColumn });
    const headers = component.getHeaders();
    const actionHeader = headers.find((item) => item.key === '__actions__');
    expect(actionHeader?.sortable).toBe(false);

    const actionCell = component.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__');
    expect(actionCell?.actions?.map((action) => action.muiIcon)).toEqual(['Visibility', 'Edit', 'Archive', 'Delete']);
    expect(routerCalls).toEqual([]);
  });

  it('runs view and edit actions through router', async () => {
    const routerCalls: string[] = [];
    const actionColumn = createDefaultMuiActionColumn({
      router: { navigate: (to) => routerCalls.push(to) },
      getViewRoute: (row) => `/view/${String(row.name).toLowerCase()}`,
      getEditRoute: (row) => `/edit/${String(row.name).toLowerCase()}`,
    });

    const component = new JsonTableComponent({ data: rows, columns, actionColumn });
    const actions = component.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const view = actions.find((action) => action.id === 'view');
    const edit = actions.find((action) => action.id === 'edit');

    await view?.execute();
    await edit?.execute();

    expect(routerCalls).toEqual(['/view/alice', '/edit/alice']);
  });

  it('requires confirmation for archive and delete actions', async () => {
    const routerCalls: string[] = [];
    const confirmations: string[] = [];
    const actionColumn = createDefaultMuiActionColumn({
      router: { navigate: (to) => routerCalls.push(to) },
      confirm: ({ message, actionId }) => {
        confirmations.push(`${actionId}:${message}`);
        return false;
      },
      getArchiveRoute: () => '/archive',
      getDeleteRoute: () => '/delete',
    });

    const component = new JsonTableComponent({ data: rows, columns, actionColumn });
    const actions = component.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const archive = actions.find((action) => action.id === 'archive');
    const del = actions.find((action) => action.id === 'delete');

    const archiveResult = await archive?.execute();
    const deleteResult = await del?.execute();

    expect(archiveResult).toBe(false);
    expect(deleteResult).toBe(false);
    expect(routerCalls).toEqual([]);
    expect(confirmations.length).toBe(2);
  });

  it('supports custom action callbacks when no routes are provided', async () => {
    const events: string[] = [];
    const actionColumn = createDefaultMuiActionColumn({
      router: { navigate: () => {} },
      onView: (row) => events.push(`view:${String(row.name)}`),
      onEdit: (row) => events.push(`edit:${String(row.name)}`),
      onArchive: (row) => events.push(`archive:${String(row.name)}`),
      onDelete: (row) => events.push(`delete:${String(row.name)}`),
      confirm: () => true,
    });

    const component = new JsonTableComponent({ data: rows, columns, actionColumn });
    const actions = component.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];

    for (const action of actions) {
      await action.execute();
    }

    expect(events).toEqual(['view:Alice', 'edit:Alice', 'archive:Alice', 'delete:Alice']);
  });

  it('emits audit metadata events around action execution lifecycle', async () => {
    const auditEvents: string[] = [];
    const actionColumn = createDefaultMuiActionColumn({
      router: { navigate: () => {} },
      onView: () => {},
      onAudit: (event) => {
        auditEvents.push(`${event.actionId}:${event.outcome}:${String(event.rowKey)}:${event.requiresConfirmation}`);
      },
    });

    const component = new JsonTableComponent({
      data: [{ id: 'u1', name: 'Alice' }],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      actionColumn,
      rowKey: 'id',
    });

    const actions = component.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const view = actions.find((action) => action.id === 'view');
    await view?.execute();

    expect(auditEvents).toEqual(['view:started:u1:false', 'view:completed:u1:false']);
  });

  it('emits cancellation and failure audit outcomes and does not fail when onAudit throws', async () => {
    const cancellations: string[] = [];
    const cancellableColumn = createDefaultMuiActionColumn({
      router: { navigate: () => {} },
      confirm: () => false,
      getArchiveRoute: () => '/archive',
      onAudit: (event) => {
        cancellations.push(`${event.actionId}:${event.outcome}:${String(event.confirmed)}`);
      },
    });

    const componentCancel = new JsonTableComponent({ data: rows, columns, actionColumn: cancellableColumn });
    const cancelActions = componentCancel.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const archive = cancelActions.find((action) => action.id === 'archive');
    const cancelled = await archive?.execute();
    expect(cancelled).toBe(false);
    expect(cancellations).toEqual(['archive:started:undefined', 'archive:cancelled:false']);

    const failures: string[] = [];
    const failingColumn = createDefaultMuiActionColumn({
      router: { navigate: () => {} },
      onView: () => {
        throw new Error('boom');
      },
      onAudit: (event) => {
        failures.push(`${event.actionId}:${event.outcome}:${String(event.success)}:${event.errorMessage ?? ''}`);
        throw new Error('audit failed');
      },
    });

    const componentFail = new JsonTableComponent({ data: rows, columns, actionColumn: failingColumn });
    const failActions = componentFail.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const view = failActions.find((action) => action.id === 'view');

    await expect(view?.execute()).rejects.toThrow('boom');
    expect(failures[0]).toContain('view:started');
    expect(failures[1]).toContain('view:failed:false:boom');
  });

  it('supports permission-aware action visibility and enabled predicates', async () => {
    type PermissionRow = { id: string; name: string };

    const actionColumn = createDefaultMuiActionColumn<PermissionRow>({
      router: { navigate: () => {} },
      permissions: ['users:view', 'users:archive'],
      getViewRoute: () => '/view',
      getEditRoute: () => '/edit',
      getArchiveRoute: () => '/archive',
      getDeleteRoute: () => '/delete',
    });

    const customActions = actionColumn.actions.map((action) => {
      if (action.id === 'edit') {
        return {
          ...action,
          enabled: (_row: PermissionRow, context: TableActionPredicateContext<PermissionRow>) =>
            context.hasPermission('users:edit'),
        };
      }

      if (action.id === 'delete') {
        return {
          ...action,
          visible: (_row: PermissionRow, context: TableActionPredicateContext<PermissionRow>) =>
            context.hasAnyPermissions(['users:delete']),
        };
      }

      if (action.id === 'archive') {
        return {
          ...action,
          visible: (_row: PermissionRow, context: TableActionPredicateContext<PermissionRow>) =>
            context.hasPermission('users:view') && context.hasAllPermissions(['users:archive']),
        };
      }

      return action;
    });

    const component = new JsonTableComponent({
      data: [{ id: 'u1', name: 'Alice' } satisfies PermissionRow],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      actionColumn: {
        ...actionColumn,
        actions: customActions,
      },
      rowKey: 'id',
    });

    const actions = component.getTableRows()[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const ids = actions.map((action) => action.id);

    expect(ids).toEqual(['view', 'edit', 'archive']);

    const edit = actions.find((action) => action.id === 'edit');
    expect(edit?.disabled).toBe(true);

    const archive = actions.find((action) => action.id === 'archive');
    expect(archive?.disabled).toBe(false);
    await expect(archive?.execute()).resolves.toBe(true);
  });

  it('supports permissionResolver and keeps one-argument predicates backward-compatible', () => {
    const seenRows: string[] = [];
    const component = new JsonTableComponent({
      data: [
        { id: 'u1', name: 'Alice', role: 'admin' },
        { id: 'u2', name: 'Bob', role: 'reader' },
      ],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
      rowKey: 'id',
      actionColumn: {
        router: { navigate: () => {} },
        permissionResolver: (row) => (row.role === 'admin' ? ['users:delete'] : []),
        actions: [
          {
            id: 'view',
            route: '/view',
            visible: (row) => {
              seenRows.push(String(row.name));
              return true;
            },
          },
          {
            id: 'delete',
            route: '/delete',
            visible: (_row, context) => context.hasPermission('users:delete'),
          },
        ],
      },
    });

    const rowStates = component.getTableRows();
    const firstActions = rowStates[0]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];
    const secondActions = rowStates[1]?.cells.find((cell) => cell.key === '__actions__')?.actions ?? [];

    expect(seenRows).toEqual(['Alice', 'Bob']);
    expect(firstActions.map((action) => action.id)).toEqual(['view', 'delete']);
    expect(secondActions.map((action) => action.id)).toEqual(['view']);
  });
});
