// Shared evaluation metrics for any radiant-win predictor (heuristic or model).
// Works on predicted probabilities in [0, 1] with binary labels (1 = radiant won).

export function auc(scores: number[], labels: number[]): number {
  // Rank-based (Mann–Whitney U) with tie-averaged ranks.
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a] - scores[b]);
  const ranks = new Array(scores.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j < idx.length && scores[idx[j]] === scores[idx[i]]) j++;
    const avg = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks[idx[k]] = avg;
    i = j;
  }
  let rankSumPos = 0, nPos = 0, nNeg = 0;
  for (let k = 0; k < labels.length; k++) {
    if (labels[k] === 1) { rankSumPos += ranks[k]; nPos++; } else nNeg++;
  }
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

export function logLoss(probs: number[], labels: number[]): number {
  const eps = 1e-12;
  let sum = 0;
  for (let i = 0; i < probs.length; i++) {
    const p = Math.min(1 - eps, Math.max(eps, probs[i]));
    sum += labels[i] === 1 ? -Math.log(p) : -Math.log(1 - p);
  }
  return sum / probs.length;
}

export function accuracy(probs: number[], labels: number[], threshold = 0.5): number {
  let correct = 0;
  for (let i = 0; i < probs.length; i++) {
    if ((probs[i] >= threshold ? 1 : 0) === labels[i]) correct++;
  }
  return correct / probs.length;
}

export function report(title: string, probs: number[], labels: number[]): void {
  const n = probs.length;
  const base = labels.reduce((a, b) => a + b, 0) / n;

  console.log(`\n══════════ ${title} ══════════`);
  console.log(`Samples              : ${n}`);
  console.log(`Radiant base rate    : ${(base * 100).toFixed(1)}%`);
  console.log(`Accuracy @0.5        : ${(accuracy(probs, labels) * 100).toFixed(1)}%`);
  console.log(`AUC                  : ${auc(probs, labels).toFixed(4)}   (0.5 = coin flip)`);
  console.log(`Log-loss             : ${logLoss(probs, labels).toFixed(4)}   (lower is better; 0.693 = always 50%)`);

  // Calibration by predicted-probability decile.
  const edges = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0001];
  const buckets = edges.slice(0, -1).map((lo, i) => ({ lo, hi: edges[i + 1], n: 0, wins: 0 }));
  for (let i = 0; i < n; i++) {
    const b = buckets.find(b => probs[i] >= b.lo && probs[i] < b.hi);
    if (b) { b.n++; b.wins += labels[i]; }
  }
  console.log('\n  predicted P(radiant win)   matches    actual radiant winrate');
  console.log('  ──────────────────────────────────────────────────────────────');
  for (const b of buckets) {
    if (b.n === 0) continue;
    const wr = b.wins / b.n;
    const bar = '█'.repeat(Math.round(wr * 30));
    console.log(
      `  [${b.lo.toFixed(1)}, ${b.hi >= 1 ? '1.0' : b.hi.toFixed(1)})`.padEnd(22) +
      `${String(b.n).padStart(7)}` +
      `${(wr * 100).toFixed(1).padStart(15)}%   ${bar}`,
    );
  }
  console.log('  ──────────────────────────────────────────────────────────────');
  console.log('Well-calibrated ⇒ each row\'s actual winrate ≈ its predicted-prob range.');
}
