// EXPERIMENT: do the rule-based "draft brain" signals add predictive AUC on top
// of the learned hero + synergy/counter pair model?
//
// We compute per-match DERIVED features from the draft (radiant minus dire) using
// the shared scoring engine, then run the SAME 5-fold CV as train.ts on several
// feature configs and compare held-out AUC / log-loss. Two coaching groups:
//   • derived  — analyzeTeam signals: synergyΔ, counterΔ, freeGameΔ (fragility-
//     weighted exposure), laneAdvNet, roleCovΔ, totalScoreΔ
//   • grades   — gradeMatchups 0–10 scales: Team Synergy, Lane Duos, Lane vs
//     Enemy, Game Counters (radiant minus dire)
//
//   A  hero + learned pairs                 (production baseline, ~0.577 on pro)
//   B  A + derived + grades                 (the full draft brain)
//   C  derived + grades only                (standalone signal of the heuristics)
//   D  hero-only + derived + grades
//   E  A + grades only                      (isolates the matchup-grades lift)
//
// Run:  npx ts-node --transpile-only src/model/experiment.ts pro
import { fit, predictLogit, type SparseRow } from './logreg';
import { buildFeatureSpace, matchToRow, type CorpusMatch } from './features';
import { auc, logLoss } from '../backtest/metrics';
import { loadMatchesForBacktest } from '../db';
import { getHeroPool } from '../ingest/heroPool';
import { analyzeTeam } from '../../../shared/scoring';
import { gradeMatchups } from '../../../shared/matchupGrades';
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
const GRADE_NAMES   = ['synGradeΔ', 'laneDuoΔ', 'laneVsEnΔ', 'gameCntrΔ'];

