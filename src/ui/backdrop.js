import { GAME_HEIGHT, COLORS, PARALLAX } from '../config.js';
import { TEX, TILESET } from '../assets.js';

// Sky, slowly drifting hills and a strip of station platform, shared by the
// menu screens so they match the level.
export function addBackdrop(scene) {
  scene.cameras.main.setBackgroundColor(COLORS.sky);
  const width = scene.scale.width;
  const hills = scene.add.tileSprite(0, PARALLAX.hillsBottom - 64, width, 64, TEX.HILLS).setOrigin(0);
  const T = TILESET.tileWidth;
  for (let x = 0; x < width; x += T) {
    scene.add.image(x, GAME_HEIGHT - 2 * T, TEX.TILES, TILESET.tiles.platformTop).setOrigin(0);
    scene.add.image(x, GAME_HEIGHT - T, TEX.TILES, TILESET.tiles.platformBody).setOrigin(0);
  }
  // Scene event emitters outlive restarts, so remove the listener on shutdown.
  const drift = (_t, delta) => {
    hills.tilePositionX += delta * 0.01;
  };
  scene.events.on('update', drift);
  scene.events.once('shutdown', () => scene.events.off('update', drift));
  return { groundY: GAME_HEIGHT - 2 * T };
}

/** A translucent panel for text on top of the backdrop. */
export function addPanel(scene, x, y, w, h) {
  return scene.add.graphics().fillStyle(0x1a1c2c, 0.7).fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
}
