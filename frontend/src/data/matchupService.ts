// Fetches win-rate based matchup data from OpenDota (via backend proxy).
// Returns advantage scores in [-5, +5] derived from win rate delta vs 50%.
// Results are cached in memory for the session.
import { API_BASE as BACKEND } from '../config';

interface OpenDotaMatchup {
  hero_id: number;
  games_played: number;
  wins: number;
}

// heroId → Map<enemyId, advantage>
const cache = new Map<number, Map<number, number>>();
const pending = new Map<number, Promise<void>>();
let version = 0; // bumped each time a hero's matchups finish loading

const MIN_GAMES = 500; // ignore matchups with too few samples

// Monotonic counter — include in memo deps to recompute analysis as live data streams in.
export function getMatchupsVersion(): number {
  return version;
}

function toAdvantage(winRate: number): number {
  // wr 0.60 → +5, wr 0.55 → +2.5, wr 0.50 → 0, wr 0.45 → -2.5, wr 0.40 → -5
  const delta = (winRate - 0.5) * 100; // -50 to +50 percentage points
  return Math.max(-5, Math.min(5, Math.round(delta / 5)));
}

async function fetchMatchups(heroId: number): Promise<void> {
  try {
    const res = await fetch(`${BACKEND}/heroes/${heroId}/matchups`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const data: OpenDotaMatchup[] = await res.json();
    const map = new Map<number, number>();
    for (const m of data) {
      if (m.games_played < MIN_GAMES) continue;
      const wr = m.wins / m.games_played;
      map.set(m.hero_id, toAdvantage(wr));
    }
    cache.set(heroId, map);
    version++;
  } catch {
    // Network unavailable — leave cache empty for this hero
  }
}

export function primeMatchups(heroIds: number[]): void {
  for (const id of heroIds) {
    if (cache.has(id) || pending.has(id)) continue;
    const p = fetchMatchups(id).finally(() => pending.delete(id));
    pending.set(id, p);
  }
}

// Returns win-rate-derived lane advantage: positive = heroId favoured vs enemyId.
// Falls back to 0 if data isn't loaded yet.
export function getApiMatchupAdvantage(heroId: number, enemyId: number): number {
  return cache.get(heroId)?.get(enemyId) ?? 0;
}

// Returns the top N most dangerous available heroes against myPickIds,
// scored purely by win-rate data (no static interaction needed).
export function getApiCounterThreats(
  myPickIds: number[],
  availableIds: number[],
  topN = 8,
): { heroId: number; score: number; winRateNote: string }[] {
  const results: { heroId: number; score: number; winRateNote: string }[] = [];

  for (const availId of availableIds) {
    let totalAdv = 0;
    let count = 0;
    for (const myId of myPickIds) {
      const adv = getApiMatchupAdvantage(availId, myId);
      if (adv !== 0) { totalAdv += adv; count++; }
    }
    if (count === 0) continue;
    const avgAdv = totalAdv / count;
    if (avgAdv > 0) {
      const pct = (50 + avgAdv * 5).toFixed(1);
      results.push({
        heroId: availId,
        score: Math.round(avgAdv * 10),
        winRateNote: `~${pct}% win rate vs your lineup`,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
