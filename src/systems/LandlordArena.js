import Phaser from 'phaser';
import { LANDLORD, CAMERA, GAME_HEIGHT } from '../config.js';
import { TEX, PUMP_FRAME, LEVER_FRAME, HATCH_FRAME, BARREL_FRAME } from '../assets.js';
import Landlord, { LandlordState, BARREL_PHASE, BELL_PHASE } from '../entities/Landlord.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';
import Lobber from './Lobber.js';

// The landlord fight in front of the bar at The Avocet (level 9's `end-zone`).
// It runs like the Conductor's arena (the camera locks, walls close, a death
// resets everything, the bar hatch stays shut until he's beaten), but you
// beat him with the pub:
//
//   phases 1–2  land on a beer pump while he's next to it: it soaks him. A
//               pump that has soaked him runs dry, so the next hit needs another.
//   phase 3     he rolls barrels at you: land on one to kick it back at him.
//   phase 4     jump into the last orders bell: he rushes to his till on the
//               cellar hatch and the crowd swamps him. Jump into the lever
//               while he's there and he drops into the cellar.
//
// Same events as BossArena (boss-start / boss-hit / boss-reset /
// boss-defeated), so the boss bar and GameScene work unchanged.
export default class LandlordArena {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ zone: Phaser.Geom.Rectangle, boss: { x: number, y: number }, fight, player, ground, levelWidth: number }} opts
   */
  constructor(scene, { zone, boss, fight, player, ground, levelWidth }) {
    this.scene = scene;
    this.zone = zone;
    this.player = player;
    this.levelWidth = levelWidth;
    this.floorY = boss.y;
    this.tuning = LANDLORD;
    this.status = 'idle'; // idle | intro | fighting | won

    this.walls = [zone.x - 4, zone.right + 4].map((x) => {
      const w = scene.add.zone(x, GAME_HEIGHT / 2, 8, GAME_HEIGHT);
      scene.physics.add.existing(w, true);
      w.body.enable = false;
      return w;
    });

    this.glasses = new Lobber(scene, {
      player,
      texture: TEX.PINT_GLASS,
      flightMs: this.tuning.glassFlightMs,
      size: [5, 6],
      isLive: () => this.isActive,
    });

    this.boss = new Landlord(
      scene,
      boss,
      { left: zone.x, right: zone.right, floorY: boss.y },
      () => player,
      {
        throwGlass: (x, y, tx) => this.glasses.throw(x, y, Phaser.Math.Clamp(tx, zone.x + 8, zone.right - 8), this.floorY),
        rollBarrel: (x, dir) => this.rollBarrel(x, dir),
      },
      this.tuning,
    ).setDepth(DEPTH.player - 1);

    const physics = scene.physics.add;
    physics.collider(this.boss, ground);
    physics.collider(this.boss, this.walls);
    physics.collider(player, this.walls);
    physics.overlap(player, this.boss, () => this.onTouchBoss());

    this.buildPumps(fight.pumps);
    this.buildBarrels();
    this.buildBell(fight.bell);
    this.buildLever(fight.lever);
    this.buildHatch(fight.hatch);

    player.on('died', () => {
      if (this.isActive) this.reset();
    });

    this.cameraLocked = false;
    const onResize = (gameSize) => {
      if (this.cameraLocked) this.lockCamera(gameSize.width);
    };
    scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  }

  // --- The props ------------------------------------------------------------

  buildPumps(defs) {
    // Each pump stands on the bar (20 px up); its handle's top, 32 px up, is a
    // one-way perch. Landing on it pulls it.
    this.pumpGroup = this.scene.physics.add.staticGroup();
    this.pumps = defs.map((d) => {
      const sprite = this.scene.add.image(d.x, d.y - 20, TEX.PUMP, PUMP_FRAME.full).setOrigin(0.5, 1).setDepth(DEPTH.decor + 3);
      const perch = this.scene.add.zone(d.x, d.y - 31, 12, 2);
      this.pumpGroup.add(perch);
      Object.assign(perch.body.checkCollision, { down: false, left: false, right: false });
      const pump = { x: d.x, y: d.y, sprite, perch, dry: false, lastPullAt: -Infinity, standStep: -10 };
      perch.pump = pump;
      return pump;
    });
    this.scene.physics.add.collider(this.player, this.pumpGroup, (p, perch) => {
      if (!p.body.touching.down) return;
      p.standOn();
      const pump = perch.pump;
      const step = p.physicsStep;
      const landed = pump.standStep < step - 1; // wasn't standing on it last step
      pump.standStep = step;
      if (landed) this.pullPump(pump);
    });
  }

  pullPump(pump) {
    const now = this.scene.time.now;
    if (now - pump.lastPullAt < this.tuning.pumpCooldownMs) return;
    pump.lastPullAt = now;
    if (pump.dry) {
      Audio.play('pump-dry');
      return;
    }
    pump.sprite.setFrame(PUMP_FRAME.pulled);
    this.scene.time.delayedCall(250, () => {
      if (!pump.dry) pump.sprite.setFrame(PUMP_FRAME.full);
    });
    this.spray(pump.x, pump.y - 22);
    Audio.play('spray');
    const b = this.boss;
    const soaks = this.isActive && b.phase < BARREL_PHASE && b.canBeHit && Math.abs(b.x - pump.x) <= this.tuning.pumpSprayRange;
    if (!soaks) return;
    pump.dry = true;
    pump.sprite.setFrame(PUMP_FRAME.dry);
    this.hitBoss();
  }

  /** Beer everywhere: a burst of flecks either side of the spout. */
  spray(x, y) {
    for (let i = 0; i < 14; i++) {
      const fleck = this.scene.add.image(x, y, TEX.BEER_SPRAY).setDepth(DEPTH.player + 2);
      const dir = i % 2 ? 1 : -1;
      this.scene.tweens.add({
        targets: fleck,
        x: x + dir * Phaser.Math.Between(8, 34),
        y: y + Phaser.Math.Between(6, 26),
        alpha: 0,
        duration: Phaser.Math.Between(300, 520),
        ease: 'Quad.Out',
        onComplete: () => fleck.destroy(),
      });
    }
  }

  buildBarrels() {
    this.barrels = this.scene.physics.add.group({ allowGravity: false });
    this.scene.physics.add.overlap(this.player, this.barrels, (p, barrel) => this.onTouchBarrel(barrel));
    this.scene.physics.add.overlap(this.boss, this.barrels, (_b, barrel) => this.onBarrelHitsBoss(barrel));
  }

  rollBarrel(x, dir) {
    const { width, height } = BARREL_FRAME;
    const barrel = this.barrels.create(x, this.floorY - height / 2, TEX.BARREL, 0).setDepth(DEPTH.player - 2);
    barrel.body.setSize(width - 2, height - 2);
    barrel.dir = dir;
    barrel.returned = false;
    barrel.setVelocityX(dir * this.tuning.barrelSpeed);
    barrel.spinMs = 0;
    Audio.play('barrel');
  }

  onTouchBarrel(barrel) {
    const p = this.player;
    if (p.dead || barrel.smashed) return;
    const prevBottom = p.body.prev.y + p.body.height;
    if (p.body.velocity.y >= 0 && prevBottom <= barrel.body.top + 5) {
      // Kicked: it turns round and rolls back, faster, at him.
      p.standOn();
      p.bounce(-220);
      if (!barrel.returned) {
        barrel.returned = true;
        barrel.dir = this.boss.x >= barrel.x ? 1 : -1;
        barrel.setVelocityX(barrel.dir * this.tuning.barrelKickSpeed);
        Audio.play('bounce');
      }
      return;
    }
    if (!barrel.returned) p.die();
  }

  onBarrelHitsBoss(barrel) {
    if (!barrel.returned || barrel.smashed) return;
    const b = this.boss;
    if (b.phase !== BARREL_PHASE || !b.canBeHit) return;
    this.smashBarrel(barrel);
    this.hitBoss();
  }

  smashBarrel(barrel) {
    barrel.smashed = true;
    barrel.body.enable = false;
    this.scene.tweens.add({ targets: barrel, alpha: 0, scale: 1.6, duration: 200, onComplete: () => barrel.destroy() });
  }

  buildBell(def) {
    if (!def) return;
    this.bell = this.scene.add.image(def.x, def.y - 6, TEX.BELL).setOrigin(0.5, 0).setDepth(DEPTH.decor + 3);
    const zone = this.scene.add.zone(def.x, def.y, 14, 14);
    this.scene.physics.add.existing(zone, true);
    this.bellRungAt = -Infinity;
    this.scene.physics.add.overlap(this.player, zone, () => this.ringBell());
  }

  ringBell() {
    const now = this.scene.time.now;
    if (this.player.dead || now - this.bellRungAt < 1000) return;
    this.bellRungAt = now;
    Audio.play('last-orders');
    this.scene.tweens.add({ targets: this.bell, angle: { from: -25, to: 25 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.bell.setAngle(0) });
    const b = this.boss;
    if (!this.isActive || b.phase !== BELL_PHASE || !this.hatch) return;
    if (b.rush(this.hatch.centerX)) {
      this.scene.events.emit('toast', this.tuning.leverHint);
      this.scene.cameras.main.shake(150, 0.004);
    }
  }

  buildLever(def) {
    if (!def) return;
    this.lever = this.scene.add.image(def.x, def.y, TEX.LEVER, LEVER_FRAME.up).setDepth(DEPTH.decor + 3);
    const zone = this.scene.add.zone(def.x, def.y, 12, 16);
    this.scene.physics.add.existing(zone, true);
    this.leverPulledAt = -Infinity;
    this.scene.physics.add.overlap(this.player, zone, () => this.pullLever());
  }

  pullLever() {
    const now = this.scene.time.now;
    if (this.player.dead || now - this.leverPulledAt < 1000) return;
    this.leverPulledAt = now;
    this.lever.setFrame(LEVER_FRAME.pulled);
    Audio.play('clunk');
    this.scene.time.delayedCall(700, () => this.lever?.setFrame(LEVER_FRAME.up));
    if (!this.hatch) return;
    this.hatch.sprite.setFrame(HATCH_FRAME.open);
    const b = this.boss;
    const onHatch = b.state === LandlordState.SWAMPED && Math.abs(b.x - this.hatch.centerX) < 12;
    if (this.isActive && b.phase === BELL_PHASE && onHatch) {
      this.hitBoss(); // the last hit: down he goes
      return;
    }
    this.scene.time.delayedCall(600, () => {
      if (this.status !== 'won') this.hatch.sprite.setFrame(HATCH_FRAME.shut);
    });
  }

  buildHatch(def) {
    if (!def) return;
    const sprite = this.scene.add.image(def.x0, def.y - 1, TEX.HATCH, HATCH_FRAME.shut).setOrigin(0, 0).setDepth(DEPTH.ground + 1);
    this.hatch = { sprite, centerX: (def.x0 + def.x1) / 2 };
  }

  // --- The fight -------------------------------------------------------------

  lockCamera(viewWidth = this.scene.cameras.main.width) {
    const cam = this.scene.cameras.main;
    const w = Math.max(this.zone.width, viewWidth);
    const x = Phaser.Math.Clamp(this.zone.centerX - w / 2, 0, Math.max(0, this.levelWidth - w));
    cam.setBounds(x, 0, w, GAME_HEIGHT);
    this.cameraLocked = true;
  }

  get isActive() {
    return this.status === 'intro' || this.status === 'fighting';
  }

  start() {
    if (this.status !== 'idle') return;
    this.status = 'intro';
    this.setWalls(true);
    const cam = this.scene.cameras.main;
    cam.stopFollow();
    cam.pan(this.zone.centerX, GAME_HEIGHT / 2, 500, 'Sine.easeInOut', false, (_c, progress) => {
      if (progress < 1 || this.status === 'idle') return;
      this.lockCamera();
      cam.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp);
    });
    this.boss.begin();
    this.status = 'fighting';
    this.scene.events.emit('boss-start', {
      hits: this.tuning.hits,
      introText: this.tuning.introText,
      name: this.tuning.name,
      beatenText: this.tuning.beatenText,
    });
    this.hintTimer = this.scene.time.delayedCall(this.tuning.introMs + 300, () => this.hint());
  }

  /** What to do in this phase, as a HUD message. */
  hint() {
    if (this.status !== 'fighting') return;
    this.scene.events.emit('toast', this.tuning.phaseHints[this.boss.phase]);
  }

  hitBoss() {
    // A hit spoils his aim: anything still in the air, or rolling, is gone.
    this.glasses.clear();
    for (const barrel of [...this.barrels.getChildren()]) if (!barrel.smashed) this.smashBarrel(barrel);
    this.scene.events.emit('boss-hit', { hp: this.boss.hp - 1 });
    if (this.boss.takeHit()) this.win();
    else this.scene.time.delayedCall(this.tuning.hurtMs, () => this.hint());
  }

  reset() {
    this.status = 'idle';
    this.setWalls(false);
    this.glasses.clear();
    this.hintTimer?.remove();
    for (const barrel of [...this.barrels.getChildren()]) barrel.destroy();
    for (const pump of this.pumps) {
      pump.dry = false;
      pump.sprite.setFrame(PUMP_FRAME.full);
    }
    this.hatch?.sprite.setFrame(HATCH_FRAME.shut);
    this.lever?.setFrame(LEVER_FRAME.up);
    this.boss.reset();
    this.releaseCamera();
    this.scene.events.emit('boss-reset');
  }

  setWalls(on) {
    for (const w of this.walls) w.body.enable = on;
  }

  releaseCamera() {
    const cam = this.scene.cameras.main;
    cam.panEffect.reset();
    this.cameraLocked = false;
    cam.setBounds(0, 0, this.levelWidth, GAME_HEIGHT);
    cam.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp);
  }

  update(time, delta) {
    this.boss.update(time, delta);
    this.glasses.update();
    for (const barrel of [...this.barrels.getChildren()]) {
      if (barrel.smashed) continue;
      barrel.spinMs += delta;
      barrel.setFrame(Math.floor(barrel.spinMs / 120) % BARREL_FRAME.count);
      if (barrel.x < this.zone.x - 8 || barrel.x > this.zone.right + 8) this.smashBarrel(barrel);
    }
  }

  onTouchBoss() {
    const p = this.player;
    const b = this.boss;
    if (p.dead || !this.isActive) return;
    // Just bounced off his head: still overlapping him on the way up isn't a hit.
    if (this.scene.time.now < (this.headBounceUntil ?? 0)) return;
    const prevBottom = p.body.prev.y + p.body.height;
    if (p.body.velocity.y >= 0 && prevBottom <= b.body.top + 6) {
      // He can't be stomped: you just bounce off his head.
      p.standOn();
      p.bounce(this.tuning.stompBounce);
      this.headBounceUntil = this.scene.time.now + 250;
      Audio.play('bounce');
      return;
    }
    if (b.isHarmful) p.die();
  }

  win() {
    this.status = 'won';
    this.glasses.clear();
    this.hintTimer?.remove();
    for (const barrel of [...this.barrels.getChildren()]) barrel.destroy();
    this.setWalls(false);
    this.releaseCamera();
    this.scene.cameras.main.flash(250, 255, 236, 39);
    Audio.play('boss-defeated');
    this.hatch?.sprite.setFrame(HATCH_FRAME.open);
    // Behind the floor from the hatch down, so he drops out of sight into the cellar.
    const mask = this.scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(this.zone.x - 40, 0, this.zone.width + 80, this.floorY);
    this.boss.setMask(mask.createGeometryMask());
    this.boss.fall();
    this.scene.events.emit('boss-defeated');
  }
}
