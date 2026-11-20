import Phaser from 'phaser';
import { MEGAPHONE } from '../config.js';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';
import { isTouchDevice } from './device.js';

// The megaphone (level 10). It waits, bobbing, where the level puts it; walk
// into it and Naylor holds it up for the rest of the level, and the shout
// button appears. Each shout (MEGAPHONE.cooldownMs apart) sends a sound wave
// `rangePx` ahead, `heightPx` tall: anything in it that can be shouted at
// (foxes, wheelie bins, bouncers: each system's `blast(rect, dir)`) reacts.
// Only the shout input is read here, from VirtualInput like everything else.
export default class Megaphone {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x: number, y: number }} def where the pickup waits (feet position)
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @param {import('./Input.js').default} controls
   * @param {{ blast: (rect: Phaser.Geom.Rectangle, dir: number) => void }[]} targets
   */
  constructor(scene, def, player, controls, targets) {
    this.scene = scene;
    this.player = player;
    this.controls = controls;
    this.targets = targets.filter(Boolean);
    this.got = false;
    this.readyAt = 0;

    this.pickup = scene.physics.add.staticImage(def.x, def.y - 10, TEX.MEGAPHONE).setDepth(DEPTH.props);
    scene.tweens.add({ targets: this.pickup, y: this.pickup.y - 3, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    scene.physics.add.overlap(player, this.pickup, () => this.take());

    // What Naylor holds up once he has it.
    this.held = scene.add.image(0, 0, TEX.MEGAPHONE).setDepth(DEPTH.player + 1).setVisible(false);

    let stopped = false;
    const onUpdate = () => {
      if (stopped) return;
      this.update();
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopped = true;
      scene.events.off('update', onUpdate);
    });
  }

  take() {
    if (this.got || this.player.dead) return;
    this.got = true;
    this.pickup.destroy();
    this.held.setVisible(true);
    Audio.play('bonus');
    this.scene.events.emit('megaphone-got');
    this.scene.events.emit('toast', isTouchDevice() ? MEGAPHONE.hintTouch : MEGAPHONE.hintKeys);
  }

  /** 0..1: how ready the next shout is (for the HUD). */
  get charge() {
    if (!this.got) return 0;
    return Phaser.Math.Clamp(1 - (this.readyAt - this.scene.time.now) / MEGAPHONE.cooldownMs, 0, 1);
  }

  update() {
    if (!this.got) return;
    const p = this.player;
    const dir = p.flipX ? -1 : 1;
    this.held.setVisible(!p.dead && p.visible).setFlipX(dir < 0).setPosition(p.x + dir * 6, p.y - 1);
    if (this.controls.state.shoutPressed && !p.dead && !p.enteringDoor && this.scene.time.now >= this.readyAt) this.shout(dir);
  }

  shout(dir) {
    const p = this.player;
    this.readyAt = this.scene.time.now + MEGAPHONE.cooldownMs;
    Audio.play('shout');
    const { rangePx, heightPx, waveMs } = MEGAPHONE;
    const x0 = p.x + dir * 8;
    const midY = p.body.bottom - heightPx / 2;
    // Three rings rolling out.
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.image(x0, midY, TEX.SHOUT_WAVE).setFlipX(dir < 0).setDepth(DEPTH.player + 2).setAlpha(0.9);
      this.scene.tweens.add({
        targets: ring,
        x: x0 + dir * rangePx,
        scaleY: 1.3,
        alpha: 0,
        duration: waveMs,
        delay: i * 70,
        onComplete: () => ring.destroy(),
      });
    }
    const left = dir > 0 ? p.x : p.x - rangePx;
    const rect = new Phaser.Geom.Rectangle(left, p.body.bottom - heightPx, rangePx, heightPx + 2);
    for (const t of this.targets) t.blast(rect, dir);
    this.scene.events.emit('shout', rect);
  }
}
