// Level 8: Parkstone, from The Avocet to the kebab shop. Built by
// `npm run build:levels`.
//
// Closing time. Out of The Avocet with a megaphone someone left on the step,
// through Parkstone's streets to Parkstone Kebabs before it shuts. Foxes dart
// about the bins, wheelie bins roll down the pavement, cars pull out of the
// side roads, and bouncers step out of the clubs to block the way. Shout at
// them (MEGAPHONE in config.js): foxes and bins are blown away, bouncers
// stunned. The bouncer outside The Vault won't move for anything else. In
// before the shutters come down and the time comes off; late, and it costs.
//
//   outside The Avocet, the megaphone (0–23) → Ashley Road: foxes, bins, the
//   rooftops (24–59) → a side road (61–64) → the clubs (65–110) → a side road
//   (112–115) → Ashley Cross and The Vault (116–169) → a side road (171–174)
//   → the kebab row (175–214), Parkstone Kebabs at col 206

export const meta = {
  id: 'level-08',
  cols: 215, // ~10.8 screens of 20 tiles
  properties: { title: 'Parkstone to the Kebab Shop', theme: 'night', closingMs: 55000 }, // closingMs: CLOSING in src/config.js
};

export default function build(L) {
  const { T, set, pavement, crates, roof } = L;
  const { spawn, checkpoint, finish, pint, espresso, pub, house, shop, lamp } = L;
  const { megaphone, fox, bins, bouncer, traffic } = L;

  // Outside The Avocet (cols 0–23). The megaphone's on the step.
  pavement(0, 214);
  pub(4, 'avocet', { scenery: true });
  spawn(9);
  lamp(12);
  megaphone(15);
  [11, 18, 21].forEach((c) => pint(c, 9));

  // Ashley Road (cols 24–59): a fox, a crate stair up to the rooftops, a
  // second fox under them, and a bin store sending bins down the pavement.
  house(26, 'terrace-red');
  fox(27, 35);
  house(30, 'terrace-cream');
  lamp(37);
  [28, 32, 36].forEach((c) => pint(c, 7)); // over the fox's run
  crates(39, 9);
  crates(40, 8);
  crates(41, 7);
  pint(40, 7);
  pint(41, 6);
  house(45, 'terrace-blue');
  house(49, 'cottage');
  house(53, 'terrace-red');
  roof(43, 54, 5);
  set('ground', 48, 4, T.crate); // a tall chimney
  set('ground', 48, 3, T.crate);
  [44, 46, 50, 52, 54].forEach((c) => pint(c, 4));
  pint(48, 2);
  // The martini: on a crate floating up and to the LEFT of the chimney.
  set('ground', 46, 2, T.crate);
  espresso(46, 1);
  fox(44, 52, 500);
  bins(57, -1, 2600); // rolls left down to the crate stair
  lamp(58);

  // A side road (cols 61–64): wait for the green man.
  traffic(61, 64);
  pint(63, 7);

  // The clubs (cols 65–110): two bouncers stepping in and out, a fox between
  // them, a crate, and another bin store.
  checkpoint(67, 'Penn Hill');
  lamp(70);
  shop(76, 'NITE CLUB');
  bouncer(78, 'cycle');
  [74, 81].forEach((c) => pint(c, 9));
  fox(83, 89, 300);
  [84, 86, 88].forEach((c) => pint(c, 7));
  shop(94, 'LATE BAR');
  bouncer(96, 'cycle', 1100);
  pint(99, 9);
  crates(101, 9);
  pint(101, 7);
  pint(104, 9);
  bins(109, -1, 2400, 800); // rolls left down to the crate
  lamp(107);

  // A side road (cols 112–115), out of step with the first.
  traffic(112, 115, 1700);
  pint(114, 7);

  // Ashley Cross (cols 116–169). The Vault's bouncer won't budge: shout at
  // him. Then foxes round the bins, and a crate breaking up a bin lane.
  checkpoint(118, 'Ashley Cross');
  lamp(121);
  shop(127, 'THE VAULT');
  bouncer(130, 'stand');
  [125, 133, 136].forEach((c) => pint(c, 9));
  house(140, 'terrace-cream');
  fox(138, 146, 200);
  [139, 142, 145].forEach((c) => pint(c, 7));
  house(144, 'terrace-blue');
  lamp(149);
  crates(151, 9);
  pint(151, 7);
  shop(156, 'TAXIS');
  fox(155, 161, 700);
  [155, 158, 161].forEach((c) => pint(c, 7));
  bins(167, -1, 2200, 400); // rolls left down to the crate
  lamp(166);

  // A side road (cols 171–174).
  traffic(171, 174, 900);
  pint(173, 7);

  // The kebab row (cols 175–214): one last fox and the shop.
  lamp(177);
  shop(183, 'OFF LICENCE');
  fox(180, 192, 400);
  [182, 186, 190].forEach((c) => pint(c, 7));
  house(196, 'terrace-red');
  lamp(200);
  pint(201, 9);

  // Parkstone Kebabs. The finish is its door (same column), 8 tiles from the end.
  pub(206, 'kebab-shop');
  finish(206);
  lamp(212);
}
