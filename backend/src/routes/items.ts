// Serves an item-id → { key, name } map built from OpenDota's item constants,
// so the frontend can resolve the numeric item ids in /heroes/:id/items
// (itemPopularity) to display names and icon keys.
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';
const TTL = 24 * 60 * 60 * 1000;

let cache: { data: Record<number, { key: string; name: string }>; ts: number } | null = null;

router.get('/', async (_req, res) => {
  if (cache && Date.now() - cache.ts < TTL) return res.json(cache.data);
  try {
    const r = await fetch(`${OPENDOTA}/constants/items`);
    if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
    const raw = (await r.json()) as Record<string, { id?: number; dname?: string }>;
    const map: Record<number, { key: string; name: string }> = {};
    for (const [key, v] of Object.entries(raw)) {
      if (v && typeof v.id === 'number') map[v.id] = { key, name: v.dname ?? key };
    }
    cache = { data: map, ts: Date.now() };
    res.json(map);
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

export default router;
