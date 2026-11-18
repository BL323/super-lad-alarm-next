// Level 1: Poole → Dorchester South, ending at the Brewhouse. Built by
// `npm run build:levels`.
//
// Tutorial pace and the longest train ride of the crawl. No hazards until the
// village. Teaches: hopping between carriages, a full jump across a 2-tile
// gap, and short hops under a low bridge (a full jump bumps your head).
//
//   Poole station (0–27) → the train (28–60) → lineside signal (63–70)
//   → the train under the low bridge (71–102) → Dorchester South (105–124)
//   → the high street (125–166) → the Brewhouse door (col 159)

export const meta = {
  id: 'level-01',
  cols: 167, // ~8.4 screens of 20 tiles
  properties: { title: 'Poole to Dorchester South', theme: 'morning' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, bridge, embankment, carriage, crates, canopy } = L;
  const { spawn, checkpoint, finish, pint, espresso, kebab, pub, sign, house, shop, lamp, stall } = L;

  // Poole station (cols 0–27). Flat platform under a canopy, one low crate to
  // practise jumping, then the step up onto the train.
  platform(0, 27);
  canopy(2, 14, 4, [3, 14]);
  sign(18, 'POOLE');
  spawn(7);
  crates(22, 9);
  [10, 12, 14].forEach((c) => pint(c, 9));
  pint(22, 7); // on top of the crate's jump
  pint(25, 9);

  // The train (cols 28–60): three coupled carriages. Gaps are 2 then 1 tiles.
  carriage(28, 10); // step up 2 tiles from the platform onto the roof
  carriage(40, 10); // 2-tile gap at 38–39: the first proper jump
  carriage(51, 10); // 1-tile gap at 50
  pint(31, 7);
  pint(34, 7);
  pint(38, 5); // high over the 2-tile gap: a full jump collects them
  pint(39, 5);
  pint(44, 7);
  pint(47, 7);
  pint(50, 6);
  pint(55, 7);
  pint(58, 7);

  // Lineside (cols 61–70): drop off the train to a signal on the embankment.
  embankment(63, 70); // 2-tile gap at 61–62 (a drop from the roof)
  checkpoint(66, 'Lineside');
  pint(62, 8);
  pint(68, 9);

  // The low bridge (cols 71–102). Back up onto the next train; a road bridge
  // crosses it at row 5, two tiles above the roofs, so a full jump bumps your
  // head. The 1-tile gap underneath needs a short hop. Pints sit low.
  carriage(71, 10);
  carriage(82, 10); // 1-tile gap at 81, under the bridge
  carriage(93, 10); // 1-tile gap at 92, just past it
  bridge(76, 87, 5);
  pint(73, 6);
  [77, 79, 81, 83, 85].forEach((c) => pint(c, 7)); // under the bridge
  pint(92, 6);
  pint(96, 7);
  pint(99, 7);

  // Dorchester South (cols 105–124): off the train onto the platform.
  platform(105, 124); // 2-tile gap at 103–104 (a drop from the roof)
  checkpoint(107, 'Dorchester South');
  canopy(108, 120, 4, [109, 120]);
  sign(114, 'DORCHESTER SOUTH');
  pint(104, 8);
  pint(112, 9);
  pint(118, 9);

  // The high street (cols 125–166): houses, a bakery, a market stall whose
  // crates are the steps, a dropped kebab, then the Brewhouse.
  pavement(125, 166);
  lamp(126);
  house(129, 'terrace-red');
  house(133, 'terrace-cream');
  house(137, 'terrace-blue');
  shop(142, 'BAKERY');
  pint(130, 9);
  pint(136, 9);

  stall(147);
  crates(146, 9);
  crates(147, 8);
  crates(148, 9);
  pint(146, 8);
  pint(147, 7);
  pint(148, 8);
  // The martini: on a crate ledge up and to the LEFT of the stall, over the
  // bakery doorway. The only way up is to turn back from the top crate (col
  // 147, two tiles below it) and jump up-left, so a straight run never gets it.
  set('ground', 144, 6, T.crate);
  espresso(144, 5);

  // Five tiles past the bottom crate, so never under a landing.
  kebab(154);
  pint(154, 7);
  lamp(156);
  house(165, 'cottage');

  // The Brewhouse. The finish is its door (same column). Col 159 is 8 tiles
  // from the end, clear of the jump button when the camera stops.
  pub(159, 'brewhouse');
  finish(159);
}
