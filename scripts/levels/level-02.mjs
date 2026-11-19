// Level 2: Dorchester South → Moreton, ending at the Frampton. Built by
// `npm run build:levels`.
//
// A step up from level 1: the first broken glass (on the carriage roofs),
// crumbling crates bridging wide gaps (keep moving), the first crate stair,
// then Moreton's lane with cowpats and a level crossing you have to wait for.
//
//   Dorchester South (0–25) → the train, with crumbling crates (27–63)
//   → lineside, cows by the line (66–77) → the train again (79–103)
//   → the signal box (105–113) → a third train, glass and a 3-tile gap
//   (115–151) → Moreton station (154–181) → the lane, the crossing and
//   the cowpats (182–239) → the Frampton door (col 231)

export const meta = {
  id: 'level-02',
  cols: 239, // ~12 screens of 20 tiles
  properties: { title: 'Dorchester South to Moreton', theme: 'day' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, embankment, carriage, crates, canopy, crumble, crossing } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, cowpat, secret, pub, sign, house, shop, lamp, cow } = L;

  // Dorchester South (cols 0–25): back on the platform after the Brewhouse.
  platform(0, 25);
  canopy(2, 13, 4, [3, 13]);
  sign(18, 'DORCHESTER SOUTH');
  spawn(7);
  [10, 12].forEach((c) => pint(c, 9));
  crates(22, 9);
  pint(22, 7);

  // The train (cols 27–63). The first broken glass sits on a roof; then a wide
  // gap bridged by three crumbling crates: they shake when you land and drop
  // away, so keep running.
  carriage(27, 10); // 1-tile gap at 26 and a step up onto the roof
  glass(31, ROOF);
  carriage(39, 10); // 2-tile gap at 37–38
  pint(29, 7);
  pint(31, 5); // over the glass
  pint(34, 7);
  pint(37, 6);
  pint(38, 6);
  pint(43, 7);
  pint(46, 7);
  // Gap 49–53: 1-tile gap, three crumbling crates (50–52), 1-tile gap.
  [50, 51, 52].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(54, 10);
  glass(59, ROOF);
  pint(57, 7);
  pint(59, 5);
  pint(62, 7);

  // Lineside (cols 64–77): drop to the embankment, cows grazing by the line.
  embankment(66, 77); // 2-tile gap at 64–65
  checkpoint(68, 'Lineside');
  cow(72);
  cow(76, true);
  pint(65, 8);
  pint(70, 9);
  pint(74, 9);

  // The train again (cols 79–103), ending in two more crumbling crates.
  carriage(79, 10); // 1-tile gap at 78, step up onto the roof
  carriage(91, 10); // 2-tile gap at 89–90
  pint(82, 7);
  pint(86, 7);
  pint(89, 6);
  pint(90, 6);
  pint(95, 7);
  pint(98, 7);
  // Gap 101–104: 1-tile gap, crumbling crates at 102–103, then the drop to
  // the embankment.
  [102, 103].forEach((c) => crumble(c, ROOF));
  pint(102, 7);
  pint(103, 7);

  // The signal box (cols 105–113): a breather on the embankment.
  embankment(105, 113);
  checkpoint(108, 'Signal box');
  cow(112, true);
  pint(110, 9);

  // A third train (cols 115–151): glass on every roof, a 3-tile gap and
  // another crumbling bridge.
  carriage(115, 10); // 1-tile gap at 114, step up onto the roof
  glass(119, ROOF);
  pint(117, 7);
  pint(119, 5);
  pint(122, 7);
  [125, 126, 127].forEach((c) => pint(c, 6)); // over the 3-tile gap at 125–127
  carriage(128, 10);
  glass(133, ROOF);
  pint(133, 5);
  // Gap 138–141: 1-tile gap, crumbling crates at 139–140, 1-tile gap.
  [139, 140].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(142, 10);
  glass(147, ROOF);
  pint(144, 7);
  pint(147, 5);
  pint(150, 7);

  // Moreton station (cols 154–181): the first crate stair, under a canopy.
  platform(154, 181); // 2-tile gap at 152–153, down off the roof
  checkpoint(156, 'Moreton');
  sign(160, 'MORETON');
  canopy(163, 177, 4, [164, 177]);
  crates(168, 9);
  crates(169, 8);
  crates(170, 7);
  crates(171, 8);
  crates(172, 9);
  pint(168, 8);
  pint(169, 7);
  pint(170, 6);
  pint(171, 7);
  pint(172, 8);
  // The martini: on a crate ledge hidden in the canopy, up and to the LEFT of
  // the top crate (col 170, two tiles below). Turn back and jump up-left; the
  // canopy fades while you're up there.
  set('ground', 167, 5, T.crate);
  espresso(167, 4);
  secret(163, 177, 2, 9);
  pint(176, 9);
  pint(179, 9);

  // Moreton's lane (cols 182–238): cottages, cowpats, the level crossing,
  // then more cowpats and a crate to climb.
  pavement(182, 238);
  house(185, 'cottage');
  lamp(188);
  cowpat(189);
  pint(189, 7);
  house(192, 'terrace-cream');
  cowpat(194);
  pint(194, 7);
  // The crossing (cols 199–202). Wait at the barrier while the train goes
  // through; cols 197–198 are the safe waiting spot.
  crossing(199, 202);
  pint(205, 9);
  house(207, 'terrace-red');
  shop(212, 'POST OFFICE');
  lamp(216);
  pint(210, 9);
  pint(215, 9);
  cowpat(219);
  pint(219, 7);
  crates(222, 9);
  pint(222, 7);
  cowpat(225);
  pint(225, 7);
  house(236, 'cottage');

  // The Frampton. The finish is its door (same column), 8 tiles from the end.
  pub(231, 'frampton');
  finish(231);
}
