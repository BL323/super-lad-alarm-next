// Placeholder art for the train-crawl theme, generated in code at boot. Each texture is created under a
// fixed key from src/assets.js. If real artwork has already been loaded under
// that key (e.g. in BootScene.preload), the placeholder is skipped.

import {
  TEX,
  PUBS,
  HOUSES,
  CHARACTERS,
  playerTextureKey,
  pubTextureKey,
  signTextureKey,
  houseTextureKey,
  shopTextureKey,
  PLAYER_FRAME,
  PLAYER_FRAMES,
  PINT_FRAME,
  ESPRESSO_FRAME,
  CHECKPOINT_FRAME,
  CONDUCTOR_FRAME,
  FINISH_FRAME,
  CONFETTI_FRAME,
  CROSSING_LIGHTS_FRAME,
  TILESET,
} from '../assets.js';
import { drawPixelText, measurePixelText } from './pixelFont.js';
import { CROSSING } from '../config.js';

// --- Player ---------------------------------------------------------------
// Every character is Naylor in a different outfit. A look = head rows (0–6)
// + torso rows (7–10); the arms-out and arms-up poses are derived from them,
// and legs are shared. Letters are coloured by the character's palette.

const PLAYER_LOOKS = {
  // Green school blazer, white shirt, green tie with a gold print, crest badge.
  senior: {
    head: [
      '................',
      '......HHHH......',
      '.....HHHHHH.....',
      '.....HSSSSS.....',
      '.....SKSSKS.....',
      '.....SSSSSS.....',
      '......SSSS......',
    ],
    torso: ['.....BCTTCB.....', '....SBBTTBPS....', '....SBBYTBBS....', '.....BBTBBB.....'],
  },
  // Modern navy admiral: white-topped peaked cap with gold badge, navy jacket,
  // white shirt and black tie, gold buttons and sleeve rings.
  'sea-lord': {
    head: [
      '......CCCC......',
      '.....CCCCCC.....', // white cap top
      '.....KKGGKK.....', // black band, gold badge
      '.....HSSSGGG....', // forehead + gold-braided peak jutting forward
      '.....SKSSKS.....',
      '.....SSSSSS.....',
      '......SSSS......',
    ],
    torso: ['.....BCKKCB.....', '....BBBKKBBB....', '....GBGBBGBG....', '....SBBBBBBS....'],
  },
  // Blue polo with a lighter collar and placket.
  casual: {
    head: [
      '................',
      '......HHHH......',
      '.....HHHHHH.....',
      '.....HSSSSS.....',
      '.....SKSSKS.....',
      '.....SSSSSS.....',
      '......SSSS......',
    ],
    torso: ['.....LLBBLL.....', '....SBBLBBBS....', '....SBBBBBBS....', '.....BBBBBB.....'],
  },
};

const setAt = (row, col, ch) => row.slice(0, col) + ch + row.slice(col + 1);
const ARM = 'B'; // sleeves use the jacket/top colour

/** Upper body (11 rows) for a look, in one of three arm poses. */
function playerBody(look, pose = 'down') {
  const head = [...look.head];
  const torso = [...look.torso];
  if (pose === 'out') {
    // Arms flung out: sleeves reach to cols 3 and 12, hands beyond.
    torso[1] = setAt(setAt(setAt(setAt(torso[1], 3, 'S'), 4, ARM), 11, ARM), 12, 'S');
    torso[2] = setAt(setAt(torso[2], 4, ARM), 11, ARM);
  } else if (pose === 'up') {
    // Arms raised beside the head.
    for (const r of [2, 3, 4]) head[r] = setAt(setAt(head[r], 2, 'S'), 13, 'S');
    for (const r of [5, 6]) head[r] = setAt(setAt(head[r], 3, ARM), 12, ARM);
    torso[0] = setAt(setAt(torso[0], 4, ARM), 11, ARM);
    for (const r of [1, 2, 3]) torso[r] = setAt(setAt(torso[r], 4, '.'), 11, '.');
  }
  return [...head, ...torso];
}

// Leg rows (4 rows) plus one blank row at the bottom.
const LEGS = {
  stand: ['.....DDDDDD.....', '.....DD..DD.....', '.....DD..DD.....', '....WWW..WWW....'],
  stride: ['.....DDDDDD.....', '....DD....DD....', '...DD......DD...', '..WWW......WWW..'],
  pass: ['.....DDDDDD.....', '......DDDD......', '......DDDD......', '......WWWW......'],
  tuck: ['.....DDDDDD.....', '....DDD..DDD....', '....WW....WW....', '................'],
  dangle: ['.....DDDDDD.....', '.....DD..DD.....', '....DD....DD....', '...WW......WW...'],
};
const BLANK = '................';

function frame(body, legs) {
  return [...body, ...legs, BLANK];
}

/** All 8 frames for a look. Order must match PLAYER_FRAMES in src/assets.js. */
function playerArt(look) {
  const body = playerBody(look);
  const out = playerBody(look, 'out');
  const up = playerBody(look, 'up');
  const bob = (legs) => [BLANK, ...body.slice(0, 10), ...legs, BLANK]; // body drops 1px
  return [
    frame(body, LEGS.stand), // 0 idle
    [BLANK, ...body, ...LEGS.stand.slice(1), BLANK], // 1 idle (bob down 1px)
    frame(body, LEGS.stride), // 2 run
    bob(LEGS.pass), // 3 run (passing)
    frame(out, LEGS.stride), // 4 run
    bob(LEGS.pass), // 5 run (passing)
    frame(up, LEGS.tuck), // 6 jump
    frame(out, LEGS.dangle), // 7 fall
  ];
}

function drawRows(ctx, rows, ox, oy, palette) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

// --- Helpers ---------------------------------------------------------------

const C = {
  ink: '#1a1c2c',
  white: '#fff1e8',
  cream: '#f4e4c1',
  creamDark: '#d8c8a0',
  grey: '#c2c3c7',
  midGrey: '#83769c',
  darkGrey: '#5f574f',
  concrete: '#9e9ea6',
  concreteDark: '#7a7a82',
  yellow: '#ffec27',
  gold: '#ffcd75',
  orange: '#ffa300',
  brick: '#ab5236',
  mortar: '#743626',
  wood: '#8f563b',
  woodDark: '#5d3a1a',
  green: '#2f6b3a', // carriage livery
  greenDark: '#1e4a27',
  grass: '#3fa34d',
  grassDark: '#2b7a38',
  glassBlue: '#1d2b53',
  glassHi: '#5b6ee1',
  water: '#29adff',
  waterDark: '#1e6fbf',
  waterLight: '#a0e4ff',
  red: '#ff004d',
  redDim: '#4a1020',
  greenLit: '#00e436',
  greenDim: '#16341d',
  skin: '#f4c49a',
  stout: '#1a1c2c',
  ruby: '#5d275d',
  coffee: '#4a2a1a',
  bean: '#2a1508',
};

function makeSheet(scene, key, frameW, frameH, count, draw) {
  const tex = scene.textures.createCanvas(key, frameW * count, frameH);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.translate(i * frameW, 0);
    draw(ctx, i);
    ctx.restore();
    tex.add(i, 0, i * frameW, 0, frameW, frameH);
  }
  tex.refresh();
  return tex;
}

function makeImage(scene, key, w, h, draw) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  tex.refresh();
  return tex;
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function px(ctx, color, x, y) {
  rect(ctx, color, x, y, 1, 1);
}

function bricks(ctx, x, y, w, h, base = C.brick, mortar = C.mortar) {
  rect(ctx, base, x, y, w, h);
  for (let row = 0; row * 4 < h; row++) {
    const ry = y + row * 4 + 3;
    if (ry < y + h) rect(ctx, mortar, x, ry, w, 1);
    const off = row % 2 ? 4 : 0;
    for (let bx = x + off; bx < x + w; bx += 8) rect(ctx, mortar, bx, y + row * 4, 1, Math.min(3, y + h - (y + row * 4)));
  }
}

// --- Individual textures -----------------------------------------------------

// One sprite sheet per character: same frames, different palette.
function makePlayer(scene, character) {
  const { width, height } = PLAYER_FRAME;
  const count = Math.max(...Object.values(PLAYER_FRAMES).flat()) + 1;
  const art = playerArt(PLAYER_LOOKS[character.look] ?? PLAYER_LOOKS.casual);
  makeSheet(scene, playerTextureKey(character.id), width, height, count, (ctx, i) =>
    drawRows(ctx, art[i], 0, 0, character.palette),
  );
}

