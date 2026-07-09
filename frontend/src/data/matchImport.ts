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

// OpenDota synthesizes a picks_bans array even for non-draft modes (ranked All
// Pick ban votes, Turbo pick order), so its presence alone doesn't mean the
// match had a real draft. Use the picks_bans path only for actual draft modes —
// Captains Mode (2) and Captains Draft (16); everything else reconstructs
// picks-only from the players array. Unknown game_mode (older payloads) keeps
// the old presence-based behavior.
const DRAFT_GAME_MODES = new Set([2, 16]);

export function usesCmDraftPath(match: OpenDotaMatch): boolean {
  if (!matchHasCmDraft(match)) return false;
  if (match.game_mode === undefined) return true;
  return DRAFT_GAME_MODES.has(match.game_mode);
}

// ── Imported-match scoreboard ─────────────────────────────────────────────────
// The draft slots only need hero ids, but an imported real match also carries
// the outcome and per-player performance — captured here at import time and
// shown in a collapsible panel above the draft analysis.

export interface ImportedPlayerStats {
  heroId: number;
  isRadiant: boolean;
  playerName: string | null;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  level: number | null;
  itemIds: number[];   // final inventory (empty slots filtered out)
}

export interface ImportedMatchInfo {
  matchId: number;
  radiantWin: boolean;
  durationSec: number;
  radiantScore: number | null;
  direScore: number | null;
  radiantTeamName: string | null;
  direTeamName: string | null;
  leagueName: string | null;
  players: ImportedPlayerStats[];
}

export function buildImportedMatchInfo(match: OpenDotaMatch): ImportedMatchInfo {
  const players: ImportedPlayerStats[] = (match.players ?? [])
    .filter(p => p && p.hero_id > 0)
    .map(p => ({
      heroId: p.hero_id,
      isRadiant: playerIsRadiant(p),
      playerName: p.personaname ?? null,
      kills: p.kills ?? 0,
      deaths: p.deaths ?? 0,
      assists: p.assists ?? 0,
      gpm: p.gold_per_min ?? 0,
      xpm: p.xp_per_min ?? 0,
      level: p.level ?? null,
      itemIds: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5]
        .filter((id): id is number => typeof id === 'number' && id > 0),
    }));

  return {
    matchId: match.match_id,
    radiantWin: match.radiant_win,
    durationSec: match.duration ?? 0,
    radiantScore: match.radiant_score ?? null,
    direScore: match.dire_score ?? null,
    radiantTeamName: match.radiant_team?.name ?? null,
    direTeamName: match.dire_team?.name ?? null,
    leagueName: match.league?.name ?? null,
    players,
  };
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

  if (usesCmDraftPath(match)) {
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
