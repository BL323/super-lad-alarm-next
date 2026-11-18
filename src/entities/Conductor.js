import Phaser from 'phaser';
import { TEX, ANIM, CONDUCTOR_FRAME } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import Audio from '../systems/Audio.js';

// The Train Conductor. A small state machine driven by elapsed time in each
// state, so everything stops when the scene stops.
//
//   waiting → intro → walk (throwing tickets) → windup → dash → dizzy → walk …
//   stomped while dizzy → hurt → walk (faster) … third stomp → defeated
//
// Only the dizzy state can be stomped. Walking, winding up and dashing into
// the player kills them; landing on his cap at other times just bounces.
export const BossState = {
  WAITING: 'waiting',
  INTRO: 'intro',
  WALK: 'walk',
  WINDUP: 'windup',
  DASH: 'dash',
  DIZZY: 'dizzy',
  HURT: 'hurt',
  DEFEATED: 'defeated',
};

const HARMFUL = new Set([BossState.WALK, BossState.WINDUP, BossState.DASH]);
const F = CONDUCTOR_FRAME;

export default class Conductor extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ x: number, y: number }} start feet position
   * @param {{ left: number, right: number, floorY: number }} arena world bounds of the fight
   * @param {() => { x: number, y: number }} getTarget the player's position
   * @param {(fromX: number, fromY: number, targetX: number) => void} throwTicket
   * @param {object} tuning one entry of BOSS in config.js (BOSS.first or BOSS.final)
   */
  constructor(scene, start, arena, getTarget, throwTicket, tuning) {
    super(scene, start.x, start.y - F.height / 2, TEX.CONDUCTOR, F.idle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.tuning = tuning;
    this.start = start;
    this.arena = arena;
    this.getTarget = getTarget;
    this.throwTicket = throwTicket;

    const b = this.tuning.body;
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

  /** Back to the start, full health, waiting for the player. */
  reset() {
    this.hp = this.tuning.hits;
    this.body.enable = true;
    this.body.reset(this.start.x, this.start.y - F.height / 2);
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1).clearTint().setFlipX(true).setScale(1).setAngle(0).setVisible(true);
    this.enter(BossState.WAITING);
  }

  /** Phase index 0..hits-1: how many times he has been stomped. */
  get phase() {
    return Math.min(this.tuning.hits - this.hp, this.tuning.hits - 1);
  }

  /** A per-phase tuning value; arrays shorter than the phase count reuse their last entry. */
  perPhase(name, phase = this.phase) {
    const v = this.tuning[name];
    return Array.isArray(v) ? v[Math.min(phase, v.length - 1)] : v;
  }

  get isHarmful() {
    return HARMFUL.has(this.state);
  }

  get isVulnerable() {
    return this.state === BossState.DIZZY;
  }

  begin() {
    if (this.state === BossState.WAITING) this.enter(BossState.INTRO);
  }

  enter(state) {
    this.state = state;
    this.stateMs = 0;
    this.throwMs = 0;
    this.throwPoseMs = 0;
    this.anims.stop();
    this.body.setVelocityX(0);
    this.clearTint();
    this.warning.setVisible(false);
    this.stars.setVisible(false);

    switch (state) {
      case BossState.WAITING:
        this.setFrame(F.idle);
        break;
      case BossState.INTRO:
        this.setFrame(F.idle);
        Audio.play('whistle'); // "Tickets please!"
        break;
      case BossState.WALK:
        this.play(ANIM.CONDUCTOR_WALK);
        this.throwMs = this.perPhase('throwEveryMs') * 0.6; // first volley comes quickly
        break;
      case BossState.WINDUP:
        this.setFrame(F.windup);
        this.faceTarget();
        this.warning.setVisible(true);
        Audio.play('whistle');
        break;
      case BossState.DASH:
        this.setFrame(F.dash);
        this.dashDir = this.flipX ? -1 : 1;
        Audio.play('dash');
        break;
      case BossState.DIZZY:
        this.setFrame(F.dizzy);
        this.stars.setVisible(true);
        this.scene.cameras.main.shake(140, 0.006);
        break;
      case BossState.HURT:
        this.setFrame(F.dizzy);
        this.setTintFill(0xffffff);
        this.scene.tweens.add({ targets: this, scaleY: 0.8, duration: 90, yoyo: true });
        break;
      case BossState.DEFEATED:
        this.setFrame(F.dizzy);
        this.stars.setVisible(true);
        break;
    }
  }

  faceTarget() {
    this.setFlipX(this.getTarget().x < this.x);
  }

  /** Stomped while dizzy. Returns true if this was the final hit. */
  takeHit() {
    if (!this.isVulnerable) return false;
    this.hp -= 1;
    Audio.play('boss-hit');
    this.enter(this.hp > 0 ? BossState.HURT : BossState.DEFEATED);
    return this.hp === 0;
  }

  update(_time, delta) {
    if (!this.body.enable) return;
    this.stateMs += delta;
    const p = this.phase;

    switch (this.state) {
      case BossState.INTRO:
        if (this.stateMs >= this.tuning.introMs) this.enter(BossState.WALK);
        break;

      case BossState.WALK: {
        const target = this.getTarget();
        const dx = target.x - this.x;
        if (Math.abs(dx) > 6) {
          this.setFlipX(dx < 0);
          this.body.setVelocityX(Math.sign(dx) * this.perPhase('walkSpeed', p));
        } else {
          this.body.setVelocityX(0);
        }
        // Tickets, from the very first phase.
        this.throwMs += delta;
        if (this.throwMs >= this.perPhase('throwEveryMs', p)) {
          this.throwMs = 0;
          this.throwVolley();
        }
        if (this.throwPoseMs > 0) {
          this.throwPoseMs -= delta;
          if (this.throwPoseMs <= 0) this.play(ANIM.CONDUCTOR_WALK);
        }
        if (this.stateMs >= this.perPhase('walkMs', p)) this.enter(BossState.WINDUP);
        break;
      }

      case BossState.WINDUP:
        // Flash and shout before charging.
        this.setTint(Math.floor(this.stateMs / 90) % 2 ? 0xffffff : 0xff8080);
        this.warning.setVisible(Math.floor(this.stateMs / 120) % 2 === 0);
        if (this.stateMs >= this.perPhase('windupMs', p)) this.enter(BossState.DASH);
        break;

      case BossState.DASH: {
        this.body.setVelocityX(this.dashDir * this.perPhase('dashSpeed', p));
        const hitWall =
          (this.dashDir < 0 && (this.body.blocked.left || this.body.left <= this.arena.left + 1)) ||
          (this.dashDir > 0 && (this.body.blocked.right || this.body.right >= this.arena.right - 1));
        if (hitWall) this.enter(BossState.DIZZY);
        break;
      }

      case BossState.DIZZY:
        if (this.stateMs >= this.tuning.dizzyMs) this.enter(BossState.WALK);
        break;

      case BossState.HURT:
        if (this.stateMs >= this.tuning.hurtMs) this.enter(BossState.WALK);
        break;

      default:
        break;
    }

    // Overlays follow his head.
    const top = this.body.top;
    this.warning.setPosition(this.x, top - 2);
    this.stars.setPosition(this.x, top - 1).setFlipX(Math.floor(this.stateMs / 160) % 2 === 0);
  }

  throwVolley() {
    const n = this.perPhase('ticketsPerVolley');
    const target = this.getTarget().x;
    const handX = this.x + (this.flipX ? -6 : 6);
    const handY = this.body.top + 4;
    for (let i = 0; i < n; i++) {
      const offset = (i - (n - 1) / 2) * this.tuning.ticketSpread;
      this.throwTicket(handX, handY, target + offset);
    }
    this.anims.stop();
    this.setFrame(F.throw);
    this.throwPoseMs = 250;
    Audio.play('ticket');
  }

  /**
   * Knocked off the train: he pops up, spinning, and tumbles off the side away
   * from the player, out of sight in under a second. `awayDir` is -1 or 1.
   */
  exit(awayDir, onDone) {
    this.body.enable = false;
    this.anims.stop();
    this.setFrame(F.dizzy).clearTint();
    this.stars.setVisible(false);
    this.warning.setVisible(false);
    this.scene.tweens.killTweensOf(this);
    this.setDepth(this.depth + 20); // tumble in front of the carriages

    const { x, y } = this;
    const fallY = this.scene.cameras.main.scrollY + this.scene.scale.gameSize.height + this.displayHeight;
    this.scene.tweens.add({ targets: this, angle: awayDir * 540, duration: this.tuning.exitMs });
    this.scene.tweens.add({ targets: this, x: x + awayDir * this.tuning.exitDistance, duration: this.tuning.exitMs });
    this.scene.tweens.add({
      targets: this,
      y: y - 26,
      duration: this.tuning.exitMs * 0.3,
      ease: 'Quad.Out',
      onComplete: () =>
        this.scene.tweens.add({
          targets: this,
          y: fallY,
          duration: this.tuning.exitMs * 0.7,
          ease: 'Quad.In',
          onComplete: () => {
            this.setVisible(false);
            onDone?.();
          },
        }),
    });
  }

  destroy(fromScene) {
    this.warning?.destroy();
    this.stars?.destroy();
    super.destroy(fromScene);
  }
}