// Pint of stout in a curved tulip pint glass (no branding): a creamy domed
// head, full width through the upper third, then a gentle taper to a narrower
// base. Fills the 16 px frame height so it reads tall and slim.
//
// Each row: [left col, right col, part]. `soft` rows only draw their outer
// pixels in the glass-edge colour, which smooths the step of the taper.
const PINT_ROWS = [
  [5, 10, 'headTop'], // 0: dome
  [4, 11, 'head'], // 1
  [4, 11, 'headShade'], // 2: where head meets stout
  [4, 11, 'stout'], // 3: rim
  [4, 11, 'stout'], // 4
  [4, 11, 'stout'], // 5: widest
  [4, 11, 'stout'], // 6
  [4, 11, 'stout'], // 7
  [4, 11, 'soft'], // 8: taper begins
  [4, 11, 'soft'], // 9
  [5, 10, 'stout'], // 10
  [5, 10, 'stout'], // 11
  [5, 10, 'stout'], // 12
  [5, 10, 'stout'], // 13
  [5, 10, 'ruby'], // 14: light through the bottom of the stout
  [5, 10, 'base'], // 15: thick glass base
];
// Left-side sheen follows the curve inwards as the glass tapers.
const PINT_SHEEN = { 4: 5, 5: 5, 6: 5, 7: 5, 8: 6, 9: 6, 10: 6, 11: 6, 12: 6 };
const PINT_COLORS = {
  headTop: '#f4ecda',
  head: '#e6d8bc',
  headShade: '#c8b28c',
  stout: '#14100e',
  edge: '#4a4450', // glass edge, keeps the pint visible on dark backgrounds
  sheen: '#423b4a',
  rimShine: '#2e2833', // faint reflection on the right of the bulge
  ruby: '#3a1a12',
  base: '#9aa0aa',
  baseHi: '#c2c3c7',
};

function makePint(scene) {
  const { width, height, count } = PINT_FRAME;
  makeSheet(scene, TEX.PINT, width, height, count, (ctx, i) => drawPint(ctx, i));
}

/**
 * Draws pint frame `i` (0 = no glint) at 0,0 on anything with a canvas-style
 * `fillStyle`/`fillRect`. Also used by scripts/build-icons.mjs for the
 * home-screen icons.
 */
export function drawPint(ctx, i = 0) {
  const P = PINT_COLORS;
  PINT_ROWS.forEach(([x0, x1, part], y) => {
    const w = x1 - x0 + 1;
    switch (part) {
      case 'headTop':
        rect(ctx, P.headTop, x0, y, w, 1);
        break;
      case 'head':
        rect(ctx, P.head, x0, y, w, 1);
        rect(ctx, P.headTop, x0 + 2, y, w - 4, 1);
        break;
      case 'headShade':
        rect(ctx, P.headShade, x0, y, w, 1);
        break;
      case 'base':
        rect(ctx, P.base, x0, y, w, 1);
        rect(ctx, P.baseHi, x0 + 2, y, w - 4, 1);
        break;
      case 'soft':
        rect(ctx, P.stout, x0 + 1, y, w - 2, 1);
        px(ctx, P.edge, x0, y);
        px(ctx, P.edge, x1, y);
        break;
      default: // stout, ruby
        rect(ctx, part === 'ruby' ? P.ruby : P.stout, x0, y, w, 1);
        px(ctx, P.edge, x0, y);
        px(ctx, P.edge, x1, y);
    }
  });
  for (const [y, x] of Object.entries(PINT_SHEEN)) px(ctx, P.sheen, x, Number(y));
  for (const y of [5, 6, 7]) px(ctx, P.rimShine, 10, y);
  if (i > 0) {
    const y = 3 + i * 2; // glint travelling down the curve: rows 5, 7, 9
    px(ctx, C.white, PINT_SHEEN[y], y);
  }
}

function makeEspresso(scene) {
  const { width, height, count } = ESPRESSO_FRAME;
  makeSheet(scene, TEX.ESPRESSO, width, height, count, (ctx, i) => {
    // V-shaped martini bowl
    const bowl = [
      [3, 12], // row 3 (rim)
      [3, 12],
      [4, 11],
      [5, 10],
      [6, 9],
      [7, 8],
    ];
    bowl.forEach(([x0, x1], r) => {
      const y = 3 + r;
      px(ctx, C.grey, x0, y);
      px(ctx, C.grey, x1, y);
      if (x1 - x0 > 1) rect(ctx, r < 2 ? C.cream : C.coffee, x0 + 1, y, x1 - x0 - 1, 1);
    });
    [5, 7, 9].forEach((x) => rect(ctx, C.bean, x, 3, 2, 1)); // coffee beans on the crema
    rect(ctx, C.grey, 7, 9, 2, 4); // stem
    rect(ctx, C.grey, 4, 13, 8, 1); // foot
    if (i === 1) {
      px(ctx, C.white, 13, 1);
      px(ctx, C.white, 12, 2);
      px(ctx, C.white, 14, 2);
      px(ctx, C.white, 13, 3);
    }
  });
}

// Broken glass: shards of bottle green, brown and clear glass.
function makeGlass(scene) {
  makeImage(scene, TEX.GLASS, 16, 16, (ctx) => {
    const shards = [
      { x: 1, w: 3, h: 6, c: '#3e8948' },
      { x: 4, w: 2, h: 3, c: '#c7e8f3' },
      { x: 6, w: 3, h: 7, c: '#c7e8f3' },
      { x: 9, w: 2, h: 4, c: '#3e8948' },
      { x: 11, w: 3, h: 6, c: '#8f4a1c' },
      { x: 14, w: 2, h: 3, c: '#c7e8f3' },
    ];
    for (const s of shards) {
      for (let r = 0; r < s.h; r++) {
        const w = Math.max(1, Math.ceil((s.w * (r + 1)) / s.h));
        rect(ctx, s.c, s.x + Math.floor((s.w - w) / 2), 15 - s.h + r, w, 1);
      }
      px(ctx, C.white, s.x + Math.floor(s.w / 2), 16 - s.h);
    }
    rect(ctx, C.darkGrey, 0, 15, 16, 1);
  });
}

// Fried-chicken bucket: red and white stripes, drumsticks poking out. No branding.
function makeBucket(scene) {
  makeImage(scene, TEX.BUCKET, 16, 16, (ctx) => {
    // Drumsticks: golden-brown meat with a white bone tip.
    for (const [x, y] of [[3, 3], [7, 1], [10, 3]]) {
      rect(ctx, '#c97a2a', x, y + 1, 3, 3);
      rect(ctx, '#e8a94a', x, y + 1, 1, 2); // crispy highlight
      rect(ctx, C.white, x + 1, y, 1, 1); // bone
    }
    rect(ctx, '#a35f1f', 2, 6, 12, 1); // more chicken at the rim
    // Bucket: tapers from 12 px at the rim to 10 px at the base.
    for (let y = 7; y < 16; y++) {
      const inset = y >= 12 ? 3 : 2;
      for (let x = inset; x < 16 - inset; x++) {
        rect(ctx, Math.floor((x - 2) / 2) % 2 === 0 ? '#e43b44' : C.white, x, y, 1, 1);
      }
      px(ctx, '#7e2553', inset, y); // outline
      px(ctx, '#7e2553', 15 - inset, y);
    }
    rect(ctx, C.white, 2, 7, 12, 1); // rim
    rect(ctx, '#7e2553', 3, 15, 10, 1); // base
  });
}

// Railway signal: red (inactive) → green (active).
function makeCheckpoint(scene) {
  const { width, height } = CHECKPOINT_FRAME;
  makeSheet(scene, TEX.CHECKPOINT, width, height, 2, (ctx, i) => {
    const active = i === CHECKPOINT_FRAME.active;
    rect(ctx, C.darkGrey, 3, 30, 10, 2); // base
    rect(ctx, C.darkGrey, 7, 13, 2, 17); // post
    rect(ctx, C.ink, 4, 1, 8, 12); // head
    rect(ctx, C.white, 4, 1, 8, 1); // backboard trim
    const lamp = (y, color) => {
      rect(ctx, color, 6, y, 4, 3);
      rect(ctx, color, 7, y - 1, 2, 5);
    };
    lamp(4, active ? C.redDim : C.red);
    lamp(9, active ? C.greenLit : C.greenDim);
    if (active) {
      px(ctx, C.white, 7, 9);
    } else {
      px(ctx, C.white, 7, 4);
    }
  });
}

