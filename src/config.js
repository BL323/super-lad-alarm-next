// Central tuning and constants. Every tunable number lives here.

export const GAME_TITLE = 'Super Lad Alarm';

// URL flags for testing: ?debug shows physics bodies and player state (dev
// builds only); ?touch forces the on-screen buttons on a non-touch device.
// Safe to import from Node too (the level builders and validator read the
// jump and crossing numbers from here), where there's no window or Vite env.
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
export const DEBUG = !!import.meta.env?.DEV && params.has('debug');
export const FORCE_TOUCH = params.has('touch');

// Logical resolution and tile size. The height is fixed; the width follows the
// screen's shape between GAME_WIDTH (16:9) and MAX_GAME_WIDTH (20:9), so wide
// phones see more of the level instead of black side bars. Read the current
// width from `scene.scale.width`; GAME_WIDTH is only the narrowest view.
export const GAME_WIDTH = 320;
export const MAX_GAME_WIDTH = 400;
export const GAME_HEIGHT = 180;
export const TILE_SIZE = 16;

// Scaling: Phaser FIT inside a frame snapped to an integer multiple of the
// game size whenever at least 1x fits (see src/systems/Scaling.js). On touch
// devices `fillOnTouch` drops the snapping and uses the largest scale that
// fits: phone screens are dense enough that uneven pixels are hard to see, and
// the whole-step snap can waste a third of the screen.
export const SCALING = {
  integer: true,
  fillOnTouch: true,
};

// Menu full-screen controls (src/systems/fullscreen.js). The button sits at the bottom right,
// `x` px in from the right edge; the iPhone Home Screen hint sits under the
// pint rule text.
export const MENU_FULLSCREEN = {
  button: { x: 46, y: 140, width: 76 },
  hintY: 128,
};

// Arcade physics. One shared gravity value.
export const PHYSICS = {
  gravity: 900, // px/s²
  debug: DEBUG,
};

// Player movement tuning (wired up in stage 2). Values are copied onto
// `player.stats` per instance so upgrades can change them at runtime.
//
// Derived limits (keep in sync with level rules in the brief, section 6):
//   max jump height   = v² / 2g        = 300² / (2·900) = 50 px  (~3 tiles)
//   time to apex      = v / g          = 300 / 900      = 0.333 s
//   air time (flat)   = 2 · 0.333      = 0.667 s
//   max jump distance = run · air time = 110 · 0.667    = 73 px  (~4.5 tiles)
// Level rules with ~1/3 safety margin: gaps ≤ 3 tiles (48 px), step-ups ≤ 2 tiles (32 px).
export const PLAYER = {
  jumpVelocity: -300, // px/s
  maxRunSpeed: 110, // px/s
  groundAccel: 600, // px/s²
  groundDecel: 800, // px/s²
  airAccel: 500, // px/s², slightly less control in the air
  airDecel: 300, // px/s², keeps momentum when no direction is held mid-jump
  maxFallSpeed: 400, // px/s
  coyoteTimeMs: 100,
  jumpBufferMs: 100,
  jumpCutMultiplier: 0.5, // vertical velocity multiplier when jump is released early
  deathFreezeMs: 500, // freeze + flash before respawn
  fallDeathMargin: 32, // px below the world bottom before a fall counts as death
  // Physics hitbox, independent of sprite frame size (16×16 placeholder:
  // covers the cap to the shoes, cols 3–12, rows 2–14).
  body: { width: 10, height: 13, offsetX: 3, offsetY: 2 },
};

// Parallax backdrop.
export const PARALLAX = {
  hillsFactor: 0.3, // hills scroll at 30% of camera speed
  hillsBottom: 152, // screen y of the bottom of the hills strip (just below the platform top)
  trainSpeed: 0.08, // px/ms the hills race past while the boss fight runs (the train is moving)
};

// Secret areas: foreground (station canopy) fades to this alpha while the player is inside.
export const SECRET_REVEAL_ALPHA = 0.35;

// Camera.
export const CAMERA = {
  lerp: 0.2, // follow smoothing (1 = locked to player)
  deadzoneWidth: 48, // px the player can move before the camera follows
};

