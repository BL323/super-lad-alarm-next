// Level registry, in crawl order. GameScene takes a level id; the level picker
// lists these; the Complete screen goes on to `next` (null = end of the crawl).
// Only levels that exist go here. `pub` is a key of PUBS in src/assets.js: the
// pub whose door finishes the level. `npm run validate:levels` checks this list
// against the level files.
//
// The six-leg crawl is being built one level at a time
// (docs/vNext-delivery-plan.md). The v1 one-level game lives on at
// BL323/super-lad-alarm.
export const LEVELS = [
  {
    id: 'level-01',
    number: 1,
    from: 'Poole',
    to: 'Dorchester South',
    pub: 'brewhouse',
    mapKey: 'level-01',
    file: 'assets/levels/level-01.json',
    next: null,
  },
];

export const getLevel = (id) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];

/** The level after `id` in the crawl, or null at the end. */
export const nextLevel = (id) => {
  const next = getLevel(id).next;
  return next ? getLevel(next) : null;
};
