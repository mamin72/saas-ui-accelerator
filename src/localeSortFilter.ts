export type LocaleSortDirection = 'asc' | 'desc';
export type LocaleFilterOperator =
  | 'contains'
  | 'startsWith'
  | 'equals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between';

export interface LocaleTextSortContract {
  locale: string;
  fallbackLocale: string;
  sensitivity: Intl.CollatorOptions['sensitivity'];
  caseFirst: Intl.CollatorOptions['caseFirst'];
  ignorePunctuation: boolean;
  numeric: boolean;
}

export interface LocaleFilterContract {
  locale: string;
  fallbackLocale: string;
  timeZone: string;
  caseSensitive: boolean;
}

export interface LocaleSortRule<T> {
  id: string;
  direction: LocaleSortDirection;
  selector: (item: T) => string | number | Date | boolean | null | undefined;
  nulls?: 'first' | 'last';
}

export interface LocaleFilterPredicateInput {
  source: string | number | Date | boolean | null | undefined;
  operator: LocaleFilterOperator;
  value?: string | number | Date | boolean;
  valueTo?: string | number | Date | boolean;
}

export function createLocaleTextSortContract(input: {
  locale: string;
  fallbackLocale?: string;
  sensitivity?: Intl.CollatorOptions['sensitivity'];
  caseFirst?: Intl.CollatorOptions['caseFirst'];
  ignorePunctuation?: boolean;
  numeric?: boolean;
}): LocaleTextSortContract {
  const locale = input.locale.trim();
  if (locale.length === 0) {
    throw new Error('Locale text sort locale must be non-empty.');
  }

  const fallbackLocale = (input.fallbackLocale ?? locale).trim();
  if (fallbackLocale.length === 0) {
    throw new Error('Locale text sort fallback locale must be non-empty.');
  }

  return {
    locale,
    fallbackLocale,
    sensitivity: input.sensitivity ?? 'variant',
    caseFirst: input.caseFirst ?? 'false',
    ignorePunctuation: input.ignorePunctuation ?? true,
    numeric: input.numeric ?? true,
  };
}

export function createLocaleFilterContract(input: {
  locale: string;
  fallbackLocale?: string;
  timeZone?: string;
  caseSensitive?: boolean;
}): LocaleFilterContract {
  const locale = input.locale.trim();
  if (locale.length === 0) {
    throw new Error('Locale filter locale must be non-empty.');
  }

  const fallbackLocale = (input.fallbackLocale ?? locale).trim();
  if (fallbackLocale.length === 0) {
    throw new Error('Locale filter fallback locale must be non-empty.');
  }

  const requestedTimeZone = (input.timeZone ?? 'UTC').trim();
  if (requestedTimeZone.length === 0) {
    throw new Error('Locale filter timeZone must be non-empty.');
  }

  if (!isTimeZoneSupported(requestedTimeZone)) {
    throw new Error(`Locale filter timeZone '${input.timeZone ?? 'UTC'}' is not supported.`);
  }

  return {
    locale,
    fallbackLocale,
    timeZone: requestedTimeZone,
    caseSensitive: input.caseSensitive ?? false,
  };
}

export function sortByLocaleRules<T>(items: readonly T[], rules: readonly LocaleSortRule<T>[], contract: LocaleTextSortContract): T[] {
  const output = [...items];
  const collator = createCollator(contract);

  output.sort((a, b) => {
    for (const rule of rules) {
      const result = compareLocaleValues(rule.selector(a), rule.selector(b), collator, rule.nulls ?? 'first');
      if (result !== 0) {
        return rule.direction === 'asc' ? result : -result;
      }
    }

    return 0;
  });

  return output;
}

export function evaluateLocaleFilterPredicate(
  input: LocaleFilterPredicateInput,
  contract: LocaleFilterContract
): boolean {
  if (input.operator === 'between') {
    return evaluateBetween(input.source, input.value, input.valueTo, contract);
  }

  if (typeof input.source === 'number') {
    return evaluateNumberFilter(input.source, input.operator, input.value);
  }

  const sourceDate = normalizeDate(input.source);
  if (sourceDate) {
    return evaluateDateFilter(sourceDate, input.operator, input.value, contract.timeZone);
  }

  return evaluateTextFilter(String(input.source ?? ''), input.operator, input.value, contract);
}

function compareLocaleValues(
  left: string | number | Date | boolean | null | undefined,
  right: string | number | Date | boolean | null | undefined,
  collator: Intl.Collator,
  nulls: 'first' | 'last'
): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return nulls === 'first' ? -1 : 1;
  }

  if (right == null) {
    return nulls === 'first' ? 1 : -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  return collator.compare(String(left), String(right));
}

