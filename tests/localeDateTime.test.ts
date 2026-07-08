import { describe, expect, it } from 'vitest';
import {
  convertDateTimeToTimeZone,
  createLocaleDateParseContract,
  createLocaleDateTimeFormatterContract,
  formatLocaleDateTime,
  parseZonedDateTime,
} from '../src/index';

describe('localeDateTime', () => {
  it('creates date-time formatter contracts with defaults and trimming', () => {
    const contract = createLocaleDateTimeFormatterContract({
      locale: ' en-US ',
      fallbackLocale: ' de-DE ',
      timeZone: ' UTC ',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    expect(contract).toEqual({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      timeZone: 'UTC',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    expect(() =>
      createLocaleDateTimeFormatterContract({
        locale: ' ',
        timeZone: 'UTC',
      })
    ).toThrow('Date formatter locale must be non-empty.');

    expect(() =>
      createLocaleDateTimeFormatterContract({
        locale: 'en-US',
        fallbackLocale: ' ',
        timeZone: 'UTC',
      })
    ).toThrow('Date formatter fallback locale must be non-empty.');

    expect(() =>
      createLocaleDateTimeFormatterContract({
        locale: 'en-US',
        timeZone: 'Invalid/Zone',
      })
    ).toThrow("Date formatter timeZone 'Invalid/Zone' is not supported.");
  });

  it('creates date parse contracts and validates timezone inputs', () => {
    const contract = createLocaleDateParseContract({
      inputTimeZone: ' UTC ',
      outputTimeZone: ' Europe/Berlin ',
      fallbackTimeZone: ' America/New_York ',
    });

    expect(contract).toEqual({
      inputTimeZone: 'UTC',
      outputTimeZone: 'Europe/Berlin',
      fallbackTimeZone: 'America/New_York',
    });

    expect(() =>
      createLocaleDateParseContract({
        inputTimeZone: ' ',
      })
    ).toThrow('Date parse inputTimeZone must be non-empty.');

    expect(() =>
      createLocaleDateParseContract({
        inputTimeZone: 'UTC',
        outputTimeZone: 'Invalid/Zone',
      })
    ).toThrow("Date parse outputTimeZone 'Invalid/Zone' is not supported.");
  });

  it('formats date-times with locale and timezone fallback behavior', () => {
    const contract = createLocaleDateTimeFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      timeZone: 'UTC',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const baseDate = new Date('2025-01-15T13:45:00.000Z');

    const directResult = formatLocaleDateTime({
      value: baseDate,
      contract,
      localeOverride: 'fr-FR',
      timeZoneOverride: 'Europe/Paris',
    });

    expect(directResult.locale).toBe('fr-FR');
    expect(directResult.timeZone).toBe('Europe/Paris');
    expect(directResult.usedFallbackLocale).toBe(false);
    expect(directResult.usedFallbackTimeZone).toBe(false);

    const fallbackResult = formatLocaleDateTime({
      value: baseDate,
      contract,
      localeOverride: 'invalid_locale',
      timeZoneOverride: 'invalid_zone',
    });

    expect(fallbackResult.locale).toBe('de-DE');
    expect(fallbackResult.timeZone).toBe('UTC');
    expect(fallbackResult.usedFallbackLocale).toBe(true);
    expect(fallbackResult.usedFallbackTimeZone).toBe(true);

    const blankOverrideResult = formatLocaleDateTime({
      value: baseDate,
      contract,
      localeOverride: ' ',
      timeZoneOverride: ' ',
    });

    expect(blankOverrideResult.locale).toBe('de-DE');
    expect(blankOverrideResult.timeZone).toBe('UTC');
  });

  it('parses zoned date-time values and reports fallback timezone usage', () => {
    expect(() =>
      createLocaleDateParseContract({
        inputTimeZone: 'Invalid/Zone',
        fallbackTimeZone: 'UTC',
      })
    ).toThrow("Date parse inputTimeZone 'Invalid/Zone' is not supported.");

    const parseContract = {
      inputTimeZone: 'Invalid/Zone',
      outputTimeZone: 'UTC',
      fallbackTimeZone: 'UTC',
    };

    const result = parseZonedDateTime({
      value: '2025-03-01T10:00:00.000Z',
      contract: parseContract,
    });

    expect(result.date.toISOString()).toBe('2025-03-01T10:00:00.000Z');
    expect(result.timeZone).toBe('UTC');
    expect(result.usedFallbackTimeZone).toBe(true);

    expect(() =>
      parseZonedDateTime({
        value: 'not-a-date',
        contract: createLocaleDateParseContract({ inputTimeZone: 'UTC' }),
      })
    ).toThrow('Date parse value must be a valid date value.');
  });

  it('converts date-time values to target timezone snapshots', () => {
    const sourceDate = '2025-04-10T12:30:15.000Z';

    const converted = convertDateTimeToTimeZone({
      value: sourceDate,
      fromTimeZone: 'UTC',
      toTimeZone: 'America/New_York',
      locale: 'en-US',
    });

    expect(converted.timeZone).toBe('America/New_York');
    expect(converted.usedFallbackTimeZone).toBe(false);
    expect(converted.date instanceof Date).toBe(true);

    const fallbackConverted = convertDateTimeToTimeZone({
      value: sourceDate,
      fromTimeZone: 'UTC',
      toTimeZone: 'Invalid/Zone',
    });

    expect(fallbackConverted.timeZone).toBe('UTC');
    expect(fallbackConverted.usedFallbackTimeZone).toBe(true);

    expect(() =>
      convertDateTimeToTimeZone({
        value: sourceDate,
        fromTimeZone: ' ',
        toTimeZone: 'UTC',
      })
    ).toThrow('Date conversion fromTimeZone must be non-empty.');

    expect(() =>
      convertDateTimeToTimeZone({
        value: 'not-a-date',
        fromTimeZone: 'UTC',
        toTimeZone: 'UTC',
      })
    ).toThrow('Date conversion value must be a valid date value.');
  });

  it('falls back to default locale and timezone when both requested and fallback are invalid', () => {
    const result = formatLocaleDateTime({
      value: '2025-04-10T12:30:15.000Z',
      contract: {
        locale: 'invalid_locale',
        fallbackLocale: 'also_invalid_locale',
        timeZone: 'UTC',
        dateStyle: 'short',
        timeStyle: 'short',
      },
      localeOverride: 'bad_locale',
      timeZoneOverride: 'bad_zone',
    });

    expect(result.locale).toBe('en-US');
    expect(result.timeZone).toBe('UTC');
    expect(result.usedFallbackLocale).toBe(true);
    expect(result.usedFallbackTimeZone).toBe(true);

    const utcFallbackResult = formatLocaleDateTime({
      value: '2025-04-10T12:30:15.000Z',
      contract: {
        locale: 'en-US',
        fallbackLocale: 'en-US',
        timeZone: 'bad_fallback_zone',
        dateStyle: 'short',
      },
      timeZoneOverride: 'bad_requested_zone',
    });

    expect(utcFallbackResult.timeZone).toBe('UTC');
    expect(utcFallbackResult.usedFallbackTimeZone).toBe(true);
  });

  it('throws when conversion cannot parse locale-formatted snapshot parts', () => {
    expect(() =>
      convertDateTimeToTimeZone({
        value: '2025-04-10T12:30:15.000Z',
        fromTimeZone: 'UTC',
        toTimeZone: 'America/New_York',
        locale: 'en-CA',
      })
    ).toThrow('Unable to parse formatted date/time value');
  });

});
