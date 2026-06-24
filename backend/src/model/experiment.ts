// EXPERIMENT: do the rule-based "draft brain" signals add predictive AUC on top
// of the learned hero + synergy/counter pair model?
//
// We compute a handful of per-match DERIVED features from the draft (radiant minus
// dire perspective) using the shared scoring engine, then run the SAME 5-fold CV
// as train.ts on several feature configs and compare held-out AUC / log-loss.
//
//   A  hero + learned pairs           (the production baseline, ~0.577 on pro)
//   B  A + derived draft-brain features
//   C  derived features only          (standalone signal of the heuristics)
//   D  hero-only + derived
//
// Run:  npx ts-node --transpile-only src/model/experiment.ts pro
import { fit, predictLogit, type SparseRow } from './logreg';
import { buildFeatureSpace, matchToRow, type CorpusMatch } from './features';
import { auc, logLoss } from '../backtest/metrics';
import { loadMatchesForBacktest } from '../db';
import { getHeroPool } from '../ingest/heroPool';
import { analyzeTeam } from '../../../shared/scoring';
import type { Hero, HeroFreedom } from '../../../shared/types';

const FOLDS = 5;

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(arr: T[], seed = 42): T[] {
  const rng = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const STATUS_W: Record<HeroFreedom['status'], number> = { free: 0, minor: 1, contested: 2, shut_down: 3 };
const exposure = (f: HeroFreedom[]) => f.reduce((a, h) => a + STATUS_W[h.status], 0);

const DERIVED_NAMES = ['synergyΔ', 'counterΔ', 'freeGameΔ', 'laneAdvNet', 'roleCovΔ', 'totalScoreΔ'];

// Per-match derived features, signed from radiant's perspective.
function derivedRaw(m: CorpusMatch, pool: Hero[]): number[] {
  const rA = analyzeTeam(m.radiant, m.dire, [], pool, {});
  const rD = analyzeTeam(m.dire, m.radiant, [], pool, {});
  const laneNet = rA.laneMatchups.reduce((a, x) => a + x.advantage, 0);
  const cov = (mr: number) => 5 - mr;
  return [
    rA.synergyScore - rD.synergyScore,
    rA.counterScore - rD.counterScore,
    exposure(rD.heroFreedom) - exposure(rA.heroFreedom),   // radiant less disrupted ⇒ positive
    laneNet,
    cov(rA.draftVerdict.laneVerdict.missingRoles.length) - cov(rD.draftVerdict.laneVerdict.missingRoles.length),
    rA.totalScore - rD.totalScore,
  ];
}

// z-score using train-fold stats only (no leakage); returns standardized matrix.
function standardize(raw: number[][], trainIdx: number[]): { z: number[][]; mean: number[]; std: number[] } {
  const D = raw[0].length;
  const mean = new Array(D).fill(0), std = new Array(D).fill(0);
  for (const i of trainIdx) for (let k = 0; k < D; k++) mean[k] += raw[i][k];
  for (let k = 0; k < D; k++) mean[k] /= trainIdx.length;
  for (const i of trainIdx) for (let k = 0; k < D; k++) std[k] += (raw[i][k] - mean[k]) ** 2;
  for (let k = 0; k < D; k++) std[k] = Math.sqrt(std[k] / trainIdx.length) || 1;
  const z = raw.map(r => r.map((v, k) => (v - mean[k]) / std[k]));
  return { z, mean, std };
}

interface Config { name: string; includePairs: boolean; lambda: number; minPair: number; useDerived: boolean; heroFeatures: boolean; }

async function main() {
  const source = process.argv[2] === 'pub' ? 'opendota_pub' : 'opendota_pro';
  const pool = await getHeroPool();
  const inPool = new Set(pool.map(h => h.id));

  const raw = (loadMatchesForBacktest(source) as CorpusMatch[]).filter(
    m => m.radiant.length === 5 && m.dire.length === 5 &&
         m.radiant.every(id => inPool.has(id)) && m.dire.every(id => inPool.has(id)),
  );
  const matches = shuffled(raw);
  const labels = matches.map(m => m.radiant_win);
  console.log(`Corpus: ${matches.length} ${source} matches (5v5, all heroes resolved).`);

  console.log('Computing derived draft-brain features per match…');
  const t0 = Date.now();
  const derived = matches.map(m => derivedRaw(m, pool));
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const configs: Config[] = [
    { name: 'A  hero + pairs (baseline)',     includePairs: true,  lambda: 25, minPair: 45, useDerived: false, heroFeatures: true },
    { name: 'B  hero + pairs + derived',      includePairs: true,  lambda: 25, minPair: 45, useDerived: true,  heroFeatures: true },
    { name: 'C  derived only',                includePairs: false, lambda: 2,  minPair: 20, useDerived: true,  heroFeatures: false },
    { name: 'D  hero-only + derived',         includePairs: false, lambda: 2,  minPair: 20, useDerived: true,  heroFeatures: true },
  ];

  for (const cfg of configs) {
    const oofLogit = new Array(matches.length).fill(0);
    for (let f = 0; f < FOLDS; f++) {
      const trainIdx: number[] = [], testIdx: number[] = [], trainMatches: CorpusMatch[] = [];
      for (let i = 0; i < matches.length; i++) {
        if (i % FOLDS === f) testIdx.push(i); else { trainIdx.push(i); trainMatches.push(matches[i]); }
      }
      const space = buildFeatureSpace(trainMatches, { includePairs: cfg.includePairs, minPairCount: cfg.minPair });
      const base = cfg.heroFeatures ? space.nFeatures : 0;
      const D = cfg.useDerived ? derived[0].length : 0;
      const { z } = cfg.useDerived ? standardize(derived, trainIdx) : { z: [] as number[][] };

      const buildRow = (i: number): SparseRow => {
        const row: SparseRow = cfg.heroFeatures ? matchToRow(matches[i], space) : [];
        if (cfg.useDerived) for (let k = 0; k < D; k++) row.push({ idx: base + k, val: z[i][k] });
        return row;
      };
      const trainRows = trainIdx.map(buildRow), trainY = trainIdx.map(i => labels[i]);
      const model = fit(trainRows, trainY, { nFeatures: base + D, lambda: cfg.lambda, lr: 0.3, epochs: 3000 });
      for (const i of testIdx) oofLogit[i] = predictLogit(model, buildRow(i));
    }
    const probs = oofLogit.map(z => 1 / (1 + Math.exp(-z)));
    console.log(`\n${cfg.name.padEnd(34)} AUC ${auc(probs, labels).toFixed(4)}   log-loss ${logLoss(probs, labels).toFixed(4)}`);
  }

  // Inspect the derived-feature weights from a full-data fit of config B.
  const space = buildFeatureSpace(matches, { includePairs: true, minPairCount: 45 });
  const { z } = standardize(derived, matches.map((_, i) => i));
  const D = derived[0].length;
  const rows = matches.map((m, i) => {
    const r = matchToRow(m, space);
    for (let k = 0; k < D; k++) r.push({ idx: space.nFeatures + k, val: z[i][k] });
    return r;
  });
  const model = fit(rows, labels, { nFeatures: space.nFeatures + D, lambda: 25, lr: 0.3, epochs: 3000 });
  console.log('\nDerived-feature weights (standardized, config B full-data fit):');
  DERIVED_NAMES.forEach((n, k) => {
    const w = model.w[space.nFeatures + k];
    console.log(`    ${n.padEnd(14)} ${w >= 0 ? '+' : ''}${w.toFixed(4)}`);
  });
  console.log('\n(positive weight ⇒ higher value favours radiant; |weight| ≈ standardized impact)');
}

main().catch(err => { console.error(err); process.exit(1); });
