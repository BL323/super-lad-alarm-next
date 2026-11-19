// Level 6: Poole → Parkstone, ending at The Avocet. Built by
// `npm run build:levels`.
//
// The last leg of the crawl, at night with the street lamps lit. The hardest
// train ride, then the Conductor's revenge on the roof of his train: the
// final fight (BOSS.final), six stomps, with bigger volleys and a dash back
// off the wall. Beat him, hop off at Parkstone, and take the rooftops up the
// road to The Avocet, where the locals throw beer mats from the windows.
//
//   Poole (0–21) → the train (23–95) → lineside, the boss checkpoint (98–111)
//   → the Conductor's train (112–131) → Parkstone station (132–153)
//   → the road and its rooftops (154–212), The Avocet at col 204

export const meta = {
  id: 'level-06',
  cols: 213, // ~10.7 screens of 20 tiles
  properties: { title: 'Poole to Parkstone', theme: 'night' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, roof, bridge, embankment, carriage, crates, canopy, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, boss, zone, thrower, pub, sign, house, shop, lamp } = L;

  // Luggage on a carriage roof: crates from `topRow` down to the roof.
  const luggage = (col, topRow) => {
    for (let r = topRow; r < ROOF; r++) set('ground', col, r, T.crate);
  };

  // Poole (cols 0–21): back at the station after The Rising Sun.
  platform(0, 21);
  canopy(2, 11, 4, [3, 11]);
  sign(15, 'POOLE');
  lamp(13);
  lamp(19);
  spawn(7);
  [9, 11, 17].forEach((c) => pint(c, 9));

  // The train (cols 23–95): the hardest ride of the crawl. 3-tile gaps,
  // four crumbling crates in a row, a low bridge over a gap, glass, luggage.
  carriage(23, 10); // 1-tile gap at 22, step up onto the roof
  glass(28, ROOF);
  pint(25, 7);
  pint(28, 5);
  pint(31, 7);
  [33, 34, 35].forEach((c) => pint(c, 6)); // over the 3-tile gap at 33–35
  carriage(36, 10);
  luggage(40, 7);
  luggage(41, 6);
  pint(40, 5);
  pint(41, 4);
  // The martini: on a crate up to the LEFT of the luggage, out in the night
  // sky. Jump back up-left from the top case.
  set('ground', 39, 4, T.crate);
  espresso(39, 3);
  // Gap 46–51: 1-tile gap, crumbling crates at 47–50, 1-tile gap.
  [47, 48, 49, 50].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(52, 10);
  glass(57, ROOF);
  pint(54, 7);
  pint(57, 5);
  pint(60, 7);
  [62, 63, 64].forEach((c) => pint(c, 6)); // over the 3-tile gap at 62–64
  carriage(65, 10);
  carriage(76, 10); // 1-tile gap at 75, under the bridge
  bridge(67, 77, 5);
  [67, 69, 71, 73, 75, 77].forEach((c) => pint(c, 7)); // short hops under it
  glass(81, ROOF);
  pint(81, 5);
  // Gap 86–88: one crumbling crate in the middle.
  crumble(87, ROOF);
  pint(87, 7);
  carriage(89, 7);
  pint(92, 7);

  // Lineside (cols 98–111): drop to the embankment. The checkpoint is the
  // respawn point for the fight.
  embankment(98, 111); // 2-tile gap at 96–97
  lamp(101);
  checkpoint(108, 'Boss train');
  pint(97, 8);
  pint(103, 9);
  pint(105, 9);

  // The Conductor's train (cols 112–131): two coupled carriages, one screen
  // long. Jumping onto the roof starts the final fight (BOSS.final). No pints
  // in the arena.
  carriage(112, 10);
  carriage(122, 10);
  zone('end-zone', 112, 131);
  boss(129, 'conductor', ROOF, 'final');

  // Parkstone station (cols 132–153): hop off once he's beaten.
  platform(132, 153);
  checkpoint(134, 'Parkstone');
  sign(139, 'PARKSTONE');
  canopy(142, 152, 4, [143, 152]);
  lamp(137);
  pint(137, 9);
  pint(145, 9);
  pint(149, 9);

  // The road to The Avocet (cols 154–212), under the lamps. A crate stair
  // up to the high road: three runs of rooftops with a wide alley, a narrow
  // one and tall chimneys. The locals at The Avocet's windows throw beer mats
  // at the street, from under the last run of roofs to the door.
  pavement(154, 212);
  lamp(155);
  shop(158, 'OFF LICENCE');
  crates(161, 9);
  crates(162, 8);
  crates(163, 7);
  pint(161, 8);
  pint(162, 7);
  pint(163, 6);
  house(167, 'terrace-blue');
  house(171, 'terrace-cream');
  house(175, 'terrace-red');
  roof(165, 176, 5);
  set('ground', 170, 4, T.crate); // a tall chimney
  set('ground', 170, 3, T.crate);
  lamp(178); // in the alley (3 tiles)
  house(182, 'cottage');
  house(186, 'terrace-blue');
  roof(180, 187, 5);
  set('ground', 183, 4, T.crate); // chimney
  house(191, 'terrace-cream');
  house(195, 'terrace-red');
  roof(189, 196, 5); // a 1-tile gap at 188
  set('ground', 193, 4, T.crate); // a tall chimney
  set('ground', 193, 3, T.crate);
  [166, 168, 172, 174, 176, 177, 178, 179, 181, 185, 187, 188, 190, 195, 196].forEach((c) => pint(c, 4));
  pint(183, 3);
  [170, 193].forEach((c) => pint(c, 2));
  // The low road: broken glass under the rooftops.
  glass(169);
  pint(169, 7);
  pint(174, 9);
  glass(184);
  pint(184, 7);
  pint(192, 9);
  lamp(199);

  // The Avocet. The finish is its door (same column), 8 tiles from the end.
  pub(204, 'avocet');
  thrower(204, -28, 20); // ground-floor windows, where the angry faces are
  thrower(204, 28, 20);
  lamp(209);
  finish(204);
}
