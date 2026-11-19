// Checks a Tiled level against the difficulty rules in the brief (section 6),
// so edits can't silently make the level unplayable. Pure JS with no Phaser,
// so it runs in Node (scripts/validate-levels.mjs) and in the dev build.
//
// Limits come from the jump in config.js (max height ~50 px, max distance
// ~73 px) with roughly a one-third safety margin.
//
// Low bridges (girder tiles) are ceilings: under one, a full jump bumps its
// head and comes straight back down, so the allowed gap and step-up shrink to
// what that shorter jump can manage (same one-third margin).
//
// Moving platforms (the tank, boats) bridge gaps too wide to jump: the jump
// onto one is checked against its nearest position to the bank you leave, and
// the jump off against its furthest, so it works whenever you wait for it.
//
// Bouncy awnings throw you higher than a jump: from one, the climb allowed is
// what the bounce reaches (same margin). Seagulls and the departing train's
// auto-scroll are checked against the run speed.

import { TILESET } from '../assets.js';
import { PLAYER, PHYSICS, CROSSING, THROWERS, MOVERS, GULLS, AWNINGS, AUTOSCROLL } from '../config.js';

export const LEVEL_RULES = {
  maxGapTiles: 3, // 48 px
  maxStepUpTiles: 2, // 32 px
  minHeadroomTiles: 2, // clear space between a surface and a low bridge above it
  maxCrumbleRun: 4, // crumbling crates in a row (they're stepping stones, never somewhere to stop)
  swanClearTiles: 2, // flat ground beyond each end of a swan's patrol (room to land after jumping it)
  // The jump, for ceilings, straight from config.js.
  jump: {
    velocity: -PLAYER.jumpVelocity,
    gravity: PHYSICS.gravity,
    runSpeed: PLAYER.maxRunSpeed,
    bodyHeight: PLAYER.body.height,
    margin: 2 / 3,
  },
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
  const J0 = rules.jump;

  const girderGid = TILESET.tiles.girder + 1;
  const isCeiling = (c, r) => ground.data[r * cols + c] === girderGid;
  // Ceiling tiles never count as ground, walls or ledges.
  const solid = (c, r) => !!ground.data[r * cols + c] && !isCeiling(c, r);

  // Walkable surface per column: the top of the solid stack standing on the
  // bottom row (null = gap). Floating tiles above it (optional ledges) don't
  // count as walls on the main path; they're checked for reachability below.
  const surface = [];
  for (let c = 0; c < cols; c++) {
    let top = null;
    for (let r = rows - 1; r >= 0 && solid(c, r); r--) top = r;
    surface.push(top);
  }

  // Crumbling crates (objects, not tiles) are stepping stones over gaps: for
  // the path they count as ground at their row, but nothing may rest on them.
  const objAll = objectLayer.objects;
  const crumbles = objAll.filter((o) => o.type === 'crumble' || o.class === 'crumble');
  const crumbleCols = new Set();
  for (const o of crumbles) {
    const c = Math.floor(o.x / tw);
    const r = Math.floor(o.y / tw);
    if (crumbleCols.has(c)) errors.push(`two crumbling crates in col ${c}`);
    crumbleCols.add(c);
    if (surface[c] !== null) errors.push(`crumbling crate at col ${c} is over ground (it must bridge a gap)`);
    else surface[c] = r;
  }
  // A crate shakes sideways before it drops, so one right up against ground
  // pushes you into the side of the next tile: leave a gap tile either side.
  for (const c of crumbleCols) {
    for (const n of [c - 1, c + 1]) {
      if (!crumbleCols.has(n) && surface[n] !== null && surface[n] !== undefined) {
        errors.push(`crumbling crate at col ${c} is right next to ground at col ${n} (leave a gap tile)`);
      }
    }
  }
  let run = 0;
  for (let c = 0; c <= cols; c++) {
    run = crumbleCols.has(c) ? run + 1 : 0;
    if (run === rules.maxCrumbleRun + 1) errors.push(`more than ${rules.maxCrumbleRun} crumbling crates in a row (at col ${c})`);
  }

  // Low bridges: the lowest girder row in each column (null = open sky).
  const ceiling = [];
  for (let c = 0; c < cols; c++) {
    let low = null;
    for (let r = 0; r < (surface[c] ?? rows); r++) if (isCeiling(c, r)) low = r;
    ceiling.push(low);
  }
  for (let c = 0; c < cols; c++) {
    if (ceiling[c] === null || surface[c] === null) continue;
    const clear = surface[c] - ceiling[c] - 1;
    if (clear < rules.minHeadroomTiles) errors.push(`low bridge at col ${c} leaves ${clear} tile(s) of headroom (min ${rules.minHeadroomTiles})`);
  }

  // Moving platforms: each sweeps cols c0–c1 of one gap at deck row `row`.
  const movers = [];
  for (const o of objAll.filter((o) => o.type === 'mover' || o.class === 'mover')) {
    const kind = prop(o, 'kind');
    const travel = prop(o, 'travelPx') ?? 0;
    const m = { kind, c0: Math.floor(o.x / tw), c1: Math.floor((o.x + travel + o.width - 1) / tw), row: Math.floor(o.y / tw) };
    if (!MOVERS[kind]) errors.push(`mover "${kind}" at col ${m.c0} is not one of ${Object.keys(MOVERS).join(', ')}`);
    if (travel <= 0) errors.push(`mover at col ${m.c0} has no travel`);
    for (let c = m.c0; c <= m.c1; c++) {
      if (surface[c] !== null) errors.push(`mover at cols ${m.c0}–${m.c1} runs into ground at col ${c}`);
      if (ceiling[c] !== null) errors.push(`mover at cols ${m.c0}–${m.c1} runs under a low bridge at col ${c}`);
    }
    movers.push(m);
  }

  // Bouncy awnings: one-way decks at `row` over cols c0–c1.
  const awnings = objAll
    .filter((o) => o.type === 'awning' || o.class === 'awning')
    .map((o) => ({ c0: Math.floor(o.x / tw), c1: Math.floor((o.x + o.width - 1) / tw), row: Math.floor(o.y / tw) }));

  // How high an awning bounce goes, and so how far up it can safely reach.
  const bounceRise = (AWNINGS.velocity * AWNINGS.velocity) / (2 * J0.gravity);
  const bounceStep = Math.floor((bounceRise * J0.margin) / tw);
  for (const a of awnings) {
    for (let c = a.c0; c <= a.c1; c++) {
      if (surface[c] !== null && surface[c] - a.row < 2) errors.push(`awning at cols ${a.c0}–${a.c1} is too low over the ground at col ${c} (walk under it)`);
      for (let r = a.row - 1; r >= Math.max(0, a.row - Math.ceil(bounceRise / tw)); r--) {
        if (ground.data[r * cols + c]) errors.push(`awning at cols ${a.c0}–${a.c1}: tile at col ${c} row ${r} is in the way of the bounce`);
      }
    }
  }

  // A jump from surface row `fromRow` with a ceiling at `ceilRow`: how high it
  // can rise (px) and the gap / step-up it can safely clear (tiles).
  const J = J0;
  const apex = (J.velocity * J.velocity) / (2 * J.gravity);
  const underCeiling = (fromRow, ceilRow) => {
    const rise = Math.min(apex, (fromRow - ceilRow - 1) * tw - J.bodyHeight);
    if (rise <= 0) return { gap: 0, step: 0 };
    const up = (J.velocity - Math.sqrt(J.velocity * J.velocity - 2 * J.gravity * rise)) / J.gravity;
    const down = Math.sqrt((2 * rise) / J.gravity);
    const air = rise >= apex ? (2 * J.velocity) / J.gravity : up + down;
    return {
      gap: Math.min(rules.maxGapTiles, Math.floor((J.runSpeed * air * J.margin) / tw)),
      step: Math.min(rules.maxStepUpTiles, Math.floor((rise * J.margin) / tw)),
    };
  };
  /** Limits for a jump from col `from` (surface row) to col `to`, given any ceilings between. */
  const limitsBetween = (from, to) => {
    let limits = { gap: rules.maxGapTiles, step: rules.maxStepUpTiles };
    for (let k = from; k <= to; k++) {
      if (ceiling[k] === null) continue;
      const l = underCeiling(surface[from], ceiling[k]);
      limits = { gap: Math.min(limits.gap, l.gap), step: Math.min(limits.step, l.step) };
    }
    return limits;
  };

  // Floating ledges: solid tiles not part of a column's ground stack (crate
  // ledges, the rooftop route). Every ledge must be reachable from the spawn
  // by a chain of jumps: up at most maxStepUpTiles and across at most
  // maxGapTiles + 1 columns per jump, from ground or from another ledge.
  // (Checking each ledge only against its neighbours would let a floating
  // run "reach" itself.)
  const ledges = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const inStack = surface[c] !== null && r >= surface[c];
      if (solid(c, r) && !inStack && (r === 0 || !solid(c, r - 1))) ledges.push({ c, r });
    }
  }
  const nodes = [];
  for (let c = 0; c < cols; c++) if (surface[c] !== null) nodes.push({ c, r: surface[c], ground: true });
  for (const l of ledges) nodes.push({ ...l, ground: false });
  // A mover's deck is somewhere to jump from anywhere along its track.
  for (const m of movers) for (let c = m.c0; c <= m.c1; c++) nodes.push({ c, r: m.row, ground: false, mover: true });
  // So is an awning, and it bounces you higher.
  for (const a of awnings) for (let c = a.c0; c <= a.c1; c++) nodes.push({ c, r: a.row, ground: false, bounce: true });
  const spawnObj = objAll.find((o) => o.type === 'spawn' || o.class === 'spawn');
  const startCol = spawnObj ? Math.floor(spawnObj.x / tw) : 0;
  const reached = new Set();
  const key = (n) => `${n.c},${n.r}`;
  const queue = nodes.filter((n) => n.ground && n.c === startCol);
  queue.forEach((n) => reached.add(key(n)));
  while (queue.length) {
    const from = queue.shift();
    for (const to of nodes) {
      if (reached.has(key(to))) continue;
      if (Math.abs(to.c - from.c) > rules.maxGapTiles + 1) continue;
      if (from.r - to.r > (from.bounce ? bounceStep : rules.maxStepUpTiles)) continue; // rows grow downwards: this is the rise
      reached.add(key(to));
      queue.push(to);
    }
  }
  for (const m of movers) {
    if (!reached.has(key({ c: m.c0, r: m.row }))) errors.push(`mover at cols ${m.c0}–${m.c1} can't be reached from the spawn`);
  }
  for (const a of awnings) {
    if (!reached.has(key({ c: a.c0, r: a.row })) && !reached.has(key({ c: a.c1, r: a.row }))) errors.push(`awning at cols ${a.c0}–${a.c1} can't be reached from the spawn`);
  }
  for (const l of ledges) {
    if (!reached.has(key(l))) errors.push(`ledge at col ${l.c} row ${l.r} can't be reached from the spawn by jumping`);
  }
  const tops = (c) => [surface[c], ...ledges.filter((l) => l.c === c).map((l) => l.r)].filter((v) => v !== null);

  // Gaps and step-ups along the intended left-to-right path.
  let lastSurface = null;
  let lastCol = -1;
  for (let c = 0; c < cols; c++) {
    if (surface[c] === null) continue;
    const gap = c - lastCol - 1;
    const limits = lastCol >= 0 ? limitsBetween(lastCol, c) : { gap: rules.maxGapTiles, step: rules.maxStepUpTiles };
    const low = limits.gap < rules.maxGapTiles || limits.step < rules.maxStepUpTiles ? ' under a low bridge' : '';
    const riding = lastCol >= 0 && gap > 0 ? movers.filter((m) => m.c0 > lastCol && m.c1 < c) : [];
    if (riding.length > 1) errors.push(`${riding.length} movers in the gap at cols ${lastCol + 1}–${c - 1} (max 1)`);
    if (riding.length) {
      // On at the near end, off at the far end.
      const m = riding[0];
      const on = m.c0 - lastCol - 1;
      const off = c - m.c1 - 1;
      if (on > rules.maxGapTiles) errors.push(`gap of ${on} tiles onto the ${m.kind} at col ${m.c0} (max ${rules.maxGapTiles})`);
      if (off > rules.maxGapTiles) errors.push(`gap of ${off} tiles off the ${m.kind} into col ${c} (max ${rules.maxGapTiles})`);
      if (lastSurface - m.row > rules.maxStepUpTiles) errors.push(`step-up of ${lastSurface - m.row} tiles onto the ${m.kind} at col ${m.c0}`);
      if (m.row - surface[c] > rules.maxStepUpTiles) errors.push(`step-up of ${m.row - surface[c]} tiles off the ${m.kind} into col ${c}`);
      lastSurface = surface[c];
      lastCol = c;
      continue;
    }
    if (lastCol >= 0 && gap > limits.gap) {
      errors.push(`gap of ${gap} tiles at cols ${lastCol + 1}–${c - 1}${low} (max ${limits.gap})`);
    }
    if (lastSurface !== null) {
      const rise = lastSurface - surface[c];
      if (rise > limits.step) {
        errors.push(`step-up of ${rise} tiles into col ${c}${low} (max ${limits.step})`);
      }
      // A wide gap and a step up together: a running jump taking off a tile
      // before the edge must still be above the far side when it gets there.
      if (gap > 0 && rise > 0 && !low) {
        const t = ((gap + 1) * tw) / J.runSpeed;
        const height = J.velocity * t - (J.gravity * t * t) / 2;
        if (height < rise * tw) errors.push(`gap of ${gap} tiles with a step-up of ${rise} at cols ${lastCol + 1}–${c - 1} (too far up and across in one jump)`);
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
  // Scenery pubs (drawn further back, e.g. the Kings Arms at Wareham) are never a way in.
  const pubs = (decorLayer?.objects ?? []).filter((o) => (o.type === 'pub' || o.class === 'pub') && !prop(o, 'scenery'));
  for (const f of finishes) {
    if (!pubs.some((p) => colOf(p.x) === colOf(f.x))) errors.push(`finish at col ${colOf(f.x)} is not at a pub door`);
  }
  info.finishPub = finishes[0] ? (prop(pubs.find((p) => colOf(p.x) === colOf(finishes[0].x)) ?? {}, 'pub') ?? null) : null;

  for (const o of [...spawns, ...checkpoints, ...finishes, ...bosses]) {
    if (crumbleCols.has(colOf(o.x))) errors.push(`${o.type} "${o.name}" at col ${colOf(o.x)} is on a crumbling crate`);
  }
  for (const o of [...spawns, ...checkpoints, ...finishes, ...bosses]) {
    const c = colOf(o.x);
    if (surface[c] === null) errors.push(`${o.type} "${o.name}" at col ${c} is over a gap`);
  }

  // Hazards: every surface hazard (glass, bucket) needs a safe tile at the same height either side.
  const SURFACE_HAZARDS = ['glass', 'bucket', 'kebab', 'cowpat'];
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

  // Level crossings: flat road with a safe tile to wait on before the barrier,
  // nothing to collect or trip over around it, and an open window long enough
  // to walk across comfortably.
  const crossings = ofType('crossing');
  const crossMs = (w) => ((w + 3 * tw) / J.runSpeed) * 1000; // from the waiting tile to clear of the far side
  for (const x of crossings) {
    const c0 = colOf(x.x);
    const c1 = colOf(x.x + x.width - 1);
    const s0 = surface[c0];
    for (let c = c0 - 2; c <= c1 + 1; c++) {
      if (surface[c] === null || surface[c] !== s0) errors.push(`level crossing at cols ${c0}–${c1}: col ${c} is not flat road`);
      if (glassCols.has(c)) errors.push(`level crossing at cols ${c0}–${c1}: hazard at col ${c}`);
      if (crumbleCols.has(c)) errors.push(`level crossing at cols ${c0}–${c1}: crumbling crate at col ${c}`);
    }
    for (const o of [...spawns, ...checkpoints, ...finishes]) {
      const c = colOf(o.x);
      if (c >= c0 - 1 && c <= c1 + 1) errors.push(`${o.type} "${o.name}" is on the level crossing at col ${c}`);
    }
    const need = crossMs(x.width) * CROSSING.crossMargin;
    if (CROSSING.openMs < need) errors.push(`level crossing at cols ${c0}–${c1} is open ${CROSSING.openMs} ms; crossing needs ${Math.round(need)} ms with margin`);
  }

  // Window throwers: the street they throw at must be flat ground at their
  // floor row across their whole range (the floor markers sit on it), and no
  // spawn or checkpoint may be in range (you'd respawn under fire).
  const throwers = ofType('thrower');
  const throwRange = THROWERS.rangeTiles;
  for (const t of throwers) {
    const c0 = colOf(t.x);
    const floorRow = prop(t, 'floorRow');
    for (let c = Math.max(0, c0 - throwRange); c <= Math.min(cols - 1, c0 + throwRange); c++) {
      if (surface[c] !== floorRow) errors.push(`thrower at col ${c0}: col ${c} in its range is not flat street at row ${floorRow}`);
    }
    for (const o of [...spawns, ...checkpoints]) {
      if (Math.abs(colOf(o.x) - c0) <= throwRange) errors.push(`${o.type} "${o.name}" is within range of the thrower at col ${c0}`);
    }
  }

  // Swans: patrol flat ground, with clear landing room beyond each end, no
  // surface hazards, and nowhere near where you (re)start or finish.
  const swans = ofType('swan');
  for (const sw of swans) {
    const c0 = colOf(sw.x);
    const c1 = colOf(sw.x + sw.width - 1);
    const row = prop(sw, 'surfaceRow');
    const k = rules.swanClearTiles;
    for (let c = c0 - k; c <= c1 + k; c++) {
      if (surface[c] !== row) errors.push(`swan at cols ${c0}–${c1}: col ${c} is not flat ground at row ${row}`);
      if (glassCols.has(c)) errors.push(`swan at cols ${c0}–${c1}: hazard at col ${c}`);
    }
    for (const o of [...spawns, ...checkpoints, ...finishes]) {
      const c = colOf(o.x);
      if (c >= c0 - k && c <= c1 + k) errors.push(`${o.type} "${o.name}" at col ${c} is on a swan's patrol`);
    }
  }

  // Seagulls: like swans, over flat ground away from where you (re)start or
  // finish, hovering out of reach, and slow enough that once one swoops away
  // you can run its stretch before it comes back.
  const gulls = ofType('gull');
  for (const g of gulls) {
    const c0 = colOf(g.x);
    const c1 = colOf(g.x + g.width - 1);
    const row = prop(g, 'surfaceRow');
    const k = GULLS.clearTiles;
    for (let c = c0 - k; c <= c1 + k; c++) {
      if (surface[c] !== row) errors.push(`gull at cols ${c0}–${c1}: col ${c} is not flat ground at row ${row}`);
      if (glassCols.has(c)) errors.push(`gull at cols ${c0}–${c1}: hazard at col ${c}`);
    }
    for (const o of [...spawns, ...checkpoints, ...finishes]) {
      const c = colOf(o.x);
      if (c >= c0 - k && c <= c1 + k) errors.push(`${o.type} "${o.name}" at col ${c} is under a gull`);
    }
    const need = (((c1 - c0 + 1 + 2 * k) * tw) / J.runSpeed) * 1000 * GULLS.crossMargin;
    const window = GULLS.passMs / 2 + GULLS.pauseMs;
    if (need > window) errors.push(`gull at cols ${c0}–${c1}: running under it takes ${Math.round(need)} ms with margin, it allows ${window}`);
    if (GULLS.hoverPx - 6 <= apex + J.bodyHeight) errors.push(`gulls hover at ${GULLS.hoverPx} px, within reach of a jump`);
  }

  // The departing train: the camera scrolls on by itself, so the stretch must
  // be passable without stopping: slower than a run, and nothing to wait for.
  const autoscrolls = ofType('autoscroll');
  if (AUTOSCROLL.speed > J.runSpeed * AUTOSCROLL.maxPace) {
    errors.push(`auto-scroll speed ${AUTOSCROLL.speed} px/s is over ${AUTOSCROLL.maxPace} of the run speed`);
  }
  for (const a of autoscrolls) {
    const c0 = colOf(a.x);
    const c1 = colOf(a.x + a.width - 1);
    const inside = (o) => colOf(o.x) >= c0 && colOf(o.x) <= c1;
    const inRange = (o) => colOf(o.x + (o.width || 0) - 1) >= c0 && colOf(o.x) <= c1;
    for (const t of ['mover', 'crossing', 'swan', 'gull', 'thrower', 'boss']) {
      for (const o of ofType(t).filter(inRange)) errors.push(`${t} at col ${colOf(o.x)} is inside the auto-scroll at cols ${c0}–${c1}`);
    }
    for (const o of [...spawns, ...checkpoints, ...finishes].filter(inside)) {
      errors.push(`${o.type} "${o.name}" at col ${colOf(o.x)} is inside the auto-scroll at cols ${c0}–${c1}`);
    }
    if (spawns[0] && colOf(spawns[0].x) > c0) errors.push(`auto-scroll at cols ${c0}–${c1} is before the spawn`);
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
  info.lowBridgeCols = ceiling.filter((v) => v !== null).length;
  info.crumbles = crumbles.length;
  info.crossings = crossings.length;
  info.throwers = throwers.length;
  info.movers = movers.length;
  info.swans = swans.length;
  info.gulls = gulls.length;
  info.awnings = awnings.length;
  info.autoscrolls = autoscrolls.length;
  info.boss = bosses.length ? prop(bosses[0], 'kind') : null;
  return { errors, info };
}

export function formatReport(name, { errors, info }) {
  const head = `${name}: ${errors.length ? `${errors.length} problem(s)` : 'OK'} · ${info.lengthPx ?? '?'} px (${
    info.screens ?? '?'
  } screens) · collectibles ${JSON.stringify(info.collectibles ?? {})} · hazards ${info.hazards ?? 0}${info.boss ? ` · boss ${info.boss}` : ''}`;
  return [head, ...errors.map((e) => `  ✗ ${e}`)].join('\n');
}
