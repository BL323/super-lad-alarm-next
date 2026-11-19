import Phaser from 'phaser';
import { MAX_GAME_WIDTH, GAME_HEIGHT, PARALLAX, THEMES, DEFAULT_THEME } from '../config.js';
import { TEX, TILESET, pubTextureKey, houseTextureKey } from '../assets.js';
import { ensureSignTexture, ensureShopTexture } from '../art/placeholders.js';

// Draw order for everything in the level.
export const DEPTH = {
  backdrop: -30,
  decor: -20, // pubs, station signs
  background: -10, // canopy posts, river
  ground: 0,
  props: 5, // checkpoints, finish, hazards, collectibles
  player: 10,
  foreground: 20, // station canopy (can hide secrets)
};

// Sprite hazards sitting on a surface tile: texture and hitbox [w, h, offsetX, offsetY]
// within the 16×16 tile. Anything else (e.g. `water`) is an invisible zone.
export const HAZARD_SPRITES = {
  glass: { texture: TEX.GLASS, body: [12, 6, 2, 10] },
  bucket: { texture: TEX.BUCKET, body: [10, 8, 3, 8] }, // fried-chicken bucket outside The Black Bear
  kebab: { texture: TEX.KEBAB, body: [12, 6, 2, 9] }, // dropped kebab on Dorchester's high street
  cowpat: { texture: TEX.COWPAT, body: [10, 5, 3, 11] }, // on Moreton's lanes
};

const prop = (obj, name) => obj.properties?.find((p) => p.name === name)?.value;
const typeOf = (obj) => obj.type || obj.class;
// Phaser keeps a Tiled map's properties as an array of { name, value } (or an object for some formats).
const mapProp = (map, name) =>
  Array.isArray(map.properties) ? map.properties.find((p) => p.name === name)?.value : map.properties?.[name];

/**
 * Builds a level from its Tiled map: tile layers, collisions, world and camera
 * bounds, parallax backdrop, decor and hazards. Gameplay objects are returned
 * as plain data for the scene and systems to spawn.
 *
 * The map is 12 rows (192 px) and the screen 180 px, so the map is shifted up
 * by 12 px: its bottom row sits on the bottom of the screen and the top 12 px
 * of sky are cut off. All object positions are shifted the same way.
 */
