// Level 2: Dorchester South → Moreton, ending at the Frampton. Built by
// `npm run build:levels`.
//
// A step up from level 1: longer runs of crumbling crates (four in a row),
// a low bridge over a gap, luggage stacked two high, then Moreton's lane with
// cowpats, two level crossings and a high road over the cottage roofs.
//
//   Dorchester South (0–25) → the train (27–65) → lineside, cows (68–79)
//   → the train again (80–113) → the signal box (116–124) → a third train
//   (126–174) → Moreton station (177–204) → the lane: a crossing, the
//   rooftops, another crossing (205–288) → the Frampton door (col 281)

export const meta = {
  id: 'level-02',
  cols: 289, // ~14.5 screens of 20 tiles
  properties: { title: 'Dorchester South to Moreton', theme: 'day' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, roof, bridge, embankment, carriage, crates, canopy, crumble, crossing } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, cowpat, secret, pub, sign, house, shop, lamp, cow } = L;

  /** Luggage piled on a carriage roof at `col`, up to `topRow`. */
  const luggage = (col, topRow) => {
    for (let r = topRow; r < ROOF; r++) set('ground', col, r, T.crate);
  };

  // Dorchester South (cols 0–25): back on the platform after the Brewhouse.
  platform(0, 25);
  canopy(2, 13, 4, [3, 13]);
  sign(18, 'DORCHESTER SOUTH');
  spawn(7);
  [10, 12].forEach((c) => pint(c, 9));
  crates(22, 9);
  pint(22, 7);

  // The train (cols 27–65): glass, a 3-tile gap, a two-high stack of luggage,
  // then four crumbling crates in a row: keep running.
  carriage(27, 10); // 1-tile gap at 26 and a step up onto the roof
  glass(32, ROOF);
  pint(29, 7);
  pint(32, 5);
  pint(35, 7);
  [37, 38, 39].forEach((c) => pint(c, 6)); // over the 3-tile gap at 37–39
  carriage(40, 10);
  luggage(43, 6);
  pint(43, 4);
  pint(47, 7);
  // Gap 50–55: 1-tile gap, crumbling crates at 51–54, 1-tile gap.
  [51, 52, 53, 54].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(56, 10);
  glass(61, ROOF);
  pint(58, 7);
  pint(61, 5);
  pint(64, 7);

  // Lineside (cols 68–79): drop to the embankment, cows grazing by the line.
  embankment(68, 79); // 2-tile gap at 66–67
  cow(72);
  cow(77, true);
  pint(67, 8);
  pint(71, 9);
  pint(75, 9);

  // The train again (cols 80–113): a low bridge over a gap, a crumbling crate
  // in a 3-tile gap, glass.
  carriage(80, 10); // step up onto the roof
  carriage(91, 10); // 1-tile gap at 90, under the bridge
  bridge(84, 93, 5);
  [84, 86, 88, 90, 92].forEach((c) => pint(c, 7)); // short hops under it
  pint(97, 7);
  // Gap 101–103: one crumbling crate in the middle.
  crumble(102, ROOF);
  pint(102, 7);
  carriage(104, 10);
  glass(108, ROOF);
  pint(106, 7);
  pint(108, 5);
  pint(111, 7);

  // The signal box (cols 116–124): a breather on the embankment.
  embankment(116, 124); // 2-tile gap at 114–115
  checkpoint(120, 'Signal box');
  cow(123, true);
  pint(115, 8);
  pint(118, 9);

  // A third train (cols 126–174): glass on every roof, a 3-tile gap, another
  // bridge over a gap, three crumbling crates and more luggage.
  carriage(126, 10); // 1-tile gap at 125, step up onto the roof
  glass(131, ROOF);
  pint(128, 7);
  pint(131, 5);
  pint(134, 7);
  [136, 137, 138].forEach((c) => pint(c, 6)); // over the 3-tile gap at 136–138
  carriage(139, 10);
  carriage(150, 10); // 1-tile gap at 149, under the bridge
  bridge(142, 150, 5);
  [142, 144, 146, 149].forEach((c) => pint(c, 7));
  glass(155, ROOF);
  pint(155, 5);
  pint(158, 7);
  // Gap 160–164: 1-tile gap, crumbling crates at 161–163, 1-tile gap.
  [161, 162, 163].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(165, 10);
  luggage(168, 6);
  pint(168, 4);
  pint(172, 7);

  // Moreton station (cols 177–204): the crate stair, under a canopy.
  platform(177, 204); // 2-tile gap at 175–176, down off the roof
  checkpoint(179, 'Moreton');
  sign(183, 'MORETON');
  canopy(186, 200, 4, [187, 200]);
  crates(191, 9);
  crates(192, 8);
  crates(193, 7);
  crates(194, 8);
  crates(195, 9);
  pint(191, 8);
  pint(192, 7);
  pint(193, 6);
  pint(194, 7);
  pint(195, 8);
  // The martini: on a crate ledge hidden in the canopy, up and to the LEFT of
  // the top crate (col 193, two tiles below). Turn back and jump up-left; the
  // canopy fades while you're up there.
  set('ground', 190, 5, T.crate);
  espresso(190, 4);
  secret(186, 200, 2, 9);
  pint(199, 9);
  pint(202, 9);

  // Moreton's lane (cols 205–288).
  pavement(205, 288);
  house(208, 'cottage');
  lamp(211);
  cowpat(212);
  pint(212, 7);
  // The first crossing (cols 216–219): cols 214–215 are the safe waiting spot.
  crossing(216, 219);
  pint(222, 9);

  // The crate stair up to the high road over the cottages.
  crates(224, 9);
  crates(225, 8);
  crates(226, 7);
  pint(224, 8);
  pint(225, 7);
  pint(226, 6);
  house(230, 'terrace-cream');
  house(234, 'terrace-red');
  house(238, 'cottage');
  roof(228, 239, 5);
  set('ground', 233, 4, T.crate); // chimney
  lamp(240); // in the alley (2 tiles)
  house(244, 'terrace-blue');
  house(248, 'terrace-cream');
  roof(242, 249, 5);
  set('ground', 246, 4, T.crate); // a tall chimney
  set('ground', 246, 3, T.crate);
  [229, 231, 235, 237, 239, 240, 241, 243, 245, 248, 249].forEach((c) => pint(c, 4));
  pint(233, 3);
  pint(246, 2);
  // The low road: cowpats under the rooftops.
  cowpat(232);
  pint(232, 7);
  cowpat(237);
  pint(237, 7);
  cowpat(245);
  pint(245, 7);

  // The second crossing (cols 254–257), out of step with the first.
  crossing(254, 257, 1800);
  pint(260, 9);
  shop(264, 'POST OFFICE');
  lamp(268);
  cowpat(270);
  pint(270, 7);
  crates(273, 9);
  pint(273, 7);
  cowpat(276);
  pint(276, 7);
  house(286, 'cottage');

  // The Frampton. The finish is its door (same column).
  pub(281, 'frampton');
  finish(281);
}