// Timing. The run is measured in time: the clock runs from the start of the
// level to the finish (deaths included), then every pint left behind adds a
// penalty. Bonus items take time off (see `timeBonusMs` in the collectible
// registry, src/entities/Collectible.js).
export const TIMING = {
  missedPintPenaltyMs: 2000,
};

// HUD (game px). Text uses the pixel bitmap font at a whole-number scale.
export const HUD = {
  margin: 4,
  textScale: 2,
  bumpScale: 1.3, // counter grows to this × on pickup, then settles
  bumpMs: 90,
};

// Train Conductor boss fight. Arrays are per phase: [before 1st hit, after 1st, after 2nd].
// He gets faster each time he's stomped. Three stomps beat him; dying resets him.
// Values every Conductor fight shares.
const BOSS_SHARED = {
  introMs: 1200, // the intro line (`introText`) before he starts
  introText: 'TICKETS PLEASE!',
  doubleDashChance: 0, // chance per dash of dashing straight back (final fight only)
  turnMs: 300, // the flashing turn before a dash back
  doubleDashDizzyMs: 1600, // dizzy time after a dash back (instead of dizzyMs)
  ticketSpread: 32, // px between tickets in a volley
  hurtMs: 700,
  stompBounce: -260, // player bounce off his cap
  exitMs: 850, // final stomp: knocked off the train, spinning, gone in this time
  exitDistance: 70, // px he travels sideways while tumbling off
  body: { width: 12, height: 26, offsetX: 2, offsetY: 4 },
};

// One tuning per fight, picked by the `tuning` property of the level's boss
// object. Arrays are per phase (one phase per hit taken, so `hits` phases);
// they can be any length, and the last entry is used for later phases.
export const BOSS = {
  // Level 3: the v1 fight with a fourth stomp added.
  first: {
    ...BOSS_SHARED,
    hits: 4,
    walkSpeed: [34, 42, 52, 58], // px/s, plodding towards the player
    walkMs: [2200, 1900, 1600, 1500], // walking (and throwing) before each wind-up
    throwEveryMs: [1100, 950, 850, 800],
    ticketsPerVolley: [1, 2, 3, 3],
    ticketFlightMs: 1050, // time from throw to landing; the floor marker shows where
    windupMs: [650, 520, 450, 420], // whistle telegraph before the dash
    dashSpeed: [160, 190, 220, 230], // px/s; he's dizzy after hitting the arena edge
    dizzyMs: 1500, // stomp window
  },
  // Level 6: the harder rematch. Six stomps; every phase starts where the
  // first fight ended and climbs. In the later phases he sometimes dashes
  // straight back after hitting a wall (`doubleDashChance`), with a short
  // flashing turn (`turnMs`) first, so hiding in the far corner isn't safe.
  final: {
    ...BOSS_SHARED,
    introText: 'TICKETS PLEASE! AGAIN!',
    hits: 6,
    walkSpeed: [52, 58, 64, 70, 76, 78],
    walkMs: [1800, 1600, 1500, 1400, 1300, 1250],
    throwEveryMs: [900, 850, 800, 760, 720, 700],
    ticketsPerVolley: [3, 3, 4, 4, 5, 5],
    ticketSpread: 28,
    ticketFlightMs: 900,
    windupMs: [450, 420, 400, 380, 360, 350],
    dashSpeed: [220, 230, 240, 250, 260, 265],
    dizzyMs: 1250,
    doubleDashChance: [0, 0.35, 0.5, 0.6, 0.7, 1], // the last phase always dashes back
    turnMs: 320,
    doubleDashDizzyMs: 2000, // longer after a dash back: he ends up at the far wall
  },
};
export const DEFAULT_BOSS_TUNING = 'first';

