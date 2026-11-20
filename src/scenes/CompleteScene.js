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
import { setupButtonFocus } from '../ui/buttonFocus.js';

// "Level Complete": the run time, +2 s for every pint left behind, −5 s for
// the espresso martini, and the final time. Nothing is saved. Play again
// goes straight back to the same level with the same lad and fresh state.
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
    // Level 10: in before closing (time off) or late (time on) replaces the pint note.
    if (r.closingMs) {
      const early = r.closingMs < 0;
      addPixelText(this, cx, 89, early ? `IN BEFORE CLOSING -${formatSeconds(-r.closingMs)}` : `LATE: SHUTTERS DOWN +${formatSeconds(r.closingMs)}`, {
        scale: 1,
        tint: early ? 0x00e436 : 0xff004d,
      }).setOrigin(0.5, 0);
    } else {
      addPixelText(this, cx, 89, r.missed ? `${formatSeconds(TIMING.missedPintPenaltyMs)} FOR EACH MISSED PINT` : 'NO PENALTY', { scale: 1 }).setOrigin(0.5, 0);
    }
    row(102, 'FINAL TIME', formatTime(r.finalMs), 0xffcd75);
    if (r.newBest) addPixelText(this, cx, 119, 'NEW BEST: YOU BEAT YOUR GHOST!', { scale: 1, tint: 0x00e436 }).setOrigin(0.5, 0);

    // The lad celebrates on the platform, just left of the buttons.
    const lad = this.add.sprite(cx - 147, groundY, playerTextureKey(r.characterId)).setOrigin(0.5, 1);
    lad.play(playerAnimKey(r.characterId, 'jump'));
    this.tweens.add({ targets: lad, y: groundY - 14, duration: 300, yoyo: true, repeat: -1, ease: 'Quad.Out' });

    // PLAY AGAIN replays this level (its new time replaces this one in the
    // crawl). NEXT goes on via the next stop screen; after the last level,
    // TOTAL shows the crawl summary instead.
    const again = () => this.scene.start(SCENE.GAME, { levelId: r.levelId, characterId: r.characterId });
    const menu = () => this.scene.start(SCENE.MENU);
    const [nextLabel, onNext] = levelDef.next
      ? ['NEXT', () => this.scene.start(SCENE.NEXT_STOP, { levelId: levelDef.next })]
      : ['TOTAL', () => this.scene.start(SCENE.CRAWL_COMPLETE)];

    // One row under the panel: MENU, PLAY AGAIN, NEXT (or TOTAL), 268 px wide.
    const buttons = [
      new Button(this, cx - 103, 154, 'MENU', menu, { width: 62 }),
      new Button(this, cx - 10, 154, 'PLAY AGAIN', again, { width: 112 }),
      new Button(this, cx + 93, 154, nextLabel, onNext, { width: 82 }),
    ];
    setupButtonFocus(this, buttons, { focus: 2, onEscape: menu });
  }
}
