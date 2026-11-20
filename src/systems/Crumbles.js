import Phaser from 'phaser';
import { CRUMBLE } from '../config.js';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Crumbling crates: solid stepping stones over a gap. Landing on one starts a
// shake; after CRUMBLE.shakeMs it drops away (no body), and it comes back
// CRUMBLE.returnMs later, or at once when the player respawns, so a crate that
// fell while the player was still behind it can never strand them.
//
//   idle → shaking → fallen → idle
export default class Crumbles {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number }[]} defs world top-left of each crate tile
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.scene = scene;
    this.player = player;
    this.group = scene.physics.add.staticGroup();
    // A cracked crate outdoors; inside the pub (theme `crumble: 'stool'`), a wobbly bar stool.
    const texture = scene.level?.theme?.crumble === 'stool' ? TEX.STOOL : TEX.CRUMBLE;
    this.items = defs.map((d) => {
      const img = this.group.create(d.x + 8, d.y + 8, texture).setDepth(DEPTH.ground);
      img.home = { x: img.x, y: img.y };
      img.state = 'idle';
      return img;
    });
    scene.physics.add.collider(player, this.group, (_p, crate) => {
      player.standOn();
      this.onTouch(crate);
    });

    const onRespawn = () => this.items.forEach((c) => this.restore(c));
    player.on('respawned', onRespawn);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => player.off('respawned', onRespawn));
  }

  /** Standing on it (not bumping its side) starts the shake. */
  onTouch(crate) {
    if (crate.state !== 'idle') return;
    const p = this.player.body;
    if (!(p.touching.down || p.blocked.down) || p.bottom > crate.body.top + 2) return;
    crate.state = 'shaking';
    crate.shake = this.scene.tweens.add({
      targets: crate,
      x: { from: crate.home.x - CRUMBLE.shakePx, to: crate.home.x + CRUMBLE.shakePx },
      duration: 50,
      yoyo: true,
      repeat: -1,
    });
    crate.timer = this.scene.time.delayedCall(CRUMBLE.shakeMs, () => this.fall(crate));
  }

  fall(crate) {
    crate.shake?.remove();
    crate.state = 'fallen';
    crate.body.enable = false;
    Audio.play('crumble');
    crate.drop = this.scene.tweens.add({
      targets: crate,
      x: crate.home.x,
      y: crate.home.y + 40,
      angle: 25,
      alpha: 0,
      duration: CRUMBLE.fallMs,
      ease: 'Quad.In',
    });
    crate.timer = this.scene.time.delayedCall(CRUMBLE.returnMs, () => this.restore(crate));
  }

  /** Back in place, solid again. Waits if the player is standing in its spot. */
  restore(crate) {
    if (crate.state === 'idle') return;
    const spot = new Phaser.Geom.Rectangle(crate.home.x - 8, crate.home.y - 8, 16, 16);
    const b = this.player.body;
    const body = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
    if (!this.player.dead && Phaser.Geom.Intersects.RectangleToRectangle(body, spot)) {
      crate.timer = this.scene.time.delayedCall(200, () => this.restore(crate));
      return;
    }
    crate.timer?.remove();
    crate.shake?.remove();
    crate.drop?.remove();
    crate.state = 'idle';
    crate.setPosition(crate.home.x, crate.home.y).setAngle(0).setAlpha(1);
    crate.body.enable = true;
    crate.refreshBody();
  }
}
