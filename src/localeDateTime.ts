export interface LocaleDateTimeFormatterContract {
  locale: string;
  fallbackLocale: string;
  timeZone: string;
  dateStyle: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
}

export interface LocaleDateParseContract {
  inputTimeZone: string;
  outputTimeZone: string;
  fallbackTimeZone: string;
}

export interface LocalizedDateTimeResult {
  formatted: string;
  locale: string;
  timeZone: string;
  usedFallbackLocale: boolean;
  usedFallbackTimeZone: boolean;
}

export interface ParsedZonedDateTimeResult {
  date: Date;
  timeZone: string;
  usedFallbackTimeZone: boolean;
}

export function createLocaleDateTimeFormatterContract(input: {
  locale: string;
  fallbackLocale?: string;
  timeZone: string;
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
}): LocaleDateTimeFormatterContract {
  const locale = input.locale.trim();
  if (locale.length === 0) {
    throw new Error('Date formatter locale must be non-empty.');
  }

  const fallbackLocale = (input.fallbackLocale ?? locale).trim();
  if (fallbackLocale.length === 0) {
    throw new Error('Date formatter fallback locale must be non-empty.');
  }

  const timeZone = normalizeTimeZoneOrThrow(input.timeZone, 'Date formatter timeZone');

  return {
    locale,
    fallbackLocale,
    timeZone,
    dateStyle: input.dateStyle ?? 'medium',
    timeStyle: input.timeStyle,
  };
}

export function createLocaleDateParseContract(input: {
  inputTimeZone: string;
  outputTimeZone?: string;
  fallbackTimeZone?: string;
}): LocaleDateParseContract {
  const inputTimeZone = normalizeTimeZoneOrThrow(input.inputTimeZone, 'Date parse inputTimeZone');
  const outputTimeZone = normalizeTimeZoneOrThrow(input.outputTimeZone ?? input.inputTimeZone, 'Date parse outputTimeZone');
  const fallbackTimeZone = normalizeTimeZoneOrThrow(
    input.fallbackTimeZone ?? outputTimeZone,
    'Date parse fallbackTimeZone'
  );

  return {
    inputTimeZone,
    outputTimeZone,
    fallbackTimeZone,
  };
}

export function formatLocaleDateTime(input: {
  value: Date | string | number;
  contract: LocaleDateTimeFormatterContract;
  localeOverride?: string;
  timeZoneOverride?: string;
}): LocalizedDateTimeResult {
  const dateValue = normalizeDateOrThrow(input.value, 'Date formatter value');

  const requestedLocale = input.localeOverride === undefined ? input.contract.locale : input.localeOverride.trim();
  const localeResolution = resolveLocale(requestedLocale, input.contract.fallbackLocale);

  const requestedTimeZone =
    input.timeZoneOverride === undefined ? input.contract.timeZone : input.timeZoneOverride.trim();
  const timeZoneResolution = resolveTimeZone(requestedTimeZone, input.contract.timeZone);

  const formatter = new Intl.DateTimeFormat(localeResolution.locale, {
    timeZone: timeZoneResolution.timeZone,
    dateStyle: input.contract.dateStyle,
    timeStyle: input.contract.timeStyle,
  });

  return {
    formatted: formatter.format(dateValue),
    locale: localeResolution.locale,
    timeZone: timeZoneResolution.timeZone,
    usedFallbackLocale: localeResolution.usedFallbackLocale,
    usedFallbackTimeZone: timeZoneResolution.usedFallbackTimeZone,
  };
}

export function parseZonedDateTime(input: {
  value: string | Date | number;
  contract: LocaleDateParseContract;
}): ParsedZonedDateTimeResult {
  const parsed = normalizeDateOrThrow(input.value, 'Date parse value');
  const sourceResolution = resolveTimeZone(input.contract.inputTimeZone, input.contract.fallbackTimeZone);

  return {
    date: parsed,
    timeZone: sourceResolution.timeZone,
    usedFallbackTimeZone: sourceResolution.usedFallbackTimeZone,
  };
}

export function convertDateTimeToTimeZone(input: {
  value: Date | string | number;
  fromTimeZone: string;
  toTimeZone: string;
  locale?: string;
}): ParsedZonedDateTimeResult {
  const parsed = normalizeDateOrThrow(input.value, 'Date conversion value');
  const fromTimeZone = normalizeTimeZoneOrThrow(input.fromTimeZone, 'Date conversion fromTimeZone');
  const toTimeZoneResolution = resolveTimeZone(input.toTimeZone, fromTimeZone);

  const formatted = new Intl.DateTimeFormat(input.locale?.trim() || 'en-US', {
    timeZone: toTimeZoneResolution.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(parsed);

  const [month, day, year, hour, minute, second] = extractDateParts(formatted);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  return {
    date: utcDate,
    timeZone: toTimeZoneResolution.timeZone,
    usedFallbackTimeZone: toTimeZoneResolution.usedFallbackTimeZone,
  };
}

function extractDateParts(formatted: string): [number, number, number, number, number, number] {
  const normalized = formatted.replace(',', '').replace(/\s+/g, ' ').trim();
  const [datePart = '', timePart = ''] = normalized.split(' ');

  const dateTokens = datePart.split('/').map((token) => Number(token));
  const timeTokens = timePart.split(':').map((token) => Number(token));

  if (dateTokens.length !== 3 || timeTokens.length !== 3 || [...dateTokens, ...timeTokens].some((token) => Number.isNaN(token))) {
    throw new Error(`Unable to parse formatted date/time value '${formatted}'.`);
  }

  const [month, day, year] = dateTokens;
  const [hour, minute, second] = timeTokens;

  return [month, day, year, hour, minute, second];
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

function resolveTimeZone(
  requestedTimeZone: string,
  fallbackTimeZone: string
): {
  timeZone: string;
  usedFallbackTimeZone: boolean;
} {
  if (isTimeZoneSupported(requestedTimeZone)) {
    return {
      timeZone: requestedTimeZone,
      usedFallbackTimeZone: false,
    };
  }

  if (isTimeZoneSupported(fallbackTimeZone)) {
    return {
      timeZone: fallbackTimeZone,
      usedFallbackTimeZone: true,
    };
  }

  return {
    timeZone: 'UTC',
    usedFallbackTimeZone: true,
  };
}

function normalizeDateOrThrow(value: Date | string | number, label: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date value.`);
  }

  return date;
}

function normalizeTimeZoneOrThrow(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${label} must be non-empty.`);
  }

  if (!isTimeZoneSupported(normalized)) {
    throw new Error(`${label} '${value}' is not supported.`);
  }

  return normalized;
}

function isLocaleSupported(locale: string): boolean {
  const normalized = locale.trim();
  if (normalized.length === 0) {
    return false;
  }

  try {
    return Intl.DateTimeFormat.supportedLocalesOf([normalized]).length > 0;
  } catch {
    return false;
  }
}

function isTimeZoneSupported(timeZone: string): boolean {
  const normalized = timeZone.trim();
  if (normalized.length === 0) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date('2025-01-01T00:00:00.000Z'));
    return true;
  } catch {
    return false;
  }
}
