import Phaser from 'phaser';
import { AWNINGS } from '../config.js';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Bouncy shop awnings on Poole high street. Each is a one-way deck (you jump
// up through it from below); land on top and it throws you up at
// AWNINGS.velocity, whatever you're pressing, so you can't stand on one. Steer
// in the air to land on the rooftops above.
const THICKNESS = 6;

export default class Awnings {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, width: number }[]} defs top-left of each awning
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
    for (const d of defs) {
      const strip = scene.add.tileSprite(d.x, d.y + AWNINGS.dropPx, d.width, 8, TEX.AWNING).setOrigin(0, 0).setDepth(DEPTH.decor + 2);
      this.group.add(strip);
      strip.body.setSize(d.width, THICKNESS, false).setOffset(0, 0);
      Object.assign(strip.body.checkCollision, { down: false, left: false, right: false });
    }
    scene.physics.add.collider(player, this.group, (p, strip) => {
      p.standOn();
      if (!p.body.touching.down || p.dead) return;
      p.bounce(-AWNINGS.velocity, { fixed: true });
      Audio.play('boing');
      scene.tweens.add({ targets: strip, scaleY: 0.6, duration: AWNINGS.squashMs / 2, yoyo: true });
    });
  }
}
