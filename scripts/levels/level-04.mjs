// Level 4: Wool → Wareham, ending at The Old Granary. Built by
// `npm run build:levels`.
//
// Golden late afternoon. Out of Wool across the heath, where the only way over
// the muddy tank trench is to ride on top of a tank from Bovington. Then the
// train, with broken glass on the roofs and a low bridge, into Wareham. Past
// the Kings Arms (scenery only) to the quay, where you cross the Frome on
// rowing boats, by way of a jetty, while swans guard both banks.
//
//   Wool (0–21) → the heath and the tank trench (23–57) → the train (59–104)
//   → Wareham station (107–128) → the town (129–152) → the quay and the river
//   (153–213) → The Old Granary (col 205)

export const meta = {
  id: 'level-04',
  cols: 214, // ~10.7 screens of 20 tiles
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

  // Wareham station (cols 107–128).
  platform(107, 128); // 2-tile gap at 105–106, down off the roof
  checkpoint(110, 'Wareham');
  sign(115, 'WAREHAM');
  canopy(113, 124, 4, [114, 124]);
  pint(112, 9);
  pint(118, 9);
  pint(122, 9);

  // The town (cols 129–152): the Kings Arms across the street (scenery).
  pavement(129, 162);
  lamp(130);
  pub(136, 'kings-arms', { scenery: true });
  house(142, 'terrace-red');
  glass(144);
  lamp(147);
  shop(150, 'GALLERY');
  pint(133, 9);
  pint(139, 9);
  pint(144, 7); // over the glass

  // The quay (cols 153–162), with a swan on the bank.
  swan(154, 159);
  pint(156, 7); // jump the swan for it

  // The Frome (cols 163–187): a boat, the jetty, another boat.
  river(163, 172);
  mover('boat', 164, 171, SURFACE, 0);
  [166, 169].forEach((c) => pint(c, 9)); // ride through them
  jetty(173, 175);
  pint(174, 9);
  river(176, 187);
  mover('boat', 177, 186, SURFACE, 1800);
  [179, 182, 185].forEach((c) => pint(c, 9));
  easel(183); // the easel, still floating in the Frome

  // The far bank (cols 188–213): another swan, then The Old Granary.
  pavement(188, 213);
  swan(192, 199);
  pint(195, 7);
  house(190, 'cottage');
  pint(201, 9);
  pub(205, 'old-granary');

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(205);
}
