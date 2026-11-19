import Phaser from 'phaser';
import { HUD } from '../config.js';
import { TEX } from '../assets.js';
import { addPixelText } from './text.js';
import { formatTime, formatSeconds } from '../systems/GameState.js';
import { safeAreaInGame } from './safeArea.js';
import BossBar from './BossBar.js';

// Pint counter (collected/total) at top left, run timer at top right. The
// counter updates on the GameScene's 'pickup' event and bumps; the timer
// updates every frame and stops at the finish.
export default class Hud {
  constructor(scene, gameScene, gameState) {
    this.scene = scene;
    this.gameState = gameState;

    this.icon = scene.add.image(0, 0, TEX.PINT, 0).setOrigin(0, 0);
    this.coins = addPixelText(scene, 0, 0, '', { scale: HUD.textScale }).setOrigin(0, 0.5);
    this.timer = addPixelText(scene, 0, 0, '', { scale: HUD.textScale }).setOrigin(1, 0.5);
    this.shownTime = null;
    this.toast = addPixelText(scene, 0, 40, '', { scale: HUD.textScale, tint: 0xffcd75 })
      .setOrigin(0.5)
      .setAlpha(0);

    this.bossBar = new BossBar(scene, gameScene, (text) => this.showToast(text));

    this.layout();
    this.refresh();

    const onPickup = ({ def }) => {
      this.refresh();
      if (def.counts) this.bump([this.coins, this.icon]);
      if (def.timeBonusMs) this.bump([this.timer]);
      if (def.label) this.showToast(def.timeBonusMs ? `${def.label} -${formatSeconds(def.timeBonusMs)}` : def.label);
    };
    const onComplete = () => {
      this.update();
      this.timer.setTint(0xffcd75);
      this.bump([this.timer]);
      this.showToast('CHEERS!');
    };
    const onToast = (text) => this.showToast(text); // any system can put up a message
    gameScene.events.on('pickup', onPickup);
    gameScene.events.on('level-complete', onComplete);
    gameScene.events.on('toast', onToast);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameScene.events.off('pickup', onPickup);
      gameScene.events.off('level-complete', onComplete);
      gameScene.events.off('toast', onToast);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  layout() {
    const safe = safeAreaInGame(this.scene.scale);
    const top = Math.round(safe.top + HUD.margin);
    const left = Math.round(safe.left + HUD.margin);
    const width = this.scene.scale.width;
    const right = Math.round(width - safe.right - HUD.margin);
    this.toast.x = Math.round(width / 2);
    this.bossBar.container.x = Math.round(width / 2);
    this.icon.setPosition(left, top);
    const midY = top + 8; // centre of the 16 px icon
    this.coins.setPosition(left + 18, midY);
    this.timer.setPosition(right, midY);
  }

  refresh() {
    const s = this.gameState;
    this.coins.setText(`${s.coins}/${s.coinsTotal}`);
    this.update();
  }

  /** Called every frame; only re-renders when the shown tenth changes. */
  update() {
    const text = formatTime(this.gameState.elapsedMs);
    if (text !== this.shownTime) {
      this.shownTime = text;
      this.timer.setText(text);
    }
  }

  bump(targets) {
    for (const t of targets) {
      const base = t === this.icon ? 1 : HUD.textScale;
      this.scene.tweens.killTweensOf(t);
      t.setScale(base);
      this.scene.tweens.add({ targets: t, scale: base * HUD.bumpScale, duration: HUD.bumpMs, yoyo: true, ease: 'Quad.Out' });
    }
  }

  showToast(text) {
    this.scene.tweens.killTweensOf(this.toast);
    this.toast.setText(text).setAlpha(1).setY(40);
    this.scene.tweens.add({ targets: this.toast, y: 32, alpha: 0, delay: 900, duration: 500 });
  }
}
