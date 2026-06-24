// "Free game" analysis: for each of a team's heroes, how free are they to play
// their game given the enemy draft? Some heroes shrug off counters; others are
// unplayable once their counter is on the board.
//
// Counter signal is hybrid:
//   1. hand-curated hero↔hero counters (interactions.ts counterScore + reason)
//   2. mechanic-based — the hero's reliance/vulnerable (heroMechanics.ts) answered
//      by an enemy whose KIT natively provides that mechanic (MECHANIC_PROVIDERS)
// Severity is then weighted by the hero's FRAGILITY (hand tag, else derived from
// its mechanic profile), which is what captures "this hero just can't play into it".
import type { Hero, Fragility, FreedomStatus, HeroCounter, HeroFreedom } from './types';
import type { Mechanic, Reliance } from './mechanics';
import { RELIANCE_ANSWERS, mechanicReason } from './mechanics';
import { HERO_MECHANICS } from './heroMechanics';
import { getCounter } from './interactions';

// ─── Fragility (how hard counters hit this hero) ──────────────────────────────

// Hand overrides for the highest-signal heroes (short-name keyed). Everyone else
// falls back to a profile-derived baseline, then 'normal'.
export const HERO_FRAGILITY: Record<string, Fragility> = {
  // Fragile — greedy / immobile / single-mechanic; a counter ruins the game
  medusa: 'fragile', alchemist: 'fragile', antimage: 'fragile', spectre: 'fragile',
  enigma: 'fragile', witch_doctor: 'fragile', bane: 'fragile', crystal_maiden: 'fragile',
  riki: 'fragile', clinkz: 'fragile', broodmother: 'fragile', huskar: 'fragile',
  meepo: 'fragile', lone_druid: 'fragile', sand_king: 'fragile', tinker: 'fragile',
  // Resilient — tanky / flexible / teamfight; play through their counters
  tidehunter: 'resilient', magnataur: 'resilient', mars: 'resilient', axe: 'resilient',
  centaur: 'resilient', bristleback: 'resilient', dragon_knight: 'resilient',
  abaddon: 'resilient', ogre_magi: 'resilient', pudge: 'resilient', omniknight: 'resilient',
  abyssal_underlord: 'resilient', skeleton_king: 'resilient', doom_bringer: 'resilient',
};

// Heroes whose kit NATIVELY provides a disruption mechanic (no item needed).
// Only mechanics that answer a reliance/vulnerability are useful here.
export const MECHANIC_PROVIDERS: Record<string, Mechanic[]> = {
  silencer: ['silence'], drow_ranger: ['silence'], skywrath_mage: ['silence'],
  night_stalker: ['silence'], bloodseeker: ['silence'], disruptor: ['silence'],
  doom_bringer: ['silence'],
  bounty_hunter: ['detection'], zuus: ['detection'], slardar: ['detection'],
  ancient_apparition: ['heal_reduction'],
  lion: ['hard_control'], naga_siren: ['hard_control'], batrider: ['hard_control'],
  shadow_shaman: ['hard_control'],
  viper: ['break'],
};

const RELIANCE_WEIGHT: Record<Reliance, number> = {
  channel: 2, invisibility: 1.6, single_target_spell: 1.4, regen: 1.3,
  evasion: 1, passive: 0.8, illusions: 0.8, magic_burst: 0.4, right_click: 0.4,
};

function deriveFragility(shortName: string): Fragility {
  // 'resilient' is an editorial call (tankiness/flex the mechanic profile can't see),
  // so it is hand-only — the derivation only separates clearly-fragile from normal.
  const prof = HERO_MECHANICS[shortName];
  if (!prof) return 'normal';
  const reliance = prof.reliance ?? [];
  const vulnerable = prof.vulnerable ?? [];
  const score = reliance.reduce((a, r) => a + (RELIANCE_WEIGHT[r] ?? 0.5), 0) + vulnerable.length * 0.5;
  return score >= 2.6 ? 'fragile' : 'normal';
}

