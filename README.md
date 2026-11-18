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
| vNext stage M: mobile full screen | Steps 1–4 done (fill scaling on touch, Home Screen app, Android full screen, iPhone hint); step 5, the wider view, still to do |
| vNext: six levels | Planned ([docs/vNext-improvements.md](docs/vNext-improvements.md)) |

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
npm run build:level       # regenerate public/assets/levels/level-01.json from scripts/build-level-01.mjs
npm run validate:levels   # check every level against the gap / step-up / hazard rules
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
public/assets/levels/   Tiled JSON levels (level-01.json is generated, see below)
scripts/                level builder and validator (Node, no dependencies)
src/
  main.js               Phaser.Game config and scene list
  config.js             title, resolution, physics, movement and scoring tuning, text style
  assets.js             texture keys, frame layouts and animation names
  style.css             full-viewport, no-scroll, no-gesture page styles
  art/placeholders.js   code-generated placeholder textures
  art/animations.js     every animation, defined once and referenced by name
  art/pixelFont.js      3×5 pixel font for signs painted into textures
  art/bitmapFont.js     the same font as a Phaser bitmap font (HUD text)
  level/levels.js       level registry (id, map key, file, theme, next)
  level/LevelLoader.js  tilemap, collisions, bounds, parallax, decor, hazards; parses objects
  level/validateLevel.js difficulty rules, shared by the CLI script and a dev-only boot check
  scenes/               Boot, Menu, CharacterSelect, Game, UI (HUD and touch buttons), Complete; keys.js holds scene keys
  entities/Player.js    movement, jump feel, animation state machine, die()/respawn()
  entities/Collectible.js collectible type registry and pickup pop
  systems/GameState.js  plain run state (clock, pints, checkpoint) and final-time maths
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

- **Volume:** `AUDIO.volume` in `src/config.js` (master, default 0.6).
- **Replacing a sound:** load a real file under the same key in `BootScene.preload()` and the synth version is skipped.
- **Unlocking:** browsers only allow sound after a tap or key press, and the first tap on START does that.
- **iPhones:** the game asks Safari for "ambient" audio, so it respects the silent switch and doesn't stop the player's own music.

## Testing flags

- `?touch` shows the on-screen buttons on a desktop browser (they only appear on touch devices otherwise).
- `?debug` (dev server only) shows physics bodies and a live readout of the player's state, velocity and floor contact.

## Tuning movement

All movement values live in `PLAYER` in `src/config.js`. Each player copies them to `player.stats`, so they can change at runtime; call `player.applyStats()` after changing the hitbox or fall speed. If you change gravity, jump velocity or run speed, update the jump-height and jump-distance comment in `config.js`, because the level rules (gap and step-up limits) come from them.

Measured in the stage 2 test strip: full speed in 0.23 s, stop in 0.15 s, full jump 47.5 px, tapped jump 21.5 px. Coyote time and jump buffering both work at ~60 ms and correctly reject presses over 100 ms late or early.

## Boss: the Train Conductor

Naylor's arch-nemesis is fought on the roof of his own train, between Wareham and Parkstone (as in `docs/story.md`). The arena is two coupled carriages, one screen long (cols 158–177). Beat him, hop off at Parkstone and walk into The Avocet.