// Finish: The Avocet's front door. Closed and padlocked while the Conductor
// guards it; open with warm light spilling out once he's beaten.
function makeFinish(scene) {
  const { width: w, height: h } = FINISH_FRAME;
  makeSheet(scene, TEX.FINISH, w, h, 2, (ctx, i) => {
    rect(ctx, '#3a2414', 0, 0, w, h); // frame
    if (i === FINISH_FRAME.closed) {
      rect(ctx, C.woodDark, 1, 1, w - 2, h - 1);
      rect(ctx, C.gold, 2, 2, w - 4, 4); // fanlight
      rect(ctx, C.woodDark, 6, 2, 1, 4);
      for (const [x, y, ph] of [[2, 8, 6], [8, 8, 6], [2, 16, 8], [8, 16, 8]]) rect(ctx, C.wood, x, y, 4, ph); // panels
      px(ctx, C.orange, 11, 15); // knob
      // Padlock
      rect(ctx, C.grey, 5, 11, 1, 2);
      rect(ctx, C.grey, 8, 11, 1, 2);
      rect(ctx, C.grey, 6, 10, 2, 1);
      rect(ctx, C.yellow, 4, 13, 6, 4);
      px(ctx, C.ink, 7, 14);
      px(ctx, C.ink, 7, 15);
    } else {
      rect(ctx, C.gold, 1, 1, w - 2, h - 1); // warm light inside
      rect(ctx, '#ffe9a8', 4, 3, w - 6, h - 6);
      rect(ctx, C.woodDark, 1, 1, 3, h - 1); // door swung open
      rect(ctx, C.wood, 2, 4, 1, h - 8);
      px(ctx, C.orange, 3, 15);
    }
  });
}

function makeConfetti(scene) {
  const colors = ['#ff004d', '#ffec27', '#00e436', '#29adff', '#ff77a8', '#ffa300'];
  const { width, height, count } = CONFETTI_FRAME;
  makeSheet(scene, TEX.CONFETTI, width, height, count, (ctx, i) => rect(ctx, colors[i], 0, 0, width, height));
}

function makeTiles(scene) {
  const { tileWidth: w, tileHeight: h, tiles: t, count } = TILESET;
  makeSheet(scene, TEX.TILES, w, h, count, (ctx, i) => {
    switch (i) {
      case t.platformTop:
        bricks(ctx, 0, 6, w, 10);
        rect(ctx, C.concrete, 0, 0, w, 6); // coping
        rect(ctx, C.grey, 0, 0, w, 1);
        rect(ctx, C.yellow, 0, 2, w, 1); // safety line
        rect(ctx, C.concreteDark, 0, 5, w, 1);
        rect(ctx, C.concreteDark, 0, 0, 1, 5);
        break;
      case t.platformBody:
        bricks(ctx, 0, 0, w, h);
        break;
      case t.roofLeft:
      case t.roofMid:
      case t.roofRight:
        rect(ctx, '#6b6b73', 0, 0, w, 5); // roof
        rect(ctx, '#9a9aa2', 0, 0, w, 1);
        rect(ctx, C.ink, 0, 5, w, 1); // gutter
        rect(ctx, C.green, 0, 6, w, 10);
        rect(ctx, C.cream, 0, 13, w, 1); // waist stripe
        if (i === t.roofLeft) {
          ctx.clearRect(0, 0, 2, 1);
          ctx.clearRect(0, 1, 1, 1);
          rect(ctx, C.greenDark, 0, 6, 1, 10);
        }
        if (i === t.roofRight) {
          ctx.clearRect(w - 2, 0, 2, 1);
          ctx.clearRect(w - 1, 1, 1, 1);
          rect(ctx, C.greenDark, w - 1, 6, 1, 10);
        }
        break;
      case t.carriageWindow:
        rect(ctx, C.green, 0, 0, w, h);
        rect(ctx, C.cream, 1, 1, 14, 11);
        rect(ctx, C.glassBlue, 2, 2, 12, 8);
        rect(ctx, C.glassHi, 3, 3, 3, 1);
        rect(ctx, C.glassHi, 3, 4, 1, 2);
        rect(ctx, C.greenDark, 0, 14, w, 1);
        break;
      case t.carriageDoor:
        rect(ctx, C.green, 0, 0, w, h);
        rect(ctx, C.greenDark, 3, 0, 1, h);
        rect(ctx, C.greenDark, 12, 0, 1, h);
        rect(ctx, C.cream, 5, 1, 6, 7);
        rect(ctx, C.glassBlue, 6, 2, 4, 5);
        px(ctx, C.glassHi, 6, 2);
        rect(ctx, C.orange, 10, 10, 1, 2); // handle
        break;
      case t.carriageLower:
        rect(ctx, C.green, 0, 0, w, h);
        rect(ctx, C.greenDark, 0, 2, w, 1);
        rect(ctx, C.greenDark, 0, 12, w, 1);
        break;
      case t.bogie:
        rect(ctx, C.ink, 0, 0, w, 4); // solebar
        rect(ctx, C.darkGrey, 2, 5, 12, 2); // bogie frame
        for (let y = -4; y <= 4; y++) {
          const hw = Math.round(Math.sqrt(16 - y * y + 4));
          rect(ctx, C.darkGrey, 8 - hw, 11 + y, hw * 2, 1);
        }
        rect(ctx, C.grey, 7, 10, 2, 2); // hub
        break;
      case t.underframe:
        rect(ctx, C.ink, 0, 0, w, 4);
        rect(ctx, '#2a2c3c', 3, 4, 10, 4);
        break;
      case t.crate:
        rect(ctx, C.woodDark, 0, 0, w, h);
        rect(ctx, C.wood, 1, 1, 14, 14);
        rect(ctx, C.woodDark, 1, 5, 14, 1);
        rect(ctx, C.woodDark, 1, 10, 14, 1);
        for (let d = 1; d < 15; d++) {
          px(ctx, C.orange, d, d);
          px(ctx, C.orange, 15 - d, d);
        }
        break;
      case t.grassTop:
      case t.earth:
        rect(ctx, C.brick, 0, 0, w, h);
        [[3, 6], [10, 4], [6, 11], [13, 12], [1, 13]].forEach(([x, y]) => rect(ctx, '#7e2553', x, y, 2, 1));
        if (i === t.grassTop) {
          rect(ctx, C.grass, 0, 0, w, 4);
          rect(ctx, C.grassDark, 0, 4, w, 1);
          [1, 5, 9, 13].forEach((x) => px(ctx, C.grassDark, x, 5));
        }
        break;
      case t.canopy:
        rect(ctx, '#4a6b4f', 0, 0, w, h);
        for (let x = 1; x < w; x += 4) rect(ctx, '#3a5a3f', x, 0, 1, h);
        rect(ctx, '#6a8b6f', 0, 0, w, 1);
        break;
      case t.canopyValance:
        rect(ctx, C.cream, 0, 0, w, 9);
        for (let x = 2; x < w; x += 4) rect(ctx, C.creamDark, x, 0, 1, 9);
        for (let tooth = 0; tooth < 4; tooth++) {
          for (let r = 0; r < 4; r++) rect(ctx, C.cream, tooth * 4 + r / 2, 9 + r, 4 - r, 1);
        }
        break;
      case t.canopyPost:
        rect(ctx, C.greenDark, 7, 0, 2, h);
        rect(ctx, C.greenDark, 5, 0, 6, 2);
        rect(ctx, C.greenDark, 6, 2, 4, 1);
        break;
      case t.water:
        rect(ctx, C.water, 0, 5, w, 11);
        rect(ctx, C.waterLight, 1, 4, 5, 1);
        rect(ctx, C.waterLight, 9, 5, 4, 1);
        rect(ctx, C.waterDark, 3, 10, 6, 1);
        break;
      case t.waterDeep:
        rect(ctx, C.waterDark, 0, 0, w, h);
        rect(ctx, C.water, 2, 4, 5, 1);
        rect(ctx, C.water, 9, 11, 5, 1);
        break;
      case t.girder:
        // Riveted steel box girder seen side-on, painted bridge blue.
        rect(ctx, '#3b5d8a', 0, 0, w, h);
        rect(ctx, '#5b7fb0', 0, 0, w, 2); // top flange
        rect(ctx, '#2a4466', 0, 14, w, 2); // bottom flange
        rect(ctx, '#2a4466', 0, 7, w, 1);
        for (const x of [2, 7, 12]) {
          px(ctx, '#9ab4d6', x, 3);
          px(ctx, '#9ab4d6', x, 11);
        }
        rect(ctx, '#2a4466', 15, 2, 1, 12); // panel joint
        break;
      case t.parapet:
        // Iron railing standing on the deck (bottom of the tile).
        rect(ctx, '#2a4466', 0, 6, w, 2); // top rail
        rect(ctx, '#2a4466', 0, 14, w, 2); // bottom rail
        for (let x = 1; x < w; x += 4) rect(ctx, '#2a4466', x, 8, 1, 6);
        break;
      case t.pavement:
        // Paving slabs, a granite kerb and the road edge below.
        rect(ctx, '#b8b8c0', 0, 0, w, 8);
        rect(ctx, '#d4d4dc', 0, 0, w, 1);
        rect(ctx, '#8e8e98', 7, 1, 1, 7); // slab joint
        rect(ctx, '#8e8e98', 15, 1, 1, 7);
        rect(ctx, '#8e8e98', 0, 4, 7, 1);
        rect(ctx, '#d0ccc4', 0, 8, w, 3); // kerb
        rect(ctx, '#9a968e', 0, 11, w, 1);
        rect(ctx, '#3a3a46', 0, 12, w, 4); // road
        break;
      case t.road:
        rect(ctx, '#3a3a46', 0, 0, w, h);
        [[2, 3], [9, 7], [5, 12], [13, 10]].forEach(([x, y]) => px(ctx, '#4e4e5c', x, y));
        break;
      case t.slate:
        // Slate roof seen from the side: a lead ridge on top, rows of slates below.
        rect(ctx, '#4a4a58', 0, 0, w, h);
        rect(ctx, '#83769c', 0, 0, w, 2); // ridge
        rect(ctx, '#2e2e3a', 0, 2, w, 1);
        for (let y = 5; y < h; y += 4) {
          rect(ctx, '#3a3a46', 0, y, w, 1);
          for (let x = (y % 8 === 5 ? 0 : 4); x < w; x += 8) rect(ctx, '#3a3a46', x, y - 3, 1, 3);
        }
        break;
      case t.jetty:
        // Weathered planks on a pair of posts, seen side-on, over the river.
        rect(ctx, C.water, 0, 10, w, 6);
        rect(ctx, C.waterLight, 5, 10, 5, 1);
        rect(ctx, C.wood, 0, 0, w, 4);
        rect(ctx, '#b07850', 0, 0, w, 1);
        rect(ctx, C.woodDark, 0, 4, w, 1);
        rect(ctx, C.woodDark, 7, 1, 1, 3); // plank joint
        rect(ctx, C.woodDark, 2, 5, 3, 11); // posts
        rect(ctx, C.woodDark, 11, 5, 3, 11);
        rect(ctx, C.wood, 3, 5, 1, 11);
        rect(ctx, C.wood, 12, 5, 1, 11);
        rect(ctx, C.woodDark, 4, 7, 8, 1); // cross brace
        break;
      case t.pile:
        // The posts going down into the deep water, weed growing on them.
        rect(ctx, C.waterDark, 0, 0, w, h);
        rect(ctx, C.water, 6, 4, 4, 1);
        rect(ctx, '#2f5d4a', 2, 0, 3, 16);
        rect(ctx, '#2f5d4a', 11, 0, 3, 16);
        rect(ctx, '#2f6b3a', 2, 1, 3, 2); // weed
        rect(ctx, '#2f6b3a', 11, 3, 3, 2);
        break;
      case t.waterHigh:
        // The river's surface, 10 px down: just below the quay.
        rect(ctx, C.water, 0, 10, w, 6);
        rect(ctx, C.waterLight, 1, 10, 5, 1);
        rect(ctx, C.waterLight, 10, 11, 4, 1);
        break;
      case t.crossingDeck:
        // Rubber crossing panels with the two rail heads set flush, seen end-on.
        rect(ctx, '#2a2c3c', 0, 0, w, h);
        rect(ctx, '#4e4e5c', 0, 0, w, 1);
        rect(ctx, '#c2c3c7', 3, 0, 3, 2); // rail heads
        rect(ctx, '#c2c3c7', 10, 0, 3, 2);
        rect(ctx, '#5f574f', 1, 4, 14, 2); // sleeper below
        rect(ctx, '#ffec27', 0, 12, w, 1); // yellow box marking
        break;
    }
  });
}

