export type LocaleNumberNotation = 'standard' | 'scientific' | 'engineering' | 'compact';

export interface LocaleNumberFormatterContract {
  locale: string;
  fallbackLocale: string;
  useGrouping: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation: LocaleNumberNotation;
}

export interface LocaleCurrencyFormatterContract {
  locale: string;
  fallbackLocale: string;
  currency: string;
  currencyDisplay: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  currencySign: 'standard' | 'accounting';
  useGrouping: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface LocalizedFormatResult {
  formatted: string;
  locale: string;
  usedFallbackLocale: boolean;
}

export function createLocaleNumberFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  useGrouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: LocaleNumberNotation;
}): LocaleNumberFormatterContract {
  const locale = input.locale.trim();
  if (locale.length === 0) {
    throw new Error('Number formatter locale must be non-empty.');
  }

  const fallbackLocale = (input.fallbackLocale ?? locale).trim();
  if (fallbackLocale.length === 0) {
    throw new Error('Number formatter fallback locale must be non-empty.');
  }

  const minimumFractionDigits = normalizeFractionDigits(input.minimumFractionDigits, 'minimum');
  const maximumFractionDigits = normalizeFractionDigits(input.maximumFractionDigits, 'maximum');

  if (
    minimumFractionDigits !== undefined &&
    maximumFractionDigits !== undefined &&
    minimumFractionDigits > maximumFractionDigits
  ) {
    throw new Error('Number formatter minimumFractionDigits cannot be greater than maximumFractionDigits.');
  }

  return {
    locale,
    fallbackLocale,
    useGrouping: input.useGrouping ?? true,
    minimumFractionDigits,
    maximumFractionDigits,
    notation: input.notation ?? 'standard',
  };
}

export function createLocaleCurrencyFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  currency: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  currencySign?: 'standard' | 'accounting';
  useGrouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): LocaleCurrencyFormatterContract {
  const locale = input.locale.trim();
  if (locale.length === 0) {
    throw new Error('Currency formatter locale must be non-empty.');
  }

  const fallbackLocale = (input.fallbackLocale ?? locale).trim();
  if (fallbackLocale.length === 0) {
    throw new Error('Currency formatter fallback locale must be non-empty.');
  }

  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Currency code '${input.currency}' must be a valid ISO-4217 alpha code.`);
  }

  const minimumFractionDigits = normalizeFractionDigits(input.minimumFractionDigits, 'minimum');
  const maximumFractionDigits = normalizeFractionDigits(input.maximumFractionDigits, 'maximum');

  if (
    minimumFractionDigits !== undefined &&
    maximumFractionDigits !== undefined &&
    minimumFractionDigits > maximumFractionDigits
  ) {
    throw new Error('Currency formatter minimumFractionDigits cannot be greater than maximumFractionDigits.');
  }

  return {
    locale,
    fallbackLocale,
    currency,
    currencyDisplay: input.currencyDisplay ?? 'symbol',
    currencySign: input.currencySign ?? 'standard',
    useGrouping: input.useGrouping ?? true,
    minimumFractionDigits,
    maximumFractionDigits,
  };
}

export function formatLocaleNumber(input: {
  value: number;
  contract: LocaleNumberFormatterContract;
  localeOverride?: string;
}): LocalizedFormatResult {
  ensureFiniteNumber(input.value, 'Number formatter value');

  const requestedLocale = input.localeOverride === undefined ? input.contract.locale : input.localeOverride.trim();
  const localeResolution = resolveLocale(requestedLocale, input.contract.fallbackLocale);

  const formatter = new Intl.NumberFormat(localeResolution.locale, {
    useGrouping: input.contract.useGrouping,
    minimumFractionDigits: input.contract.minimumFractionDigits,
    maximumFractionDigits: input.contract.maximumFractionDigits,
    notation: input.contract.notation,
  });

  return {
    formatted: formatter.format(input.value),
    locale: localeResolution.locale,
    usedFallbackLocale: localeResolution.usedFallbackLocale,
  };
}

export function formatLocaleCurrency(input: {
  value: number;
  contract: LocaleCurrencyFormatterContract;
  localeOverride?: string;
}): LocalizedFormatResult {
  ensureFiniteNumber(input.value, 'Currency formatter value');

  const requestedLocale = input.localeOverride === undefined ? input.contract.locale : input.localeOverride.trim();
  const localeResolution = resolveLocale(requestedLocale, input.contract.fallbackLocale);

  const formatter = new Intl.NumberFormat(localeResolution.locale, {
    style: 'currency',
    currency: input.contract.currency,
    currencyDisplay: input.contract.currencyDisplay,
    currencySign: input.contract.currencySign,
    useGrouping: input.contract.useGrouping,
    minimumFractionDigits: input.contract.minimumFractionDigits,
    maximumFractionDigits: input.contract.maximumFractionDigits,
  });

  return {
    formatted: formatter.format(input.value),
    locale: localeResolution.locale,
    usedFallbackLocale: localeResolution.usedFallbackLocale,
  };
}

function normalizeFractionDigits(
  value: number | undefined,
  label: 'minimum' | 'maximum'
): number | undefined {
  if (value == null) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label}FractionDigits must be a non-negative integer.`);
  }

  return value;
}

function resolveLocale(
  requestedLocale: string,
  fallbackLocale: string
): {
  locale: string;
  usedFallbackLocale: boolean;
} {
  if (isLocaleSupported(requestedLocale)) {
    return {
      locale: requestedLocale,
      usedFallbackLocale: false,
    };
  }

  if (isLocaleSupported(fallbackLocale)) {
    return {
      locale: fallbackLocale,
      usedFallbackLocale: true,
    };
  }

  return {
    locale: 'en-US',
    usedFallbackLocale: true,
  };
}

function isLocaleSupported(locale: string): boolean {
  const normalized = locale.trim();
  if (normalized.length === 0) {
    return false;
  }

  try {
    return Intl.NumberFormat.supportedLocalesOf([normalized]).length > 0;
  } catch {
    return false;
  }
}

function ensureFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}