// analyzeTeam-based derived features, signed from radiant's perspective.
function derivedRaw(radIds: number[], direIds: number[], pool: Hero[]): number[] {
  const rA = analyzeTeam(radIds, direIds, [], pool, {});
  const rD = analyzeTeam(direIds, radIds, [], pool, {});
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

// gradeMatchups 0–10 scales, radiant minus dire (no live win-rates in Node ⇒ hand data).
function gradesRaw(rad: Hero[], dire: Hero[]): number[] {
  const gA = gradeMatchups(rad, dire);
  const gD = gradeMatchups(dire, rad);
  return [
    gA.synergy.grade     - gD.synergy.grade,
    gA.lanePartner.grade - gD.lanePartner.grade,
    gA.laneMatchup.grade - gD.laneMatchup.grade,
    gA.gameMatchup.grade - gD.gameMatchup.grade,
  ];
}

// z-score using train-fold stats only (no leakage); returns standardized matrix.
function standardize(raw: number[][], trainIdx: number[]): number[][] {
  const D = raw[0].length;
  const mean = new Array(D).fill(0), std = new Array(D).fill(0);
  for (const i of trainIdx) for (let k = 0; k < D; k++) mean[k] += raw[i][k];
  for (let k = 0; k < D; k++) mean[k] /= trainIdx.length;
  for (const i of trainIdx) for (let k = 0; k < D; k++) std[k] += (raw[i][k] - mean[k]) ** 2;
  for (let k = 0; k < D; k++) std[k] = Math.sqrt(std[k] / trainIdx.length) || 1;
  return raw.map(r => r.map((v, k) => (v - mean[k]) / std[k]));
}

interface Config {
  name: string; includePairs: boolean; lambda: number; minPair: number;
  heroFeatures: boolean; useDerived: boolean; useGrades: boolean;
}

async function main() {
  const source = process.argv[2] === 'pub' ? 'opendota_pub' : 'opendota_pro';
  const pool = await getHeroPool();
  const byId = new Map(pool.map(h => [h.id, h]));
  const inPool = new Set(pool.map(h => h.id));

  const raw = (loadMatchesForBacktest(source) as CorpusMatch[]).filter(
    m => m.radiant.length === 5 && m.dire.length === 5 &&
         m.radiant.every(id => inPool.has(id)) && m.dire.every(id => inPool.has(id)),
  );
  const matches = shuffled(raw);
  const labels = matches.map(m => m.radiant_win);
  console.log(`Corpus: ${matches.length} ${source} matches (5v5, all heroes resolved).`);

  console.log('Computing derived + grade draft-brain features per match…');
  const t0 = Date.now();
  const derived: number[][] = [];
  const grades: number[][] = [];
  for (const m of matches) {
    const rad = m.radiant.map(id => byId.get(id)!);
    const dire = m.dire.map(id => byId.get(id)!);
    derived.push(derivedRaw(m.radiant, m.dire, pool));
    grades.push(gradesRaw(rad, dire));
  }
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const configs: Config[] = [
    { name: 'A  hero + pairs (baseline)',  includePairs: true,  lambda: 25, minPair: 45, heroFeatures: true,  useDerived: false, useGrades: false },
    { name: 'B  A + derived + grades',     includePairs: true,  lambda: 25, minPair: 45, heroFeatures: true,  useDerived: true,  useGrades: true  },
    { name: 'C  derived + grades only',    includePairs: false, lambda: 2,  minPair: 20, heroFeatures: false, useDerived: true,  useGrades: true  },
    { name: 'D  hero-only + der + grades', includePairs: false, lambda: 2,  minPair: 20, heroFeatures: true,  useDerived: true,  useGrades: true  },
    { name: 'E  A + grades only',          includePairs: true,  lambda: 25, minPair: 45, heroFeatures: true,  useDerived: false, useGrades: true  },
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
      const zD = cfg.useDerived ? standardize(derived, trainIdx) : null;
      const zG = cfg.useGrades  ? standardize(grades,  trainIdx) : null;
      const nD = zD ? derived[0].length : 0;
      const nG = zG ? grades[0].length : 0;

      const buildRow = (i: number): SparseRow => {
        const row: SparseRow = cfg.heroFeatures ? matchToRow(matches[i], space) : [];
        if (zD) for (let k = 0; k < nD; k++) row.push({ idx: base + k, val: zD[i][k] });
        if (zG) for (let k = 0; k < nG; k++) row.push({ idx: base + nD + k, val: zG[i][k] });
        return row;
      };
      const trainRows = trainIdx.map(buildRow), trainY = trainIdx.map(i => labels[i]);
      const model = fit(trainRows, trainY, { nFeatures: base + nD + nG, lambda: cfg.lambda, lr: 0.3, epochs: 3000 });
      for (const i of testIdx) oofLogit[i] = predictLogit(model, buildRow(i));
    }
    const probs = oofLogit.map(z => 1 / (1 + Math.exp(-z)));
    console.log(`\n${cfg.name.padEnd(30)} AUC ${auc(probs, labels).toFixed(4)}   log-loss ${logLoss(probs, labels).toFixed(4)}`);
  }

  // Inspect coaching-feature weights from a full-data fit of config B.
  const space = buildFeatureSpace(matches, { includePairs: true, minPairCount: 45 });
  const zD = standardize(derived, matches.map((_, i) => i));
  const zG = standardize(grades,  matches.map((_, i) => i));
  const nD = derived[0].length, nG = grades[0].length;
  const rows = matches.map((m, i) => {
    const r = matchToRow(m, space);
    for (let k = 0; k < nD; k++) r.push({ idx: space.nFeatures + k, val: zD[i][k] });
    for (let k = 0; k < nG; k++) r.push({ idx: space.nFeatures + nD + k, val: zG[i][k] });
    return r;
  });
  const model = fit(rows, labels, { nFeatures: space.nFeatures + nD + nG, lambda: 25, lr: 0.3, epochs: 3000 });
  console.log('\nCoaching-feature weights (standardized, config B full-data fit):');
  [...DERIVED_NAMES, ...GRADE_NAMES].forEach((n, k) => {
    const w = model.w[space.nFeatures + k];
    console.log(`    ${n.padEnd(14)} ${w >= 0 ? '+' : ''}${w.toFixed(4)}`);
  });
  console.log('\n(positive weight ⇒ higher value favours radiant; |weight| ≈ standardized impact)');
}

main().catch(err => { console.error(err); process.exit(1); });
