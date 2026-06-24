// Temperature scaling: a single scalar T that rescales the model's logits
// (p = sigmoid(z / T)) to fix over/under-confidence without changing the
// ranking (so AUC is unchanged, but log-loss and the displayed probabilities
// become honest). T is fit on held-out (out-of-fold) logits to minimise NLL.
import { logLoss } from '../backtest/metrics';

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const applyTemperature = (logits: number[], T: number) => logits.map(z => sigmoid(z / T));

export function fitTemperature(logits: number[], labels: number[]): number {
  let best = 1, bestLoss = Infinity;
  // Coarse grid, then refine around the minimum (NLL in T is smooth/unimodal).
  for (let T = 0.3; T <= 6; T += 0.05) {
    const ll = logLoss(applyTemperature(logits, T), labels);
    if (ll < bestLoss) { bestLoss = ll; best = T; }
  }
  for (let T = best - 0.05; T <= best + 0.05; T += 0.005) {
    if (T <= 0) continue;
    const ll = logLoss(applyTemperature(logits, T), labels);
    if (ll < bestLoss) { bestLoss = ll; best = T; }
  }
  return Math.round(best * 1000) / 1000;
}