export function getHeroFragility(hero: Hero): Fragility {
  return HERO_FRAGILITY[hero.name] ?? deriveFragility(hero.name);
}

// ─── Free-game analysis ────────────────────────────────────────────────────────

const FRAGILITY_MULT: Record<Fragility, number> = { resilient: 0.65, normal: 1, fragile: 1.4 };
const COUNTER_MIN = 5;        // interaction counterScore floor to count as a counter
const MECH_SEVERITY = 6.5;    // base severity for a mechanic-based counter

// The item-mechanics that answer this hero (from its reliances + direct vulns).
function answeringMechanics(shortName: string): Set<Mechanic> {
  const prof = HERO_MECHANICS[shortName];
  const out = new Set<Mechanic>(prof?.vulnerable ?? []);
  for (const r of prof?.reliance ?? []) for (const m of RELIANCE_ANSWERS[r]) out.add(m);
  return out;
}

function statusFor(counters: HeroCounter[], fragility: Fragility): FreedomStatus {
  if (counters.length === 0) return 'free';
  const sorted = [...counters].sort((a, b) => b.severity - a.severity);
  const disruption = sorted[0].severity + sorted.slice(1).reduce((a, c) => a + c.severity * 0.35, 0);
  const effective = disruption * FRAGILITY_MULT[fragility];
  if (effective < 5) return 'minor';
  if (effective < 10) return 'contested';
  return 'shut_down';
}

function noteFor(status: FreedomStatus, fragility: Fragility, counters: HeroCounter[], name: string): string {
  const top = counters[0]?.enemyName;
  const names = counters.map(c => c.enemyName).join(', ');
  switch (status) {
    case 'free':
      return `${name} has a free game — no drafted counters. Play your standard game.`;
    case 'minor':
      return `${name} is mostly free — ${top} is a minor annoyance you can play around.`;
    case 'contested':
      return `${name} is contested by ${names} — itemise for it and play around their cooldowns.`;
    case 'shut_down':
      return fragility === 'fragile'
        ? `${name} is shut down by ${top} — a fragile hero like this needs that banned or a safer pick.`
        : `${name} is hard-countered by ${names} — be ready to itemise heavily or draft a response.`;
  }
}

export function analyzeHeroFreedom(myPicks: Hero[], enemyPicks: Hero[]): HeroFreedom[] {
  return myPicks.map(hero => {
    const fragility = getHeroFragility(hero);
    const byEnemy = new Map<number, HeroCounter>();

    // 1. Hand-curated hero↔hero counters
    for (const enemy of enemyPicks) {
      const c = getCounter(enemy.id, hero.id);
      if (c && c.score >= COUNTER_MIN) {
        byEnemy.set(enemy.id, { enemyId: enemy.id, enemyName: enemy.displayName, reason: c.reason, severity: c.score });
      }
    }

    // 2. Mechanic-based counters (enemy kit answers this hero's reliance/vuln)
    const answers = answeringMechanics(hero.name);
    if (answers.size > 0) {
      for (const enemy of enemyPicks) {
        const provided = MECHANIC_PROVIDERS[enemy.name];
        if (!provided) continue;
        const hit = provided.find(m => answers.has(m));
        if (!hit) continue;
        const existing = byEnemy.get(enemy.id);
        const reason = `${enemy.displayName} ${mechanicReason(hit, hero.displayName)}`;
        // keep the stronger of the two signals for the same enemy
        if (!existing || existing.severity < MECH_SEVERITY) {
          byEnemy.set(enemy.id, { enemyId: enemy.id, enemyName: enemy.displayName, reason, severity: Math.max(existing?.severity ?? 0, MECH_SEVERITY) });
        }
      }
    }

    const counters = [...byEnemy.values()].sort((a, b) => b.severity - a.severity).slice(0, 3);
    const status = statusFor(counters, fragility);
    return { heroId: hero.id, status, fragility, counters, note: noteFor(status, fragility, counters, hero.displayName) };
  });
}
