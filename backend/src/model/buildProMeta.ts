// Builds the tournament-meta artifact from the local pro corpus: per-hero
// pick/ban/contest/win rates over the most recent window of league matches.
// The output (backend/data/pro_meta.json) is committed like the model JSONs
// and served by GET /api/meta/pro, so the deployed backend needs no database.
//
// Run:  npm run prometa          (after refreshing the corpus with `npm run ingest -- pro N`)
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const WINDOW_DAYS = 30;
const MIN_MATCHES = 300; // widen the window if the last 30 days are too thin

export interface ProHeroMeta {
  picks: number;
  bans: number;
  wins: number;       // wins when picked
  pickRate: number;   // picks / matches in window
  banRate: number;
  contestRate: number; // (picks + bans) / matches
  winRate: number;     // wins / picks (0.5 when unpicked)
}

export interface ProMetaFile {
  generatedAt: string;
  windowDays: number;
  from: string;
  to: string;
  matches: number;
  leagues: number;
  heroes: Record<number, ProHeroMeta>;
}

function build(): ProMetaFile {
  const db = new DatabaseSync(path.resolve(process.cwd(), 'data', 'dota.db'));

  const newest = db.prepare(
    "SELECT MAX(start_time) t FROM matches WHERE source = 'opendota_pro'",
  ).get() as { t: number };
  if (!newest?.t) throw new Error('No pro matches in the corpus — run `npm run ingest -- pro 1000` first.');

  let windowDays = WINDOW_DAYS;
  let cutoff = newest.t - windowDays * 86400;
  let head = db.prepare(
    "SELECT COUNT(*) n, COUNT(DISTINCT league_id) leagues, MIN(start_time) f FROM matches WHERE source = 'opendota_pro' AND start_time >= ?",
  ).get(cutoff) as { n: number; leagues: number; f: number };

  if (head.n < MIN_MATCHES) {
    windowDays = WINDOW_DAYS * 2;
    cutoff = newest.t - windowDays * 86400;
    head = db.prepare(
      "SELECT COUNT(*) n, COUNT(DISTINCT league_id) leagues, MIN(start_time) f FROM matches WHERE source = 'opendota_pro' AND start_time >= ?",
    ).get(cutoff) as { n: number; leagues: number; f: number };
  }

  const rows = db.prepare(`
    SELECT mh.hero_id, mh.is_pick,
           SUM(CASE WHEN mh.is_pick = 1 AND ((mh.team = 'radiant') = (m.radiant_win = 1)) THEN 1 ELSE 0 END) wins,
           COUNT(*) n
    FROM match_heroes mh
    JOIN matches m ON m.match_id = mh.match_id
    WHERE m.source = 'opendota_pro' AND m.start_time >= ?
    GROUP BY mh.hero_id, mh.is_pick
  `).all(cutoff) as { hero_id: number; is_pick: number; wins: number; n: number }[];

  const heroes: Record<number, ProHeroMeta> = {};
  for (const r of rows) {
    const h = (heroes[r.hero_id] ??= { picks: 0, bans: 0, wins: 0, pickRate: 0, banRate: 0, contestRate: 0, winRate: 0.5 });
    if (r.is_pick === 1) { h.picks = r.n; h.wins = r.wins; }
    else h.bans = r.n;
  }
  for (const h of Object.values(heroes)) {
    h.pickRate = +(h.picks / head.n).toFixed(4);
    h.banRate = +(h.bans / head.n).toFixed(4);
    h.contestRate = +Math.min(1, (h.picks + h.bans) / head.n).toFixed(4);
    h.winRate = h.picks > 0 ? +(h.wins / h.picks).toFixed(4) : 0.5;
  }

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    from: new Date(head.f * 1000).toISOString().slice(0, 10),
    to: new Date(newest.t * 1000).toISOString().slice(0, 10),
    matches: head.n,
    leagues: head.leagues,
    heroes,
  };
}

const out = build();
const file = path.resolve(process.cwd(), 'data', 'pro_meta.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`pro_meta.json written: ${out.matches} matches / ${out.leagues} leagues, ${out.from} → ${out.to} (${out.windowDays}-day window), ${Object.keys(out.heroes).length} heroes`);
