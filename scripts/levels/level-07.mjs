// Level 7: Brownsea Island, from the quay to the castle. Built by
// `npm run build:levels`.
//
// Dusk on Brownsea. Up from the quay through the pine woods, where the
// branches are the high road and red squirrels scamper below (land on one
// and it's off), past the peacocks (deadly to touch, they won't be stomped)
// and the prickly gorse. Across the lagoon on the boardwalk, with loose
// planks over the gaps and a gull along it. Over the heath, then up to
// Brownsea Castle's gate.
//
//   the quay (0–20) → the pine woods (21–60) → the lagoon boardwalk (61–99)
//   → the heath (100–150) → the castle approach (151–184),
//   Brownsea Castle at col 176

export const meta = {
  id: 'level-07',
  cols: 185, // ~9.3 screens of 20 tiles
  properties: { title: 'Brownsea Island', theme: 'island' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, set, embankment, river, jetty, crumble, pine } = L;
  const { spawn, checkpoint, finish, pint, espresso, gull, peacock, squirrel, gorse, pub, sign, lamp } = L;

  // The quay (cols 0–20).
  embankment(0, 60);
  spawn(6);
  sign(12, 'BROWNSEA ISLAND');
  lamp(17);
  [9, 15, 19].forEach((c) => pint(c, 9));

  // The pine woods (cols 21–60). Branches are the high road (row 4); the low
  // ones (rows 6–8) only where nothing on the ground needs jumping, so the
  // jumps down there are never cut short. Squirrels and gorse below, a peacock.
  pine(22, 2, [[21, 23, 8], [24, 25, 6]]);
  pine(29, 2, [[27, 30, 4]]);
  pine(34, 2, [[32, 35, 4]]);
  pine(38, 2, [[37, 39, 4]]);
  pine(43, 2, [[41, 44, 4]]);
  pine(48, 2, [[46, 49, 4]]);
  pine(54, 2, [[52, 55, 4]]);
  pine(58, 2, [[57, 59, 4]]);
  [22, 24, 28, 33, 38, 42, 47, 53, 58].forEach((c) => pint(c, c === 22 ? 7 : c === 24 ? 5 : 3));
  // The martini: on a crate up and to the LEFT of a branch, out in the sky.
  set('ground', 31, 2, T.crate);
  espresso(31, 1);
  squirrel(27, 33);
  gorse(37);
  pint(37, 8);
  peacock(41, 48);
  squirrel(51, 58);

  // The lagoon (cols 61–99): the boardwalk over the water, loose planks over
  // the gaps, a gull along the long stretch.
  river(61, 98);
  jetty(61, 67);
  checkpoint(63, 'Lagoon');
  // Gap 68–72: 1-tile gap, loose planks at 69–71, 1-tile gap.
  [69, 70, 71].forEach((c) => {
    crumble(c);
    pint(c, 8);
  });
  jetty(73, 86);
  gull(76, 83);
  [74, 79, 85].forEach((c) => pint(c, 9));
  // Gap 87–89, then a short stretch and one loose plank.
  [87, 88, 89].forEach((c) => pint(c, 7));
  jetty(90, 95);
  pint(93, 9);
  crumble(97); // 1-tile gaps at 96 and 98
  pint(97, 8);

  // The heath (cols 99–150): gorse, a squirrel, two peacocks, and a high
  // road of pine branches (row 5) over them, in from a low branch at 115.
  embankment(99, 184);
  checkpoint(102, 'Heath');
  gorse(107);
  pint(107, 7);
  squirrel(105, 112);
  pine(116, 4, [[115, 117, 8], [118, 119, 6]]);
  pine(122, 2, [[121, 124, 5]]);
  pine(127, 2, [[126, 129, 5]]);
  pine(132, 2, [[131, 134, 5]]);
  pine(137, 2, [[136, 139, 5]]);
  pine(142, 2, [[141, 144, 5]]);
  pine(147, 2, [[146, 148, 5]]);
  [116, 119, 122, 127, 132, 137, 142, 147].forEach((c) => pint(c, c === 116 ? 7 : c === 119 ? 5 : 4));
  peacock(121, 128);
  gorse(133);
  pint(133, 8);
  peacock(137, 145);
  gorse(150);

  // The castle approach (cols 151–184): a last squirrel, then the gate.
  lamp(153);
  squirrel(156, 164);
  [158, 162].forEach((c) => pint(c, 7));
  lamp(168);
  pint(171, 9);

  // Brownsea Castle. The finish is its gate (same column), 8 tiles from the end.
  pub(176, 'brownsea-castle');
  finish(176);
}
