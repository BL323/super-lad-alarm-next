import Phaser from 'phaser';
import { addPixelText } from './text.js';

// A speech bubble that follows a sprite: dark rounded box, white pixel text,
// and a tail pointing at the speaker's head. Kept inside the camera view.
export default class SpeechBubble extends Phaser.GameObjects.Container {
  constructor(scene, target, text, { scale = 2, durationMs = 2500, depth = 50 } = {}) {
    super(scene, target.x, target.y);
    this.target = target;

    const label = addPixelText(scene, 0, 0, text, { scale }).setOrigin(0.5, 0.5);
    const padX = 5;
    const padY = 4;
    const w = Math.ceil(label.width + padX * 2);
    const h = Math.ceil(label.height + padY * 2);
    this.boxW = w;
    this.boxH = h;
    this.tail = scene.add.graphics();
    const box = scene.add.graphics();
    box.fillStyle(0x1d2b53, 0.92).fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    box.lineStyle(1, 0xffffff, 1).strokeRoundedRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, 4);
    this.add([this.tail, box, label]);
    this.setDepth(depth).setScale(0);
    scene.add.existing(this);

    this.follow = () => this.reposition();
    scene.events.on('update', this.follow);
    this.reposition();

    scene.tweens.add({ targets: this, scale: 1, duration: 160, ease: 'Back.Out' });
    scene.time.delayedCall(durationMs, () => {
      scene.tweens.add({ targets: this, scale: 0, alpha: 0, duration: 160, onComplete: () => this.destroy() });
    });
  }

  reposition() {
    // The listener can still fire once in the frame this bubble is destroyed
    // (the emitter snapshots its listeners), so bail out if we're gone.
    if (!this.scene || !this.target.active) return;
    const cam = this.scene.cameras.main;
    const headY = this.target.y - this.target.displayHeight / 2;
    const y = headY - 8 - this.boxH / 2;
    // Keep the box on screen; the tail still points at the speaker.
    const min = cam.scrollX + this.boxW / 2 + 2;
    const max = cam.scrollX + cam.width - this.boxW / 2 - 2;
    const x = Phaser.Math.Clamp(this.target.x, min, max);
    this.setPosition(Math.round(x), Math.round(y));

    const tx = Phaser.Math.Clamp(this.target.x - x, -this.boxW / 2 + 5, this.boxW / 2 - 5);
    this.tail
      .clear()
      .fillStyle(0x1d2b53, 0.92)
      .fillTriangle(tx - 3, this.boxH / 2 - 1, tx + 3, this.boxH / 2 - 1, tx, this.boxH / 2 + 5)
      .lineStyle(1, 0xffffff, 1)
      .lineBetween(tx - 3, this.boxH / 2, tx, this.boxH / 2 + 5)
      .lineBetween(tx + 3, this.boxH / 2, tx, this.boxH / 2 + 5);
  }

  destroy(fromScene) {
    this.scene?.events.off('update', this.follow);
    super.destroy(fromScene);
  }
}
