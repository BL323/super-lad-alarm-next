# vNext delivery plan

How we get from the v1 game (one level) to the six-level crawl in [vNext-improvements.md](vNext-improvements.md), one playable step at a time.

The game stays playable and deployable after every stage. Each stage is its own branch and pull request, merged to `main` only when its checks pass, so the live site at `bl323.github.io/super-lad-alarm-next/` always works.

## Order

| Stage | Delivers | New systems it introduces |
| --- | --- | --- |
| M | Mobile full screen (independent; can ship before or alongside stage 0) | Fill scaling on touch, wider view, Android full screen, iPhone Home Screen app |
| 0 | Level-based game, still playing the v1 level | Level builders, registry, level picker, next stop screen, crawl timing, per-level theme, boss tunings |
| 1 | Level 1: Poole → Dorchester South (Brewhouse) | Village section, low bridges, sky per level, market crates and kebab |
| 2 | Level 2: Dorchester South → Moreton (Frampton) | Crumbling crates, level crossing, cowpats |
| 3 | Level 3: Moreton → Wool (The Black Bear) | First Conductor fight moved here, thrown objects, high and low roads |
| 4 | Level 4: Wool → Wareham (The Old Granary) | Moving platforms (tank, boats), swans |
| 5 | Level 5: Wareham → Poole (The Rising Sun) | Departing train (auto-scroll), rain, seagulls, ferry, bouncy awnings |
| 6 | Level 6: Poole → Parkstone (The Avocet) | Final Conductor fight, dusk and lamps |
| 7 | Polish | Difficulty pass across all six, docs tidy-up |

Each new system arrives in the first level that needs it. Later levels reuse it, so they get quicker to build.

## Stage M: mobile full screen

This doesn't depend on the levels, so it can ship first: it's the change players will notice straight away. Details are in section 5 of [vNext-improvements.md](vNext-improvements.md).

1. **Fill scaling on touch.** Add a `SCALING` option to fill the space with a non-integer scale on touch devices, keeping integer scaling on desktop. Check that pixels stay sharp enough at 844×390 and 640×360 and on a real phone.
2. **Fix the iPhone meta tags.** Change the status bar style to `black-translucent`, and add `public/manifest.webmanifest` (`display: fullscreen`, `orientation: landscape`) and home-screen icons drawn from the existing art.
3. **Android full screen.** Request full screen and a landscape lock on the START tap, and add a full-screen button on the menu. The portrait freeze (`src/systems/mobile.js`) must still work when it's refused or the player leaves full screen.
4. **Home Screen hint.** Show "Add to Home Screen to play full screen" on the menu in iPhone Safari only, never when it's already running from the Home Screen.
5. **Wider view.** Let the game width follow the screen's shape between 320 and about 400, with height fixed at 180. This is the biggest step: every screen and the HUD lay out from `scale.width`, and the validator's touch-button clearance and end-of-level camera checks use the widest view. It can be split into its own pull request.

### Stage M done when

- On an iPhone opened from the Home Screen, and on Android after tapping START, the game fills the screen with no browser bars and no black bars on a typical phone.
- In a normal Safari tab it fills the space between the browser bars.
- Desktop looks the same as before, and the four standard sizes still pass.

## Stage 0: a level-based game

The aim is to change the structure without changing what the player sees in the level. At the end of this stage the game has the new flow (outfit → level picker → next stop → level → complete) and plays the v1 level exactly as it does now.

### 0.1 One builder per level

`scripts/build-level-01.mjs` currently holds both the building blocks (`platform`, `carriage`, `crates`, `pint`, `hazard`, `boss`, …) and the layout of the one level.

- Move the building blocks and the JSON writer into `scripts/levels/lib.mjs`. Each level gets its own layout file (`scripts/levels/level-01.mjs` … `level-06.mjs`) that imports them.
- Move the v1 layout into `scripts/levels/v1.mjs`, writing `public/assets/levels/v1.json`.
- Replace `build:level` with `npm run build:levels`, which builds and validates every level. `npm run build:levels -- level-03` builds one.
- **Check:** the rebuilt v1 JSON is byte-for-byte the same as today's `level-01.json`, which proves the move changed nothing.

### 0.2 Level registry

`src/level/levels.js` already has a `LEVELS` list with `next` links, and the Complete screen already offers NEXT. Extend each entry with what the new screens need:

