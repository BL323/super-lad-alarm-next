import Phaser from 'phaser';
import { GAME_HEIGHT, TOUCH } from '../config.js';
import { safeAreaInGame, cssPerGamePixel } from './safeArea.js';

// On-screen buttons: left and right together at bottom left, jump at bottom
// right, and (once Naylor has the megaphone, level 10) shout above jump. They
// only draw and report hit zones; VirtualInput does the reading.
export default class TouchControls {
  constructor(scene, controls) {
    this.scene = scene;
    this.controls = controls;
    this.zones = {
      left: new Phaser.Geom.Rectangle(),
      right: new Phaser.Geom.Rectangle(),
      jump: new Phaser.Geom.Rectangle(),
      shout: new Phaser.Geom.Rectangle(),
    };
    this.buttons = {
      left: scene.add.graphics(),
      right: scene.add.graphics(),
      jump: scene.add.graphics(),
      shout: scene.add.graphics(),
    };
    this.shoutEnabled = false;
    Object.values(this.buttons).forEach((g) => g.setScrollFactor(0).setDepth(100));

    this.layout();
    controls.setTouchZones(this.zones);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      controls.setTouchZones(null);
    });
  }

  layout() {
    const scale = this.scene.scale;
    const safe = safeAreaInGame(scale);
    const size = Phaser.Math.Clamp(Math.ceil(TOUCH.minCssPx / cssPerGamePixel(scale)), TOUCH.minSize, TOUCH.maxSize);
    const pad = TOUCH.hitPadding;
    const width = scale.width;

    const y = Math.round(GAME_HEIGHT - safe.bottom - TOUCH.margin - size);
    const leftX = Math.round(safe.left + TOUCH.margin);
    const rightX = leftX + size + TOUCH.gap;
    const jumpX = Math.round(width - safe.right - TOUCH.margin - size);
    const split = rightX - TOUCH.gap / 2; // boundary between left and right zones
    const zoneTop = y - pad;
    const zoneH = GAME_HEIGHT - zoneTop;

    this.zones.left.setTo(0, zoneTop, split, zoneH);
    this.zones.right.setTo(split, zoneTop, rightX + size + pad - split, zoneH);
    this.zones.jump.setTo(jumpX - pad, zoneTop, width - (jumpX - pad), zoneH);

    this.drawButton(this.buttons.left.setPosition(leftX, y), size, 'left');
    this.drawButton(this.buttons.right.setPosition(rightX, y), size, 'right');
    this.drawButton(this.buttons.jump.setPosition(jumpX, y), size, 'jump');

    // Shout: a smaller button above jump, its zone stopping where jump's starts.
    const shoutSize = Math.round(size * 0.8);
    const shoutX = jumpX + Math.round((size - shoutSize) / 2);
    const shoutY = y - shoutSize - TOUCH.gap * 3;
    if (this.shoutEnabled) this.zones.shout.setTo(jumpX - pad, shoutY - pad / 2, width - (jumpX - pad), zoneTop - (shoutY - pad / 2));
    else this.zones.shout.setTo(0, 0, 0, 0);
    this.drawButton(this.buttons.shout.setPosition(shoutX, shoutY), shoutSize, 'shout');
    this.buttons.shout.setVisible(this.shoutEnabled && this.visible !== false);
  }

  /** Naylor has picked up the megaphone: show the shout button. */
  enableShout() {
    this.shoutEnabled = true;
    this.layout();
  }

  drawButton(g, size, kind) {
    const c = size / 2;
    const r = Math.round(size * 0.22);
    g.clear();
    g.fillStyle(0x000000, 0.25);
    g.lineStyle(1, 0xffffff, 0.8);
    if (kind === 'jump' || kind === 'shout') {
      g.fillCircle(c, c, c);
      g.strokeCircle(c, c, c - 0.5);
    } else {
      g.fillRoundedRect(0, 0, size, size, 6);
      g.strokeRoundedRect(0.5, 0.5, size - 1, size - 1, 6);
    }
    g.fillStyle(0xffffff, 1);
    if (kind === 'left') g.fillTriangle(c - r, c, c + r * 0.8, c - r, c + r * 0.8, c + r);
    if (kind === 'right') g.fillTriangle(c + r, c, c - r * 0.8, c - r, c - r * 0.8, c + r);
    if (kind === 'jump') g.fillTriangle(c, c - r, c - r, c + r * 0.8, c + r, c + r * 0.8);
    if (kind === 'shout') {
      // A megaphone: a small mouthpiece and a flaring cone.
      g.fillRect(c - r, c - r * 0.3, r * 0.6, r * 0.6);
      g.fillTriangle(c - r * 0.4, c - r * 0.3, c + r, c - r, c + r, c + r);
      g.fillTriangle(c - r * 0.4, c - r * 0.3, c - r * 0.4, c + r * 0.3, c + r, c + r);
    }
  }

  setVisible(visible) {
    this.visible = visible;
    Object.entries(this.buttons).forEach(([k, g]) => g.setVisible(visible && (k !== 'shout' || this.shoutEnabled)));
  }

  update() {
    const t = this.controls.touch;
    for (const key of ['left', 'right', 'jump', 'shout']) {
      this.buttons[key].setAlpha(t[key] ? TOUCH.pressedAlpha : TOUCH.idleAlpha);
    }
  }
}