// Rolling Dorset hills, 320 px wide so it tiles seamlessly.
function makeHills(scene) {
  const W = 320;
  const H = 64;
  makeImage(scene, TEX.HILLS, W, H, (ctx) => {
    const tau = Math.PI * 2;
    for (let x = 0; x < W; x++) {
      const far = Math.round(26 + 7 * Math.sin((tau * 2 * x) / W) + 4 * Math.sin((tau * 5 * x) / W + 1));
      const near = Math.round(42 + 6 * Math.sin((tau * 3 * x) / W + 2) + 3 * Math.sin((tau * 7 * x) / W));
      rect(ctx, '#8fcf9a', x, far, 1, H - far);
      rect(ctx, '#5da868', x, near, 1, H - near);
    }
    // Hedgerows
    for (let x = 6; x < W; x += 23) rect(ctx, '#3f7f48', x, 46 + ((x * 7) % 9), 6, 2);
  });
}

function makeEasel(scene) {
  makeImage(scene, TEX.EASEL, 16, 20, (ctx) => {
    for (let y = 0; y < 20; y++) {
      px(ctx, C.wood, 7 - Math.floor(y / 4), y); // legs
      px(ctx, C.wood, 8 + Math.floor(y / 4), y);
    }
    rect(ctx, C.white, 2, 3, 12, 9); // canvas
    rect(ctx, C.wood, 2, 12, 12, 1);
    rect(ctx, C.red, 4, 5, 3, 3); // a masterpiece
    rect(ctx, C.water, 8, 6, 4, 2);
    rect(ctx, C.yellow, 6, 9, 5, 1);
  });
}

// Traditional pub front, 96×80, with its name on the fascia.
function makePub(scene, id, def) {
  const W = 96;
  const H = 80;
  makeImage(scene, pubTextureKey(id), W, H, (ctx) => {
    // Chimney and roof
    if (def.chimney) bricks(ctx, 72, 0, 8, 14);
    else bricks(ctx, 70, 4, 8, 10);
    rect(ctx, C.darkGrey, def.chimney ? 71 : 69, def.chimney ? 0 : 4, 10, 2);
    for (let r = 0; r < 12; r++) rect(ctx, def.roof, 12 - r, 8 + r, W - 24 + r * 2, 1);
    rect(ctx, C.ink, 0, 20, W, 1);

    // Walls
    if (def.wall === 'brick') bricks(ctx, 2, 21, W - 4, H - 21);
    else {
      rect(ctx, '#eae6dc', 2, 21, W - 4, H - 21);
      rect(ctx, '#cfc8b8', 2, H - 6, W - 4, 6); // plinth
    }

    // Upper windows
    for (const x of [12, 42, 72]) {
      rect(ctx, C.white, x - 1, 24, 14, 13);
      rect(ctx, C.glassBlue, x, 25, 12, 11);
      rect(ctx, C.white, x + 5, 25, 2, 11);
      rect(ctx, C.white, x, 30, 12, 1);
    }

    // Fascia with the pub name
    rect(ctx, C.greenDark, 4, 40, W - 8, 10);
    rect(ctx, C.gold, 4, 40, W - 8, 1);
    rect(ctx, C.gold, 4, 49, W - 8, 1);
    const tw = measurePixelText(def.name);
    drawPixelText(ctx, def.name, Math.round((W - tw) / 2), 43, C.gold);

    // Ground floor: two lit windows and a door
    for (const x of [8, 64]) {
      rect(ctx, C.woodDark, x - 1, 53, 26, 20);
      rect(ctx, C.gold, x, 54, 24, 18);
      rect(ctx, C.woodDark, x + 8, 54, 1, 18);
      rect(ctx, C.woodDark, x + 16, 54, 1, 18);
      rect(ctx, C.woodDark, x, 62, 24, 1);
      if (def.angryLocals) {
        for (const fx of [x + 2, x + 17]) {
          rect(ctx, C.skin, fx, 57, 5, 5); // face
          px(ctx, C.red, fx, 60); // red cheeks
          px(ctx, C.red, fx + 4, 60);
          px(ctx, C.ink, fx, 57); // angry brows \ /
          px(ctx, C.ink, fx + 1, 58);
          px(ctx, C.ink, fx + 4, 57);
          px(ctx, C.ink, fx + 3, 58);
          rect(ctx, C.ink, fx + 1, 61, 3, 1); // scowl
        }
      }
    }
    rect(ctx, C.woodDark, 41, 54, 14, H - 54); // door
    rect(ctx, C.gold, 43, 56, 10, 4); // fanlight
    px(ctx, C.orange, 52, 68); // knob
  });
}

