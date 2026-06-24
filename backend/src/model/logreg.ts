// Minimal L2-regularized logistic regression, pure TS (no native deps).
// Full-batch gradient descent over sparse feature rows — each match has only
// ~10 non-zero features (5 radiant heroes +1, 5 dire heroes −1), so this is fast.

export type SparseRow = { idx: number; val: number }[];

export interface LogRegModel {
  w: number[];   // per-feature weight (hero win-contribution)
  b: number;     // intercept (captures radiant-side base advantage)
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface FitOpts {
  nFeatures: number;
  lr?: number;        // learning rate
  lambda?: number;    // L2 strength
  epochs?: number;
}

export function fit(rows: SparseRow[], y: number[], opts: FitOpts): LogRegModel {
  const { nFeatures, lr = 0.3, lambda = 2.0, epochs = 3000 } = opts;
  const N = rows.length;
  const w = new Array(nFeatures).fill(0);
  let b = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gw = new Array(nFeatures).fill(0);
    let gb = 0;

    for (let i = 0; i < N; i++) {
      const row = rows[i];
      let z = b;
      for (const { idx, val } of row) z += w[idx] * val;
      const d = sigmoid(z) - y[i];          // error
      for (const { idx, val } of row) gw[idx] += d * val;
      gb += d;
    }

    // L2 penalty on weights (not bias) + average gradient step.
    for (let j = 0; j < nFeatures; j++) {
      gw[j] = gw[j] / N + lambda * w[j] / N;
      w[j] -= lr * gw[j];
    }
    b -= lr * (gb / N);
  }

  return { w, b };
}

/** Raw logit (pre-sigmoid). Used for temperature/probability calibration. */
export function predictLogit(model: LogRegModel, row: SparseRow): number {
  let z = model.b;
  for (const { idx, val } of row) z += model.w[idx] * val;
  return z;
}

export function predictProba(model: LogRegModel, row: SparseRow): number {
  return sigmoid(predictLogit(model, row));
}
