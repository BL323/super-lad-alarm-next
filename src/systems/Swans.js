import Phaser from 'phaser';
import { SWANS } from '../config.js';
import { TEX, ANIM } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';

// Swans on Wareham's riverbank: each waddles up and down its stretch of the
// bank. Touching one is a death (through player.die()), and they can't be
// stomped: they're bigger than you think. Jump over them.
export default class Swans {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x0: number, x1: number, y: number }[]} defs patrol range (px) and the surface they walk on
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.group = scene.physics.add.group({ allowGravity: false });
    this.items = defs.map((d, i) => {
      const swan = this.group.create(i % 2 ? d.x1 - 8 : d.x0 + 8, d.y, TEX.SWAN).setOrigin(0.5, 1).setDepth(DEPTH.props);
      swan.body.setSize(12, 11).setOffset(2, 4);
      swan.range = d;
      swan.dir = i % 2 ? -1 : 1;
      swan.play(ANIM.SWAN_WALK);
      return swan;
    });
    scene.physics.add.overlap(player, this.group, () => {
      if (!player.dead) player.die();
    });

    const onUpdate = () => {
      if (!scene.sys.isActive()) return;
      this.update();
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off('update', onUpdate));
  }

  update() {
    for (const swan of this.items) {
      const { x0, x1 } = swan.range;
      if (swan.dir > 0 && swan.x >= x1 - 8) swan.dir = -1;
      else if (swan.dir < 0 && swan.x <= x0 + 8) swan.dir = 1;
      swan.setVelocityX(swan.dir * SWANS.speed).setFlipX(swan.dir < 0);
    }
  }
}
