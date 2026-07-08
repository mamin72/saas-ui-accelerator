import type { DateLength, DateLocaleStyle, TableColumn } from './tableComponent';

export interface CurrencyFormatterPreset {
  readonly dataType: 'currency';
  readonly currencyCode: string;
  readonly decimalPlaces: number;
}

export interface DateFormatterPreset {
  readonly dataType: 'date' | 'datetime';
  readonly dateLocale: DateLocaleStyle;
  readonly dateLength: DateLength;
  readonly temporalType: 'date' | 'datetime';
  readonly convertUtcToClientLocal?: boolean;
}

export interface TimezoneFormatterPreset {
  readonly convertUtcToClientLocal: boolean;
}

export const currencyPacks = {
  usd: createCurrencyPreset('USD', 2),
  eur: createCurrencyPreset('EUR', 2),
  gbp: createCurrencyPreset('GBP', 2),
  jpy: createCurrencyPreset('JPY', 0),
  cad: createCurrencyPreset('CAD', 2),
  aud: createCurrencyPreset('AUD', 2),
} as const;

export const localePacks = {
  us: createDateFormatterPreset('US', 'short'),
  uk: createDateFormatterPreset('UK', 'short'),
  chinese: createDateFormatterPreset('Chinese', 'short'),
} as const;

export const timezonePacks = {
  clientLocal: createTimezonePreset(true),
  utc: createTimezonePreset(false),
} as const;

export function createCurrencyPreset(currencyCode: string, decimalPlaces = 2): CurrencyFormatterPreset {
  return {
    dataType: 'currency',
    currencyCode,
    decimalPlaces,
  };
}

export function createDateFormatterPreset(
  dateLocale: DateLocaleStyle,
  dateLength: DateLength = 'short',
  options?: { readonly temporalType?: 'date' | 'datetime'; readonly convertUtcToClientLocal?: boolean }
): DateFormatterPreset {
  return {
    dataType: options?.temporalType ?? 'date',
    dateLocale,
    dateLength,
    temporalType: options?.temporalType ?? 'date',
    convertUtcToClientLocal: options?.convertUtcToClientLocal,
  };
}

export function createDateTimeFormatterPreset(
  dateLocale: DateLocaleStyle,
  dateLength: DateLength = 'short',
  options?: { readonly convertUtcToClientLocal?: boolean }
): DateFormatterPreset {
  return createDateFormatterPreset(dateLocale, dateLength, {
    temporalType: 'datetime',
    convertUtcToClientLocal: options?.convertUtcToClientLocal,
  });
}

export function createTimezonePreset(convertUtcToClientLocal: boolean): TimezoneFormatterPreset {
  return {
    convertUtcToClientLocal,
  };
}

export function applyFormatterPreset<T extends Record<string, unknown>>(
  column: TableColumn<T>,
  preset: Partial<TableColumn<T>>
): TableColumn<T> {
  return {
    ...preset,
    ...column,
  };
}