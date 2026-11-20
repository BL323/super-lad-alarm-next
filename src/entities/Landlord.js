import Phaser from 'phaser';
import { TEX, ANIM, LANDLORD_FRAME } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import Audio from '../systems/Audio.js';

// The landlord of The Avocet (level 9). Like the Conductor, a state machine
// driven by time in each state, but he can't be stomped: each phase is beaten
// by the pub itself (src/systems/LandlordArena.js decides what hurts him).
//
//   waiting → intro → walk (lobbing glasses) → windup → charge → recover → walk …
//   phase 3 (barrels):   walk → windup → roll a barrel → walk …
//   phase 4 (the bell):  any time the bell rings → rush to the till → swamped
//   hit → soaked → walk (next phase) … the last hit drops him into the cellar
export const LandlordState = {
  WAITING: 'waiting',
  INTRO: 'intro',
  WALK: 'walk',
  WINDUP: 'windup',
  CHARGE: 'charge',
  RECOVER: 'recover',
  ROLL: 'roll', // winding up to roll a barrel
  SOAKED: 'soaked', // hit
  RUSH: 'rush', // to his till after the bell
  SWAMPED: 'swamped', // by the crowd at the bar
  DEFEATED: 'defeated',
};
const S = LandlordState;
const HARMFUL = new Set([S.WALK, S.WINDUP, S.CHARGE, S.ROLL, S.RECOVER]);
const F = LANDLORD_FRAME;

// Phase (0-based) → what can hurt him in it.
export const BARREL_PHASE = 2;
export const BELL_PHASE = 3;