```js
{ id: 'level-03', number: 3, from: 'Moreton', to: 'Wool', pub: 'black-bear',
  mapKey: 'level-03', file: 'assets/levels/level-03.json', next: 'level-04' }
```

Only levels that exist go in the list. In stage 0 it holds just the v1 level (as level 1, "Dorchester to Parkstone"). When the new level 1 ships, it replaces the v1 entry (v1 stays playable on the frozen site).

### 0.3 Crawl timing

`GameState` stays per level and `finalTime()` keeps working as it does. On top of that:

- A crawl record in the registry: `{ startLevel, results: [] }`, created when a level is picked, with one `finalTime()` result pushed per finished level.
- A `crawlTotal(results)` helper in `src/systems/GameState.js` that adds up the final times.
- PLAY AGAIN replays the level and replaces its result. MENU discards the crawl. Nothing touches localStorage.

### 0.4 New scenes and flow

Menu → CharacterSelect → **LevelSelect** → **NextStop** → Game(+UI) → Complete → **NextStop** → … → Complete (final).

- **LevelSelect** (`SCENE.LEVEL_SELECT`): one card per registered level showing number, route and pub, working with touch and keys the same way as CharacterSelect.
- **NextStop** (`SCENE.NEXT_STOP`): a short screen, e.g. "NEXT STOP: WOOL · THE BLACK BEAR", that moves on by itself after a moment or on a tap. Its time goes in `config.js`.
- **Complete:** NEXT goes to NextStop rather than straight to the level. On the last level, the screen also shows the total crawl time and the time for each level played.
- New scene keys go in `src/scenes/keys.js`. The current crawl sits in the registry next to `characterId`.

### 0.5 Per-level theme from the map

Today the sky colour and hills are fixed. Let each map's properties set them (`sky`, `hills`, later `weather` and `lamps`), with `LevelLoader` reading them and falling back to today's look. Colours live in `config.js` under a `THEMES` table, and the map names a theme.

### 0.6 Two boss tunings

