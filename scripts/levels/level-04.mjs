// Level 4: Wool → Wareham, ending at The Old Granary. Built by
// `npm run build:levels`.
//
// Golden late afternoon. Out of Wool across the heath, where the only way over
// the muddy tank trench is to ride on top of a tank from Bovington. Then the
// train, with broken glass on the roofs and a low bridge, into Wareham. Past
// the Kings Arms (scenery only) to the quay, where you cross the Frome on
// rowing boats, by way of a jetty, while swans guard both banks.
//
//   Wool (0–21) → the heath and the tank trench (23–57) → the train (59–129)
//   → Wareham station (132–153) → the town (154–177) → the quay and the river
//   (178–238) → The Old Granary (col 230)

export const meta = {
  id: 'level-04',
  cols: 239, // ~12 screens of 20 tiles
  properties: { title: 'Wool to Wareham', theme: 'golden' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, SURFACE, set, platform, pavement, bridge, embankment, carriage, crates, canopy, river, trench, jetty } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, mover, swan, pub, sign, house, shop, lamp, easel } = L;

  // Wool (cols 0–21): the platform after The Black Bear.
  platform(0, 21);
  canopy(2, 11, 4, [3, 11]);
  sign(15, 'WOOL');
  spawn(7);
  [9, 11].forEach((c) => pint(c, 9));
  crates(19, 9);
  pint(19, 7);

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

  // The train (cols 59–104): glass on the roofs and a low bridge.
  carriage(59, 10); // 1-tile gap at 58, step up onto the roof
  glass(64, ROOF);
  pint(62, 7);
  pint(64, 5);
  pint(67, 7);
  pint(69, 6);
  pint(70, 6);
  carriage(71, 10); // 2-tile gap at 69–70
  bridge(74, 78, 5); // short hops under it
  [74, 76, 78].forEach((c) => pint(c, 7));
  carriage(83, 10); // 2-tile gap at 81–82
  glass(88, ROOF);
  pint(85, 7);
  pint(88, 5);
  pint(91, 7);
  carriage(95, 10); // 2-tile gap at 93–94
  glass(99, ROOF);
  pint(97, 7);
  pint(99, 5);
  pint(102, 7);

  // The last two carriages (cols 105–129): a 3-tile gap, glass, a 2-tile
  // gap and a low bridge.
  [105, 106, 107].forEach((c) => pint(c, 6)); // over the 3-tile gap at 105–107
  carriage(108, 10);
  glass(112, ROOF);
  pint(110, 7);
  pint(112, 5);
  pint(115, 7);
  carriage(120, 10); // 2-tile gap at 118–119
  [118, 119].forEach((c) => pint(c, 6));
  bridge(122, 127, 5);
  [122, 124, 126].forEach((c) => pint(c, 7)); // short hops under the bridge

  // Wareham station (cols 132–153).
  platform(132, 153); // 2-tile gap at 130–131, down off the roof
  checkpoint(135, 'Wareham');
  sign(140, 'WAREHAM');
  canopy(138, 149, 4, [139, 149]);
  pint(137, 9);
  pint(143, 9);
  pint(147, 9);

  // The town (cols 154–177): the Kings Arms across the street (scenery).
  pavement(154, 187);
  lamp(155);
  pub(161, 'kings-arms', { scenery: true });
  house(167, 'terrace-red');
  glass(169);
  lamp(172);
  shop(175, 'GALLERY');
  pint(158, 9);
  pint(164, 9);
  pint(169, 7); // over the glass

  // The quay (cols 178–187), with a swan on the bank.
  swan(179, 184);
  pint(181, 7); // jump the swan for it

  // The Frome (cols 188–212): a boat, the jetty, another boat.
  river(188, 197);
  mover('boat', 189, 196, SURFACE, 0);
  [191, 194].forEach((c) => pint(c, 9)); // ride through them
  jetty(198, 200);
  pint(199, 9);
  river(201, 212);
  mover('boat', 202, 211, SURFACE, 1800);
  [204, 207, 210].forEach((c) => pint(c, 9));
  easel(208); // the easel, still floating in the Frome

  // The far bank (cols 213–238): another swan, then The Old Granary.
  pavement(213, 238);
  swan(217, 224);
  pint(220, 7);
  house(215, 'cottage');
  pint(226, 9);
  pub(230, 'old-granary');

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(230);
}
