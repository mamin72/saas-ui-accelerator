import { describe, expect, it } from 'vitest';
import {
  assertCsvDelimiter,
  assertCurrencyCode,
  assertSupportedFormat,
  assertTableColumnConfig,
  assertValidRowKeyValue,
} from '../src/index';

describe('validation helpers', () => {
  it('validates CSV delimiters', () => {
    expect(() => assertCsvDelimiter(',')).not.toThrow();
    expect(() => assertCsvDelimiter(';;')).toThrow("CSV delimiter must be exactly one character. Received ';;'.");
  });

  it('validates row key values with actionable messages', () => {
    expect(assertValidRowKeyValue('id', 42)).toBe(42);
    expect(() => assertValidRowKeyValue('id', { value: 1 })).toThrow(
      "Row key 'id' must resolve to a string or number. Received an object."
    );
  });

  it('validates currency codes and column configs', () => {
    expect(() => assertCurrencyCode('USD')).not.toThrow();
    expect(() => assertCurrencyCode('BAD')).toThrow("Invalid currency code 'BAD'. Use a valid ISO 4217 code.");

    const intlWithSupportedValues = Intl as Intl.DateTimeFormatOptions & {
      supportedValuesOf?: (key: string) => string[];
    };
    const originalSupportedValuesOf = intlWithSupportedValues.supportedValuesOf;
    const originalNumberFormat = Intl.NumberFormat;
    try {
      intlWithSupportedValues.supportedValuesOf = undefined;
      expect(() => assertCurrencyCode('B1D')).toThrow("Invalid currency code 'B1D'. Use a valid ISO 4217 code.");

      Object.defineProperty(Intl, 'NumberFormat', {
        value: class {
          constructor() {
            return this;
          }

          format(): string {
            return 'ok';
          }
        },
        configurable: true,
        writable: true,
      });

      expect(() => assertCurrencyCode('B1D')).toThrow("Invalid currency code 'B1D'. Use a valid ISO 4217 code.");

      Object.defineProperty(Intl, 'NumberFormat', {
        value: originalNumberFormat,
        configurable: true,
        writable: true,
      });
    } finally {
      intlWithSupportedValues.supportedValuesOf = originalSupportedValuesOf;
      Object.defineProperty(Intl, 'NumberFormat', {
        value: originalNumberFormat,
        configurable: true,
        writable: true,
      });
    }

    expect(() =>
      assertTableColumnConfig({ key: 'amount', header: 'Amount', dataType: 'currency', currencyCode: 'EUR' })
    ).not.toThrow();

    expect(() =>
      assertTableColumnConfig({ key: '', header: 'Amount', dataType: 'currency', currencyCode: 'EUR' } as never)
    ).toThrow('Column key must be a non-empty string.');

    expect(() =>
      assertTableColumnConfig({ key: 'amount', header: '', dataType: 'currency', currencyCode: 'EUR' } as never)
    ).toThrow("Column 'amount' must have a non-empty header.");
  });

  it('describes invalid row key values across all unsupported types', () => {
    expect(() => assertValidRowKeyValue('id', null)).toThrow("Row key 'id' must resolve to a string or number. Received null.");
    expect(() => assertValidRowKeyValue('id', undefined)).toThrow(
      "Row key 'id' must resolve to a string or number. Received undefined."
    );
    expect(() => assertValidRowKeyValue('id', true)).toThrow("Row key 'id' must resolve to a string or number. Received true.");
    expect(() => assertValidRowKeyValue('id', BigInt(1))).toThrow("Row key 'id' must resolve to a string or number. Received 1.");
    expect(() => assertValidRowKeyValue('id', [])).toThrow("Row key 'id' must resolve to a string or number. Received an array.");
    expect(() => assertValidRowKeyValue('id', { nested: true })).toThrow(
      "Row key 'id' must resolve to a string or number. Received an object."
    );
    expect(() => assertValidRowKeyValue('id', Symbol('x'))).toThrow(
      "Row key 'id' must resolve to a string or number. Received symbol."
    );
    expect(() => assertValidRowKeyValue('id', () => {})).toThrow(
      "Row key 'id' must resolve to a string or number. Received function."
    );
  });

  it('validates supported parser formats', () => {
    expect(() => assertSupportedFormat('json', ['json', 'csv'])).not.toThrow();
    expect(() => assertSupportedFormat('yaml', ['json', 'csv'])).toThrow(
      "No codec registered for format 'yaml'. Supported formats: json, csv."
    );
  });
});