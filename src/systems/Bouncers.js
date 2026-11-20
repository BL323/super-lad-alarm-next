import Phaser from 'phaser';
import { BOUNCERS, MEGAPHONE } from '../config.js';
import { TEX, BOUNCER_FRAME } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Bouncers outside Parkstone's clubs (level 8). Out on the pavement a bouncer
// is a solid wall too tall to jump (BOUNCERS.height); stepped back into his
// doorway he lets you by. A `cycle` bouncer steps out for `outMs` and back in
// for `inMs`, so you time your run. A `stand` bouncer never moves: only a
// shout from the megaphone stuns him into stepping aside, for MEGAPHONE.stunMs.
// Touching one isn't a death, you just can't get past.
export default class Bouncers {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number, mode: 'cycle' | 'stand', offsetMs: number }[]} defs feet position on the pavement
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.scene = scene;
    this.player = player;
    this.walls = scene.physics.add.staticGroup();
    this.items = defs.map((d) => {
      const sprite = scene.add.sprite(d.x, d.y, TEX.BOUNCER, BOUNCER_FRAME.standing).setOrigin(0.5, 1).setDepth(DEPTH.player - 1);
      const wall = scene.add.zone(d.x, d.y - BOUNCERS.height / 2, BOUNCERS.width, BOUNCERS.height);
      this.walls.add(wall);
      const b = { ...d, sprite, wall, out: true, stunnedUntil: 0, clock: d.offsetMs ?? 0 };
      this.setOut(b, true, true);
      return b;
    });
    scene.physics.add.collider(player, this.walls);
    const onRespawn = () => this.items.forEach((b) => {
      b.stunnedUntil = 0;
      b.clock = b.offsetMs ?? 0;
      this.setOut(b, true, true);
    });
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

  /** Step out across the pavement (solid) or back into the doorway (out of the way). */
  setOut(b, out, instant = false) {
    if (b.out === out && !instant) return;
    // Never step out onto the player: wait till they're clear.
    if (out && !instant && Math.abs(this.player.x - b.x) < BOUNCERS.width) return;
    b.out = out;
    b.wall.body.enable = out;
    const x = out ? b.x : b.x - 12;
    this.scene.tweens.killTweensOf(b.sprite);
    if (instant) b.sprite.setPosition(x, b.y).setAlpha(1).setDepth(DEPTH.player - 1);
    else this.scene.tweens.add({ targets: b.sprite, x, duration: BOUNCERS.stepMs });
    // Stepped back he stands in the doorway, behind everything on the street.
    b.sprite.setDepth(out ? DEPTH.player - 1 : DEPTH.decor + 1);
  }

  blast(rect) {
    for (const b of this.items) {
      if (!b.out || !Phaser.Geom.Intersects.RectangleToRectangle(rect, b.wall.getBounds())) continue;
      b.stunnedUntil = this.scene.time.now + MEGAPHONE.stunMs;
      b.sprite.setFrame(BOUNCER_FRAME.stunned);
      Audio.play('grunt');
      this.setOut(b, false);
    }
  }

  update(delta) {
    const now = this.scene.time.now;
    for (const b of this.items) {
      if (b.stunnedUntil) {
        if (now < b.stunnedUntil) continue;
        b.stunnedUntil = 0;
        b.sprite.setFrame(BOUNCER_FRAME.standing);
      }
      if (b.mode === 'stand') {
        this.setOut(b, true);
        continue;
      }
      b.clock = (b.clock + delta) % (BOUNCERS.outMs + BOUNCERS.inMs);
      this.setOut(b, b.clock < BOUNCERS.outMs);
    }
  }
}
