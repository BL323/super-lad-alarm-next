import { GAME_WIDTH, GAME_HEIGHT, SCALING } from '../config.js';
import { isTouchDevice } from './device.js';

// Sizes the #game frame so Phaser's FIT mode lands on an integer scale of the
// base resolution, measured in physical (device) pixels, whenever at least 1×
// fits. Otherwise (or on touch devices with SCALING.fillOnTouch) the frame
// fills the available space and FIT scales freely.

function frameSize(availW, availH) {
  const dpr = window.devicePixelRatio || 1;
  const devScale = Math.min((availW * dpr) / GAME_WIDTH, (availH * dpr) / GAME_HEIGHT);
  const fill = SCALING.fillOnTouch && isTouchDevice();
  if (!SCALING.integer || fill || devScale < 1) {
    return { width: availW, height: availH };
  }
  const s = Math.floor(devScale);
  return { width: (GAME_WIDTH * s) / dpr, height: (GAME_HEIGHT * s) / dpr };
}

export function setupScaling(container, frame) {
  let game = null;
  let queued = false;

  const apply = () => {
    queued = false;
    const { width, height } = frameSize(container.clientWidth, container.clientHeight);
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    if (game) {
      // refresh() uses the cached parent size, so re-measure the frame first.
      game.scale.getParentBounds();
      game.scale.refresh();
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
    attach(g) {
      game = g;
      schedule();
    },
  };
}
