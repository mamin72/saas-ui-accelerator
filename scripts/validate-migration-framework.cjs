const fs = require('node:fs');
const path = require('node:path');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureSections(content, sections, sourceName) {
  for (const section of sections) {
    assert(content.includes(section), `${sourceName} is missing required section: ${section}`);
  }
}

function main() {
  const root = process.cwd();
  const frameworkReadmePath = path.join(root, 'migrations', 'README.md');
  const templatePath = path.join(root, 'migrations', 'MIGRATION_GUIDE_TEMPLATE.md');
  const examplePath = path.join(root, 'migrations', 'examples', 'v1-to-v2-example.md');

  assert(fs.existsSync(frameworkReadmePath), 'Missing migrations/README.md');
  assert(fs.existsSync(templatePath), 'Missing migrations/MIGRATION_GUIDE_TEMPLATE.md');
  assert(fs.existsSync(examplePath), 'Missing migrations/examples/v1-to-v2-example.md');

  const frameworkReadme = read(frameworkReadmePath);
  const template = read(templatePath);
  const example = read(examplePath);

  ensureSections(
    frameworkReadme,
    ['## Purpose', '## Structure', '## When To Write A Migration Guide', '## Authoring Process'],
    'migrations/README.md'
  );

  ensureSections(
    template,
    [
      '## Summary',
      '## Impact Level',
      '## Upgrade Steps',
      '## Breaking Changes',
      '## Non-Breaking Changes',
      '## Deprecations',
      '## API Rename Examples',
      '## Behavioral Change Examples',
      '## Validation Checklist',
      '## Rollback Plan',
    ],
    'migrations/MIGRATION_GUIDE_TEMPLATE.md'
  );

  ensureSections(
    example,
    ['## Breaking Changes', '## API Rename Examples', '## Behavioral Change Examples', '## Validation Checklist'],
    'migrations/examples/v1-to-v2-example.md'
  );

  console.log('Migration framework validation passed.');
}

main();
