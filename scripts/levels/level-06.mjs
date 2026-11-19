// Level 6: Poole → Parkstone, ending at The Avocet. Built by
// `npm run build:levels`.
//
// The last leg of the crawl, at night with the street lamps lit. A short ride
// out of Poole, then the Conductor's revenge on the roof of his train: the
// final fight (BOSS.final), five stomps, with bigger volleys and a dash back
// off the wall. Beat him, hop off at Parkstone, and walk up the road to The
// Avocet.
//
//   Poole (0–21) → the train (23–70) → lineside, the boss checkpoint (73–86)
//   → the Conductor's train (87–106) → Parkstone station (107–128)
//   → the road to The Avocet (129–165), the pub at col 157

export const meta = {
  id: 'level-06',
  cols: 166, // ~8.3 screens of 20 tiles
  properties: { title: 'Poole to Parkstone', theme: 'night' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, pavement, bridge, embankment, carriage, canopy, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, boss, zone, pub, sign, house, shop, lamp } = L;

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

  // The train (cols 23–70): a short ride, nothing new, so the fight is the
  // test. Glass, a low bridge, a pair of crumbling crates.
  carriage(23, 10); // 1-tile gap at 22, step up onto the roof
  glass(28, ROOF);
  pint(25, 7);
  pint(28, 5);
  pint(31, 7);
  carriage(35, 10); // 2-tile gap at 33–34
  [33, 34].forEach((c) => pint(c, 6));
  bridge(37, 41, 5); // short hops under it
  [37, 39, 41].forEach((c) => pint(c, 7));
  carriage(47, 10); // 2-tile gap at 45–46
  [45, 46].forEach((c) => pint(c, 6));
  luggage(51, 7);
  luggage(52, 6);
  pint(51, 5);
  pint(52, 4);
  // The martini: on a crate up to the LEFT of the luggage, out in the night
  // sky. Jump back up-left from the top case.
  set('ground', 50, 4, T.crate);
  espresso(50, 3);
  // Gap 57–60: 1-tile gap, crumbling crates at 58–59, 1-tile gap.
  [58, 59].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(61, 10);
  glass(65, ROOF);
  pint(63, 7);
  pint(65, 5);
  pint(68, 7);

  // Lineside (cols 73–86): drop to the embankment. The checkpoint is the
  // respawn point for the fight.
  embankment(73, 86); // 2-tile gap at 71–72
  lamp(76);
  checkpoint(83, 'Boss train');
  pint(72, 8);
  pint(78, 9);
  pint(80, 9);

  // The Conductor's train (cols 87–106): two coupled carriages, one screen
  // long. Jumping onto the roof starts the final fight (BOSS.final). No pints
  // in the arena.
  carriage(87, 10);
  carriage(97, 10);
  zone('end-zone', 87, 106);
  boss(104, 'conductor', ROOF, 'final');

  // Parkstone station (cols 107–128): hop off once he's beaten.
  platform(107, 128);
  checkpoint(109, 'Parkstone');
  sign(114, 'PARKSTONE');
  canopy(117, 127, 4, [118, 127]);
  lamp(112);
  pint(112, 9);
  pint(120, 9);
  pint(124, 9);

  // The road to The Avocet (cols 129–165), under the lamps.
  pavement(129, 165);
  lamp(131);
  house(134, 'terrace-blue');
  house(138, 'terrace-cream');
  lamp(141);
  shop(145, 'OFF LICENCE');
  lamp(149);
  house(152, 'terrace-red');
  pint(136, 9);
  pint(143, 9);
  pint(147, 9);
  pint(151, 9);

  // The Avocet. The finish is its door (same column), 8 tiles from the end.
  pub(157, 'avocet');
  lamp(162);
  finish(157);
}
