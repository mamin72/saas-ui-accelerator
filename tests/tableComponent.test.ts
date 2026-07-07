import { describe, expect, it } from 'vitest';
import { JsonTableComponent, createDefaultMuiActionColumn } from '../src/index';

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

    expect(() => component.setSortRules([{ columnKey: 'missing', direction: 'asc' }])).toThrow("Invalid sort column 'missing'.");
    expect(() => component.appendSort('sortableFlag', 'asc')).toThrow("Column 'sortableFlag' is not sortable.");
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
});
