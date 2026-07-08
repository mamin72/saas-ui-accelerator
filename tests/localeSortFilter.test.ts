import { describe, expect, it } from 'vitest';
import {
  createLocaleFilterContract,
  createLocaleTextSortContract,
  evaluateLocaleFilterPredicate,
  sortByLocaleRules,
} from '../src/index';

describe('localeSortFilter', () => {
  it('creates locale text sort contracts with defaults and validation', () => {
    const contract = createLocaleTextSortContract({
      locale: ' de-DE ',
      fallbackLocale: ' en-US ',
      sensitivity: 'base',
      caseFirst: 'upper',
      ignorePunctuation: false,
      numeric: false,
    });

    expect(contract).toEqual({
      locale: 'de-DE',
      fallbackLocale: 'en-US',
      sensitivity: 'base',
      caseFirst: 'upper',
      ignorePunctuation: false,
      numeric: false,
    });

    expect(() => createLocaleTextSortContract({ locale: ' ' })).toThrow(
      'Locale text sort locale must be non-empty.'
    );

    expect(() =>
      createLocaleTextSortContract({
        locale: 'en-US',
        fallbackLocale: ' ',
      })
    ).toThrow('Locale text sort fallback locale must be non-empty.');
  });

  it('sorts rows with locale-aware text collation and mixed data types', () => {
    const rows = [
      { name: 'item 10', score: 1, active: true, placedAt: new Date('2025-01-03T00:00:00.000Z') },
      { name: 'item 2', score: 10, active: false, placedAt: new Date('2025-01-01T00:00:00.000Z') },
      { name: 'item 1', score: 5, active: true, placedAt: new Date('2025-01-02T00:00:00.000Z') },
      { name: null as string | null, score: 0, active: false, placedAt: new Date('2025-01-04T00:00:00.000Z') },
    ];

    const sortedByName = sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name, nulls: 'last' }],
      createLocaleTextSortContract({ locale: 'en-US', numeric: true })
    );

    expect(sortedByName.map((row) => row.name)).toEqual(['item 1', 'item 2', 'item 10', null]);

    const sortedByScoreDesc = sortByLocaleRules(
      rows,
      [{ id: 'score', direction: 'desc', selector: (row) => row.score }],
      createLocaleTextSortContract({ locale: 'en-US' })
    );

    expect(sortedByScoreDesc.map((row) => row.score)).toEqual([10, 5, 1, 0]);

    const sortedByDate = sortByLocaleRules(
      rows,
      [{ id: 'date', direction: 'asc', selector: (row) => row.placedAt }],
      createLocaleTextSortContract({ locale: 'en-US' })
    );

    expect(sortedByDate.map((row) => row.placedAt.toISOString())).toEqual([
      '2025-01-01T00:00:00.000Z',
      '2025-01-02T00:00:00.000Z',
      '2025-01-03T00:00:00.000Z',
      '2025-01-04T00:00:00.000Z',
    ]);

    const sortedByBoolean = sortByLocaleRules(
      rows,
      [{ id: 'active', direction: 'asc', selector: (row) => row.active }],
      createLocaleTextSortContract({ locale: 'en-US' })
    );

    expect(sortedByBoolean.map((row) => row.active)).toEqual([false, false, true, true]);

    const fallbackLocaleSorted = sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name, nulls: 'last' }],
      {
        ...createLocaleTextSortContract({ locale: 'en-US' }),
        locale: 'invalid_locale',
        fallbackLocale: 'also_invalid_locale',
      }
    );

    expect(fallbackLocaleSorted.map((row) => row.name)).toEqual(['item 1', 'item 2', 'item 10', null]);

    const nullsFirstSorted = sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name }],
      createLocaleTextSortContract({ locale: 'en-US' })
    );

    expect(nullsFirstSorted[0]?.name).toBeNull();

    const fallbackToSupportedLocale = sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name, nulls: 'last' }],
      {
        ...createLocaleTextSortContract({ locale: 'en-US' }),
        locale: 'invalid_locale',
        fallbackLocale: 'de-DE',
      }
    );

    expect(fallbackToSupportedLocale.map((row) => row.name)).toEqual(['item 1', 'item 2', 'item 10', null]);

    const bothNullRows = [{ name: null as string | null }, { name: null as string | null }];
    const bothNullSorted = sortByLocaleRules(
      bothNullRows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name, nulls: 'last' }],
      createLocaleTextSortContract({ locale: 'en-US' })
    );
    expect(bothNullSorted).toEqual(bothNullRows);

    const rightNullLastRows = [{ name: null as string | null }, { name: 'alpha' }];
    const rightNullLastSorted = sortByLocaleRules(
      rightNullLastRows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name, nulls: 'last' }],
      createLocaleTextSortContract({ locale: 'en-US' })
    );
    expect(rightNullLastSorted.map((row) => row.name)).toEqual(['alpha', null]);

    const blankLocaleFallbackSorted = sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name, nulls: 'last' }],
      {
        ...createLocaleTextSortContract({ locale: 'en-US' }),
        locale: '   ',
        fallbackLocale: 'en-US',
      }
    );

    expect(blankLocaleFallbackSorted.map((row) => row.name)).toEqual(['item 1', 'item 2', 'item 10', null]);
  });

  it('creates locale filter contracts with timezone validation', () => {
    const contract = createLocaleFilterContract({
      locale: ' tr-TR ',
      fallbackLocale: ' en-US ',
      timeZone: ' Europe/Istanbul ',
      caseSensitive: true,
    });

    expect(contract).toEqual({
      locale: 'tr-TR',
      fallbackLocale: 'en-US',
      timeZone: 'Europe/Istanbul',
      caseSensitive: true,
    });

    expect(() => createLocaleFilterContract({ locale: ' ' })).toThrow('Locale filter locale must be non-empty.');

    expect(() =>
      createLocaleFilterContract({
        locale: 'en-US',
        fallbackLocale: ' ',
      })
    ).toThrow('Locale filter fallback locale must be non-empty.');

    expect(() =>
      createLocaleFilterContract({
        locale: 'en-US',
        timeZone: ' ',
      })
    ).toThrow('Locale filter timeZone must be non-empty.');

    expect(() =>
      createLocaleFilterContract({
        locale: 'en-US',
        timeZone: 'Invalid/Zone',
      })
    ).toThrow("Locale filter timeZone 'Invalid/Zone' is not supported.");
  });

  it('evaluates text filter predicates with locale and case options', () => {
    const insensitiveContract = createLocaleFilterContract({
      locale: 'en-US',
      caseSensitive: false,
    });

    expect(
      evaluateLocaleFilterPredicate({
        source: 'Straße',
        operator: 'contains',
        value: 'STR',
      }, insensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'startsWith',
        value: 'de',
      }, insensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'equals',
        value: 'DELTA',
      }, insensitiveContract)
    ).toBe(true);

    const sensitiveContract = createLocaleFilterContract({
      locale: 'en-US',
      caseSensitive: true,
    });

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'equals',
        value: 'DELTA',
      }, sensitiveContract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'gt',
        value: 'alpha',
      }, sensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'between',
        value: 'beta',
        valueTo: 'echo',
      }, sensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'gte',
        value: 'delta',
      }, sensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'lt',
        value: 'echo',
      }, sensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'lte',
        value: 'delta',
      }, sensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'between',
      }, sensitiveContract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: null,
        operator: 'between',
        value: null,
        valueTo: null,
      }, insensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: null,
        operator: 'between',
        value: null,
        valueTo: null,
      }, sensitiveContract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'unknown' as unknown as 'contains',
        value: 'delta',
      }, sensitiveContract)
    ).toBe(false);
  });

  it('evaluates number and date filter predicates with between and comparisons', () => {
    const contract = createLocaleFilterContract({
      locale: 'en-US',
      timeZone: 'UTC',
    });

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'equals',
        value: 10,
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'gt',
        value: 5,
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'gte',
        value: 10,
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'lt',
        value: 11,
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'lte',
        value: 10,
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'between',
        value: 8,
        valueTo: 12,
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'between',
        value: 'bad',
        valueTo: 12,
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'contains',
        value: 1,
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: 10,
        operator: 'equals',
        value: Number.NaN,
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'equals',
        value: new Date('2025-02-02T12:00:00.000Z'),
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'gt',
        value: new Date('2025-02-01T12:00:00.000Z'),
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'gt',
        value: 'invalid-date',
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'gte',
        value: new Date('2025-02-02T12:00:00.000Z'),
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'lt',
        value: new Date('2025-02-03T12:00:00.000Z'),
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'lte',
        value: new Date('2025-02-02T12:00:00.000Z'),
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'between',
        value: new Date('2025-02-01T00:00:00.000Z'),
        valueTo: new Date('2025-02-03T00:00:00.000Z'),
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'between',
        value: 'invalid-date',
        valueTo: new Date('2025-02-03T00:00:00.000Z'),
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('2025-02-02T12:00:00.000Z'),
        operator: 'contains',
        value: new Date('2025-02-03T00:00:00.000Z'),
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'alpha',
        operator: 'gt',
        value: 'delta',
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: '10',
        operator: 'between',
        value: 2,
        valueTo: 20,
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: 'delta',
        operator: 'between',
        value: 'alpha',
        valueTo: 'omega',
      }, contract)
    ).toBe(true);

    expect(
      evaluateLocaleFilterPredicate({
        source: new Date('invalid-date'),
        operator: 'equals',
        value: 'anything',
      }, contract)
    ).toBe(false);

    expect(
      evaluateLocaleFilterPredicate({
        source: { nested: true } as unknown as string,
        operator: 'contains',
        value: 'object',
      }, contract)
    ).toBe(true);
  });
});
