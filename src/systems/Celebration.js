import { CONFETTI } from '../config.js';
import { TEX, CONFETTI_FRAME } from '../assets.js';

const FRAMES = [...Array(CONFETTI_FRAME.count).keys()];

/**
 * Confetti for the finish: a burst out of the doorway at (x, y), then a
 * shower falling across the visible screen.
 */
export function celebrate(scene, x, y, depth) {
  const cam = scene.cameras.main;

  const burst = scene.add
    .particles(0, 0, TEX.CONFETTI, {
      frame: FRAMES,
      speed: { min: 70, max: 170 },
      angle: { min: 200, max: 340 },
      gravityY: 220,
      rotate: { start: 0, end: 540 },
      lifespan: CONFETTI.lifespanMs,
      emitting: false,
    })
    .setDepth(depth);
  burst.explode(CONFETTI.doorBurst, x, y);

  const rain = scene.add
    .particles(0, 0, TEX.CONFETTI, {
      frame: FRAMES,
      x: { min: cam.scrollX, max: cam.scrollX + cam.width },
      y: cam.scrollY - 4,
      speedY: { min: 30, max: 80 },
      speedX: { min: -25, max: 25 },
      gravityY: 30,
      rotate: { start: 0, end: 360 },
      lifespan: CONFETTI.lifespanMs,
      frequency: CONFETTI.rainEveryMs,
      quantity: 2,
      duration: CONFETTI.rainMs,
    })
    .setDepth(depth);

  return { burst, rain };
}
