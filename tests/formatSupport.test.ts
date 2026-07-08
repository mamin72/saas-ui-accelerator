import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  getSupportedFormats,
  parseAndSort,
  parseAndSortFromStream,
  parseRecords,
  parseRecordsFromStream,
  registerCodec,
  type DataFormat,
  type FormatCodec,
  type ParsedRecord,
} from '../src/index';

describe('formatSupport', () => {
  it('parses and sorts JSON payloads', () => {
    const payload = JSON.stringify([
      { lastName: 'Smith', given: 'Ben' },
      { lastName: 'Adams', given: 'Amy' },
    ]);

    const result = parseAndSort(payload, {
      format: 'json',
      rules: [{ id: 'last', direction: 'asc', selector: (x) => String(x.lastName) }],
    });

    expect(result.map((x) => x.lastName)).toEqual(['Adams', 'Smith']);
  });

  it('parses JSONL payloads', () => {
    const payload = '{"name":"z"}\n{"name":"a"}';

    const result = parseAndSort(payload, {
      format: 'jsonl',
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(result.map((x) => x.name)).toEqual(['a', 'z']);
  });

  it('parses CSV payloads with quoted values', () => {
    const payload = 'lastName,given\n"Smith, Jr",Ben\nAdams,Amy';

    const result = parseAndSort(payload, {
      format: 'csv',
      rules: [{ id: 'last', direction: 'asc', selector: (x) => String(x.lastName) }],
    });

    expect(result.map((x) => x.lastName)).toEqual(['Adams', 'Smith, Jr']);
  });

  it('parses TSV payloads', () => {
    const payload = 'lastName\tgiven\nSmith\tBen\nAdams\tAmy';
    const rows = parseRecords(payload, { format: 'tsv' });
    expect(rows[0]?.lastName).toBe('Smith');
    expect(rows[1]?.given).toBe('Amy');
  });

  it('parses XML payloads with record path', () => {
    const payload = '<root><items><item><name>z</name></item><item><name>a</name></item></items></root>';

    const result = parseAndSort(payload, {
      format: 'xml',
      recordPath: 'root.items.item',
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(result.map((x) => x.name)).toEqual(['a', 'z']);
  });

  it('parses YAML payloads', () => {
    const payload = '- name: z\n- name: a';
    const result = parseAndSort(payload, {
      format: 'yaml',
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(result.map((x) => x.name)).toEqual(['a', 'z']);
  });

  it('supports stream parsing and sorting', async () => {
    const stream = Readable.from(['name\nB\nA']);

    const result = await parseAndSortFromStream(stream, {
      format: 'csv',
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(result.map((x) => x.name)).toEqual(['A', 'B']);
  });

  it('supports parsing stream without sorting', async () => {
    const stream = Readable.from(['name\nA']);
    const records = await parseRecordsFromStream(stream, { format: 'csv' });
    expect(records).toEqual([{ name: 'A' }]);
  });

  it('applies mapper to parsed records', () => {
    const payload = 'id,score\na,10\nb,3';

    const result = parseAndSort(payload, {
      format: 'csv',
      mapper: (row) => ({
        id: String(row.id),
        score: Number(row.score),
      }),
      rules: [{ id: 'score', direction: 'desc', selector: (x) => x.score }],
    });

    expect(result.map((x) => `${x.id}:${x.score}`)).toEqual(['a:10', 'b:3']);
  });

  it('auto-detects CSV and JSON formats', () => {
    const csvRows = parseRecords('name,value\nA,1\nB,2');
    const jsonRows = parseRecords('[{"name":"A"}]');

    expect(csvRows.length).toBe(2);
    expect(jsonRows.length).toBe(1);
  });

  it('detects format from mime type', () => {
    const rows = parseRecords('name\nA', { mimeType: 'text/csv' });
    expect(rows[0]?.name).toBe('A');
  });

  it('throws for unknown format detection', () => {
    expect(() => parseRecords('not-a-recognized-format')).toThrow('Unable to detect format');
  });

  it('throws for JSONL lines that are not objects', () => {
    expect(() => parseRecords('1\n2', { format: 'jsonl' })).toThrow('JSONL line');
  });

  it('throws when text is required for format parsing', () => {
    expect(() => parseRecords({ name: 'A' }, { format: 'csv' })).toThrow("expects text input");
  });

  it('supports custom codec registration', () => {
    const customCodec: FormatCodec = {
      format: 'jsonl',
      mimeTypes: ['application/custom-json'],
      parse: (): ParsedRecord[] => [{ name: 'override' }],
    };

    registerCodec(customCodec);

    const rows = parseRecords('ignored', { format: 'jsonl' });
    expect(rows).toEqual([{ name: 'override' }]);

    registerCodec({
      format: 'jsonl',
      mimeTypes: ['application/x-ndjson', 'application/jsonl'],
      parse: (input: unknown): ParsedRecord[] => {
        if (typeof input !== 'string') {
          throw new Error('jsonl requires string input.');
        }

        return input
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => {
            const parsed: unknown = JSON.parse(line) as unknown;
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
              throw new Error('Each JSONL line must be a JSON object.');
            }

            return parsed;
          });
      },
    });
  });

  it('lists built-in supported formats', () => {
    expect(getSupportedFormats().sort()).toEqual(['csv', 'json', 'jsonl', 'tsv', 'xml', 'yaml']);
  });

  it('parses JSON object payloads by inferred first record array', () => {
    const payload = {
      meta: { source: 'unit-test' },
      data: [{ name: 'B' }, { name: 'A' }],
    };

    const result = parseAndSort(payload, {
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(result.map((x) => x.name)).toEqual(['A', 'B']);
  });

  it('parses single JSON object as single record', () => {
    const rows = parseRecords('{"name":"A"}', { format: 'json' });
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('parses JSON with explicit record path', () => {
    const rows = parseRecords('{"root":{"items":[{"id":"1"}]}}', {
      format: 'json',
      recordPath: 'root.items',
    });

    expect(rows).toEqual([{ id: '1' }]);
  });

  it('throws when explicit path is missing', () => {
    expect(() =>
      parseRecords('{"root":{"items":[{"id":"1"}]}}', {
        format: 'json',
        recordPath: 'root.missing',
      })
    ).toThrow("does not exist");
  });

  it('parses XML by auto-detecting first record array', () => {
    const payload = '<root><list><row><name>B</name></row><row><name>A</name></row></list></root>';
    const rows = parseRecords(payload, { format: 'xml' });
    expect(rows.map((x) => x.name)).toEqual(['B', 'A']);
  });

  it('parses YAML with explicit record path', () => {
    const payload = 'root:\n  rows:\n    - name: B\n    - name: A';
    const result = parseAndSort(payload, {
      format: 'yaml',
      recordPath: 'root.rows',
      rules: [{ id: 'name', direction: 'asc', selector: (x) => String(x.name) }],
    });

    expect(result.map((x) => x.name)).toEqual(['A', 'B']);
  });

  it('accepts pre-parsed object input for YAML codec', () => {
    const rows = parseRecords([{ name: 'A' }], { format: 'yaml' });
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('parses CSV with CRLF new lines', () => {
    const payload = 'name,score\r\nA,1\r\nB,2\r\n';
    const rows = parseRecords(payload, { format: 'csv' });
    expect(rows).toEqual([
      { name: 'A', score: '1' },
      { name: 'B', score: '2' },
    ]);
  });

  it('parses escaped quotes in separated values', () => {
    const payload = 'name,note\nA,"hello ""world"""';
    const rows = parseRecords(payload, { format: 'csv' });
    expect(rows[0]?.note).toBe('hello "world"');
  });

  it('returns empty array for empty CSV payload', () => {
    expect(parseRecords('', { format: 'csv' })).toEqual([]);
  });

  it('detects YAML format automatically', () => {
    const rows = parseRecords('name: A');
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('detects XML format automatically', () => {
    const rows = parseRecords('<root><items><item><name>A</name></item></items></root>');
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('throws for non-text input without explicit format', () => {
    expect(() => parseRecords(10)).toThrow('Provide options.format');
  });

  it('throws for invalid parsed payload type', () => {
    expect(() => parseRecords('1', { format: 'json' })).toThrow('must be an object or object array');
  });

  it('throws for JSON arrays that contain non-objects', () => {
    expect(() => parseRecords('[1,2]', { format: 'json' })).toThrow('must contain objects');
  });

  it('throws for stream chunks with unsupported types', async () => {
    const stream = Readable.from([123]);
    await expect(parseRecordsFromStream(stream, { format: 'csv' })).rejects.toThrow('Unsupported stream chunk type');
  });

  it('detects JSON from mime type alias', () => {
    const rows = parseRecords('[{"name":"A"}]', { mimeType: 'application/json; charset=utf-8' });
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('falls back to content detection when mime type is unknown', () => {
    const rows = parseRecords('name: A', { mimeType: 'application/unknown' });
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('auto-detects TSV payload', () => {
    const rows = parseRecords('name\tvalue\nA\t1\nB\t2');
    expect(rows).toEqual([
      { name: 'A', value: '1' },
      { name: 'B', value: '2' },
    ]);
  });

  it('supports buffer input for text-based codecs', () => {
    const rows = parseRecords(Buffer.from('name,value\nA,1'), { format: 'csv' });
    expect(rows).toEqual([{ name: 'A', value: '1' }]);
  });

  it('finds first nested object array for JSON object roots', () => {
    const rows = parseRecords('{"root":{"meta":[1,2],"records":[{"name":"A"}]}}', { format: 'json' });
    expect(rows).toEqual([{ name: 'A' }]);
  });

  it('extracts XML repeated item arrays without explicit path', () => {
    const rows = parseRecords('<root><items><item><name>A</name></item><item><name>B</name></item></items></root>');
    expect(rows).toEqual([{ name: 'A' }, { name: 'B' }]);
  });

  it('rejects object-mode stream chunks that are not string or bytes', async () => {
    const stream = Readable.from([{ bad: true }], { objectMode: true });
    await expect(parseRecordsFromStream(stream, { format: 'csv' })).rejects.toThrow('Unsupported stream chunk type');
  });

  it('throws when requesting an unregistered format codec', () => {
    expect(() => parseRecords('name,value\nA,1', { format: '__custom__' as DataFormat })).toThrow(
      "No codec registered for format '__custom__'. Supported formats: json, jsonl, csv, tsv, xml, yaml."
    );
  });
});