// The landlord of The Avocet (level 7, src/systems/LandlordArena.js and
// src/entities/Landlord.js). He can't be stomped: each phase is beaten a
// different way. Phases 1–2: land on a beer pump (a one-way handle on the bar)
// while he's within `pumpSprayRange` px of it and it soaks him; a pump runs
// dry once it has. Phase 3: he rolls barrels; land on one to kick it back at
// him. Phase 4: ring the last orders bell (jump into it) and he rushes to his
// till on the cellar hatch, swamped by the crowd for `swampedMs`; pull the
// lever (jump into it) then and he drops into the cellar. All the while he
// walks at you, lobs pint glasses (they land on their floor marker) and
// charges with his tray. Arrays are per phase, as for BOSS.
export const LANDLORD = {
  name: 'LANDLORD',
  introText: 'LAST ORDERS!',
  beatenText: 'TIME, GENTLEMEN!',
  phaseHints: ['JUMP ON A PUMP!', 'ANOTHER PUMP!', 'KICK HIS BARREL BACK!', 'RING THE BELL!'],
  leverHint: 'PULL THE LEVER!',
  hits: 4,
  introMs: 1200,
  walkSpeed: [40, 48, 50, 56], // px/s
  walkMs: [2200, 2000, 1500, 1700], // walking (and throwing) before each attack
  throwEveryMs: [1300, 1100, 1600, 1000],
  glassesPerVolley: [1, 2, 1, 2],
  glassSpread: 30,
  glassFlightMs: 1000,
  windupMs: [600, 520, 450, 450], // before a charge or a barrel
  chargeSpeed: [170, 190, 200, 215],
  recoverMs: 700, // catching his breath after charging into a wall (not stompable)
  hurtMs: 900,
  pumpSprayRange: 30, // px between him and a pump for the spray to soak him
  pumpCooldownMs: 600,
  barrelSpeed: 80,
  barrelKickSpeed: 150,
  rushSpeed: 140, // to his till after the bell
  swampedMs: 3400,
  stompBounce: -230, // harmless bounce off his head
  exitMs: 900,
  body: { width: 12, height: 28, offsetX: 2, offsetY: 4 },
};

// Pub dogs (level 7, src/systems/Dogs.js): each trots up and down its stretch
// of floor at `speed`, and runs at `chaseSpeed` towards a player on the floor
// within `chaseRange` px. Touching one from the side is a death; land on it
// and it yelps and runs off (back when you respawn). The validator keeps their
// patrol on flat floor with `clearTiles` either side and away from (re)starts.
// Level 8: Parkstone to the kebab shop.
//
// The megaphone (src/systems/Megaphone.js): pick it up and the shout button
// (X, or the touch button above jump) sends a sound wave `rangePx` ahead of
// you, `heightPx` tall, every `cooldownMs`. Foxes and wheelie bins in it are
// blown away (back when you respawn); a bouncer in it is stunned and steps
// aside for `stunMs`.
export const MEGAPHONE = { cooldownMs: 1200, rangePx: 80, heightPx: 34, waveMs: 320, stunMs: 2600, hintKeys: 'PRESS X TO SHOUT!', hintTouch: 'TAP THE MEGAPHONE TO SHOUT!' };
// Foxes (src/systems/Foxes.js): dart up and down their stretch of pavement,
// pausing to sniff; deadly to touch and too quick to stomp. Shout them away.
export const FOXES = { speed: 70, pauseMs: 700, runMs: 900, clearTiles: 1, stepMs: 110 };
// Wheelie bins (src/systems/Bins.js): a spawner sends one rolling along the
// pavement every `everyMs` until it drops off an edge or hits something.
// Deadly from the side; land on one to bounce off it; shout it over.
export const BINS = { speed: 60, bounce: -240 };
// Bouncers (src/systems/Bouncers.js): stand across the pavement outside a
// club, too tall to jump (`height` px) and solid. A cycling one steps out for
// `outMs` and back in for `inMs`; a standing one never moves until shouted at.
export const BOUNCERS = { height: 50, width: 14, outMs: 2200, inMs: 2000, stepMs: 250, crossMargin: 1.6 };
// Side-road traffic (src/systems/Traffic.js): a junction across the pavement
// with a pedestrian light. Green man (`walkMs`), flashing amber (`warnMs`),
// then a car comes out of the side road (`carMs`, deadly), each time from the
// other direction. The validator checks the green man is long enough.
export const TRAFFIC = { walkMs: 2400, warnMs: 1000, carMs: 1200, crossMargin: 2.2 };
// Closing time at the kebab shop: arrive before `closingMs` (on the level's
// clock) and the time comes off; after, the shutters are down and it costs
// you `lateMs` (you still get your kebab).
export const CLOSING = { earlyBonusMs: 5000, lateMs: 10000, warnAtMs: 15000 };

export const DOGS = { speed: 28, chaseSpeed: 64, chaseRange: 56, stompBounce: -220, stepMs: 160, clearTiles: 1 };

