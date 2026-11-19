# vNext improvements

The v1 game is frozen at [BL323/super-lad-alarm](https://github.com/BL323/super-lad-alarm) (live at `bl323.github.io/super-lad-alarm/`). This repo, `super-lad-alarm-next`, carries the changes below.

## 1. One level becomes six

We are splitting the current single level into multiple levels, each harder than the one before.

Each level is now one leg of the crawl: the journey from one pub to the next. Naylor leaves the last pub, catches a train, hops off at the next station and walks through the local village to the target pub. The level ends at that pub's door.

### The route

| Level | Depart | Arrive | Target pub |
| --- | --- | --- | --- |
| 1 | Poole | Dorchester South | Brewhouse |
| 2 | Dorchester South | Moreton | Frampton |
| 3 | Moreton | Wool | The Black Bear |
| 4 | Wool | Wareham | The Old Granary |
| 5 | Wareham | Poole | The Rising Sun |
| 6 | Poole | Parkstone | The Avocet |

The crawl now starts and ends near Poole, and it runs west to Dorchester first and then back east along the line.

### What each level contains

Every level has the same three parts, so the player learns the pattern:

1. **Station.** Start on the platform of the departure station, with its sign.
2. **Train.** Hop along parked or moving British carriages, as in v1.
3. **Village.** Get off at the arrival station and make your way through the village streets to the target pub's door. This part is new: v1 had only short station areas.

### Difficulty curve

| Level | Leg | Difficulty ideas |
| --- | --- | --- |
| 1 | Poole → Dorchester South | Tutorial pace: flat platforms, small gaps, no hazards until the village. The longest leg, so the longest train section. |
| 2 | Dorchester South → Moreton | First hazards (broken glass), first crate stairs. |
| 3 | Moreton → Wool | Wider gaps, the chicken bucket and angry locals at The Black Bear. **First Conductor fight** on his train roof between Moreton and Wool: the v1 fight, unchanged. |
| 4 | Wool → Wareham | The river at Wareham (the easel floating in it), more hazards on roofs. The Kings Arms appears in the background on the way to The Old Granary. |
| 5 | Wareham → Poole | Hardest platforming: long runs of gaps, mixed heights. |
| 6 | Poole → Parkstone | **Final Conductor fight**, a harder rematch on his train roof, then a short walk to The Avocet. |

Each level keeps its own pints and can hide its own espresso martini.

### The Train Conductor, twice

**Level 3: first fight.** The existing v1 fight moves here as it is: three stomps, tickets from the start, a whistle wind-up, then a dash that leaves him dizzy against the arena wall. Any death during the fight resets it. This teaches the pattern halfway through the crawl.

**Level 6: final fight.** He's back for revenge, with the same moves so it still needs only left, right and jump, but everything is tighter:

- **More hits:** 5 stomps instead of 3, with a new fourth and fifth phase.
- **Faster from the start:** his walk speed, throw rate and dash speed begin where the first fight ended and climb from there.
- **Bigger volleys:** up to 4–5 tickets, and they land sooner (shorter flight time), so there's less time to read the floor markers.
- **Shorter warnings:** a shorter whistle wind-up before each dash.
- **Smaller stomp window:** he recovers from being dizzy sooner.
- **Double dash (later phases):** after hitting one wall he sometimes dashes straight back before getting dizzy, so the player can't just wait in the far corner. *(Built in stage 6: after a dash back he stays dizzy longer, 2 s instead of 1.25 s, because he ends up at the far wall and you have to run after him. Without that, play testing showed you could survive a dash back but rarely stomp him.)*
- **New intro line**, e.g. "TICKETS PLEASE! AGAIN!", so it's clear it's a rematch.

The exact numbers get tuned by play testing, the same way the first fight was. The final fight must still be beatable without taking a hit on every phase, and the rule that he can only be stomped while dizzy stays.

### Difficulty and novelty

Every idea here uses only left, right and jump.

**Using today's physics and validator**

- **Time of day.** The sky shifts from level to level as the crawl goes on: bright morning at Poole, golden afternoon at Wareham, dusk back at Poole, and street lamps lit at Parkstone. Visual only.
- **Low bridges and gantries.** Overhead beams on the train sections cap jump height, so the player has to use short hops instead of full jumps.
- **High road or low road.** Village sections offer a rooftop route and a street route. The riskier one has more pints, so the missed-pint penalty makes it a real choice.
- **Local hazards:**
  - *Dorchester:* market-stall crates and a dropped kebab.
  - *Moreton:* cows by the line, and cowpats as floor hazards.
  - *Wool:* angry locals throwing things from The Black Bear's windows. This reuses the Conductor's ticket volleys, with landing markers.
  - *Wareham:* swans on the riverbank.
  - *Poole:* seagulls swooping in a set pattern.
- **Weather.** A rain shower on one leg, with puddle splashes. Visual only.
- **Collectibles.** Pint trails that hint at hidden routes, and a martini that's harder to find in each level.

**Needing new code and validator updates**

- **Moving platforms:**
  - *Wool:* a tank, from the nearby Bovington Tank Museum, rumbling along a road you ride across.
  - *Wareham:* rowing boats on the river.
  - *Poole:* a harbour ferry.
- **Departing train.** On one level the carriages pull away, and the player has to get aboard before the platform runs out. The camera auto-scrolls for a short stretch.
- **Crumbling platforms.** Rotten crates or boards that drop a moment after you land on them.
- **Bouncy awnings.** Shop awnings in the village that launch you higher.
- **Level crossing.** Barriers come down and a train passes; wait for it, or time a jump through the gap.

**Ruled out:** controls that get wobbly as Naylor drinks. Movement stays the same for every lad and every level (the validator depends on it). A gentle visual sway of the screen is fine.

**By level**

| Level | Novelty |
| --- | --- |
| 1 Poole → Dorchester South | Tutorial; bright morning; first low bridge; market crates and a kebab in Dorchester |
| 2 Dorchester South → Moreton | Cows and cowpats; level crossing; first crumbling crates |
| 3 Moreton → Wool | Thrown objects from The Black Bear; high and low roads; first Conductor fight |
| 4 Wool → Wareham | Tank ride; boats and swans on the river; golden afternoon |
| 5 Wareham → Poole | Departing train; rain; seagulls and the ferry at the harbour; bouncy awnings |
| 6 Poole → Parkstone | Dusk and lamps; final Conductor fight |

## 2. Decisions

- **Two different Brewhouse-style pubs.** Level 1 ends at the Brewhouse in Dorchester (the existing art). Level 5 ends at The Rising Sun in Poole, a new pub with its own look and sign.
- **No train times in the game.** The timetable only sets the route. Stations show their name, not departure times.
- **Timing: per level and in total.** Each level's Complete screen shows that level's time (clock + 2 s per missed pint − martini bonus, as in v1). After level 6, the final screen also shows the total crawl time, the sum of the level times played. Still no saving: nothing is stored between sessions.
- **Level picker at the start.** Players can choose any of the six levels from the menu. Starting at level 1 plays the full crawl; starting later plays on from that level to the end, and the total covers the levels played.
- **"Next stop" screen between levels.** A short screen before each level, e.g. "NEXT STOP: WOOL · THE BLACK BEAR".
- **The Old Granary stays at Wareham** as the level 4 destination. **The Kings Arms** is added as background scenery at Wareham only.
- **Two Conductor fights.** The v1 fight moves to level 3, and a harder rematch is the final boss in level 6.
- **Every level gets its own novelty** (see "Difficulty and novelty"), but movement never changes: left, right and jump only, the same physics everywhere.

## 3. Changes from v1

| v1 | vNext |
| --- | --- |
| One level, Dorchester → Parkstone | Six levels, Poole → … → Parkstone |
| Starts at Dorchester, Brewhouse | Starts at Poole; Brewhouse is the target of level 1 |
| Wool, Wareham and the boss train are checkpoints | Each station is a level start or end; checkpoints sit inside levels |
| No Moreton stop | New stop: Moreton, Frampton |
| No pub at Poole | New pub: The Rising Sun, Poole |
| Wareham: The Old Granary | Wareham: The Old Granary, with the Kings Arms as scenery |
| One Conductor fight, at the end | Two fights: the v1 fight in level 3, a harder rematch in level 6 |
| Stations are short platform areas | Each level ends with a walk through the village to the pub |
| Menu → outfit select → the level | Menu → outfit select → level picker → next stop screen → level |
| Complete screen → Play again | Complete screen → next stop screen → next level; total time after level 6 |

`docs/story.md` and the README "Story and theme" table need updating to match.

## 4. Technical work

- **Levels.** `scripts/build-level-01.mjs` becomes a builder per level (or one script that builds them all), each run through the validator by `npm run build:level`. Register them all in `src/level/levels.js`.
- **Scene flow.** Menu → CharacterSelect → LevelSelect → NextStop → Game(+UI) → Complete → NextStop → … → Complete (final, with the total). New scene keys go in `src/scenes/keys.js`. The current level and the level times so far go in the registry next to `characterId`.
- **Timing.** `finalTime()` in `src/systems/GameState.js` stays per level; add a total that sums the level times for the run.
- **Boss.** Levels 3 and 6 each include a `BossArena`; the other builders must not. The level's map says which fight it is. `BOSS` in `src/config.js` becomes two tunings (e.g. `BOSS.first` and `BOSS.final`, with arrays long enough for the final fight's five phases). `Conductor` gets the double dash, enabled only by the final tuning.
- **New art.** Pubs: Frampton, The Rising Sun, and the Kings Arms (scenery only). Station signs: Poole, Dorchester South, Moreton. Village street scenery: houses, shopfronts, lamp posts.
- **Validator.** It has to understand the new pieces before levels use them: overhead beams (a lower jump ceiling), moving platforms (tank, boats, ferry), crumbling platforms, awning bounces, the level crossing's timing and the auto-scroll stretch. All of their tuning goes in `src/config.js`.
- **New hazards.** Cowpats, kebab and crates use the sprite-hazard list (`HAZARD_SPRITES`). Swans and seagulls need simple patrol and swoop movement. The Black Bear's throwers reuse the ticket-volley code.
- **Sky and weather.** Per-level sky colours and a lamp-lit night look, plus a rain effect, are set in each level's map properties.
- **Touch buttons.** Every level's start and end must stay clear of the bottom corners, as in v1. The level picker must work by touch.

