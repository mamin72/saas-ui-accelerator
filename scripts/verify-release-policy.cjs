const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {
    version: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--version' && argv[index + 1] != null) {
      args.version = String(argv[index + 1]).trim();
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
  const root = process.cwd();
  const packageJsonPath = path.join(root, 'package.json');
  const changelogPath = path.join(root, 'CHANGELOG.md');

  const packageJson = readJson(packageJsonPath);
  const packageVersion = String(packageJson.version ?? '').trim();
  const changelog = fs.readFileSync(changelogPath, 'utf8');

  assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageVersion),
    `package.json version '${packageVersion}' is not a valid SemVer-like value.`);

  if (args.version != null) {
    assert(
      args.version === packageVersion,
      `Release input version '${args.version}' does not match package.json version '${packageVersion}'.`
    );
  }

  const escapedVersion = packageVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingPattern = new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`);
  const changelogLines = changelog.split(/\r?\n/).map((line) => line.trim());
  assert(
    changelogLines.some((line) => headingPattern.test(line)),
    `CHANGELOG.md is missing release heading '## [${packageVersion}] - YYYY-MM-DD'.`
  );

  console.log(`Release policy check passed for version ${packageVersion}.`);
}

main();
