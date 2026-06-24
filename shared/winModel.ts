// Pure predictor for the trained win model. Mirrors the feature construction
// in backend/src/model/features.ts exactly (hero presence ±1 by side, plus
// optional same-team synergy and opposite-team counter features), then applies
// the logistic weights + bias. Runs identically in Node and the browser.

export interface WinModel {
  source: string;
  includePairs: boolean;
  heroIndex: Record<string, number>;   // heroId → feature idx
  synergyIndex: Record<string, number>; // "lo-hi" → idx
  counterIndex: Record<string, number>; // "loxhi" → idx
  weights: number[];
  bias: number;
  temperature?: number;  // logit divisor from calibration; defaults to 1
  trainMatches?: number;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const synKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const cntKey = (a: number, b: number) => (a < b ? `${a}x${b}` : `${b}x${a}`);

/** P(radiant win) for the given draft. Works on partial drafts too (the bias
 *  dominates early and the estimate firms up as picks come in). */
export function predictRadiantWinProb(model: WinModel, radiant: number[], dire: number[]): number {
  const { weights: w, heroIndex, synergyIndex, counterIndex } = model;
  let z = model.bias;

  for (const id of radiant) { const idx = heroIndex[id]; if (idx !== undefined) z += w[idx]; }
  for (const id of dire)    { const idx = heroIndex[id]; if (idx !== undefined) z -= w[idx]; }

  if (model.includePairs) {
    addSameTeam(radiant, +1, synergyIndex, w, v => (z += v));
    addSameTeam(dire, -1, synergyIndex, w, v => (z += v));
    for (const a of radiant) {
      for (const b of dire) {
        const idx = counterIndex[cntKey(a, b)];
        if (idx === undefined) continue;
        z += w[idx] * (Math.min(a, b) === a ? +1 : -1);
      }
    }
  }

  // Temperature scaling: rescale the logit so the probability is calibrated.
  return sigmoid(z / (model.temperature || 1));
}

function addSameTeam(
  team: number[], sign: number, index: Record<string, number>,
  w: number[], add: (v: number) => void,
) {
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const idx = index[synKey(team[i], team[j])];
      if (idx !== undefined) add(w[idx] * sign);
    }
  }
}