// --- Village scenery ------------------------------------------------------

// A dropped doner kebab: pitta, meat, salad and a splash of chilli sauce,
// spilling out of its paper wrapper. Sits on the pavement.
function makeKebab(scene) {
  makeImage(scene, TEX.KEBAB, 16, 16, (ctx) => {
    rect(ctx, C.white, 1, 12, 9, 3); // paper wrapper
    rect(ctx, C.grey, 1, 14, 9, 1);
    for (let x = 3; x < 15; x++) rect(ctx, '#e8c58a', x, 10 - Math.floor(Math.abs(x - 9) / 3), 1, 4); // pitta
    rect(ctx, '#d0a860', 3, 13, 12, 1);
    rect(ctx, '#8f4a1c', 5, 8, 8, 2); // meat
    rect(ctx, '#a35f1f', 6, 8, 2, 1);
    px(ctx, C.grass, 5, 7); // lettuce
    px(ctx, C.grass, 9, 7);
    px(ctx, C.grass, 12, 8);
    px(ctx, C.red, 7, 7); // tomato
    px(ctx, C.white, 11, 7); // onion
    rect(ctx, '#e43b44', 12, 14, 3, 1); // chilli sauce on the ground
    px(ctx, '#e43b44', 15, 13);
  });
}

// Victorian cast-iron street lamp, 8×40, lit lantern on top.
function makeLamp(scene) {
  makeImage(scene, TEX.LAMP, 8, 40, (ctx) => {
    rect(ctx, C.greenDark, 3, 9, 2, 29); // post
    rect(ctx, C.greenDark, 2, 36, 4, 4); // base
    rect(ctx, C.greenDark, 2, 14, 4, 1); // ladder bar
    rect(ctx, C.greenDark, 1, 1, 6, 1); // lantern cap
    px(ctx, C.greenDark, 4, 0);
    rect(ctx, C.greenDark, 1, 2, 1, 6);
    rect(ctx, C.greenDark, 6, 2, 1, 6);
    rect(ctx, '#fff4b0', 2, 2, 4, 6); // glass
    rect(ctx, C.yellow, 3, 4, 2, 3); // flame
    rect(ctx, C.greenDark, 1, 8, 6, 1);
  });
}

// Market stall, 48×40: striped awning, a counter of fruit and veg. Crates
// stacked in front of it (tiles) are the steps.
function makeStall(scene) {
  makeImage(scene, TEX.STALL, 48, 40, (ctx) => {
    rect(ctx, C.woodDark, 2, 8, 2, 32); // poles
    rect(ctx, C.woodDark, 44, 8, 2, 32);
    for (let x = 0; x < 48; x++) rect(ctx, Math.floor(x / 6) % 2 ? C.white : '#e43b44', x, 0, 1, 8); // awning
    for (let x = 0; x < 48; x += 6) for (let r = 0; r < 3; r++) rect(ctx, Math.floor(x / 6) % 2 ? C.white : '#e43b44', x + r, 8 + r, 6 - r * 2, 1);
    rect(ctx, C.wood, 4, 26, 40, 3); // counter
    rect(ctx, C.woodDark, 4, 29, 40, 11);
    for (let x = 6; x < 42; x += 4) {
      const fruit = [C.orange, C.grass, '#e43b44', C.yellow][(x / 4) % 4];
      rect(ctx, fruit, x, 23, 3, 3);
    }
  });
}

// Terraced house or thatched cottage, 64×64: roof, two upper windows, a front
// door and a ground-floor window.
function makeHouse(scene, id, def) {
  const W = 64;
  const H = 64;
  makeImage(scene, houseTextureKey(id), W, H, (ctx) => {
    if (def.roof === 'thatch') {
      for (let r = 0; r < 18; r++) rect(ctx, r % 3 === 0 ? '#a07a3a' : '#c49a52', 10 - Math.floor(r / 2), 4 + r, W - 20 + r, 1);
      rect(ctx, '#8a6530', 1, 21, W - 2, 2); // thatch eave
    } else {
      bricks(ctx, 44, 0, 8, 10); // chimney
      rect(ctx, C.darkGrey, 43, 0, 10, 2);
      for (let r = 0; r < 12; r++) rect(ctx, def.roof, 8 - Math.floor(r / 2), 10 + r, W - 16 + r, 1);
      rect(ctx, C.ink, 2, 22, W - 4, 1);
    }
    if (def.wall === 'brick') bricks(ctx, 3, 23, W - 6, H - 23);
    else rect(ctx, def.wall, 3, 23, W - 6, H - 23);
    rect(ctx, C.ink, 3, 23, 1, H - 23);
    rect(ctx, C.ink, W - 4, 23, 1, H - 23);
    for (const x of [12, 38]) {
      rect(ctx, C.white, x - 1, 27, 14, 12); // upper windows
      rect(ctx, C.glassBlue, x, 28, 12, 10);
      rect(ctx, C.white, x + 5, 28, 2, 10);
    }
    rect(ctx, C.white, 9, 44, 20, 14); // ground-floor window
    rect(ctx, C.glassBlue, 10, 45, 18, 12);
    rect(ctx, C.glassHi, 11, 46, 3, 1);
    rect(ctx, def.door, 40, 43, 12, H - 43); // door
    rect(ctx, C.gold, 44, 52, 1, 1);
    rect(ctx, C.white, 39, 42, 14, 1);
  });
}

// Shopfront with its name on the fascia, 64 px tall: flat-roofed upper floor,
// a big display window and a door. Width fits the name.
export function ensureShopTexture(scene, text) {
  const key = shopTextureKey(text);
  if (scene.textures.exists(key)) return key;
  const tw = measurePixelText(text);
  const W = Math.max(64, tw + 16);
  const H = 64;
  makeImage(scene, key, W, H, (ctx) => {
    rect(ctx, '#eae6dc', 2, 6, W - 4, 20); // rendered upper floor
    rect(ctx, '#cfc8b8', 0, 4, W, 3); // parapet
    for (let x = 10; x + 12 <= W - 8; x += 22) {
      rect(ctx, C.white, x - 1, 10, 14, 13);
      rect(ctx, C.glassBlue, x, 11, 12, 11);
    }
    rect(ctx, '#7e2553', 2, 27, W - 4, 10); // fascia
    rect(ctx, C.gold, 2, 27, W - 4, 1);
    rect(ctx, C.gold, 2, 36, W - 4, 1);
    drawPixelText(ctx, text, Math.round((W - tw) / 2), 30, C.white);
    for (let x = 0; x < W; x++) rect(ctx, Math.floor(x / 4) % 2 ? C.white : '#29adff', x, 37, 1, 3); // awning
    rect(ctx, C.woodDark, 4, 40, W - 22, H - 40); // window frame
    rect(ctx, '#a0e4ff', 6, 42, W - 26, H - 46);
    rect(ctx, C.white, 8, 43, 6, 1);
    rect(ctx, C.woodDark, W - 16, 40, 12, H - 40); // door
    rect(ctx, '#a0e4ff', W - 14, 42, 8, 8);
  });
  return key;
}

// --- Moreton: lanes, fields and the level crossing ---------------------------

