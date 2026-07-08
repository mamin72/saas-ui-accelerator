# Localization Primitives

This guide shows how to use the localization primitives introduced in Foundation Track 5.

## Included Modules

- i18n message contracts and template formatting (`createTranslationKeyContract`, `createMessageFormatterContract`, `createMessageCatalog`, `formatMessage`)
- Locale-aware number and currency formatting (`createLocaleNumberFormatterContract`, `createLocaleCurrencyFormatterContract`, `formatLocaleNumber`, `formatLocaleCurrency`)
- Timezone-safe date formatting and parsing (`createLocaleDateTimeFormatterContract`, `formatLocaleDateTime`, `createLocaleDateParseContract`, `parseZonedDateTime`, `convertDateTimeToTimeZone`)
- Locale-aware sort and filter helpers (`createLocaleTextSortContract`, `sortByLocaleRules`, `createLocaleFilterContract`, `evaluateLocaleFilterPredicate`)

## Quick Example

```ts
import {
  createLocaleFilterContract,
  createLocaleTextSortContract,
  createMessageCatalog,
  createMessageFormatterContract,
  createTranslationKeyContract,
  evaluateLocaleFilterPredicate,
  formatLocaleCurrency,
  formatLocaleDateTime,
  formatLocaleNumber,
  formatMessage,
  sortByLocaleRules,
} from "saas-ui-accelerator";

const titleKey = createTranslationKeyContract({
  key: "billing.summary.title",
  placeholders: [{ name: "customer", type: "string" }],
});

const messageFormatter = createMessageFormatterContract({
  locale: "en-US",
  fallbackLocale: "de-DE",
  timeZone: "UTC",
});

const catalog = createMessageCatalog([
  { locale: "de-DE", key: "billing.summary.title", template: "Abrechnung fur {customer}" },
]);

const title = formatMessage({
  contract: titleKey,
  formatter: messageFormatter,
  catalog,
  localeOverride: "fr-FR",
  values: { customer: "Contoso" },
});

const amount = formatLocaleCurrency({
  value: 1299.5,
  contract: {
    locale: "en-US",
    fallbackLocale: "de-DE",
    currency: "EUR",
    currencyDisplay: "symbol",
    currencySign: "standard",
    useGrouping: true,
  },
  localeOverride: "de-DE",
});

const count = formatLocaleNumber({
  value: 12345.67,
  contract: {
    locale: "en-US",
    fallbackLocale: "de-DE",
    useGrouping: true,
    notation: "standard",
  },
  localeOverride: "de-DE",
});

const formattedDate = formatLocaleDateTime({
  value: "2025-04-10T12:30:15.000Z",
  contract: {
    locale: "en-US",
    fallbackLocale: "de-DE",
    timeZone: "UTC",
    dateStyle: "short",
    timeStyle: "short",
  },
  localeOverride: "de-DE",
});

const rows = [
  { name: "item 10", amount: 10 },
  { name: "item 2", amount: 2 },
  { name: "item 1", amount: 1 },
];

const sorted = sortByLocaleRules(
  rows,
  [{ id: "name", direction: "asc", selector: (row) => row.name }],
  createLocaleTextSortContract({ locale: "en-US", numeric: true })
);

const filterContract = createLocaleFilterContract({ locale: "en-US", timeZone: "UTC" });
const isInRange = evaluateLocaleFilterPredicate(
  { source: 8, operator: "between", value: 5, valueTo: 10 },
  filterContract
);
```

## Runnable Validation

Localization example coverage is validated by:

- `tests/localizationPrimitives.examples.test.ts`
- `tests/i18nMessageContracts.test.ts`
- `tests/localeNumberCurrency.test.ts`
- `tests/localeDateTime.test.ts`
- `tests/localeSortFilter.test.ts`
