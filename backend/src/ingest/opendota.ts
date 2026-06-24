// Ingests matches from OpenDota into the local corpus.
//
//  • High-MMR pubs  → /publicMatches (10 picks + winner per match, paginated).
//                      Fast, high volume; ideal for backtest sample size.
//  • Pro/league     → /explorer SQL (picks_bans per match in one query).
//
// Throttled and resumable. Run:  npm run ingest -- pub 5      (5 pages of pubs)
//                                npm run ingest -- pro 500    (≤500 pro matches)
import { saveMatch, setProgress, getProgress, countMatches, type DraftedHero } from '../db';

const OPENDOTA = 'https://api.opendota.com/api';
const SLEEP_MS = 1200; // stay well under ~60 req/min

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function parseTeam(team: unknown): number[] {
  // publicMatches historically returns "1,2,3,4,5"; newer responses use arrays.
  if (Array.isArray(team)) return team.map(Number).filter(n => !Number.isNaN(n));
  if (typeof team === 'string') return team.split(',').map(Number).filter(n => !Number.isNaN(n));
  return [];
}

interface PublicMatch {
  match_id: number;
  radiant_win: boolean;
  start_time: number;
  duration: number;
  avg_rank_tier?: number;
  radiant_team: unknown;
  dire_team: unknown;
}

// ─── High-MMR pubs ────────────────────────────────────────────────────────────

export async function ingestPublicMatches(pages: number, minRankTier = 70): Promise<void> {
  let cursor = getProgress('opendota_pub'); // last (lowest) match_id seen
  let added = 0;

  for (let page = 0; page < pages; page++) {
    const url = cursor > 0
      ? `${OPENDOTA}/publicMatches?less_than_match_id=${cursor}`
      : `${OPENDOTA}/publicMatches`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  publicMatches page ${page} → HTTP ${res.status}, stopping`);
      break;
    }
    const matches = (await res.json()) as PublicMatch[];
    if (!matches.length) break;

    for (const m of matches) {
      cursor = cursor === 0 ? m.match_id : Math.min(cursor, m.match_id);
      // Filter to high bracket; avg_rank_tier 70 = Divine, 80 = Immortal.
      if ((m.avg_rank_tier ?? 0) < minRankTier) continue;

      const radiant = parseTeam(m.radiant_team);
      const dire = parseTeam(m.dire_team);
      if (radiant.length !== 5 || dire.length !== 5) continue;

      const heroes: DraftedHero[] = [
        ...radiant.map(id => ({ hero_id: id, team: 'radiant' as const, is_pick: 1, ord: null })),
        ...dire.map(id => ({ hero_id: id, team: 'dire' as const, is_pick: 1, ord: null })),
      ];
      const isNew = saveMatch({
        match_id: m.match_id,
        source: 'opendota_pub',
        patch: null,
        start_time: m.start_time,
        duration: m.duration,
        avg_rank_tier: m.avg_rank_tier ?? null,
        league_id: null,
        radiant_win: m.radiant_win ? 1 : 0,
      }, heroes);
      if (isNew) added++;
    }

    setProgress('opendota_pub', cursor);
    console.log(`  page ${page + 1}/${pages}: +${added} kept (cursor ${cursor})`);
    await sleep(SLEEP_MS);
  }

  console.log(`Pubs done: ${added} new this run, ${countMatches('opendota_pub')} total.`);
}

// ─── Pro / league matches via explorer SQL ────────────────────────────────────

export async function ingestProMatches(limit = 500): Promise<void> {
  // One query returns every drafted hero (pick & ban) for recent league matches.
  const sql = `
    SELECT m.match_id, m.radiant_win, m.start_time, m.duration, m.leagueid,
           pb.hero_id, pb.is_pick, pb.team, pb.ord
    FROM matches m
    JOIN picks_bans pb ON pb.match_id = m.match_id
    WHERE m.leagueid > 0
    ORDER BY m.match_id DESC
    LIMIT ${limit * 24}
  `.replace(/\s+/g, ' ').trim();

  const res = await fetch(`${OPENDOTA}/explorer?sql=${encodeURIComponent(sql)}`);
  if (!res.ok) {
    console.error(`  explorer → HTTP ${res.status}`);
    return;
  }
  const { rows } = (await res.json()) as {
    rows: { match_id: number; radiant_win: boolean; start_time: number; duration: number;
            leagueid: number; hero_id: number; is_pick: boolean; team: number; ord: number }[];
  };
  if (!rows?.length) {
    console.error('  explorer returned no rows');
    return;
  }

  // Group rows by match.
  const byMatch = new Map<number, typeof rows>();
  for (const r of rows) {
    if (!byMatch.has(r.match_id)) byMatch.set(r.match_id, []);
    byMatch.get(r.match_id)!.push(r);
  }

  let added = 0;
  for (const [matchId, mrows] of byMatch) {
    const first = mrows[0];
    const heroes: DraftedHero[] = mrows.map(r => ({
      hero_id: r.hero_id,
      team: r.team === 0 ? 'radiant' : 'dire',
      is_pick: r.is_pick ? 1 : 0,
      ord: r.ord,
    }));
    const picks = heroes.filter(h => h.is_pick);
    const radiantPicks = picks.filter(h => h.team === 'radiant').length;
    const direPicks = picks.filter(h => h.team === 'dire').length;
    if (radiantPicks !== 5 || direPicks !== 5) continue; // skip incomplete drafts

    const isNew = saveMatch({
      match_id: matchId,
      source: 'opendota_pro',
      patch: null,
      start_time: first.start_time,
      duration: first.duration,
      avg_rank_tier: null,
      league_id: first.leagueid,
      radiant_win: first.radiant_win ? 1 : 0,
    }, heroes);
    if (isNew) added++;
  }

  console.log(`Pro done: ${added} new, ${countMatches('opendota_pro')} total.`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const [mode, nStr, rankStr] = process.argv.slice(2);
  const n = Number(nStr) || (mode === 'pro' ? 500 : 5);

  if (mode === 'pro') {
    console.log(`Ingesting up to ${n} pro/league matches…`);
    await ingestProMatches(n);
  } else if (mode === 'pub' || !mode) {
    const minRank = Number(rankStr) || 70;
    console.log(`Ingesting ${n} pages of public matches (rank tier ≥ ${minRank})…`);
    await ingestPublicMatches(n, minRank);
  } else {
    console.error(`Unknown mode "${mode}". Use: pub <pages> | pro <limit>`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
