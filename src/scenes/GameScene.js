import Phaser from 'phaser';
import { SCENE } from './keys.js';
import { CAMERA, DEBUG, GAME_HEIGHT, PARALLAX, SECRET_REVEAL_ALPHA, FINISH_DELAY_MS, SPEECH } from '../config.js';
import { TEX, FINISH_FRAME, getCharacter } from '../assets.js';
import { addText } from '../ui/text.js';
import VirtualInput from '../systems/Input.js';
import { createGameState, addPickup, finalTime, CRAWL_KEY, createCrawl, recordResult } from '../systems/GameState.js';
import Audio from '../systems/Audio.js';
import Checkpoints from '../systems/Checkpoints.js';
import Crumbles from '../systems/Crumbles.js';
import LevelCrossing from '../systems/LevelCrossing.js';
import Throwers from '../systems/Throwers.js';
import MovingPlatforms from '../systems/MovingPlatforms.js';
import Swans from '../systems/Swans.js';
import Gulls from '../systems/Gulls.js';
import Awnings from '../systems/Awnings.js';
import AutoScroll from '../systems/AutoScroll.js';
import { addWeather } from '../systems/Weather.js';
import BossArena from '../systems/BossArena.js';
import { celebrate } from '../systems/Celebration.js';
import SpeechBubble from '../ui/SpeechBubble.js';
import Player from '../entities/Player.js';
import Collectible, { collectibleTypes } from '../entities/Collectible.js';
import { getLevel } from '../level/levels.js';
import { loadLevel, DEPTH } from '../level/LevelLoader.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENE.GAME);
  }

  init(data) {
    this.levelDef = getLevel(data?.levelId);
    this.characterId = getCharacter(data?.characterId ?? this.registry.get('characterId')).id;
  }

  create() {
    this.gameState = createGameState(this.levelDef.id);
    this.level = loadLevel(this, this.levelDef);

    this.controls = new VirtualInput(this);
    const { spawn } = this.level;
    this.player = new Player(this, spawn.x, spawn.y - 8, this.controls, this.characterId).setDepth(DEPTH.player);
    this.physics.add.collider(this.player, this.level.layers.ground);
    this.physics.add.overlap(this.player, this.level.hazards, () => this.player.die());

    this.checkpoints = new Checkpoints(this, this.level.checkpoints, this.player, this.gameState);
    this.crumbles = new Crumbles(this, this.level.crumbles, this.player);
    this.crossings = this.level.crossings.map((def) => new LevelCrossing(this, def, this.player));
    this.throwers = this.level.throwers.length ? new Throwers(this, this.level.throwers, this.player) : null;
    this.movers = this.level.movers.length ? new MovingPlatforms(this, this.level.movers, this.player) : null;
    this.swans = this.level.swans.length ? new Swans(this, this.level.swans, this.player) : null;
    this.gulls = this.level.gulls.length ? new Gulls(this, this.level.gulls, this.player) : null;
    this.awnings = this.level.awnings.length ? new Awnings(this, this.level.awnings, this.player) : null;
    this.autoScroll = this.level.autoscroll ? new AutoScroll(this, this.level.autoscroll, this.player) : null;
    this.weather = addWeather(this, this.level.weather);
    this.spawnCollectibles();

    // Finish: The Avocet's front door, drawn over the pub's own door. Reaching
    // it completes the level unless `finishLocked` is set (the boss holds it
    // until he is beaten).
    this.finishLocked = false;
    if (this.level.finish) {
      const f = this.level.finish;
      this.finish = this.add
        .sprite(f.x, f.y, TEX.FINISH, FINISH_FRAME.open)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.decor + 1);
      const trigger = this.add.zone(f.x, GAME_HEIGHT / 2, 10, GAME_HEIGHT);
      this.physics.add.existing(trigger, true);
      this.physics.add.overlap(this.player, trigger, () => this.completeLevel());
    }

    // Boss: the Train Conductor guards the end zone and holds the finish.
    this.arena = null;
    if (this.level.boss && this.level.endZone) {
      this.arena = new BossArena(this, {
        zone: this.level.endZone,
        boss: this.level.boss,
        player: this.player,
        ground: this.level.layers.ground,
        levelWidth: this.level.width,
      });
      this.setFinishLocked(true);
      this.events.on('boss-reset', () => {
        this.inEndZone = false; // re-arm onEnterEndZone for the next attempt
      });
      this.events.on('boss-defeated', () => {
        this.setFinishLocked(false);
        new SpeechBubble(this, this.player, SPEECH.bossDefeated, {
          scale: SPEECH.textScale,
          durationMs: SPEECH.durationMs,
          depth: DEPTH.foreground + 5,
        });
      });
    }

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp);
    cam.setDeadzone(CAMERA.deadzoneWidth, GAME_HEIGHT);

    this.inEndZone = false;
    this.inSecret = false;
    this.trainTravel = 0;

    if (DEBUG) {
      this.debugText = addText(this, 4, 4, '', { color: '#1a1c2c' }).setScrollFactor(0).setDepth(1000);
    }

    // HUD and touch buttons run in their own scene on top of this one.
    this.scene.launch(SCENE.UI, { controls: this.controls, gameState: this.gameState });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop(SCENE.UI));
  }

  update(time, delta) {
    // Run clock: from level start to the finish, deaths included.
    if (!this.gameState.completed) this.gameState.elapsedMs += delta;
    this.controls.update();
    this.player.update(time, delta);
    this.arena?.update(time, delta);
    this.autoScroll?.update(delta);

    // While the boss fight runs or the train pulls out, the train is moving: the hills race past.
    if (this.arena?.isActive || this.autoScroll?.isActive) this.trainTravel += delta * PARALLAX.trainSpeed;
    this.level.hills.tilePositionX = this.cameras.main.scrollX * PARALLAX.hillsFactor + this.trainTravel;
    this.updateSecrets();

    const { endZone } = this.level;
    // Fully inside (back edge past the zone edge), so the arena wall can close behind.
    const inside = endZone && this.player.body.left >= endZone.x + 2 && endZone.contains(this.player.x, this.player.y);
    if (inside && !this.inEndZone && !this.player.dead) {
      this.inEndZone = true;
      this.onEnterEndZone();
    }

    if (this.debugText) {
      const b = this.player.body;
      this.debugText.setText(
        `${this.player.moveState} x ${this.player.x.toFixed(0)} (col ${Math.floor(this.player.x / 16)}) ` +
          `vx ${b.velocity.x.toFixed(0)} vy ${b.velocity.y.toFixed(0)} cp ${this.gameState.checkpoint?.name ?? '-'}` +
          (this.arena ? ` boss ${this.arena.status}/${this.arena.boss.state} hp ${this.arena.boss.hp}` : ''),
      );
    }
  }

  spawnCollectibles() {
    this.collectibles = this.physics.add.staticGroup();
    for (const c of this.level.collectibles) {
      const def = collectibleTypes[c.type];
      if (!def) {
        if (import.meta.env.DEV) console.error(`Unknown collectible type "${c.type}"`);
        continue;
      }
      this.collectibles.add(new Collectible(this, c.x, c.y, c.type).setDepth(DEPTH.props));
      if (def.counts) this.gameState.coinsTotal += 1;
      else this.gameState.bonusesTotal += 1;
    }
    this.physics.add.overlap(this.player, this.collectibles, (_p, item) => this.onPickup(item));
  }

  onPickup(item) {
    if (this.player.dead || !item.collect()) return;
    addPickup(this.gameState, item.def);
    Audio.play(item.def.sound);
    this.events.emit('pickup', { type: item.type, def: item.def, x: item.x, y: item.y });
  }

  completeLevel() {
    const s = this.gameState;
    if (s.completed || this.finishLocked || this.player.dead) return;
    s.completed = true; // stops the clock
    this.controls.enabled = false;
    Audio.play('finish');
    this.events.emit('level-complete', s);

    // Walk in through the pub door, then confetti.
    const door = this.finish;
    this.player.enterDoor(door.x, () => {
      this.cameras.main.flash(180, 255, 236, 39);
      celebrate(this, door.x, door.y - door.height / 2, DEPTH.foreground + 1);
    });

    const result = { ...s, ...finalTime(s), characterId: this.characterId };
    // Add this level to the crawl (started from the level picker; a level
    // reached any other way starts its own).
    const crawl = this.registry.get(CRAWL_KEY) ?? createCrawl(s.levelId);
    recordResult(crawl, result);
    this.registry.set(CRAWL_KEY, crawl);
    this.time.delayedCall(FINISH_DELAY_MS, () => this.scene.start(SCENE.COMPLETE, result));
  }

  /** Fade the foreground (station canopy) while the player is in a secret area. */
  updateSecrets() {
    const inside = this.level.secrets.some((r) => r.contains(this.player.x, this.player.y));
    if (inside === this.inSecret) return;
    this.inSecret = inside;
    this.tweens.add({
      targets: this.level.layers.foreground,
      alpha: inside ? SECRET_REVEAL_ALPHA : 1,
      duration: 200,
    });
  }

  setFinishLocked(locked) {
    this.finishLocked = locked;
    this.finish?.setFrame(locked ? FINISH_FRAME.closed : FINISH_FRAME.open);
  }

  /**
   * Called when the player enters the `end-zone` rectangle at Parkstone (and
   * again after each failed boss attempt): starts the Train Conductor fight.
   */
  onEnterEndZone() {
    this.arena?.start();
  }
}
