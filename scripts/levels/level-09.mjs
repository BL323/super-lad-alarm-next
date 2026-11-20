// Level 9: inside The Avocet, from the front door to the bar. Built by
// `npm run build:levels`.
//
// The crawl's last pint is at the bar, and the landlord isn't serving. Inside
// the pub the tables are the high road: the regulars at the back tables throw
// glasses, crisps and darts at you on the floor, but can't reach the tables.
// Dogs trot about between them (land on one and it bolts). In the snug the
// cellar hatches are open, with wobbly stools over them, and the beams are
// low. Then the landlord's fight in front of the bar (LANDLORD in config.js):
// soak him with the beer pumps, kick his barrels back, then ring last orders
// and drop him through the cellar hatch.
//
//   the front room (0–21) → the lounge (22–66) → the snug, open cellar
//   hatches (67–102) → the games room (103–152) → the bar (153–157)
//   → the landlord's arena (158–177) → the bar hatch (col 181)

export const meta = {
  id: 'level-09',
  cols: 190, // 9.5 screens of 20 tiles
  properties: { title: 'Inside The Avocet', theme: 'pub' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { ROOF, floor, hole, table, kegs, beam, shelf, crumble } = L;
  const { spawn, checkpoint, finish, pint, espresso, glass, boss, zone, local, dog, pubDecor, bar, barHatch } = L;
  const { pump, bell, lever, hatch } = L;

  const ON_TABLE = ROOF - 1; // pints sitting on a table top (row 8)

  // The front room (cols 0–21): in through the door, by the fire.
  floor(0, 66);
  spawn(7);
  pubDecor('sconce', 3);
  pubDecor('picture', 6, { design: 0 });
  pubDecor('sconce', 10);
  pubDecor('fireplace', 13);
  [5, 9].forEach((c) => pint(c, 9));
  // The martini: on the shelf over the fireplace. Climb the kegs, then turn
  // back and jump up-left onto the shelf.
  kegs(17, 8);
  shelf(13, 14, 6);
  espresso(13, 5);
  pint(17, 6);
  pubDecor('picture', 20, { design: 1 });

  // The lounge (cols 22–66): the regulars at the back tables throw glasses
  // at you on the floor (16 tiles either way); up on the tables you're safe.
  // A dog trots between the tables.
  local(34, 'glass');
  local(50, 'glass', 500);
  pubDecor('local', 42); // a calm one, just drinking
  table(24, 26);
  table(30, 32);
  table(37, 40);
  table(52, 54);
  table(59, 61);
  [24, 26, 31, 38, 40, 53, 60].forEach((c) => pint(c, ON_TABLE));
  pint(46, 6); // over the dog: jump for it
  [28, 35, 43, 50, 57].forEach((c) => pint(c, 9)); // on the floor, under fire
  dog(42, 50);
  glass(57); // a dropped pint (clear of the table, so you can jump it)
  pubDecor('sconce', 28);
  pubDecor('picture', 44, { design: 2 });
  pubDecor('sconce', 58);

  // The snug (cols 67–102): open cellar hatches in the floor, wobbly stools
  // over the widest, and low beams (short hops under them).
  checkpoint(69, 'The snug');
  floor(67, 74);
  hole(75, 77); // a 3-tile hatch
  [75, 76, 77].forEach((c) => pint(c, 6));
  floor(78, 85);
  beam(81, 88, 7);
  hole(86, 86); // a 1-tile hatch under the beam: a short hop
  [82, 84, 86, 88].forEach((c) => pint(c, 8));
  floor(87, 92);
  // Hatch 93–97: 1-tile gap, three wobbly stools (93 is open), 1-tile gap.
  hole(93, 97);
  [94, 95, 96].forEach((c) => {
    crumble(c);
    pint(c, 8);
  });
  floor(98, 157);
  pubDecor('sconce', 79);
  pubDecor('sconce', 91);
  pubDecor('picture', 100, { design: 0 });

  // The games room (cols 103–152): a dartboard corner, the pool table, a
  // regular with a bag of crisps, and a second dog.
  pubDecor('dartboard', 113);
  local(116, 'darts');
  table(119, 124, ROOF, 'pool');
  [119, 121, 123, 124].forEach((c) => pint(c, ON_TABLE));
  dog(126, 137);
  local(138, 'crisps', 400);
  table(140, 142);
  table(146, 148);
  [141, 147].forEach((c) => pint(c, ON_TABLE));
  pint(129, 6); // over the dog
  [110, 126, 134, 144].forEach((c) => pint(c, 9));
  glass(133);
  pubDecor('sconce', 108);
  pubDecor('picture', 132, { design: 1 });
  pubDecor('sconce', 150);

  // The bar (cols 153–157): the last checkpoint, the respawn point for the fight.
  checkpoint(155, 'The bar');
  pint(153, 9);

  // The landlord's arena (cols 158–177): the bar along the back, three beer
  // pumps on it, the last orders bell, the cellar lever and the hatch in
  // front of his till. No pints in here.
  floor(158, 189);
  bar(158, 189);
  zone('end-zone', 158, 177);
  boss(175, 'landlord', L.SURFACE, 'landlord');
  pump(161);
  pump(166);
  pump(173);
  bell(163, 6);
  lever(177, 7);
  hatch(169, 171);

  // The bar hatch (col 181): the finish, once he's gone down the cellar.
  barHatch(181, 'avocet');
  finish(181);
}
