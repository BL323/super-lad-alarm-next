import Phaser from 'phaser';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';

// Lobbed projectiles that land where a floor marker shows: the Train
// Conductor's tickets and the Black Bear locals' beer mats. Each throw is an
// arc that lands on the floor at `targetX` exactly `flightMs` later; touching
// one in flight is a death (through player.die()), unless `isLive()` says the
// thrower has stopped (e.g. the boss fight has reset).
export default class Lobber {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ player, texture: string, flightMs: number, isLive?: () => boolean, size?: [number, number], spin?: number }} opts
   */
  constructor(scene, { player, texture, flightMs, isLive = () => true, size = [8, 5], spin = 540 }) {
    this.scene = scene;
    this.texture = texture;
    this.flightMs = flightMs;
    this.size = size;
    this.spin = spin;
    this.group = scene.physics.add.group({ allowGravity: true });
    scene.physics.add.overlap(player, this.group, () => {
      if (isLive() && !player.dead) player.die();
    });
  }

  /** Lob from (x, y) to land on the floor at (targetX, floorY). */
  throw(x, y, targetX, floorY) {
    const T = this.flightMs / 1000;
    const g = this.scene.physics.world.gravity.y;
    const vy = (floorY - 2 - y - 0.5 * g * T * T) / T;
    const vx = (targetX - x) / T;

    const marker = this.scene.add
      .image(targetX, floorY, TEX.TICKET_MARKER)
      .setOrigin(0.5, 1)
      .setAlpha(0.25)
      .setDepth(DEPTH.props);
    this.scene.tweens.add({ targets: marker, alpha: 0.6, duration: 200, yoyo: true, repeat: -1 });

    const item = this.group.create(x, y, this.texture).setDepth(DEPTH.player + 1);
    item.body.setSize(...this.size).setVelocity(vx, vy);
    item.setAngularVelocity(vx > 0 ? this.spin : -this.spin);
    item.marker = marker;
    item.floorY = floorY;
    return item;
  }

  /** Call every frame: anything that has reached its floor lands. */
  update() {
    for (const item of [...this.group.getChildren()]) {
      if (item.y >= item.floorY - 2) this.land(item);
    }
  }

  land(item) {
    item.marker?.destroy();
    const { x, floorY } = item;
    item.destroy();
    const puff = this.scene.add
      .image(x, floorY - 2, this.texture)
      .setDepth(DEPTH.props)
      .setAngle(Phaser.Math.Between(-20, 20));
    this.scene.tweens.add({ targets: puff, alpha: 0, y: puff.y - 4, duration: 300, onComplete: () => puff.destroy() });
  }

  clear() {
    for (const item of [...this.group.getChildren()]) {
      item.marker?.destroy();
      item.destroy();
    }
  }
}
