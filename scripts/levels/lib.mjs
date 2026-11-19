// Shared building blocks for the level builders in scripts/levels/. Each
// level file exports `meta` (id, width in tiles, map properties) and a
// default `build(L)` that lays the level out with the helpers below. Run
// `npm run build:levels` to write every level to public/assets/levels/<id>.json
// (Tiled map format) and validate it; `npm run build:levels -- <id>` builds one.

import { TILESET } from '../../src/assets.js';
import { MOVERS } from '../../src/config.js';

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

  /** A run of slate rooftop at `row` (floating: the high road over the village). */
  function roof(c0, c1, row) {
    for (let c = c0; c <= c1; c++) set('ground', c, row, T.slate);
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

  /** A river filling a gap, its surface just below the banks. Falling in is a death. */
  function river(c0, c1) {
    for (let c = c0; c <= c1; c++) {
      set('background', c, SURFACE, T.waterHigh);
      set('background', c, SURFACE + 1, T.waterDeep);
    }
    addObject('hazard', 'river', c0 * TS, SURFACE * TS + 12, (c1 - c0 + 1) * TS, TS + 4, { kind: 'water' });
  }

  /**
   * A sunken trench of mud between two banks (the tank's road across the
   * heath): no ground, and the mud at the bottom is deadly. Pair with a `tank` mover.
   */
  function trench(c0, c1) {
    for (let c = c0; c <= c1; c++) set('background', c, SURFACE + 1, T.earth);
    addObject('hazard', 'mud', c0 * TS, (SURFACE + 1) * TS + 4, (c1 - c0 + 1) * TS, TS - 4, { kind: 'mud' });
  }

  /** A wooden jetty out in the river: a deck at the surface on posts in the water. */
  function jetty(c0, c1) {
    for (let c = c0; c <= c1; c++) {
      set('ground', c, SURFACE, T.jetty);
      set('ground', c, SURFACE + 1, T.pile);
    }
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
  const cowpat = (col, surfaceRow = SURFACE) => hazard('cowpat', col, surfaceRow);
  /** A crumbling crate filling one gap tile at `row` (its top is the surface). Stepping stone only. */
  const crumble = (col, row = SURFACE) => addObject('crumble', 'crumble', col * TS, row * TS, TS, TS);
  /**
   * A level crossing over the railway at cols c0–c1 of a flat road at
   * `surfaceRow`. `offsetMs` shifts where in its open/warn/closed cycle it starts.
   */
  const crossing = (c0, c1, offsetMs = 0, surfaceRow = SURFACE) => {
    for (let c = c0; c <= c1; c++) set('ground', c, surfaceRow, T.crossingDeck);
    return addObject('crossing', 'crossing', c0 * TS, surfaceRow * TS, (c1 - c0 + 1) * TS, 0, { offsetMs });
  };
  /** The level's boss. `tuning` names an entry of BOSS in src/config.js ('first' or 'final'). */
  const boss = (col, kind, surfaceRow = SURFACE, tuning = 'first') =>
    addObject('boss', kind, ...feet(col, surfaceRow), 0, 0, { kind, tuning });
  const zone = (name, c0, c1) => addObject('zone', name, c0 * TS, 0, (c1 - c0 + 1) * TS, ROWS * TS);
  const secret = (c0, c1, r0, r1) => addObject('secret', 'secret', c0 * TS, r0 * TS, (c1 - c0 + 1) * TS, (r1 - r0 + 1) * TS);
  /** A pub front at `col`. `scenery` draws it across the street, hazier, with no way in (never a finish). */
  const pub = (col, id, { scenery = false } = {}) =>
    addObject('pub', id, ...feet(col), 0, 0, scenery ? { pub: id, scenery } : { pub: id }, decor);
  const sign = (col, text) => addObject('sign', text, ...feet(col), 0, 0, { text }, decor);
  /** Village scenery, standing on the surface at `col`. `id` is a key of HOUSES in src/assets.js. */
  const house = (col, id) => addObject('house', id, ...feet(col), 0, 0, { house: id }, decor);
  const shop = (col, text) => addObject('shop', text, ...feet(col), 0, 0, { text }, decor);
  const lamp = (col) => addObject('lamp', 'lamp', ...feet(col), 0, 0, {}, decor);
  const stall = (col) => addObject('stall', 'stall', ...feet(col), 0, 0, {}, decor);
  /**
   * An angry local at a window, throwing beer mats at the street below. The
   * window is `dx` px across from the centre of `col` and `height` px above
   * the street at `floorRow`. `offsetMs` staggers it against other windows.
   */
  const thrower = (col, dx, height, floorRow = SURFACE, offsetMs = undefined) =>
    addObject('thrower', 'thrower', col * TS + TS / 2 + dx, floorRow * TS - height, 0, 0, {
      floorRow,
      ...(offsetMs === undefined ? {} : { offsetMs }),
    });
  /** A Friesian grazing by the line; `flip` faces it left. */
  const cow = (col, flip = false) => addObject('cow', 'cow', ...feet(col), 0, 0, { flip }, decor);
  /**
   * A moving platform (`kind` is a key of MOVERS in src/config.js: 'tank',
   * 'boat' or 'ferry') whose deck sweeps cols c0–c1 with its top at `row`: at one end its
   * left edge is at c0, at the other its right edge is at c1. `offsetMs`
   * shifts where in its cycle it starts.
   */
  const mover = (kind, c0, c1, row, offsetMs = 0) => {
    const deck = MOVERS[kind]?.deck;
    if (!deck) throw new Error(`unknown mover kind "${kind}"`);
    const travelPx = (c1 - c0 + 1) * TS - deck;
    if (travelPx <= 0) throw new Error(`mover at cols ${c0}–${c1} has no room to move`);
    return addObject('mover', kind, c0 * TS, row * TS, deck, 0, { kind, travelPx, offsetMs });
  };
  /** A swan patrolling cols c0–c1 of the surface at `surfaceRow`. Deadly to touch; jump it. */
  const swan = (c0, c1, surfaceRow = SURFACE) =>
    addObject('swan', 'swan', c0 * TS, surfaceRow * TS, (c1 - c0 + 1) * TS, 0, { surfaceRow });
  /**
   * A seagull over cols c0–c1 of the surface at `surfaceRow`: it hovers out of
   * reach over one end, then swoops across, down to head height in the middle
   * (GULLS in src/config.js). `offsetMs` shifts where in its cycle it starts.
   */
  const gull = (c0, c1, surfaceRow = SURFACE, offsetMs = 0) =>
    addObject('gull', 'gull', c0 * TS, surfaceRow * TS, (c1 - c0 + 1) * TS, 0, { surfaceRow, offsetMs });
  /**
   * A bouncy shop awning over cols c0–c1, its top at `row`: land on it and it
   * throws you much higher than a jump (AWNINGS). One-way: you pass up through it.
   */
  const awning = (c0, c1, row) => addObject('awning', 'awning', c0 * TS, row * TS, (c1 - c0 + 1) * TS, 0);
  /**
   * The departing train: from col c0 to the end of col c1 the camera scrolls on
   * by itself (AUTOSCROLL). Falling off the left of the screen is a death.
   */
  const autoscroll = (c0, c1) => addObject('autoscroll', 'autoscroll', c0 * TS, 0, (c1 - c0 + 1) * TS, ROWS * TS);
  /** A yacht moored in the water at `col` (scenery). */
  const yacht = (col) => addObject('yacht', 'yacht', col * TS + TS / 2, SURFACE * TS + 14, 0, 0, {}, decor); // hull at the waterline
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
    roof,
    embankment,
    carriage,
    crates,
    canopy,
    river,
    trench,
    jetty,
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
    cowpat,
    crumble,
    crossing,
    mover,
    swan,
    gull,
    awning,
    autoscroll,
    yacht,
    thrower,
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
    cow,
    toMap,
  };
}
