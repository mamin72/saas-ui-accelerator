import { describe, expect, it } from 'vitest';
import {
  createLocaleCurrencyFormatterContract,
  createLocaleDateParseContract,
  createLocaleDateTimeFormatterContract,
  createLocaleFilterContract,
  createLocaleTextSortContract,
  createMessageCatalog,
  createMessageFormatterContract,
  createTranslationKeyContract,
  evaluateLocaleFilterPredicate,
  formatLocaleCurrency,
  formatLocaleDateTime,
  formatLocaleNumber,
  formatMessage,
  parseZonedDateTime,
  sortByLocaleRules,
} from '../src/index';

describe('localization primitives examples', () => {
  it('formats localized messages, numbers, currency, and date-time values', () => {
    const keyContract = createTranslationKeyContract({
      key: 'billing.summary.title',
      placeholders: [{ name: 'customer', type: 'string' }],
      fallbackMessage: 'Billing summary',
    });

    const formatterContract = createMessageFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      timeZone: 'UTC',
      missingKeyPolicy: 'fallback-message',
    });

    const catalog = createMessageCatalog([
      {
        locale: 'de-DE',
        key: 'billing.summary.title',
        template: 'Abrechnung fur {customer}',
      },
    ]);

    const messageResult = formatMessage({
      contract: keyContract,
      formatter: formatterContract,
      catalog,
      localeOverride: 'fr-FR',
      values: { customer: 'Contoso' },
    });

    expect(messageResult.usedFallbackLocale).toBe(true);
    expect(messageResult.message).toContain('Contoso');

    const numberResult = formatLocaleNumber({
      value: 12345.67,
      contract: {
        locale: 'en-US',
        fallbackLocale: 'de-DE',
        useGrouping: true,
        notation: 'standard',
      },
      localeOverride: 'de-DE',
    });

    expect(numberResult.locale).toBe('de-DE');

    const currencyResult = formatLocaleCurrency({
      value: 1299.5,
      contract: createLocaleCurrencyFormatterContract({
        locale: 'en-US',
        fallbackLocale: 'de-DE',
        currency: 'EUR',
      }),
      localeOverride: 'de-DE',
    });

    expect(currencyResult.locale).toBe('de-DE');
    expect(currencyResult.formatted.length).toBeGreaterThan(0);

    const dateTimeResult = formatLocaleDateTime({
      value: '2025-04-10T12:30:15.000Z',
      contract: createLocaleDateTimeFormatterContract({
        locale: 'en-US',
        fallbackLocale: 'de-DE',
        timeZone: 'UTC',
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      localeOverride: 'de-DE',
    });

    expect(dateTimeResult.locale).toBe('de-DE');
    expect(dateTimeResult.timeZone).toBe('UTC');
  });

  it('sorts and filters localized rows and parses zoned date values', () => {
    const rows = [
      { name: 'item 10', amount: 10, placedAt: new Date('2025-01-03T00:00:00.000Z') },
      { name: 'item 2', amount: 2, placedAt: new Date('2025-01-01T00:00:00.000Z') },
      { name: 'item 1', amount: 1, placedAt: new Date('2025-01-02T00:00:00.000Z') },
    ];

    const sortedRows = sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name }],
      createLocaleTextSortContract({
        locale: 'en-US',
        numeric: true,
      })
    );

    expect(sortedRows.map((row) => row.name)).toEqual(['item 1', 'item 2', 'item 10']);

    const filterContract = createLocaleFilterContract({
      locale: 'en-US',
      fallbackLocale: 'en-US',
      timeZone: 'UTC',
    });

    const betweenMatch = evaluateLocaleFilterPredicate(
      {
        source: 8,
        operator: 'between',
        value: 5,
        valueTo: 10,
      },
      filterContract
    );

    expect(betweenMatch).toBe(true);

    const textMatch = evaluateLocaleFilterPredicate(
      {
        source: 'Billing Summary',
        operator: 'contains',
        value: 'summary',
      },
      filterContract
    );

    expect(textMatch).toBe(true);

    const dateParse = parseZonedDateTime({
      value: '2025-01-01T10:00:00.000Z',
      contract: createLocaleDateParseContract({
        inputTimeZone: 'UTC',
        outputTimeZone: 'Europe/Berlin',
      }),
    });

    expect(dateParse.timeZone).toBe('UTC');
    expect(dateParse.date.toISOString()).toBe('2025-01-01T10:00:00.000Z');
  });
});
