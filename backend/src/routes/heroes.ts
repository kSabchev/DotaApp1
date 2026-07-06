import { Router } from 'express';
import fetch from 'node-fetch';
import type { HeroProEntry } from '../../../shared/apiContracts';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';

// Fetch with a hard timeout so an unreachable/slow OpenDota fails fast and the
// route degrades (rather than holding the request — and the UI — open forever).
async function odFetch(url: string, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Simple in-memory cache
let heroCache: { data: unknown; ts: number } | null = null;
let statsCache: { data: unknown; ts: number } | null = null;
const matchupCache = new Map<number, { data: unknown; ts: number }>();
const itemPopCache = new Map<number, { data: unknown; ts: number }>();

const TTL      = 60 * 60 * 1000;         // 1 hour for hero list
const STATS_TTL = 6 * 60 * 60 * 1000;   // 6 hours for heroStats (meta doesn't shift daily)
const MATCHUP_TTL = 24 * 60 * 60 * 1000; // 24 hours for matchup data
const ITEMPOP_TTL = 24 * 60 * 60 * 1000; // 24 hours for item popularity

router.get('/', async (_req, res) => {
  try {
    if (heroCache && Date.now() - heroCache.ts < TTL) {
      return res.json(heroCache.data);
    }
    const r = await odFetch(`${OPENDOTA}/heroes`);
    const data = await r.json();
    heroCache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

// Boot-time cache priming (cold-start mitigation): the first request after the
// free-tier host wakes is what booted the process, so prime the hot read-side
// caches immediately — by the time the user's follow-up calls arrive, the hero
// list, meta stats, and the multi-MB proPlayers map are already in memory.
// Sequential on purpose (gentle on OpenDota's rate limit).
export async function warmHeroCaches(): Promise<void> {
  if (!heroCache) {
    const r = await odFetch(`${OPENDOTA}/heroes`);
    if (r.ok) heroCache = { data: await r.json(), ts: Date.now() };
  }
  if (!statsCache) {
    const r = await odFetch(`${OPENDOTA}/heroStats`);
    if (r.ok) statsCache = { data: await r.json(), ts: Date.now() };
  }
  await getProPlayersMap();
}

router.get('/stats', async (_req, res) => {
  try {
    if (statsCache && Date.now() - statsCache.ts < STATS_TTL) {
      return res.json(statsCache.data);
    }
    const r = await odFetch(`${OPENDOTA}/heroStats`);
    const data = await r.json();
    statsCache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

// GET /heroes/:id/matchups — OpenDota per-hero matchup win rates, 24hr cache
router.get('/:id/matchups', async (req, res) => {
  const heroId = parseInt(req.params.id, 10);
  if (isNaN(heroId)) return res.status(400).json({ error: 'Invalid hero id' });

  const cached = matchupCache.get(heroId);
  if (cached && Date.now() - cached.ts < MATCHUP_TTL) {
    return res.json(cached.data);
  }

  try {
    const r = await odFetch(`${OPENDOTA}/heroes/${heroId}/matchups`);
    if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
    const data = await r.json();
    matchupCache.set(heroId, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    // Return empty array so frontend degrades gracefully
    res.json([]);
  }
});

// ── Pro players per hero ──────────────────────────────────────────────────────
// /proPlayers is a multi-MB payload: fetch it at most once per day, keep only
// the accountId → {name, team} map, and dedupe concurrent fetches so a burst of
// hero-page visits doesn't fan out into parallel multi-MB downloads.
const PROS_TTL = 24 * 60 * 60 * 1000;
let proPlayersMap: { data: Map<number, { name: string; teamName: string | null }>; ts: number } | null = null;
let proPlayersInflight: Promise<Map<number, { name: string; teamName: string | null }>> | null = null;
const heroProsCache = new Map<number, { data: HeroProEntry[]; ts: number }>();

async function getProPlayersMap(): Promise<Map<number, { name: string; teamName: string | null }>> {
  if (proPlayersMap && Date.now() - proPlayersMap.ts < PROS_TTL) return proPlayersMap.data;
  if (proPlayersInflight) return proPlayersInflight;
  proPlayersInflight = (async () => {
    try {
      const r = await odFetch(`${OPENDOTA}/proPlayers`, 15000);
      if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
      const raw = (await r.json()) as { account_id: number; name: string; team_name?: string | null }[];
      const map = new Map<number, { name: string; teamName: string | null }>();
      for (const p of raw) {
        if (p.account_id && p.name) map.set(p.account_id, { name: p.name, teamName: p.team_name ?? null });
      }
      proPlayersMap = { data: map, ts: Date.now() };
      return map;
    } finally {
      proPlayersInflight = null;
    }
  })();
  return proPlayersInflight;
}

// GET /heroes/:id/pros — pro players who recently played this hero, each with
// up to 3 recent pro-match ids (loadable replays for the encyclopedia).
router.get('/:id/pros', async (req, res) => {
  const heroId = parseInt(req.params.id, 10);
  if (isNaN(heroId)) return res.status(400).json({ error: 'Invalid hero id' });

  const cached = heroProsCache.get(heroId);
  if (cached && Date.now() - cached.ts < PROS_TTL) {
    return res.json(cached.data);
  }

  try {
    const [pros, matchesRes] = await Promise.all([
      getProPlayersMap(),
      odFetch(`${OPENDOTA}/heroes/${heroId}/matches`),
    ]);
    if (!matchesRes.ok) throw new Error(`OpenDota returned ${matchesRes.status}`);
    const matches = (await matchesRes.json()) as {
      match_id: number; start_time: number; radiant_win: boolean; radiant: boolean; account_id: number;
    }[];

    const byPlayer = new Map<number, { matchId: number; startTime: number; win: boolean }[]>();
    for (const m of Array.isArray(matches) ? matches : []) {
      if (!m?.account_id || !pros.has(m.account_id)) continue;
      const list = byPlayer.get(m.account_id) ?? [];
      list.push({ matchId: m.match_id, startTime: m.start_time, win: m.radiant === m.radiant_win });
      byPlayer.set(m.account_id, list);
    }

    const entries: HeroProEntry[] = [...byPlayer.entries()]
      .map(([accountId, list]) => {
        const p = pros.get(accountId)!;
        const recent = list.sort((a, b) => b.startTime - a.startTime).slice(0, 3);
        return { accountId, playerName: p.name, teamName: p.teamName, recentMatches: recent };
      })
      .sort((a, b) => (b.recentMatches[0]?.startTime ?? 0) - (a.recentMatches[0]?.startTime ?? 0))
      .slice(0, 8);

    heroProsCache.set(heroId, { data: entries, ts: Date.now() });
    res.json(entries);
  } catch {
    res.json([]); // degrade gracefully
  }
});

// GET /heroes/:id/items — OpenDota item popularity by game phase, 24hr cache
router.get('/:id/items', async (req, res) => {
  const heroId = parseInt(req.params.id, 10);
  if (isNaN(heroId)) return res.status(400).json({ error: 'Invalid hero id' });

  const cached = itemPopCache.get(heroId);
  if (cached && Date.now() - cached.ts < ITEMPOP_TTL) {
    return res.json(cached.data);
  }

  try {
    const r = await odFetch(`${OPENDOTA}/heroes/${heroId}/itemPopularity`);
    if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
    const data = await r.json();
    itemPopCache.set(heroId, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    res.json({}); // degrade gracefully
  }
});

export default router;
