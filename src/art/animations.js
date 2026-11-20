import {
  TEX,
  ANIM,
  CHARACTERS,
  playerTextureKey,
  playerAnimKey,
  PLAYER_FRAMES,
  PINT_FRAME,
  ESPRESSO_FRAME,
  CONDUCTOR_FRAME,
  LANDLORD_FRAME,
} from '../assets.js';
import { SWANS, GULLS, DOGS, FOXES } from '../config.js';

// Player movement animations, created for every character.
const PLAYER_ANIMS = {
  idle: { frameRate: 2, repeat: -1 },
  run: { frameRate: 12, repeat: -1 },
  jump: { frameRate: 1, repeat: 0 },
  fall: { frameRate: 1, repeat: 0 },
};

// Every animation is defined here and referenced elsewhere by name (src/assets.js ANIM).
const DEFS = [
  ...CHARACTERS.flatMap((c) =>
    Object.entries(PLAYER_ANIMS).map(([state, a]) => ({
      key: playerAnimKey(c.id, state),
      texture: playerTextureKey(c.id),
      frames: PLAYER_FRAMES[state],
      ...a,
    })),
  ),
  { key: ANIM.PINT_SHINE, texture: TEX.PINT, frames: [...Array(PINT_FRAME.count).keys()], frameRate: 6, repeat: -1 },
  {
    key: ANIM.ESPRESSO_SHINE,
    texture: TEX.ESPRESSO,
    frames: [...Array(ESPRESSO_FRAME.count).keys()],
    frameRate: 3,
    repeat: -1,
  },
  { key: ANIM.CONDUCTOR_WALK, texture: TEX.CONDUCTOR, frames: CONDUCTOR_FRAME.walk, frameRate: 6, repeat: -1 },
  { key: ANIM.SWAN_WALK, texture: TEX.SWAN, frames: [0, 1], frameRate: 1000 / SWANS.stepMs, repeat: -1 },
  { key: ANIM.GULL_FLAP, texture: TEX.GULL, frames: [0, 1], frameRate: 1000 / GULLS.flapMs, repeat: -1 },
  { key: ANIM.DOG_TROT, texture: TEX.DOG, frames: [0, 1], frameRate: 1000 / DOGS.stepMs, repeat: -1 },
  { key: ANIM.PEACOCK_STRUT, texture: TEX.PEACOCK, frames: [0, 1], frameRate: 3, repeat: -1 },
  { key: ANIM.SQUIRREL_RUN, texture: TEX.SQUIRREL, frames: [0, 1], frameRate: 10, repeat: -1 },
  { key: ANIM.FOX_RUN, texture: TEX.FOX, frames: [0, 1], frameRate: 1000 / FOXES.stepMs, repeat: -1 },
  { key: ANIM.BIN_ROLL, texture: TEX.BIN, frames: [0, 1], frameRate: 8, repeat: -1 },
  { key: ANIM.LANDLORD_WALK, texture: TEX.LANDLORD, frames: LANDLORD_FRAME.walk, frameRate: 6, repeat: -1 },
];

export function registerAnimations(scene) {
  for (const { key, texture, frames, frameRate, repeat } of DEFS) {
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texture, { frames }),
      frameRate,
      repeat,
    });
  }
}
