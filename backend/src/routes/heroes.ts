import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';

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
    const r = await fetch(`${OPENDOTA}/heroes`);
    const data = await r.json();
    heroCache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    if (statsCache && Date.now() - statsCache.ts < STATS_TTL) {
      return res.json(statsCache.data);
    }
    const r = await fetch(`${OPENDOTA}/heroStats`);
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
    const r = await fetch(`${OPENDOTA}/heroes/${heroId}/matchups`);
    if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
    const data = await r.json();
    matchupCache.set(heroId, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    // Return empty array so frontend degrades gracefully
    res.json([]);
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
    const r = await fetch(`${OPENDOTA}/heroes/${heroId}/itemPopularity`);
    if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
    const data = await r.json();
    itemPopCache.set(heroId, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    res.json({}); // degrade gracefully
  }
});

export default router;