export default class Landlord extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ x: number, y: number }} start feet position
   * @param {{ left: number, right: number, floorY: number }} arena
   * @param {() => { x: number }} getTarget the player
   * @param {{ throwGlass: (x: number, y: number, tx: number) => void, rollBarrel: (x: number, dir: number) => void }} actions
   * @param {object} tuning LANDLORD in config.js
   */
  constructor(scene, start, arena, getTarget, actions, tuning) {
    super(scene, start.x, start.y - F.height / 2, TEX.LANDLORD, F.idle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.tuning = tuning;
    this.start = start;
    this.arena = arena;
    this.getTarget = getTarget;
    this.actions = actions;

    const b = tuning.body;
    this.body.setSize(b.width, b.height, false).setOffset(b.offsetX, b.offsetY);
    this.setCollideWorldBounds(true);

    this.warning = addPixelText(scene, 0, 0, '!', { scale: 3, tint: 0xff004d }).setOrigin(0.5, 1).setVisible(false);
    this.stars = scene.add.image(0, 0, TEX.DIZZY_STARS).setOrigin(0.5, 1).setVisible(false);
    this.reset();
  }

  setDepth(d) {
    super.setDepth(d);
    this.warning?.setDepth(d + 1);
    this.stars?.setDepth(d + 1);
    return this;
  }

  reset() {
    this.hp = this.tuning.hits;
    this.body.enable = true;
    this.body.reset(this.start.x, this.start.y - F.height / 2);
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1).clearTint().setFlipX(true).setScale(1).setAngle(0).setVisible(true);
    this.rushTo = null;
    this.enter(S.WAITING);
  }

  /** 0..hits-1: how many times he's been beaten so far. */
  get phase() {
    return Math.min(this.tuning.hits - this.hp, this.tuning.hits - 1);
  }

  perPhase(name, phase = this.phase) {
    const v = this.tuning[name];
    return Array.isArray(v) ? v[Math.min(phase, v.length - 1)] : v;
  }

  get isHarmful() {
    return HARMFUL.has(this.state);
  }

  /** Not mid-hit, not beaten: something can hurt him. */
  get canBeHit() {
    return this.body.enable && this.state !== S.SOAKED && this.state !== S.DEFEATED && this.state !== S.WAITING;
  }

  begin() {
    if (this.state === S.WAITING) this.enter(S.INTRO);
  }

  enter(state) {
    this.state = state;
    this.stateMs = 0;
    this.anims.stop();
    this.body.setVelocityX(0);
    this.clearTint();
    this.warning.setVisible(false);
    this.stars.setVisible(false);
    switch (state) {
      case S.WAITING:
      case S.INTRO:
        this.setFrame(F.idle);
        break;
      case S.WALK:
        this.play(ANIM.LANDLORD_WALK);
        this.throwMs = this.perPhase('throwEveryMs') * 0.5;
        this.throwPoseMs = 0;
        break;
      case S.WINDUP:
      case S.ROLL:
        this.setFrame(F.windup);
        this.faceTarget();
        this.warning.setVisible(true);
        Audio.play('grunt');
        break;
      case S.CHARGE:
        this.setFrame(F.charge);
        this.chargeDir = this.flipX ? -1 : 1;
        Audio.play('dash');
        break;
      case S.RECOVER:
        this.setFrame(F.idle);
        this.scene.cameras.main.shake(120, 0.005);
        break;
      case S.SOAKED:
        this.setFrame(F.soaked);
        this.scene.tweens.add({ targets: this, scaleY: 0.85, duration: 100, yoyo: true });
        break;
      case S.RUSH:
        this.play(ANIM.LANDLORD_WALK);
        this.anims.timeScale = 2;
        break;
      case S.SWAMPED:
        this.setFrame(F.swamped);
        this.stars.setVisible(true);
        break;
      case S.DEFEATED:
        this.setFrame(F.swamped);
        break;
    }
    if (state !== S.RUSH) this.anims.timeScale = 1;
  }

  faceTarget() {
    this.setFlipX(this.getTarget().x < this.x);
  }

  /** Something hurt him (the arena checks it was the right thing for the phase). Returns true on the last hit. */
  takeHit() {
    if (!this.canBeHit) return false;
    this.hp -= 1;
    Audio.play('boss-hit');
    this.enter(this.hp > 0 ? S.SOAKED : S.DEFEATED);
    return this.hp === 0;
  }

  /** The bell: he rushes to his till at `x` and the crowd swamps him there. */
  rush(x) {
    if (!this.canBeHit || this.state === S.RUSH || this.state === S.SWAMPED) return false;
    this.rushTo = x;
    this.enter(S.RUSH);
    return true;
  }

  update(_time, delta) {
    if (!this.body.enable) return;
    this.stateMs += delta;
    const p = this.phase;
    switch (this.state) {
      case S.INTRO:
        if (this.stateMs >= this.tuning.introMs) this.enter(S.WALK);
        break;

      case S.WALK: {
        const dx = this.getTarget().x - this.x;
        if (Math.abs(dx) > 6) {
          this.setFlipX(dx < 0);
          this.body.setVelocityX(Math.sign(dx) * this.perPhase('walkSpeed', p));
        }
        this.throwMs += delta;
        // He lobs glasses at range: not at someone right next to him or over
        // his head (a glass would start inside them).
        const tooClose = Math.abs(dx) < 24;
        if (this.throwMs >= this.perPhase('throwEveryMs', p) && !tooClose) {
          this.throwMs = 0;
          this.throwVolley();
        }
        if (this.throwPoseMs > 0) {
          this.throwPoseMs -= delta;
          if (this.throwPoseMs <= 0) this.play(ANIM.LANDLORD_WALK);
        }
        if (this.stateMs >= this.perPhase('walkMs', p)) this.enter(p === BARREL_PHASE ? S.ROLL : S.WINDUP);
        break;
      }

      case S.WINDUP:
      case S.ROLL:
        this.setTint(Math.floor(this.stateMs / 90) % 2 ? 0xffffff : 0xff8080);
        this.warning.setVisible(Math.floor(this.stateMs / 120) % 2 === 0);
        if (this.stateMs < this.perPhase('windupMs', p)) break;
        if (this.state === S.WINDUP) this.enter(S.CHARGE);
        else {
          const dir = this.flipX ? -1 : 1;
          this.actions.rollBarrel(this.x + dir * 12, dir);
          this.enter(S.WALK);
        }
        break;

      case S.CHARGE: {
        this.body.setVelocityX(this.chargeDir * this.perPhase('chargeSpeed', p));
        const hitWall =
          (this.chargeDir < 0 && (this.body.blocked.left || this.body.left <= this.arena.left + 1)) ||
          (this.chargeDir > 0 && (this.body.blocked.right || this.body.right >= this.arena.right - 1));
        if (hitWall) this.enter(S.RECOVER);
        break;
      }

      case S.RECOVER:
        if (this.stateMs >= this.tuning.recoverMs) this.enter(S.WALK);
        break;

      case S.SOAKED:
        if (this.stateMs >= this.tuning.hurtMs) this.enter(S.WALK);
        break;

      case S.RUSH: {
        const dx = this.rushTo - this.x;
        if (Math.abs(dx) <= 3) {
          this.body.reset(this.rushTo, this.y);
          this.enter(S.SWAMPED);
        } else {
          this.setFlipX(dx < 0);
          this.body.setVelocityX(Math.sign(dx) * this.tuning.rushSpeed);
        }
        break;
      }

      case S.SWAMPED:
        if (this.stateMs >= this.tuning.swampedMs) this.enter(S.WALK);
        break;

      default:
        break;
    }
    const top = this.body.top;
    this.warning.setPosition(this.x, top - 2);
    this.stars.setPosition(this.x, top - 1).setFlipX(Math.floor(this.stateMs / 160) % 2 === 0);
  }

  throwVolley() {
    const n = this.perPhase('glassesPerVolley');
    const target = this.getTarget().x;
    const handX = this.x + (this.flipX ? -6 : 6);
    const handY = this.body.top + 2;
    for (let i = 0; i < n; i++) this.actions.throwGlass(handX, handY, target + (i - (n - 1) / 2) * this.tuning.glassSpread);
    this.anims.stop();
    this.setFrame(F.throw);
    this.throwPoseMs = 250;
    Audio.play('ticket');
  }

  /** Down through the cellar hatch: he drops out of sight. */
  fall(onDone) {
    this.body.enable = false;
    this.anims.stop();
    this.setFrame(F.swamped).clearTint();
    this.stars.setVisible(false);
    this.warning.setVisible(false);
    this.scene.tweens.add({ targets: this, angle: 30, duration: 250 });
    this.scene.tweens.add({
      targets: this,
      y: this.y + 60,
      duration: this.tuning.exitMs,
      ease: 'Quad.In',
      onComplete: () => {
        this.setVisible(false);
        onDone?.();
      },
    });
  }

  destroy(fromScene) {
    this.warning?.destroy();
    this.stars?.destroy();
    super.destroy(fromScene);
  }
}
