// Item-matchup engine. Given a team and its opponents, it answers:
//   recommended — items MY team should build to neutralise enemy heroes
//   threats     — items the ENEMY will build to neutralise MY heroes
//
// It never hard-codes hero×item pairs: each enemy hero's reliance/vulnerable
// mechanics (heroMechanics.ts) are mapped to the items that provide the
// answering mechanic (items.ts), then assigned to a plausible buyer role.
import type { Hero, MetaRole, Role } from './types';
import { getHeroMechanics } from './heroMechanics';
import { RELIANCE_ANSWERS, mechanicReason, type Mechanic } from './mechanics';
import { ITEMS, itemIconUrl, itemsProviding, type ItemDef } from './items';

export interface ItemAnswer {
  heroId: number;
  heroName: string;
  mechanic: Mechanic;
  reason: string; // "pierces Phantom Assassin's evasion"
}

export interface ItemRec {
  itemId: string;
  itemName: string;
  iconUrl: string;
  buyerRole: Role;
  buyerInTeam: boolean;   // is there a hero on the team who naturally builds it?
  priority: 'core' | 'situational';
  answers: ItemAnswer[];  // which enemy heroes it answers, and why
  stackedNote?: string;   // set when the enemy stacks a threat this item answers en masse
}

export interface ItemMatchups {
  recommended: ItemRec[];
  threats: ItemRec[];
}

const META_TO_ROLE: Record<MetaRole, Role> = {
  pos1: 'carry', pos2: 'mid', pos3: 'offlane', pos4: 'support', pos5: 'hard_support', flex: 'support',
};

function heroRole(h: Hero): Role {
  if (h.metaRole) return META_TO_ROLE[h.metaRole];
  return h.preferredRoles?.[0] ?? 'carry';
}

// Choose one representative item for a mechanic. Prefer items whose *defining*
// (first-listed) mechanic is this one — so anti-heal → Spirit Vessel, not Shiva's
// — then one a team role can actually build.
function pickItemForMechanic(m: Mechanic, teamRoles: Set<Role>): ItemDef | undefined {
  const options = itemsProviding(m);
  const primary = options.filter(it => it.mechanics[0] === m);
  const pool = primary.length ? primary : options;
  return pool.find(it => it.builtBy.some(r => teamRoles.has(r))) ?? pool[0];
}

function pickBuyer(item: ItemDef, teamRoles: Set<Role>): { role: Role; inTeam: boolean } {
  const r = item.builtBy.find(role => teamRoles.has(role));
  return r ? { role: r, inTeam: true } : { role: item.builtBy[0], inTeam: false };
}

// Items MY team should build to answer the enemy team.
function recommendItems(myPicks: Hero[], enemyPicks: Hero[]): ItemRec[] {
  const teamRoles = new Set(myPicks.map(heroRole));
  const recs = new Map<string, ItemRec>();

  for (const e of enemyPicks) {
    const prof = getHeroMechanics(e.name);
    const mechs = new Map<Mechanic, 'core' | 'situational'>();
    for (const rel of prof.reliance ?? []) {
      for (const m of RELIANCE_ANSWERS[rel]) if (!mechs.has(m)) mechs.set(m, 'core');
    }
    for (const m of prof.vulnerable ?? []) if (!mechs.has(m)) mechs.set(m, 'situational');

    for (const [m, prio] of mechs) {
      const item = pickItemForMechanic(m, teamRoles);
      if (!item) continue;
      let rec = recs.get(item.id);
      if (!rec) {
        const buyer = pickBuyer(item, teamRoles);
        rec = {
          itemId: item.id, itemName: item.name, iconUrl: itemIconUrl(item.id),
          buyerRole: buyer.role, buyerInTeam: buyer.inTeam,
          priority: 'situational', answers: [],
        };
        recs.set(item.id, rec);
      }
      if (!rec.answers.some(a => a.heroId === e.id && a.mechanic === m)) {
        rec.answers.push({ heroId: e.id, heroName: e.displayName, mechanic: m, reason: mechanicReason(m, e.displayName) });
      }
      if (prio === 'core') rec.priority = 'core';
    }
  }

  // Stacked-threat escalation: when one item answers several enemy heroes at
  // once, it stops being situational — three heavy casters make an early Pipe
  // core, two invis heroes make dedicated detection mandatory.
  for (const rec of recs.values()) {
    const answered = new Set(rec.answers.map(a => a.heroId)).size;
    const mechs = new Set(rec.answers.map(a => a.mechanic));
    const isDetection = mechs.has('detection');
    const isMagicBarrier = mechs.has('magic_barrier');
    const threshold = isDetection || isMagicBarrier ? 2 : 3;
    if (answered >= threshold) {
      rec.priority = 'core';
      const heroNames = [...new Set(rec.answers.map(a => a.heroName))].join(', ');
      if (isDetection) {
        rec.stackedNote = `${answered} invis heroes (${heroNames}) — dedicated detection is mandatory.`;
      } else if (isMagicBarrier) {
        rec.stackedNote = `${answered} heavy magic dealers (${heroNames}) — an early ${rec.itemName} swings every fight.`;
      } else {
        rec.stackedNote = `Answers ${answered} enemy heroes at once (${heroNames}) — one slot, team-wide value.`;
      }
    }
  }

  return [...recs.values()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'core' ? -1 : 1;
    return b.answers.length - a.answers.length;
  });
}

// ─── Per-hero inverse lookup: which items counter THIS hero? ──────────────────
// Used by the hero encyclopedia. Unlike recommendItems (one representative item
// per mechanic for a specific team), this lists EVERY answering item so the
// reader sees the full toolbox: break for Bristleback, MKB for PA, and so on.

export interface HeroCounterItem {
  item: ItemDef;
  mechanic: Mechanic;
  reason: string;   // "breaks Bristleback's passive"
  priority: 'core' | 'situational';
}

export function itemsThatCounter(hero: Hero): HeroCounterItem[] {
  const prof = getHeroMechanics(hero.name);
  const out: HeroCounterItem[] = [];
  const seen = new Set<string>(); // itemId+mechanic

  const add = (m: Mechanic, priority: 'core' | 'situational') => {
    for (const item of itemsProviding(m)) {
      const key = `${item.id}:${m}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ item, mechanic: m, reason: mechanicReason(m, hero.displayName), priority });
    }
  };

  for (const rel of prof.reliance ?? []) {
    for (const m of RELIANCE_ANSWERS[rel]) add(m, 'core');
  }
  for (const m of prof.vulnerable ?? []) add(m, 'situational');

  return out.sort((a, b) => (a.priority !== b.priority ? (a.priority === 'core' ? -1 : 1) : 0));
}

export function computeItemMatchups(myPicks: Hero[], enemyPicks: Hero[]): ItemMatchups {
  return {
    recommended: recommendItems(myPicks, enemyPicks),
    threats: recommendItems(enemyPicks, myPicks), // symmetric: what they build vs you
  };
}

// Re-exports for callers/UI.
export { itemIconUrl, ITEMS };