function evaluateTextFilter(
  source: string,
  operator: LocaleFilterOperator,
  value: LocaleFilterPredicateInput['value'],
  contract: LocaleFilterContract
): boolean {
  const normalizedSource = contract.caseSensitive ? source : source.toLocaleLowerCase(contract.locale);
  const normalizedValue = contract.caseSensitive
    ? String(value ?? '')
    : String(value ?? '').toLocaleLowerCase(contract.locale);

  switch (operator) {
    case 'contains':
      return normalizedSource.includes(normalizedValue);
    case 'startsWith':
      return normalizedSource.startsWith(normalizedValue);
    case 'equals':
      return normalizedSource === normalizedValue;
    case 'gt':
      return normalizedSource.localeCompare(normalizedValue, contract.locale) > 0;
    case 'gte':
      return normalizedSource.localeCompare(normalizedValue, contract.locale) >= 0;
    case 'lt':
      return normalizedSource.localeCompare(normalizedValue, contract.locale) < 0;
    case 'lte':
      return normalizedSource.localeCompare(normalizedValue, contract.locale) <= 0;
    default:
      return false;
  }
}

function evaluateNumberFilter(
  source: number,
  operator: LocaleFilterOperator,
  value: LocaleFilterPredicateInput['value']
): boolean {
  const target = Number(value);
  if (Number.isNaN(target)) {
    return false;
  }

  switch (operator) {
    case 'equals':
      return source === target;
    case 'gt':
      return source > target;
    case 'gte':
      return source >= target;
    case 'lt':
      return source < target;
    case 'lte':
      return source <= target;
    default:
      return false;
  }
}

function evaluateDateFilter(
  source: Date,
  operator: LocaleFilterOperator,
  value: LocaleFilterPredicateInput['value'],
  timeZone: string
): boolean {
  const targetDate = normalizeDate(value);
  if (!targetDate) {
    return false;
  }

  const sourceValue = toZonedEpoch(source, timeZone);
  const targetValue = toZonedEpoch(targetDate, timeZone);

  switch (operator) {
    case 'equals':
      return sourceValue === targetValue;
    case 'gt':
      return sourceValue > targetValue;
    case 'gte':
      return sourceValue >= targetValue;
    case 'lt':
      return sourceValue < targetValue;
    case 'lte':
      return sourceValue <= targetValue;
    default:
      return false;
  }
}

function evaluateBetween(
  source: LocaleFilterPredicateInput['source'],
  value: LocaleFilterPredicateInput['value'],
  valueTo: LocaleFilterPredicateInput['valueTo'],
  contract: LocaleFilterContract
): boolean {
  const lowerNumber = Number(value);
  const upperNumber = Number(valueTo);

  if (
    typeof source === 'number' &&
    !Number.isNaN(lowerNumber) &&
    !Number.isNaN(upperNumber)
  ) {
    return source >= lowerNumber && source <= upperNumber;
  }

  const sourceDate = normalizeDate(source);
  const lowerDate = normalizeDate(value);
  const upperDate = normalizeDate(valueTo);

  if (sourceDate && lowerDate && upperDate) {
    const sourceValue = toZonedEpoch(sourceDate, contract.timeZone);
    const lowerValue = toZonedEpoch(lowerDate, contract.timeZone);
    const upperValue = toZonedEpoch(upperDate, contract.timeZone);

    return sourceValue >= lowerValue && sourceValue <= upperValue;
  }

  const sourceText = contract.caseSensitive
    ? String(source ?? '')
    : String(source ?? '').toLocaleLowerCase(contract.locale);
  const lowerText = contract.caseSensitive
    ? String(value ?? '')
    : String(value ?? '').toLocaleLowerCase(contract.locale);
  const upperText = contract.caseSensitive
    ? String(valueTo ?? '')
    : String(valueTo ?? '').toLocaleLowerCase(contract.locale);

  return (
    sourceText.localeCompare(lowerText, contract.locale) >= 0 &&
    sourceText.localeCompare(upperText, contract.locale) <= 0
  );
}

function normalizeDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

function createCollator(contract: LocaleTextSortContract): Intl.Collator {
  const locale = resolveLocale(contract.locale, contract.fallbackLocale);

  return new Intl.Collator(locale, {
    sensitivity: contract.sensitivity,
    caseFirst: contract.caseFirst,
    ignorePunctuation: contract.ignorePunctuation,
    numeric: contract.numeric,
  });
}

function resolveLocale(requestedLocale: string, fallbackLocale: string): string {
  if (isLocaleSupported(requestedLocale)) {
    return requestedLocale;
  }

  if (isLocaleSupported(fallbackLocale)) {
    return fallbackLocale;
  }

  return 'en-US';
}

function isLocaleSupported(locale: string): boolean {
  const normalized = locale.trim();
  if (normalized.length === 0) {
    return false;
  }

  try {
    return Intl.Collator.supportedLocalesOf([normalized]).length > 0;
  } catch {
    return false;
  }
}

function isTimeZoneSupported(timeZone: string): boolean {
  const normalized = timeZone.trim();
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date('2025-01-01T00:00:00.000Z'));
    return true;
  } catch {
    return false;
  }
}

function toZonedEpoch(date: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);

  const normalized = formatted.replace(',', '').trim();
  const [datePart = '', timePart = ''] = normalized.split(' ');
  const [month = '0', day = '0', year = '0'] = datePart.split('/');
  const [hour = '0', minute = '0', second = '0'] = timePart.split(':');

  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}
