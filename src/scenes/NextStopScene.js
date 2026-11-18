import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { NEXT_STOP } from '../config.js';
import { PUBS, getCharacter, playerTextureKey, playerAnimKey } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import { addBackdrop, addPanel } from '../ui/backdrop.js';
import { restartOnWidthChange } from '../ui/relayout.js';
import { getLevel } from '../level/levels.js';

// "NEXT STOP: WOOL · THE BLACK BEAR". Shown before every level; moves on to the
// level by itself after NEXT_STOP.durationMs, or sooner on a tap or key.
export default class NextStopScene extends Phaser.Scene {
  constructor() {
    super(SCENE.NEXT_STOP);
  }

  init(data) {
    this.levelDef = getLevel(data?.levelId);
  }

  create() {
    const { groundY } = addBackdrop(this);
    const width = this.scale.width;
    const cx = width / 2;
    const level = this.levelDef;
    restartOnWidthChange(this, () => ({ levelId: level.id }));

    addPanel(this, cx, 62, 264, 96);
    addPixelText(this, cx, 22, `LEVEL ${level.number}`, { scale: 1, tint: 0xc2c3c7 }).setOrigin(0.5, 0);
    addPixelText(this, cx, 34, 'NEXT STOP', { scale: 2 }).setOrigin(0.5, 0);
    addPixelText(this, cx, 54, level.to, { scale: 3, tint: 0xffcd75 }).setOrigin(0.5, 0);
    addPixelText(this, cx, 86, PUBS[level.pub]?.name ?? '', { scale: 2 }).setOrigin(0.5, 0);

    // The lad heads off along the platform.
    const characterId = getCharacter(this.registry.get('characterId')).id;
    const lad = this.add.sprite(-12, groundY, playerTextureKey(characterId)).setOrigin(0.5, 1);
    lad.play(playerAnimKey(characterId, 'run'));
    this.tweens.add({ targets: lad, x: width + 12, duration: NEXT_STOP.durationMs });

    const go = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.scene.start(SCENE.GAME, { levelId: level.id, characterId });
    };
    this.time.delayedCall(NEXT_STOP.durationMs, go);
    this.time.delayedCall(NEXT_STOP.minMs, () => {
      this.input.once('pointerup', go);
      this.input.keyboard.once('keydown', go);
    });
  }
}
