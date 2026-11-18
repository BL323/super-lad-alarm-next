import Phaser from 'phaser';
import { CROSSING } from '../config.js';
import { TEX, CROSSING_LIGHTS_FRAME } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// A level crossing where the lane crosses the railway. It runs on a loop:
//
//   open (CROSSING.openMs) → warning (lights flash, bell, barriers lower, the
//   train's headlight glows brighter at the left edge) → closed (the train
//   runs through: nose first, then the coaches, then the tail lamp; deadly)
//   → raising → open …
//
// The crossing is a gap between two tall hedgerows: the train is masked to
// it, so it comes out from behind one hedge and disappears behind the other.
// It's drawn behind the player, and the hedges between the two. It moves so the
// nose enters as the closed phase starts and the tail leaves as it ends, so
// the danger lasts exactly as long as the train is there.
//
// While the barriers are down, the approach-side arm is solid, so walking up
// to it means waiting. Jumping it lands you in front of the train. A player
// already on the crossing when it starts to close is never boxed in: the arm
// only turns solid if they're still on the approach side, and the far arm
// never is.
export const CrossingPhase = { OPEN: 'open', WARN: 'warn', CLOSED: 'closed', RAISE: 'raise' };

const CYCLE = [
  [CrossingPhase.OPEN, CROSSING.openMs],
  [CrossingPhase.WARN, CROSSING.warnMs],
  [CrossingPhase.CLOSED, CROSSING.trainMs],
  [CrossingPhase.RAISE, CROSSING.raiseMs],
];
const CYCLE_MS = CYCLE.reduce((sum, [, ms]) => sum + ms, 0);
const TRAIN_H = 64;
const RAISED_ANGLE = 80; // degrees from level

export default class LevelCrossing {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, width: number, offsetMs: number }} def x and width of the track, y = road surface
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, def, player) {
    this.scene = scene;
    this.player = player;
    this.left = def.x;
    this.right = def.x + def.width;
    this.floorY = def.y;
    this.clock = (((def.offsetMs ?? 0) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
    this.phase = null;

    const armLen = def.width / 2 + 6;
    const armY = this.floorY - 20;
    // Hedges just outside the track, so the train never shows past them.
    this.hedges = [this.left - 7, this.right + 7].map((x) =>
      scene.add.image(x, this.floorY, TEX.HEDGE).setOrigin(0.5, 1).setDepth(DEPTH.player - 0.5),
    );
    this.lights = [this.left - 8, this.right + 8].map((x) =>
      scene.add.sprite(x, this.floorY, TEX.CROSSING_LIGHTS, CROSSING_LIGHTS_FRAME.off).setOrigin(0.5, 1).setDepth(DEPTH.player + 2),
    );
    // Left arm pivots at its left end and points right; the right arm mirrors it.
    this.arms = [
      scene.add.image(this.left - 4, armY, TEX.BARRIER).setOrigin(0, 0.5).setDisplaySize(armLen, 4),
      scene.add.image(this.right + 4, armY, TEX.BARRIER).setOrigin(0, 0.5).setDisplaySize(armLen, 4).setFlipX(true),
    ];
    this.arms[1].setOrigin(1, 0.5);
    this.arms.forEach((a) => a.setDepth(DEPTH.player + 2)); // in front of the passing train

    // The train, masked to the crossing window, and its headlight glow.
    this.width = def.width;
    this.train = scene.add
      .image(0, this.floorY, TEX.CROSSING_TRAIN)
      .setOrigin(0, 1)
      .setDepth(DEPTH.player - 1)
      .setVisible(false);
    this.trainW = this.train.width;
    this.maskShape = scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(this.left, this.floorY - TRAIN_H, def.width, TRAIN_H);
    this.train.setMask(this.maskShape.createGeometryMask());
    this.headlight = scene.add
      .image(this.left, this.floorY - 26, TEX.HEADLIGHT)
      .setDepth(DEPTH.player + 1) // glowing through the hedge
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);

    // Solid arm on the approach side, and the deadly train zone.
    this.blocker = scene.add.zone(this.left - 6, this.floorY - 16, 6, 32);
    scene.physics.add.existing(this.blocker, true);
    this.blocker.body.enable = false;
    scene.physics.add.collider(player, this.blocker);
    this.danger = scene.add.zone(this.left + def.width / 2, this.floorY - 32, def.width, 64);
    scene.physics.add.existing(this.danger, true);
    scene.physics.add.overlap(player, this.danger, () => {
      if (this.phase === CrossingPhase.CLOSED && !player.dead) player.die();
    });

    this.update(0);
    const onUpdate = (_t, delta) => {
      if (!this.scene) return; // can fire once more in the frame the scene shuts down
      this.update(delta);
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('update', onUpdate);
      this.maskShape.destroy();
      this.scene = null;
    });
  }

  /** Current phase and how far through it (0..1). */
  phaseAt(clock) {
    let t = clock;
    for (const [phase, ms] of CYCLE) {
      if (t < ms) return { phase, progress: t / ms };
      t -= ms;
    }
    return { phase: CrossingPhase.OPEN, progress: 0 };
  }

  update(delta) {
    this.clock = (this.clock + delta) % CYCLE_MS;
    const { phase, progress } = this.phaseAt(this.clock);
    if (phase !== this.phase) this.enter(phase);

    // Barrier angle: raised when open, lowering through the warning, down while
    // the train passes, rising again after.
    let down = 0;
    if (phase === CrossingPhase.WARN) down = Phaser.Math.Clamp(progress * 1.6 - 0.4, 0, 1);
    else if (phase === CrossingPhase.CLOSED) down = 1;
    else if (phase === CrossingPhase.RAISE) down = 1 - progress;
    this.arms[0].setAngle(-RAISED_ANGLE * (1 - down));
    this.arms[1].setAngle(RAISED_ANGLE * (1 - down));

    // The approach arm is solid once it's mostly down, unless the player is
    // already past it.
    const solid = down > 0.7 && this.player.body.right <= this.blocker.body.x + 1;
    if (solid !== this.blocker.body.enable) this.blocker.body.enable = solid;

    // Lights alternate while warning or closed.
    const flashing = phase === CrossingPhase.WARN || phase === CrossingPhase.CLOSED;
    const frame = !flashing
      ? CROSSING_LIGHTS_FRAME.off
      : Math.floor(this.clock / 250) % 2
        ? CROSSING_LIGHTS_FRAME.left
        : CROSSING_LIGHTS_FRAME.right;
    this.lights.forEach((l) => l.setFrame(frame));

    // Approach: the headlight brightens and grows at the left edge through the
    // warning, flickering slightly. Then the train itself crosses the window.
    if (phase === CrossingPhase.WARN) {
      const a = progress * progress;
      this.headlight.setAlpha(0.15 + a * 0.85).setScale(0.4 + a * 0.9 + Math.sin(this.clock / 40) * 0.03);
    } else if (this.headlight.alpha) this.headlight.setAlpha(0);
    if (phase === CrossingPhase.CLOSED) {
      this.train.x = this.left - this.trainW + (this.width + this.trainW) * progress;
    }
    if (phase === CrossingPhase.WARN && Math.floor(this.clock / 450) !== this.lastBell) {
      this.lastBell = Math.floor(this.clock / 450);
      if (this.onScreen()) Audio.play('bell');
    }
  }

  enter(phase) {
    this.phase = phase;
    this.train.setVisible(phase === CrossingPhase.CLOSED);
  }

  onScreen() {
    const view = this.scene.cameras.main.worldView;
    return this.right > view.x && this.left < view.right;
  }
}
