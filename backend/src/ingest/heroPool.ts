// Fetches the OpenDota hero list once and builds the full scoring hero pool
// (id → Hero with utilityTags) via the shared builder. Cached to disk so
// repeated ingest/backtest runs don't re-hit the API.
import * as fs from 'fs';
import * as path from 'path';
import { buildHeroPool, type OpenDotaHeroRaw } from '../../../shared/heroPool';
import type { Hero } from '../../../shared/types';

const OPENDOTA = 'https://api.opendota.com/api';
const CACHE = path.resolve(__dirname, '..', '..', 'data', 'heroes.json');

async function fetchHeroList(): Promise<OpenDotaHeroRaw[]> {
  const res = await fetch(`${OPENDOTA}/heroes`);
  if (!res.ok) throw new Error(`OpenDota /heroes returned ${res.status}`);
  return (await res.json()) as OpenDotaHeroRaw[];
}

let pool: Hero[] | null = null;
let byId: Map<number, Hero> | null = null;

export async function getHeroPool(): Promise<Hero[]> {
  if (pool) return pool;

  let raw: OpenDotaHeroRaw[];
  if (fs.existsSync(CACHE)) {
    raw = JSON.parse(fs.readFileSync(CACHE, 'utf-8'));
  } else {
    raw = await fetchHeroList();
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(raw));
  }

  pool = buildHeroPool(raw);
  byId = new Map(pool.map(h => [h.id, h]));
  return pool;
}

export async function getHeroById(): Promise<Map<number, Hero>> {
  if (!byId) await getHeroPool();
  return byId!;
}
