// Trains the data-driven win model and evaluates it HONESTLY with 5-fold
// cross-validation (metrics computed only on held-out matches). The feature
// space is rebuilt from each fold's TRAINING matches, so test-fold co-occurrence
// never leaks into which features exist. Then trains a final model on all data,
// saves it, and prints the heroes / pairs it learned to value most.
//
// Run:  npm run train -- pro          (hero-presence baseline)
//       npm run train -- pro pairs    (+ learned synergy & counter features)
import * as fs from 'fs';
import * as path from 'path';
import { fit, predictLogit, type SparseRow } from './logreg';
import { buildFeatureSpace, matchToRow, type CorpusMatch, type FeatureSpace } from './features';
import { fitTemperature, applyTemperature } from './calibrate';
import { report, logLoss } from '../backtest/metrics';
import { loadMatchesForBacktest } from '../db';
import { getHeroById } from '../ingest/heroPool';

const FOLDS = 5;
const INCLUDE_PAIRS = process.argv.includes('pairs');
// Mode-aware defaults (from a CV sweep): pair features are data-hungry and need
// much stronger L2 + more support, or they overfit. Override via env to re-sweep.
const HYPER = {
  lr: 0.3,
  lambda: Number(process.env.LAMBDA) || (INCLUDE_PAIRS ? 25 : 2.0),
  epochs: 3000,
};
const MIN_PAIR = Number(process.env.MINPAIR) || (INCLUDE_PAIRS ? 45 : 20);

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

async function main() {
  const source = process.argv[2];
  const includePairs = process.argv.includes('pairs');
  const dbSource = source === 'pub' ? 'opendota_pub' : 'opendota_pro';

  const raw = loadMatchesForBacktest(dbSource).filter(
    m => m.radiant.length === 5 && m.dire.length === 5,
  ) as CorpusMatch[];
  if (raw.length < 100) { console.error(`Only ${raw.length} matches for ${dbSource}; ingest more.`); process.exit(1); }

  const matches = shuffled(raw);
  const labels = matches.map(m => m.radiant_win);

  console.log(`Corpus: ${matches.length} ${dbSource} matches.  Features: hero${includePairs ? ' + synergy + counter' : ' only'}.`);
  console.log(`Heuristic baseline AUC on pro was 0.484; hero-only model was 0.562 — the bar to beat.`);

  // ── 5-fold CV, feature space rebuilt per fold from training matches only ──
  const oofLogit = new Array(matches.length).fill(0);
  let lastNFeatures = 0;
  for (let f = 0; f < FOLDS; f++) {
    const trainMatches: CorpusMatch[] = [], testIdx: number[] = [];
    for (let i = 0; i < matches.length; i++) {
      if (i % FOLDS === f) testIdx.push(i); else trainMatches.push(matches[i]);
    }
    const space = buildFeatureSpace(trainMatches, { includePairs, minPairCount: MIN_PAIR });
    lastNFeatures = space.nFeatures;
    const trainRows: SparseRow[] = [], trainY: number[] = [];
    for (const m of trainMatches) { trainRows.push(matchToRow(m, space)); trainY.push(m.radiant_win); }
    const model = fit(trainRows, trainY, { nFeatures: space.nFeatures, ...HYPER });
    for (const i of testIdx) oofLogit[i] = predictLogit(model, matchToRow(matches[i], space));
  }

  console.log(`(~${lastNFeatures} features per fold)`);

  // Fit temperature on the held-out logits, then report uncalibrated vs calibrated.
  const temperature = fitTemperature(oofLogit, labels);
  const oofRaw = applyTemperature(oofLogit, 1);
  const oofCal = applyTemperature(oofLogit, temperature);
  report(`5-FOLD CV — held-out, UNCALIBRATED (${dbSource}${includePairs ? ', +pairs' : ''})`, oofRaw, labels);
  console.log(`\nFitted temperature T = ${temperature}  (>1 ⇒ model was overconfident; probabilities pulled toward 50%)`);
  console.log(`Log-loss: ${logLoss(oofRaw, labels).toFixed(4)} → ${logLoss(oofCal, labels).toFixed(4)} after scaling (0.693 = always-50%).`);
  report(`5-FOLD CV — held-out, CALIBRATED (T=${temperature})`, oofCal, labels);

  // ── Final model on all data: save + interpret ──
  const space = buildFeatureSpace(matches, { includePairs, minPairCount: MIN_PAIR });
  const rows = matches.map(m => matchToRow(m, space));
  const finalModel = fit(rows, labels, { nFeatures: space.nFeatures, ...HYPER });

  const outDir = path.resolve(__dirname, '..', '..', 'data');
  const outPath = path.join(outDir, `model_${dbSource}${includePairs ? '_pairs' : ''}.json`);
  fs.writeFileSync(outPath, JSON.stringify({
    source: dbSource, includePairs, nFeatures: space.nFeatures, hyper: HYPER, minPair: MIN_PAIR,
    temperature,
    heroIndex: Object.fromEntries(space.heroIndex),
    synergyIndex: Object.fromEntries(space.synergyIndex),
    counterIndex: Object.fromEntries(space.counterIndex),
    weights: finalModel.w, bias: finalModel.b,
    trainedAt: Date.now(), trainMatches: matches.length,
  }));
  console.log(`\nSaved model → ${outPath}`);
  console.log(`Radiant-side bias (intercept): ${finalModel.b.toFixed(3)} (base rate ${(labels.reduce((a, b) => a + b, 0) / labels.length * 100).toFixed(1)}%)`);

  await printInterpretation(finalModel.w, space, includePairs);
}

async function printInterpretation(w: number[], space: FeatureSpace, includePairs: boolean) {
  const byId = await getHeroById();
  const name = (id: number) => byId.get(id)?.displayName ?? `#${id}`;

  const heroes = [...space.heroIndex.entries()].map(([id, idx]) => ({ label: name(id), weight: w[idx] }));
  heroes.sort((a, b) => b.weight - a.weight);
  const fmt = (h: { label: string; weight: number }) => `    ${h.label.padEnd(28)} ${h.weight >= 0 ? '+' : ''}${h.weight.toFixed(3)}`;
  console.log('\nTop 10 heroes by win-contribution:'); heroes.slice(0, 10).forEach(h => console.log(fmt(h)));
  console.log('Bottom 10:'); heroes.slice(-10).reverse().forEach(h => console.log(fmt(h)));

  if (!includePairs) return;

  const syn = [...space.synergyIndex.entries()].map(([k, idx]) => {
    const [a, b] = k.split('-').map(Number);
    return { label: `${name(a)} + ${name(b)}`, weight: w[idx] };
  }).sort((a, b) => b.weight - a.weight);
  console.log('\nTop 8 learned SYNERGIES (duo over-performs):'); syn.slice(0, 8).forEach(h => console.log(fmt(h)));

  const cnt = [...space.counterIndex.entries()].map(([k, idx]) => {
    const [a, b] = k.split('x').map(Number); // positive weight ⇒ a counters b
    return { label: `${name(a)} ⟶ counters ${name(b)}`, weight: w[idx] };
  }).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  console.log('\nTop 8 strongest learned COUNTERS (by magnitude):');
  cnt.slice(0, 8).forEach(h => console.log(`    ${h.label.padEnd(40)} ${h.weight >= 0 ? '+' : ''}${h.weight.toFixed(3)}`));
}

main().catch(err => { console.error(err); process.exit(1); });
