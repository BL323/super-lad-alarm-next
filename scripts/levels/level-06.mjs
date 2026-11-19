// Level 6: Poole → Parkstone, ending at The Avocet. Built by
// `npm run build:levels`.
//
// The last leg of the crawl, at night with the street lamps lit. A short ride
// out of Poole, then the Conductor's revenge on the roof of his train: the
// final fight (BOSS.final), five stomps, with bigger volleys and a dash back
// off the wall. Beat him, hop off at Parkstone, and walk up the road to The
// Avocet.
//
//   Poole (0–21) → the train (23–95) → lineside, the boss checkpoint (98–111)
//   → the Conductor's train (112–131) → Parkstone station (132–153)
//   → the road to The Avocet (154–190), the pub at col 182

export const meta = {
  id: 'level-06',
  cols: 191, // ~9.6 screens of 20 tiles
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

  // Two more carriages (cols 71–95): a 3-tile gap, glass, a 2-tile gap and
  // a low bridge.
  [71, 72, 73].forEach((c) => pint(c, 6)); // over the 3-tile gap at 71–73
  carriage(74, 10);
  glass(78, ROOF);
  pint(76, 7);
  pint(78, 5);
  pint(81, 7);
  carriage(86, 10); // 2-tile gap at 84–85
  [84, 85].forEach((c) => pint(c, 6));
  bridge(88, 93, 5);
  [88, 90, 92].forEach((c) => pint(c, 7)); // short hops under the bridge

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

  // The road to The Avocet (cols 154–190), under the lamps.
  pavement(154, 190);
  lamp(156);
  house(159, 'terrace-blue');
  house(163, 'terrace-cream');
  lamp(166);
  shop(170, 'OFF LICENCE');
  lamp(174);
  house(177, 'terrace-red');
  pint(161, 9);
  pint(168, 9);
  pint(172, 9);
  pint(176, 9);

  // The Avocet. The finish is its door (same column), 8 tiles from the end.
  pub(182, 'avocet');
  lamp(187);
  finish(182);
}
