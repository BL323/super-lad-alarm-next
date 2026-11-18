// Shared building blocks for the level builders in scripts/levels/. Each
// level file exports `meta` (id, width in tiles, map properties) and a
// default `build(L)` that lays the level out with the helpers below. Run
// `npm run build:levels` to write every level to public/assets/levels/<id>.json
// (Tiled map format) and validate it; `npm run build:levels -- <id>` builds one.

import { TILESET } from '../../src/assets.js';

const T = TILESET.tiles;
const TS = TILESET.tileWidth;
export const ROWS = 12; // 192 px; the top 12 px sits above the 180 px screen
export const SURFACE = 10; // ground/platform surface row
export const ROOF = 8; // carriage roof row (2 tiles above the platform)

/**
 * A fresh, empty level `cols` tiles wide. Returns the building-block helpers
 * (all bound to this level) plus `toMap()`, which returns the Tiled JSON.
 */
export function createLevel({ cols, properties = {} }) {
  const COLS = cols;
  const layer = () => new Array(COLS * ROWS).fill(0);
  const layers = { background: layer(), ground: layer(), foreground: layer() };
  const objects = [];
  const decor = [];
  let nextId = 1;

  function set(name, col, row, tile) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) throw new Error(`tile out of range ${col},${row}`);
    layers[name][row * COLS + col] = tile + 1; // gid = index + 1
  }

  // --- Building blocks ----------------------------------------------------------

  function platform(c0, c1) {
    for (let c = c0; c <= c1; c++) {
      set('ground', c, SURFACE, T.platformTop);
      set('ground', c, SURFACE + 1, T.platformBody);
    }
  }

  /** Village pavement (kerb and road below): the street surface. */
  function pavement(c0, c1) {
    for (let c = c0; c <= c1; c++) {
      set('ground', c, SURFACE, T.pavement);
      set('ground', c, SURFACE + 1, T.road);
    }
  }

  /**
   * A low bridge over the line: a girder deck at `row` (solid, but only ever a
   * ceiling; the validator caps the jumps underneath it) with a railing on top.
   */
  function bridge(c0, c1, row) {
    for (let c = c0; c <= c1; c++) {
      set('ground', c, row, T.girder);
      if (row > 0) set('background', c, row - 1, T.parapet);
    }
  }

  function embankment(c0, c1) {
    for (let c = c0; c <= c1; c++) {
      set('ground', c, SURFACE, T.grassTop);
      set('ground', c, SURFACE + 1, T.earth);
    }
  }

  function carriage(c0, len) {
    const c1 = c0 + len - 1;
    for (let c = c0; c <= c1; c++) {
      const roof = c === c0 ? T.roofLeft : c === c1 ? T.roofRight : T.roofMid;
      const isDoor = c === c0 + 1 || c === c1 - 1;
      const isBogie = [c0 + 1, c0 + 2, c1 - 2, c1 - 1].includes(c);
      set('ground', c, ROOF, roof);
      set('ground', c, ROOF + 1, isDoor ? T.carriageDoor : T.carriageWindow);
      set('ground', c, ROOF + 2, isDoor ? T.carriageDoor : T.carriageLower);
      set('ground', c, ROOF + 3, isBogie ? T.bogie : T.underframe);
    }
  }

  /** Stack of crates at `col` from the surface up to (and including) `topRow`. */
  function crates(col, topRow) {
    for (let r = topRow; r < SURFACE; r++) set('ground', col, r, T.crate);
  }

  function canopy(c0, c1, row, posts) {
    for (let c = c0; c <= c1; c++) {
      set('foreground', c, row, T.canopy);
      set('foreground', c, row + 1, T.canopyValance);
    }
    for (const c of posts) for (let r = row + 2; r < SURFACE; r++) set('background', c, r, T.canopyPost);
  }

  function river(c0, c1) {
    for (let c = c0; c <= c1; c++) set('background', c, SURFACE + 1, T.water);
    addObject('hazard', 'river', c0 * TS, (SURFACE + 1) * TS + 6, (c1 - c0 + 1) * TS, TS - 6, { kind: 'water' });
  }

  // --- Objects -------------------------------------------------------------------

  function props(p) {
    return Object.entries(p).map(([name, value]) => ({
      name,
      type: typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'float') : typeof value === 'boolean' ? 'bool' : 'string',
      value,
    }));
  }

  function addObject(type, name, x, y, width = 0, height = 0, p = {}, list = objects) {
    const o = { id: nextId++, name, type, x, y, width, height, rotation: 0, visible: true };
    if (!width && !height) o.point = true;
    if (Object.keys(p).length) o.properties = props(p);
    list.push(o);
    return o;
  }

  // Points are given by tile column; `y` is the feet position (top of the surface row).
  const feet = (col, surfaceRow = SURFACE) => [col * TS + TS / 2, surfaceRow * TS];
  const spawn = (col) => addObject('spawn', 'spawn', ...feet(col));
  const checkpoint = (col, station) => addObject('checkpoint', station, ...feet(col), 0, 0, { station });
  const finish = (col) => addObject('finish', 'finish', ...feet(col));
  const pint = (col, row) => addObject('collectible', 'pint', col * TS + TS / 2, row * TS + TS / 2, 0, 0, { type: 'pint' });
  const espresso = (col, row) =>
    addObject('collectible', 'espresso-martini', col * TS + TS / 2, row * TS + TS / 2, 0, 0, { type: 'espresso' });
  /** A one-tile hazard (`glass`, `bucket`) sitting on the surface at `surfaceRow`. */
  const hazard = (kind, col, surfaceRow = SURFACE) =>
    addObject('hazard', kind, col * TS, (surfaceRow - 1) * TS, TS, TS, { kind });
  const glass = (col, surfaceRow = SURFACE) => hazard('glass', col, surfaceRow);
  const bucket = (col, surfaceRow = SURFACE) => hazard('bucket', col, surfaceRow);
  const kebab = (col, surfaceRow = SURFACE) => hazard('kebab', col, surfaceRow);
  /** The level's boss. `tuning` names an entry of BOSS in src/config.js ('first' or 'final'). */
  const boss = (col, kind, surfaceRow = SURFACE, tuning = 'first') =>
    addObject('boss', kind, ...feet(col, surfaceRow), 0, 0, { kind, tuning });
  const zone = (name, c0, c1) => addObject('zone', name, c0 * TS, 0, (c1 - c0 + 1) * TS, ROWS * TS);
  const secret = (c0, c1, r0, r1) => addObject('secret', 'secret', c0 * TS, r0 * TS, (c1 - c0 + 1) * TS, (r1 - r0 + 1) * TS);
  const pub = (col, id) => addObject('pub', id, ...feet(col), 0, 0, { pub: id }, decor);
  const sign = (col, text) => addObject('sign', text, ...feet(col), 0, 0, { text }, decor);
  /** Village scenery, standing on the surface at `col`. `id` is a key of HOUSES in src/assets.js. */
  const house = (col, id) => addObject('house', id, ...feet(col), 0, 0, { house: id }, decor);
  const shop = (col, text) => addObject('shop', text, ...feet(col), 0, 0, { text }, decor);
  const lamp = (col) => addObject('lamp', 'lamp', ...feet(col), 0, 0, {}, decor);
  const stall = (col) => addObject('stall', 'stall', ...feet(col), 0, 0, {}, decor);
  const easel = (col) => addObject('easel', 'easel', col * TS + TS / 2, (SURFACE + 1) * TS + 4, 0, 0, {}, decor);

  function toMap() {
    const tileLayer = (id, name, data) => ({
      id,
      name,
      type: 'tilelayer',
      x: 0,
      y: 0,
      width: COLS,
      height: ROWS,
      opacity: 1,
      visible: true,
      data,
    });

    const map = {
      type: 'map',
      version: '1.10',
      tiledversion: '1.10.2',
      orientation: 'orthogonal',
      renderorder: 'right-down',
      infinite: false,
      width: COLS,
      height: ROWS,
      tilewidth: TS,
      tileheight: TS,
      nextlayerid: 6,
      nextobjectid: nextId,
      properties: props(properties),
      tilesets: [
        {
          firstgid: 1,
          name: TILESET.name,
          image: 'tiles.png', // generated at runtime under the 'tiles' texture key
          imagewidth: TILESET.count * TS,
          imageheight: TS,
          tilewidth: TS,
          tileheight: TS,
          tilecount: TILESET.count,
          columns: TILESET.count,
          margin: 0,
          spacing: 0,
        },
      ],
      layers: [
        tileLayer(1, 'background', layers.background),
        tileLayer(2, 'ground', layers.ground),
        tileLayer(3, 'foreground', layers.foreground),
        { id: 4, name: 'objects', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects },
        { id: 5, name: 'decor', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: decor },
      ],
    };
    return map;
  }

  return {
    COLS,
    ROWS,
    SURFACE,
    ROOF,
    T,
    TS,
    set,
    platform,
    pavement,
    bridge,
    embankment,
    carriage,
    crates,
    canopy,
    river,
    addObject,
    spawn,
    checkpoint,
    finish,
    pint,
    espresso,
    hazard,
    glass,
    bucket,
    kebab,
    boss,
    zone,
    secret,
    pub,
    sign,
    easel,
    house,
    shop,
    lamp,
    stall,
    toMap,
  };
}
