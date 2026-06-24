import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';
let cache: { data: unknown; ts: number } | null = null;
const TTL = 10 * 60 * 1000; // 10 min

router.get('/', async (_req, res) => {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return res.json(cache.data);
    }
    const r = await fetch(`${OPENDOTA}/proMatches`);
    const data = await r.json();
    cache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

export default router;