- Split `BOSS` in `config.js` into `BOSS.first` (today's numbers, unchanged) and `BOSS.final` (copied for now, tuned in stage 6). Move the shared values (body size, exit) into a common block.
- The map's `boss` object names its tuning (`{ kind: 'conductor', tuning: 'first' }`). `BossArena` and `Conductor` take the tuning as a parameter instead of importing `BOSS` directly.
- Phase arrays may be any length, so the final fight can have five phases.

### 0.7 Validator

- Add registry checks to `scripts/validate-levels.mjs`: every registered level has its JSON file, `next` links point at real levels, every level has a spawn and a finish next to its pub, and a level has an `end-zone` if and only if it has a boss.
- Keep `npm run build` failing if any level fails.

### 0.8 Docs

Update `CLAUDE.md` (the builder location and `build:levels` command), the README's Levels and Game flow sections, and its Status table.

### Stage 0 done when

- The v1 level plays the same as before, reached through LevelSelect and NextStop.
- Finishing it shows the per-level time and, because it's the last level, the total.
- `npm run build` passes, and the flow has been checked at 1920×1080, 1280×720, 844×390 and 640×360, by touch (`?touch`) and keyboard.

## Stages 1–6: one level each

Each level stage follows the same steps:

1. **New systems first**, each with its validator rule and a small test layout, so the rule is proven before the real level uses it.
2. **Art** for the level's pub, station signs and scenery, as placeholders in `src/art/placeholders.js` with keys in `src/assets.js`.
3. **Layout** in `scripts/levels/level-0N.mjs`: the station, then the train, then the village up to the pub door. Pints, a hidden martini and checkpoints go in as part of the layout.
4. **Register** the level in `levels.js` and link it from the previous level's `next`.
5. **Play test** with a scripted run under manual frame stepping (`__game.loop.sleep()`, `__game.step()`), then by hand at the four screen sizes. Make sure the start and end are clear of the touch buttons.
6. **Update** the README Status table and Decisions, and record anything that changes the plan in `vNext-improvements.md`.

### Stage 1: Poole → Dorchester South (Brewhouse)

- **Village section.** Street tiles and scenery (houses, shopfronts, lamp posts), and the walk from the station to the pub door. This is the pattern every later level copies.
- **Low bridges and gantries.** Overhead solid beams over the track. The validator learns that a jump under a beam is lower, and that gaps under one must be shorter.
- **Sky per level.** The first use of the stage 0.5 theme: bright morning.
- **Hazards:** market crates (solid, as steps) and a dropped kebab (a sprite hazard in `HAZARD_SPRITES`).
- **Art:** Poole and Dorchester South station signs. The Brewhouse already exists.
- Tutorial pace: no hazards before the village, and the longest train section of the six.
- The new level 1 replaces the v1 level in the registry.

### Stage 2: Dorchester South → Moreton (Frampton)

- **Crumbling crates.** A platform that shakes and drops a set time after you land on it, then comes back after a respawn. The validator treats it as solid for the jump onto it, but never as a resting place.
- **Level crossing.** Barriers come down and a train passes through on a loop. The validator checks that the waiting spot is safe and that there's a long enough gap in each loop to cross.
- **Hazards:** cowpats (sprite hazard). Cows by the line are scenery.
- **Art:** Moreton station sign, the Frampton pub, cows.
- First broken glass and first crate stairs, as in the difficulty curve.

### Stage 3: Moreton → Wool (The Black Bear)

- **First Conductor fight.** The v1 arena and `BOSS.first` move here, on his train between Moreton and Wool, with a checkpoint just before it. The pub door stays locked until he's beaten.
- **Thrown objects.** Pull the ticket throw and floor marker out of `BossArena` into a small shared thrower, then use it for the locals throwing from The Black Bear's windows.
- **High and low roads.** Two routes through the village: rooftops with more pints, or the street. The validator checks that both reach the pub.
- Reuse: the chicken bucket outside The Black Bear, and the angry-locals windows.

### Stage 4: Wool → Wareham (The Old Granary)

- **Moving platforms.** Platforms that move along a fixed path and carry the player: the tank on the road and rowing boats on the river. The validator checks the jumps against the platform's closest and furthest positions.
- **Swans.** Simple patrol enemies on the riverbank. Touching one is a death (through `player.die()`), and they can't be stomped.
- **Art:** Wareham sign, the tank, boats, swans, the Kings Arms as background scenery. The river, easel and The Old Granary already exist.
- Golden afternoon sky.

### Stage 5: Wareham → Poole (The Rising Sun)

- **Departing train.** For a short stretch the camera scrolls on its own as the carriages pull out. Falling behind the left edge is a death. The validator checks the stretch is passable at the scroll speed.
- **Bouncy awnings.** A surface that launches the player higher than a jump, at a fixed bounce from `config.js`. The validator learns the higher reach.
- **Seagulls.** Swoop in a fixed, readable pattern, and are deadly to touch.
- **Ferry.** Reuses the stage 4 moving platform at the harbour.
- **Rain.** A visual particle effect set from the map's `weather` property.
- **Art:** The Rising Sun pub, harbour scenery.
- Hardest platforming of the six.

### Stage 6: Poole → Parkstone (The Avocet)

- **Final Conductor fight**, using `BOSS.final`:
  - five phases (5 stomps)
  - starts at the first fight's top speeds and climbs from there
  - volleys of 4–5 tickets with a shorter flight time
  - shorter wind-up and dizzy times
  - a new intro line
- **Double dash.** A new `Conductor` state, switched on only by the final tuning, in which he sometimes dashes back after hitting a wall. Tune by play testing until it can be beaten without being hit in every phase.
- **Dusk and lamps.** The night theme, with lit street lamps.
- **Art:** Parkstone sign. The Avocet and its door already exist.
- The final Complete screen shows the total crawl time.

## Stage 7: polish

- Play all six in a row and even out the difficulty curve and level lengths.
- Check the total crawl time on the final screen across a full run and a run started partway through.
- Tidy the README (the v1 "Story and theme" table becomes the six-level one) and `CLAUDE.md`.

## Rules that hold throughout

- Movement never changes: left, right and jump only, the same physics for every lad and level. The validator depends on this.
- Every death goes through `player.die()`, and the Player reads only `VirtualInput.state`.
- Numbers go in `src/config.js`, texture and animation keys in `src/assets.js`, scene keys in `src/scenes/keys.js`.
- No new packages and no localStorage.
- Each level's spawn, start and finish stay clear of the touch buttons in the bottom corners.
- Each level's JSON is generated by its builder; don't hand-edit it.
