// Level 6: Poole Quay → Brownsea Island, by water. Built by
// `npm run build:levels`.
//
// Sunset over Poole Harbour. Off the quay onto the Brownsea ferry: run its
// deck while waves break over the rail (WAVES), a gull swoops along it, and
// the wheelhouse roof is the high road. Off the stern, hop a moored yacht
// (a rowing-boat mover), the bobbing buoys (the harbour's crumbling crates)
// and a pontoon, ride the little chain ferry over the last stretch, and walk
// up Brownsea's pier to the quay.
//
//   Poole Quay (0–21) → the jetty (22–27) → the Brownsea ferry (28–105)
//   → a yacht and the buoys (106–124) → a pontoon (125–129) → the chain
//   ferry (130–143) → Brownsea pier (144–159) → the quay (160–186),
//   Brownsea Quay at col 178

export const meta = {
  id: 'level-06',
  cols: 187, // ~9.4 screens of 20 tiles
  properties: { title: 'Poole Quay to Brownsea', theme: 'sunset' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, SURFACE, set, pavement, embankment, river, jetty, crumble, mover, ferryHull, cabin } = L;
  const { spawn, checkpoint, finish, pint, espresso, gull, wave, peacock, pub, sign, lamp, yacht } = L;

  /** Deck boxes and luggage on the ferry at `col`, up to `topRow`. */
  const boxes = (col, topRow) => {
    for (let r = topRow; r < ROOF; r++) set('ground', col, r, T.crate);
  };

  // Poole Quay (cols 0–21), where the Brownsea boats leave.
  pavement(0, 21);
  lamp(4);
  spawn(7);
  sign(14, 'POOLE QUAY');
  lamp(18);
  [10, 12, 16, 20].forEach((c) => pint(c, 9));

  // The jetty (cols 22–27) out to the ferry.
  jetty(22, 27);
  pint(25, 9);

  // The Brownsea ferry (cols 28–105). Step up onto the deck; the wheelhouse
  // roof is the high road; waves break over the rail in two places, and a
  // gull swoops along the foredeck.
  ferryHull(28, 105);
  boxes(34, 7);
  pint(34, 6);
  [30, 37, 40].forEach((c) => pint(c, 7));
  boxes(42, 6); // up onto the wheelhouse roof
  cabin(44, 58, 5);
  [45, 47, 49, 51, 53, 55, 57].forEach((c) => pint(c, 4));
  // The martini: on a box on the wheelhouse roof's mast, up and to the LEFT.
  set('ground', 46, 3, T.crate);
  espresso(46, 2);
  [48, 54].forEach((c) => pint(c, 7)); // under the roof
  wave(62, 66);
  [62, 64, 66].forEach((c) => pint(c, 7));
  gull(70, 77, ROOF);
  wave(80, 84, 1700);
  [81, 84].forEach((c) => pint(c, 7));
  checkpoint(90, 'Ferry', ROOF);
  boxes(96, 7);
  pint(96, 6);
  [93, 100, 103].forEach((c) => pint(c, 7));

  // Off the stern: a moored yacht's tender, then the buoys (cols 106–125).
  river(106, 143);
  yacht(112);
  mover('boat', 107, 118, SURFACE);
  [109, 113, 117].forEach((c) => pint(c, 9));
  // Four buoys in a row (120–123), water either side: a full jump off the
  // tender lands on the last one, a hop on the first.
  [120, 121, 122, 123].forEach((c) => {
    crumble(c);
    pint(c, 8);
  });

  // A pontoon (cols 125–129), then the little chain ferry over the last stretch.
  jetty(125, 129);
  pint(128, 9);
  mover('ferry', 130, 143, SURFACE, 1200);
  [133, 137, 141].forEach((c) => pint(c, 9));

  // Brownsea pier (cols 144–159): a gull, then the island.
  jetty(144, 159);
  checkpoint(146, 'Brownsea Pier');
  gull(150, 157);
  [148, 158].forEach((c) => pint(c, 9));

  // Brownsea's quay (cols 160–186): a peacock to meet you.
  embankment(160, 186);
  sign(163, 'BROWNSEA ISLAND');
  peacock(166, 172);
  pint(169, 7); // jump the peacock for it
  [175, 182].forEach((c) => pint(c, 9));
  lamp(174);

  // Brownsea Quay. The finish is its door (same column), 8 tiles from the end.
  pub(178, 'brownsea-quay');
  finish(178);
}
