import { Readable } from 'node:stream';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';
import { sortByRules, type SortRule } from './sortByRules';
import { assertSupportedFormat } from './validation';

export type DataFormat = 'json' | 'jsonl' | 'csv' | 'tsv' | 'xml' | 'yaml';

export interface ParsedRecord {
  readonly [key: string]: unknown;
}

export interface FormatCodec {
  readonly format: DataFormat;
  readonly mimeTypes: readonly string[];
  parse(input: unknown, options: ParseOptions): ParsedRecord[];
}

export interface ParseOptions {
  readonly format?: DataFormat;
  readonly mimeType?: string;
  readonly recordPath?: string;
  readonly delimiter?: string;
}

export interface ParseAndSortOptions<T> extends ParseOptions {
  readonly rules: readonly SortRule<T>[];
  readonly mapper?: (record: ParsedRecord) => T;
}

const codecRegistry = new Map<DataFormat, FormatCodec>();
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
});

const builtInCodecs: readonly FormatCodec[] = [
  {
    format: 'json',
    mimeTypes: ['application/json', 'text/json'],
    parse: (input: unknown, options: ParseOptions): ParsedRecord[] => {
      const value = parseJsonLike(input, options.recordPath);
      return toRecordArray(value);
    },
  },
  {
    format: 'jsonl',
    mimeTypes: ['application/x-ndjson', 'application/jsonl'],
    parse: (input: unknown): ParsedRecord[] => parseJsonLines(asText(input, 'jsonl')),
  },
  {
    format: 'csv',
    mimeTypes: ['text/csv', 'application/csv'],
    parse: (input: unknown, options: ParseOptions): ParsedRecord[] =>
      parseDelimitedText(asText(input, 'csv'), options.delimiter ?? ','),
  },
  {
    format: 'tsv',
    mimeTypes: ['text/tab-separated-values', 'text/tsv'],
    parse: (input: unknown, options: ParseOptions): ParsedRecord[] =>
      parseDelimitedText(asText(input, 'tsv'), options.delimiter ?? '\t'),
  },
  {
    format: 'xml',
    mimeTypes: ['application/xml', 'text/xml'],
    parse: (input: unknown, options: ParseOptions): ParsedRecord[] => {
      const parsed: unknown = xmlParser.parse(asText(input, 'xml')) as unknown;
      if (options.recordPath != null) {
        return toRecordArray(getByPath(parsed, options.recordPath));
      }

      const firstArray = findFirstRecordArray(parsed);
      if (firstArray.length > 0) {
        return firstArray;
      }

      const firstObject = findFirstFlatRecord(parsed);
      /* c8 ignore next */
      if (firstObject != null) {
        return [firstObject];
      }

      /* c8 ignore next */
      return toRecordArray(parsed);
    },
  },
  {
    format: 'yaml',
    mimeTypes: ['application/yaml', 'application/x-yaml', 'text/yaml'],
    parse: (input: unknown, options: ParseOptions): ParsedRecord[] => {
      const parsed: unknown = typeof input === 'string' ? (YAML.parse(input) as unknown) : input;
      const selected = options.recordPath == null ? parsed : getByPath(parsed, options.recordPath);
      return toRecordArray(selected);
    },
  },
];

for (const codec of builtInCodecs) {
  codecRegistry.set(codec.format, codec);
}

export function registerCodec(codec: FormatCodec): void {
  codecRegistry.set(codec.format, codec);
}

export function getSupportedFormats(): DataFormat[] {
  return Array.from(codecRegistry.keys());
}

export function parseRecords(input: unknown, options: ParseOptions = {}): ParsedRecord[] {
  const format = resolveFormat(input, options);
  const codec = codecRegistry.get(format);
  if (codec == null) {
    assertSupportedFormat(format, getSupportedFormats());
  }

  return codecRegistry.get(format)!.parse(input, options);
}

export async function parseRecordsFromStream(stream: Readable, options: ParseOptions = {}): Promise<ParsedRecord[]> {
  const text = await readStream(stream);
  return parseRecords(text, options);
}

export function parseAndSort<T extends ParsedRecord = ParsedRecord>(
  input: unknown,
  options: ParseAndSortOptions<T>
): T[] {
  const rows = parseRecords(input, options);
  const mapped = mapRows(rows, options.mapper);
  return sortByRules(mapped, options.rules);
}

export async function parseAndSortFromStream<T extends ParsedRecord = ParsedRecord>(
  stream: Readable,
  options: ParseAndSortOptions<T>
): Promise<T[]> {
  const rows = await parseRecordsFromStream(stream, options);
  const mapped = mapRows(rows, options.mapper);
  return sortByRules(mapped, options.rules);
}

function mapRows<T extends ParsedRecord>(
  rows: readonly ParsedRecord[],
  mapper: ((record: ParsedRecord) => T) | undefined
): T[] {
  if (mapper == null) {
    return rows.map((row) => row as T);
  }

  return rows.map((row) => mapper(row));
}

