import express from 'express';
import cors from 'cors';
import heroesRouter from './routes/heroes';
import matchesRouter from './routes/matches';
import proMatchesRouter from './routes/proMatches';
import modelRouter from './routes/model';
import itemsRouter from './routes/items';

export const app = express();
const PORT = process.env.PORT || 3001;

// Comma-separated list of allowed frontend origins (e.g. the deployed Vercel URL).
// Falls back to the local Vite dev server when unset.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.use('/api/heroes', heroesRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/pro-matches', proMatchesRouter);
app.use('/api/model', modelRouter);
app.use('/api/items', itemsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only start listening when run directly (not when imported by tests).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
