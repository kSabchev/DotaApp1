// Converts an OpenDota match payload into a loadable SavedDraft.
//
// Two paths:
//  - Captains Mode matches carry a picks_bans array with authentic order —
//    slots are built directly from it (bans included).
//  - Pub / non-CM matches have picks_bans = null; the draft is reconstructed
//    picks-only from the players[] array (side via player_slot), laid out in
//    the manual picks-only order so the analysis engine sees a valid draft.
import type { SavedDraft, DraftSlot, Hero } from '../types';
import type { OpenDotaMatch } from '../services/api';
import { generateId } from './draftStorage';
import { inferRoles } from '../utils/scoring';

export function matchHasCmDraft(match: OpenDotaMatch): boolean {
  return Array.isArray(match.picks_bans) && match.picks_bans.length > 0;
}

function playerIsRadiant(p: { player_slot?: number; isRadiant?: boolean; team_number?: 0 | 1 }): boolean {
  if (typeof p.player_slot === 'number') return p.player_slot < 128;
  if (typeof p.isRadiant === 'boolean') return p.isRadiant;
  return p.team_number === 0;
}

export function savedDraftFromMatch(match: OpenDotaMatch, heroes: Hero[]): SavedDraft {
  const heroById = (id: number | null) => heroes.find(h => h.id === id);

  let slots: DraftSlot[];
  let mode: 'captains' | 'manual';
  let startingTeam: 'radiant' | 'dire';

  if (matchHasCmDraft(match)) {
    // Build slots directly from OpenDota data — phase and team come from the
    // match, NOT from our hardcoded CM order (tournament formats can differ).
    const sorted = [...match.picks_bans!].sort((a, b) => a.order - b.order);
    slots = sorted.map(pb => ({
      phase: (pb.is_pick ? 'pick' : 'ban') as 'pick' | 'ban',
      team: (pb.team === 0 ? 'radiant' : 'dire') as 'radiant' | 'dire',
      heroId: pb.hero_id as number | null,
    }));
    mode = 'captains';
    startingTeam = sorted[0]?.team === 0 ? 'radiant' : 'dire';
  } else {
    // Pub fallback: reconstruct picks-only from the players array, interleaved
    // R,D,R,D… to match MANUAL_PICKS_ONLY_ORDER.
    const players = (match.players ?? []).filter(p => p && p.hero_id > 0);
    const radiant = players.filter(playerIsRadiant).map(p => p.hero_id).slice(0, 5);
    const dire = players.filter(p => !playerIsRadiant(p)).map(p => p.hero_id).slice(0, 5);
    slots = [];
    for (let i = 0; i < Math.max(radiant.length, dire.length); i++) {
      if (i < radiant.length) slots.push({ phase: 'pick', team: 'radiant', heroId: radiant[i] });
      if (i < dire.length) slots.push({ phase: 'pick', team: 'dire', heroId: dire[i] });
    }
    mode = 'manual';
    startingTeam = 'radiant';
  }

  // OpenDota carries no lane data here, so infer a clean 1:1 role assignment
  // per team — otherwise the analysis sees duplicate carries / no mid.
  const heroesOf = (team: 'radiant' | 'dire') =>
    slots
      .filter(s => s.phase === 'pick' && s.team === team && s.heroId !== null)
      .map(s => heroById(s.heroId))
      .filter((h): h is Hero => Boolean(h));
  const roleAssignments = {
    ...inferRoles(heroesOf('radiant')),
    ...inferRoles(heroesOf('dire')),
  };

  return {
    id: generateId(),
    name: `Match ${match.match_id}`,
    notes: '',
    outcome: match.radiant_win ? 'radiant_win' : 'dire_win',
    savedAt: Date.now(),
    slots,
    mode,
    startingTeam,
    roleAssignments,
  };
}
