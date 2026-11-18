import { GAME_WIDTH, MAX_GAME_WIDTH, GAME_HEIGHT, SCALING } from '../config.js';
import { isTouchDevice } from './device.js';

// Picks the game width for the screen's shape and sizes the #game frame.
//
// Width: the height is fixed at GAME_HEIGHT and the width follows the space's
// aspect ratio, from GAME_WIDTH (16:9 or narrower) up to MAX_GAME_WIDTH, so a
// 19.5:9 phone gets a wider view instead of side bars. When it changes, the
// game is resized with scale.setGameSize() and scenes re-lay themselves out.
//
// Frame: sized so Phaser's FIT mode lands on an integer scale of the game
// size, measured in physical (device) pixels, whenever at least 1× fits.
// Otherwise (or on touch devices with SCALING.fillOnTouch) the frame fills
// the available space and FIT scales freely.

/** Game width for an available area: even, between GAME_WIDTH and MAX_GAME_WIDTH. */
export function gameWidthFor(availW, availH) {
  if (!availW || !availH) return GAME_WIDTH;
  const w = Math.floor((GAME_HEIGHT * availW) / availH / 2) * 2;
  return Math.min(MAX_GAME_WIDTH, Math.max(GAME_WIDTH, w));
}

function frameSize(availW, availH, gameW) {
  const dpr = window.devicePixelRatio || 1;
  const devScale = Math.min((availW * dpr) / gameW, (availH * dpr) / GAME_HEIGHT);
  const fill = SCALING.fillOnTouch && isTouchDevice();
  if (!SCALING.integer || fill || devScale < 1) {
    return { width: availW, height: availH };
  }
  const s = Math.floor(devScale);
  return { width: (gameW * s) / dpr, height: (GAME_HEIGHT * s) / dpr };
}

export function setupScaling(container, frame) {
  let game = null;
  let queued = false;
  let gameWidth = gameWidthFor(container.clientWidth, container.clientHeight);

  const apply = () => {
    queued = false;
    const availW = container.clientWidth;
    const availH = container.clientHeight;
    gameWidth = gameWidthFor(availW, availH);
    const { width, height } = frameSize(availW, availH, gameWidth);
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    if (game) {
      // refresh() uses the cached parent size, so re-measure the frame first.
      game.scale.getParentBounds();
      if (game.scale.width !== gameWidth) game.scale.setGameSize(gameWidth, GAME_HEIGHT);
      else game.scale.refresh();
    }
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };

  apply();
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);

  return {
    /** The game width to start Phaser with. */
    get gameWidth() {
      return gameWidth;
    },
    attach(g) {
      game = g;
      schedule();
    },
  };
}