// A crate that has seen better days: the usual crate, split and splintered.
function makeCrumble(scene) {
  makeImage(scene, TEX.CRUMBLE, 16, 16, (ctx) => {
    rect(ctx, C.woodDark, 0, 0, 16, 16);
    rect(ctx, C.wood, 1, 1, 14, 14);
    rect(ctx, C.woodDark, 1, 5, 14, 1);
    rect(ctx, C.woodDark, 1, 10, 14, 1);
    // Cracks instead of the cross brace.
    for (const [x, y] of [[4, 1], [5, 2], [5, 3], [6, 4], [7, 6], [7, 7], [8, 8], [9, 9], [9, 11], [10, 12], [11, 13], [12, 14]]) px(ctx, C.ink, x, y);
    for (const [x, y] of [[12, 2], [11, 3], [11, 4], [10, 6], [3, 11], [4, 12], [3, 13]]) px(ctx, C.ink, x, y);
    px(ctx, C.orange, 2, 2);
    px(ctx, C.orange, 13, 8);
    rect(ctx, '#c2c3c7', 0, 0, 2, 1); // a missing corner
    ctx.clearRect(14, 0, 2, 1);
    ctx.clearRect(15, 1, 1, 1);
  });
}

// A cowpat on the lane: low, flat and unmistakable.
function makeCowpat(scene) {
  makeImage(scene, TEX.COWPAT, 16, 16, (ctx) => {
    rect(ctx, '#4a3418', 2, 13, 12, 3);
    rect(ctx, '#5d4420', 3, 11, 10, 3);
    rect(ctx, '#6e5228', 5, 10, 6, 2);
    rect(ctx, '#7e6232', 6, 9, 3, 1);
    px(ctx, '#8f7a44', 5, 12);
    px(ctx, '#8f7a44', 10, 11);
    px(ctx, C.ink, 9, 7); // a fly
    px(ctx, C.ink, 4, 8);
  });
}

// Friesian cow, 32×20, grazing side-on (head down, to the right).
function makeCow(scene) {
  makeImage(scene, TEX.COW, 32, 20, (ctx) => {
    rect(ctx, C.white, 3, 4, 22, 10); // body
    rect(ctx, C.ink, 6, 4, 6, 5); // patches
    rect(ctx, C.ink, 15, 8, 7, 5);
    rect(ctx, C.ink, 20, 4, 3, 3);
    rect(ctx, C.ink, 2, 5, 1, 7); // tail
    rect(ctx, C.ink, 1, 11, 2, 2);
    for (const x of [5, 9, 19, 23]) rect(ctx, x === 9 || x === 23 ? C.white : C.ink, x, 14, 2, 5); // legs
    for (const x of [5, 9, 19, 23]) rect(ctx, C.darkGrey, x, 19, 2, 1); // hooves
    rect(ctx, '#f4b8c8', 11, 14, 4, 2); // udder
    rect(ctx, C.white, 25, 7, 4, 4); // neck, head lowered to the grass
    rect(ctx, C.ink, 26, 10, 5, 6); // head
    rect(ctx, '#f4b8c8', 29, 14, 3, 2); // muzzle
    px(ctx, C.white, 28, 11); // eye shine
    rect(ctx, C.cream, 25, 9, 1, 2); // horn
  });
}

// Level-crossing warning lights on a post, 16×40: a pair of red lamps under a
// St Andrew's cross. Frames: both off, left lit, right lit (they alternate).
function makeCrossingLights(scene) {
  const { width, height } = CROSSING_LIGHTS_FRAME;
  makeSheet(scene, TEX.CROSSING_LIGHTS, width, height, 3, (ctx, i) => {
    rect(ctx, C.darkGrey, 7, 10, 2, 30); // post
    rect(ctx, C.darkGrey, 5, 38, 6, 2);
    for (let d = 0; d < 8; d++) {
      // the cross
      px(ctx, C.white, 4 + d, d);
      px(ctx, C.white, 11 - d, d);
      px(ctx, '#e43b44', 4 + d, d + 1);
      px(ctx, '#e43b44', 11 - d, d + 1);
    }
    rect(ctx, C.ink, 1, 12, 14, 7); // lamp board
    const lamp = (x, lit) => {
      rect(ctx, lit ? '#ff004d' : '#4a1020', x, 13, 5, 5);
      if (lit) px(ctx, '#ffccd8', x + 1, 14);
    };
    lamp(2, i === CROSSING_LIGHTS_FRAME.left);
    lamp(9, i === CROSSING_LIGHTS_FRAME.right);
  });
}

// The train that runs through a level crossing, side-on and facing right:
// a tail lamp, `carriages` coaches built from the carriage tiles (so they
// match the trains you ride), and a diesel locomotive with a yellow nose and
// headlight. 64 px tall, bogies at the bottom.
const LOCO_W = 56;
const COACH_W = 160; // 10 tiles
const GANGWAY = 4;
export const crossingTrainWidth = (carriages) => LOCO_W + carriages * (COACH_W + GANGWAY);

function makeCrossingTrain(scene, carriages) {
  const W = crossingTrainWidth(carriages);
  const tiles = scene.textures.get(TEX.TILES).getSourceImage();
  const T = TILESET.tiles;
  const tile = (ctx, index, x, y) => ctx.drawImage(tiles, index * 16, 0, 16, 16, x, y, 16, 16);
  makeImage(scene, TEX.CROSSING_TRAIN, W, 64, (ctx) => {
    for (let k = 0; k < carriages; k++) {
      const x0 = k * (COACH_W + GANGWAY);
      for (let c = 0; c < 10; c++) {
        const x = x0 + c * 16;
        const isDoor = c === 1 || c === 8;
        tile(ctx, c === 0 ? T.roofLeft : c === 9 ? T.roofRight : T.roofMid, x, 0);
        tile(ctx, isDoor ? T.carriageDoor : T.carriageWindow, x, 16);
        tile(ctx, isDoor ? T.carriageDoor : T.carriageLower, x, 32);
        tile(ctx, [1, 2, 7, 8].includes(c) ? T.bogie : T.underframe, x, 48);
      }
      rect(ctx, C.ink, x0 + COACH_W, 20, GANGWAY, 24); // gangway bellows
    }
    rect(ctx, '#e43b44', 0, 34, 2, 3); // tail lamp on the last coach
    px(ctx, '#ffccd8', 0, 34);

    // Locomotive: rail-blue body, cab windows, yellow warning nose with a headlight.
    const lx = W - LOCO_W;
    rect(ctx, '#6b6b73', lx, 0, LOCO_W - 10, 5); // roof
    rect(ctx, '#9a9aa2', lx, 0, LOCO_W - 10, 1);
    rect(ctx, '#1d4b8a', lx, 5, LOCO_W - 14, 43); // body
    for (const gx of [lx + 6, lx + 18]) rect(ctx, '#163a6b', gx, 12, 8, 14); // grilles
    rect(ctx, C.white, lx + 2, 30, LOCO_W - 18, 2); // body stripe
    // Nose: slopes back towards the roof, all yellow.
    for (let y = 0; y < 48; y++) {
      const reach = Math.min(14, 4 + Math.floor(y / 2));
      rect(ctx, '#ffcd00', W - 14, y + 2, reach, 1);
    }
    rect(ctx, C.glassBlue, W - 13, 8, 8, 9); // windscreen
    rect(ctx, C.glassHi, W - 12, 9, 2, 1);
    rect(ctx, C.ink, W - 14, 18, 14, 1);
    rect(ctx, C.white, W - 5, 36, 4, 4); // headlight
    rect(ctx, '#fff4b0', W - 4, 37, 2, 2);
    rect(ctx, C.ink, W - 14, 44, 14, 4); // buffer beam
    rect(ctx, C.darkGrey, W - 2, 42, 2, 3); // buffer
    for (const bx of [lx + 4, lx + 30]) tile(ctx, T.bogie, bx, 48);
    rect(ctx, C.ink, lx, 48, LOCO_W, 2);
  });
}

// Tall hedgerow, 14×68, either side of a level crossing: the train comes out
// from behind one and disappears behind the other.
function makeHedge(scene) {
  makeImage(scene, TEX.HEDGE, 14, 68, (ctx) => {
    rect(ctx, '#2b7a38', 1, 4, 12, 64);
    for (let y = 2; y < 68; y += 5) {
      for (let x = (y / 5) % 2 ? 0 : 2; x < 14; x += 5) {
        rect(ctx, '#3fa34d', x, y, 3, 3);
        px(ctx, '#5dbb63', x, y);
      }
    }
    for (const [x, y] of [[3, 12], [9, 30], [4, 47], [10, 58]]) px(ctx, '#e43b44', x, y); // hawthorn berries
    rect(ctx, '#1e5a28', 1, 64, 12, 4);
  });
}

