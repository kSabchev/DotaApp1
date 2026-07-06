// Predefined, instantly-loadable showcase drafts. Each teaches one drafting
// archetype the analysis engine can narrate (greed, wombo, deathball, global
// pressure, damage-type stacking). Heroes are authored by short-name and
// resolved through HERO_IDS at module load — a typo throws immediately and is
// caught by the data test, so ids can never silently drift.
import type { Role, SavedDraft, DraftSlot } from './types';
import { HERO_IDS } from './interactions';

export interface ShowcaseDraft {
  id: string;
  title: string;
  event: string;            // grouping label shown above the entry
  teams: { radiant: string; dire: string };
  blurb: string;            // what this draft teaches
  matchId?: number;         // optional real-match reference
  draft: SavedDraft;
}

function resolve(name: string): number {
  const id = HERO_IDS[name];
  if (id === undefined) throw new Error(`showcaseDrafts: unknown hero short-name '${name}'`);
  return id;
}

type PickSpec = [name: string, role: Role];

// Interleave R,D,R,D… to match MANUAL_PICKS_ONLY_ORDER; picks-only, no bans.
function buildDraft(id: string, name: string, radiant: PickSpec[], dire: PickSpec[]): SavedDraft {
  const slots: DraftSlot[] = [];
  const roleAssignments: Record<number, Role> = {};
  for (let i = 0; i < 5; i++) {
    for (const [team, specs] of [['radiant', radiant], ['dire', dire]] as const) {
      const [heroName, role] = specs[i];
      const heroId = resolve(heroName);
      slots.push({ phase: 'pick', team, heroId });
      roleAssignments[heroId] = role;
    }
  }
  return {
    id,
    name,
    notes: '',
    outcome: 'unknown',
    savedAt: 0, // static data — not a real save timestamp
    slots,
    mode: 'manual',
    startingTeam: 'radiant',
    roleAssignments,
  };
}

export const SHOWCASE_DRAFTS: ShowcaseDraft[] = [
  {
    id: 'showcase-wombo',
    title: 'The Wombo Combo',
    event: 'Draft archetypes',
    teams: { radiant: 'Chain-stack AoE', dire: 'Scatter & counter' },
    blurb: 'Radiant stacks layered AoE setups (Reverse Polarity into Echo Slam into God\'s Strength cleave). Watch the Combo Synergies panel light up — and how Dire answers with scatter, silences, and saves.',
    draft: buildDraft('showcase-wombo', 'Showcase: The Wombo Combo',
      [['sven', 'carry'], ['lina', 'mid'], ['magnataur', 'offlane'], ['earthshaker', 'support'], ['crystal_maiden', 'hard_support']],
      [['juggernaut', 'carry'], ['puck', 'mid'], ['tidehunter', 'offlane'], ['silencer', 'support'], ['oracle', 'hard_support']],
    ),
  },
  {
    id: 'showcase-greed',
    title: 'The Greedy Five',
    event: 'Draft archetypes',
    teams: { radiant: 'Five farmers', dire: 'Tempo punish' },
    blurb: 'Radiant drafts five heroes that all want farm and space — the Team Identity panel flags it as too greedy. Dire is built to punish exactly that with early tempo and constant fighting.',
    draft: buildDraft('showcase-greed', 'Showcase: The Greedy Five',
      [['antimage', 'carry'], ['templar_assassin', 'mid'], ['medusa', 'offlane'], ['furion', 'support'], ['silencer', 'hard_support']],
      [['ursa', 'carry'], ['queenofpain', 'mid'], ['night_stalker', 'offlane'], ['spirit_breaker', 'support'], ['lion', 'hard_support']],
    ),
  },
  {
    id: 'showcase-deathball',
    title: 'Deathball vs. Late Game',
    event: 'Draft archetypes',
    teams: { radiant: 'Push as five', dire: 'Survive & outscale' },
    blurb: 'Radiant groups early and takes towers before Dire\'s cores come online. The Game Plan Timeline shows the race: Radiant must end by 30, Dire wins if the game goes long.',
    draft: buildDraft('showcase-deathball', 'Showcase: Deathball vs. Late Game',
      [['lycan', 'carry'], ['death_prophet', 'mid'], ['beastmaster', 'offlane'], ['shadow_shaman', 'support'], ['treant', 'hard_support']],
      [['spectre', 'carry'], ['storm_spirit', 'mid'], ['tidehunter', 'offlane'], ['witch_doctor', 'support'], ['dazzle', 'hard_support']],
    ),
  },
  {
    id: 'showcase-global',
    title: 'The Global Gank Squad',
    event: 'Draft archetypes',
    teams: { radiant: 'Cross-map pressure', dire: 'Split-map rats' },
    blurb: 'Radiant threatens every lane at once — Haunt, Wrath of Nature, Charge, Relocate. Dire tries to play the other side of the map and out-rat them. Map presence vs. map presence.',
    draft: buildDraft('showcase-global', 'Showcase: The Global Gank Squad',
      [['spectre', 'carry'], ['zuus', 'mid'], ['furion', 'offlane'], ['spirit_breaker', 'support'], ['wisp', 'hard_support']],
      [['antimage', 'carry'], ['tinker', 'mid'], ['broodmother', 'offlane'], ['bounty_hunter', 'support'], ['oracle', 'hard_support']],
    ),
  },
  {
    id: 'showcase-damage',
    title: 'Physical Stack vs. Magic Stack',
    event: 'Draft archetypes',
    teams: { radiant: 'All physical', dire: 'All magical' },
    blurb: 'Radiant is pure right-click with armor shred; Dire is pure spell damage. Check the damage-mix bars and the Items panel: one side gets countered by armor stacking, the other by an early Pipe.',
    draft: buildDraft('showcase-damage', 'Showcase: Physical vs. Magic Stack',
      [['phantom_assassin', 'carry'], ['templar_assassin', 'mid'], ['slardar', 'offlane'], ['vengefulspirit', 'support'], ['dazzle', 'hard_support']],
      [['lina', 'carry'], ['leshrac', 'mid'], ['shredder', 'offlane'], ['skywrath_mage', 'support'], ['crystal_maiden', 'hard_support']],
    ),
  },
];
