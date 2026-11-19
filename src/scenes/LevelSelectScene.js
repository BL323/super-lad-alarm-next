import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { LEVEL_SELECT } from '../config.js';
import { PUBS } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import { addBackdrop } from '../ui/backdrop.js';
import Button from '../ui/Button.js';
import { setupButtonFocus } from '../ui/buttonFocus.js';
import { restartOnWidthChange } from '../ui/relayout.js';
import { isTouchDevice } from '../systems/device.js';
import { CRAWL_KEY, createCrawl } from '../systems/GameState.js';
import { LEVELS } from '../level/levels.js';
import Audio from '../systems/Audio.js';

// Pick where to start the crawl: one row per level (number, route, target
// pub). Tap a row to highlight it, tap it again (or GO!) to start. Starting
// creates a fresh crawl; it runs on from that level to the end.
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE.LEVEL_SELECT);
  }

  init(data) {
    this.startIndex = data?.index ?? 0; // kept across a restart for a width change
  }

  create() {
    // Phaser reuses this scene object on every visit: clear last visit's flag.
    this.going = false;
    addBackdrop(this);
    const width = this.scale.width;
    const cx = width / 2;
    restartOnWidthChange(this, () => ({ index: this.index }));

    addPixelText(this, cx, 10, 'WHERE TO START?', { scale: 2, tint: 0xffcd75 }).setOrigin(0.5, 0);
    addPixelText(this, cx, 26, isTouchDevice() ? 'TAP A STOP, THEN GO' : 'UP/DOWN TO CHOOSE - ENTER TO GO', {
      scale: 1,
    }).setOrigin(0.5, 0);

    const { top, rowHeight, rowWidth } = LEVEL_SELECT;
    const left = Math.round(cx - rowWidth / 2);
    this.rows = LEVELS.map((level, i) => {
      const y = top + i * rowHeight;
      const bg = this.add.graphics();
      const num = addPixelText(this, left + 8, y + rowHeight / 2, String(level.number), { scale: 2 }).setOrigin(0, 0.5);
      const route = addPixelText(this, left + 26, y + rowHeight / 2, `${level.from} - ${level.to}`, { scale: 1 }).setOrigin(
        0,
        0.5,
      );
      const pub = addPixelText(this, left + rowWidth - 8, y + rowHeight / 2, PUBS[level.pub]?.name ?? '', {
        scale: 1,
      }).setOrigin(1, 0.5);
      const zone = this.add
        .zone(left, y, rowWidth, rowHeight - 2)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (this.index !== i) return this.select(i);
        Audio.play('select');
        this.go();
      });
      return { level, y, bg, num, route, pub };
    });
    this.rowLeft = left;

    const back = new Button(this, 60, 154, 'BACK', () => this.scene.start(SCENE.SELECT), { width: 72 });
    const go = new Button(this, width - 60, 154, 'GO!', () => this.go(), { width: 72 });
    setupButtonFocus(this, [back, go], { focus: 1, onEscape: () => this.scene.start(SCENE.SELECT) });

    const kb = this.input.keyboard;
    for (const key of ['UP', 'W']) kb.on(`keydown-${key}`, () => this.select(this.index - 1));
    for (const key of ['DOWN', 'S']) kb.on(`keydown-${key}`, () => this.select(this.index + 1));

    this.ready = false; // no blip for the initial highlight
    this.select(Math.min(this.startIndex, LEVELS.length - 1));
    this.ready = true;
  }

  select(i) {
    const next = Phaser.Math.Wrap(i, 0, this.rows.length);
    if (this.ready && next !== this.index) Audio.play('move');
    this.index = next;
    const { rowHeight, rowWidth } = LEVEL_SELECT;
    this.rows.forEach((row, j) => {
      const on = j === this.index;
      row.bg
        .clear()
        .fillStyle(on ? 0x29366f : 0x1a1c2c, on ? 0.85 : 0.55)
        .fillRoundedRect(this.rowLeft, row.y, rowWidth, rowHeight - 2, 4)
        .lineStyle(1, on ? 0xffcd75 : 0xffffff, on ? 1 : 0.3)
        .strokeRoundedRect(this.rowLeft + 0.5, row.y + 0.5, rowWidth - 1, rowHeight - 3, 4);
      const tint = on ? 0xffcd75 : 0xffffff;
      row.num.setTint(tint);
      row.route.setTint(tint);
      row.pub.setTint(on ? 0xffcd75 : 0xc2c3c7);
    });
  }

  go() {
    if (this.going) return;
    this.going = true;
    const level = this.rows[this.index].level;
    this.registry.set(CRAWL_KEY, createCrawl(level.id));
    this.scene.start(SCENE.NEXT_STOP, { levelId: level.id });
  }
}