export function loadLevel(scene, levelDef) {
  const map = scene.make.tilemap({ key: levelDef.mapKey });
  const themeId = mapProp(map, 'theme') ?? DEFAULT_THEME;
  if (!THEMES[themeId] && import.meta.env.DEV) console.error(`Unknown level theme "${themeId}"`);
  const theme = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
  scene.cameras.main.setBackgroundColor(theme.sky);
  const tileset = map.addTilesetImage(TILESET.name, TEX.TILES);
  const offsetY = GAME_HEIGHT - map.heightInPixels;
  const width = map.widthInPixels;

  const layer = (name, depth) => map.createLayer(name, tileset, 0, offsetY)?.setDepth(depth);
  const background = layer('background', DEPTH.background);
  const ground = layer('ground', DEPTH.ground);
  const foreground = layer('foreground', DEPTH.foreground);
  ground.setCollisionByExclusion([-1]);

  scene.physics.world.setBounds(0, 0, width, GAME_HEIGHT);
  // No floor at the bottom of the world: falling out is a death.
  scene.physics.world.setBoundsCollision(true, true, true, false);
  scene.cameras.main.setBounds(0, 0, width, GAME_HEIGHT);

  // Parallax hills, fixed to the camera and scrolled by hand. As wide as the
  // widest view, so a width change never needs it resized.
  const hills = scene.add
    .tileSprite(0, PARALLAX.hillsBottom - 64, MAX_GAME_WIDTH, 64, TEX.HILLS)
    .setOrigin(0)
    .setScrollFactor(0)
    .setTint(theme.hillsTint)
    .setDepth(DEPTH.backdrop);

  const objects = (map.getObjectLayer('objects')?.objects ?? []).map((o) => ({ ...o, y: o.y + offsetY }));
  const decor = (map.getObjectLayer('decor')?.objects ?? []).map((o) => ({ ...o, y: o.y + offsetY }));
  const ofType = (t) => objects.filter((o) => typeOf(o) === t);
  const point = (o) => ({ name: o.name, x: o.x, y: o.y });
  const rectOf = (o) => new Phaser.Geom.Rectangle(o.x, o.y, o.width, o.height);

  // Decor: pubs, village houses, shops, lamps and market stalls, station
  // nameboards, the easel in the river. All stand on their feet position.
  const standing = (key, depth = DEPTH.decor) => (d) => scene.add.image(d.x, d.y, key(d)).setOrigin(0.5, 1).setDepth(depth);
  const DECOR = {
    house: standing((d) => houseTextureKey(prop(d, 'house'))),
    shop: standing((d) => ensureShopTexture(scene, prop(d, 'text'))),
    lamp: standing(() => TEX.LAMP, DEPTH.decor + 1),
    stall: standing(() => TEX.STALL, DEPTH.decor + 1),
    cow: (d) => standing(() => TEX.COW, DEPTH.decor + 1)(d).setFlipX(!!prop(d, 'flip')),
  };
  for (const d of decor) {
    const t = typeOf(d);
    DECOR[t]?.(d);
    if (t === 'pub') {
      const img = scene.add.image(d.x, d.y, pubTextureKey(prop(d, 'pub'))).setOrigin(0.5, 1).setDepth(DEPTH.decor);
      // Scenery pubs stand across the street: a little hazier, behind the houses.
      if (prop(d, 'scenery')) img.setTint(0xeee2cc).setDepth(DEPTH.decor - 1);
    }
    if (t === 'sign') scene.add.image(d.x, d.y, ensureSignTexture(scene, prop(d, 'text'))).setOrigin(0.5, 1).setDepth(DEPTH.decor);
    if (t === 'easel') {
      const easel = scene.add.image(d.x, d.y, TEX.EASEL).setOrigin(0.5, 1).setAngle(-24).setDepth(DEPTH.background - 1);
      scene.tweens.add({ targets: easel, y: d.y + 2, angle: -18, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }

  // Hazards: sprite hazards (glass, bucket) with small hitboxes, and water zones.
  const hazards = scene.physics.add.staticGroup();
  for (const h of ofType('hazard')) {
    const sprite = HAZARD_SPRITES[prop(h, 'kind')];
    if (sprite) {
      const img = hazards.create(h.x + h.width / 2, h.y + h.height / 2, sprite.texture).setDepth(DEPTH.props);
      const [w, hh, ox, oy] = sprite.body;
      img.body.setSize(w, hh, false).setOffset(ox, oy);
    } else {
      const z = scene.add.zone(h.x, h.y, h.width, h.height).setOrigin(0);
      hazards.add(z);
      z.body.setSize(h.width, h.height, false).setOffset(0, 0);
    }
  }

  const endZoneObj = objects.find((o) => o.name === 'end-zone');
  const finishObj = ofType('finish')[0];
  const spawnObj = ofType('spawn')[0];
  const bossObj = ofType('boss')[0];

  return {
    map,
    theme,
    layers: { background, ground, foreground },
    width,
    hills,
    hazards,
    spawn: spawnObj ? point(spawnObj) : { name: 'spawn', x: 32, y: GAME_HEIGHT - 32 },
    checkpoints: ofType('checkpoint').map(point),
    finish: finishObj ? point(finishObj) : null,
    endZone: endZoneObj ? rectOf(endZoneObj) : null,
    secrets: ofType('secret').map(rectOf),
    boss: bossObj ? { kind: prop(bossObj, 'kind'), tuning: prop(bossObj, 'tuning'), x: bossObj.x, y: bossObj.y } : null,
    collectibles: ofType('collectible').map((o) => ({ x: o.x, y: o.y, type: prop(o, 'type') })),
    crumbles: ofType('crumble').map((o) => ({ x: o.x, y: o.y })),
    throwers: ofType('thrower').map((o) => ({
      x: o.x,
      y: o.y,
      floorY: prop(o, 'floorRow') * map.tileHeight + offsetY,
      offsetMs: prop(o, 'offsetMs'),
    })),
    movers: ofType('mover').map((o) => ({
      kind: prop(o, 'kind'),
      x: o.x,
      y: o.y,
      width: o.width,
      travel: prop(o, 'travelPx'),
      offsetMs: prop(o, 'offsetMs') ?? 0,
    })),
    swans: ofType('swan').map((o) => ({ x0: o.x, x1: o.x + o.width, y: o.y })),
    crossings: ofType('crossing').map((o) => ({ x: o.x, y: o.y, width: o.width, offsetMs: prop(o, 'offsetMs') ?? 0 })),
  };
}
