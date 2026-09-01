import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

function requireValue(condition, message) {
  if (!condition) failures.push(message);
}

async function markdownFiles(directory) {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(relativePath)));
    } else if (entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files;
}

const nodeMajor = (await read('.nvmrc')).trim();
const packageJson = JSON.parse(await read('package.json'));
const workflow = await read('.github/workflows/web-ci.yml');
const vercelConfig = JSON.parse(await read('vercel.json'));

requireValue(nodeMajor === '24', '.nvmrc must select Node 24');
requireValue(
  packageJson.engines?.node === `${nodeMajor}.x`,
  'package.json engines.node must match .nvmrc',
);
requireValue(
  workflow.includes("node-version-file: '.nvmrc'"),
  'GitHub Actions must read its Node version from .nvmrc',
);
requireValue(
  workflow.includes('run: npm ci'),
  'GitHub Actions must use npm ci',
);
requireValue(
  vercelConfig.framework === 'nextjs',
  'vercel.json must explicitly select the Next.js framework preset',
);
requireValue(
  vercelConfig.installCommand === 'npm ci',
  'vercel.json must use npm ci',
);
requireValue(
  vercelConfig.buildCommand === 'npm run build',
  'vercel.json must use the repository build script',
);

await access(path.join(root, 'package-lock.json'));

const documentationFiles = [
  'README.md',
  'AGENTS.md',
  ...(await markdownFiles('docs')),
  ...(await markdownFiles('.github')),
];

for (const relativePath of documentationFiles) {
  const content = await read(relativePath);
  if (/\bpnpm\b/i.test(content)) {
    failures.push(
      `${relativePath} refers to pnpm; npm is the repository standard`,
    );
  }
}

if (failures.length > 0) {
  console.error('Project consistency check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Project tooling and documentation are consistent.');
}
