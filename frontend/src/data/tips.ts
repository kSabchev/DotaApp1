// Curated gameplay tips for the Tips page. Static data — no backend needed.
// heroNames reference short-names (HERO_IDS keys) and render as portrait links
// into the hero encyclopedia.

export type TipCategory = 'drafting' | 'laning' | 'midgame' | 'itemization' | 'map';

export const TIP_CATEGORY_LABEL: Record<TipCategory, string> = {
  drafting: 'Drafting',
  laning: 'Laning',
  midgame: 'Mid Game',
  itemization: 'Itemization',
  map: 'Map & Vision',
};

export interface Tip {
  id: string;
  category: TipCategory;
  title: string;
  body: string;
  heroNames?: string[];
}

export const TIPS: Tip[] = [
  // ── Drafting ──────────────────────────────────────────────────────
  { id: 'draft-greed', category: 'drafting', title: 'Count your farmers', body: 'If three or more of your heroes need farm and space before they contribute, the enemy only has to force early tempo to win. One greedy core is a plan; three is a countdown. Check the Team Identity panel for the greed warning.', heroNames: ['antimage', 'medusa', 'spectre'] },
  { id: 'draft-initiation', category: 'drafting', title: 'Someone has to start the fight', body: 'A draft full of damage with no initiator plays every fight on the enemy\'s terms. Pick at least one hero who can open — a blink initiator, a charge, or a catch ultimate.', heroNames: ['magnataur', 'tidehunter', 'spirit_breaker'] },
  { id: 'draft-damage-mix', category: 'drafting', title: 'Mix your damage types', body: 'A 90% physical draft dies to Assault Cuirass and Ghost Scepters; a 90% magical draft dies to one early Pipe. Check the damage-mix bar before your last two picks.' },
  { id: 'draft-lategame-anchor', category: 'drafting', title: 'Have a "what if it goes late" answer', body: 'You don\'t need five late-game heroes, but you need one. If every hero on your team falls off after 35 minutes, one bad throw ends the game.', heroNames: ['medusa', 'faceless_void'] },
  { id: 'draft-flex-early', category: 'drafting', title: 'Pick flexible heroes early', body: 'First-phase picks should be heroes that can play multiple positions. Committing your carry in pick one hands the enemy five free counter-picks.' },
  { id: 'draft-save-fragile', category: 'drafting', title: 'Save fragile heroes for late picks', body: 'Heroes that die to one specific counter (Medusa, Huskar, Broodmother) should be picked when the enemy can no longer respond. The suggestion panel\'s "save for last" tag tracks this.', heroNames: ['medusa', 'huskar', 'broodmother'] },
  { id: 'draft-ban-comfort', category: 'drafting', title: 'Ban the meta, pick the plan', body: 'Use early bans on the strongest contested meta heroes (the Threats to Ban panel), but don\'t chase every threat — a coherent five-hero plan beats five individually strong picks.' },
  { id: 'draft-frontline', category: 'drafting', title: 'Somebody has to stand in front', body: 'Four ranged damage dealers with no frontline melt the moment anyone jumps them. One tanky initiator or offlaner changes every fight\'s geometry.', heroNames: ['axe', 'centaur', 'mars'] },
  { id: 'draft-counter-window', category: 'drafting', title: 'Read the power windows', body: 'If the enemy draft peaks at 15–25 minutes and yours peaks late, plan to survive their window: defensive picks, wave clear, and buyback discipline beat heroics.' },

  // ── Laning ────────────────────────────────────────────────────────
  { id: 'lane-pull-equilibrium', category: 'laning', title: 'Control the equilibrium, not the kills', body: 'Winning a lane is about where the creeps meet, not first blood. Pull, deny, and keep the wave near your tower — the kills follow from position.' },
  { id: 'lane-trade-cooldowns', category: 'laning', title: 'Trade when their spells are down', body: 'Every lane trade is a cooldown question. If the enemy support just used their stun on a creep or a failed gank, that\'s your window to jump.' },
  { id: 'lane-lotus', category: 'laning', title: 'Contest lotuses in pairs', body: 'The lotus pools spawn every 3 minutes and are worth a fight. Go with your support and treat the pickup like a mini objective — free regen wins attrition lanes.' },
  { id: 'lane-deny-range', category: 'laning', title: 'Melee vs ranged: take the trade on your creeps', body: 'As a melee laner, step up when the enemy walks in to last-hit — attacking creeps means they can\'t attack you back. Trade around your own wave.' },
  { id: 'lane-support-timing', category: 'laning', title: 'Supports: rotate on the 15-second mark', body: 'Runes spawn on odd minutes, catapults come with certain waves, and pulls have fixed timings. A support who tracks the clock creates kills a lane can\'t make alone.' },
  { id: 'lane-courier-snipe', category: 'laning', title: 'Punish greedy couriers', body: 'Mid laners: enemy couriers ferrying regen through your half of the map are worth more than two last hits. One courier kill can decide a mid matchup.' },
  { id: 'lane-double-harass', category: 'laning', title: 'Two heroes harassing beats one hero trading', body: 'In a 2v2 lane, synchronize harass with your lane partner — two simultaneous attacks force regen use twice as fast and set up dive windows before 5 minutes.' },
  { id: 'lane-block-first-wave', category: 'laning', title: 'Block the first wave', body: 'Body-blocking the first creep wave drags the equilibrium toward your tower for the whole first minute — free lane control before a single spell is cast.' },

  // ── Mid game ──────────────────────────────────────────────────────
  { id: 'mid-power-spike-fight', category: 'midgame', title: 'Fight on your item timings', body: 'The five minutes after your core finishes a major item (Blink, BKB, Manta) are the strongest your team will feel until the next one. Force something — a tower, Roshan, a pick.' },
  { id: 'mid-cooldown-fights', category: 'midgame', title: 'Count ultimates before committing', body: 'If your draft fights around big cooldowns (Black Hole, Ravage, RP), never take an even fight without them. The Team Identity panel tells you if that\'s your team.', heroNames: ['enigma', 'tidehunter', 'magnataur'] },
  { id: 'mid-tp-discipline', category: 'midgame', title: 'Carry a TP, always', body: 'The most common mid-game throw is a core without a town portal when a teammate gets caught — or worse, TPing into a lost fight. Carry one; spend it on judgment.' },
  { id: 'mid-objective-after-fight', category: 'midgame', title: 'Convert won fights into objectives', body: 'A won fight with no tower, Roshan, or barracks afterwards is just gold. Before you chase kills across the map, ask what the fight bought you.' },
  { id: 'mid-smoke-timer', category: 'midgame', title: 'Smoke before the enemy\'s timing hits', body: 'If the enemy carry\'s BKB is 500 gold away, that\'s when you smoke and force the fight — not after it\'s finished.' },
  { id: 'mid-split-pressure', category: 'midgame', title: 'Split the map when you can\'t fight', body: 'Behind in fights? Put your split-map heroes on opposite lanes and refuse to group. Every tower they defend is a tower they aren\'t pushing.', heroNames: ['furion', 'antimage', 'broodmother'] },
  { id: 'mid-aegis-timer', category: 'midgame', title: 'Play around the Aegis timer', body: 'An Aegis that expires unused is a wasted Roshan. When your carry holds Aegis, force high-ground or Roshan-area fights inside the 5-minute window.' },

  // ── Itemization ───────────────────────────────────────────────────
  { id: 'item-pipe-stack', category: 'itemization', title: 'Three casters? One early Pipe', body: 'When the enemy has three or more heavy magic dealers, an early Pipe of Insight swings every teamfight. The Items panel escalates it to core automatically.', heroNames: ['zuus', 'lina', 'leshrac'] },
  { id: 'item-detection', category: 'itemization', title: 'Two invis heroes make detection mandatory', body: 'One invisible hero is an inconvenience; two make dedicated detection a team responsibility. Assign sentries and a Dust carrier explicitly — don\'t assume someone else bought it.', heroNames: ['riki', 'clinkz', 'bounty_hunter'] },
  { id: 'item-break', category: 'itemization', title: 'Break turns passives off', body: 'Silver Edge removes Bristleback\'s back, Spectre\'s Dispersion, and PA\'s Blur. Against passive-reliant heroes, one Break carrier is worth more than raw damage.', heroNames: ['bristleback', 'spectre', 'phantom_assassin'] },
  { id: 'item-bkb-timing', category: 'itemization', title: 'BKB is a timing, not a stat stick', body: 'Buy BKB for the fight you need to win, not "eventually." Its duration shrinks with each use — the strongest BKB of the game is the first one.' },
  { id: 'item-anti-heal', category: 'itemization', title: 'Anti-heal beats sustain drafts', body: 'Huskar, Dazzle, Oracle, lifesteal carries — against sustain, a 1,400-gold Spirit Vessel does more than a damage item four times its price.', heroNames: ['huskar', 'dazzle', 'oracle'] },
  { id: 'item-save-items', category: 'itemization', title: 'Supports: buy saves, not damage', body: 'Force Staff, Glimmer Cape, and Lotus Orb each cancel an enemy pick-off. A support\'s save item routinely outvalues a damage item by an entire teamfight.' },
  { id: 'item-armor-vs-physical', category: 'itemization', title: 'Stack armor against physical drafts', body: 'When the enemy damage profile is dominantly physical, armor multiplies your effective HP: Assault Cuirass, Solar Crest, and Ghost Scepter counter entire drafts.' },
  { id: 'item-linken-target', category: 'itemization', title: 'Linken\'s blocks the spell that kills you', body: 'Buy Linken\'s Sphere against decisive single-target spells — Doom, Duel, Charge, Hex. It doesn\'t just block a spell; it makes the enemy initiator hesitate.', heroNames: ['doom_bringer', 'legion_commander', 'spirit_breaker'] },

  // ── Map & vision ──────────────────────────────────────────────────
  { id: 'map-ward-highground', category: 'map', title: 'Ward for the next fight, not the last one', body: 'Place observers where the next objective fight will happen — Roshan, the tower you\'ll siege, the jungle you\'ll invade. Re-warding the same "safe" spot is warding the past.' },
  { id: 'map-dewarding', category: 'map', title: 'Sentries win the vision war', body: 'The team that dewards controls smoke paths and gank routes. Sweep the common highground spots before taking fights there — fighting into vision you don\'t have loses games.' },
  { id: 'map-carry-side', category: 'map', title: 'Farm the side of the map your team controls', body: 'A carry farming the enemy jungle without vision or team presence is a gank invitation. Farm toward your team\'s side, push out the far lane only with TP up.' },
  { id: 'map-show-for-space', category: 'map', title: 'Showing on the map creates space', body: 'Space-creating heroes should be visible — pressuring a lane, threatening a gank. Every second the enemy spends reacting to you is a second your greedy cores farm free.', heroNames: ['axe', 'spirit_breaker', 'dawnbreaker'] },
  { id: 'map-rosh-vision', category: 'map', title: 'Own the Roshan pit before you own Roshan', body: 'Take Roshan when you have vision control around the pit and the enemy is dead, split, or shown elsewhere. Blind Roshan attempts feed wipes.' },
  { id: 'map-night-windows', category: 'map', title: 'Respect night-time power shifts', body: 'Night Stalker, Luna\'s reduced vision, warding sightlines — the map changes at night. Plan aggressive moves for your team\'s strong vision windows.', heroNames: ['night_stalker', 'luna'] },
  { id: 'map-lane-before-b', category: 'map', title: 'Push the wave in before you back', body: 'Leaving a lane without shoving the wave gifts the enemy free farm and denies your team map pressure. Shove, then shop; shove, then rotate.' },
  { id: 'map-glyph-track', category: 'map', title: 'Track enemy glyph and buybacks', body: 'Sieging without knowing the enemy\'s glyph and buyback status is gambling. Both are public information — the team that tracks them takes cleaner objectives.' },
];
