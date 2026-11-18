// The v1 level: the whole crawl in one level, Dorchester to Parkstone. It
// stays in the game until the new six-level crawl replaces it (stage 1 of
// docs/vNext-delivery-plan.md). Built by `npm run build:levels`.
//
// Story: Dorchester (start) → Wool (checkpoint 1) → Wareham (checkpoint 2)
// → the Train Conductor's train (checkpoint 3 just before it; boss fight on the roof)
// → hop off at Parkstone → finish at The Avocet's door.

export const meta = {
  id: 'v1',
  cols: 198, // ~9.9 screens of 20 tiles
  properties: { title: 'The Lad Alarm Train Crawl', theme: 'day' }, // theme: THEMES in src/config.js
};

export default function build(L) {
  const { T, ROOF, set, platform, embankment, carriage, crates, canopy, river, spawn, checkpoint, finish, pint, espresso } = L;
  const { glass, bucket, boss, zone, secret, pub, sign, easel } = L;

  // Section 1 · Start: Dorchester (cols 0–53). Flat platform, a first small gap, a
  // first low crate, then the first train. No hazards.
  platform(0, 21);
  platform(24, 29); // 2-tile gap at 22–23
  crates(16, 9);
  pub(5, 'brewhouse');
  sign(13, 'DORCHESTER');
  spawn(8);
  [10, 11].forEach((c) => pint(c, 9));
  pint(16, 8);
  pint(22, 8);
  pint(23, 8);
  pint(26, 9);
  pint(27, 9);

  carriage(30, 10); // step up 2 tiles onto the roof
  carriage(42, 10); // 2-tile gap at 40–41
  pint(33, 7);
  pint(36, 7);
  pint(40, 6);
  pint(41, 6);
  pint(46, 7);
  pint(52, 8); // over the drop to Wool (gap 52–53)

  // Section 2 · Middle: Wool (checkpoint 1) → embankment (cols 54–123).
  platform(54, 75);
  checkpoint(56, 'Wool');
  sign(59, 'WOOL');
  pub(64, 'black-bear');
  pint(60, 9);
  bucket(67); // a fried-chicken bucket outside The Black Bear
  pint(67, 7);
  // Secret: the espresso martini sits on a ledge tucked up in the station
  // canopy, up and to the LEFT of the crate stair. The only way up is to turn
  // back from the top crate (col 74, 2 tiles below the ledge), so it's never
  // collected just by running the course.
  crates(72, 9);
  crates(73, 8);
  crates(74, 6);
  crates(75, 8); // also the step onto the next train
  set('ground', 71, 4, T.crate); // the hidden ledge (floating)
  canopy(69, 76, 4, [70, 76]);
  espresso(71, 3);
  secret(69, 76, 2, 9);
  pint(72, 8);
  pint(73, 7);

  carriage(76, 10);
  carriage(89, 10); // 3-tile gap at 86–88
  glass(93, ROOF);
  carriage(101, 10); // 2-tile gap at 99–100
  pint(79, 7);
  pint(86, 6);
  pint(87, 5);
  pint(88, 6);
  pint(93, 5);
  pint(99, 6);
  pint(100, 6);

  embankment(113, 121); // 2-tile gap at 111–112
  crates(114, 9);
  crates(115, 8);
  crates(116, 9);
  pint(115, 7); // then a 5-tile run-up to the gap

  // Section 3 · End: Wareham (checkpoint 2) → river → last train → the
  // Conductor's train (boss) → Parkstone (cols 124–197).
  platform(124, 137); // 2-tile gap at 122–123
  checkpoint(126, 'Wareham');
  sign(129, 'WAREHAM');
  pub(133, 'old-granary');
  pint(128, 9);

  river(138, 140); // 3-tile river gap
  easel(139);
  pint(139, 7);
  embankment(141, 142);
  carriage(143, 9);
  glass(147, ROOF);
  pint(147, 5);
  pint(150, 7);
  pint(152, 6); // 2-tile gap at 152–153

  // Lineside embankment: respawn point for the boss fight.
  embankment(154, 157);
  checkpoint(156, 'Boss train');
  pint(155, 9);

  // Boss arena: the Train Conductor's own train, two coupled carriages one
  // screen long (cols 158–177). The fight is on the roof: the camera locks to
  // it, walls close on both sides, and the hills race past while it's on.
  carriage(158, 10);
  carriage(168, 10);
  zone('end-zone', 158, 177);
  boss(175, 'conductor', ROOF);

  // Parkstone: hop off the train and into The Avocet. The finish is the pub's
  // front door (same column as the pub). Col 190 keeps it clear of the jump
  // button when the camera stops at the end of the level.
  platform(178, 197);
  sign(182, 'PARKSTONE');
  pint(181, 9);
  pub(190, 'avocet');
  finish(190);
}
