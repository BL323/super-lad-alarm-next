// Checks a Tiled level against the difficulty rules in the brief (section 6),
// so edits can't silently make the level unplayable. Pure JS with no Phaser,
// so it runs in Node (scripts/validate-levels.mjs) and in the dev build.
//
// Limits come from the jump in config.js (max height ~50 px, max distance
// ~73 px) with roughly a one-third safety margin.

export const LEVEL_RULES = {
  maxGapTiles: 3, // 48 px
  maxStepUpTiles: 2, // 32 px
  bossTunings: ['first', 'final'], // keys of BOSS in config.js
  layer: 'ground',
  objectLayer: 'objects',
};

const prop = (obj, name) => obj.properties?.find((p) => p.name === name)?.value;

export function validateLevel(map, rules = LEVEL_RULES, knownCollectibleTypes = null) {
  const errors = [];
  const info = {};
  const ground = map.layers.find((l) => l.name === rules.layer);
  const objectLayer = map.layers.find((l) => l.name === rules.objectLayer);
  if (!ground) return { errors: [`missing tile layer "${rules.layer}"`], info };
  if (!objectLayer) return { errors: [`missing object layer "${rules.objectLayer}"`], info };

  const { width: cols, height: rows } = ground;
  const tw = map.tilewidth;

  const solid = (c, r) => !!ground.data[r * cols + c];

  // Walkable surface per column: the top of the solid stack standing on the
  // bottom row (null = gap). Floating tiles above it (optional ledges) don't
  // count as walls on the main path; they're checked for reachability below.
  const surface = [];
  for (let c = 0; c < cols; c++) {
    let top = null;
    for (let r = rows - 1; r >= 0 && solid(c, r); r--) top = r;
    surface.push(top);
  }

  // Floating ledges: solid tiles not part of a column's ground stack. Each
  // ledge top must be reachable: at most maxStepUpTiles above some surface or
  // ledge within maxGapTiles columns.
  const ledges = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const inStack = surface[c] !== null && r >= surface[c];
      if (solid(c, r) && !inStack && (r === 0 || !solid(c, r - 1))) ledges.push({ c, r });
    }
  }
  const tops = (c) => [surface[c], ...ledges.filter((l) => l.c === c).map((l) => l.r)].filter((v) => v !== null);
  for (const l of ledges) {
    let reachable = false;
    for (let dc = -rules.maxGapTiles - 1; dc <= rules.maxGapTiles + 1 && !reachable; dc++) {
      const n = l.c + dc;
      if (dc === 0 || n < 0 || n >= cols) continue;
      // Rows grow downwards: t - l.r is how far below the ledge a neighbouring top is
      // (negative = above it, so you can drop onto the ledge).
      reachable = tops(n).some((t) => t - l.r <= rules.maxStepUpTiles);
    }
    if (!reachable) errors.push(`ledge at col ${l.c} row ${l.r} can't be reached (nothing within ${rules.maxStepUpTiles} tiles below it nearby)`);
  }

  // Gaps and step-ups along the intended left-to-right path.
  let lastSurface = null;
  let lastCol = -1;
  for (let c = 0; c < cols; c++) {
    if (surface[c] === null) continue;
    const gap = c - lastCol - 1;
    if (lastCol >= 0 && gap > rules.maxGapTiles) {
      errors.push(`gap of ${gap} tiles at cols ${lastCol + 1}–${c - 1} (max ${rules.maxGapTiles})`);
    }
    if (lastSurface !== null) {
      const rise = lastSurface - surface[c];
      if (rise > rules.maxStepUpTiles) {
        errors.push(`step-up of ${rise} tiles into col ${c} (max ${rules.maxStepUpTiles})`);
      }
    }
    lastSurface = surface[c];
    lastCol = c;
  }
  if (surface[0] === null) errors.push('col 0 has no ground');

  // Objects.
  const objs = objectLayer.objects;
  const ofType = (t) => objs.filter((o) => o.type === t || o.class === t);
  const colOf = (x) => Math.floor(x / tw);

  const spawns = ofType('spawn');
  if (spawns.length !== 1) errors.push(`expected 1 spawn, found ${spawns.length}`);
  const checkpoints = ofType('checkpoint');
  if (checkpoints.length < 2) errors.push(`expected at least 2 checkpoints, found ${checkpoints.length}`);
  const finishes = ofType('finish');
  if (finishes.length !== 1) errors.push(`expected 1 finish, found ${finishes.length}`);
  const endZone = objs.find((o) => o.name === 'end-zone');
  const bosses = ofType('boss');
  // The end-zone is the boss arena: a level has one if and only if it has a boss.
  if (bosses.length && !endZone) errors.push('boss level is missing its "end-zone" rectangle');
  if (endZone && !bosses.length) errors.push('"end-zone" rectangle but no boss');
  if (endZone && finishes[0] && finishes[0].x < endZone.x) {
    errors.push('finish is before the end-zone (it must be inside it or after it)');
  }
  if (endZone) {
    const c0 = colOf(endZone.x);
    const c1 = colOf(endZone.x + endZone.width - 1);
    const s = surface.slice(c0, c1 + 1);
    if (s.some((v) => v !== s[0])) errors.push('end-zone is not flat');
  }

  if (bosses.length > 1) errors.push(`expected at most 1 boss, found ${bosses.length}`);
  for (const b of bosses) {
    const t = prop(b, 'tuning');
    if (!rules.bossTunings.includes(t)) errors.push(`boss tuning "${t}" is not one of ${rules.bossTunings.join(', ')}`);
  }
  for (const b of bosses) {
    if (!endZone || b.x < endZone.x || b.x > endZone.x + endZone.width) errors.push('boss is not inside the end-zone');
  }
  if (bosses.length && endZone) {
    const inArena = objs.filter(
      (o) => (o.type === 'collectible' || o.class === 'collectible') && o.x >= endZone.x && o.x <= endZone.x + endZone.width,
    );
    if (inArena.length) errors.push(`${inArena.length} collectible(s) inside the boss arena`);
  }

  // The finish is the target pub's door, so it shares the pub's column.
  const decorLayer = map.layers.find((l) => l.name === 'decor');
  const pubs = (decorLayer?.objects ?? []).filter((o) => o.type === 'pub' || o.class === 'pub');
  for (const f of finishes) {
    if (!pubs.some((p) => colOf(p.x) === colOf(f.x))) errors.push(`finish at col ${colOf(f.x)} is not at a pub door`);
  }
  info.finishPub = finishes[0] ? (prop(pubs.find((p) => colOf(p.x) === colOf(finishes[0].x)) ?? {}, 'pub') ?? null) : null;

  for (const o of [...spawns, ...checkpoints, ...finishes, ...bosses]) {
    const c = colOf(o.x);
    if (surface[c] === null) errors.push(`${o.type} "${o.name}" at col ${c} is over a gap`);
  }

  // Hazards: every surface hazard (glass, bucket) needs a safe tile at the same height either side.
  const SURFACE_HAZARDS = ['glass', 'bucket'];
  const glassCols = new Set();
  for (const h of ofType('hazard').filter((h) => SURFACE_HAZARDS.includes(prop(h, 'kind')))) {
    for (let c = colOf(h.x); c <= colOf(h.x + h.width - 1); c++) glassCols.add(c);
  }
  for (const c of glassCols) {
    const s = surface[c];
    for (const n of [c - 1, c + 1]) {
      if (glassCols.has(n)) continue;
      if (surface[n] !== s) errors.push(`hazard at col ${c} has no safe landing tile at col ${n}`);
    }
    if (glassCols.has(c - 1) && glassCols.has(c + 1)) errors.push(`hazard at col ${c} is part of a run longer than 2`);
  }

  // Collectibles.
  const collectibles = ofType('collectible');
  const counts = {};
  for (const o of collectibles) {
    const t = prop(o, 'type');
    counts[t] = (counts[t] ?? 0) + 1;
    if (knownCollectibleTypes && !knownCollectibleTypes.includes(t)) errors.push(`unknown collectible type "${t}"`);
  }

  info.lengthPx = cols * tw;
  info.screens = +((cols * tw) / 320).toFixed(1);
  info.collectibles = counts;
  info.hazards = ofType('hazard').length;
  info.ledges = ledges.length;
  info.boss = bosses.length ? prop(bosses[0], 'kind') : null;
  return { errors, info };
}

export function formatReport(name, { errors, info }) {
  const head = `${name}: ${errors.length ? `${errors.length} problem(s)` : 'OK'} · ${info.lengthPx ?? '?'} px (${
    info.screens ?? '?'
  } screens) · collectibles ${JSON.stringify(info.collectibles ?? {})} · hazards ${info.hazards ?? 0}${info.boss ? ` · boss ${info.boss}` : ''}`;
  return [head, ...errors.map((e) => `  ✗ ${e}`)].join('\n');
}
