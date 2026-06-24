// Local match corpus, backed by Node's built-in SQLite (node:sqlite).
// We use the built-in rather than better-sqlite3 because Windows Application
// Control blocks third-party native .node addons on this machine — node:sqlite
// is compiled into node.exe itself, so there's nothing to block.
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'dota.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS matches (
    match_id      INTEGER PRIMARY KEY,
    source        TEXT    NOT NULL,   -- 'opendota_pro' | 'opendota_pub'
    patch         TEXT,
    start_time    INTEGER,
    duration      INTEGER,
    avg_rank_tier INTEGER,            -- pubs only; ~10..80 (80 = Immortal)
    league_id     INTEGER,
    radiant_win   INTEGER NOT NULL    -- 1 | 0
  );

  -- One row per drafted hero. For pubs we only have the 10 picks; for pro
  -- matches we can later add bans (is_pick = 0) for scouting features.
  CREATE TABLE IF NOT EXISTS match_heroes (
    match_id INTEGER NOT NULL,
    hero_id  INTEGER NOT NULL,
    team     TEXT    NOT NULL,        -- 'radiant' | 'dire'
    is_pick  INTEGER NOT NULL DEFAULT 1,
    ord      INTEGER,
    PRIMARY KEY (match_id, hero_id, team)
  );

  CREATE INDEX IF NOT EXISTS idx_match_heroes_match ON match_heroes(match_id);

  -- Resumable ingestion cursor per source.
  CREATE TABLE IF NOT EXISTS ingest_progress (
    source     TEXT PRIMARY KEY,
    cursor     INTEGER,
    updated_at INTEGER
  );
`);

export interface MatchRow {
  match_id: number;
  source: string;
  patch: string | null;
  start_time: number | null;
  duration: number | null;
  avg_rank_tier: number | null;
  league_id: number | null;
  radiant_win: number;
}

export interface DraftedHero {
  hero_id: number;
  team: 'radiant' | 'dire';
  is_pick: number;
  ord: number | null;
}

const insertMatchStmt = db.prepare(`
  INSERT OR IGNORE INTO matches
    (match_id, source, patch, start_time, duration, avg_rank_tier, league_id, radiant_win)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertHeroStmt = db.prepare(`
  INSERT OR IGNORE INTO match_heroes (match_id, hero_id, team, is_pick, ord)
  VALUES (?, ?, ?, ?, ?)
`);

/** Insert a match plus its drafted heroes atomically. Returns true if new. */
export function saveMatch(match: MatchRow, heroes: DraftedHero[]): boolean {
  const result = insertMatchStmt.run(
    match.match_id, match.source, match.patch, match.start_time,
    match.duration, match.avg_rank_tier, match.league_id, match.radiant_win,
  );
  if (result.changes === 0) return false; // already had it
  for (const h of heroes) {
    insertHeroStmt.run(match.match_id, h.hero_id, h.team, h.is_pick, h.ord);
  }
  return true;
}

export function getProgress(source: string): number {
  const row = db.prepare('SELECT cursor FROM ingest_progress WHERE source = ?').get(source) as
    | { cursor: number } | undefined;
  return row?.cursor ?? 0;
}

export function setProgress(source: string, cursor: number): void {
  db.prepare(`
    INSERT INTO ingest_progress (source, cursor, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(source) DO UPDATE SET cursor = excluded.cursor, updated_at = excluded.updated_at
  `).run(source, cursor, Date.now());
}

export function countMatches(source?: string): number {
  const row = source
    ? db.prepare('SELECT COUNT(*) AS n FROM matches WHERE source = ?').get(source)
    : db.prepare('SELECT COUNT(*) AS n FROM matches').get();
  return (row as { n: number }).n;
}

/** All matches with their picks, for the backtest. */
export function loadMatchesForBacktest(source?: string): {
  match_id: number; radiant_win: number; source: string;
  radiant: number[]; dire: number[];
}[] {
  const matches = (source
    ? db.prepare('SELECT match_id, radiant_win, source FROM matches WHERE source = ?').all(source)
    : db.prepare('SELECT match_id, radiant_win, source FROM matches').all()
  ) as { match_id: number; radiant_win: number; source: string }[];

  const heroStmt = db.prepare(
    'SELECT hero_id, team FROM match_heroes WHERE match_id = ? AND is_pick = 1',
  );

  return matches.map(m => {
    const heroes = heroStmt.all(m.match_id) as { hero_id: number; team: string }[];
    return {
      match_id: m.match_id,
      radiant_win: m.radiant_win,
      source: m.source,
      radiant: heroes.filter(h => h.team === 'radiant').map(h => h.hero_id),
      dire: heroes.filter(h => h.team === 'dire').map(h => h.hero_id),
    };
  });
}