// Delay between reaching the pub door and the Complete screen (the lad walks
// in, confetti falls, "CHEERS!").
export const FINISH_DELAY_MS = 2600;

// Crumbling crates (src/systems/Crumbles.js): land on one and it shakes for
// `shakeMs`, then drops away. It comes back `returnMs` later, or at once when
// the player respawns.
export const CRUMBLE = { shakeMs: 380, fallMs: 350, returnMs: 3000, shakePx: 1 };

// Angry locals throwing beer mats from pub windows (src/systems/Throwers.js).
// Each one throws every `everyMs` while the player is on the street within
// `rangeTiles` of the window, aimed where the player is now; a mat lands
// where its floor marker shows, `flightMs` later. Keep moving and they land
// behind you; hesitate (or stop to line up a jump) and you're hit. Up on the
// rooftops you're out of reach. `lead` > 0 would aim ahead of a moving player.
export const THROWERS = { everyMs: 850, flightMs: 800, rangeTiles: 16, firstDelayMs: 300, staggerMs: 500, lead: 0 };

// Level crossings (src/systems/LevelCrossing.js): open → warning (lights, bell,
// barrier lowering) → closed while a train passes (deadly) → raising → open.
// The validator checks a player can cross comfortably inside `openMs`.
// The train runs left to right through the crossing: its headlight glows at
// the left edge through the warning, then the nose enters, the carriages pass
// and the tail leaves on the right, all within `trainMs` (the deadly part).
export const CROSSING = {
  openMs: 2600,
  warnMs: 1400,
  trainMs: 2200,
  raiseMs: 400,
  trainCarriages: 3, // carriages behind the locomotive (sets the train's length, and so its speed)
  crossMargin: 2.5,
};

// Moving platforms (src/systems/MovingPlatforms.js): the tank on the Bovington
// heath and the rowing boats on the Frome at Wareham. Each glides (eased) from
// one end of its track to the other, waits `pauseMs`, and comes back. `deck`
// is the width (px) of the surface you stand on; `speed` is its average speed
// in px/s (its top speed is about 1.6× that, still well under a walk). The
// validator checks you can jump on at one end and off at the other.
export const MOVERS = {
  tank: { deck: 32, speed: 40, pauseMs: 700 },
  boat: { deck: 48, speed: 40, pauseMs: 400 },
  ferry: { deck: 64, speed: 36, pauseMs: 600 }, // the chain ferry across Poole harbour
};

// Swans patrolling the riverbank at Wareham (src/systems/Swans.js). Touching
// one is a death and they can't be stomped: jump over them. The validator
// keeps their patrol on flat ground, away from checkpoints and gap edges.
export const SWANS = { speed: 22, stepMs: 220 };

// Seagulls over Poole quay (src/systems/Gulls.js). Each hovers out of reach
// over one end of its stretch for `pauseMs`, squawks, then swoops across in a
// dip (`passMs`) that comes down to head height in the middle, and hovers at
// the other end. Deadly to touch. Follow one across as it swoops away and
// you're past before it comes back. `hoverPx` / `lowPx` are the gull's height
// above the quay at the ends and at the bottom of the dip. The validator
// checks you can run the stretch (plus `clearTiles` either side) in the time
// the gull spends going away and hovering, with `crossMargin` to spare.
export const GULLS = { passMs: 2400, pauseMs: 1200, hoverPx: 88, lowPx: 9, flapMs: 160, clearTiles: 2, crossMargin: 1.3 };

// Bouncy shop awnings on Poole high street (src/systems/Awnings.js): land on
// one and it throws you up at `velocity` px/s, whatever you're pressing (a
// jump is 300), about six tiles high: the way up onto the rooftops. The
// validator works out how far up a bounce reaches from `velocity`. An awning
// sits `dropPx` below the top of its tile row, on top of a shopfront's own
// awning, so the shop's name stays readable.
export const AWNINGS = { velocity: 420, squashMs: 140, dropPx: 4 };

