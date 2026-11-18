// Builds the home-screen / web app icons in public/icons from the game's own
// pint art (drawPint in src/art/placeholders.js): the 16×16 pint, scaled up
// by a whole number with no smoothing, centred on the menu's navy background.
// Run with `npm run build:icons`; the PNGs are committed.
//
// The pint stays inside the central 80% circle, so the same images work as
// "maskable" icons (Android may crop them to a circle or rounded square).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';
import { PINT_FRAME } from '../src/assets.js';
import { drawPint } from '../src/art/placeholders.js';

const ICONS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];
const PINT_SHARE = 0.68; // pint height as a share of the icon
// COLORS.background in src/config.js (which reads `window`, so can't be imported in Node).
const BACKGROUND = '#1d2b53';

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** Rasterise one pint frame into a 16×16 grid of [r,g,b] (null = empty). */
function pintPixels() {
  const { width, height } = PINT_FRAME;
  const grid = Array.from({ length: height }, () => new Array(width).fill(null));
  const ctx = {
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) grid[r][c] = hex(this.fillStyle);
    },
  };
  drawPint(ctx, 0);
  return grid;
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1); // first byte of each row: filter type 0
    for (let x = 0; x < size; x++) raw.set(pixel(x, y), row + 1 + x * 3);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const pint = pintPixels();
const bg = hex(BACKGROUND);
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');
mkdirSync(outDir, { recursive: true });

for (const { file, size } of ICONS) {
  const scale = Math.floor((size * PINT_SHARE) / PINT_FRAME.height);
  const ox = Math.floor((size - PINT_FRAME.width * scale) / 2);
  const oy = Math.floor((size - PINT_FRAME.height * scale) / 2);
  const data = png(size, (x, y) => {
    const c = Math.floor((x - ox) / scale);
    const r = Math.floor((y - oy) / scale);
    return (x >= ox && y >= oy && pint[r]?.[c]) || bg;
  });
  writeFileSync(resolve(outDir, file), data);
  console.log(`wrote public/icons/${file} (${size}×${size}, pint at ${scale}×)`);
}
