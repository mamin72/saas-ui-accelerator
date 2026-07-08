import { describe, expect, it } from 'vitest';
import {
  applyFormatterPreset,
  createCurrencyPreset,
  createDateFormatterPreset,
  createDateTimeFormatterPreset,
  currencyPacks,
  localePacks,
  timezonePacks,
} from '../src/index';
import type { TableColumn } from '../src/tableComponent';

describe('formatterPresets', () => {
  it('exposes common currency, locale, and timezone packs', () => {
    expect(currencyPacks.usd).toEqual({ dataType: 'currency', currencyCode: 'USD', decimalPlaces: 2 });
    expect(localePacks.uk).toEqual({ dataType: 'date', dateLocale: 'UK', dateLength: 'short', temporalType: 'date', convertUtcToClientLocal: undefined });
    expect(timezonePacks.utc).toEqual({ convertUtcToClientLocal: false });
  });

  it('creates reusable currency and date presets', () => {
    expect(createCurrencyPreset('CHF', 3)).toEqual({ dataType: 'currency', currencyCode: 'CHF', decimalPlaces: 3 });
    expect(createDateFormatterPreset('Chinese', 'long')).toEqual({
      dataType: 'date',
      dateLocale: 'Chinese',
      dateLength: 'long',
      temporalType: 'date',
      convertUtcToClientLocal: undefined,
    });
    expect(createDateTimeFormatterPreset('US', 'short', { convertUtcToClientLocal: false })).toEqual({
      dataType: 'datetime',
      dateLocale: 'US',
      dateLength: 'short',
      temporalType: 'datetime',
      convertUtcToClientLocal: false,
    });
  });

  it('applies presets while preserving explicit column fields', () => {
    const baseColumn: TableColumn<{ amount: number }> = {
      key: 'amount',
      header: 'Amount',
      dataType: 'number',
    };

    const merged = applyFormatterPreset(baseColumn, createCurrencyPreset('EUR', 2));

    expect(merged).toEqual({
      key: 'amount',
      header: 'Amount',
      dataType: 'number',
      currencyCode: 'EUR',
      decimalPlaces: 2,
    });
  });
});