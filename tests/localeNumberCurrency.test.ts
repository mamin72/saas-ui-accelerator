import { describe, expect, it } from 'vitest';
import {
  createLocaleCurrencyFormatterContract,
  createLocaleNumberFormatterContract,
  formatLocaleCurrency,
  formatLocaleNumber,
} from '../src/index';

describe('localeNumberCurrency', () => {
  it('creates number formatter contracts with defaults and trimming', () => {
    const contract = createLocaleNumberFormatterContract({
      locale: ' en-US ',
      fallbackLocale: ' de-DE ',
      minimumFractionDigits: 1,
      maximumFractionDigits: 3,
    });

    expect(contract).toEqual({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      useGrouping: true,
      minimumFractionDigits: 1,
      maximumFractionDigits: 3,
      notation: 'standard',
    });
  });

  it('validates number formatter contract inputs', () => {
    expect(() => createLocaleNumberFormatterContract({ locale: ' ' })).toThrow(
      'Number formatter locale must be non-empty.'
    );

    expect(() =>
      createLocaleNumberFormatterContract({
        locale: 'en-US',
        fallbackLocale: ' ',
      })
    ).toThrow('Number formatter fallback locale must be non-empty.');

    expect(() =>
      createLocaleNumberFormatterContract({
        locale: 'en-US',
        minimumFractionDigits: -1,
      })
    ).toThrow('minimumFractionDigits must be a non-negative integer.');

    expect(() =>
      createLocaleNumberFormatterContract({
        locale: 'en-US',
        minimumFractionDigits: 3,
        maximumFractionDigits: 2,
      })
    ).toThrow('Number formatter minimumFractionDigits cannot be greater than maximumFractionDigits.');
  });

  it('formats locale-aware numbers with override and fallback behavior', () => {
    const contract = createLocaleNumberFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      maximumFractionDigits: 2,
      notation: 'standard',
    });

    const overrideResult = formatLocaleNumber({
      value: 1234.56,
      contract,
      localeOverride: 'fr-FR',
    });

    expect(overrideResult.locale).toBe('fr-FR');
    expect(overrideResult.usedFallbackLocale).toBe(false);
    expect(overrideResult.formatted).toBe(
      new Intl.NumberFormat('fr-FR', {
        useGrouping: true,
        maximumFractionDigits: 2,
        notation: 'standard',
      }).format(1234.56)
    );

    const fallbackResult = formatLocaleNumber({
      value: 1234.56,
      contract,
      localeOverride: 'bad_locale',
    });

    expect(fallbackResult.locale).toBe('de-DE');
    expect(fallbackResult.usedFallbackLocale).toBe(true);

    const hardFallbackContract = createLocaleNumberFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'also_bad_locale',
    });

    const hardFallback = formatLocaleNumber({
      value: 7,
      contract: hardFallbackContract,
      localeOverride: 'invalid_locale',
    });

    expect(hardFallback.locale).toBe('en-US');
    expect(hardFallback.usedFallbackLocale).toBe(true);
  });

  it('creates currency formatter contracts with normalization and defaults', () => {
    const contract = createLocaleCurrencyFormatterContract({
      locale: ' en-US ',
      fallbackLocale: ' de-DE ',
      currency: ' usd ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    expect(contract).toEqual({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      currency: 'USD',
      currencyDisplay: 'symbol',
      currencySign: 'standard',
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  it('validates currency formatter contract inputs', () => {
    expect(() =>
      createLocaleCurrencyFormatterContract({
        locale: ' ',
        currency: 'USD',
      })
    ).toThrow('Currency formatter locale must be non-empty.');

    expect(() =>
      createLocaleCurrencyFormatterContract({
        locale: 'en-US',
        fallbackLocale: ' ',
        currency: 'USD',
      })
    ).toThrow('Currency formatter fallback locale must be non-empty.');

    expect(() =>
      createLocaleCurrencyFormatterContract({
        locale: 'en-US',
        currency: 'US',
      })
    ).toThrow("Currency code 'US' must be a valid ISO-4217 alpha code.");

    expect(() =>
      createLocaleCurrencyFormatterContract({
        locale: 'en-US',
        currency: 'USD',
        maximumFractionDigits: -1,
      })
    ).toThrow('maximumFractionDigits must be a non-negative integer.');

    expect(() =>
      createLocaleCurrencyFormatterContract({
        locale: 'en-US',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 2,
      })
    ).toThrow('Currency formatter minimumFractionDigits cannot be greater than maximumFractionDigits.');
  });

  it('formats locale-aware currencies and validates numeric input', () => {
    const contract = createLocaleCurrencyFormatterContract({
      locale: 'en-US',
      fallbackLocale: 'de-DE',
      currency: 'EUR',
      currencyDisplay: 'code',
      currencySign: 'accounting',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const result = formatLocaleCurrency({
      value: 1280.5,
      contract,
      localeOverride: 'de-DE',
    });

    expect(result.locale).toBe('de-DE');
    expect(result.usedFallbackLocale).toBe(false);
    expect(result.formatted).toBe(
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        currencyDisplay: 'code',
        currencySign: 'accounting',
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(1280.5)
    );

    const fallbackResult = formatLocaleCurrency({
      value: 10,
      contract,
      localeOverride: 'invalid_locale',
    });

    expect(fallbackResult.locale).toBe('de-DE');
    expect(fallbackResult.usedFallbackLocale).toBe(true);

    expect(() =>
      formatLocaleCurrency({
        value: Number.NaN,
        contract,
      })
    ).toThrow('Currency formatter value must be a finite number.');

    expect(() =>
      formatLocaleNumber({
        value: Number.POSITIVE_INFINITY,
        contract: createLocaleNumberFormatterContract({ locale: 'en-US' }),
      })
    ).toThrow('Number formatter value must be a finite number.');

    const blankOverrideResult = formatLocaleNumber({
      value: 25,
      contract: createLocaleNumberFormatterContract({
        locale: 'en-US',
        fallbackLocale: 'de-DE',
      }),
      localeOverride: '   ',
    });

    expect(blankOverrideResult.locale).toBe('de-DE');
    expect(blankOverrideResult.usedFallbackLocale).toBe(true);
  });
});
