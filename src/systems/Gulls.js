import Phaser from 'phaser';
import { GULLS } from '../config.js';
import { TEX, ANIM } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Seagulls over Poole quay. Each one hovers out of reach over one end of its
// stretch (GULLS.pauseMs), squawks, swoops across to the other end in a dip
// that comes down to head height in the middle (GULLS.passMs), hovers there,
// and swoops back. Touching one is a death (through player.die()). The
// pattern never changes, so it can be read: wait at the edge, follow it as it
// swoops away, and you're under it while it hovers at the far end.
export default class Gulls {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x0: number, x1: number, y: number, offsetMs: number }[]} defs stretch (px) and the surface below
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.scene = scene;
    this.cycleMs = 2 * (GULLS.passMs + GULLS.pauseMs);
    this.group = scene.physics.add.group({ allowGravity: false });
    this.items = defs.map((d) => {
      const gull = this.group.create(d.x0, d.y - GULLS.hoverPx, TEX.GULL).setDepth(DEPTH.player + 1);
      gull.body.setSize(10, 7).setOffset(3, 2);
      gull.def = d;
      gull.clock = ((d.offsetMs % this.cycleMs) + this.cycleMs) % this.cycleMs;
      gull.swooping = false;
      gull.play(ANIM.GULL_FLAP);
      this.place(gull);
      return gull;
    });
    scene.physics.add.overlap(player, this.group, () => {
      if (!player.dead) player.die();
    });

    const onUpdate = (_t, delta) => {
      if (!this.scene || !scene.sys.isActive()) return;
      this.update(delta);
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off('update', onUpdate));
  }

  /** Where a gull is at its clock: { x, y, dir, swooping }. */
  pose(gull) {
    const { x0, x1, y } = gull.def;
    const { passMs, pauseMs, hoverPx, lowPx } = GULLS;
    // Hover over the near end, swoop right, hover over the far end, swoop back.
    let t = gull.clock;
    const swoop = (u, from, to) => ({
      x: from + (to - from) * u,
      y: y - hoverPx + (hoverPx - lowPx) * Math.sin(Math.PI * u),
      dir: to > from ? 1 : -1,
      swooping: true,
    });
    const bob = (x, dir) => ({ x, y: y - hoverPx + Math.sin(gull.clock / 180) * 2, dir, swooping: false });
    if (t < pauseMs) return bob(x0, 1);
    t -= pauseMs;
    if (t < passMs) return swoop(t / passMs, x0, x1);
    t -= passMs;
    if (t < pauseMs) return bob(x1, -1);
    t -= pauseMs;
    return swoop(t / passMs, x1, x0);
  }

  place(gull) {
    const p = this.pose(gull);
    gull.setPosition(p.x, p.y).setFlipX(p.dir < 0);
    gull.body.reset(p.x, p.y);
    if (p.swooping && !gull.swooping && this.onScreen(gull)) Audio.play('squawk');
    gull.swooping = p.swooping;
  }

  onScreen(gull) {
    const v = this.scene.cameras.main.worldView;
    return gull.x > v.x && gull.x < v.right;
  }

  update(delta) {
    for (const gull of this.items) {
      gull.clock = (gull.clock + delta) % this.cycleMs;
      this.place(gull);
    }
  }
}