## 5. Mobile full screen

On phones the game doesn't fill the screen: it sits in a box with black bars on every side, under the browser's address and tab bars. There are three causes:

1. **Integer scaling.** `src/systems/Scaling.js` snaps the game to a whole multiple of 320×180 in device pixels, which keeps pixels crisp but can leave a lot of unused space. On a phone it often lands a whole step below what would fit.
2. **Fixed 16:9 shape.** Modern phones are about 19.5:9 in landscape, so even a perfect fit leaves bars at the sides.
3. **Browser bars.** The page never asks for full screen. On iPhone, Safari can't make a page full screen, so the only way to lose the bars there is to add the game to the Home Screen. The page has no web app manifest or icon for that, and `apple-mobile-web-app-status-bar-style` is set to `black-fullscreen`, which isn't a valid value.

What we'll change:

- **Fill on touch devices.** Use the largest scale that fits, even when it isn't a whole number, while keeping pixel-art (nearest-neighbour) rendering. On high-density phone screens uneven pixels are hard to see. Desktop keeps integer scaling. This becomes a setting in `SCALING` in `config.js`.
- **Wider view on wide screens.** Keep the height at 180 and let the width grow with the screen's shape (from 320 up to about 400), so a phone shows more of the level instead of side bars. Menus, the HUD and the touch buttons lay out from the actual width rather than a fixed `GAME_WIDTH`. Level ends, the boss arena camera lock and the touch-button clearance rules are rechecked for the widest view.
- **Full screen on Android.** The first tap (START) asks the browser to go full screen and lock to landscape where it's allowed, and the game copes if it's refused. A small full-screen button on the menu lets the player go back in after leaving.
- **Home Screen app on iPhone.** Add a web app manifest (`display: fullscreen`, landscape, theme colours) and home-screen icons, and fix the status-bar meta tag to `black-translucent`. The menu shows a short "Add to Home Screen to play full screen" hint in iPhone Safari only. Opened from the Home Screen, the game runs with no browser bars.
- **Safe areas.** With the bars gone the game reaches the notch and the rounded corners, so the touch buttons and HUD keep using the safe-area insets (as they already do).
