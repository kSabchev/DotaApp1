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

  return [...recs.values()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'core' ? -1 : 1;
    return b.answers.length - a.answers.length;
  });
}

export function computeItemMatchups(myPicks: Hero[], enemyPicks: Hero[]): ItemMatchups {
  return {
    recommended: recommendItems(myPicks, enemyPicks),
    threats: recommendItems(enemyPicks, myPicks), // symmetric: what they build vs you
  };
}

// Re-exports for callers/UI.
export { itemIconUrl, ITEMS };
