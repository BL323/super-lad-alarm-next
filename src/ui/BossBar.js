import Phaser from 'phaser';
import { addPixelText } from './text.js';

// "CONDUCTOR" with one pip per remaining hit, top centre, shown during the
// fight. Driven by the GameScene's boss-* events.
export default class BossBar {
  constructor(scene, gameScene, showToast) {
    this.scene = scene;
    // x is re-centred by Hud.layout() when the game width changes.
    this.container = scene.add.container(scene.scale.width / 2, 6).setVisible(false);
    this.label = addPixelText(scene, 0, 0, 'CONDUCTOR', { scale: 1, tint: 0xffcd75 }).setOrigin(0.5, 0);
    this.pips = scene.add.graphics();
    this.container.add([this.label, this.pips]);

    const handlers = {
      'boss-start': ({ hits }) => {
        this.total = hits;
        this.draw(hits);
        this.container.setVisible(true);
        showToast('TICKETS PLEASE!');
      },
      'boss-hit': ({ hp }) => {
        this.draw(hp);
        scene.tweens.add({ targets: this.container, scale: 1.2, duration: 80, yoyo: true });
      },
      'boss-reset': () => this.container.setVisible(false),
      'boss-defeated': () => {
        this.draw(0);
        showToast('CONDUCTOR BEATEN!');
        scene.time.delayedCall(1200, () => this.container.setVisible(false));
      },
    };
    for (const [evt, fn] of Object.entries(handlers)) gameScene.events.on(evt, fn);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [evt, fn] of Object.entries(handlers)) gameScene.events.off(evt, fn);
    });
  }

  draw(hp) {
    const g = this.pips.clear();
    const w = 10;
    const gap = 3;
    const x0 = -((this.total * w + (this.total - 1) * gap) / 2);
    for (let i = 0; i < this.total; i++) {
      const x = x0 + i * (w + gap);
      g.fillStyle(0x1a1c2c, 0.8).fillRect(x, 8, w, 5);
      if (i < hp) g.fillStyle(0xff004d, 1).fillRect(x + 1, 9, w - 2, 3);
    }
  }
}
