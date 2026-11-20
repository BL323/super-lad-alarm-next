import Phaser from 'phaser';
import { BINS } from '../config.js';
import { TEX, ANIM, BIN_FRAME } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Wheelie bins (level 10). Each spawner sends a bin rolling along the pavement
// every `everyMs` (from where its cycle starts, `offsetMs`); a bin rolls until
// it drops off an edge or bumps into something, then it's gone. Touching one
// from the side is a death; land on it and you bounce off; a shout knocks it
// over. A respawn clears them all and restarts the spawners.
export default class Bins {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, dir: number, everyMs: number, offsetMs: number }[]} defs
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @param {Phaser.Tilemaps.TilemapLayer} ground
   */
  constructor(scene, defs, player, ground) {
    this.scene = scene;
    this.player = player;
    this.spawners = defs.map((d) => ({ ...d, clock: d.offsetMs ?? 0 }));
    this.group = scene.physics.add.group({ allowGravity: true });
    scene.physics.add.collider(this.group, ground);
    scene.physics.add.overlap(player, this.group, (_p, bin) => this.onTouch(bin));
    const onRespawn = () => {
      for (const bin of [...this.group.getChildren()]) bin.destroy();
      this.spawners.forEach((s) => (s.clock = s.offsetMs ?? 0));
    };
    player.on('respawned', onRespawn);
    let stopped = false;
    const onUpdate = (_t, delta) => {
      if (stopped) return;
      this.update(delta);
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopped = true;
      scene.events.off('update', onUpdate);
      player.off('respawned', onRespawn);
    });
  }

  spawn(s) {
    const bin = this.group.create(s.x, s.y - BIN_FRAME.height / 2, TEX.BIN).setDepth(DEPTH.props);
    bin.body.setSize(10, 14).setOffset(1, 2);
    bin.dir = s.dir;
    bin.setVelocityX(s.dir * BINS.speed).setFlipX(s.dir < 0);
    bin.play(ANIM.BIN_ROLL);
    bin.rolled = 0;
  }

  onTouch(bin) {
    const p = this.player;
    if (p.dead || bin.knocked) return;
    const prevBottom = p.body.prev.y + p.body.height;
    if (p.body.velocity.y >= 0 && prevBottom <= bin.body.top + 5) {
      p.standOn();
      p.bounce(BINS.bounce);
      Audio.play('bounce');
      return;
    }
    p.die();
  }

  blast(rect, dir) {
    for (const bin of [...this.group.getChildren()]) {
      if (bin.knocked || !Phaser.Geom.Intersects.RectangleToRectangle(rect, bin.body)) continue;
      this.knock(bin, dir);
    }
  }

  knock(bin, dir) {
    bin.knocked = true;
    bin.body.enable = false;
    bin.anims.stop();
    Audio.play('clunk');
    this.scene.tweens.add({
      targets: bin,
      x: bin.x + dir * 40,
      y: bin.y - 12,
      angle: dir * 120,
      alpha: 0,
      duration: 450,
      ease: 'Quad.Out',
      onComplete: () => bin.destroy(),
    });
  }

  update(delta) {
    if (this.player.dead) return;
    for (const s of this.spawners) {
      s.clock += delta;
      // Never send one out on top of the player: it waits till they're clear.
      if (s.clock >= s.everyMs && Math.abs(this.player.x - s.x) > 28) {
        s.clock -= s.everyMs;
        this.spawn(s);
      }
    }
    const worldBottom = this.scene.physics.world.bounds.bottom;
    for (const bin of [...this.group.getChildren()]) {
      if (bin.knocked) continue;
      const stuck = (bin.dir > 0 && bin.body.blocked.right) || (bin.dir < 0 && bin.body.blocked.left);
      if (stuck || bin.y > worldBottom + 20) {
        bin.destroy();
        continue;
      }
      bin.setVelocityX(bin.dir * BINS.speed);
    }
  }
}
