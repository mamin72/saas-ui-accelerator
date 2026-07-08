import { describe, expect, it } from 'vitest';
import {
  createParseAndSortStarterTemplate,
  createTableStarterTemplate,
  parseAndSortWithStarterTemplate,
} from '../src/index';

describe('starterTemplates', () => {
  it('creates a table template with inferred columns and initial state', () => {
    const template = createTableStarterTemplate({
      data: [
        { id: 1, fullName: 'Alice', active: true, createdUtc: '2026-01-01T00:00:00.000Z' },
        { id: 2, fullName: 'Bob', active: false, createdUtc: '2026-01-02T00:00:00.000Z' },
      ],
      rowKey: 'id',
      initialSortRules: [{ columnKey: 'fullName', direction: 'asc' }],
      initialPagination: { pageIndex: 0, pageSize: 1 },
      initialSelectedRowKeys: [1],
    });

    expect(template.tableOptions.columns.map((column) => column.key)).toEqual(['id', 'fullName', 'active', 'createdUtc']);
    expect(template.tableOptions.columns.map((column) => column.header)).toEqual(['Id', 'Full Name', 'Active', 'Created Utc']);

    const component = template.createComponent();
    expect(component.getSortRules()).toEqual([{ columnKey: 'fullName', direction: 'asc' }]);
    expect(component.getPageInfo().pageSize).toBe(1);
    expect(component.getSelectedRowKeys()).toEqual([1]);
  });

  it('applies column overrides and validates empty inference inputs', () => {
    const template = createTableStarterTemplate({
      data: [{ amount: 1234.56, name: 'A' }],
      columnOverrides: {
        amount: {
          dataType: 'currency',
          currencyCode: 'USD',
        },
      },
    });

    const amountColumn = template.tableOptions.columns.find((column) => column.key === 'amount');
    expect(amountColumn?.dataType).toBe('currency');
    expect(amountColumn?.currencyCode).toBe('USD');

    expect(() => createTableStarterTemplate({ data: [] })).toThrow(
      'Unable to infer columns from empty data. Provide columns explicitly.'
    );
  });

  it('creates parse-and-sort starter options and executes sorting', () => {
    const options = createParseAndSortStarterTemplate<{ name: string; amount: number }>({
      format: 'csv',
      sortBy: 'amount',
      direction: 'desc',
      mapper: (record) => ({
        name: String(record.name),
        amount: Number(record.amount),
      }),
    });

    const result = parseAndSortWithStarterTemplate('name,amount\nA,2\nB,10', {
      format: 'csv',
      sortBy: 'amount',
      direction: 'desc',
      mapper: (record) => ({
        name: String(record.name),
        amount: Number(record.amount),
      }),
    });

    expect(options.rules.length).toBe(1);
    expect(result.map((row) => row.name)).toEqual(['B', 'A']);
  });

  it('supports selector-based starter sort templates', () => {
    const result = parseAndSortWithStarterTemplate(
      '[{"createdUtc":"2026-01-01T00:00:00.000Z"},{"createdUtc":"2025-01-01T00:00:00.000Z"}]',
      {
        format: 'json',
        sortBy: (row) => new Date(String(row.createdUtc)),
        direction: 'asc',
      }
    );

    expect(result.map((row) => row.createdUtc)).toEqual(['2025-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
  });

  it('infers data types across integer, decimal, boolean, date, datetime, and fallback values', () => {
    const template = createTableStarterTemplate({
      data: [{
        whole: 1,
        decimalValue: 1.25,
        active: true,
        birthday: '2026-01-01',
        createdUtc: '2026-01-01T00:00:00.000Z',
        createdDateObject: new Date('2026-01-01T00:00:00.000Z'),
        meta: { status: 'ok' },
      }],
    });

    const map = new Map(template.tableOptions.columns.map((column) => [String(column.key), column.dataType]));
    expect(map.get('whole')).toBe('number');
    expect(map.get('decimalValue')).toBe('decimal');
    expect(map.get('active')).toBe('boolean');
    expect(map.get('birthday')).toBe('date');
    expect(map.get('createdUtc')).toBe('datetime');
    expect(map.get('createdDateObject')).toBe('datetime');
    expect(map.get('meta')).toBe('text');
  });

  it('applies initial filters and visibility in starter component creation', () => {
    const template = createTableStarterTemplate({
      data: [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
      ],
      columns: [
        { key: 'id', header: 'Id', dataType: 'number' },
        { key: 'name', header: 'Name', dataType: 'text' },
        { key: 'active', header: 'Active', dataType: 'boolean' },
      ],
      initialFilters: [{ columnKey: 'active', operator: 'isTrue' }],
      initialColumnVisibility: { id: true, name: true, active: false },
    });

    const component = template.createComponent();
    expect(component.getFilteredRows().map((row) => row.name)).toEqual(['Alice']);
    expect(component.getHeaders().some((header) => header.key === 'active')).toBe(false);
  });

  it('converts key-based selector values for date strings and object fallbacks', () => {
    const byDate = createParseAndSortStarterTemplate<{ createdUtc: string }>({
      format: 'json',
      sortBy: 'createdUtc',
    });

    const dateValue = byDate.rules[0]?.selector({ createdUtc: '2026-01-01T00:00:00.000Z' });
    expect(dateValue instanceof Date).toBe(true);

    const byObject = createParseAndSortStarterTemplate<{ meta: { flag: boolean } }>({
      format: 'json',
      sortBy: 'meta',
    });
    expect(byObject.rules[0]?.selector({ meta: { flag: true } })).toBe('{"flag":true}');

    const byPrimitive = createParseAndSortStarterTemplate<{ n: number; b: boolean; d: Date; s: string; empty: null }>({
      format: 'json',
      sortBy: 'n',
    });

    expect(byPrimitive.rules[0]?.selector({ n: 2, b: false, d: new Date(), s: 'x', empty: null })).toBe(2);

    const byString = createParseAndSortStarterTemplate<{ value: string }>({
      format: 'json',
      sortBy: 'value',
    });
    expect(byString.rules[0]?.selector({ value: 'plain-text' })).toBe('plain-text');

    const byNull = createParseAndSortStarterTemplate<{ value: null }>({
      format: 'json',
      sortBy: 'value',
    });
    expect(byNull.rules[0]?.selector({ value: null })).toBeNull();
  });
});