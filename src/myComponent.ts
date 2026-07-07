import { parseAndSort, parseAndSortFromStream } from './formatSupport';
import { sortByRules } from './sortByRules';
import { JsonTableComponent } from './tableComponent';

export const myComponent = {
  SortData: sortByRules,
  Sort: sortByRules,
  SortableTable: JsonTableComponent,
  Table: JsonTableComponent,
  ParseAndSort: parseAndSort,
  ParseAndSortFromStream: parseAndSortFromStream,
} as const;

// Compatibility alias for typo variant requested by user.
export const myComponet = myComponent;
