import Phaser from 'phaser';
import { TEX, ANIM } from '../assets.js';
import { addPixelText } from '../ui/text.js';
import Audio from '../systems/Audio.js';

// The giant herring gull over Poole Quay (level 5). Not a physics body: it's
// steered by hand every frame, and GullArena checks the player against
// `hitRect`. States, by time spent in each:
//
//   waiting → intro → hover (drift to and fro, drop chips) → windup (squawk)
//   → dive (down to where you stood and back up; deadly) → hover …
//   hit while hovering, winding up or climbing out of a dive → hurt → hover
//   (next phase) … the last hit → defeated (it flies off)
export const GullState = {
  WAITING: 'waiting',
  INTRO: 'intro',
  HOVER: 'hover',
  WINDUP: 'windup',
  DIVE: 'dive',
  HURT: 'hurt',
  DEFEATED: 'defeated',
};
const S = GullState;

export default class GullBoss extends Phaser.GameObjects.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ x: number, y: number }} start the boss object's feet position (on the quay)
   * @param {{ left: number, right: number, floorY: number }} arena
   * @param {() => { x: number }} getTarget the player
   * @param {(x: number, y: number, tx: number) => void} dropChip
   * @param {object} tuning GULL_BOSS in config.js
   */
  constructor(scene, start, arena, getTarget, dropChip, tuning) {
    super(scene, start.x, arena.floorY - tuning.hoverPx, TEX.GULL, 0);
    scene.add.existing(this);
    this.tuning = tuning;
    this.start = start;
    this.arena = arena;
    this.getTarget = getTarget;
    this.dropChip = dropChip;
    this.hoverY = arena.floorY - tuning.hoverPx;
    this.setScale(tuning.scale);
    this.warning = addPixelText(scene, 0, 0, '!', { scale: 3, tint: 0xff004d }).setOrigin(0.5, 1).setVisible(false);
    this.hitRect = new Phaser.Geom.Rectangle();
    this.reset();
  }

  setDepth(d) {
    super.setDepth(d);
    this.warning?.setDepth(d + 1);
    return this;
  }

  reset() {
    this.hp = this.tuning.hits;
    this.scene.tweens.killTweensOf(this);
    this.setPosition(this.start.x, this.hoverY).setAlpha(1).clearTint().setAngle(0).setVisible(true).setFlipX(true);
    this.dir = -1;
    this.enter(S.WAITING);
  }

  get phase() {
    return Math.min(this.tuning.hits - this.hp, this.tuning.hits - 1);
  }

  perPhase(name, phase = this.phase) {
    const v = this.tuning[name];
    return Array.isArray(v) ? v[Math.min(phase, v.length - 1)] : v;
  }

  /** Deadly to touch: only on its way down and back up. */
  get isHarmful() {
    return this.state === S.DIVE;
  }

  /** A bounce into it counts: hovering, winding up, or climbing out of a dive. */
  get canBeHit() {
    return this.state === S.HOVER || this.state === S.WINDUP || (this.state === S.DIVE && this.diveT > 0.6);
  }

  begin() {
    if (this.state === S.WAITING) this.enter(S.INTRO);
  }

  enter(state) {
    this.state = state;
    this.stateMs = 0;
    this.clearTint();
    this.warning.setVisible(false);
    switch (state) {
      case S.WAITING:
      case S.INTRO:
      case S.HOVER:
        this.play(ANIM.GULL_FLAP, true);
        this.anims.timeScale = 0.6;
        this.chipMs = this.perPhase('chipsEveryMs') * 0.5;
        break;
      case S.WINDUP:
        this.warning.setVisible(true);
        this.anims.timeScale = 2;
        Audio.play('squawk');
        break;
      case S.DIVE: {
        // From here, down to where the player is standing, and up again on the far side.
        const tx = Phaser.Math.Clamp(this.getTarget().x, this.arena.left + 12, this.arena.right - 12);
        this.diveFrom = { x: this.x, y: this.y };
        this.diveTo = tx;
        const past = tx + Math.sign(tx - this.x || 1) * 40;
        this.diveEnd = Phaser.Math.Clamp(past, this.arena.left + 20, this.arena.right - 20);
        this.diveT = 0;
        this.anims.stop();
        this.setFrame(1); // wings back
        this.setFlipX(tx < this.x);
        Audio.play('dash');
        break;
      }
      case S.HURT:
        this.setTintFill(0xffffff);
        Audio.play('boss-hit');
        break;
      case S.DEFEATED:
        break;
    }
  }

  /** A bounce got it. Returns true on the last hit. */
  takeHit() {
    if (!this.canBeHit) return false;
    this.hp -= 1;
    this.enter(this.hp > 0 ? S.HURT : S.DEFEATED);
    return this.hp === 0;
  }

  update(_time, delta) {
    if (this.state === S.DEFEATED) return;
    this.stateMs += delta;
    const dt = delta / 1000;
    const p = this.phase;
    switch (this.state) {
      case S.INTRO:
        if (this.stateMs >= this.tuning.introMs) this.enter(S.HOVER);
        break;
      case S.HOVER: {
        // Drift to and fro along the arena, bobbing.
        const lo = this.arena.left + 24;
        const hi = this.arena.right - 24;
        if (this.x <= lo) this.dir = 1;
        else if (this.x >= hi) this.dir = -1;
        this.x += this.dir * this.perPhase('driftSpeed', p) * dt;
        this.y = this.hoverY + Math.sin(this.stateMs / 260) * this.tuning.bobPx;
        this.setFlipX(this.dir < 0);
        this.chipMs += delta;
        // It drops chips at you on the quay, not while you're up in the air (bouncing at it).
        const target = this.getTarget();
        const airborne = !target.body.blocked.down && target.body.bottom < this.arena.floorY - 4;
        if (this.chipMs >= this.perPhase('chipsEveryMs', p) && !airborne) {
          this.chipMs = 0;
          this.drop();
        }
        if (this.stateMs >= this.perPhase('hoverMs', p)) this.enter(S.WINDUP);
        break;
      }
      case S.WINDUP:
        this.setTint(Math.floor(this.stateMs / 90) % 2 ? 0xffffff : 0xff8080);
        this.warning.setVisible(Math.floor(this.stateMs / 120) % 2 === 0);
        if (this.stateMs >= this.perPhase('windupMs', p)) this.enter(S.DIVE);
        break;
      case S.DIVE: {
        // Down to the player's spot (t 0 → 0.5), then up and on past it (0.5 → 1).
        const t = Math.min(1, this.stateMs / this.perPhase('diveMs', p));
        this.diveT = t;
        const low = this.arena.floorY - this.tuning.diveLowPx;
        if (t < 0.5) {
          const k = Phaser.Math.Easing.Quadratic.In(t * 2);
          this.x = Phaser.Math.Linear(this.diveFrom.x, this.diveTo, t * 2);
          this.y = Phaser.Math.Linear(this.diveFrom.y, low, k);
        } else {
          const k = Phaser.Math.Easing.Quadratic.Out((t - 0.5) * 2);
          this.x = Phaser.Math.Linear(this.diveTo, this.diveEnd, (t - 0.5) * 2);
          this.y = Phaser.Math.Linear(low, this.hoverY, k);
        }
        if (t >= 1) this.enter(S.HOVER);
        break;
      }
      case S.HURT:
        this.setVisible(Math.floor(this.stateMs / 80) % 2 === 0);
        this.y = Phaser.Math.Linear(this.y, this.hoverY - 10, 0.1);
        if (this.stateMs >= this.tuning.hurtMs) {
          this.setVisible(true);
          this.enter(S.HOVER);
        }
        break;
      default:
        break;
    }
    const { width, height } = this.tuning.hitBox;
    this.hitRect.setTo(this.x - width / 2, this.y - height / 2, width, height);
    this.warning.setPosition(this.x, this.y - 18);
  }

  drop() {
    const n = this.perPhase('chipsPerDrop');
    const target = this.getTarget().x;
    for (let i = 0; i < n; i++) this.dropChip(this.x, this.y + 8, target + (i - (n - 1) / 2) * this.tuning.chipSpread);
    Audio.play('ticket');
  }

  /** Beaten: it flaps off out to sea, squawking. */
  flyOff(onDone) {
    this.enter(S.DEFEATED);
    this.play(ANIM.GULL_FLAP, true);
    this.anims.timeScale = 2;
    this.clearTint().setVisible(true);
    Audio.play('squawk');
    this.scene.tweens.add({
      targets: this,
      x: this.x + 260,
      y: this.y - 120,
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
    super.destroy(fromScene);
  }
}
