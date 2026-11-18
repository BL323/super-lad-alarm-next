// Level 2: Dorchester South → Moreton, ending at the Frampton. Built by
// `npm run build:levels`.
//
// A step up from level 1: the first broken glass (on the carriage roofs),
// crumbling crates bridging wide gaps (keep moving), the first crate stair,
// then Moreton's lane with cowpats and a level crossing you have to wait for.
//
//   Dorchester South (0–25) → the train, with crumbling crates (27–63)
//   → lineside, cows by the line (66–77) → the train again (79–103)
//   → Moreton station (105–132) → the lane and the crossing (133–181)
//   → the Frampton door (col 174)

export const meta = {
  id: 'level-02',
  cols: 182, // ~9.1 screens of 20 tiles
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
  // the platform.
  [102, 103].forEach((c) => crumble(c, ROOF));
  pint(102, 7);
  pint(103, 7);

  // Moreton station (cols 105–132): the first crate stair, under a canopy.
  platform(105, 132);
  checkpoint(107, 'Moreton');
  sign(111, 'MORETON');
  canopy(114, 128, 4, [115, 128]);
  crates(119, 9);
  crates(120, 8);
  crates(121, 7);
  crates(122, 8);
  crates(123, 9);
  pint(119, 8);
  pint(120, 7);
  pint(121, 6);
  pint(122, 7);
  pint(123, 8);
  // The martini: on a crate ledge hidden in the canopy, up and to the LEFT of
  // the top crate (col 121, two tiles below). Turn back and jump up-left; the
  // canopy fades while you're up there.
  set('ground', 118, 5, T.crate);
  espresso(118, 4);
  secret(114, 128, 2, 9);
  pint(127, 9);
  pint(130, 9);

  // Moreton's lane (cols 133–181): cottages, cowpats, then the level crossing.
  pavement(133, 181);
  house(136, 'cottage');
  lamp(139);
  cowpat(140);
  pint(140, 7);
  house(143, 'terrace-cream');
  cowpat(145);
  pint(145, 7);
  // The crossing (cols 150–153). Wait at the barrier while the train goes
  // through; cols 148–149 are the safe waiting spot.
  crossing(150, 153);
  pint(156, 9);
  house(158, 'terrace-red');
  shop(163, 'POST OFFICE');
  lamp(167);
  pint(161, 9);
  pint(166, 9);

  // The Frampton. The finish is its door (same column), 8 tiles from the end.
  pub(174, 'frampton');
  finish(174);
}
