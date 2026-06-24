// Sanity for the ML primitives: logistic regression learns a separable signal,
// and the metrics (AUC / log-loss) behave correctly on known inputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit, predictProba, type SparseRow } from '../src/model/logreg';
import { auc, logLoss, accuracy } from '../src/backtest/metrics';

test('logreg learns a perfectly separable signal', () => {
  // feature 0 = +1 ⇒ label 1; feature 0 = −1 ⇒ label 0.
  const rows: SparseRow[] = [];
  const y: number[] = [];
  for (let i = 0; i < 50; i++) { rows.push([{ idx: 0, val: 1 }]); y.push(1); }
  for (let i = 0; i < 50; i++) { rows.push([{ idx: 0, val: -1 }]); y.push(0); }
  const model = fit(rows, y, { nFeatures: 1, lambda: 0.01, epochs: 500 });
  assert.ok(predictProba(model, [{ idx: 0, val: 1 }]) > 0.7);
  assert.ok(predictProba(model, [{ idx: 0, val: -1 }]) < 0.3);
});

test('AUC is 1 for perfect ranking and 0 for inverted', () => {
  const scores = [0.1, 0.2, 0.8, 0.9];
  assert.equal(auc(scores, [0, 0, 1, 1]), 1);
  assert.equal(auc(scores, [1, 1, 0, 0]), 0);
});

test('AUC is ~0.5 for no signal (tied scores)', () => {
  assert.equal(auc([0.5, 0.5, 0.5, 0.5], [0, 1, 0, 1]), 0.5);
});

test('log-loss rewards confident-correct and punishes confident-wrong', () => {
  const good = logLoss([0.99, 0.01], [1, 0]);
  const bad = logLoss([0.01, 0.99], [1, 0]);
  assert.ok(good < 0.1);
  assert.ok(bad > 2);
});

test('accuracy thresholds at 0.5', () => {
  assert.equal(accuracy([0.9, 0.1, 0.6, 0.4], [1, 0, 1, 0]), 1);
});
