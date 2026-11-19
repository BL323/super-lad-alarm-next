// Level 1: Poole → Dorchester South, ending at the Brewhouse. Built by
// `npm run build:levels`.
//
// The first leg, but no warm-up: the train is as busy as the old final level.
// 3-tile gaps, broken glass and luggage on the roofs, crumbling crates over
// the wide gaps, short hops under two low bridges. Then Dorchester high
// street splits: the low road along the pavement past the dropped kebabs, or
// the high road over the rooftops (alleys and chimneys, more pints).
//
//   Poole station (0–27) → the train (28–65) → lineside (68–75)
//   → the train under the low bridges (76–144) → the signal box (147–156)
//   → the last train (158–182) → Dorchester South (185–204)
//   → the high street, low road and rooftops (205–261) → the Brewhouse (col 254)

export const meta = {
  id: 'level-01',
  cols: 262, // ~13.1 screens of 20 tiles
  properties: { title: 'Poole to Dorchester South', theme: 'morning' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, roof, bridge, embankment, carriage, crates, canopy, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, kebab, pub, sign, house, shop, lamp, stall } = L;

  /** Luggage piled on a carriage roof at `col`, up to `topRow`. */
  const luggage = (col, topRow) => {
    for (let r = topRow; r < ROOF; r++) set('ground', col, r, T.crate);
  };

  // Poole station (cols 0–27). One low crate, then the step up onto the train.
  platform(0, 27);
  canopy(2, 14, 4, [3, 14]);
  sign(18, 'POOLE');
  spawn(7);
  crates(22, 9);
  [10, 12, 14].forEach((c) => pint(c, 9));
  pint(22, 7);
  pint(25, 9);

  // The train (cols 28–64): glass, a 3-tile gap, luggage, crumbling crates.
  carriage(28, 10); // step up 2 tiles from the platform onto the roof
  glass(33, ROOF);
  pint(31, 7);
  pint(33, 5);
  pint(36, 7);
  [38, 39, 40].forEach((c) => pint(c, 6)); // over the 3-tile gap at 38–40
  carriage(41, 10);
  luggage(45, 7);
  pint(43, 7);
  pint(45, 5);
  // Gap 51–55: 1-tile gap, crumbling crates at 52–54, 1-tile gap (a full
  // jump from the edge lands on the crates, never in a gap).
  [52, 53, 54].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(56, 10);
  glass(61, ROOF);
  pint(58, 7);
  pint(61, 5);
  pint(64, 7);

  // Lineside (cols 68–75): a drop to the embankment, no checkpoint.
  embankment(68, 75); // 2-tile gap at 66–67
  pint(67, 8);
  pint(71, 9);
  pint(74, 9);

  // The low bridges (cols 76–144). A full jump bumps your head under them;
  // the 1-tile gaps underneath need short hops.
  carriage(76, 10);
  carriage(87, 10); // 1-tile gap at 86, under the bridge
  carriage(98, 10); // 1-tile gap at 97, just past it
  bridge(81, 92, 5);
  pint(78, 7);
  [82, 84, 86, 88, 90].forEach((c) => pint(c, 7)); // under the bridge
  pint(97, 6);
  pint(101, 7);
  [108, 109, 110].forEach((c) => pint(c, 6)); // over the 3-tile gap at 108–110
  carriage(111, 10);
  glass(116, ROOF);
  pint(113, 7);
  pint(116, 5);
  pint(119, 7);
  // Gap 121–123: one crumbling crate in the middle.
  crumble(122, ROOF);
  pint(122, 7);
  carriage(124, 10);
  carriage(135, 10); // 1-tile gap at 134, under the second bridge
  bridge(128, 137, 5);
  [129, 131, 134, 136].forEach((c) => pint(c, 7)); // short hops under it
  pint(140, 7);
  pint(143, 7);

  // The signal box (cols 147–156): drop off onto the embankment.
  embankment(147, 156); // 2-tile gap at 145–146
  checkpoint(151, 'Signal box');
  pint(146, 8);
  pint(149, 9);
  pint(154, 9);

  // The last train (cols 158–181): a suitcase, crumbling crates, glass.
  carriage(158, 10); // 1-tile gap at 157 and a step up onto the roof
  luggage(161, 7); // well clear of the gap: a jump over it lands on the roof
  pint(161, 5);
  pint(164, 7);
  // Gap 168–172: 1-tile gap, crumbling crates at 169–171, 1-tile gap.
  [169, 170, 171].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(173, 10);
  glass(178, ROOF);
  pint(175, 7);
  pint(178, 5);
  pint(181, 7);

  // Dorchester South (cols 185–204): off the train onto the platform.
  platform(185, 204); // 2-tile gap at 183–184 (a drop from the roof)
  checkpoint(187, 'Dorchester South');
  canopy(188, 200, 4, [189, 200]);
  sign(194, 'DORCHESTER SOUTH');
  pint(184, 8);
  pint(192, 9);
  pint(198, 9);

  // The high street (cols 205–261).
  pavement(205, 261);
  lamp(206);
  house(209, 'terrace-red');
  shop(213, 'BAKERY');
  pint(208, 9);
  pint(211, 9);

  // The market stall's crates are the stair up to the high road.
  stall(218);
  crates(217, 9);
  crates(218, 8);
  crates(219, 7);
  pint(217, 8);
  pint(218, 7);
  pint(219, 6);

  // The high road: two runs of rooftops with an alley between, a chimney to
  // hop on each. Pints all the way along.
  house(223, 'terrace-cream');
  house(227, 'terrace-blue');
  house(231, 'terrace-red');
  roof(221, 232, 5);
  set('ground', 226, 4, T.crate); // chimney
  lamp(233); // in the alley
  house(236, 'cottage');
  house(240, 'terrace-cream');
  roof(234, 241, 5);
  set('ground', 238, 4, T.crate); // a tall chimney
  set('ground', 238, 3, T.crate);
  [222, 224, 228, 230, 232, 233, 235, 237, 240, 241].forEach((c) => pint(c, 4));
  pint(226, 3);
  pint(238, 2);
  // The martini: on a crate floating up and to the LEFT of the tall chimney.
  // Climb the chimney, then jump back up-left.
  set('ground', 236, 2, T.crate);
  espresso(236, 1);

  // The low road: dropped kebabs under the rooftops.
  kebab(225);
  pint(225, 7);
  pint(230, 9);
  kebab(237);
  pint(237, 7);

  // Past the rooftops: one more kebab, the greengrocer, then the Brewhouse.
  kebab(246);
  pint(246, 7);
  shop(246, 'GREENGROCER');
  lamp(250);
  house(260, 'cottage');

  // The Brewhouse. The finish is its door (same column), clear of the jump
  // button when the camera stops.
  pub(254, 'brewhouse');
  finish(254);
}
