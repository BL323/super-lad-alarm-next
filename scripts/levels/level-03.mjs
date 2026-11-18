// Level 3: Moreton → Wool, ending at The Black Bear. Built by
// `npm run build:levels`.
//
// The halfway point of the crawl and the first Train Conductor fight, on the
// roof of his train between Moreton and Wool. Then Wool's high street splits:
// the low road along the pavement, where angry locals throw beer mats from
// The Black Bear's windows, or the high road over the rooftops, out of their
// reach and with more pints, but with gaps between the buildings.
//
//   Moreton (0–23) → the train (25–72) → lineside, the boss checkpoint (75–87)
//   → the Conductor's train (88–107) → Wool station (108–129)
//   → the high street, low road and rooftops (130–212) → The Black Bear (col 205)

export const meta = {
  id: 'level-03',
  cols: 213, // ~10.7 screens of 20 tiles
  properties: { title: 'Moreton to Wool', theme: 'afternoon' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, roof, embankment, carriage, crates, canopy, crumble } = L;
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

  // Lineside (cols 75–87): drop to the embankment. The checkpoint is the
  // respawn point for the fight: any death in it puts you back here.
  embankment(75, 87); // 2-tile gap at 73–74
  cow(78);
  checkpoint(84, 'Boss train');
  pint(74, 8);
  pint(80, 9);
  pint(82, 9);

  // The Conductor's train (cols 88–107): two coupled carriages, one screen
  // long. Jumping up onto the roof starts the fight (BOSS.first): the camera
  // locks, walls close, and the hills race past. No pints in the arena.
  carriage(88, 10);
  carriage(98, 10);
  zone('end-zone', 88, 107);
  boss(105, 'conductor', ROOF, 'first');

  // Wool station (cols 108–129): hop off once he's beaten.
  platform(108, 129);
  checkpoint(110, 'Wool');
  sign(114, 'WOOL');
  canopy(117, 127, 4, [118, 127]);
  pint(113, 9);
  pint(120, 9);
  pint(124, 9);

  // Wool's high street (cols 130–212).
  pavement(130, 212);
  lamp(131);
  house(134, 'terrace-red');
  house(138, 'terrace-cream');
  shop(143, 'CHEMIST');
  lamp(147);
  house(151, 'cottage');
  shop(155, 'BUTCHER');
  pint(136, 9);
  pint(141, 9);
  pint(149, 9);

  // The crate stair where the roads split: over the top and down to the
  // pavement (low road), or jump up-right onto the rooftops (high road).
  crates(159, 9);
  crates(160, 8);
  crates(161, 7);
  crates(162, 8);
  crates(163, 9);
  pint(159, 8);
  pint(160, 7);
  pint(161, 6);

  // The high road: slate roofs on three runs of buildings, with an alley
  // (2-tile gap) and a narrow gap (1 tile) between them. More pints up here,
  // and the beer mats can't reach you.
  house(165, 'terrace-blue');
  shop(169, 'NEWSAGENT');
  house(173, 'terrace-red');
  roof(163, 174, 5);
  lamp(176); // in the alley
  house(179, 'terrace-cream');
  shop(183, 'CHIPPY');
  roof(177, 184, 5);
  house(188, 'cottage');
  shop(192, 'POST OFFICE');
  roof(186, 193, 5);
  [164, 166, 168, 170, 172, 174, 175, 176, 178, 180, 182, 184, 185, 187, 189, 191, 193].forEach((c) => pint(c, 4));
  // The martini: on a crate up and to the LEFT of the first roof, above the
  // stair. Jump back up-left from the start of the high road to reach it.
  set('ground', 160, 3, T.crate);
  espresso(160, 2);

  // The low road: the pavement under the rooftops, then The Black Bear with
  // its locals at the windows and a fried-chicken bucket outside.
  pint(167, 9);
  pint(178, 9);
  pint(189, 9);
  bucket(198);
  pint(198, 7);
  pub(205, 'black-bear');
  thrower(205, -28, 20); // ground-floor windows, where the angry faces are
  thrower(205, 28, 20);

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(205);
}
