import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { restartOnWidthChange } from '../ui/relayout.js';
import { CHARACTERS, getCharacter, playerTextureKey, playerAnimKey } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import { addBackdrop } from '../ui/backdrop.js';
import Button from '../ui/Button.js';
import { isTouchDevice } from '../systems/device.js';
import Audio from '../systems/Audio.js';

const CARD = { w: 92, h: 78, y: 82, spacing: 100, spriteScale: 3 }; // wide enough for "SEA LORD"

// Pick Naylor's outfit, then where to start (the level picker). Looks only; everyone plays the same.
// The choice is kept in the game registry ('characterId') for replays.
export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE.SELECT);
  }

  init(data) {
    this.startIndex = data?.index; // kept across a restart for a width change
  }

  create() {
    addBackdrop(this);
    const cx = this.scale.width / 2;
    restartOnWidthChange(this, () => ({ index: this.index }));
    addPixelText(this, cx, 10, 'CHOOSE YOUR NAYLOR', { scale: 2, tint: 0xffcd75 }).setOrigin(0.5, 0);
    addPixelText(this, cx, 26, isTouchDevice() ? 'TAP AN OUTFIT, THEN GO' : 'LEFT/RIGHT TO CHOOSE - ENTER TO GO', {
      scale: 1,
    }).setOrigin(0.5, 0);

    const current = getCharacter(this.registry.get('characterId')).id; // falls back to the default (Casual)
    this.index = this.startIndex ?? CHARACTERS.findIndex((c) => c.id === current);

    this.cards = CHARACTERS.map((c, i) => {
      const x = cx + (i - (CHARACTERS.length - 1) / 2) * CARD.spacing;
      const bg = this.add.graphics();
      const sprite = this.add
        .sprite(x, CARD.y + 18, playerTextureKey(c.id))
        .setOrigin(0.5, 1)
        .setScale(CARD.spriteScale);
      const name = addPixelText(this, x, CARD.y + 24, c.name, { scale: 2 }).setOrigin(0.5, 0);
      const zone = this.add.zone(x, CARD.y, CARD.w, CARD.h).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => (this.index === i ? this.go() : this.select(i)));
      return { c, x, bg, sprite, name };
    });

    new Button(this, 60, 154, 'BACK', () => this.back(), { width: 72 });
    this.goButton = new Button(this, this.scale.width - 60, 154, 'GO!', () => this.go(), { width: 72 }).setFocused(true);

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.select(this.index - 1));
    kb.on('keydown-A', () => this.select(this.index - 1));
    kb.on('keydown-RIGHT', () => this.select(this.index + 1));
    kb.on('keydown-D', () => this.select(this.index + 1));
    kb.once('keydown-ENTER', () => this.go());
    kb.once('keydown-SPACE', () => this.go());
    kb.once('keydown-ESC', () => this.back());

    this.ready = false; // no blip for the initial highlight
    this.select(this.index);
    this.ready = true;
  }

  select(i) {
    const next = Phaser.Math.Wrap(i, 0, this.cards.length);
    if (this.ready && next !== this.index) Audio.play('move');
    this.index = next;
    this.cards.forEach((card, j) => {
      const on = j === this.index;
      const { x } = card;
      card.bg
        .clear()
        .fillStyle(on ? 0x29366f : 0x1a1c2c, on ? 0.85 : 0.55)
        .fillRoundedRect(x - CARD.w / 2, CARD.y - CARD.h / 2, CARD.w, CARD.h, 6)
        .lineStyle(on ? 2 : 1, on ? 0xffcd75 : 0xffffff, on ? 1 : 0.4)
        .strokeRoundedRect(x - CARD.w / 2 + 1, CARD.y - CARD.h / 2 + 1, CARD.w - 2, CARD.h - 2, 6);
      card.sprite.play(playerAnimKey(card.c.id, on ? 'run' : 'idle'), true).setAlpha(on ? 1 : 0.6);
      card.name.setTint(on ? 0xffcd75 : 0xffffff).setAlpha(on ? 1 : 0.7);
    });
  }

  go() {
    Audio.play('select');
    const id = this.cards[this.index].c.id;
    this.registry.set('characterId', id);
    this.scene.start(SCENE.LEVEL_SELECT);
  }

  back() {
    Audio.play('select');
    this.scene.start(SCENE.MENU);
  }
}
