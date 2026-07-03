// EVALUATION (thesis Ch. 7): recommendation-agreement backtesting, ablation study,
// and baseline comparison — does the engine's ranked "Suggested Picks" list agree
// with what the professional team actually picked next, replayed over real historical
// drafts? Uses the 2,500-match pro corpus's ordered picks_bans sequence (match_heroes.ord),
// which preserves the real Captains Mode order (bans and picks interleaved).
//
// Ban recommendations are NOT evaluated here (see thesis Section 7.9: assessing a ban
// requires reasoning about a counterfactual with no ground truth in historical data).
//
// Run:  npx ts-node --transpile-only src/model/recommendationBacktest.ts
import { loadOrderedDraftsForBacktest, type DraftEvent } from '../db';
import { getHeroPool } from '../ingest/heroPool';
import { analyzeTeam, rankBanThreats, type RankPicksAblation } from '../../../shared/scoring';
import { gradeMatchups } from '../../../shared/matchupGrades';
import { computeItemMatchups } from '../../../shared/matchups';
import type { Hero } from '../../../shared/types';

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type RankFn = (myIds: number[], enemyIds: number[], availableIds: number[]) => number[]; // heroIds, best-first, ≤5

interface Agreement { n: number; top1: number; top3: number; top5: number; }

async function main() {
  const pool = await getHeroPool();
  const byId = new Map(pool.map(h => [h.id, h]));
  const inPool = new Set(pool.map(h => h.id));
  const allIds = pool.map(h => h.id);

  const drafts = loadOrderedDraftsForBacktest('opendota_pro');
  const clean = drafts.filter(d =>
    d.events.every(e => inPool.has(e.hero_id)) &&
    d.events.some(e => e.is_pick === 1) && d.events.some(e => e.is_pick === 0),
  );
  console.log(`Loaded ${drafts.length} ordered pro drafts from the corpus; ${clean.length} pass data-quality checks`);
  console.log('(every hero_id resolves to a known hero, and the sequence contains both picks and bans).\n');

  // ── Corpus-derived stats for the context-free naive baselines ──────────────────
  const wins = new Map<number, number>(), games = new Map<number, number>(), picks = new Map<number, number>();
  for (const d of clean) {
    for (const ev of d.events) {
      if (ev.is_pick !== 1) continue;
      picks.set(ev.hero_id, (picks.get(ev.hero_id) ?? 0) + 1);
      games.set(ev.hero_id, (games.get(ev.hero_id) ?? 0) + 1);
      const won = (ev.team === 'radiant') === (d.radiant_win === 1);
      if (won) wins.set(ev.hero_id, (wins.get(ev.hero_id) ?? 0) + 1);
    }
  }
  const winRateOf = (id: number) => (wins.get(id) ?? 0) / Math.max(1, games.get(id) ?? 0);
  const pickCountOf = (id: number) => picks.get(id) ?? 0;

  // ── Replay engine: one full pass over all clean matches for a given ranker ─────
  function replay(rank: RankFn): Agreement {
    let n = 0, top1 = 0, top3 = 0, top5 = 0;
    for (const d of clean) {
      const radiantPicks: number[] = [], direPicks: number[] = [];
      const unavailable = new Set<number>();
      for (const ev of d.events) {
        if (ev.is_pick === 1) {
          const myIds = ev.team === 'radiant' ? radiantPicks : direPicks;
          const enemyIds = ev.team === 'radiant' ? direPicks : radiantPicks;
          const availableIds = allIds.filter(id => !unavailable.has(id));
          const ranked = rank(myIds, enemyIds, availableIds);
          n++;
          const idx = ranked.indexOf(ev.hero_id);
          if (idx === 0) top1++;
          if (idx >= 0 && idx < 3) top3++;
          if (idx >= 0 && idx < 5) top5++;
          myIds.push(ev.hero_id);
        }
        unavailable.add(ev.hero_id);
      }
    }
    return { n, top1: top1 / n, top3: top3 / n, top5: top5 / n };
  }

  const engineRank = (ablate: RankPicksAblation): RankFn => (myIds, enemyIds, availableIds) =>
    analyzeTeam(myIds, enemyIds, availableIds, pool, {}, null, ablate).recommendedPicks.map(r => r.heroId);

  const fmt = (a: Agreement) => `n=${a.n}  Top-1 ${(a.top1 * 100).toFixed(1)}%  Top-3 ${(a.top3 * 100).toFixed(1)}%  Top-5 ${(a.top5 * 100).toFixed(1)}%`;

  // ── 1) Full hybrid engine ───────────────────────────────────────────────────────
  console.log('── Recommendation backtesting ──────────────────────────────────────');
  const full = replay(engineRank({}));
  console.log(`FULL ENGINE            ${fmt(full)}`);

  // ── 2) Ablation study — disable one module at a time ────────────────────────────
  console.log('\n── Ablation study (Δ = Top-3 pp vs full engine) ────────────────────');
  const modules: (keyof RankPicksAblation)[] = ['synergy', 'counter', 'roleCoverage', 'capability', 'timing'];
  const ablationResults: Record<string, Agreement> = {};
  for (const mod of modules) {
    const r = replay(engineRank({ [mod]: true } as RankPicksAblation));
    ablationResults[mod] = r;
    const delta = (r.top3 - full.top3) * 100;
    console.log(`- ${mod.padEnd(14)} ${fmt(r)}   Δ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp`);
  }

  // ── 3) Statistics-only baseline — counter signal only (existing "counter-picker" tools) ──
  console.log('\n── Baseline comparison ──────────────────────────────────────────────');
  const statsOnly = replay(engineRank({ synergy: true, roleCoverage: true, capability: true, timing: true }));
  console.log(`Statistics-only (counter) ${fmt(statsOnly)}`);

  // ── 4) Naive baselines ──────────────────────────────────────────────────────────
  const winRateRank: RankFn = (_m, _e, availableIds) =>
    [...availableIds].sort((a, b) => winRateOf(b) - winRateOf(a)).slice(0, 5);
  const winRateResult = replay(winRateRank);
  console.log(`Highest win rate          ${fmt(winRateResult)}`);

  const pickCountRank: RankFn = (_m, _e, availableIds) =>
    [...availableIds].sort((a, b) => pickCountOf(b) - pickCountOf(a)).slice(0, 5);
  const pickCountResult = replay(pickCountRank);
  console.log(`Most picked               ${fmt(pickCountResult)}`);

  const RANDOM_TRIALS = 10;
  let randN = 0, randTop1 = 0, randTop3 = 0, randTop5 = 0;
  for (let trial = 0; trial < RANDOM_TRIALS; trial++) {
    const rng = mulberry32(1000 + trial);
    const randomRank: RankFn = (_m, _e, availableIds) => shuffled(availableIds, rng).slice(0, 5);
    const r = replay(randomRank);
    randN += r.n; randTop1 += r.top1 * r.n; randTop3 += r.top3 * r.n; randTop5 += r.top5 * r.n;
  }
  const randomResult: Agreement = { n: randN / RANDOM_TRIALS, top1: randTop1 / randN, top3: randTop3 / randN, top5: randTop5 / randN };
  console.log(`Random legal pick         ${fmt(randomResult)}  (${RANDOM_TRIALS} seeded trials, averaged)`);

  const hybridVsStats = (full.top3 - statsOnly.top3) * 100;
  console.log(`\nHybrid vs. statistics-only baseline: ${hybridVsStats >= 0 ? '+' : ''}${hybridVsStats.toFixed(1)}pp Top-3`);

  // ── 5) Runtime latency — a complete analysis cycle on real mid-draft states ─────
  console.log('\n── Runtime latency (complete analysis cycle) ────────────────────────');
  const samples: { my: number[]; enemy: number[]; available: number[]; myHeroes: Hero[]; enemyHeroes: Hero[] }[] = [];
  outer: for (const d of clean) {
    const radiantPicks: number[] = [], direPicks: number[] = [];
    const unavailable = new Set<number>();
    for (const ev of d.events) {
      if (ev.is_pick === 1) (ev.team === 'radiant' ? radiantPicks : direPicks).push(ev.hero_id);
      unavailable.add(ev.hero_id);
      // Sample once per match at a representative midpoint (≥3 picks each side).
      if (radiantPicks.length >= 3 && direPicks.length >= 3) {
        samples.push({
          my: [...radiantPicks], enemy: [...direPicks],
          available: allIds.filter(id => !unavailable.has(id)),
          myHeroes: radiantPicks.map(id => byId.get(id)!), enemyHeroes: direPicks.map(id => byId.get(id)!),
        });
        continue outer;
      }
    }
  }
  console.log(`Sampled ${samples.length} real mid-draft states (≥3 picks/side) from the corpus.`);

  const latencies: number[] = [];
  for (const s of samples) {
    const t0 = process.hrtime.bigint();
    analyzeTeam(s.my, s.enemy, s.available, pool, {});
    analyzeTeam(s.enemy, s.my, s.available, pool, {});
    rankBanThreats(s.my, s.enemy, s.available, pool);
    gradeMatchups(s.myHeroes, s.enemyHeroes);
    computeItemMatchups(s.myHeroes, s.enemyHeroes);
    const t1 = process.hrtime.bigint();
    latencies.push(Number(t1 - t0) / 1e6); // ms
  }
  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  console.log(`Median: ${median.toFixed(2)} ms   P95: ${p95.toFixed(2)} ms   (both-team analyzeTeam + rankBanThreats + gradeMatchups + computeItemMatchups)`);

  // ── Table 7.1 summary ────────────────────────────────────────────────────────
  console.log('\n══════════════════════ TABLE 7.1 SUMMARY ══════════════════════════');
  console.log(`Prediction AUC                 : see train.ts output (0.5768, 5-fold CV)`);
  console.log(`Top-1 agreement                : ${(full.top1 * 100).toFixed(1)}%`);
  console.log(`Top-3 agreement                : ${(full.top3 * 100).toFixed(1)}%`);
  console.log(`Top-5 agreement                : ${(full.top5 * 100).toFixed(1)}%`);
  console.log(`vs. statistics-only baseline    : ${hybridVsStats >= 0 ? '+' : ''}${hybridVsStats.toFixed(1)}pp Top-3`);
  console.log(`Median recommendation latency   : ${median.toFixed(2)} ms`);
  console.log(`\nNaive baselines (Top-3)         : win-rate ${(winRateResult.top3 * 100).toFixed(1)}% / most-picked ${(pickCountResult.top3 * 100).toFixed(1)}% / random ${(randomResult.top3 * 100).toFixed(1)}%`);
}

main().catch(err => { console.error(err); process.exit(1); });
