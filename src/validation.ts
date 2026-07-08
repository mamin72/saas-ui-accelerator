import type { TableColumn, TableRowKey } from './tableComponent';

export function assertCsvDelimiter(delimiter: string): void {
  if (delimiter.length !== 1) {
    throw new Error(`CSV delimiter must be exactly one character. Received '${delimiter}'.`);
  }
}

export function assertCurrencyCode(code: string): void {
  const normalized = code.toUpperCase();

  const intlWithSupportedValues = Intl as Intl.DateTimeFormatOptions & {
    supportedValuesOf?: (key: string) => string[];
  };

  if (typeof intlWithSupportedValues.supportedValuesOf === 'function') {
    const supported = intlWithSupportedValues.supportedValuesOf('currency');
    if (!supported.includes(normalized)) {
      throw new Error(`Invalid currency code '${code}'. Use a valid ISO 4217 code.`);
    }
    return;
  }

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalized,
    });
    formatter.format(1);

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new Error('Invalid ISO currency code pattern.');
    }
  } catch {
    throw new Error(`Invalid currency code '${code}'. Use a valid ISO 4217 code.`);
  }
}

export function assertTableColumnConfig<T extends Record<string, unknown>>(column: TableColumn<T>): void {
  if (typeof column.key !== 'string' || column.key.trim().length === 0) {
    throw new Error('Column key must be a non-empty string.');
  }

  if (typeof column.header !== 'string' || column.header.trim().length === 0) {
    throw new Error(`Column '${column.key}' must have a non-empty header.`);
  }

  if (column.dataType === 'currency') {
    assertCurrencyCode(column.currencyCode ?? 'USD');
  }
}

export function assertValidRowKeyValue(rowKey: string, value: unknown): TableRowKey {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  throw new Error(`Row key '${rowKey}' must resolve to a string or number. Received ${describeValue(value)}.`);
}

export function assertSupportedFormat(format: string, supportedFormats: readonly string[]): void {
  if (supportedFormats.includes(format)) {
    return;
  }

  throw new Error(`No codec registered for format '${format}'. Supported formats: ${supportedFormats.join(', ')}.`);
}

function describeValue(value: unknown): string {
  if (value == null) {
    return String(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`;
  }

  if (Array.isArray(value)) {
    return 'an array';
  }

  if (typeof value === 'object') {
    return 'an object';
  }

  return typeof value;
}