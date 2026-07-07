export type SortDirection = 'asc' | 'desc';
export type SortValue = string | number | boolean | Date | null | undefined;

export interface SortRule<T> {
  readonly id: string;
  readonly direction: SortDirection;
  readonly selector: (item: T) => SortValue;
  readonly nulls?: 'first' | 'last';
}

export function sortByRules<T>(items: readonly T[], rules: readonly SortRule<T>[]): T[] {
  const output = [...items];
  output.sort((a, b) => compareByRules(a, b, rules));
  return output;
}

function compareByRules<T>(a: T, b: T, rules: readonly SortRule<T>[]): number {
  for (const rule of rules) {
    const result = compareValues(rule.selector(a), rule.selector(b), rule.nulls ?? 'first');
    if (result !== 0) {
      return rule.direction === 'asc' ? result : -result;
    }
  }

  return 0;
}

function compareValues(a: SortValue, b: SortValue, nulls: 'first' | 'last'): number {
  if (a == null && b == null) return 0;
  if (a == null) return nulls === 'first' ? -1 : 1;
  if (b == null) return nulls === 'first' ? 1 : -1;

  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);

  return String(a).localeCompare(String(b));
}
