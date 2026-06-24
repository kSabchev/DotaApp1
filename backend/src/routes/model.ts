import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

// Prefer the pairwise model (best AUC); fall back to hero-only.
const CANDIDATES = ['model_opendota_pro_pairs.json', 'model_opendota_pro.json'];

let cache: { data: unknown; path: string } | null = null;

router.get('/', (_req, res) => {
  if (cache) return res.json(cache.data);

  for (const name of CANDIDATES) {
    const p = path.join(DATA_DIR, name);
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      cache = { data, path: p };
      return res.json(data);
    }
  }
  res.status(404).json({ error: 'No trained model found. Run `npm run train -- pro pairs`.' });
});

export default router;
