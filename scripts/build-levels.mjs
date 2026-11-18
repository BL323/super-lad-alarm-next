// Builds every level in scripts/levels/ (all files but lib.mjs) into
// public/assets/levels/<id>.json and validates each one. Exits non-zero if
// any level fails. `npm run build:levels -- <id> [<id> ...]` builds only those.

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createLevel } from './levels/lib.mjs';
import { validateLevel, formatReport } from '../src/level/validateLevel.js';

const root = dirname(fileURLToPath(import.meta.url));
const levelsDir = join(root, 'levels');
const outDir = resolve(root, '../public/assets/levels');
const only = process.argv.slice(2);

const files = readdirSync(levelsDir)
  .filter((f) => f.endsWith('.mjs') && f !== 'lib.mjs')
  .sort();

mkdirSync(outDir, { recursive: true });
let built = 0;
let failed = 0;
for (const file of files) {
  const { meta, default: build } = await import(pathToFileURL(join(levelsDir, file)).href);
  if (only.length && !only.includes(meta.id)) continue;
  const L = createLevel(meta);
  build(L);
  const map = L.toMap();
  writeFileSync(join(outDir, `${meta.id}.json`), JSON.stringify(map) + '\n');
  const report = validateLevel(map);
  console.log(formatReport(meta.id, report));
  built++;
  if (report.errors.length) failed++;
}
if (only.length && built < only.length) {
  console.error(`unknown level id in: ${only.join(', ')}`);
  process.exit(1);
}
process.exit(failed ? 1 : 0);
