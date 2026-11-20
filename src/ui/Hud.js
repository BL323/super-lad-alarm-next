import Phaser from 'phaser';
import { HUD, CLOSING } from '../config.js';
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

    // Level 10: time left before the kebab shop shuts, and the megaphone's charge.
    this.gameScene = gameScene;
    this.closing = addPixelText(scene, 0, 0, '', { scale: 1, tint: 0xffcd75 }).setOrigin(1, 0).setVisible(!!gameState.closingMs);
    this.megaIcon = scene.add.image(0, 0, TEX.MEGAPHONE).setOrigin(0, 0.5).setVisible(false);
    this.megaBar = scene.add.graphics().setVisible(false);

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
    this.closing.setPosition(right, top + 18);
    this.megaIcon.setPosition(left + 2, top + 24);
    this.megaBar.setPosition(left + 16, top + 22);
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
    const s = this.gameState;
    if (s.closingMs) {
      const left = Math.max(0, s.closingMs - s.elapsedMs);
      const shown = left > 0 ? `KEBAB SHOP SHUTS ${formatTime(left).slice(0, -2)}` : 'KEBAB SHOP SHUT';
      if (shown !== this.shownClosing) {
        this.shownClosing = shown;
        this.closing.setText(shown).setTint(left > CLOSING.warnAtMs ? 0xffcd75 : 0xff004d);
      }
    }
    const mega = this.gameScene.megaphone;
    if (mega?.got) {
      this.megaIcon.setVisible(true);
      const charge = mega.charge;
      const g = this.megaBar.setVisible(true).clear();
      g.fillStyle(0x1a1c2c, 0.8).fillRect(0, 0, 22, 4);
      g.fillStyle(charge >= 1 ? 0x00e436 : 0xffcd75, 1).fillRect(1, 1, Math.round(20 * charge), 2);
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
