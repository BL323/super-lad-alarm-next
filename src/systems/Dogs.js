import Phaser from 'phaser';
import { DOGS, SQUIRRELS } from '../config.js';
import { TEX, ANIM } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';
import Audio from './Audio.js';

// Pub dogs (level 9): each trots up and down its stretch of floor, and runs at
// you when you're on the floor close by (still only within its stretch).
// Touching one from the side is a death (through player.die()); land on it and
// it yelps and bolts out of the pub, and you bounce. They all come back when
// the player respawns.
export default class Dogs {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ x0: number, x1: number, y: number }[]} defs patrol range (px) and the floor they trot on
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.scene = scene;
    this.player = player;
    this.group = scene.physics.add.group({ allowGravity: false });
    this.items = defs.map((d, i) => {
      // Brownsea's red squirrels (`kind: 'squirrel'`) scamper the same way, quicker.
      const squirrel = d.kind === 'squirrel';
      const dog = this.group.create(i % 2 ? d.x1 - 8 : d.x0 + 8, d.y, squirrel ? TEX.SQUIRREL : TEX.DOG).setOrigin(0.5, 1).setDepth(DEPTH.props);
      if (squirrel) dog.body.setSize(9, 7).setOffset(2, 3);
      else dog.body.setSize(12, 9).setOffset(2, 3);
      dog.anim = squirrel ? ANIM.SQUIRREL_RUN : ANIM.DOG_TROT;
      dog.speeds = squirrel ? SQUIRRELS : DOGS;
      dog.range = d;
      dog.home = { x: dog.x, y: dog.y };
      dog.dir = i % 2 ? -1 : 1;
      dog.play(dog.anim);
      return dog;
    });

    scene.physics.add.overlap(player, this.group, (_p, dog) => this.onTouch(dog));

    const onRespawn = () => this.items.forEach((dog) => this.restore(dog));
    player.on('respawned', onRespawn);
    let stopped = false;
    const onUpdate = () => {
      if (stopped) return;
      this.update();
    };
    scene.events.on('update', onUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopped = true;
      scene.events.off('update', onUpdate);
      player.off('respawned', onRespawn);
    });
  }

  onTouch(dog) {
    const p = this.player;
    if (p.dead || dog.gone) return;
    const prevBottom = p.body.prev.y + p.body.height;
    if (p.body.velocity.y >= 0 && prevBottom <= dog.body.top + 4) {
      p.standOn();
      p.bounce(DOGS.stompBounce);
      this.chase(dog);
      return;
    }
    p.die();
  }

  /** Stomped: a yelp, a flip and off out of the pub. */
  chase(dog) {
    dog.gone = true;
    dog.body.enable = false;
    dog.anims.stop();
    Audio.play('yelp');
    const away = dog.x >= this.player.x ? 1 : -1;
    this.scene.tweens.add({
      targets: dog,
      x: dog.x + away * 90,
      y: dog.y - 18,
      angle: away * 200,
      alpha: 0,
      duration: 600,
      ease: 'Quad.Out',
    });
  }

  restore(dog) {
    this.scene.tweens.killTweensOf(dog);
    dog.gone = false;
    dog.setPosition(dog.home.x, dog.home.y).setAngle(0).setAlpha(1);
    dog.body.enable = true;
    dog.body.reset(dog.home.x, dog.home.y);
    dog.play(dog.anim);
  }

  update() {
    const p = this.player;
    for (const dog of this.items) {
      if (dog.gone) continue;
      const { x0, x1, y } = dog.range;
      // The player on this floor, close by and inside the stretch: run at them.
      const onFloor = Math.abs(p.body.bottom - y) < 4 && !p.dead;
      const dx = p.x - dog.x;
      const chasing = onFloor && Math.abs(dx) < DOGS.chaseRange && p.x > x0 && p.x < x1;
      if (chasing) dog.dir = Math.sign(dx) || dog.dir;
      else if (dog.dir > 0 && dog.x >= x1 - 8) dog.dir = -1;
      else if (dog.dir < 0 && dog.x <= x0 + 8) dog.dir = 1;
      const speed = chasing ? dog.speeds.chaseSpeed : dog.speeds.speed;
      // Never leave the stretch, even when chasing.
      const atEnd = (dog.dir > 0 && dog.x >= x1 - 8) || (dog.dir < 0 && dog.x <= x0 + 8);
      dog.setVelocityX(atEnd ? 0 : dog.dir * speed).setFlipX(dog.dir < 0);
      dog.anims.timeScale = chasing ? 2 : 1;
    }
  }
}
