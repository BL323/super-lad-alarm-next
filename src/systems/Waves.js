import Phaser from 'phaser';
import { WAVES } from '../config.js';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Waves breaking over the ferry's rail (level 6). Each stretch of deck runs on
// a loop: calm (WAVES.calmMs) → spray building at the rail (warnMs) → a wave
// sweeps across the deck (waveMs, deadly) → calm … Wait for it to drain
// away, then run.
const CYCLE_MS = WAVES.calmMs + WAVES.warnMs + WAVES.waveMs;

export default class Waves {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, width: number, offsetMs: number }} def the stretch of deck and its surface
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, def, player) {
    this.scene = scene;
    this.left = def.x;
    this.width = def.width;
    this.floorY = def.y;
    this.clock = (((def.offsetMs ?? 0) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
    this.phase = null;

    this.water = scene.add.tileSprite(def.x, def.y, def.width, 1, TEX.WAVE).setOrigin(0, 1).setDepth(DEPTH.player + 1).setAlpha(0.85);
    this.spray = scene.add
      .particles(0, 0, TEX.BEER_SPRAY, {
        x: { min: def.x, max: def.x + def.width },
        y: def.y - 2,
        speedY: { min: -70, max: -30 },
        lifespan: 400,
        tint: 0xffffff,
        gravityY: 200,
        frequency: 60,
        emitting: false,
      })
      .setDepth(DEPTH.player + 1);
    this.danger = scene.add.zone(def.x + def.width / 2, def.y - WAVES.heightPx / 2, def.width, WAVES.heightPx);
    scene.physics.add.existing(this.danger, true);
    this.danger.body.enable = false;
    scene.physics.add.overlap(player, this.danger, () => {
      if (!player.dead) player.die();
    });

    let stopped = false;
    const onUpdate = (_t, delta) => {
      if (stopped) return;
      this.update(delta);
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopped = true;
      scene.events.off('update', onUpdate);
    });
  }

  phaseAt(clock) {
    if (clock < WAVES.calmMs) return { phase: 'calm', t: clock / WAVES.calmMs };
    if (clock < WAVES.calmMs + WAVES.warnMs) return { phase: 'warn', t: (clock - WAVES.calmMs) / WAVES.warnMs };
    return { phase: 'wave', t: (clock - WAVES.calmMs - WAVES.warnMs) / WAVES.waveMs };
  }

  update(delta) {
    this.clock = (this.clock + delta) % CYCLE_MS;
    const { phase, t } = this.phaseAt(this.clock);
    if (phase !== this.phase) {
      this.phase = phase;
      this.spray.emitting = phase === 'warn';
      if (phase === 'wave') Audio.play('wave');
    }
    // The wave rises over the rail and drains away.
    const h = phase === 'wave' ? Math.round(Math.sin(Math.PI * t) * (WAVES.heightPx + 2)) + 1 : 1;
    this.water.height = h;
    this.water.setVisible(phase === 'wave');
    // Deadly once it's over ankle height, till it drains back below.
    this.danger.body.enable = phase === 'wave' && h > 6;
  }
}
