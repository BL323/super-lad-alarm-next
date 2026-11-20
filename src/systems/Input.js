import Phaser from 'phaser';

const { KeyCodes } = Phaser.Input.Keyboard;

// Keyboard and touch merged into one virtual input state. The Player reads
// only `state`, never raw keys or pointers.
//
//   state.left / state.right   direction held
//   state.jumpHeld             jump held (for variable jump height)
//   state.jumpPressed          jump went down since the last update (one frame)
//   state.shoutPressed         shout (the megaphone, level 8) went down since the last update
//
// Touch: the on-screen buttons register hit zones (game-pixel rectangles) with
// setTouchZones(). Every active pointer is tested against them each frame, so
// several fingers work at once and a thumb can slide between left and right.
export default class VirtualInput {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.state = { left: false, right: false, jumpHeld: false, jumpPressed: false, shoutPressed: false };
    this.touch = { left: false, right: false, jump: false, shout: false }; // raw touch state, for button feedback
    this.zones = null;
    this._jumpQueued = false;
    this._shoutQueued = false;

    this.keys = scene.input.keyboard.addKeys({
      left: KeyCodes.LEFT,
      a: KeyCodes.A,
      right: KeyCodes.RIGHT,
      d: KeyCodes.D,
      space: KeyCodes.SPACE,
      up: KeyCodes.UP,
      x: KeyCodes.X,
    });

    // Latch jump presses from events so a tap shorter than a frame is never lost.
    const queueJump = () => {
      this._jumpQueued = true;
    };
    this.keys.space.on('down', queueJump);
    this.keys.up.on('down', queueJump);
    this.keys.x.on('down', () => {
      this._shoutQueued = true;
    });
    scene.input.on('pointerdown', (pointer) => {
      if (this.zones?.jump.contains(pointer.x, pointer.y)) queueJump();
      if (this.zones?.shout?.contains(pointer.x, pointer.y)) this._shoutQueued = true;
    });
  }

  /** @param {{left: Phaser.Geom.Rectangle, right: Phaser.Geom.Rectangle, jump: Phaser.Geom.Rectangle}} zones */
  setTouchZones(zones) {
    this.zones = zones;
  }

  /** Call once per frame before anything reads `state`. */
  update() {
    const touch = { left: false, right: false, jump: false, shout: false };
    if (this.zones) {
      for (const p of this.scene.input.manager.pointers) {
        if (!p.isDown) continue;
        if (this.zones.left.contains(p.x, p.y)) touch.left = true;
        else if (this.zones.right.contains(p.x, p.y)) touch.right = true;
        else if (this.zones.jump.contains(p.x, p.y)) touch.jump = true;
        else if (this.zones.shout?.contains(p.x, p.y)) touch.shout = true;
      }
    }
    this.touch = touch;

    const s = this.state;
    if (!this.enabled) {
      s.left = s.right = s.jumpHeld = s.jumpPressed = s.shoutPressed = false;
      this._jumpQueued = this._shoutQueued = false;
      return;
    }

    const k = this.keys;
    s.left = k.left.isDown || k.a.isDown || touch.left;
    s.right = k.right.isDown || k.d.isDown || touch.right;
    s.jumpHeld = k.space.isDown || k.up.isDown || touch.jump;
    s.jumpPressed = this._jumpQueued;
    this._jumpQueued = false;
    s.shoutPressed = this._shoutQueued;
    this._shoutQueued = false;
  }
}
