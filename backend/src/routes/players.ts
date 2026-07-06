import { Router } from 'express';
import fetch from 'node-fetch';
import type { RecentMatchSummary } from '../../../shared/apiContracts';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';

async function odFetch(url: string, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Per-account cache of recent matches. Short TTL — a player may have just
// finished a game and expects to see it.
const recentCache = new Map<number, { data: RecentMatchSummary[]; ts: number }>();
const RECENT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE = 100;

interface OdRecentMatch {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  hero_id: number;
  start_time: number;
  duration: number;
  game_mode: number;
  lobby_type: number;
  kills: number;
  deaths: number;
  assists: number;
}

// GET /api/players/:accountId/matches — a player's last 10 games (public
// match history via OpenDota; requires the player's history to be public).
router.get('/:accountId/matches', async (req, res) => {
  if (!/^\d+$/.test(req.params.accountId)) {
    return res.status(400).json({ error: 'Invalid account id — use your numeric Dota Friend ID' });
  }
  const accountId = parseInt(req.params.accountId, 10);

  const cached = recentCache.get(accountId);
  if (cached && Date.now() - cached.ts < RECENT_TTL) {
    return res.json(cached.data);
  }

  try {
    const r = await odFetch(`${OPENDOTA}/players/${accountId}/recentMatches`);
    if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
    const raw = (await r.json()) as OdRecentMatch[];
    const data: RecentMatchSummary[] = (Array.isArray(raw) ? raw : [])
      .filter(m => m && typeof m.match_id === 'number')
      .slice(0, 10)
      .map(m => {
        const isRadiant = m.player_slot < 128;
        return {
          matchId: m.match_id,
          heroId: m.hero_id,
          isRadiant,
          win: isRadiant === m.radiant_win,
          startTime: m.start_time,
          durationSec: m.duration,
          gameMode: m.game_mode,
          lobbyType: m.lobby_type,
          kills: m.kills ?? 0,
          deaths: m.deaths ?? 0,
          assists: m.assists ?? 0,
        };
      });

    if (recentCache.size >= MAX_CACHE) {
      // evict the oldest entry
      let oldestKey: number | null = null;
      let oldestTs = Infinity;
      for (const [k, v] of recentCache) {
        if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
      }
      if (oldestKey !== null) recentCache.delete(oldestKey);
    }
    recentCache.set(accountId, { data, ts: Date.now() });
    res.json(data);
  } catch {
    res.json([]); // degrade gracefully — UI shows "no matches found"
  }
});

export default router;
