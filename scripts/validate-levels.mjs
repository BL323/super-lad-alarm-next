// Validates every level JSON in public/assets/levels against the brief's rules,
// and the level registry (src/level/levels.js) against those files.
// Run with `npm run validate:levels`; exits non-zero if anything fails.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLevel, formatReport } from '../src/level/validateLevel.js';
import { LEVELS } from '../src/level/levels.js';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const dir = join(publicDir, 'assets/levels');
let failed = 0;
const reports = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const report = validateLevel(JSON.parse(readFileSync(join(dir, file), 'utf8')));
  reports[file] = report;
  console.log(formatReport(file, report));
  if (report.errors.length) failed++;
}

// Registry checks.
const problems = [];
const ids = new Set(LEVELS.map((l) => l.id));
if (ids.size !== LEVELS.length) problems.push('duplicate level ids');
LEVELS.forEach((level, i) => {
  const name = `level "${level.id}"`;
  if (level.number !== i + 1) problems.push(`${name} has number ${level.number}, expected ${i + 1} (crawl order)`);
  if (!existsSync(join(publicDir, level.file))) problems.push(`${name}: file ${level.file} not found`);
  const expectedNext = LEVELS[i + 1]?.id ?? null;
  if (level.next !== expectedNext) problems.push(`${name}: next is ${level.next}, expected ${expectedNext}`);
  const report = reports[level.file.split('/').pop()];
  if (report && report.info.finishPub !== level.pub) {
    problems.push(`${name}: finishes at pub "${report.info.finishPub}", registry says "${level.pub}"`);
  }
});
const registered = new Set(LEVELS.map((l) => l.file.split('/').pop()));
for (const file of Object.keys(reports)) {
  if (!registered.has(file)) console.warn(`note: ${file} is not in the level registry, so the game never loads it`);
}
console.log(`registry: ${problems.length ? `${problems.length} problem(s)` : 'OK'} · ${LEVELS.length} level(s)`);
for (const p of problems) console.log(`  ✗ ${p}`);
process.exit(failed || problems.length ? 1 : 0);
