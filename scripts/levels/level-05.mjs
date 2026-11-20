// Level 5: Wareham → Poole, ending at The Rising Sun. Built by
// `npm run build:levels`.
//
// A rainy dusk and the hardest platforming of the crawl. The train is pulling
// out of Wareham as you board: the camera scrolls on by itself over a long run
// of roofs with wide gaps, luggage piled at mixed heights and a low bridge, and
// if you drop off the left of the screen you've missed it. Then Holton Heath,
// one more carriage and Poole station. On Poole high street the shop awnings
// are bouncy, the way up onto the rooftops; on the quay the seagulls swoop;
// the chain ferry takes you over the harbour to The Rising Sun.
//
//   Wareham (0–21) → the departing train (23–121, auto-scroll 24–130)
//   → Holton Heath (124–136) → one carriage (139–148) → Poole station (151–170)
//   → the high street, awnings and rooftops (171–213) → the quay (214–225)
//   → the harbour and the ferry (226–239) → the giant gull's fight on the far
//   quay (246–265) → The Rising Sun (col 273)

export const meta = {
  id: 'level-05',
  cols: 282, // ~14.1 screens of 20 tiles
  properties: { title: 'Wareham to Poole', theme: 'stormy', weather: 'rain' }, // THEMES in src/config.js; weather: src/systems/Weather.js
};

export default function build(L) {
  const { T, ROOF, SURFACE, set, platform, pavement, bridge, embankment, carriage, canopy, river, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, mover, gull, awning, autoscroll, yacht } = L;
  const { pub, sign, house, shop, lamp, boss, zone } = L;

  /** Luggage piled on a carriage roof at `col`, up to `topRow`. */
  const luggage = (col, topRow) => {
    for (let r = topRow; r < ROOF; r++) set('ground', col, r, T.crate);
  };

  // Wareham (cols 0–21): the platform, with the train already moving off.
  platform(0, 21);
  canopy(2, 11, 4, [3, 11]);
  sign(15, 'WAREHAM');
  spawn(7);
  [9, 11, 13].forEach((c) => pint(c, 9));

  // The departing train (cols 23–121). From col 24 the camera scrolls on by
  // itself until its right edge reaches col 130 (AUTOSCROLL): keep up.
  autoscroll(24, 130);
  carriage(23, 10); // 1-tile gap at 22, step up onto the roof
  [26, 29].forEach((c) => pint(c, 7));
  carriage(36, 10); // 3-tile gap at 33–35
  [33, 34, 35].forEach((c) => pint(c, 6));
  luggage(38, 7);
  pint(38, 5);
  glass(44, ROOF);
  pint(44, 5);
  carriage(48, 10); // 2-tile gap at 46–47
  luggage(51, 6);
  luggage(52, 6);
  [51, 52].forEach((c) => pint(c, 4));
  carriage(61, 10); // 3-tile gap at 58–60
  [58, 59, 60].forEach((c) => pint(c, 6));
  glass(65, ROOF);
  pint(65, 5);
  // Gap 71–73: one crumbling crate in the middle.
  crumble(72, ROOF);
  pint(72, 6);
  carriage(74, 10);
  bridge(77, 81, 5); // short hops under it
  [77, 79, 81].forEach((c) => pint(c, 7));
  carriage(86, 10); // 2-tile gap at 84–85
  luggage(90, 7);
  pint(90, 5);
  pint(93, 7);

  // Two more carriages, still scrolling (cols 96–121): another 3-tile gap,
  // glass before the luggage, a single crumbling crate, then a low bridge.
  [96, 97, 98].forEach((c) => pint(c, 6)); // over the 3-tile gap at 96–98
  carriage(99, 10);
  glass(102, ROOF);
  pint(102, 5);
  luggage(105, 6);
  pint(105, 4);
  // Gap 109–111: one crumbling crate in the middle.
  crumble(110, ROOF);
  pint(110, 6);
  carriage(112, 10);
  bridge(114, 119, 5);
  [114, 116, 118].forEach((c) => pint(c, 7)); // short hops under the bridge

  // Holton Heath (cols 124–136): drop off onto the embankment.
  embankment(124, 136); // 2-tile gap at 122–123
  checkpoint(132, 'Holton Heath');
  [126, 128].forEach((c) => pint(c, 9));

  // One more carriage (cols 139–148): a 2-tile gap and a step up onto it.
  carriage(139, 10);
  pint(136, 9);
  [137, 138].forEach((c) => pint(c, 7));
  luggage(143, 6);
  luggage(144, 7);
  pint(143, 4);

  // Poole station (cols 151–170).
  platform(151, 170); // 2-tile gap at 149–150, down off the roof
  checkpoint(154, 'Poole');
  sign(159, 'POOLE');
  canopy(156, 167, 4, [157, 167]);
  [162, 165].forEach((c) => pint(c, 9));

  // Poole high street (cols 171–213). Each striped awning is bouncy: land on
  // it and it throws you up onto the rooftops (the high road, with the pints).
  pavement(171, 225);
  lamp(172);
  shop(176, 'GIFTS');
  awning(174, 178, 8);
  house(181, 'terrace-blue');
  house(185, 'terrace-cream');
  L.roof(180, 187, 5);
  set('ground', 184, 4, T.crate); // chimney
  [180, 182, 186, 187].forEach((c) => pint(c, 4));
  pint(184, 3);
  lamp(189); // in the alley
  shop(192, 'CHANDLERY');
  awning(190, 194, 8);
  // The martini: high over the alley, only reached by a bounce off the
  // chandlery's awning, drifting back to the left at the top.
  espresso(189, 1);
  house(197, 'terrace-red');
  shop(201, 'ICE CREAM');
  L.roof(196, 203, 5);
  set('ground', 199, 4, T.crate); // a tall chimney
  set('ground', 199, 3, T.crate);
  [196, 198, 201, 202, 203].forEach((c) => pint(c, 4));
  pint(199, 2);
  // A third run of roofs over a 2-tile alley, with no awning: only from the
  // roofs before it. Another tall chimney.
  house(208, 'cottage');
  house(212, 'terrace-blue');
  L.roof(206, 213, 5);
  set('ground', 210, 4, T.crate);
  set('ground', 210, 3, T.crate);
  [204, 205, 207, 209, 212, 213].forEach((c) => pint(c, 4));
  pint(210, 2);
  pint(188, 9); // the low road
  pint(204, 9);
  pint(211, 9);

  // The quay (cols 214–225): a gull swoops along it.
  gull(216, 223);
  pint(214, 9);

  // The harbour (cols 226–239): the chain ferry across.
  river(226, 239);
  yacht(232);
  mover('ferry', 227, 238, SURFACE);
  [230, 233, 236].forEach((c) => pint(c, 9)); // ride through them

  // The far quay (cols 240–281): the giant herring gull's fight in front of
  // three shops, then The Rising Sun. Its arena (cols 246–265) has a bouncy
  // awning on each shop: bounce up into the gull while it hovers (GULL_BOSS).
  pavement(240, 281);
  checkpoint(242, 'Poole Quay');
  pint(241, 9);
  zone('end-zone', 246, 265);
  shop(249, 'CHIPS');
  awning(247, 251, 8);
  shop(256, 'ROCK SHOP');
  awning(254, 258, 8);
  shop(262, 'BOAT TRIPS');
  awning(260, 264, 8);
  boss(256, 'gull', SURFACE, 'gull');
  lamp(267);
  [268, 270].forEach((c) => pint(c, 9));
  pub(273, 'rising-sun');

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(273);
}
