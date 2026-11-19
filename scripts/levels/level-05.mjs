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
//   Wareham (0–21) → the departing train (23–95, auto-scroll 24–104)
//   → Holton Heath (98–109) → one carriage (113–122) → Poole station (125–144)
//   → the high street, awnings and rooftops (145–180) → the quay (181–192)
//   → the harbour and the ferry (193–206) → The Rising Sun (col 222)

export const meta = {
  id: 'level-05',
  cols: 231, // ~11.6 screens of 20 tiles
  properties: { title: 'Wareham to Poole', theme: 'stormy', weather: 'rain' }, // THEMES in src/config.js; weather: src/systems/Weather.js
};

export default function build(L) {
  const { T, ROOF, SURFACE, set, platform, pavement, bridge, embankment, carriage, canopy, river, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, mover, gull, awning, autoscroll, yacht } = L;
  const { pub, sign, house, shop, lamp } = L;

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

  // The departing train (cols 23–95). From col 24 the camera scrolls on by
  // itself until its right edge reaches col 104 (AUTOSCROLL): keep up.
  autoscroll(24, 104);
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

  // Holton Heath (cols 98–109): drop off onto the embankment.
  embankment(98, 109); // 2-tile gap at 96–97
  checkpoint(106, 'Holton Heath');
  [100, 102].forEach((c) => pint(c, 9));

  // One more carriage (cols 113–122): a 3-tile gap and a step up onto it.
  carriage(113, 10);
  [110, 111, 112].forEach((c) => pint(c, 7));
  luggage(117, 6);
  luggage(118, 7);
  pint(117, 4);

  // Poole station (cols 125–144).
  platform(125, 144); // 2-tile gap at 123–124, down off the roof
  checkpoint(128, 'Poole');
  sign(133, 'POOLE');
  canopy(130, 141, 4, [131, 141]);
  [136, 139].forEach((c) => pint(c, 9));

  // Poole high street (cols 145–180). Each striped awning is bouncy: land on
  // it and it throws you up onto the rooftops (the high road, with the pints).
  pavement(145, 192);
  lamp(146);
  shop(150, 'GIFTS');
  awning(148, 152, 8);
  house(155, 'terrace-blue');
  house(159, 'terrace-cream');
  L.roof(154, 161, 5);
  [154, 156, 158, 160, 161].forEach((c) => pint(c, 4));
  lamp(163); // in the alley
  shop(166, 'CHANDLERY');
  awning(164, 168, 8);
  // The martini: high over the alley, only reached by a bounce off the
  // chandlery's awning, drifting back to the left at the top.
  espresso(163, 1);
  house(171, 'terrace-red');
  shop(175, 'ICE CREAM');
  L.roof(170, 177, 5);
  [170, 172, 174, 176].forEach((c) => pint(c, 4));
  pint(162, 9); // the low road
  pint(178, 9);
  house(180, 'cottage');

  // The quay (cols 181–192): a gull swoops along it.
  gull(183, 190);
  pint(181, 9);

  // The harbour (cols 193–206): the chain ferry across.
  river(193, 206);
  yacht(199);
  mover('ferry', 194, 205, SURFACE);
  [197, 200, 203].forEach((c) => pint(c, 9)); // ride through them

  // The far quay (cols 207–230): another gull, then The Rising Sun.
  pavement(207, 230);
  gull(210, 216, SURFACE, 1800);
  lamp(218);
  pint(219, 9);
  pub(222, 'rising-sun');

  // The finish is the pub door (same column), 8 tiles from the end.
  finish(222);
}
