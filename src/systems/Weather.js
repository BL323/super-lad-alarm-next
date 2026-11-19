import { RAIN, MAX_GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';

// Weather from a level's `weather` map property. 'rain': streaks falling
// across the screen and splashes on the ground, fixed to the camera. Visual only.
export function addWeather(scene, weather) {
  if (weather !== 'rain') return null;
  const fall = (GAME_HEIGHT + 16) / RAIN.speed; // seconds to cross the screen
  const rain = scene.add
    .particles(0, -8, TEX.RAINDROP, {
      x: { min: 0, max: MAX_GAME_WIDTH + 40 },
      speedY: { min: RAIN.speed * 0.9, max: RAIN.speed * 1.1 },
      speedX: RAIN.drift,
      lifespan: fall * 1000,
      frequency: 1000 / RAIN.dropsPerSecond,
      alpha: RAIN.alpha,
    })
    .setScrollFactor(0)
    .setDepth(DEPTH.foreground + 1);
  const splash = scene.add
    .particles(0, GAME_HEIGHT - 33, TEX.RAINDROP, { // on the street (surface row)
      x: { min: 0, max: MAX_GAME_WIDTH },
      speedY: { min: -40, max: -20 },
      speedX: { min: -25, max: 25 },
      scaleY: 0.4,
      lifespan: 180,
      quantity: 2,
      frequency: 1000 / RAIN.splashesPerSecond,
      alpha: { start: RAIN.alpha, end: 0 },
    })
    .setScrollFactor(0)
    .setDepth(DEPTH.ground + 1);
  return { rain, splash };
}
