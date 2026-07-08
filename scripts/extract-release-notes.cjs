const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const args = {
    version: undefined,
    out: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--version' && argv[index + 1] != null) {
      args.version = String(argv[index + 1]).trim();
      index += 1;
      continue;
    }

    if (token === '--out' && argv[index + 1] != null) {
      args.out = String(argv[index + 1]).trim();
      index += 1;
    }
  }

  return args;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assert(args.out != null && args.out.length > 0, 'Missing --out argument.');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const resolvedVersion = args.version != null && args.version.length > 0 ? args.version : String(packageJson.version ?? '').trim();
  assert(resolvedVersion.length > 0, 'Unable to resolve version from --version or package.json.');

  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const lines = changelog.split(/\r?\n/);

  const heading = `## [${resolvedVersion}]`;
  const startIndex = lines.findIndex((line) => line.startsWith(heading));
  assert(startIndex >= 0, `CHANGELOG.md is missing section for version ${resolvedVersion}.`);

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith('## [')) {
      endIndex = i;
      break;
    }
  }

  const sectionLines = lines.slice(startIndex, endIndex).join('\n').trim();
  assert(sectionLines.length > 0, `No changelog content found for version ${resolvedVersion}.`);

  const outputPath = path.resolve(process.cwd(), args.out);
  fs.writeFileSync(outputPath, `${sectionLines}\n`, 'utf8');
  console.log(`Release notes extracted to ${outputPath}`);
}

main();
