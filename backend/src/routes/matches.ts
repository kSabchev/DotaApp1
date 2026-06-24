import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const OPENDOTA = 'https://api.opendota.com/api';

// Cache individual matches briefly
const matchCache = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000;

router.get('/:matchId', async (req, res) => {
  const { matchId } = req.params;
  if (!/^\d+$/.test(matchId)) {
    return res.status(400).json({ error: 'Invalid match ID' });
  }

  const cached = matchCache.get(matchId);
  if (cached && Date.now() - cached.ts < TTL) {
    return res.json(cached.data);
  }

  try {
    const r = await fetch(`${OPENDOTA}/matches/${matchId}`);
    if (!r.ok) {
      return res.status(r.status).json({ error: `OpenDota returned ${r.status}` });
    }
    const data = await r.json();
    matchCache.set(matchId, { data, ts: Date.now() });
    if (matchCache.size > 200) {
      // Evict oldest entry
      const oldest = [...matchCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      matchCache.delete(oldest[0]);
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OpenDota unavailable', details: String(err) });
  }
});

export default router;
