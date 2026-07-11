import express from 'express';
import cors from 'cors';
import heroesRouter, { warmHeroCaches } from './routes/heroes';
import matchesRouter from './routes/matches';
import proMatchesRouter from './routes/proMatches';
import modelRouter from './routes/model';
import itemsRouter, { warmItemConstants } from './routes/items';
import playersRouter from './routes/players';
import metaRouter from './routes/meta';

export const app = express();
const PORT = process.env.PORT || 3001;

// Comma-separated list of allowed frontend origins (e.g. the deployed Vercel URL).
// Falls back to the local Vite dev server and `vite preview` when unset.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:4173')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.use('/api/heroes', heroesRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/pro-matches', proMatchesRouter);
app.use('/api/model', modelRouter);
app.use('/api/items', itemsRouter);
app.use('/api/players', playersRouter);
app.use('/api/meta', metaRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only start listening when run directly (not when imported by tests).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    // Cold-start mitigation: on the free tier the process boots because a user
    // request just woke it — prime the hot caches now (hero list, meta stats,
    // proPlayers map, item constants) so their follow-up calls hit memory.
    // Fire-and-forget: a failure here just means the old lazy path applies.
    setTimeout(() => {
      warmHeroCaches()
        .then(() => warmItemConstants())
        .then(() => console.log('Boot cache warm-up complete'))
        .catch(err => console.warn('Boot cache warm-up failed (lazy loading still applies):', String(err)));
    }, 1000);
  });
}
