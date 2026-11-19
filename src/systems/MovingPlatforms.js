import Phaser from 'phaser';
import { MOVERS } from '../config.js';
import { TEX } from '../assets.js';
import { DEPTH } from '../level/LevelLoader.js';

// Moving platforms you ride: the tank across the heath, the rowing boats on
// the Frome and the chain ferry across Poole harbour. Each glides from one end of its track to the other (eased), waits
// MOVERS[kind].pauseMs, and comes back, forever. Decks are one-way (you can
// only land on top), and Arcade physics carries a rider along with the deck.
//
// The deck is steered by velocity once per physics step, aiming at where the
// cycle says it should be next step, so it never drifts and riders move with it.

// How each kind is drawn: its texture, where the deck sits in it, and depth.
const LOOKS = {
  tank: { texture: TEX.TANK, deckX: 16, depth: DEPTH.ground - 1 }, // in the trench, in front of the mud
  boat: { texture: TEX.BOAT, deckX: 0, depth: DEPTH.background - 1 }, // behind the water, so it sits in it
  ferry: { texture: TEX.FERRY, deckX: 0, deckY: 6, depth: DEPTH.background - 1 }, // wheelhouse above the deck
};
const DECK_THICKNESS = 6;

export default class MovingPlatforms {
  /**
   * @param {Phaser.Scene} scene GameScene
   * @param {{ kind: string, x: number, y: number, width: number, travel: number, offsetMs: number }[]} defs deck at its left end
   * @param {Phaser.Physics.Arcade.Sprite} player
   */
  constructor(scene, defs, player) {
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.items = defs.map((d) => {
      const tuning = MOVERS[d.kind];
      const look = LOOKS[d.kind];
      const legMs = (d.travel / tuning.speed) * 1000;
      const deckY = look.deckY ?? 0;
      const sprite = this.group.create(d.x - look.deckX, d.y - deckY, look.texture).setOrigin(0, 0).setDepth(look.depth);
      sprite.body.setSize(d.width, DECK_THICKNESS, false).setOffset(look.deckX, deckY);
      Object.assign(sprite.body.checkCollision, { down: false, left: false, right: false });
      sprite.body.setFriction(1, 0); // carry riders sideways (physics groups default this to 0)
      const item = { def: d, look, sprite, legMs, pauseMs: tuning.pauseMs, cycleMs: 2 * (legMs + tuning.pauseMs), clock: 0 };
      item.clock = ((d.offsetMs % item.cycleMs) + item.cycleMs) % item.cycleMs;
      sprite.x = d.x - look.deckX + this.offsetAt(item, item.clock); // start where the cycle says
      sprite.body.updateFromGameObject();
      return item;
    });
    scene.physics.add.collider(player, this.group);

    // Steer each deck once per physics step.
    const world = scene.physics.world;
    const onStep = (delta) => this.step(delta * 1000);
    world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, onStep);
    this.step(0);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, onStep));
  }

  /** How far along its track (px from the left end) a mover is at `clock` ms. */
  offsetAt(item, clock) {
    const { legMs, pauseMs } = item;
    const ease = (u) => (1 - Math.cos(Math.PI * u)) / 2;
    let t = clock % item.cycleMs;
    if (t < legMs) return item.def.travel * ease(t / legMs); // going right
    t -= legMs;
    if (t < pauseMs) return item.def.travel;
    t -= pauseMs;
    if (t < legMs) return item.def.travel * (1 - ease(t / legMs)); // coming back
    return 0;
  }

  step(ms) {
    const dt = 1 / 60; // Arcade's fixed step
    for (const item of this.items) {
      item.clock = (item.clock + ms) % item.cycleMs;
      const body = item.sprite.body;
      const next = item.def.x + this.offsetAt(item, item.clock + dt * 1000);
      body.setVelocity((next - body.x) / dt, 0);
    }
  }
}
