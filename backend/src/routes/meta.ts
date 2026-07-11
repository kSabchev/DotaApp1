import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
// process.cwd()-relative for the same reason as routes/model.ts: __dirname depth
// differs between ts-node dev and the compiled build; npm scripts always run
// with cwd = backend/.
const DATA_DIR = path.resolve(process.cwd(), 'data');

let cache: unknown | null = null;

// GET /api/meta/pro — tournament meta from the pro corpus (pick/ban/contest/win
// rates over the most recent window), generated offline by `npm run prometa`
// and committed like the model artifacts. 404 when never generated.
router.get('/pro', (_req, res) => {
  if (cache) return res.json(cache);
  const p = path.join(DATA_DIR, 'pro_meta.json');
  if (!fs.existsSync(p)) {
    return res.status(404).json({ error: 'No pro meta artifact. Run `npm run prometa`.' });
  }
  cache = JSON.parse(fs.readFileSync(p, 'utf-8'));
  res.json(cache);
});

export default router;