// A tank from the Bovington Tank Museum, 64×48, facing right. You ride on
// its turret: the flat turret roof (x 16–47, y 0) is the moving platform's
// deck. The hull and tracks below sit down in the muddy trench.
function makeTank(scene) {
  const olive = '#56642f';
  const oliveDark = '#3c4720';
  const oliveLight = '#7a8a44';
  makeImage(scene, TEX.TANK, 64, 48, (ctx) => {
    // Turret, with the gun barrel pointing forward.
    rect(ctx, olive, 16, 0, 32, 11);
    rect(ctx, oliveLight, 16, 0, 32, 1);
    rect(ctx, oliveDark, 16, 10, 32, 1);
    rect(ctx, oliveDark, 22, 3, 6, 4); // camouflage
    rect(ctx, oliveDark, 36, 5, 7, 3);
    rect(ctx, oliveLight, 30, 2, 4, 2);
    rect(ctx, oliveDark, 47, 4, 1, 4); // mantlet
    rect(ctx, '#2e3618', 48, 5, 16, 3); // barrel
    rect(ctx, oliveDark, 60, 4, 4, 5); // muzzle
    // Hull, with a sloping glacis at the front.
    rect(ctx, olive, 4, 11, 54, 12);
    for (let i = 0; i < 6; i++) rect(ctx, olive, 58, 13 + i * 2, 4 - Math.floor(i / 2), 2);
    rect(ctx, oliveLight, 4, 11, 54, 1);
    rect(ctx, oliveDark, 12, 15, 8, 4);
    rect(ctx, oliveDark, 40, 14, 9, 5);
    rect(ctx, oliveLight, 26, 16, 6, 3);
    rect(ctx, C.white, 8, 14, 3, 1); // a stencilled number
    rect(ctx, C.white, 8, 16, 3, 1);
    rect(ctx, '#2e3618', 2, 22, 60, 2); // track guard
    // Tracks and road wheels.
    rect(ctx, '#2a2a30', 1, 24, 62, 16);
    rect(ctx, '#45454e', 3, 24, 58, 1);
    for (let x = 4; x < 60; x += 4) rect(ctx, '#45454e', x, 38, 2, 2); // track links
    for (const x of [8, 18, 28, 38, 48]) {
      rect(ctx, '#5f574f', x, 27, 8, 8);
      rect(ctx, '#83769c', x + 3, 30, 2, 2);
    }
    rect(ctx, '#5f574f', 2, 28, 4, 6); // idler and sprocket
    rect(ctx, '#5f574f', 58, 28, 4, 6);
    // Mud thrown up by the tracks.
    rect(ctx, '#5d4420', 0, 40, 64, 8);
    for (const [x, y] of [[3, 39], [14, 38], [27, 39], [41, 38], [55, 39], [60, 37]]) rect(ctx, '#7e6232', x, y, 3, 2);
  });
}

// Wooden rowing boat, 48×24, side-on. The gunwale (y 0) is the deck you
// stand on; the lower part sits below the waterline (drawn behind the river).
function makeBoat(scene) {
  makeImage(scene, TEX.BOAT, 48, 24, (ctx) => {
    for (let y = 0; y < 18; y++) {
      const inset = Math.max(0, Math.floor((y - 6) / 2)); // the hull curves in towards the keel
      rect(ctx, y < 3 ? C.wood : y < 9 ? '#2f5d9a' : C.white, inset, y + 2, 48 - inset * 2, 1);
    }
    rect(ctx, C.woodDark, 0, 0, 48, 2); // gunwale rail
    rect(ctx, '#b07850', 0, 0, 48, 1);
    rect(ctx, C.woodDark, 0, 0, 2, 6); // stem and stern posts
    rect(ctx, C.woodDark, 46, 0, 2, 6);
    rect(ctx, C.ink, 8, 5, 1, 4); // planking
    rect(ctx, C.ink, 23, 5, 1, 4);
    rect(ctx, C.ink, 38, 5, 1, 4);
    rect(ctx, C.white, 12, 6, 7, 1); // her name
    // An oar resting across the gunwale.
    for (let i = 0; i < 10; i++) px(ctx, '#d8c8a0', 30 + i, 2 + Math.floor(i / 2));
    rect(ctx, '#d8c8a0', 39, 6, 3, 4);
  });
}

// Mute swan, 16×16, facing right: two walking frames (head bob, feet).
function makeSwan(scene) {
  makeSheet(scene, TEX.SWAN, 16, 16, 2, (ctx, i) => {
    const bob = i;
    rect(ctx, C.white, 1, 8, 11, 5); // body
    rect(ctx, C.white, 2, 7, 8, 1);
    rect(ctx, C.grey, 2, 12, 9, 1);
    rect(ctx, C.grey, 3, 9, 5, 1); // folded wing
    rect(ctx, C.grey, 0, 7, 2, 2); // tail
    rect(ctx, C.white, 10, 4 + bob, 2, 5 - bob); // neck
    rect(ctx, C.white, 11, 2 + bob, 3, 3); // head
    px(ctx, C.ink, 12, 3 + bob); // eye
    rect(ctx, C.ink, 14, 3 + bob, 1, 1); // the black knob
    rect(ctx, C.orange, 14, 4 + bob, 2, 1); // beak
    px(ctx, C.orange, 15, 5 + bob);
    // Feet.
    rect(ctx, '#3a3a46', i ? 4 : 5, 13, 1, 2);
    rect(ctx, '#3a3a46', i ? 8 : 7, 13, 1, 2);
    rect(ctx, '#3a3a46', i ? 3 : 4, 15, 3, 1);
    rect(ctx, '#3a3a46', i ? 8 : 7, 15, 3, 1);
  });
}

// Beer mat, 10×10: a round card with a red ring, thrown frisbee-style.
function makeBeerMat(scene) {
  makeImage(scene, TEX.BEERMAT, 10, 10, (ctx) => {
    for (let y = 0; y < 10; y++) {
      const half = Math.round(Math.sqrt(25 - (y - 4.5) ** 2));
      rect(ctx, '#f4e4c1', 5 - half, y, half * 2, 1);
    }
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      px(ctx, '#e43b44', Math.round(4.5 + Math.cos(t) * 3.4), Math.round(4.5 + Math.sin(t) * 3.4));
    }
    rect(ctx, '#7e2553', 4, 4, 2, 2);
  });
}

