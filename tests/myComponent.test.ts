import { describe, expect, it } from 'vitest';
import { myComponent, myComponet } from '../src/index';

describe('myComponent facade', () => {
  it('exposes SortData alias for rule sorting', () => {
    const rows = [{ name: 'B' }, { name: 'A' }];
    const sorted = myComponent.SortData(rows, [{ id: 'name', direction: 'asc', selector: (x) => x.name }]);
    expect(sorted.map((x) => x.name)).toEqual(['A', 'B']);
  });

  it('exposes SortDate compatibility alias', () => {
    const rows = [{ value: 2 }, { value: 1 }];
    const sorted = myComponent.SortDate(rows, [{ id: 'v', direction: 'asc', selector: (x) => x.value }]);
    expect(sorted.map((x) => x.value)).toEqual([1, 2]);
  });

  it('exposes SortableTable constructor', () => {
    const table = new myComponent.SortableTable({
      data: [{ name: 'A' }],
      columns: [{ key: 'name', header: 'Name', dataType: 'text' }],
    });

    expect(table.getTableRows()[0]?.cells[0]?.displayValue).toBe('A');
  });

  it('supports ParseAndSort facade', () => {
    const rows = myComponent.ParseAndSort('name\nB\nA', {
      format: 'csv',
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(rows.map((x) => x.name)).toEqual(['A', 'B']);
  });

  it('supports typo compatibility alias myComponet', () => {
    expect(myComponet.SortableTable).toBe(myComponent.SortableTable);
    expect(myComponet.SortData).toBe(myComponent.SortData);
  });
});
