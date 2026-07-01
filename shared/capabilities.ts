// Team capability profile — a structured "what this comp can and can't do" vector.
// Each axis aggregates the picked heroes' utilityTags (with diminishing returns,
// capped at 10) and records which heroes drive it. This is the single source of
// truth that win-condition detection and the capability radar both read from.
//
// Phase 1 derives every axis from existing utilityTags (no new hero data). Later
// phases will add damage type, space economy, and Roshan-reliance.
import type { Hero, UtilityTag, CapabilityAxisId, CapabilityAxis, CapabilityProfile } from './types';

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

export const CAPABILITY_LABELS: Record<CapabilityAxisId, string> = {
  teamfight: 'Teamfight',
  pickoff: 'Pick-off',
  gank: 'Gank / Pressure',
  push: 'Push / Siege',
  splitpush: 'Split-push',
  waveClear: 'Wave clear',
  roshan: 'Roshan',
  sustain: 'Sustain / Save',
  enable: 'Enable / Auras',
  scaling: 'Scaling',
  damage: 'Damage',
};

// Short labels for the radar's axis rim (the full labels are too long there).
export const CAPABILITY_SHORT: Record<CapabilityAxisId, string> = {
  teamfight: 'Teamfight', pickoff: 'Pick-off', gank: 'Gank', push: 'Push',
  splitpush: 'Split', waveClear: 'Wave', roshan: 'Rosh', sustain: 'Sustain',
  enable: 'Enable', scaling: 'Scale', damage: 'Dmg',
};

// Display order for the radar (groups related facets next to each other).
export const CAPABILITY_ORDER: CapabilityAxisId[] = [
  'teamfight', 'pickoff', 'gank', 'push', 'splitpush', 'waveClear',
  'roshan', 'sustain', 'enable', 'scaling', 'damage',
];

// Short coaching note per axis, keyed by how strong the team is on it.
function noteFor(id: CapabilityAxisId, score: number): string {
  const tier: 'high' | 'mid' | 'low' = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';
  const N: Record<CapabilityAxisId, Record<'high' | 'mid' | 'low', string>> = {
    teamfight: { high: 'Strong 5v5 — force grouped fights', mid: 'Workable teamfight, needs good initiation', low: 'Weak in 5v5 — avoid grouped fights' },
    pickoff:   { high: 'Excellent at catching isolated heroes', mid: 'Some pick-off potential', low: 'Lacks tools to catch and execute targets' },
    gank:      { high: 'Heavy early roam pressure', mid: 'Moderate early pressure', low: 'Low early pressure — enemy farms freely' },
    push:      { high: 'Takes towers fast as a unit', mid: 'Can siege with setup', low: 'Slow at objectives — struggles to close' },
    splitpush: { high: 'Strong map spread / rat pressure', mid: 'Can split-push situationally', low: 'No split-push threat' },
    waveClear: { high: 'Clears and holds waves easily', mid: 'Adequate wave clear', low: 'Poor wave clear — vulnerable to sieges/illusions' },
    roshan:    { high: 'Takes Roshan early and reliably', mid: 'Can contest Roshan with setup', low: 'Weak Roshan — hard to secure Aegis' },
    sustain:   { high: 'Strong heal/save to survive fights', mid: 'Some sustain and peel', low: 'Fragile — little healing or save' },
    enable:    { high: 'Amplifies allies with buffs/auras', mid: 'Some enabling utility', low: 'Few buffs/auras to enable cores' },
    scaling:   { high: 'Outscales hard into the late game', mid: 'Reasonable late game', low: 'Falls off late — must end early' },
    damage:    { high: 'High burst/sustained damage output', mid: 'Adequate damage', low: 'Low damage threat — fights drag' },
  };
  return N[id][tier];
}

