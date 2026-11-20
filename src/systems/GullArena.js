import Phaser from 'phaser';
import { GULL_BOSS, CAMERA, GAME_HEIGHT } from '../config.js';
import { TEX } from '../assets.js';
import GullBoss from '../entities/GullBoss.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';
import Lobber from './Lobber.js';

// The giant herring gull's fight on Poole Quay (level 5's `end-zone`). Runs
// like the other boss arenas (the camera locks, walls close, a death resets
// it, the Rising Sun's door stays shut until it's beaten), with the same
// boss-* events. It hovers out of a jump's reach: the shop awnings in the
// arena bounce you up into it, and touching it on the way up while it isn't
// diving is a hit. Its dive is deadly; so are the chips it drops.
export default class GullArena {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ zone: Phaser.Geom.Rectangle, boss: { x: number, y: number }, player, levelWidth: number }} opts
   */
  constructor(scene, { zone, boss, player, levelWidth }) {
    this.scene = scene;
    this.zone = zone;
    this.player = player;
    this.levelWidth = levelWidth;
    this.floorY = boss.y;
    this.tuning = GULL_BOSS;
    this.status = 'idle';

    this.walls = [zone.x - 4, zone.right + 4].map((x) => {
      const w = scene.add.zone(x, GAME_HEIGHT / 2, 8, GAME_HEIGHT);
      scene.physics.add.existing(w, true);
      w.body.enable = false;
      return w;
    });
    scene.physics.add.collider(player, this.walls);

    this.chips = new Lobber(scene, {
      player,
      texture: TEX.CHIP,
      flightMs: this.tuning.chipFlightMs,
      size: [6, 3],
      spin: 360,
      isLive: () => this.isActive,
    });

    this.boss = new GullBoss(
      scene,
      boss,
      { left: zone.x, right: zone.right, floorY: boss.y },
      () => player,
      (x, y, tx) => this.chips.throw(x, y, Phaser.Math.Clamp(tx, zone.x + 8, zone.right - 8), this.floorY),
      this.tuning,
    ).setDepth(DEPTH.player + 1);

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
    this.hintTimer = this.scene.time.delayedCall(this.tuning.introMs + 300, () => {
      if (this.status === 'fighting') this.scene.events.emit('toast', this.tuning.hint);
    });
  }

  reset() {
    this.status = 'idle';
    this.setWalls(false);
    this.chips.clear();
    this.hintTimer?.remove();
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
    this.chips.update();
    if (!this.isActive) return;
    const p = this.player;
    if (p.dead) return;
    const b = p.body;
    const touching = Phaser.Geom.Intersects.RectangleToRectangle(new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height), this.boss.hitRect);
    if (!touching) return;
    if (this.boss.isHarmful && !this.boss.canBeHit) {
      p.die();
      return;
    }
    // Bounced up into it: a hit, and the lad drops away.
    if (b.velocity.y < 0 && this.boss.canBeHit) {
      b.setVelocityY(60);
      this.chips.clear();
      this.scene.events.emit('boss-hit', { hp: this.boss.hp - 1 });
      if (this.boss.takeHit()) this.win();
    }
  }

  win() {
    this.status = 'won';
    this.chips.clear();
    this.hintTimer?.remove();
    this.setWalls(false);
    this.releaseCamera();
    this.scene.cameras.main.flash(250, 255, 236, 39);
    Audio.play('boss-defeated');
    this.boss.flyOff();
    this.scene.events.emit('boss-defeated');
  }
}
