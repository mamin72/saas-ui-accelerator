import { describe, expect, it } from 'vitest';
import { JsonTableComponent } from '../src/index';

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

  it('keeps unsorted data order when sort column does not exist', () => {
    const component = new JsonTableComponent({ data: rows, columns });
    component.toggleSort('missing');
    expect(component.getSortedRows().map((x) => x.name)).toEqual(['Alice', 'bob']);
  });
});
