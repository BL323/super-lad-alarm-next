# Super Lad Alarm

A mobile-first 2D side-scrolling platformer prototype built with **Phaser 3** and **Vite**. Plain JavaScript (ES modules), static build, no backend.

The full spec is in [initial-build-brief.md](initial-build-brief.md).

This repo is the next version of the game. v1 is frozen at [BL323/super-lad-alarm](https://github.com/BL323/super-lad-alarm) (live at https://bl323.github.io/super-lad-alarm/). The plan for this version is in [docs/vNext-improvements.md](docs/vNext-improvements.md); it's live at https://bl323.github.io/super-lad-alarm-next/.

## Status

| Stage | State |
| --- | --- |
| 1. Scaffold | Done |
| 2. Player and feel | Done (plus touch buttons from stage 6, pulled forward) |
| 3. Level | Done: the full level, Dorchester to Parkstone |
| 4. Collectibles and timing | Done (score replaced by a timer at the owner's request) |
| 5. Finish and flow | Done (plus a character select screen) |
| 6. Mobile | Done |
| 7. Polish and ship | Not started |
| vNext stage M: mobile full screen | Done in code (fill scaling on touch, Home Screen app, Android full screen, iPhone hint, wider view); real-phone checks still to do |
| vNext stage 0: level-based game | Done: level builders, registry, level picker, next stop screen, crawl timing, per-level themes, two boss tunings (still playing the v1 level) |
| vNext stage 1: level 1 | Done: Poole → Dorchester South (Brewhouse), with the village street, low bridges, the kebab hazard and the morning sky. It replaces the v1 level, so there is no Conductor fight until level 3 |
| vNext stage 2: level 2 | Done: Dorchester South → Moreton (Frampton), with crumbling crates, a level crossing, cowpats and cows |
| vNext stage 3: level 3 | Done: Moreton → Wool (The Black Bear), with the first Conductor fight, beer mats thrown from the pub windows, and rooftop and street routes |
| vNext stage 4: level 4 | Done: Wool → Wareham (The Old Granary), with the tank ride, rowing boats on the Frome, swans, the Kings Arms as scenery and the golden sky |
| vNext stage 5: level 5 | Done: Wareham → Poole (The Rising Sun), with the departing train (auto-scroll), bouncy awnings up to the rooftops, seagulls, the chain ferry and rain |
| vNext stage 6: level 6 | Done: Poole → Parkstone (The Avocet), at night with the street lamps lit, and the final Conductor fight (five stomps, bigger volleys, the double dash) |
| Harder levels and high roads (after stage 6) | Done: level 1 now starts where level 6 used to be, every town has a rooftop route, the first fight has 4 stomps and the final 6. Not yet played by hand |
| Levels 7 and 8 (after the harder levels) | Done: inside The Avocet (dogs, locals throwing glasses, crisps and darts, the landlord fight with the beer pumps, barrels, the bell and the cellar hatch) and Parkstone to the kebab shop (the megaphone, foxes, wheelie bins, bouncers, side-road traffic, closing time). Not yet played by hand |
| vNext stage 7: polish | Planned ([docs/vNext-delivery-plan.md](docs/vNext-delivery-plan.md)) |

## Requirements

- Node.js 24 or newer (see `.nvmrc`; `engines` in `package.json`)
- npm

## Running locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). The dev server also listens on your LAN address, so a phone on the same network can open it. Always use the dev server: Phaser loads assets over HTTP and will not work from `file://`.

## Building

```bash
npm run build     # validates levels, then outputs static files to dist/
npm run preview   # serves dist/ locally to check the build
```

Level tools:

```bash
npm run build:levels      # rebuild every level in scripts/levels/ into public/assets/levels/<id>.json (and validate)
npm run build:levels -- level-01  # rebuild one level
npm run validate:levels   # check every level against the rules, and the registry against the files
```

The build uses a relative base (`./`), so `dist/` works from a site root or a subpath. Phaser is emitted as its own chunk (~320 KB gzipped).

## Deploying to GitHub Pages (main target)

The game is published at **https://bl323.github.io/super-lad-alarm/**.

`.github/workflows/deploy-pages.yml` runs on every push to `main` (or by hand from the Actions tab). It installs with `npm ci`, runs `npm run build` (which validates the levels first) and publishes `dist/` to Pages. A failed level check stops the deploy.

One-time setup, already done for this repo: Settings → Pages → Source: **GitHub Actions**. With the CLI:

```bash
gh api -X POST repos/BL323/super-lad-alarm/pages -f build_type=workflow
```

The build uses relative paths (`base: './'`), so it works under the `/super-lad-alarm/` subpath with no extra config. To check a build at that subpath locally, use `npm run preview -- --base /super-lad-alarm/` and open `http://localhost:4173/super-lad-alarm/`. Pages can't set custom cache headers (it caches everything for 10 minutes); that's fine because built file names change on every build.

## Deploying to Netlify (alternative)

`netlify.toml` sets the build command, the `dist` publish directory, Node 24, and cache headers. Connect the repository in Netlify, or run `npx netlify deploy --prod --dir=dist` after a build.

## Project structure

```
index.html              page shell (viewport, safe-area meta)
vite.config.js          relative base, Phaser chunk
netlify.toml            Netlify build and headers
public/assets/levels/   Tiled JSON levels (generated, see Levels below)
scripts/levels/         one builder per level (level-01.mjs …) plus lib.mjs, the shared building blocks
scripts/                build-levels, validate-levels and build-icons (Node, no dependencies)
src/
  main.js               Phaser.Game config and scene list
  config.js             title, resolution, physics, movement and scoring tuning, text style
  assets.js             texture keys, frame layouts and animation names
  style.css             full-viewport, no-scroll, no-gesture page styles
  art/placeholders.js   code-generated placeholder textures
  art/animations.js     every animation, defined once and referenced by name
  art/pixelFont.js      3×5 pixel font for signs painted into textures
  art/bitmapFont.js     the same font as a Phaser bitmap font (HUD text)
  level/levels.js       level registry in crawl order (id, number, from, to, pub, map key, file, next)
  level/LevelLoader.js  tilemap, collisions, bounds, parallax, decor, hazards; parses objects
  level/validateLevel.js difficulty rules, shared by the CLI script and a dev-only boot check
  scenes/               Boot, Menu, CharacterSelect, LevelSelect, NextStop, Game, UI (HUD and touch buttons), Complete, CrawlComplete; keys.js holds scene keys
  entities/Player.js    movement, jump feel, animation state machine, die()/respawn()
  entities/Collectible.js collectible type registry and pickup pop
  systems/GameState.js  plain run state (clock, pints, checkpoint), final-time maths and the crawl (results per level, total)
  systems/Checkpoints.js railway-signal checkpoints
  systems/BossArena.js  Train Conductor fight: camera lock, wall, tickets, stomp/contact rules, reset, win
  entities/Conductor.js the boss's state machine (walk/throw, wind-up, dash, dizzy, hurt, defeated)
  ui/BossBar.js         "CONDUCTOR" label and health pips
  ui/SpeechBubble.js    speech bubble that follows a sprite and stays on screen
  systems/Celebration.js finish confetti (door burst + falling shower)
  systems/Input.js      keyboard + touch merged into one virtual input state
  systems/Audio.js      sound wrapper: builds synth effects at boot, plays by key, unlocks on first input
  audio/sfx.js          retro sound effects synthesised in code (no audio files)
  systems/Scaling.js    integer-scale frame sizing for Phaser FIT mode
  systems/device.js     touch-device detection
  systems/mobile.js     iOS gesture blocking and the portrait rotate overlay (freezes the game)
  ui/Hud.js             pint counter, run timer, bonus toast
  ui/Button.js          pixel-font button for touch, mouse and keyboard focus
  ui/buttonFocus.js     keyboard focus, Enter/Space/Esc and sounds for a row of buttons
  ui/relayout.js        restarts a static screen when the game width changes
  ui/backdrop.js        sky, hills and platform behind the menu screens
  ui/TouchControls.js   on-screen left/right/jump buttons
  ui/safeArea.js        safe-area insets in game pixels
  ui/text.js            shared text helpers (system font, pixel font)
```


## Sound

Retro 8-bit sound effects are synthesised in code at boot (`src/audio/sfx.js`): square, triangle, sine and noise voices with pitch sweeps, vibrato and short envelopes. There are no audio files and no extra packages. Each effect is stored in Phaser's audio cache under a key, and gameplay plays it with `Audio.play(key)`.

| Key | When | Sound |
| --- | --- | --- |
| `jump` | Every jump | Quick rising blip |
| `coin` | Pint collected | Two-note pickup chime |
| `bonus` | Espresso martini | Brighter four-note arpeggio |
| `checkpoint` | Signal turns green | "Ding-dong" station bell |
| `death` | Any death | Falling wobble with a crunch |
| `whistle` | Conductor's intro and every wind-up | Guard's pea whistle |
| `ticket` | Each ticket thrown | Short flick |
| `dash` | Conductor charges | Whoosh |
| `bounce` | Landing on his cap when he isn't dizzy | Harmless "boing" |
| `boss-hit` | Stomping him while dizzy | Thud |
| `boss-defeated` | Third stomp | Comedy "wah-wah-wah-waaah" |
| `finish` | Walking into The Avocet | Victory fanfare |
| `select` / `move` | Menu buttons / changing selection | Tiny blips |

- **Volume:** `AUDIO.volume` in `src/config.js` (master, default 0.3; it was 0.6, which was too loud).
- **Replacing a sound:** load a real file under the same key in `BootScene.preload()` and the synth version is skipped.
- **Unlocking:** browsers only allow sound after a tap or key press, and the first tap on START does that.
- **iPhones:** the game asks Safari for "ambient" audio, so it respects the silent switch and doesn't stop the player's own music.

## Testing flags

- `?touch` shows the on-screen buttons on a desktop browser (they only appear on touch devices otherwise).
- Keys: arrows or A/D to move, space or up to jump, X to shout (level 8, with the megaphone).
- `?debug` (dev server only) shows physics bodies and a live readout of the player's state, velocity and floor contact.

## Tuning movement

All movement values live in `PLAYER` in `src/config.js`. Each player copies them to `player.stats`, so they can change at runtime; call `player.applyStats()` after changing the hitbox or fall speed. If you change gravity, jump velocity or run speed, update the jump-height and jump-distance comment in `config.js`, because the level rules (gap and step-up limits) come from them.

Measured in the stage 2 test strip: full speed in 0.23 s, stop in 0.15 s, full jump 47.5 px, tapped jump 21.5 px. Coyote time and jump buffering both work at ~60 ms and correctly reject presses over 100 ms late or early.

## Boss: the Train Conductor

The Conductor fights you twice: in level 3 (`BOSS.first`, the v1 fight with a fourth stomp) and in level 6 (`BOSS.final`, the rematch). A level gets the fight by placing a `boss` inside an `end-zone`. Both are on the roof of his own train: two coupled carriages, one screen long. This section describes the first fight; the rematch's differences follow the list.

- **Arena.** Jumping up onto his train (the `end-zone`) starts the fight. The camera pans to and locks on that screen, walls close on both sides, the hills race past (the train is moving), and "TICKETS PLEASE!" appears with a CONDUCTOR bar of four health pips. The finish is locked (dimmed) until he's beaten.
- **His cycle:** walk towards you, throwing tickets (from the very first phase) → wind-up (flashes red, red "!" over his head) → dash across the platform → hit the arena edge and go dizzy (stars over his cap) → repeat.
- **Tickets** are lobbed so they land on the player's position after 1.05 s. A dark marker on the floor shows exactly where each will land.
- **Beating him:** land on his cap while he's dizzy. Four stomps win, and he gets faster after each (walk speed, throw rate, tickets per volley, a shorter wind-up and a faster dash). Landing on his cap at other times just bounces you off harmlessly. His cap counts as ground, so a jump pressed as you land on it jumps you off it.
- **Dying:** touching him from the side while he walks, winds up or dashes, or being hit by a ticket, goes through the usual `die()`. Any death resets the whole fight (owner's decision): he's back to full health at his start, the walls open, and you respawn at the checkpoint on the embankment beside the track and jump back aboard.
- **Time:** the clock keeps running through the fight. Beating him gives no time bonus (owner's decision).
- **When he's beaten** the final stomp knocks him off the train. He flips and tumbles away from you, out of sight in under a second (`BOSS.exitMs`). "CONDUCTOR BEATEN!" appears, the lad says **"I'M PAYING TO BE HERE"** in a speech bubble (`SPEECH.bossDefeated` in `config.js`), the walls open, the train stops (the hills stop racing), and The Avocet's door at Parkstone unlocks and swings open.
- **The finish is the pub door.** It's padlocked while he's in the arena. Walking into the open door stops the clock. The lad walks inside, "CHEERS!" appears, confetti bursts out of the doorway and rains across the screen, and the Complete screen follows (`FINISH_DELAY_MS`, `CONFETTI` in `config.js`).

**The rematch (level 6, `BOSS.final`).** The same moves, so it still needs only left, right and jump, but tighter: "TICKETS PLEASE! AGAIN!", six stomps (six pips), and every phase starts near the first fight's top speed and climbs (walk 52→78 px/s, dash 220→265 px/s). Volleys grow from 3 to 5 tickets, and they land in 0.9 s instead of 1.05 s. The wind-up is shorter (450→350 ms) and he's dizzy for 1.25 s instead of 1.5 s. From the second phase he sometimes dashes straight back after hitting a wall (35%, rising to 70%, and always in the sixth phase): he turns, flashes and whistles for 0.32 s, then charges the other way, so waiting in the far corner isn't safe. He only turns once per wind-up, and after a dash back he's dizzy for 2 s, since he's ended up at the far wall and you have to run after him.

**The landlord (level 7, `LANDLORD`).** Inside The Avocet, in front of the bar. He can't be stomped (landing on his head just bounces you off); each of his four phases is beaten with the pub itself, and a hint ("JUMP ON A PUMP!", "KICK HIS BARREL BACK!", "RING THE BELL!") says how. All the while he walks at you lobbing pint glasses (they land on a floor marker; he won't throw at you from right next to him), and winds up and charges with his tray.
- **Phases 1–2: the beer pumps.** Three pumps stand on the bar; each handle is a one-way perch two tiles up, out of his reach. Land on one while he's within 30 px of it and it soaks him. A pump that has soaked him runs dry, so the second hit needs another pump.
- **Phase 3: barrels.** Instead of charging he rolls barrels along the floor. Touching one from the side is a death; land on it and it turns round and rolls back, faster, at him.
- **Phase 4: last orders.** Jump into the bell and he rushes to his till on the cellar hatch, where the crowd swamps him for 3.4 s. Jump into the lever on the far wall while he's there and the hatch drops him into the cellar ("TIME, GENTLEMEN!"). The flap in the bar then opens: that's the finish.
- A hit clears any glasses and barrels still in play. Dying resets the fight, as with the Conductor. `src/systems/LandlordArena.js` runs it, `src/entities/Landlord.js` is him; the same boss-* events drive the boss bar, which now shows the boss's name.

All the Conductor's tuning lives in `BOSS` in `src/config.js`. There are two tunings, `BOSS.first` (the first fight) and `BOSS.final` (the level 6 rematch), picked by the boss object's `tuning` property. Values are per phase, one phase per hit; an array shorter than the number of hits reuses its last entry.

## Mobile

- **Landscape only.** On a touch device held in portrait, a "ROTATE YOUR PHONE" overlay covers the page and the whole game freezes: rendering, physics and the run clock. Turning back to landscape carries on from the same frame, and no portrait time is added to the clock. Desktop windows never show the overlay.
- **Touch controls:** left and right at bottom left, jump at bottom right, and in level 8 (once you have the megaphone) a shout button above jump. They're 72 CSS px at 640×360 (the brief asks for at least 64), support several fingers at once, and move in away from notches and home bars.
- **Browser gestures blocked:** no scrolling, pull-to-refresh, pinch or double-tap zoom, text selection or long-press menu. This uses CSS `touch-action: none` plus JS listeners, because iOS Safari ignores `user-scalable=no`.
- **Viewport:** `100dvh` and `viewport-fit=cover`, and the canvas re-fits on resize and rotation.
- **Fills the screen on phones.** On touch devices the game uses the largest scale that fits, even when it isn't a whole number (`SCALING.fillOnTouch`). Desktop keeps whole-number scaling.
- **Wider view on wide screens.** The height is always 180 game px; the width follows the screen's shape from 320 (16:9) up to 400 (20:9). An 844×390 phone gets 388 wide, so the game fills almost edge to edge. Rotating or resizing changes it live.
- **Full screen (Android):** tapping START asks the browser for full screen and a landscape lock. If the player leaves full screen, a FULL SCREEN button appears at the bottom right of the menu. A refusal changes nothing. See `src/systems/fullscreen.js`.
- **Home Screen app (iPhone):** iPhone Safari can't make a page full screen, so the menu shows "FOR FULL SCREEN: SHARE - ADD TO HOME SCREEN" there. Opened from the Home Screen, the game runs with no browser bars, using `public/manifest.webmanifest` and the pint icons in `public/icons` (rebuild them with `npm run build:icons`).

## Manual device checklist (for the project owner)

To be completed on real phones (it can't be tested here):

- [ ] Touch latency feels immediate on the left, right and jump buttons
- [ ] Holding a direction and tapping jump at the same time works
- [ ] Sliding a thumb from left to right switches direction without lifting
- [ ] iOS Safari: address bar showing or hiding never causes scrolling and never hides the buttons
- [ ] Buttons sit clear of the notch and home bar in both landscape orientations
- [ ] Rotation re-fits the canvas; portrait shows the rotate overlay and the clock stops until you turn back
- [ ] Pinch and double-tap never zoom the page (especially iOS Safari)
- [ ] Frame rate stays smooth (60 fps) on a mid-range phone
- [ ] Android Chrome: tapping START goes full screen in landscape; swiping out shows the FULL SCREEN button on the menu, and it goes back in
- [ ] iPhone Safari: the menu shows the Add to Home Screen hint; added to the Home Screen, the game opens with the pint icon and no browser bars
- [ ] Pixel art still looks sharp enough at the non-integer phone scale

## Levels

A level is a Tiled JSON map with:

- **Tile layers** `background` (no collision: canopy posts, river, bridge railings), `ground` (every tile collides; `girder` tiles are low-bridge ceilings) and `foreground` (drawn over the player: station canopy). They use the tileset `tiles`, which is the generated `tiles` texture (layout in `src/assets.js`).
- **Map property `theme`:** a key of `THEMES` in `src/config.js` (sky colour, hills tint). Defaults to `day`. Optional **`weather`:** `rain` (`src/systems/Weather.js`, `RAIN` in config).
- **Object layer `objects`:** `spawn`, at least two `checkpoint`s (property `station`), `collectible`s (property `type`: `pint` or `espresso`), `hazard`s (property `kind`: `glass`, `bucket`, `kebab`, `cowpat`, or the invisible zones `water` and `mud`), `crumble`s (16×16 rectangles, a crumbling crate filling one gap tile), `crossing`s (a rectangle along the road over the track; property `offsetMs` shifts its cycle), `thrower`s (points at a window; properties `floorRow`, the street it throws at, and optional `offsetMs`), `mover`s (a moving platform's deck at the left end of its track, as wide as the deck; properties `kind`: `tank`, `boat` or `ferry`, `travelPx` and `offsetMs`), `swan`s (a rectangle along the surface they patrol; property `surfaceRow`), `gull`s (a rectangle along the surface they swoop over; properties `surfaceRow` and `offsetMs`), `awning`s (a bouncy awning's top edge, as wide as the awning), at most one `autoscroll` (a rectangle over the departing-train stretch), a `finish` at the target pub's door, and optional `secret` rectangles (the foreground fades while the player is inside). A boss level also has a `boss` (properties `kind`: `conductor`, and `tuning`: `first` or `final`) inside a `zone` named `end-zone`, the arena. Points for spawn, checkpoints and finish are at the player's feet.
- **Object layer `decor`:** `pub` (property `pub`, an id from `PUBS` in `src/assets.js`; `scenery: true` draws it hazier, behind the houses, and it never counts as a finish), `house` (property `house`, an id from `HOUSES`), `shop` (property `text`, the fascia), `lamp`, `stall`, `cow` (property `flip`), `sign` (property `text`), `easel` and `yacht`.

Maps are 12 rows (192 px) against a 180 px screen, so the loader shifts everything up 12 px. Only sky is cut off.

Every level is generated by its own builder in `scripts/levels/` (`level-01.mjs` to `level-06.mjs`). A builder exports `meta` (id, width in tiles, map properties) and a `build(L)` that reads like a description of the level (`platform(0, 21)`, `carriage(30, 10)`, `pint(33, 7)`...), using the helpers in `scripts/levels/lib.mjs`. Edit it and run `npm run build:levels`. Don't hand-edit the JSON.

**Adding a level:** add `scripts/levels/level-0N.mjs` and run `npm run build:levels`, then add an entry to `LEVELS` in `src/level/levels.js` (crawl order) and set the previous level's `next` to its id. `npm run validate:levels` checks the registry too: numbers in order, `next` links following the list, every file present, and each level finishing at the pub its entry names.

**Validation rules** (from the jump numbers in `config.js`): gaps of at most 3 tiles, step-ups of at most 2 tiles going right, a safe tile at the same height either side of every glass or bucket hazard, every floating ledge reachable from the spawn by a chain of jumps (so a rooftop route must connect to the ground), flat street with no spawn or checkpoint across each thrower's range, at least 2 tiles of headroom under a low bridge, crumbling crates only over gaps (counted as stepping stones, at most 4 in a row, nothing placed on them), level crossings on flat hazard-free road with a waiting tile and an open window at least 2.5× the time to walk across, and under one the shorter jump's limits (2 tiles of headroom: gaps of 1, no step-ups; 3 tiles: gaps of 1, step-ups of 1), moving platforms only over gaps (at most one per gap, never under a low bridge) with the jump on checked against the deck's nearest position and the jump off against its furthest, swans on flat hazard-free ground with 2 clear tiles beyond each end of their patrol and no spawn, checkpoint or finish on it, one spawn, at least two checkpoints, one finish at a pub door (the same column as a `pub`), an `end-zone` if and only if there's a boss (flat, with the boss inside it and the finish inside or after it), at most one boss with a known `tuning`, and no collectibles inside a boss arena (so the missed-pint penalty never punishes the fight). `npm run build` refuses to build if any level fails, and the dev build logs an error at boot.

## Game flow

Boot → Menu → Outfit select → Level picker → Next stop → Game (with the UI scene on top) → Complete → Next stop → … → Complete → Crawl complete.

- **Level picker:** one row per level (number, route, target pub). Picking one starts a crawl that runs from there to the last level.
- **Next stop:** "NEXT STOP: <STATION> · <PUB>" before every level. It moves on by itself after `NEXT_STOP.durationMs`, or on a tap or key.
- **Complete:** that level's time breakdown. PLAY AGAIN replays the level with the same lad (its new time replaces the old one in the crawl); NEXT goes on to the next level; after the last level, TOTAL opens the crawl summary.
- **Crawl complete:** each level's final time and the total for the levels played. PLAY AGAIN starts a fresh crawl from the same first level.
- The crawl lives in the Phaser registry (`crawl`) next to `characterId`. Going back to the menu ends it, and nothing is saved.

| Screen | Touch / mouse | Keyboard |
| --- | --- | --- |
| Menu | START button | Enter / Space |
| Character select | tap a lad, then GO! (or tap the chosen lad again); BACK | ←/→ or A/D, Enter / Space, Esc |
| Game | on-screen buttons | arrows / A D, Space / Up |
| Level picker | tap a row, then GO! (or tap it again); BACK | ↑/↓ or W/S, Enter / Space, Esc |
| Next stop | tap to skip | any key to skip |
| Complete | MENU, PLAY AGAIN, NEXT / TOTAL | ←/→, Enter / Space, Esc for menu |
| Crawl complete | MENU, PLAY AGAIN | ←/→, Enter / Space, Esc for menu |

There is no pause feature (removed at the owner's request). When the page is hidden, Phaser stops its own loop, so the clock doesn't count that time.

## Characters

Every character is **Naylor** (red hair, same skin tone) in a different outfit, chosen on the "CHOOSE YOUR NAYLOR" screen:

| Outfit | Look |
| --- | --- |
| **SENIOR P** | Green school blazer with a crest, white shirt, green tie with a gold print, grey trousers |
| **SEA LORD** | Modern navy admiral: white-topped peaked cap with gold badge and gold-braided peak, navy jacket with gold buttons and sleeve rings, white shirt, black tie |
| **CASUAL** (default) | Blue polo with a lighter collar, red chinos, brown shoes |

They differ in looks only. Movement and hitbox are identical, so the level tuning holds for every outfit. `CHARACTERS` in `src/assets.js` holds each outfit's `id`, `name`, `look` and colour `palette`; the head and torso pixel shapes for each look are in `PLAYER_LOOKS` in `src/art/placeholders.js`. The arm poses, legs and all eight animation frames are generated from those, so a new outfit needs one entry in each. `DEFAULT_CHARACTER` sets the default (Casual).

## Swapping placeholder art

All placeholder textures are generated in `src/art/placeholders.js` under the keys in `src/assets.js`: `player-<character id>` (e.g. `player-naylor`), `pint`, `espresso-martini`, `glass`, `checkpoint`, `finish`, `tiles`, `hills`, `easel`, `pub-<id>`, `sign-<text>`, `conductor` (16×32 frames, see `CONDUCTOR_FRAME`), `ticket`, `ticket-marker`, `dizzy-stars`. To use real art, load an image or spritesheet under the same key in `BootScene.preload()`; the placeholder for that key is then skipped. Player sheets must follow `PLAYER_FRAME` / `PLAYER_FRAMES` (16×16 frames: idle 0–1, run 2–5, jump 6, fall 7), or update those to match the new sheet.

## Story and theme

Background story: [docs/story.md](docs/story.md). Naylor's "Lad Alarm Train Crawl" across Dorset: six legs by train from Poole to Parkstone, with two Conductor fights, then inside The Avocet to the bar (the landlord) and out through Parkstone to the kebab shop. The plan is in [docs/vNext-improvements.md](docs/vNext-improvements.md) and [docs/vNext-delivery-plan.md](docs/vNext-delivery-plan.md). The levels are being built one at a time; the v1 one-level game (Dorchester to Parkstone, with the Conductor fight) is frozen at [BL323/super-lad-alarm](https://github.com/BL323/super-lad-alarm).

| Level | Route | Pub | State |
| --- | --- | --- | --- |
| 1 | Poole → Dorchester South | Brewhouse | Built |
| 2 | Dorchester South → Moreton | Frampton | Built |
| 3 | Moreton → Wool | The Black Bear | Built (first Conductor fight) |
| 4 | Wool → Wareham | The Old Granary | Built |
| 5 | Wareham → Poole | The Rising Sun | Built |
| 6 | Poole → Parkstone | The Avocet | Built (final Conductor fight) |
| 7 | The Avocet → the bar | The Avocet | Built (the landlord fight) |
| 8 | The Avocet → the kebab shop | Parkstone Kebabs | Built (the megaphone, closing time) |

**Level 1, Poole → Dorchester South** (`scripts/levels/level-01.mjs`, 262 tiles, morning sky): no warm-up; the train is as busy as the old final level. Poole platform → the train: glass, a 3-tile gap, a suitcase, a gap with three crumbling crates → lineside (no checkpoint) → two trains under two low road bridges, with 1-tile gaps to hop under them, a 3-tile gap, glass and a single crumbling crate → the signal box (checkpoint) → a last train with a suitcase, three more crumbling crates and glass → Dorchester South platform (checkpoint) → the high street, which splits: the low road past three dropped kebabs, or the high road up the market stall's crates onto two runs of rooftops, with chimneys to hop and an alley between → the Brewhouse door. The martini is on a crate floating up and to the left of the tall chimney on the second roof. The autopilot takes about 37 s with no deaths (it gets onto the rooftops by chance) and collects 53 of 78 pints.

**Level 2, Dorchester South → Moreton** (`scripts/levels/level-02.mjs`, 289 tiles): Dorchester South platform → the train, with glass, a 3-tile gap, luggage two high and four crumbling crates in a row → lineside with cows (no checkpoint) → the train again, with a low bridge over a gap and a crumbling crate in a 3-tile gap → the signal box (checkpoint) → a third train with glass on every roof, a 3-tile gap, another bridge over a gap, three crumbling crates and more luggage → Moreton station (checkpoint) with the crate stair → Moreton's lane: a level crossing, then a crate stair up to the high road over the cottages (an alley, chimneys) with cowpats on the low road, then a second crossing out of step with the first, more cowpats and a crate → the Frampton door. The martini is on a crate ledge hidden in Moreton's station canopy. The autopilot takes about 49 s including both crossing waits, with no deaths, and collects 56 of 82 pints.

**Level 3, Moreton → Wool** (`scripts/levels/level-03.mjs`, 239 tiles, afternoon sky): Moreton platform → the train, with glass, 3-tile gaps, luggage, three crumbling crates in a row and a low bridge over a gap → lineside with a cow (checkpoint, the respawn point for the fight) → the Conductor's train, the first fight (`BOSS.first`, four stomps) → Wool station (checkpoint) → Wool's high street. At a crate stair the routes split: the low road along the pavement, past two chicken buckets and under the beer mats from The Black Bear's windows, or the high road over three runs of rooftops (a 3-tile alley, a narrow gap, chimneys), with more pints and out of the locals' reach. The martini is on a crate up and to the left of the first roof. The autopilot plus the fight bot finish in about 53 s with no deaths (the fight takes about 22 s) and collect 40 of 66 pints.

**Level 4, Wool → Wareham** (`scripts/levels/level-04.mjs`, 273 tiles, golden sky): Wool platform → the heath, where you ride a tank's turret over a muddy trench → the bank (checkpoint) → the train, with two low bridges over gaps, 3-tile gaps, glass, luggage and three crumbling crates → Wareham station (checkpoint) → the town: broken glass, then a crate stair up onto two runs of rooftops → the Kings Arms (scenery), whose locals now throw beer mats at the street → the quay, with a swan still in the mats' range → a rowing boat, a jetty, a second boat → a second swan → The Old Granary door. The martini is on a crate hanging over the trench, only reachable from the tank. The autopilot runs from the tank range to the end of the quay in about 28 s with no deaths (this autopilot can't ride the tank or the rowing boats, which are unchanged).

**Level 5, Wareham → Poole** (`scripts/levels/level-05.mjs`, 264 tiles, stormy dusk with rain): Wareham platform → the departing train: the camera scrolls on by itself ("ALL ABOARD!"), now at 70 px/s, over eight carriages with 3-tile gaps, luggage piled at mixed heights, glass, two crumbling crates and two low bridges, and dropping off the left of the screen is a death ("MISSED THE TRAIN!") → Holton Heath (checkpoint) → one more carriage, a 2-tile gap and a step up → Poole station (checkpoint) → the high street, where the bouncy awnings throw you up onto three runs of rooftops (chimneys, and a third run reached only from the roofs before it) → the quay, with a swooping seagull → the chain ferry → a second gull → The Rising Sun door. The martini is high over the alley, reached only by a bounce off the chandlery's awning. The autopilot takes about 39 s with no deaths on the low road and collects 41 of 65 pints; a separate run from the first awning crosses all three rooftop runs.

**Level 6, Poole → Parkstone** (`scripts/levels/level-06.mjs`, 213 tiles, night with the street lamps lit): Poole platform → the hardest train of the crawl: glass, 3-tile gaps, luggage, four crumbling crates in a row and a low bridge over a gap → lineside (checkpoint, the respawn point for the fight) → the Conductor's train, the final fight (`BOSS.final`, six stomps) → Parkstone station (checkpoint) → the road up to The Avocet: an off licence, a crate stair onto three runs of rooftops (a 3-tile alley, a narrow gap, tall chimneys), broken glass on the low road, and the locals at The Avocet's windows throwing beer mats from under the last roofs to the door. The martini is on a crate up and to the left of the luggage on the second carriage. The autopilot reaches the fight in about 16 s with no deaths. The fight bot reached the sixth phase but didn't win in three runs. It mostly dies hopping over him into a ticket, a weakness of the bot, so the fight still needs playing by hand. Parkstone takes about 10 s on the low road and 6 s over the rooftops, both with no deaths. Finishing it shows the TOTAL button, which leads to the crawl's total time.

**Level 7, inside The Avocet** (`scripts/levels/level-07.mjs`, 190 tiles, the `pub` theme: the back wall in place of sky and hills, wall lights glowing): the front room by the fire → the lounge, where regulars at the back tables throw pint glasses at you on the floor (the tables are the high road: up there they can't reach you) and a dog trots between the tables (land on it and it bolts; touch it from the side and you're done) → the snug (checkpoint): open cellar hatches in the floor, wobbly stools over the widest (the pub's crumbling crates) and low oak beams with a hatch under one → the games room: darts from the dartboard corner, the pool table, crisps from another regular and a second dog → the bar (checkpoint) → the landlord's fight → the bar hatch. The martini is on the shelf over the fireplace, reached by climbing the kegs and jumping back up-left. The autopilot reaches the fight in about 23 s with no deaths. In the fight, a bot gets both pump hits and the barrel hit in about 13 s every attempt; with scripted moves the bell and lever finish it, and the whole level took 31.9 s. The bot doesn't yet win the last phase on its own (it walks into him on the way to the bell), so the fight needs playing by hand.

**Level 8, The Avocet → the kebab shop** (`scripts/levels/level-08.mjs`, 215 tiles, night): out of The Avocet, where someone's left a megaphone on the step (pick it up: X, or the touch button above jump, shouts a sound wave 80 px ahead every 1.2 s) → Ashley Road: a fox, a crate stair up onto the rooftops over a second fox, and a bin store sending wheelie bins down the pavement → a side road with a pedestrian light: wait for the green man, cars come out from alternating sides → the clubs (checkpoint): two bouncers stepping in and out of their doors (solid and too tall to jump), a fox between them, more bins → a second side road → Ashley Cross (checkpoint): The Vault's bouncer never moves unless you shout at him, then foxes round the bins → a third side road → the kebab row and Parkstone Kebabs. Foxes are deadly and too quick to stomp; a shout sends them off. Bins kill from the side; land on one to bounce, or shout it over. The shop shuts 55 s into the level (the HUD counts down): in before then takes 5 s off; after, the shutters are down and it adds 10 s. The martini is on a crate up and to the left of the tall chimney on the rooftops. The autopilot (which shouts at anything just ahead) takes about 32 s with no deaths and gets in before closing. Finishing it shows the TOTAL button.

| Element | In the game |
| --- | --- |
| Platforms | Station platforms, parked British carriages (roof-hopping) and village pavements |
| Coin | Pint of stout; every one missed adds 2 s to the final time |
| Hazards | Broken glass, a fried-chicken bucket, a dropped kebab, cowpats, the river and the harbour, the tank trench's mud, beer mats thrown from The Black Bear |
| Enemies | Swans on Wareham's riverbank: deadly to touch and too big to stomp, so jump them. Seagulls over Poole quay: they hover out of reach, then swoop down to head height; follow one as it swoops away |
| Moving platforms | A tank across the heath, rowing boats on the Frome and the chain ferry across Poole harbour: ride on top, hop off at the far end |
| Departing train | Out of Wareham the screen scrolls on by itself; fall off its left edge and you've missed the train |
| Bouncy awnings | Poole's striped shop awnings throw you about six tiles up, the only way onto the rooftops there |
| Rooftops | Slate roofs over the houses and shops: the high road through Wool and Poole |
| Weather | Rain over the whole of level 5, with splashes in the street |
| Time of day | Each level has its own sky, from morning at Poole to night at Parkstone, where the street lamps glow |
| Crumbling crates | Cracked crates over a gap: they shake when you land and drop away, so keep moving (back after 3 s or when you respawn) |
| Level crossing | Lights, bell, a headlight through the hedge, barriers, then a train through the gap in the hedges (deadly). The lowered barrier stops you; jumping it doesn't end well |
| Ceilings | Low bridges: girders over the line that cap your jump |
| Bonus | One hidden espresso martini per level; takes 5 s off the final time |
| Finish | The target pub's front door |

The game title stays **Super Lad Alarm**.

## Decisions

- **Phaser 3.90** (latest 3.x) rather than Phaser 4, as the brief requires Phaser 3.
- **Vite 8.** Phaser is split out with Rolldown's `output.codeSplitting` groups (Vite 8 replaces `manualChunks`).
- **Hosting: GitHub Pages instead of Netlify** (owner's choice, once the repo was made public). Deploys run through GitHub Actions on every push to `main`. `netlify.toml` is kept as a fallback.
- **Node 24.** It is the version installed locally and still an LTS line; `engines` is `>=24` so Node 26 LTS also works. Netlify and the Pages workflow (via `.nvmrc`) build with 24.
- **Fill scaling on touch devices (vNext stage M).** Phones skip the whole-number snap below and use the largest scale that fits, because the snap could waste a third of the screen. Pixel-art (nearest-neighbour) rendering stays on, and uneven pixels are hard to see at phone densities. Desktop is unchanged.
- **Full screen.** Requested only from a tap (START, or the menu's FULL SCREEN button) and only on touch devices that support it, never on desktop. iPhone Safari has no full-screen API for pages, so it gets the Home Screen hint and a web app manifest (`display: fullscreen`, landscape). The icon is the game's own pint drawn by `drawPint()` in `src/art/placeholders.js`, scaled up by a whole number. The old `black-fullscreen` status-bar value wasn't valid; it's now `black-translucent`.
- **Level 5: the departing train, awnings, gulls, the ferry and rain (vNext stage 5).** The departing train is `src/systems/AutoScroll.js` (`AUTOSCROLL`): when the player passes the stretch's first column the camera stops following and its left edge moves on at 62 px/s, or faster if the player runs ahead (it never goes back), until its right edge reaches the end of the stretch. The hills race past as in the boss fight. Falling fully off the left edge is a death; a respawn before the stretch re-arms it. The validator keeps the speed under 0.7 of a run and keeps anything you'd wait for (movers, crossings, swans, gulls, throwers, a boss) and any spawn or checkpoint out of the stretch, so it never asks you to stop. Awnings (`src/systems/Awnings.js`, `AWNINGS`) are one-way static decks; landing on one calls `player.bounce(-420, { fixed: true })`, which skips the variable-jump cut, so the bounce is the same whatever you press. The validator works out the bounce's reach (98 px, so 4 tiles with the usual one-third margin), allows that climb from an awning in its reachability search, and checks nothing is in the way above it and you can walk under it. Awnings sit 4 px into their row, on top of a shopfront's own awning, so the shop name stays readable. Seagulls (`src/systems/Gulls.js`, `GULLS`) follow a fixed cycle: hover 1.2 s out of jump reach over one end, swoop across in 2.4 s in a dip down to head height, hover over the other end, swoop back. The validator checks the gull hovers above a jump and that its stretch, plus 2 tiles either side, can be run with 30% to spare in the time it spends swooping away and hovering. The ferry is a third `MOVERS` kind with a wheelhouse drawn above its deck (`deckY` in its look). Rain is two particle emitters fixed to the camera. Systems can now show a HUD message with `scene.events.emit('toast', text)`. The Rising Sun is a painted (yellow) pub with a rising-sun board in place of its middle window.
- **Level 6: the final fight, the double dash and the lamps (vNext stage 6).** `BOSS.final` has five phases and its own intro line (`introText`; the boss bar shows whatever the tuning says). The double dash is a new `turn` state in `Conductor.js`: when a dash hits a wall it rolls `doubleDashChance` for the phase, and on success he turns round (harmful, flashing, `turnMs`) and dashes the other way. At most one turn per wind-up, so he always ends dizzy. The first tuning numbers were tried with a scripted bot. With the dash back forced every time, it could jump both dashes but never reach him in time to stomp him at the far wall, so a dash back now leaves him dizzy for `doubleDashDizzyMs` (2 s) instead of `dizzyMs`. After that the bot beat him without a hit, both with random rolls and with the dash back forced. The roll uses `Math.random` (the Conductor takes a `random` function, so tests can force it). The night theme sets `lampsLit`, and the loader then puts an additive, gently flickering glow (`LAMP_GLOW`) round each lamp's lantern. The Avocet's pub and door art and the total-time screen already existed.
- **Levels 7 and 8 (owner's request).** The crawl goes on past The Avocet: inside it to the bar, then out to the kebab shop, so the landlord is the last boss and the Conductor stays the train boss. Level 7 is the first indoor level: the `pub` theme (`interior: true`) hides the hills and tiles the back wall (`TEX.PUB_WALL`) along the level; tables are floating ledges you can walk under, oak beams are ceilings like girders (the validator treats both), open cellar hatches are gaps, and the theme's `crumble: 'stool'` makes the crumbling crates wobbly stools. The locals reuse the thrower code (rooftop rule and all), each throwing its own item (`item`: glass, crisps or darts). Dogs are the first stompable enemy. The landlord can't be stomped; each phase uses a prop (pumps, barrels, then the bell and the cellar lever), so the fight is about the room rather than his head. Testing found four unfair spots, all fixed: a glass thrown from his hand while you stood on a pump right above him started inside you (he no longer throws at you within 24 px); glasses already in the air caught you as you hopped off a pump after a hit (a hit now clears glasses and barrels); a leftover barrel after the barrel phase; and, in both boss fights, landing on his head without holding jump cut the bounce short, so you were still overlapping him on the next step, rising, and that counted as touching him from the side (a 250 ms grace after a head bounce now). Level 8 adds the game's first attack, the megaphone: a `shout` input (X, or a touch button that appears with it) read through `VirtualInput` like the rest, and a wave that calls `blast()` on foxes, bins and bouncers. A standing bouncer needs the megaphone before him (the validator checks). Bin stores never send a bin out on top of you. Traffic is a simpler level crossing: a pedestrian light, a deadly junction while the car crosses, and cars from alternating sides. Closing time is a map property (`closingMs`): the HUD counts down, the shutters come down when it passes, and `finalTime()` takes off `CLOSING.earlyBonusMs` or adds `CLOSING.lateMs`. The level picker's rows shrink to fit eight levels.
- **Harder levels and high roads (owner's request).** The difficulty curve moved up a whole level: level 1's train is now what level 6's was, and each level adds to it (longer crumbling-crate runs, up to four; low bridges over gaps; luggage two high; 3-tile gaps on every train; two level crossings in level 2; a swan under the Kings Arms' beer mats in level 4). Levels 1, 2 and 4 lost a mid-train checkpoint (two per level now). Every town has a high road: crate stairs up onto runs of slate rooftops over the houses, with alleys of 1–3 tiles, one- and two-tile chimneys and most of the pints, while the low road has the hazards. The Kings Arms and The Avocet now have angry locals (`angryLocals`) throwing beer mats. Global tuning: crumbling crates shake for 380 ms (was 450), beer mats come every 850 ms (was 1000), the departing train scrolls at 70 px/s (was 62). `BOSS.first` has 4 stomps; `BOSS.final` has 6, with the double dash certain in the last phase. A 6-stomp version with faster walking (up to 80 px/s), bigger early volleys and shorter flights was tried first; the fight bot couldn't get past the third stomp, so the per-phase numbers went back to the old final fight's plus a sixth phase. The autopilot found three traps the validator couldn't see, now fixed: a gap with two crumbling crates and a gap (4 tiles) is just too far for a full jump from the edge and too short to land on the crates; a crate before level 4's first gap; and level 3's chicken bucket right where a jump off the end of the rooftops lands. Three bugs were fixed along the way: (1) The Next Stop screen and the level picker kept a "leaving" flag on the scene object, which Phaser reuses, so from the second visit on NEXT never started the level. (2) The Player counted `body.touching.down` as ground, but overlaps (pints, hazards, the door trigger) set it too, so a jump pressed while passing through a pint jumped again in mid-air; now only colliders that call `player.standOn()` (moving decks, crumbling crates, awnings, the Conductor's cap) count. Without the free jump, level 5's 3-tile gap with a 2-tile step up after Holton Heath needed a take-off right at the edge, so it's now a 2-tile gap. (3) A crumbling crate right next to ground caught the lad on the next tile's side while it shook. The validator now rejects that, and a gap and step up together that a jump taking off a tile early can't clear.
- **Longer and harder levels (after stage 6, owner's request).** Every level gained a section of 25–60 tiles, mostly more train: the first 3-tile gaps from level 1 on, more glass and crumbling crates, extra low bridges, more cowpats and kebabs in the villages, and in level 5 two more carriages inside the scrolling stretch. Lengths are now 226, 239, 239, 239, 257 and 191 tiles (were 167, 182, 213, 214, 231 and 166), with 48, 55, 62, 49, 55 and 41 pints. The builders inserted the new section and shifted every later column. A suitcase just before a gap is a trap: a full jump over it lands you in the gap. So is glass under a low bridge: a short hop clears it only within about 80 ms. The autopilot found both, so neither is used. The boss tunings are unchanged.
- **Level 4: moving platforms and swans (vNext stage 4).** The tank and boats are `src/systems/MovingPlatforms.js` (`MOVERS` in `config.js`): each deck is an immovable, one-way Arcade body (you can only land on top) that glides, eased, from one end of its track to the other, waits, and comes back. It's steered by velocity once per physics step (the world's `worldstep` event), aiming at where its cycle says it should be next step, so it never drifts. Arcade carries a rider along with the deck only if the deck's `friction.x` is 1, and physics groups default it to 0, so the system sets it. The validator checks the jump on against the deck's nearest position and the jump off against its furthest, so it works whenever you wait for it, and treats the deck as somewhere to jump from along its whole track (the martini crate over the trench is only reachable that way). Swans (`src/systems/Swans.js`, `SWANS`) walk up and down their stretch of bank and can't be stomped. The river surface was raised to just under the quay (`waterHigh` over `waterDeep`) so the boats sit in it; falling in is a death 12 px down. The Kings Arms is a `scenery` pub: full size, slightly hazy, behind the houses, never a finish.
- **Level 3: the first fight, throwers and two routes (vNext stage 3).** The Conductor fight moved into level 3 unchanged (`BOSS.first`); the arena's camera, walls and reset are the same code, now mid-level, and The Black Bear's door is locked until he's beaten. His tickets and the new beer mats share `src/systems/Lobber.js` (an arc that lands on a floor marker after a fixed flight time; touching one in flight is a death). Throwers (`src/systems/Throwers.js`, `THROWERS` in `config.js`) only throw while the player is on the street within 16 tiles, aimed at where the player is, every second per window, landing 0.8 s later: keep running and they land behind you, hesitate and you're hit. Aiming ahead of the player (`lead`) was tried and dropped: stopping for a marker just got the next mat aimed at you, a stop-start dance that felt unfair this early. The validator's ledge check is now a search from the spawn; the old check let a floating run reach itself through its own tiles. The rooftops are `slate` tiles at row 5, which sit exactly on top of the 64 px houses and shops.
- **Level 2: crumbling crates and the level crossing (vNext stage 2).** Crumbling crates are objects, not tiles (`src/systems/Crumbles.js`): standing on one (not bumping its side) starts a 450 ms shake, then it drops for 3 s; every crate comes back at once when the player respawns, so a crate that fell while you were behind it can't strand you. The level crossing (`src/systems/LevelCrossing.js`) runs open 2.6 s → warning 1.4 s → train 2.2 s → raising 0.4 s (`CROSSING` in `config.js`). Only the approach-side arm is ever solid, and only if the player hasn't already passed it, so being on the crossing as it closes never traps you (checked: walking on clears it). The train doesn't just appear: the crossing is a gap between two tall hedgerows, the approaching train's headlight glows brighter through the left hedge during the warning, then the train (a diesel with a yellow nose, then three coaches built from the carriage tiles, then a red tail lamp) comes out from behind one hedge and disappears behind the other. It's masked to the gap and timed so the nose enters as the deadly phase starts and the tail leaves as it ends. It's drawn behind the player, the hedges between the two, and the barrier arms and lights in front. `config.js` is now safe to import from Node, so the validator reads the jump from `PLAYER`/`PHYSICS` and the crossing timings from `CROSSING` instead of keeping copies.
- **Level 1 and low bridges (vNext stage 1).** The new level 1 replaces the v1 level, which lives on in the frozen repo. Low bridges are `girder` tiles: solid, so a jump bumps its head, but the validator treats them only as ceilings, never as ledges or ground. Under one it works out the shorter jump from the jump numbers in `config.js` and shrinks the allowed gap and step-up. With two tiles of headroom a full jump still clears a 1-tile gap from anywhere in a ~38 px take-off window, checked by stepping frames. The martini ledge sits up-left of the market crates so a straight run misses it. Village scenery (houses, shopfronts, lamps, the stall) is decor drawn in code: `HOUSES` in `src/assets.js`, shopfronts sized to their name.
- **Level-based structure (vNext stage 0).** The v1 level is now one entry (`v1`) in a level registry, built by `scripts/levels/v1.mjs`; the move was checked by rebuilding it byte-for-byte identical to the old `level-01.json`. The crawl total gets its own screen (CrawlComplete) rather than squeezing six level times onto the Complete screen, which now has one row of buttons: MENU, PLAY AGAIN, NEXT (TOTAL after the last level). Six level-picker rows fit above its buttons at 16 game px each.
- **Wider view (vNext stage M).** `gameWidthFor()` in `src/systems/Scaling.js` picks an even width between `GAME_WIDTH` (320) and `MAX_GAME_WIDTH` (400) from the space's aspect ratio, and changes it live with `scale.setGameSize()`. Phaser resizes the cameras itself. The HUD, touch buttons and boss bar re-lay out on resize; the menu, outfit select and Complete screens restart with the same data (`src/ui/relayout.js`). In the boss fight the camera bounds grow evenly round the 320 px arena so it stays centred, and re-centre if the width changes mid-fight. The hills strips are made `MAX_GAME_WIDTH` wide. Levels needed no changes: their ends and the Avocet door stay clear of the jump button at 400 wide.
- **Integer scaling** is computed in *device* pixels: the `#game` frame is sized to the largest whole multiple of the game size that fits in physical pixels, then Phaser FIT fills that frame. Below 1× it falls back to plain FIT. Examples: 1920×1080 → 320 wide at 6×, 1280×720 → 320 at 4×, an 844×390 desktop window → 388 at 2×.
- **Placeholder text** uses the system monospace font at 8 px (16 px for titles). It is readable but soft when upscaled; a code-generated pixel font can replace it later without touching callers (`src/ui/text.js`).
- **Scene keys** live in `src/scenes/keys.js`; texture and animation keys in `src/assets.js`.
- **Phaser console banner** is disabled to keep the console clean.
- **Air control.** The brief gives only ground values, so the air has its own: `airAccel` 500 and `airDecel` 300 px/s². This gives slightly less control in the air and keeps momentum through a jump. Turning round uses the larger of acceleration and deceleration.
- **Touch buttons came early.** They were planned for stage 6 and were built in stage 2 because the game is mobile-first. Buttons are 36 game px at 2× scale (72 CSS px, above the brief's 64 px minimum). They grow when the canvas is drawn smaller and move in from safe-area insets. Each has an invisible hit area 12 px larger than the button. Left and right share a border, so a thumb can slide between them.
- **Keep the bottom corners clear.** The touch buttons cover roughly the bottom 42 game px at each side of the screen, which is where the ground runs. Spawn points, and anything the player must see at the very start and end of a level (where the camera stops scrolling), should sit at least ~100 px from the left edge and away from the bottom-right corner.
- **Jump presses are latched** from key and touch events, not polled, so a tap shorter than one frame is never lost.
- **Level authoring.** Levels are generated from short Node scripts (one per level in `scripts/levels/`, sharing `lib.mjs`) rather than drawn in Tiled, because no Tiled install is assumed and the script is easy to review. The output is standard Tiled JSON.
- **Level length and pacing (v1).** The v1 level was 198 tiles (9.9 screens), Dorchester → Wool → Wareham → the boss train → Parkstone, about 23 s non-stop. Level 1 is 167 tiles (8.3 screens), also about 23 s non-stop.
- **Hazard placement.** The autopilot play test found two unfair spots, both now fixed: glass right where you land after dropping off a roof (removed), and a crate stair ending three tiles before a gap (moved two tiles earlier). Both had passed the validator's rules.
- **Hidden espresso martini (moved at the owner's request so a straight run never collects it).** It sits on a small floating ledge tucked up in the Wool station canopy, up and to the left of the crate stair (col 71). Its glass just peeks above the canopy roof as a tease. The only way up is to turn back from the top crate (col 74) and jump up-left. The canopy is drawn in front of the player and fades to 35% while you're underneath it. An autopilot run through the level misses it; the up-left jump gets it and drops you straight back onto the course.
- **Chicken-bucket hazard (owner's request).** The broken glass outside The Black Bear is a red-and-white fried-chicken bucket (no branding), just as deadly. Sprite hazards are listed in `HAZARD_SPRITES` in `src/level/LevelLoader.js` (texture and hitbox); the level builder places them with `hazard(kind, col)`.
- **Validator surfaces.** The validator walks the solid stack that stands on the bottom row of each column, so floating ledges don't count as walls on the main path. Ledges get their own reachability check instead.
- **Checkpoint triggers** are full screen height, so a checkpoint can't be jumped over.
- **Texture keys follow the theme:** `pint`, `espresso-martini`, `glass`, `checkpoint` (a railway signal), `finish` (The Avocet's door, 14×26, closed/open frames), `confetti`, `tiles`, `hills`, `easel`, `pub-<id>`, `sign-<text>`.
- **"The Old Granary".** `docs/story.md` spells it "Grainary"; the pub sign uses "Granary". Change `PUBS` in `src/assets.js` if that's wrong.
- **Collectibles.** The registry in `src/entities/Collectible.js` holds `pint` (`counts: true`, shown as collected/total) and `espresso` (`timeBonusMs: 5000`, not in the total, with a pop-up "ESPRESSO MARTINI! -5.0S"). To add a type, add an entry and its texture, then place objects with that `type`.
- **HUD text uses a pixel bitmap font** built at boot from the 3×5 font, drawn at 2× with a baked drop shadow. That's 10 game px tall (20 CSS px on a 640×360 phone), crisp at every integer scale, and legible over both sky and brick. The menu and other screens still use the system font until stage 5 or 7.
- **Timed runs instead of score (owner's change, replacing the brief's points and best score).** The HUD shows the pint counter at top left and a running clock (`m:ss.t`) at top right. The clock runs from the start of the level to the finish and keeps going through deaths and respawns. Final time = clock + 2 s × missed pints − 5 s if the martini was found, never below zero. The penalty is `TIMING.missedPintPenaltyMs` in `config.js`, and the martini bonus is `timeBonusMs` on its registry entry. The maths is in `finalTime()` in `src/systems/GameState.js`.
- **Outfit select (added at the owner's request).** Three Naylor outfits (Casual, Sea Lord, Senior P), looks only, with Casual as the default. The choice is kept for the session (Phaser registry) so PLAY AGAIN keeps the same lad. Nothing is saved between sessions.
- **One text style.** All screens and the HUD now use the pixel bitmap font (`addPixelText`). The system font remains only for the `?debug` readout.
- **Completion.** Touching the finish (a full-height trigger) stops the clock, flashes the screen, lets the lad coast to a stop and shows the Complete screen 1.2 s later. The screen shows the time, the missed-pint penalty, the martini bonus and the final time. `GameScene.finishLocked` holds the finish back until the Train Conductor is beaten (the door shows a padlock while locked).
- **Portrait freeze without a pause feature.** The rotate overlay sleeps Phaser's game loop rather than pausing scenes, because there is no pause feature. On waking it resets the frame delta first, otherwise the first frame back would add all the portrait time to the clock.
- **Boss fight design (owner's choices: resets on death, no time bonus, tickets from the start).** Only a dizzy Conductor can be stomped, so the fight needs nothing beyond left, right and jump. The fight is on the Conductor's train roof (owner's request: fighting him on land after the train made no narrative sense). The level grew by one screen so Parkstone and The Avocet come after the train. The arena has walls on both sides, and beating him frees the camera so you can hop off. When he's dizzy against the left wall he sits behind the semi-transparent left buttons on phones. He's still visible, and moving his stopping point inwards would create a corner that's safe from his dash.
- **Finish door placement.** The finish object shares the pub's column, so the door sprite sits exactly over the pub texture's own door (`FINISH_FRAME` in `src/assets.js`). The Avocet is at col 190, so the door sits about 200 px across the screen when the camera stops at the end of the level, clear of the jump button on phones. The validator requires the finish to be inside or after the end zone.
- **No persistence and no pause (owner's changes).** The brief's localStorage best score and its pause button/overlay (P/Esc) were removed. Nothing is written to storage.
- **Collected items stay collected** across deaths, and the pint count never goes down.