export function computeTeamCapabilities(picks: Hero[], physStack: number): CapabilityProfile {
  // Heroes carrying a given tag (for both counting and contributor lists).
  const withTag = (tag: UtilityTag) => picks.filter(h => h.utilityTags.includes(tag));
  const count = (tag: UtilityTag) => withTag(tag).length;
  const has = (tag: UtilityTag) => count(tag) > 0;
  const idsOf = (tags: UtilityTag[]) => [
    ...new Set(picks.filter(h => tags.some(t => h.utilityTags.includes(t))).map(h => h.id)),
  ];

  // lock / aoe count a hero once if it has EITHER tag (matches the prior
  // win-condition formula so detectWinConditions stays behaviour-preserving).
  const init = count('initiation');
  const lock = picks.filter(h => h.utilityTags.includes('lockdown') || h.utilityTags.includes('stun')).length;
  const aoe = picks.filter(h => h.utilityTags.includes('wave_clear') || h.utilityTags.includes('burst')).length;
  const mob = count('mobility'), tower = count('tower_damage'), wave = count('wave_clear');
  const pressure = count('lane_pressure'), rotate = count('rotate');
  const burst = count('burst'), scaling = count('scaling');
  const heal = count('heal'), save = count('save');
  const enableT = count('enable'), buff = count('buff'), aura = count('aura_carrier');

  // Axis scores — teamfight/push/pickoff/scaling mirror the prior win-condition
  // formulas so detectWinConditions stays behaviour-preserving when it reads these.
  const score: Record<CapabilityAxisId, number> = {
    teamfight: clamp10(init * 3 + lock * 2 + aoe),
    pickoff:   clamp10(mob * 2 + (has('silence') ? 3 : 0) + (has('vision') ? 2 : 0)),
    gank:      clamp10(pressure * 2 + rotate * 2 + burst),
    push:      clamp10(tower * 3 + wave * 2 + pressure * 2),
    splitpush: clamp10(tower * 2 + mob * 2 + (has('global') ? 2 : 0)),
    waveClear: clamp10(wave * 3 + (has('tower_damage') ? 1 : 0)),
    roshan:    clamp10(count('roshan') * 4 + (heal + save > 0 ? 2 : 0) + physStack),
    sustain:   clamp10(heal * 3 + save * 2),
    enable:    clamp10(enableT * 2 + buff * 2 + aura * 2),
    scaling:   clamp10(scaling * 3 + (has('save') ? 2 : 0)),
    damage:    clamp10(burst * 2 + scaling * 2 + physStack),
  };

  const contributors: Record<CapabilityAxisId, number[]> = {
    teamfight: idsOf(['initiation', 'lockdown', 'stun', 'wave_clear', 'burst']),
    pickoff:   idsOf(['mobility', 'silence', 'vision']),
    gank:      idsOf(['lane_pressure', 'rotate', 'burst']),
    push:      idsOf(['tower_damage', 'wave_clear', 'lane_pressure']),
    splitpush: idsOf(['tower_damage', 'mobility', 'global']),
    waveClear: idsOf(['wave_clear']),
    roshan:    idsOf(['roshan']),
    sustain:   idsOf(['heal', 'save']),
    enable:    idsOf(['enable', 'buff', 'aura_carrier']),
    scaling:   idsOf(['scaling']),
    damage:    idsOf(['burst', 'scaling']),
  };

  const profile = {} as CapabilityProfile;
  for (const id of CAPABILITY_ORDER) {
    profile[id] = {
      id, label: CAPABILITY_LABELS[id], score: score[id],
      contributors: contributors[id], note: noteFor(id, score[id]),
    };
  }
  return profile;
}

// Top strengths (score ≥ 7) and gaps (score ≤ 3), for the "Can do / Can't do" summary.
export function capabilityHighlights(profile: CapabilityProfile): { can: CapabilityAxis[]; cant: CapabilityAxis[] } {
  const axes = CAPABILITY_ORDER.map(id => profile[id]);
  return {
    can:  axes.filter(a => a.score >= 7).sort((a, b) => b.score - a.score),
    cant: axes.filter(a => a.score <= 3).sort((a, b) => a.score - b.score),
  };
}