- **Arena.** Jumping up onto his train (the `end-zone`) starts the fight. The camera pans to and locks on that screen, walls close on both sides, the hills race past (the train is moving), and "TICKETS PLEASE!" appears with a CONDUCTOR bar of three health pips. The finish is locked (dimmed) until he's beaten.
- **His cycle:** walk towards you, throwing tickets (from the very first phase) → wind-up (flashes red, red "!" over his head) → dash across the platform → hit the arena edge and go dizzy (stars over his cap) → repeat.
- **Tickets** are lobbed so they land on the player's position after 1.1 s. A dark marker on the floor shows exactly where each will land.
- **Beating him:** land on his cap while he's dizzy. Three stomps win, and he gets faster after each (walk speed, throw rate, tickets per volley, a shorter wind-up and a faster dash). Landing on his cap at other times just bounces you off harmlessly.
- **Dying:** touching him from the side while he walks, winds up or dashes, or being hit by a ticket, goes through the usual `die()`. Any death resets the whole fight (owner's decision): he's back to full health at his start, the walls open, and you respawn at the checkpoint on the embankment beside the track and jump back aboard.
- **Time:** the clock keeps running through the fight. Beating him gives no time bonus (owner's decision).
- **When he's beaten** the final stomp knocks him off the train. He flips and tumbles away from you, out of sight in under a second (`BOSS.exitMs`). "CONDUCTOR BEATEN!" appears, the lad says **"I'M PAYING TO BE HERE"** in a speech bubble (`SPEECH.bossDefeated` in `config.js`), the walls open, the train stops (the hills stop racing), and The Avocet's door at Parkstone unlocks and swings open.
- **The finish is the pub door.** It's padlocked while he's in the arena. Walking into the open door stops the clock. The lad walks inside, "CHEERS!" appears, confetti bursts out of the doorway and rains across the screen, and the Complete screen follows (`FINISH_DELAY_MS`, `CONFETTI` in `config.js`).

All tuning lives in `BOSS` in `src/config.js`, with values per phase.

## Mobile

- **Landscape only.** On a touch device held in portrait, a "ROTATE YOUR PHONE" overlay covers the page and the whole game freezes: rendering, physics and the run clock. Turning back to landscape carries on from the same frame, and no portrait time is added to the clock. Desktop windows never show the overlay.
- **Touch controls:** left and right at bottom left, jump at bottom right. They're 72 CSS px at 640×360 (the brief asks for at least 64), support several fingers at once, and move in away from notches and home bars.
- **Browser gestures blocked:** no scrolling, pull-to-refresh, pinch or double-tap zoom, text selection or long-press menu. This uses CSS `touch-action: none` plus JS listeners, because iOS Safari ignores `user-scalable=no`.
- **Viewport:** `100dvh` and `viewport-fit=cover`, and the canvas re-fits on resize and rotation.
- **Fills the screen on phones.** On touch devices the game uses the largest scale that fits, even when it isn't a whole number (`SCALING.fillOnTouch`). Desktop keeps whole-number scaling.
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

- **Tile layers** `background` (no collision: canopy posts, river), `ground` (every tile collides) and `foreground` (drawn over the player: station canopy). They use the tileset `tiles`, which is the generated `tiles` texture (layout in `src/assets.js`).
- **Object layer `objects`:** `spawn`, at least two `checkpoint`s (property `station`), `collectible`s (property `type`: `pint` or `espresso`), `hazard`s (property `kind`: `glass`, `bucket` or `water`), a `zone` named `end-zone`, an optional `boss` (property `kind`: `conductor`) inside it, a `finish`, and optional `secret` rectangles (the foreground fades while the player is inside). Points for spawn, checkpoints and finish are at the player's feet.
- **Object layer `decor`:** `pub` (property `pub`, an id from `PUBS` in `src/assets.js`), `sign` (property `text`) and `easel`.

Maps are 12 rows (192 px) against a 180 px screen, so the loader shifts everything up 12 px. Only sky is cut off.

`level-01.json` is generated by `scripts/build-level-01.mjs`, which reads like a description of the level (`platform(0, 21)`, `carriage(30, 10)`, `pint(33, 7)`...). Edit that script and run `npm run build:level`. You can also edit the JSON in Tiled, but then stop running the builder for that level so it doesn't overwrite your edits.

**Adding a level:** create its JSON in `public/assets/levels/`, add an entry to `src/level/levels.js`, and set the previous level's `next` to its id. `npm run validate:levels` checks it.

**Validation rules** (from the jump numbers in `config.js`): gaps of at most 3 tiles, step-ups of at most 2 tiles going right, a safe tile at the same height either side of every glass or bucket hazard, every floating ledge reachable (no more than 2 tiles above a surface within 4 columns), one spawn, at least two checkpoints, one finish inside or after a flat `end-zone`, at most one boss (inside the end zone), and no collectibles inside a boss arena (so the missed-pint penalty never punishes the fight). `npm run build` refuses to build if any level fails, and the dev build logs an error at boot.

## Game flow

Boot → Menu → Outfit select → Game (with the UI scene on top) → Complete. On the Complete screen, PLAY AGAIN goes straight back into the level with the same lad and a fresh run; MENU returns to the title (and from there to the selector). If the level registry gives the level a `next`, a NEXT button appears.

| Screen | Touch / mouse | Keyboard |
| --- | --- | --- |
| Menu | START button | Enter / Space |
| Character select | tap a lad, then GO! (or tap the chosen lad again); BACK | ←/→ or A/D, Enter / Space, Esc |
| Game | on-screen buttons | arrows / A D, Space / Up |
| Complete | PLAY AGAIN, MENU | ←/→, Enter / Space, Esc for menu |

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

Background story: [docs/story.md](docs/story.md). Naylor's "Lad Alarm Train Crawl" across Dorset. The story now describes vNext: six levels, one per leg from Poole to Parkstone, with two Conductor fights. The plan is in [docs/vNext-improvements.md](docs/vNext-improvements.md). Until those levels are built, the game is still the v1 level below.

How the story maps onto the v1 level (agreed with the project owner):

| Brief element | In the game |
| --- | --- |
| Start | Dorchester station, Brewhouse pub behind |
| Checkpoint 1 | Wool station, The Black Bear (angry locals in the windows, scenery only) |
| Checkpoint 2 | Wareham station, The Old Granary, then the river (easel floating in it, scenery) |
| Checkpoint 3 | Lineside embankment, just before the Conductor's train |
| `end-zone` | The Train Conductor boss arena: the roof of his train, between Wareham and Parkstone |
| Finish | The Avocet's front door at Parkstone |
| Platforms | Parked British carriages (roof-hopping); gaps between carriages are the jumps |
| Coin | Pint of stout; every one missed adds 2 s to the final time |
| Hazard | Broken glass on platforms and roofs; a fried-chicken bucket outside The Black Bear; the river at Wareham |
| Bonus | One hidden espresso martini; takes 5 s off the final time |

The game title stays **Super Lad Alarm**.

## Decisions

- **Phaser 3.90** (latest 3.x) rather than Phaser 4, as the brief requires Phaser 3.
- **Vite 8.** Phaser is split out with Rolldown's `output.codeSplitting` groups (Vite 8 replaces `manualChunks`).
- **Hosting: GitHub Pages instead of Netlify** (owner's choice, once the repo was made public). Deploys run through GitHub Actions on every push to `main`. `netlify.toml` is kept as a fallback.
- **Node 24.** It is the version installed locally and still an LTS line; `engines` is `>=24` so Node 26 LTS also works. Netlify and the Pages workflow (via `.nvmrc`) build with 24.
- **Fill scaling on touch devices (vNext stage M).** Phones skip the whole-number snap below and use the largest scale that fits, because the snap could waste a third of the screen. Pixel-art (nearest-neighbour) rendering stays on, and uneven pixels are hard to see at phone densities. Desktop is unchanged.
- **Full screen.** Requested only from a tap (START, or the menu's FULL SCREEN button) and only on touch devices that support it, never on desktop. iPhone Safari has no full-screen API for pages, so it gets the Home Screen hint and a web app manifest (`display: fullscreen`, landscape). The icon is the game's own pint drawn by `drawPint()` in `src/art/placeholders.js`, scaled up by a whole number. The old `black-fullscreen` status-bar value wasn't valid; it's now `black-translucent`.
- **Integer scaling** is computed in *device* pixels: the `#game` frame is sized to the largest whole multiple of 320×180 that fits in physical pixels, then Phaser FIT fills that frame. Below 1× it falls back to plain FIT. Examples: 1920×1080 → 6×, 1280×720 → 4×, 844×390 → 2× (640×360 with letterboxing).
- **Placeholder text** uses the system monospace font at 8 px (16 px for titles). It is readable but soft when upscaled; a code-generated pixel font can replace it later without touching callers (`src/ui/text.js`).
- **Scene keys** live in `src/scenes/keys.js`; texture and animation keys in `src/assets.js`.
- **Phaser console banner** is disabled to keep the console clean.
- **Air control.** The brief gives only ground values, so the air has its own: `airAccel` 500 and `airDecel` 300 px/s². This gives slightly less control in the air and keeps momentum through a jump. Turning round uses the larger of acceleration and deceleration.
- **Touch buttons came early.** They were planned for stage 6 and were built in stage 2 because the game is mobile-first. Buttons are 36 game px at 2× scale (72 CSS px, above the brief's 64 px minimum). They grow when the canvas is drawn smaller and move in from safe-area insets. Each has an invisible hit area 12 px larger than the button. Left and right share a border, so a thumb can slide between them.
- **Keep the bottom corners clear.** The touch buttons cover roughly the bottom 42 game px at each side of the screen, which is where the ground runs. Spawn points, and anything the player must see at the very start and end of a level (where the camera stops scrolling), should sit at least ~100 px from the left edge and away from the bottom-right corner.
- **Jump presses are latched** from key and touch events, not polled, so a tap shorter than one frame is never lost.
- **Level authoring.** `level-01.json` is generated from a short Node script rather than drawn in Tiled, because no Tiled install is assumed and the script is easy to review. The output is standard Tiled JSON.
- **Level length and pacing.** 198 tiles (3,168 px, 9.9 screens). Start is Dorchester (cols 0–53), middle is Wool to the embankment (cols 54–123), end is Wareham → the boss train (cols 158–177) → Parkstone (cols 178–197). The middle is about 3.5 screens, a little under the brief's 4–5, so the stations fit evenly. A non-stop run that never stops to collect takes about 23 s; a first-time player collecting pints will take longer.
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
