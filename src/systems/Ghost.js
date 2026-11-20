import Phaser from 'phaser';
import { GHOST } from '../config.js';
import { playerTextureKey } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';

// The ghost: your best finished run of each level, replayed alongside you as
// a see-through lad. Recorded every run (position, animation frame, facing,
// whether he was dead, against the run clock) and kept in the game registry
// under GHOSTS_KEY, one per level, only if its final time beats the one
// already there. Memory only: nothing is written to the browser, so ghosts
// last until the page reloads.
export const GHOSTS_KEY = 'ghosts';

/** Samples the player against the run clock. */
export class GhostRecorder {
  constructor(characterId) {
    this.characterId = characterId;
    this.samples = []; // [t, x, y, frame, flip, hidden]
    this.lastT = -Infinity;
  }

  record(t, player) {
    if (t - this.lastT < GHOST.sampleMs) return;
    this.lastT = t;
    this.samples.push([t, Math.round(player.x), Math.round(player.y), player.frame.name, player.flipX ? 1 : 0, player.dead || !player.visible ? 1 : 0]);
  }

  /** The finished run, ready to keep. */
  toRun(finalMs) {
    return { characterId: this.characterId, finalMs, samples: this.samples };
  }
}

/** Keep `run` as the level's ghost if it's the best so far. Returns true if it was kept. */
export function keepIfBest(registry, levelId, run) {
  const ghosts = registry.get(GHOSTS_KEY) ?? {};
  const best = ghosts[levelId];
  if (best && best.finalMs <= run.finalMs) return false;
  registry.set(GHOSTS_KEY, { ...ghosts, [levelId]: run });
  return true;
}

export function getGhost(registry, levelId) {
  return (registry.get(GHOSTS_KEY) ?? {})[levelId] ?? null;
}

/** Plays a kept run back against the run clock. */
export class GhostPlayer {
  constructor(scene, run) {
    this.run = run;
    this.i = 0;
    const [, x, y] = run.samples[0] ?? [0, 0, 0];
    this.sprite = scene.add
      .sprite(x, y, playerTextureKey(run.characterId))
      .setAlpha(GHOST.alpha)
      .setTint(GHOST.tint)
      .setDepth(DEPTH.player - 0.5);
  }

  /** Show the ghost where it was at run time `t`. */
  update(t) {
    const s = this.run.samples;
    if (!s.length) return;
    while (this.i < s.length - 1 && s[this.i + 1][0] <= t) this.i++;
    const a = s[this.i];
    const b = s[Math.min(this.i + 1, s.length - 1)];
    const k = b[0] > a[0] ? Phaser.Math.Clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 0;
    // Jumps of more than a few tiles between samples are respawns: don't slide across.
    const teleport = Math.abs(b[1] - a[1]) > 48;
    this.sprite.setPosition(teleport ? a[1] : Phaser.Math.Linear(a[1], b[1], k), teleport ? a[2] : Phaser.Math.Linear(a[2], b[2], k));
    this.sprite.setFrame(a[3]).setFlipX(!!a[4]);
    // Hidden while that run's lad was dead, and once it's through the door.
    this.sprite.setVisible(!a[5] && t <= s[s.length - 1][0] + 200);
  }
}