// Soft headlight glow, 32×32: concentric rings fading out from a white core.
function makeHeadlight(scene) {
  makeImage(scene, TEX.HEADLIGHT, 32, 32, (ctx) => {
    for (let r = 16; r > 0; r--) {
      ctx.globalAlpha = 0.08 + (1 - r / 16) * 0.5;
      ctx.fillStyle = r < 4 ? '#ffffff' : '#fff4b0';
      ctx.beginPath();
      ctx.arc(16, 16, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

// Barrier arm, 48×4, red and white with a lamp on the tip; drawn level
// (lowered) and rotated up to raise it. Its pivot is the left end.
function makeBarrier(scene) {
  makeImage(scene, TEX.BARRIER, 48, 4, (ctx) => {
    for (let x = 0; x < 48; x++) rect(ctx, Math.floor(x / 6) % 2 ? C.white : '#e43b44', x, 0, 1, 4);
    rect(ctx, C.ink, 0, 3, 48, 1);
    rect(ctx, '#ff004d', 45, 0, 3, 2);
  });
}

// --- Train Conductor (boss) -------------------------------------------------
// Navy uniform, peaked cap with a gold band, grey moustache, silver whistle.
// N navy, n sleeve, G gold, S skin, r cheeks, K black, W shirt, M moustache,
// C whistle, Y ticket.
const CONDUCTOR_PALETTE = {
  N: '#1d2b53',
  n: '#3b4a8a',
  G: '#ffcd75',
  S: '#f4c49a',
  r: '#e43b44',
  K: '#1a1c2c',
  W: '#fff1e8',
  M: '#83769c',
  C: '#c2c3c7',
  Y: '#f4e4c1',
};
const CONDUCTOR_RED_FACE = { ...CONDUCTOR_PALETTE, S: '#f7907a' };

const C_HEAD = [
  '................',
  '................',
  '.....NNNNNN.....',
  '....NNNNNNNN....',
  '....NGGGGGGN....',
  '...KKKKKKKKKK...',
  '....SSSSSSSS....',
  '....SKSSSSKS....',
  '....rSSSSSSr....',
  '....SMMMMMMS....',
  '.....SSKKSS.....',
  '......SSSS......',
];
const C_TORSO = [
  '....NNWWWWNN....',
  '...NNNNWWNNNN...',
  '..NNNNNNNNNNNN..',
  '..NnNNNGNNNNnN..',
  '..NnNNNNNNNNnN..',
  '..NnNNNGNNNNnN..',
  '..SnNNNNNNNNnS..',
  '...KKKKGKKKKK...',
  '...NNNNNNNNNN...',
  '...NNNNGNNNNN...',
];
const C_LEGS = {
  stand: [
    '...NNNN..NNNN...',
    '...NNNN..NNNN...',
    '...NNN....NNN...',
    '...NNN....NNN...',
    '...NNN....NNN...',
    '...NNN....NNN...',
    '...NNN....NNN...',
    '..KKKK....KKKK..',
    '................',
    '................',
  ],
  stride: [
    '...NNNN..NNNN...',
    '..NNNN....NNNN..',
    '..NNN......NNN..',
    '.NNN........NNN.',
    '.NNN........NNN.',
    '.NNN........NNN.',
    '.NNN........NNN.',
    'KKKK........KKKK',
    '................',
    '................',
  ],
  pass: [
    '...NNNNNNNNNN...',
    '....NNNNNNNN....',
    '.....NNNNNN.....',
    '.....NNN.NN.....',
    '.....NNN.NN.....',
    '.....NNN.NN.....',
    '.....NNN.NN.....',
    '....KKKK.KKK....',
    '................',
    '................',
  ],
};
const shiftR = (row) => '.' + row.slice(0, 15);
const shiftL = (row) => row.slice(1) + '.';
const withRows = (rows, changes) => rows.map((r, i) => changes[i] ?? r);

// Frame order must match CONDUCTOR_FRAME in src/assets.js.
const CONDUCTOR_ART = [
  // 0 idle
  { rows: [...C_HEAD, ...C_TORSO, ...C_LEGS.stand] },
  // 1–2 walk
  { rows: [...C_HEAD, ...C_TORSO, ...C_LEGS.stride] },
  { rows: [...C_HEAD, ...C_TORSO, ...C_LEGS.pass] },
  // 3 wind-up: whistle to his lips, arm raised, red in the face
  {
    palette: CONDUCTOR_RED_FACE,
    rows: [
      ...withRows(C_HEAD, { 10: '.....SSKCCC.....', 11: '......SSSSS.....' }),
      ...withRows(C_TORSO, { 0: '....NNWWWWNNn...', 1: '...NNNNWWNNNNn..', 6: '..SnNNNNNNNNnN..' }),
      ...C_LEGS.stand,
    ],
  },
  // 4 dash: leaning forward, mid-stride
  { rows: [...C_HEAD.map(shiftR), ...C_TORSO.map((r, i) => (i < 3 ? shiftR(r) : r)), ...C_LEGS.stride] },
  // 5 dizzy: cap knocked askew, blank stare
  {
    rows: [
      ...withRows(C_HEAD, {
        2: shiftL(C_HEAD[2]),
        3: shiftL(C_HEAD[3]),
        4: shiftL(C_HEAD[4]),
        5: shiftL(C_HEAD[5]),
        7: '....SWSSSSWS....',
        10: '.....SKKKKS.....',
      }),
      ...C_TORSO,
      ...C_LEGS.stand,
    ],
  },
  // 6 throw: arm up with a ticket
  {
    rows: [
      ...withRows(C_HEAD, { 8: '....rSSSSSSr..Y.', 9: '....SMMMMMMS.SY.', 10: '.....SSKKSS..S..', 11: '......SSSS...n..' }),
      ...withRows(C_TORSO, { 0: '....NNWWWWNNn...', 1: '...NNNNWWNNNNn..', 6: '..SnNNNNNNNNnN..' }),
      ...C_LEGS.stand,
    ],
  },
];

function makeConductor(scene) {
  const { width, height, count } = CONDUCTOR_FRAME;
  makeSheet(scene, TEX.CONDUCTOR, width, height, count, (ctx, i) => {
    const f = CONDUCTOR_ART[i];
    drawRows(ctx, f.rows, 0, 0, f.palette ?? CONDUCTOR_PALETTE);
  });
}

function makeTicket(scene) {
  makeImage(scene, TEX.TICKET, 8, 5, (ctx) => {
    rect(ctx, C.cream, 0, 0, 8, 5);
    rect(ctx, '#e43b44', 0, 1, 8, 1);
    rect(ctx, C.creamDark, 0, 4, 8, 1);
    px(ctx, C.ink, 5, 2); // punched hole
  });
}

function makeTicketMarker(scene) {
  makeImage(scene, TEX.TICKET_MARKER, 12, 3, (ctx) => {
    rect(ctx, C.ink, 3, 0, 6, 1);
    rect(ctx, C.ink, 1, 1, 10, 1);
    rect(ctx, C.ink, 3, 2, 6, 1);
  });
}

function makeDizzyStars(scene) {
  makeImage(scene, TEX.DIZZY_STARS, 16, 5, (ctx) => {
    for (const x of [2, 8, 13]) {
      px(ctx, C.yellow, x, 1);
      px(ctx, C.yellow, x - 1, 2);
      px(ctx, C.white, x, 2);
      px(ctx, C.yellow, x + 1, 2);
      px(ctx, C.yellow, x, 3);
    }
  });
}

// Station nameboard: cream lettering on green, on two posts.
export function ensureSignTexture(scene, text) {
  const key = signTextureKey(text);
  if (scene.textures.exists(key)) return key;
  const tw = measurePixelText(text);
  const W = tw + 8;
  const H = 24;
  makeImage(scene, key, W, H, (ctx) => {
    rect(ctx, C.ink, 2, 9, 2, H - 9);
    rect(ctx, C.ink, W - 4, 9, 2, H - 9);
    rect(ctx, C.cream, 0, 0, W, 10);
    rect(ctx, '#005a2b', 1, 1, W - 2, 8);
    drawPixelText(ctx, text, 4, 3, C.cream);
  });
  return key;
}

const BUILDERS = {
  [TEX.PINT]: makePint,
  [TEX.ESPRESSO]: makeEspresso,
  [TEX.GLASS]: makeGlass,
  [TEX.BUCKET]: makeBucket,
  [TEX.KEBAB]: makeKebab,
  [TEX.LAMP]: makeLamp,
  [TEX.STALL]: makeStall,
  [TEX.CRUMBLE]: makeCrumble,
  [TEX.COWPAT]: makeCowpat,
  [TEX.COW]: makeCow,
  [TEX.CROSSING_LIGHTS]: makeCrossingLights,
  [TEX.BARRIER]: makeBarrier,
  [TEX.HEADLIGHT]: makeHeadlight,
  [TEX.HEDGE]: makeHedge,
  [TEX.TANK]: makeTank,
  [TEX.BOAT]: makeBoat,
  [TEX.SWAN]: makeSwan,
  [TEX.BEERMAT]: makeBeerMat,
  [TEX.CHECKPOINT]: makeCheckpoint,
  [TEX.FINISH]: makeFinish,
  [TEX.CONFETTI]: makeConfetti,
  [TEX.TILES]: makeTiles,
  [TEX.HILLS]: makeHills,
  [TEX.EASEL]: makeEasel,
  [TEX.CONDUCTOR]: makeConductor,
  [TEX.TICKET]: makeTicket,
  [TEX.TICKET_MARKER]: makeTicketMarker,
  [TEX.DIZZY_STARS]: makeDizzyStars,
};

/** Generate every placeholder texture that has not already been loaded as real art. */
export function createPlaceholderTextures(scene) {
  for (const [key, build] of Object.entries(BUILDERS)) {
    if (!scene.textures.exists(key)) build(scene);
  }
  for (const character of CHARACTERS) {
    if (!scene.textures.exists(playerTextureKey(character.id))) makePlayer(scene, character);
  }
  for (const [id, def] of Object.entries(PUBS)) {
    if (!scene.textures.exists(pubTextureKey(id))) makePub(scene, id, def);
  }
  for (const [id, def] of Object.entries(HOUSES)) {
    if (!scene.textures.exists(houseTextureKey(id))) makeHouse(scene, id, def);
  }
  // Built from the carriage tiles, so it comes after them.
  if (!scene.textures.exists(TEX.CROSSING_TRAIN)) makeCrossingTrain(scene, CROSSING.trainCarriages);
}
