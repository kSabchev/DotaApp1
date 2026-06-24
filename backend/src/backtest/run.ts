// Backtests the existing scoring engine against real match outcomes.
//
// For each match we score both teams with the SAME analyzeTeam the app uses,
// then define  advantage = radiantScore − direScore  and ask: does a higher
// advantage actually correspond to a higher radiant win rate? If the model is
// predictive, the calibration table should rise monotonically and AUC > 0.5.
//
// Run:  npm run backtest            (all matches)
//       npm run backtest -- pub     (pubs only)
//       npm run backtest -- pro     (pro only)
import { analyzeTeam } from '../../../shared/scoring';
import { loadMatchesForBacktest, countMatches } from '../db';
import { getHeroPool, getHeroById } from '../ingest/heroPool';

interface Scored { advantage: number; radiantWin: number }

async function run() {
  const source = process.argv[2]; // 'pub' | 'pro' | undefined
  const dbSource = source === 'pub' ? 'opendota_pub' : source === 'pro' ? 'opendota_pro' : undefined;

  const pool = await getHeroPool();
  const byId = await getHeroById();
  const matches = loadMatchesForBacktest(dbSource);

  if (!matches.length) {
    console.error('No matches in corpus. Run `npm run ingest` first.');
    process.exit(1);
  }

  const scored: Scored[] = [];
  let skipped = 0;

  for (const m of matches) {
    // Require all 10 heroes resolvable in the pool, else the score is partial.
    const allKnown = [...m.radiant, ...m.dire].every(id => byId.has(id));
    if (!allKnown || m.radiant.length !== 5 || m.dire.length !== 5) { skipped++; continue; }

    const rad = analyzeTeam(m.radiant, m.dire, [], pool, {});
    const dire = analyzeTeam(m.dire, m.radiant, [], pool, {});
    scored.push({ advantage: rad.totalScore - dire.totalScore, radiantWin: m.radiant_win });
  }

  report(scored, skipped, dbSource);
}

function report(scored: Scored[], skipped: number, source?: string) {
  const n = scored.length;
  const radiantWins = scored.filter(s => s.radiantWin === 1).length;

  // ── Accuracy: predict radiant win when advantage > 0 ──
  let correct = 0, decided = 0;
  for (const s of scored) {
    if (s.advantage === 0) continue;
    decided++;
    const pred = s.advantage > 0 ? 1 : 0;
    if (pred === s.radiantWin) correct++;
  }
  const accuracy = decided ? correct / decided : 0;

  // ── AUC (Mann–Whitney): P(win match scores higher than loss match) ──
  const auc = computeAuc(scored);

  // ── Calibration table ──
  const edges = [-Infinity, -15, -10, -5, -2, 0, 2, 5, 10, 15, Infinity];
  const buckets = edges.slice(0, -1).map((lo, i) => ({
    lo, hi: edges[i + 1], n: 0, wins: 0,
  }));
  for (const s of scored) {
    const b = buckets.find(b => s.advantage >= b.lo && s.advantage < b.hi)!;
    b.n++; b.wins += s.radiantWin;
  }

  const label = (x: number) => (x === -Infinity ? '-inf' : x === Infinity ? '+inf' : String(x));

  console.log('\n══════════ BACKTEST: scoring model vs real outcomes ══════════');
  console.log(`Source        : ${source ?? 'all'}`);
  console.log(`Matches scored: ${n}  (skipped ${skipped} — unresolved heroes / incomplete)`);
  console.log(`Radiant winrate (base rate): ${(radiantWins / n * 100).toFixed(1)}%`);
  console.log(`Directional accuracy        : ${(accuracy * 100).toFixed(1)}%  (on ${decided} decided)`);
  console.log(`AUC                          : ${auc.toFixed(4)}   (0.5 = coin flip)`);
  console.log('\n  advantage bucket   matches    radiant winrate   (model says radiant better →)');
  console.log('  ───────────────────────────────────────────────────────────────────────────');
  for (const b of buckets) {
    if (b.n === 0) continue;
    const wr = b.wins / b.n;
    const bar = '█'.repeat(Math.round(wr * 30));
    console.log(
      `  [${label(b.lo).padStart(4)}, ${label(b.hi).padStart(4)})`.padEnd(20) +
      `${String(b.n).padStart(7)}` +
      `${(wr * 100).toFixed(1).padStart(13)}%   ${bar}`,
    );
  }
  console.log('  ───────────────────────────────────────────────────────────────────────────');
  console.log('Interpretation: winrate should climb as the advantage bucket increases.');
  console.log('AUC ~0.5 ⇒ no signal; >0.55 ⇒ weak; >0.6 ⇒ meaningful for a draft-only model.\n');
}

function computeAuc(scored: Scored[]): number {
  // Rank-based AUC. Ties in score get averaged ranks.
  const sorted = [...scored].sort((a, b) => a.advantage - b.advantage);
  const ranks = new Array(sorted.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].advantage === sorted[i].advantage) j++;
    const avgRank = (i + 1 + j) / 2; // average of ranks [i+1 .. j]
    for (let k = i; k < j; k++) ranks[k] = avgRank;
    i = j;
  }
  let rankSumPos = 0, nPos = 0, nNeg = 0;
  sorted.forEach((s, idx) => {
    if (s.radiantWin === 1) { rankSumPos += ranks[idx]; nPos++; } else nNeg++;
  });
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

run().catch(err => { console.error(err); process.exit(1); });
