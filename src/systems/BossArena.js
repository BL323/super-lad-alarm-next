import Phaser from 'phaser';
import { BOSS, DEFAULT_BOSS_TUNING, CAMERA, GAME_HEIGHT } from '../config.js';
import { TEX } from '../assets.js';
import Conductor, { BossState } from '../entities/Conductor.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';
import Lobber from './Lobber.js';

// The Train Conductor fight on the roof of his train (the level's `end-zone`):
// level 3 (BOSS.first, between Moreton and Wool) and level 6 (BOSS.final).
//
// Entering the zone starts it: the camera pans to and locks on the arena,
// walls close on both sides, and he begins after a short intro. Tickets
// land where their floor markers show. Dying resets the whole encounter (he's
// back to full health, the walls open, the camera follows again) and the
// player walks back in from the checkpoint beside the track. `tuning.hits`
// stomps while he's dizzy beat him (3 in the first fight, 5 in the final); the walls open, the camera follows again, and
// the player hops off and goes on to the (now unlocked) pub door.
export default class BossArena {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ zone: Phaser.Geom.Rectangle, boss: { x: number, y: number }, player, ground, levelWidth: number }} opts
   */
  constructor(scene, { zone, boss, player, ground, levelWidth }) {
    this.scene = scene;
    this.zone = zone;
    this.player = player;
    this.levelWidth = levelWidth;
    this.floorY = boss.y;
    this.status = 'idle'; // idle | intro | fighting | won
    // BOSS.first or BOSS.final, named by the level's boss object.
    this.tuning = BOSS[boss.tuning] ?? BOSS[DEFAULT_BOSS_TUNING];

    // Walls that close on both sides once the fight starts.
    this.walls = [zone.x - 4, zone.right + 4].map((x) => {
      const w = scene.add.zone(x, GAME_HEIGHT / 2, 8, GAME_HEIGHT);
      scene.physics.add.existing(w, true);
      w.body.enable = false;
      return w;
    });

    this.tickets = new Lobber(scene, {
      player,
      texture: TEX.TICKET,
      flightMs: this.tuning.ticketFlightMs,
      isLive: () => this.isActive,
    });

    this.boss = new Conductor(
      scene,
      boss,
      { left: zone.x, right: zone.right, floorY: boss.y },
      () => player,
      (x, y, tx) => this.throwTicket(x, y, tx),
      this.tuning,
    ).setDepth(DEPTH.player - 1);

    const physics = scene.physics.add;
    physics.collider(this.boss, ground);
    physics.collider(this.boss, this.walls);
    physics.collider(player, this.walls);
    physics.overlap(player, this.boss, () => this.onTouchBoss());

    // Dying anywhere during the fight resets it.
    player.on('died', () => {
      if (this.isActive) this.reset();
    });

    // A width change mid-fight (rotating the phone) re-centres the locked camera.
    this.cameraLocked = false;
    const onResize = (gameSize) => {
      if (this.cameraLocked) this.lockCamera(gameSize.width);
    };
    scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  }

  /**
   * Keep the camera on the arena. When the view is wider than the arena (wide
   * phones), the bounds grow evenly on both sides so the arena stays centred.
   */
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

  /** Called by GameScene.onEnterEndZone(). */
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
    this.scene.events.emit('boss-start', { hits: this.tuning.hits, introText: this.tuning.introText });
  }

  reset() {
    this.status = 'idle';
    this.setWalls(false);
    this.clearTickets();
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
    this.tickets.update();
  }

  onTouchBoss() {
    const p = this.player;
    const boss = this.boss;
    if (p.dead || !this.isActive) return;

    // From above = the player's feet were above his cap last step and falling.
    const prevBottom = p.body.prev.y + p.body.height;
    const fromAbove = p.body.velocity.y >= 0 && prevBottom <= boss.body.top + 6;

    if (fromAbove) {
      if (boss.isVulnerable) {
        p.bounce(this.tuning.stompBounce);
        this.scene.events.emit('boss-hit', { hp: boss.hp - 1 });
        if (boss.takeHit()) this.win();
      } else if (boss.state !== BossState.HURT && boss.state !== BossState.DEFEATED) {
        p.bounce(this.tuning.stompBounce * 0.8); // harmless bounce off his cap
        Audio.play('bounce');
      }
      return;
    }
    if (boss.isHarmful) p.die();
  }

  win() {
    this.status = 'won';
    this.clearTickets();
    this.setWalls(false);
    this.releaseCamera(); // free to hop off at Parkstone
    this.scene.cameras.main.flash(250, 255, 236, 39);
    Audio.play('boss-defeated');
    // Knock him off the train, away from the player.
    const awayDir = this.boss.x >= this.player.x ? 1 : -1;
    this.boss.exit(awayDir);
    this.scene.events.emit('boss-defeated');
  }

  // --- Tickets ---------------------------------------------------------------

  /** Lob a ticket from (x, y) so it lands on the floor at targetX after ticketFlightMs. */
  throwTicket(x, y, targetX) {
    const tx = Phaser.Math.Clamp(targetX, this.zone.x + 8, this.zone.right - 8);
    this.tickets.throw(x, y, tx, this.floorY);
  }

  clearTickets() {
    this.tickets.clear();
  }
}
