import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { GAME_WIDTH, GAME_HEIGHT, MENU_FULLSCREEN } from '../config.js';
import { CHARACTERS, playerTextureKey, playerAnimKey } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import { addBackdrop } from '../ui/backdrop.js';
import Button from '../ui/Button.js';
import { isTouchDevice } from '../systems/device.js';
import {
  enterFullscreen,
  onFullscreenChange,
  shouldOfferFullscreen,
  shouldSuggestHomeScreen,
} from '../systems/fullscreen.js';
import Audio from '../systems/Audio.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE.MENU);
  }

  create() {
    const { groundY } = addBackdrop(this);
    const cx = GAME_WIDTH / 2;

    addPixelText(this, cx, 22, 'SUPER LAD', { scale: 4, tint: 0xffcd75 }).setOrigin(0.5, 0);
    addPixelText(this, cx, 50, 'ALARM', { scale: 4, tint: 0xffcd75 }).setOrigin(0.5, 0);

    // The lads, waiting on the platform.
    CHARACTERS.forEach((c, i) => {
      this.add
        .sprite(cx - 120 + i * 18, groundY, playerTextureKey(c.id))
        .setOrigin(0.5, 1)
        .play({ key: playerAnimKey(c.id, 'idle'), delay: i * 250 });
    });

    // On phones the START tap also asks for full screen (Android); it carries
    // on either way.
    const start = () => {
      Audio.play('select');
      enterFullscreen();
      this.scene.start(SCENE.SELECT);
    };
    new Button(this, cx, 94, 'START', start, { width: 96 }).setFocused(true);
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);

    addPixelText(this, cx, 116, 'GRAB EVERY PINT - EACH ONE MISSED COSTS 2 SECONDS', { scale: 1 }).setOrigin(0.5, 0);

    this.addFullscreenControls(cx);

    const hint = isTouchDevice()
      ? 'ARROW BUTTONS MOVE - ROUND BUTTON JUMPS'
      : 'ARROWS OR A/D MOVE - SPACE OR UP JUMP';
    addPixelText(this, cx, GAME_HEIGHT - 12, hint, { scale: 1 }).setOrigin(0.5);
  }

  /**
   * Android: a FULL SCREEN button (bottom right) while the page isn't full
   * screen, e.g. after the player swiped out of it. iPhone Safari can't go
   * full screen, so it gets an "add to Home Screen" hint instead.
   */
  addFullscreenControls(cx) {
    if (shouldSuggestHomeScreen()) {
      addPixelText(this, cx, MENU_FULLSCREEN.hintY, 'FOR FULL SCREEN: SHARE - ADD TO HOME SCREEN', {
        scale: 1,
        tint: 0xffcd75,
      }).setOrigin(0.5, 0);
      return;
    }
    if (!shouldOfferFullscreen()) return;
    const { x, y, width } = MENU_FULLSCREEN.button;
    const button = new Button(this, GAME_WIDTH - x, y, 'FULL SCREEN', () => {
      Audio.play('select');
      enterFullscreen();
    }, { width, scale: 1 });
    const refresh = () => {
      const show = shouldOfferFullscreen();
      button.setVisible(show);
      if (button.input) button.input.enabled = show;
    };
    const off = onFullscreenChange(refresh);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }
}
