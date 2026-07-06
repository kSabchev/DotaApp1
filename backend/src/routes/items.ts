// Serves an item-id → { key, name } map built from OpenDota's item constants,
// so the frontend can resolve the numeric item ids in /heroes/:id/items
// (itemPopularity) to display names and icon keys.
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';
const TTL = 24 * 60 * 60 * 1000;

let cache: { data: Record<number, { key: string; name: string }>; ts: number } | null = null;

async function loadConstants(): Promise<Record<number, { key: string; name: string }>> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;
  const r = await fetch(`${OPENDOTA}/constants/items`);
  if (!r.ok) throw new Error(`OpenDota returned ${r.status}`);
  const raw = (await r.json()) as Record<string, { id?: number; dname?: string }>;
  const map: Record<number, { key: string; name: string }> = {};
  for (const [key, v] of Object.entries(raw)) {
    if (v && typeof v.id === 'number') map[v.id] = { key, name: v.dname ?? key };
  }
  cache = { data: map, ts: Date.now() };
  return map;
}

/** Boot-time cache priming (cold-start mitigation) — errors are the caller's problem. */
export async function warmItemConstants(): Promise<void> {
  await loadConstants();
}

router.get('/', async (_req, res) => {
  try {
    res.json(await loadConstants());
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

export default router;
