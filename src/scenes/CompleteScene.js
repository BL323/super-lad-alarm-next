import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { TIMING } from '../config.js';
import { restartOnWidthChange } from '../ui/relayout.js';
import { playerTextureKey, playerAnimKey } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import { addBackdrop, addPanel } from '../ui/backdrop.js';
import Button from '../ui/Button.js';
import { getLevel } from '../level/levels.js';
import { formatTime, formatSeconds } from '../systems/GameState.js';
import Audio from '../systems/Audio.js';

// "Level Complete": the run time, +2 s for every pint left behind, −5 s for
// the espresso martini, and the final time. Nothing is saved. Play again
// goes straight back to the same level with the same lad and fresh state.
// If the level registry names a next level, a NEXT button is offered.
export default class CompleteScene extends Phaser.Scene {
  constructor() {
    super(SCENE.COMPLETE);
  }

  init(data) {
    this.result = data;
  }

  create() {
    const r = this.result;
    const { groundY } = addBackdrop(this);
    const cx = this.scale.width / 2;
    restartOnWidthChange(this, () => this.result);
    const levelDef = getLevel(r.levelId);

    addPanel(this, cx, 68, 256, 120);
    addPixelText(this, cx, 14, 'LEVEL COMPLETE', { scale: 3, tint: 0xffcd75 }).setOrigin(0.5, 0);

    // Breakdown: label on the left, value on the right.
    const left = cx - 116;
    const right = cx + 116;
    const row = (y, label, value, tint = 0xffffff) => {
      addPixelText(this, left, y, label, { scale: 2, tint }).setOrigin(0, 0);
      addPixelText(this, right, y, value, { scale: 2, tint }).setOrigin(1, 0);
    };
    row(40, 'TIME', formatTime(r.elapsedMs));
    row(56, `PINTS ${r.coins}/${r.coinsTotal}`, r.missed ? `+${formatSeconds(r.penaltyMs)}` : 'ALL!');
    if (r.bonusesTotal) row(72, 'MARTINI', r.bonuses ? `-${formatSeconds(r.bonusMs)}` : 'MISSED');
    addPixelText(this, cx, 89, r.missed ? `${formatSeconds(TIMING.missedPintPenaltyMs)} FOR EACH MISSED PINT` : 'NO PENALTY', { scale: 1 }).setOrigin(0.5, 0);
    row(102, 'FINAL TIME', formatTime(r.finalMs), 0xffcd75);

    // The lad celebrates on the platform.
    const lad = this.add.sprite(36, groundY, playerTextureKey(r.characterId)).setOrigin(0.5, 1);
    lad.play(playerAnimKey(r.characterId, 'jump'));
    this.tweens.add({ targets: lad, y: groundY - 14, duration: 300, yoyo: true, repeat: -1, ease: 'Quad.Out' });

    const again = () => this.scene.start(SCENE.GAME, { levelId: r.levelId, characterId: r.characterId });
    const menu = () => this.scene.start(SCENE.MENU);
    const next = levelDef.next
      ? () => this.scene.start(SCENE.GAME, { levelId: levelDef.next, characterId: r.characterId })
      : null;

    this.buttons = [
      new Button(this, cx - 58, 154, 'MENU', menu, { width: 84 }),
      new Button(this, cx + 58, 154, 'PLAY AGAIN', again, { width: 112 }),
    ];
    if (next) this.buttons.push(new Button(this, cx + 58, 124, 'NEXT', next, { width: 112 }));
    this.focus = next ? 2 : 1;
    // Every button blips when pressed (tap or keyboard).
    for (const b of this.buttons) {
      const run = b.onClick;
      b.onClick = () => {
        Audio.play('select');
        run();
      };
    }
    this.actions = this.buttons.map((b) => b.onClick);
    this.refreshFocus();

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.moveFocus(-1));
    kb.on('keydown-RIGHT', () => this.moveFocus(1));
    kb.once('keydown-ENTER', () => this.actions[this.focus]());
    kb.once('keydown-SPACE', () => this.actions[this.focus]());
    kb.once('keydown-ESC', menu);
  }

  moveFocus(d) {
    Audio.play('move');
    this.focus = Phaser.Math.Wrap(this.focus + d, 0, this.buttons.length);
    this.refreshFocus();
  }

  refreshFocus() {
    this.buttons.forEach((b, i) => b.setFocused(i === this.focus));
  }
}
