// Level registry, in crawl order. GameScene takes a level id; the level picker
// lists these; the Complete screen goes on to `next` (null = end of the crawl).
// Only levels that exist go here. `pub` is a key of PUBS in src/assets.js: the
// pub whose door finishes the level. `npm run validate:levels` checks this list
// against the level files.
//
// Until the six-leg crawl is built (docs/vNext-delivery-plan.md), the only
// level is v1: the whole crawl in one level.
export const LEVELS = [
  {
    id: 'v1',
    number: 1,
    from: 'Dorchester',
    to: 'Parkstone',
    pub: 'avocet',
    mapKey: 'v1',
    file: 'assets/levels/v1.json',
    next: null,
  },
];

export const getLevel = (id) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];

/** The level after `id` in the crawl, or null at the end. */
export const nextLevel = (id) => {
  const next = getLevel(id).next;
  return next ? getLevel(next) : null;
};
