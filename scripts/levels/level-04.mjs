// Level 4: Wool → Wareham, ending at The Old Granary. Built by
// `npm run build:levels`.
//
// Golden late afternoon. Out of Wool across the heath, where the only way over
// the muddy tank trench is to ride on top of a tank from Bovington. Then the
// train, with broken glass on the roofs and two low bridges, into Wareham.
// Over the rooftops (or along the street, under the beer mats thrown from the
// Kings Arms) to the quay, where you cross the Frome on rowing boats, by way
// of a jetty, while swans guard both banks.
//
//   Wool (0–21) → the heath and the tank trench (23–57) → the train (59–129)
//   → Wareham station (132–153) → the town and its rooftops (154–207)
//   → the quay and the river (208–272) → The Old Granary (col 264)

export const meta = {
  id: 'level-04',
  cols: 273, // ~13.7 screens of 20 tiles
  properties: { title: 'Wool to Wareham', theme: 'golden' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, SURFACE, set, platform, pavement, roof, bridge, embankment, carriage, crates, canopy, river, trench, jetty, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, mover, swan, thrower, pub, sign, house, shop, lamp, easel } = L;

  // Wool (cols 0–21): the platform after The Black Bear.
  platform(0, 21);
  canopy(2, 11, 4, [3, 11]);
  sign(15, 'WOOL');
  spawn(7);
  [9, 11].forEach((c) => pint(c, 9));
  crates(16, 9); // clear of the gap at 22: a jump over it lands on the platform
  pint(16, 7);

  // The heath (cols 23–57). A trench of mud (34–47) too wide to jump: ride
  // over on the tank's turret. It waits at each end; hop on, hop off.
  embankment(23, 33); // 1-tile gap at 22
  pint(26, 9);
  pint(29, 9);
  trench(34, 47);
  mover('tank', 35, 46, SURFACE - 1); // turret roof a tile above the banks
  [37, 43].forEach((c) => pint(c, 8)); // ride under them
  // The martini: on a crate hanging over the trench, only reachable from the
  // tank's turret. Hop up, then wait for the tank to come back for you.
  set('ground', 40, 7, T.crate);
  espresso(40, 6);
  embankment(48, 57);
  checkpoint(51, 'Tank range');
  pint(54, 9);
  pint(56, 9);

  /** Luggage piled on a carriage roof at `col`, up to `topRow`. */
  const luggage = (col, topRow) => {
    for (let r = topRow; r < ROOF; r++) set('ground', col, r, T.crate);
  };

  // The train (cols 59–129): two low bridges over gaps, 3-tile gaps, glass,
  // luggage and two runs of crumbling crates.
  carriage(59, 10); // 1-tile gap at 58, step up onto the roof
  glass(64, ROOF);
  pint(61, 7);
  pint(64, 5);
  pint(67, 7);
  [69, 70, 71].forEach((c) => pint(c, 6)); // over the 3-tile gap at 69–71
  carriage(72, 10);
  carriage(83, 10); // 1-tile gap at 82, under the bridge
  bridge(74, 84, 5);
  [74, 76, 78, 80, 82, 84].forEach((c) => pint(c, 7)); // short hops under it
  glass(88, ROOF);
  pint(88, 5);
  pint(91, 7);
  // Gap 93–97: 1-tile gap, crumbling crates at 94–96, 1-tile gap.
  [94, 95, 96].forEach((c) => {
    crumble(c, ROOF);
    pint(c, 7);
  });
  carriage(98, 10);
  luggage(101, 6);
  pint(101, 4);
  pint(104, 7);
  [108, 109, 110].forEach((c) => pint(c, 6)); // over the 3-tile gap at 108–110
  carriage(111, 10);
  glass(116, ROOF);
  pint(113, 7);
  pint(116, 5);
  pint(119, 7);
  carriage(123, 7); // 2-tile gap at 121–122
  bridge(124, 128, 5);
  [121, 122].forEach((c) => pint(c, 6));
  [124, 126, 128].forEach((c) => pint(c, 7)); // short hops under the bridge

  // Wareham station (cols 132–153).
  platform(132, 153); // 2-tile gap at 130–131, down off the roof
  checkpoint(135, 'Wareham');
  sign(140, 'WAREHAM');
  canopy(138, 149, 4, [139, 149]);
  pint(137, 9);
  pint(143, 9);
  pint(147, 9);

  // The town (cols 154–221): a crate stair up onto the rooftops, then the
  // Kings Arms across the street, where the locals throw beer mats from the
  // windows (they can't reach the roofs).
  pavement(154, 221);
  lamp(155);
  house(158, 'terrace-red');
  glass(161);
  pint(157, 9);
  pint(161, 7); // over the glass
  crates(163, 9);
  crates(164, 8);
  crates(165, 7);
  pint(163, 8);
  pint(164, 7);
  pint(165, 6);
  house(169, 'terrace-cream');
  house(173, 'terrace-blue');
  house(177, 'cottage');
  roof(167, 178, 5);
  set('ground', 172, 4, T.crate); // chimney
  lamp(180); // in the alley (2 tiles)
  house(183, 'terrace-red');
  house(187, 'terrace-cream');
  roof(181, 188, 5);
  set('ground', 185, 4, T.crate); // a tall chimney
  set('ground', 185, 3, T.crate);
  [168, 170, 174, 176, 178, 179, 180, 182, 184, 187, 188].forEach((c) => pint(c, 4));
  pint(172, 3);
  pint(185, 2);
  pint(171, 9); // the low road
  pint(183, 9);
  pub(194, 'kings-arms', { scenery: true });
  thrower(194, -28, 20);
  thrower(194, 28, 20);
  pint(191, 9);
  shop(201, 'GALLERY');
  lamp(206);

  // The quay (cols 208–221), with a swan on the bank, still in range of the
  // Kings Arms windows.
  swan(212, 217);
  pint(214, 7); // jump the swan for it

  // The Frome (cols 222–246): a boat, the jetty, another boat.
  river(222, 231);
  mover('boat', 223, 230, SURFACE, 0);
  [225, 228].forEach((c) => pint(c, 9)); // ride through them
  jetty(232, 234);
  pint(233, 9);
  river(235, 246);
  mover('boat', 236, 245, SURFACE, 1800);
  [238, 241, 244].forEach((c) => pint(c, 9));
  easel(242); // the easel, still floating in the Frome

  // The far bank (cols 247–272): another swan, then The Old Granary.
  pavement(247, 272);
  swan(251, 258);
  pint(254, 7);
  house(249, 'cottage');
  pint(260, 9);
  pub(264, 'old-granary');

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(264);
}
