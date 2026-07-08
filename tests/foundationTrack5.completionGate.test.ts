import { describe, expect, it } from 'vitest';
import * as foundation from '../src/index';

describe('foundation track 5 completion gate', () => {
  it('exposes all expected public APIs for chunk 1 through chunk 4 deliverables', () => {
    expect(typeof foundation.createTranslationKeyContract).toBe('function');
    expect(typeof foundation.createMessageFormatterContract).toBe('function');
    expect(typeof foundation.createMessageCatalog).toBe('function');
    expect(typeof foundation.formatMessage).toBe('function');

    expect(typeof foundation.createLocaleNumberFormatterContract).toBe('function');
    expect(typeof foundation.createLocaleCurrencyFormatterContract).toBe('function');
    expect(typeof foundation.formatLocaleNumber).toBe('function');
    expect(typeof foundation.formatLocaleCurrency).toBe('function');

    expect(typeof foundation.createLocaleDateTimeFormatterContract).toBe('function');
    expect(typeof foundation.createLocaleDateParseContract).toBe('function');
    expect(typeof foundation.formatLocaleDateTime).toBe('function');
    expect(typeof foundation.parseZonedDateTime).toBe('function');
    expect(typeof foundation.convertDateTimeToTimeZone).toBe('function');

    expect(typeof foundation.createLocaleTextSortContract).toBe('function');
    expect(typeof foundation.createLocaleFilterContract).toBe('function');
    expect(typeof foundation.sortByLocaleRules).toBe('function');
    expect(typeof foundation.evaluateLocaleFilterPredicate).toBe('function');
  });

  it('validates integrated localization workflow across message, formatting, date, sort, and filter primitives', () => {
    const keyContract = foundation.createTranslationKeyContract({
      key: 'billing.summary.title',
      placeholders: [{ name: 'customer', type: 'string' }],
      fallbackMessage: 'Billing Summary',
    });

    const messageFormatter = foundation.createMessageFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      timeZone: 'UTC',
      missingKeyPolicy: 'fallback-message',
    });

    const catalog = foundation.createMessageCatalog([
      {
        locale: 'de-DE',
        key: 'billing.summary.title',
        template: 'Abrechnung fur {customer}',
      },
    ]);

    const messageResult = foundation.formatMessage({
      contract: keyContract,
      formatter: messageFormatter,
      catalog,
      localeOverride: 'fr-FR',
      values: { customer: 'Contoso' },
    });

    expect(messageResult.usedFallbackLocale).toBe(true);
    expect(messageResult.message).toContain('Contoso');

    const numberResult = foundation.formatLocaleNumber({
      value: 12345.67,
      contract: foundation.createLocaleNumberFormatterContract({
        locale: 'en-US',
        fallbackLocale: 'de-DE',
        notation: 'standard',
      }),
      localeOverride: 'de-DE',
    });

    expect(numberResult.locale).toBe('de-DE');
    expect(numberResult.formatted.length).toBeGreaterThan(0);

    const currencyResult = foundation.formatLocaleCurrency({
      value: 1299.5,
      contract: foundation.createLocaleCurrencyFormatterContract({
        locale: 'en-US',
        fallbackLocale: 'de-DE',
        currency: 'EUR',
      }),
      localeOverride: 'de-DE',
    });

    expect(currencyResult.locale).toBe('de-DE');
    expect(currencyResult.formatted.length).toBeGreaterThan(0);

    const dateContract = foundation.createLocaleDateTimeFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      timeZone: 'UTC',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const dateResult = foundation.formatLocaleDateTime({
      value: '2025-04-10T12:30:15.000Z',
      contract: dateContract,
      localeOverride: 'de-DE',
      timeZoneOverride: 'UTC',
    });

    expect(dateResult.locale).toBe('de-DE');
    expect(dateResult.timeZone).toBe('UTC');

    const parsedDate = foundation.parseZonedDateTime({
      value: '2025-01-01T10:00:00.000Z',
      contract: foundation.createLocaleDateParseContract({
        inputTimeZone: 'UTC',
        outputTimeZone: 'Europe/Berlin',
      }),
    });

    expect(parsedDate.timeZone).toBe('UTC');
    expect(parsedDate.date.toISOString()).toBe('2025-01-01T10:00:00.000Z');

    const convertedDate = foundation.convertDateTimeToTimeZone({
      value: '2025-04-10T12:30:15.000Z',
      fromTimeZone: 'UTC',
      toTimeZone: 'America/New_York',
      locale: 'en-US',
    });

    expect(convertedDate.timeZone).toBe('America/New_York');

    const rows = [
      { name: 'item 10', amount: 10 },
      { name: 'item 2', amount: 2 },
      { name: 'item 1', amount: 1 },
    ];

    const sortedRows = foundation.sortByLocaleRules(
      rows,
      [{ id: 'name', direction: 'asc', selector: (row) => row.name }],
      foundation.createLocaleTextSortContract({ locale: 'en-US', numeric: true })
    );

    expect(sortedRows.map((row) => row.name)).toEqual(['item 1', 'item 2', 'item 10']);

    const filterContract = foundation.createLocaleFilterContract({
      locale: 'en-US',
      fallbackLocale: 'en-US',
      timeZone: 'UTC',
    });

    const amountInRange = foundation.evaluateLocaleFilterPredicate(
      {
        source: 8,
        operator: 'between',
        value: 5,
        valueTo: 10,
      },
      filterContract
    );

    const textContains = foundation.evaluateLocaleFilterPredicate(
      {
        source: 'Billing Summary',
        operator: 'contains',
        value: 'summary',
      },
      filterContract
    );

    expect(amountInRange).toBe(true);
    expect(textContains).toBe(true);
  });
});
