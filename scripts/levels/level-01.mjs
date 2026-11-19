// Level 1: Poole → Dorchester South, ending at the Brewhouse. Built by
// `npm run build:levels`.
//
// Tutorial pace and the longest train ride of the crawl. No hazards until the
// village. Teaches: hopping between carriages, a full jump across a 2-tile
// gap, short hops under a low bridge (a full jump bumps your head), then a
// last train with the first 3-tile gap.
//
//   Poole station (0–27) → the train (28–60) → lineside signal (63–70)
//   → the train under the low bridge (71–102) → the signal box (105–112)
//   → the last train, a 3-tile gap and another bridge (114–147)
//   → Dorchester South (150–169) → the high street (170–225)
//   → the Brewhouse door (col 218)

export const meta = {
  id: 'level-01',
  cols: 226, // ~11.3 screens of 20 tiles
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

  // The signal box (cols 103–112): drop off onto the embankment again.
  embankment(105, 112); // 2-tile gap at 103–104 (a drop from the roof)
  checkpoint(109, 'Signal box');
  pint(104, 8);
  pint(107, 9);
  pint(111, 9);

  // The last train (cols 114–147): the first 3-tile gap (a full running
  // jump), a suitcase on the roof, then short hops under another bridge.
  carriage(114, 10); // 1-tile gap at 113 and a step up onto the roof
  pint(117, 7);
  pint(120, 7);
  [124, 125, 126].forEach((c) => pint(c, 6)); // over the 3-tile gap at 124–126
  carriage(127, 10);
  set('ground', 131, ROOF - 1, T.crate); // a suitcase: hop it
  pint(131, 6);
  pint(134, 7);
  carriage(138, 10); // 1-tile gap at 137
  bridge(140, 145, 5);
  [140, 142, 144].forEach((c) => pint(c, 7)); // under the bridge

  // Dorchester South (cols 150–169): off the train onto the platform.
  platform(150, 169); // 2-tile gap at 148–149 (a drop from the roof)
  checkpoint(152, 'Dorchester South');
  canopy(153, 165, 4, [154, 165]);
  sign(159, 'DORCHESTER SOUTH');
  pint(149, 8);
  pint(157, 9);
  pint(163, 9);

  // The high street (cols 170–225): houses, a bakery, a market stall whose
  // crates are the steps, two dropped kebabs, then the Brewhouse.
  pavement(170, 225);
  lamp(171);
  house(174, 'terrace-red');
  house(178, 'terrace-cream');
  house(182, 'terrace-blue');
  shop(187, 'BAKERY');
  pint(175, 9);
  pint(181, 9);

  stall(192);
  crates(191, 9);
  crates(192, 8);
  crates(193, 9);
  pint(191, 8);
  pint(192, 7);
  pint(193, 8);
  // The martini: on a crate ledge up and to the LEFT of the stall, over the
  // bakery doorway. The only way up is to turn back from the top crate (col
  // 192, two tiles below it) and jump up-left, so a straight run never gets it.
  set('ground', 189, 6, T.crate);
  espresso(189, 5);

  // Five tiles past the bottom crate, so never under a landing.
  kebab(199);
  pint(199, 7);
  lamp(201);
  shop(205, 'GREENGROCER');
  kebab(208);
  pint(208, 7);
  lamp(211);
  house(224, 'cottage');

  // The Brewhouse. The finish is its door (same column). Col 218 is 8 tiles
  // from the end, clear of the jump button when the camera stops.
  pub(218, 'brewhouse');
  finish(218);
}