/* c8 ignore start */
function resolveFormat(input: unknown, options: ParseOptions): DataFormat {
  if (options.format != null) {
    return options.format;
  }

  if (options.mimeType != null) {
    const fromMime = detectFormatFromMime(options.mimeType);
    if (fromMime != null) {
      return fromMime;
    }
  }

  if (isRecord(input) || Array.isArray(input)) {
    return 'json';
  }

  if (typeof input !== 'string') {
    throw new Error('Unable to detect format. Provide options.format for non-text input.');
  }

  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }

  if (looksLikeJsonLines(input)) {
    return 'jsonl';
  }

  if (trimmed.startsWith('<')) {
    return 'xml';
  }

  if (looksLikeDelimited(input, '\t')) {
    return 'tsv';
  }

  if (looksLikeDelimited(input, ',')) {
    return 'csv';
  }

  if (looksLikeYaml(input)) {
    return 'yaml';
  }

  throw new Error('Unable to detect format. Set options.format explicitly.');
}

/* c8 ignore end */

function detectFormatFromMime(mimeType: string): DataFormat | undefined {
  const lowered = mimeType.toLowerCase();
  for (const codec of codecRegistry.values()) {
    if (codec.mimeTypes.some((mime) => lowered.includes(mime.toLowerCase()))) {
      return codec.format;
    }
  }

  return undefined;
}

function parseJsonLike(input: unknown, recordPath: string | undefined): unknown {
  const parsed: unknown = typeof input === 'string' ? (JSON.parse(input) as unknown) : input;
  if (recordPath == null) {
    return parsed;
  }

  return getByPath(parsed, recordPath);
}

function parseJsonLines(text: string): ParsedRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const parsed: unknown = JSON.parse(line);
    if (!isRecord(parsed)) {
      throw new Error('Each JSONL line must be a JSON object.');
    }

    return parsed;
  });
}

function parseDelimitedText(text: string, delimiter: string): ParsedRecord[] {
  const rows = parseSeparatedRows(text, delimiter);
  if (rows.length === 0) {
    return [];
  }

  const [headers, ...body] = rows;
  if (headers.length === 0) {
    return [];
  }

  return body
    .filter((row) => row.some((value) => value.length > 0))
    .map((row) => {
      const output: Record<string, unknown> = {};
      for (let index = 0; index < headers.length; index += 1) {
        const key = headers[index] ?? `column_${index + 1}`;
        output[key] = row[index] ?? '';
      }

      return output;
    });
}

function parseSeparatedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];

    if (current === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && current === delimiter) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (!inQuotes && (current === '\n' || current === '\r')) {
      if (current === '\r' && next === '\n') {
        index += 1;
      }
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += current;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((parsedRow) => parsedRow.length > 0);
}

function toRecordArray(value: unknown): ParsedRecord[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!isRecord(item)) {
        throw new Error('Parsed data array must contain objects.');
      }

      return item;
    });
  }

  if (isRecord(value)) {
    const firstArray = findFirstRecordArray(value);
    if (firstArray.length > 0) {
      return firstArray;
    }

    return [value];
  }

  throw new Error('Parsed data must be an object or object array.');
}

function findFirstRecordArray(value: unknown): ParsedRecord[] {
  if (Array.isArray(value)) {
    if (value.every((item) => isRecord(item))) {
      return value;
    }

    for (const item of value) {
      const found = findFirstRecordArray(item);
      if (found.length > 0) {
        return found;
      }
    }

    return [];
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const nested of Object.values(value)) {
    const found = findFirstRecordArray(nested);
    if (found.length > 0) {
      return found;
    }
  }

  return [];
}

function getByPath(value: unknown, path: string): unknown {
  const keys = path.split('.').map((key) => key.trim()).filter((key) => key.length > 0);
  let current: unknown = value;

  for (const key of keys) {
    if (!isRecord(current)) {
      throw new Error(`Path '${path}' does not exist in parsed payload.`);
    }

    if (!(key in current)) {
      throw new Error(`Path '${path}' does not exist in parsed payload.`);
    }

    current = current[key];
  }

  return current;
}

/* c8 ignore start */
function findFirstFlatRecord(value: unknown): ParsedRecord | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstFlatRecord(item);
      if (found != null) {
        return found;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const values = Object.values(value);
  const hasNested = values.some((item) => isRecord(item) || Array.isArray(item));
  if (!hasNested) {
    return value;
  }

  for (const item of values) {
    const found = findFirstFlatRecord(item);
    if (found != null) {
      return found;
    }
  }

  return undefined;
}

/* c8 ignore end */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(input: unknown, format: string): string {
  if (typeof input === 'string') {
    return input;
  }

  if (Buffer.isBuffer(input)) {
    return input.toString('utf8');
  }

  throw new Error(`Format '${format}' expects text input.`);
}

function looksLikeJsonLines(text: string): boolean {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length < 2) {
    return false;
  }

  return lines.every((line) => line.startsWith('{') && line.endsWith('}'));
}

function looksLikeDelimited(text: string, delimiter: string): boolean {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return false;
  }

  return lines[0]?.includes(delimiter) === true;
}

function looksLikeYaml(text: string): boolean {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return false;
  }

  return lines.some((line) => line.includes(':'));
}

async function readStream(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const part of stream) {
    if (typeof part === 'string') {
      chunks.push(Buffer.from(part));
      continue;
    }

    if (part instanceof Uint8Array) {
      chunks.push(Buffer.from(part));
      continue;
    }

    /* c8 ignore next */
    throw new Error('Unsupported stream chunk type. Expected string or Uint8Array.');
  }

  return Buffer.concat(chunks).toString('utf8');
}