// The departing train out of Wareham (src/systems/AutoScroll.js): once you're
// on the roof the camera scrolls on by itself at `speed` px/s until the end of
// the stretch, faster if you run ahead. Drop off the left edge of the screen
// and you've missed the train (a death). The validator keeps `speed` under
// `maxPace` of your run speed and keeps anything you'd wait for out of it.
export const AUTOSCROLL = { speed: 70, maxPace: 0.7, followLead: 0.4, startText: 'ALL ABOARD!', missedText: 'MISSED THE TRAIN!' };

// Rain (src/systems/Weather.js), from a level's `weather` map property.
export const RAIN = { dropsPerSecond: 140, speed: 330, drift: -40, alpha: 0.55, splashesPerSecond: 18 };

// Level picker rows (game px) and the "next stop" screen shown before each level.
export const LEVEL_SELECT = { top: 38, rowHeight: 16, rowWidth: 292, bottom: 138 }; // rows shrink (from rowHeight) to end above the buttons at y 140
export const NEXT_STOP = { durationMs: 2400, minMs: 400 }; // moves on by itself; a tap skips after minMs

// Sound. Effects are synthesised in src/audio/sfx.js (retro square/noise voices).
export const AUDIO = {
  volume: 0.3, // master volume 0..1 (was 0.6, which was too loud)
};

// What the lad says when the Conductor is beaten, and how long the bubble stays.
export const SPEECH = {
  bossDefeated: "I'M PAYING TO BE HERE",
  durationMs: 2600,
  textScale: 2,
};

// Finish celebration.
export const CONFETTI = {
  doorBurst: 50, // pieces thrown out of the doorway
  rainMs: 1800, // how long confetti falls across the screen
  rainEveryMs: 30,
  lifespanMs: 3200,
};

// Input.
export const INPUT = {
  maxPointers: 3, // simultaneous touches (direction + jump + spare)
};

// On-screen touch buttons (game px unless noted). Button size grows when the
// canvas is drawn small so it never renders below minCssPx on screen.
export const TOUCH = {
  minCssPx: 72, // brief minimum is 64 CSS px; a little extra for thumbs
  minSize: 32,
  maxSize: 52,
  margin: 6, // from the screen / safe-area edge
  gap: 4, // between the left and right buttons
  hitPadding: 12, // invisible extra hit area around each button
  idleAlpha: 0.45,
  pressedAlpha: 0.9,
};

// One text style for the whole game. System monospace as a placeholder.
export const FONT_FAMILY = 'ui-monospace, Menlo, Consolas, "Courier New", monospace';
export const TEXT_STYLE = {
  fontFamily: FONT_FAMILY,
  fontSize: '8px',
  color: '#ffffff',
};

export const COLORS = {
  background: '#1d2b53',
  sky: '#8fd3ff',
  text: '#ffffff',
  textDim: '#c2c3c7',
  accent: '#ffec27',
};

// Level looks, picked by the `theme` property of a level's map (see
// LevelLoader). `sky` is the background colour; `hillsTint` tints the
// parallax hills (0xffffff = as drawn). Later stages add weather and lamps.
export const THEMES = {
  day: { sky: COLORS.sky, hillsTint: 0xffffff },
  morning: { sky: '#c4e8ff', hillsTint: 0xf4ffe8 }, // level 1: pale, fresh late-morning light
  afternoon: { sky: '#9cd6ff', hillsTint: 0xfff4dc }, // level 3: a warmer mid-afternoon
  golden: { sky: '#f7d58e', hillsTint: 0xffdc96 }, // level 4: golden late afternoon at Wareham
  stormy: { sky: '#8a90ad', hillsTint: 0xa4abc4 }, // level 5: a rainy dusk on the way back to Poole
  // Level 6: night at Parkstone. `lampsLit` puts a warm glow round every street lamp.
  night: { sky: '#2b3166', hillsTint: 0x5a6196, lampsLit: true },
  // Level 7: inside The Avocet. `interior` swaps the sky and hills for the
  // pub's back wall (wallpaper over oak panelling); wall lights glow.
  pub: { sky: '#3a1f24', hillsTint: 0xffffff, interior: true, lampsLit: true, crumble: 'stool' },
};
export const DEFAULT_THEME = 'day';

// Lit street lamps (themes with `lampsLit`): a soft glow round the lantern
// that flickers gently.
export const LAMP_GLOW = { radius: 22, alpha: 0.55, flickerAlpha: 0.12, flickerMs: 900 };
