// Level 3: Moreton → Wool, ending at The Black Bear. Built by
// `npm run build:levels`.
//
// The halfway point of the crawl and the first Train Conductor fight, on the
// roof of his train between Moreton and Wool. Then Wool's high street splits:
// the low road along the pavement, where angry locals throw beer mats from
// The Black Bear's windows, or the high road over the rooftops, out of their
// reach and with more pints, but with gaps between the buildings.
//
//   Moreton (0–23) → the train (25–98) → lineside, the boss checkpoint (101–113)
//   → the Conductor's train (114–133) → Wool station (134–155)
//   → the high street, low road and rooftops (156–238) → The Black Bear (col 231)

export const meta = {
  id: 'level-03',
  cols: 239, // ~12 screens of 20 tiles
  properties: { title: 'Moreton to Wool', theme: 'afternoon' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, roof, bridge, embankment, carriage, crates, canopy, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, bucket, boss, zone, thrower, pub, sign, house, shop, lamp, cow } = L;

  // Moreton (cols 0–23): back on the platform after the Frampton.
  platform(0, 23);
  canopy(2, 12, 4, [3, 12]);
  sign(16, 'MORETON');
  spawn(7);
  [10, 12].forEach((c) => pint(c, 9));
  crates(20, 9);
  pint(20, 7);

  // The train (cols 25–72): glass on the roofs and a pair of crumbling crates.
  carriage(25, 10); // 1-tile gap at 24, step up onto the roof
  glass(29, ROOF);
  carriage(37, 10); // 2-tile gap at 35–36
  pint(27, 7);
  pint(29, 5);
  pint(32, 7);
  pint(35, 6);
  pint(36, 6);
  pint(41, 7);
  pint(44, 7);
  // Gap 47–50: 1-tile gap, crumbling crates at 48–49, 1-tile gap.
  [48, 49].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(51, 10);
  glass(56, ROOF);
  carriage(63, 10); // 2-tile gap at 61–62
  pint(53, 7);
  pint(56, 5);
  pint(59, 7);
  pint(61, 6);
  pint(62, 6);
  pint(66, 7);
  pint(70, 7);

  // More train (cols 73–98): a 3-tile gap, glass, a single crumbling crate
  // and a low bridge.
  [73, 74, 75].forEach((c) => pint(c, 6)); // over the 3-tile gap at 73–75
  carriage(76, 10);
  glass(80, ROOF);
  pint(78, 7);
  pint(80, 5);
  pint(83, 7);
  // Gap 86–88: 1-tile gap, a crumbling crate at 87, 1-tile gap.
  crumble(87, ROOF);
  pint(87, 7);
  carriage(89, 10);
  bridge(91, 95, 5); // short hops under it
  [91, 93, 95].forEach((c) => pint(c, 7));

  // Lineside (cols 101–113): drop to the embankment. The checkpoint is the
  // respawn point for the fight: any death in it puts you back here.
  embankment(101, 113); // 2-tile gap at 99–100
  cow(104);
  checkpoint(110, 'Boss train');
  pint(100, 8);
  pint(106, 9);
  pint(108, 9);

  // The Conductor's train (cols 114–133): two coupled carriages, one screen
  // long. Jumping up onto the roof starts the fight (BOSS.first): the camera
  // locks, walls close, and the hills race past. No pints in the arena.
  carriage(114, 10);
  carriage(124, 10);
  zone('end-zone', 114, 133);
  boss(131, 'conductor', ROOF, 'first');

  // Wool station (cols 134–155): hop off once he's beaten.
  platform(134, 155);
  checkpoint(136, 'Wool');
  sign(140, 'WOOL');
  canopy(143, 153, 4, [144, 153]);
  pint(139, 9);
  pint(146, 9);
  pint(150, 9);

  // Wool's high street (cols 156–238).
  pavement(156, 238);
  lamp(157);
  house(160, 'terrace-red');
  house(164, 'terrace-cream');
  shop(169, 'CHEMIST');
  lamp(173);
  house(177, 'cottage');
  shop(181, 'BUTCHER');
  pint(162, 9);
  pint(167, 9);
  pint(175, 9);

  // The crate stair where the roads split: over the top and down to the
  // pavement (low road), or jump up-right onto the rooftops (high road).
  crates(185, 9);
  crates(186, 8);
  crates(187, 7);
  crates(188, 8);
  crates(189, 9);
  pint(185, 8);
  pint(186, 7);
  pint(187, 6);

  // The high road: slate roofs on three runs of buildings, with an alley
  // (2-tile gap) and a narrow gap (1 tile) between them. More pints up here,
  // and the beer mats can't reach you.
  house(191, 'terrace-blue');
  shop(195, 'NEWSAGENT');
  house(199, 'terrace-red');
  roof(189, 200, 5);
  lamp(202); // in the alley
  house(205, 'terrace-cream');
  shop(209, 'CHIPPY');
  roof(203, 210, 5);
  house(214, 'cottage');
  shop(218, 'POST OFFICE');
  roof(212, 219, 5);
  [190, 192, 194, 196, 198, 200, 201, 202, 204, 206, 208, 210, 211, 213, 215, 217, 219].forEach((c) => pint(c, 4));
  // The martini: on a crate up and to the LEFT of the first roof, above the
  // stair. Jump back up-left from the start of the high road to reach it.
  set('ground', 186, 3, T.crate);
  espresso(186, 2);

  // The low road: the pavement under the rooftops, then The Black Bear with
  // its locals at the windows and a fried-chicken bucket outside.
  pint(193, 9);
  pint(204, 9);
  pint(215, 9);
  bucket(224);
  pint(224, 7);
  pub(231, 'black-bear');
  thrower(231, -28, 20); // ground-floor windows, where the angry faces are
  thrower(231, 28, 20);

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(231);
}
