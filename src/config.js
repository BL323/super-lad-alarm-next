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
  introMs: 1200, // "TICKETS PLEASE!" before he starts
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
  // Level 3: the v1 fight, unchanged.
  first: {
    ...BOSS_SHARED,
    hits: 3,
    walkSpeed: [30, 40, 52], // px/s, plodding towards the player
    walkMs: [2400, 2000, 1600], // walking (and throwing) before each wind-up
    throwEveryMs: [1200, 1000, 850],
    ticketsPerVolley: [1, 2, 3],
    ticketFlightMs: 1100, // time from throw to landing; the floor marker shows where
    windupMs: [700, 550, 450], // whistle telegraph before the dash
    dashSpeed: [150, 185, 220], // px/s; he's dizzy after hitting the arena edge
    dizzyMs: 1600, // stomp window
  },
  // Level 6: the harder rematch. A copy of `first` until stage 6 tunes it.
  final: {
    ...BOSS_SHARED,
    hits: 3,
    walkSpeed: [30, 40, 52],
    walkMs: [2400, 2000, 1600],
    throwEveryMs: [1200, 1000, 850],
    ticketsPerVolley: [1, 2, 3],
    ticketFlightMs: 1100,
    windupMs: [700, 550, 450],
    dashSpeed: [150, 185, 220],
    dizzyMs: 1600,
  },
};
export const DEFAULT_BOSS_TUNING = 'first';

// Delay between reaching the pub door and the Complete screen (the lad walks
// in, confetti falls, "CHEERS!").
export const FINISH_DELAY_MS = 2600;

// Crumbling crates (src/systems/Crumbles.js): land on one and it shakes for
// `shakeMs`, then drops away. It comes back `returnMs` later, or at once when
// the player respawns.
export const CRUMBLE = { shakeMs: 450, fallMs: 350, returnMs: 3000, shakePx: 1 };

// Angry locals throwing beer mats from pub windows (src/systems/Throwers.js).
// Each one throws every `everyMs` while the player is on the street within
// `rangeTiles` of the window, aimed where the player is now; a mat lands
// where its floor marker shows, `flightMs` later. Keep moving and they land
// behind you; hesitate (or stop to line up a jump) and you're hit. Up on the
// rooftops you're out of reach. `lead` > 0 would aim ahead of a moving player.
export const THROWERS = { everyMs: 1000, flightMs: 800, rangeTiles: 16, firstDelayMs: 300, staggerMs: 500, lead: 0 };

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

// Level picker rows (game px) and the "next stop" screen shown before each level.
export const LEVEL_SELECT = { top: 38, rowHeight: 16, rowWidth: 292 }; // six rows end above the buttons at y 140
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
};
export const DEFAULT_THEME = 'day';
