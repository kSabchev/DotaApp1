// The shared win-probability predictor: outputs a valid probability, responds
// to hero strength, and applies temperature scaling.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictRadiantWinProb, type WinModel } from '../../shared/winModel';

// Tiny hand-built model: hero 1 is "good" (+2), hero 2 is "bad" (−2).
const model: WinModel = {
  source: 'test', includePairs: false,
  heroIndex: { 1: 0, 2: 1 }, synergyIndex: {}, counterIndex: {},
  weights: [2, -2], bias: 0,
};

test('probability is in [0,1]', () => {
  const p = predictRadiantWinProb(model, [1], [2]);
  assert.ok(p >= 0 && p <= 1);
});

test('stronger radiant draft yields higher probability', () => {
  const strong = predictRadiantWinProb(model, [1], [2]); // good vs bad
  const weak = predictRadiantWinProb(model, [2], [1]);   // bad vs good
  assert.ok(strong > 0.5 && weak < 0.5);
  assert.ok(strong > weak);
});

test('temperature pulls probabilities toward 0.5', () => {
  const sharp = predictRadiantWinProb({ ...model, temperature: 1 }, [1], [2]);
  const soft = predictRadiantWinProb({ ...model, temperature: 3 }, [1], [2]);
  assert.ok(sharp > soft, 'higher temperature should reduce confidence');
  assert.ok(soft > 0.5, 'still favours radiant, just less strongly');
});

test('pair features adjust the prediction', () => {
  const withPairs: WinModel = {
    ...model, includePairs: true,
    synergyIndex: { '1-2': 2 }, // index 2
    weights: [2, -2, 5], bias: 0,
  };
  // both heroes on radiant ⇒ synergy feature +1 ⇒ higher than without
  const p = predictRadiantWinProb(withPairs, [1, 2], []);
  assert.ok(p > 0.5);
});
