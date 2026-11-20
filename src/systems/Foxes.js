import Phaser from 'phaser';
import { FOXES } from '../config.js';
import { TEX, ANIM } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Urban foxes (level 10): each darts along its stretch of pavement in bursts
// (FOXES.runMs), stops to sniff (FOXES.pauseMs), and turns at the ends.
// Deadly to touch and too quick to stomp; a shout from the megaphone sends
// them running off. They come back when the player respawns.
export default class Foxes {
  constructor(scene, defs, player) {
    this.scene = scene;
    this.player = player;
    this.group = scene.physics.add.group({ allowGravity: false });
    this.items = defs.map((d, i) => {
      const fox = this.group.create(i % 2 ? d.x1 - 8 : d.x0 + 8, d.y, TEX.FOX).setOrigin(0.5, 1).setDepth(DEPTH.props);
      fox.body.setSize(12, 8).setOffset(2, 2);
      fox.range = d;
      fox.home = { x: fox.x, y: fox.y, dir: i % 2 ? -1 : 1, clock: d.offsetMs ?? i * 400 };
      this.restore(fox);
      return fox;
    });
    scene.physics.add.overlap(player, this.group, (_p, fox) => {
      if (!player.dead && !fox.gone) player.die();
    });
    const onRespawn = () => this.items.forEach((f) => this.restore(f));
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

  restore(fox) {
    this.scene.tweens.killTweensOf(fox);
    fox.gone = false;
    fox.dir = fox.home.dir;
    fox.clock = fox.home.clock;
    fox.setPosition(fox.home.x, fox.home.y).setAngle(0).setAlpha(1);
    fox.body.enable = true;
    fox.body.reset(fox.home.x, fox.home.y);
  }

  /** Shouted at: anything in the wave bolts. */
  blast(rect, dir) {
    for (const fox of this.items) {
      if (fox.gone || !Phaser.Geom.Intersects.RectangleToRectangle(rect, fox.body)) continue;
      fox.gone = true;
      fox.body.enable = false;
      fox.anims.stop();
      Audio.play('yelp');
      this.scene.tweens.add({ targets: fox, x: fox.x + dir * 120, y: fox.y - 10, alpha: 0, duration: 500, ease: 'Quad.Out' });
    }
  }

  update(delta) {
    const cycle = FOXES.runMs + FOXES.pauseMs;
    for (const fox of this.items) {
      if (fox.gone) continue;
      fox.clock = (fox.clock + delta) % cycle;
      const running = fox.clock < FOXES.runMs;
      const { x0, x1 } = fox.range;
      if (fox.dir > 0 && fox.x >= x1 - 8) fox.dir = -1;
      else if (fox.dir < 0 && fox.x <= x0 + 8) fox.dir = 1;
      fox.setVelocityX(running ? fox.dir * FOXES.speed : 0).setFlipX(fox.dir < 0);
      if (running && !fox.anims.isPlaying) fox.play(ANIM.FOX_RUN);
      if (!running && fox.anims.isPlaying) fox.anims.stop();
    }
  }
}
