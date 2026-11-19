import Phaser from 'phaser';
import { AUTOSCROLL, CAMERA, GAME_HEIGHT } from '../config.js';
import Audio from './Audio.js';

// The departing train out of Wareham. Once the player is on the roof past the
// start of the stretch, the camera stops following and scrolls on by itself
// at AUTOSCROLL.speed (it keeps up if you run ahead, but never goes back). Drop
// off the left of the screen and you've missed the train: a death, through
// player.die(). At the end of the stretch the camera follows the player again.
// A respawn before the stretch re-arms it.
export default class AutoScroll {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x0: number, x1: number }} def the stretch (px)
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, def, player) {
    this.scene = scene;
    this.def = def;
    this.player = player;
    this.status = 'waiting'; // waiting → running → done
    this.x = 0;

    const onRespawn = () => {
      if (this.status === 'running') this.follow();
      this.status = player.x < def.x0 ? 'waiting' : 'done';
    };
    player.on('respawned', onRespawn);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => player.off('respawned', onRespawn));
  }

  get isActive() {
    return this.status === 'running';
  }

  follow() {
    const cam = this.scene.cameras.main;
    cam.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp);
    cam.setDeadzone(CAMERA.deadzoneWidth, GAME_HEIGHT);
  }

  update(delta) {
    const { player, def } = this;
    const cam = this.scene.cameras.main;
    if (this.status === 'waiting') {
      if (!player.dead && player.x >= def.x0) {
        this.status = 'running';
        this.x = cam.scrollX;
        cam.stopFollow();
        Audio.play('whistle'); // the guard's whistle: she's off
        this.scene.events.emit('toast', AUTOSCROLL.startText);
      }
      return;
    }
    if (this.status !== 'running' || player.dead) return;

    const end = def.x1 - cam.width;
    const ahead = player.x - cam.width * AUTOSCROLL.followLead; // keep up with a player who runs ahead
    this.x = Math.min(end, Math.max(this.x + (AUTOSCROLL.speed * delta) / 1000, ahead));
    cam.setScroll(this.x, 0);
    if (player.body.right < this.x) {
      player.die();
      this.scene.events.emit('toast', AUTOSCROLL.missedText);
      return;
    }
    if (this.x >= end) {
      this.status = 'done';
      this.follow();
    }
  }
}
