import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { playerTextureKey, playerAnimKey, getCharacter } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import { addBackdrop, addPanel } from '../ui/backdrop.js';
import Button from '../ui/Button.js';
import { setupButtonFocus } from '../ui/buttonFocus.js';
import { restartOnWidthChange } from '../ui/relayout.js';
import { CRAWL_KEY, createCrawl, crawlTotal, formatTime } from '../systems/GameState.js';
import { getLevel } from '../level/levels.js';

// End of the crawl: each level's final time and the total for the levels
// played. PLAY AGAIN starts a fresh crawl from the same first level.
export default class CrawlCompleteScene extends Phaser.Scene {
  constructor() {
    super(SCENE.CRAWL_COMPLETE);
  }

  create() {
    const { groundY } = addBackdrop(this);
    const width = this.scale.width;
    const cx = width / 2;
    restartOnWidthChange(this);
    const crawl = this.registry.get(CRAWL_KEY) ?? createCrawl(null);

    const rowH = 10;
    const panelH = 44 + crawl.results.length * rowH;
    addPanel(this, cx, 8 + panelH / 2, 256, panelH);
    addPixelText(this, cx, 14, 'CRAWL COMPLETE', { scale: 2, tint: 0xffcd75 }).setOrigin(0.5, 0);

    const left = cx - 116;
    const right = cx + 116;
    crawl.results.forEach((r, i) => {
      const level = getLevel(r.levelId);
      const y = 34 + i * rowH;
      addPixelText(this, left, y, `${level.number}  ${level.from} - ${level.to}`, { scale: 1 }).setOrigin(0, 0);
      addPixelText(this, right, y, formatTime(r.finalMs), { scale: 1 }).setOrigin(1, 0);
    });
    const totalY = 38 + crawl.results.length * rowH;
    addPixelText(this, left, totalY, 'TOTAL', { scale: 2, tint: 0xffcd75 }).setOrigin(0, 0);
    addPixelText(this, right, totalY, formatTime(crawlTotal(crawl)), { scale: 2, tint: 0xffcd75 }).setOrigin(1, 0);

    const characterId = getCharacter(this.registry.get('characterId')).id;
    const lad = this.add.sprite(36, groundY, playerTextureKey(characterId)).setOrigin(0.5, 1);
    lad.play(playerAnimKey(characterId, 'jump'));
    this.tweens.add({ targets: lad, y: groundY - 14, duration: 300, yoyo: true, repeat: -1, ease: 'Quad.Out' });

    const menu = () => this.scene.start(SCENE.MENU);
    const again = () => {
      const start = getLevel(crawl.startLevelId);
      this.registry.set(CRAWL_KEY, createCrawl(start.id));
      this.scene.start(SCENE.NEXT_STOP, { levelId: start.id });
    };
    const buttons = [
      new Button(this, cx - 58, 154, 'MENU', menu, { width: 84 }),
      new Button(this, cx + 58, 154, 'PLAY AGAIN', again, { width: 112 }),
    ];
    setupButtonFocus(this, buttons, { focus: 1, onEscape: menu });
  }
}
