import type { DraftSlot, DraftTeam } from '../types';

// Base CM order — 'radiant' = the team with first ban and first pick.
// Format as of patch 7.35+: 14 bans (7 per team) + 10 picks = 24 slots.
// Verified against OpenDota match data (match 8860337807).
//
// Phase 1 bans (7):  S S N N S N N  (starter gets 3, non-starter gets 4)
// Phase 1 picks (2): S N
// Phase 2 bans (3):  S S N
// Phase 2 picks (6): N S S N N S
// Phase 3 bans (4):  S N S N
// Phase 3 picks (2): S N
const CM_BASE: Omit<DraftSlot, 'heroId'>[] = [
  // Phase 1 bans (7): starter×3, non-starter×4
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'dire' },
  { phase: 'ban', team: 'dire' },
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'dire' },
  { phase: 'ban', team: 'dire' },
  // Phase 1 picks (2): one each
  { phase: 'pick', team: 'radiant' },
  { phase: 'pick', team: 'dire' },
  // Phase 2 bans (3): starter×2, non-starter×1
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'dire' },
  // Phase 2 picks (6): non-starter, starter×2, non-starter×2, starter
  { phase: 'pick', team: 'dire' },
  { phase: 'pick', team: 'radiant' },
  { phase: 'pick', team: 'radiant' },
  { phase: 'pick', team: 'dire' },
  { phase: 'pick', team: 'dire' },
  { phase: 'pick', team: 'radiant' },
  // Phase 3 bans (4): alternating, starter first
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'dire' },
  { phase: 'ban', team: 'radiant' },
  { phase: 'ban', team: 'dire' },
  // Phase 3 picks (2): one each, starter first
  { phase: 'pick', team: 'radiant' },
  { phase: 'pick', team: 'dire' },
];

function flip(team: DraftTeam): DraftTeam {
  return team === 'radiant' ? 'dire' : 'radiant';
}

export function buildCaptainsModeOrder(startingTeam: DraftTeam = 'radiant'): Omit<DraftSlot, 'heroId'>[] {
  if (startingTeam === 'radiant') return CM_BASE;
  return CM_BASE.map(s => ({ ...s, team: flip(s.team) }));
}

// Keep a default export for backward compatibility
export const CAPTAINS_MODE_ORDER = CM_BASE;

export const MANUAL_ORDER: Omit<DraftSlot, 'heroId'>[] = [
  // 5 bans then 5 picks per team for simplicity
  ...Array.from({ length: 5 }, () => [
    { phase: 'ban' as const, team: 'radiant' as const },
    { phase: 'ban' as const, team: 'dire' as const },
  ]).flat(),
  ...Array.from({ length: 5 }, () => [
    { phase: 'pick' as const, team: 'radiant' as const },
    { phase: 'pick' as const, team: 'dire' as const },
  ]).flat(),
];

export const MANUAL_PICKS_ONLY_ORDER: Omit<DraftSlot, 'heroId'>[] = Array.from({ length: 5 }, () => [
  { phase: 'pick' as const, team: 'radiant' as const },
  { phase: 'pick' as const, team: 'dire' as const },
]).flat();
