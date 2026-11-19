import Phaser from 'phaser';
import { THROWERS, TILE_SIZE } from '../config.js';
import { TEX } from '../assets.js';
import Lobber from './Lobber.js';
import Audio from './Audio.js';

// Angry locals at the windows of The Black Bear, throwing beer mats. Each
// thrower lobs one at the player every THROWERS.everyMs, but only while
// the player is down on the street (within THROWERS.rangeTiles): up on the
// rooftops you're out of reach. Mats land where their floor marker shows.
export default class Throwers {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, floorY: number, offsetMs: number }[]} defs window position and the street below
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.player = player;
    // Each clock counts up to everyMs; the first throw comes firstDelayMs after
    // the player arrives, staggered between windows.
    this.startClock = (t, i) => THROWERS.everyMs - THROWERS.firstDelayMs - (t.offsetMs ?? i * THROWERS.staggerMs);
    this.items = defs.map((d, i) => ({ ...d, clock: this.startClock(d, i) }));
    this.mats = new Lobber(scene, { player, texture: TEX.BEERMAT, flightMs: THROWERS.flightMs, size: [6, 6], spin: 720 });
    this.range = THROWERS.rangeTiles * TILE_SIZE;

    // A death clears the air, and everyone waits a moment again.
    const onDied = () => {
      this.mats.clear();
      this.items.forEach((t, i) => (t.clock = this.startClock(t, i)));
    };
    player.on('died', onDied);
    let stopped = false;
    const onUpdate = (_t, delta) => {
      if (stopped) return; // can fire once more in the frame the scene shuts down
      this.update(delta);
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopped = true;
      scene.events.off('update', onUpdate);
      player.off('died', onDied);
    });
  }

  update(delta) {
    this.mats.update();
    const p = this.player;
    if (p.dead || p.enteringDoor) return;
    for (const t of this.items) {
      const onStreet = Math.abs(p.body.bottom - t.floorY) < 4;
      const inRange = Math.abs(p.x - t.x) <= this.range;
      if (!onStreet || !inRange) continue;
      t.clock += delta;
      if (t.clock < THROWERS.everyMs) continue;
      t.clock = 0;
      const aim = p.x + p.body.velocity.x * (THROWERS.flightMs / 1000) * THROWERS.lead;
      this.mats.throw(t.x, t.y, aim, t.floorY);
      Audio.play('ticket');
    }
  }
}
