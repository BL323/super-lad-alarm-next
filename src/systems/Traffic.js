import Phaser from 'phaser';
import { TRAFFIC } from '../config.js';
import { TEX, PED_LIGHT_FRAME, CAR_FRAME } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// A side road crossing the pavement (level 10), with a pedestrian light on
// each side. It runs on a loop: green man (TRAFFIC.walkMs) → flashing amber
// (warnMs) → red man while a car comes out of the side road and across
// (carMs, deadly) → green man … Each car comes from the other direction to
// the last. The car is masked to the junction, so it appears from behind the
// corner buildings and disappears past the other side.
const CYCLE_MS = TRAFFIC.walkMs + TRAFFIC.warnMs + TRAFFIC.carMs;

export default class Traffic {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, width: number, offsetMs: number }} def the junction's span and the road surface
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, def, player) {
    this.scene = scene;
    this.player = player;
    this.left = def.x;
    this.right = def.x + def.width;
    this.floorY = def.y;
    this.clock = (((def.offsetMs ?? 0) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
    this.cars = 0;
    this.phase = null;

    this.lights = [this.left - 6, this.right + 6].map((x) =>
      scene.add.sprite(x, this.floorY, TEX.PED_LIGHT, PED_LIGHT_FRAME.walk).setOrigin(0.5, 1).setDepth(DEPTH.player + 2),
    );
    const mask = scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(this.left, this.floorY - 40, def.width, 44);
    this.car = scene.add.image(0, this.floorY + 2, TEX.CAR).setOrigin(0.5, 1).setDepth(DEPTH.player - 0.5).setVisible(false);
    this.car.setMask(mask.createGeometryMask());
    this.danger = scene.add.zone(this.left + def.width / 2, this.floorY - 16, def.width, 32);
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
    if (clock < TRAFFIC.walkMs) return { phase: 'walk', t: clock / TRAFFIC.walkMs };
    if (clock < TRAFFIC.walkMs + TRAFFIC.warnMs) return { phase: 'warn', t: (clock - TRAFFIC.walkMs) / TRAFFIC.warnMs };
    return { phase: 'car', t: (clock - TRAFFIC.walkMs - TRAFFIC.warnMs) / TRAFFIC.carMs };
  }

  update(delta) {
    this.clock = (this.clock + delta) % CYCLE_MS;
    const { phase, t } = this.phaseAt(this.clock);
    if (phase !== this.phase) {
      this.phase = phase;
      if (phase === 'car') {
        this.cars++;
        this.carDir = this.cars % 2 ? 1 : -1;
        Audio.play('car');
      }
      this.danger.body.enable = phase === 'car';
      this.car.setVisible(phase === 'car');
    }
    let frame = PED_LIGHT_FRAME.walk;
    if (phase === 'warn') frame = Math.floor(t * 8) % 2 ? PED_LIGHT_FRAME.amber : PED_LIGHT_FRAME.walk;
    if (phase === 'car') frame = PED_LIGHT_FRAME.stop;
    this.lights.forEach((l) => l.setFrame(frame));
    if (phase === 'car') {
      // From fully off one side to fully off the other, across the whole red phase.
      const span = this.right - this.left + CAR_FRAME.width;
      const from = this.carDir > 0 ? this.left - CAR_FRAME.width / 2 : this.right + CAR_FRAME.width / 2;
      this.car.setFlipX(this.carDir < 0).setX(from + this.carDir * span * t);
    }
  }
}
