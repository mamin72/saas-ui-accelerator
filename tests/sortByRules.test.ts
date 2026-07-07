import { describe, expect, it } from 'vitest';
import { sortByRules } from '../src/index';

describe('sortByRules', () => {
  it('sorts by multiple keys and keeps shorter name first on prefix tie', () => {
    const rows = [
      { lastName: 'Smith', given: ['Amy', 'Rose'] },
      { lastName: 'Smith', given: ['Amy'] },
      { lastName: 'Smith', given: ['Ben'] },
      { lastName: 'Adams', given: ['Zoe'] },
    ];

    const sorted = sortByRules(rows, [
      { id: 'last', direction: 'asc', selector: (x) => x.lastName },
      { id: 'g1', direction: 'asc', selector: (x) => x.given[0] },
      { id: 'g2', direction: 'asc', selector: (x) => x.given[1] },
    ]);

    expect(sorted.map((x) => `${x.lastName}, ${x.given.join(' ')}`)).toEqual([
      'Adams, Zoe',
      'Smith, Amy',
      'Smith, Amy Rose',
      'Smith, Ben',
    ]);
  });

  it('supports descending numeric sort', () => {
    const rows = [{ score: 1 }, { score: 10 }, { score: 4 }];
    const sorted = sortByRules(rows, [{ id: 'score', direction: 'desc', selector: (x) => x.score }]);
    expect(sorted.map((x) => x.score)).toEqual([10, 4, 1]);
  });

  it('keeps input order when no rules are provided', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(sortByRules(rows, [])).toEqual(rows);
  });

  it('supports null ordering set to last', () => {
    const rows = [{ v: null as string | null }, { v: 'A' }, { v: null as string | null }, { v: 'B' }];
    const sorted = sortByRules(rows, [{ id: 'v', direction: 'asc', selector: (x) => x.v, nulls: 'last' }]);
    expect(sorted.map((x) => x.v)).toEqual(['A', 'B', null, null]);
  });

  it('supports date and boolean selectors', () => {
    const rows = [
      { at: new Date('2020-01-02T00:00:00Z'), active: true },
      { at: new Date('2020-01-01T00:00:00Z'), active: false },
      { at: new Date('2020-01-01T00:00:00Z'), active: true },
    ];

    const sorted = sortByRules(rows, [
      { id: 'at', direction: 'asc', selector: (x) => x.at },
      { id: 'active', direction: 'asc', selector: (x) => x.active },
    ]);

    expect(sorted.map((x) => `${x.at.toISOString()}:${x.active}`)).toEqual([
      '2020-01-01T00:00:00.000Z:false',
      '2020-01-01T00:00:00.000Z:true',
      '2020-01-02T00:00:00.000Z:true',
    ]);
  });

  it('falls back to string conversion for mixed comparable values', () => {
    const rows = [{ v: '10' as string | number }, { v: 2 as string | number }];
    const sorted = sortByRules(rows, [{ id: 'mixed', direction: 'asc', selector: (x) => x.v }]);
    expect(sorted.map((x) => x.v)).toEqual(['10', 2]);
  });
});
