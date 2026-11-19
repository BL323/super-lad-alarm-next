import Phaser from 'phaser';
import { PLAYER } from '../config.js';
import { PLAYER_FRAMES, DEFAULT_CHARACTER, playerTextureKey, playerAnimKey } from '../assets.js';
import Audio from '../systems/Audio.js';

// Movement states. They only choose the animation; physics never depends on art.
export const PlayerState = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  FALL: 'fall',
};

const RUN_ANIM_MIN_SPEED = 5; // px/s; below this on the ground we show idle

function approach(value, target, step) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x spawn x (sprite centre)
   * @param {number} y spawn y (sprite centre)
   * @param {import('../systems/Input.js').default} controls virtual input
   * @param {string} characterId which character's sprites to use (looks only)
   */
  constructor(scene, x, y, controls, characterId = DEFAULT_CHARACTER) {
    super(scene, x, y, playerTextureKey(characterId), PLAYER_FRAMES.idle[0]);
    this.characterId = characterId;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Per-instance copy so upgrades can change movement at runtime.
    this.stats = { ...PLAYER, body: { ...PLAYER.body } };
    this.controls = controls;
    this.spawnPoint = { x, y };
    this.respawnPoint = null; // set by checkpoints; falls back to spawnPoint

    this.moveState = null;
    this.dead = false;
    this.isJumping = false; // true from take-off until landing
    this.jumpCut = false;
    this.lastGroundedAt = -Infinity;
    this.lastJumpPressedAt = -Infinity;
    // Physics steps so far, and the last one in which a collider called
    // standOn(). (A 120 Hz frame can have no physics step: then nothing changes.)
    this.physicsStep = 0;
    this.stoodOnStep = -1;
    const world = scene.physics.world;
    const onStep = () => this.physicsStep++;
    world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, onStep);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, onStep));

    this.applyStats();
    this.setCollideWorldBounds(true);
    this.setMoveState(PlayerState.IDLE);
  }

  /** Re-apply hitbox and speed caps from `stats` (call after changing them). */
  applyStats() {
    const { body, maxFallSpeed } = this.stats;
    this.body.setSize(body.width, body.height, false);
    this.body.setOffset(body.offsetX, body.offsetY);
    this.body.setMaxVelocity(10000, maxFallSpeed);
  }

  setMoveState(state) {
    if (state === this.moveState) return this;
    this.moveState = state;
    this.play(playerAnimKey(this.characterId, state), true);
    return this;
  }

  /**
   * Colliders with bodies you can stand on (moving decks, crumbling crates,
   * awnings) call this. `body.touching.down` alone isn't proof of ground:
   * overlaps (pints, hazards, the door trigger) set it too, which used to
   * give a free jump in mid-air off a pint.
   */
  standOn() {
    if (this.body.touching.down) this.stoodOnStep = this.physicsStep; // WORLD_STEP comes after the colliders
  }

  update(time, delta) {
    if (this.dead || this.enteringDoor) return;
    const onBody = this.stoodOnStep === this.physicsStep - 1;

    const s = this.stats;
    const input = this.controls.state;
    const body = this.body;
    const dt = delta / 1000;
    const onFloor = body.blocked.down || onBody;

    if (onFloor) {
      this.lastGroundedAt = time;
      if (body.velocity.y >= 0) this.isJumping = false;
    }
    if (input.jumpPressed) this.lastJumpPressedAt = time;

    // Horizontal: accelerate towards the target speed, decelerate when released.
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const accel = onFloor ? s.groundAccel : s.airAccel;
    const decel = onFloor ? s.groundDecel : s.airDecel;
    const vx = body.velocity.x;
    let rate = accel;
    if (dir === 0) rate = decel;
    else if (vx * dir < 0) rate = Math.max(accel, decel); // turning round
    const newVx = approach(vx, dir * s.maxRunSpeed, rate * dt);
    body.setVelocityX(newVx);
    if (dir !== 0) this.setFlipX(dir < 0);

    // Jump, with coyote time (just left a ledge) and buffering (pressed just before landing).
    const buffered = time - this.lastJumpPressedAt <= s.jumpBufferMs;
    const grounded = onFloor || time - this.lastGroundedAt <= s.coyoteTimeMs;
    if (buffered && grounded && !this.isJumping) {
      body.setVelocityY(s.jumpVelocity);
      this.isJumping = true;
      this.jumpCut = false;
      this.lastJumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
      Audio.play('jump');
    }

    // Variable jump height: releasing early cuts the upward speed once.
    if (this.isJumping && !this.jumpCut && !input.jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * s.jumpCutMultiplier);
      this.jumpCut = true;
    }

    // Falling out of the world.
    if (this.y - this.height / 2 > this.scene.physics.world.bounds.bottom + s.fallDeathMargin) {
      this.die();
      return;
    }

    // Animation state.
    const rising = body.velocity.y < 0;
    if (onFloor && !rising) {
      this.setMoveState(Math.abs(newVx) > RUN_ANIM_MIN_SPEED ? PlayerState.RUN : PlayerState.IDLE);
    } else {
      this.setMoveState(rising ? PlayerState.JUMP : PlayerState.FALL);
    }
  }

  /** Walk into a doorway at `x` and disappear inside (end of the level). */
  enterDoor(x, onInside) {
    if (this.enteringDoor) return;
    this.enteringDoor = true;
    this.body.stop();
    this.body.enable = false;
    this.setFlipX(x < this.x);
    this.setMoveState(PlayerState.RUN);
    this.scene.tweens.add({
      targets: this,
      x,
      duration: 260,
      onComplete: () => {
        this.scene.tweens.add({ targets: this, alpha: 0, scale: 0.8, duration: 260, onComplete: () => onInside?.() });
      },
    });
  }

  /**
   * Bounce upwards (e.g. off the Conductor's cap). Holding jump keeps the full
   * bounce; with `fixed` (an awning) it's the full bounce whatever you press.
   */
  bounce(velocityY, { fixed = false } = {}) {
    if (this.dead) return;
    this.body.setVelocityY(velocityY);
    this.isJumping = true;
    this.jumpCut = fixed;
    this.lastGroundedAt = -Infinity;
  }

  /** The single death path (spikes, falls and, later, enemies all come here). */
  die() {
    if (this.dead) return;
    this.dead = true;
    Audio.play('death');
    this.emit('died', this);

    this.body.stop();
    this.body.setAllowGravity(false);
    this.anims.pause();
    this.setTintFill(0xffffff);
    this.flashTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: -1,
    });
    this.scene.time.delayedCall(this.stats.deathFreezeMs, () => this.respawn());
  }

  respawn() {
    const p = this.respawnPoint ?? this.spawnPoint;
    this.flashTween?.remove();
    this.flashTween = null;
    this.clearTint();
    this.setAlpha(1);
    this.body.reset(p.x, p.y);
    this.body.setAllowGravity(true);
    this.isJumping = false;
    this.lastGroundedAt = -Infinity;
    this.lastJumpPressedAt = -Infinity;
    this.dead = false;
    this.anims.resume();
    this.moveState = null;
    this.setMoveState(PlayerState.IDLE);
    this.emit('respawned', this);
  }
}
