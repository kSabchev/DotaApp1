// Loads the trained win model from the backend and exposes a synchronous
// win-probability lookup for the live draft. Degrades gracefully (returns null)
// if the model isn't available.
import { predictRadiantWinProb, type WinModel } from '../../../shared/winModel';
import { API_BASE as BACKEND } from '../config';

let model: WinModel | null = null;
let loaded = false;

export async function loadWinModel(): Promise<void> {
  if (loaded) return;
  try {
    const res = await fetch(`${BACKEND}/model`);
    if (!res.ok) return;
    model = (await res.json()) as WinModel;
    loaded = true;
  } catch {
    // Backend offline — feature simply won't show.
  }
}

export function isWinModelLoaded(): boolean {
  return loaded && model !== null;
}

export function getModelInfo(): { source: string; trainMatches?: number; includePairs: boolean } | null {
  return model ? { source: model.source, trainMatches: model.trainMatches, includePairs: model.includePairs } : null;
}

/** P(radiant win) in [0,1], or null if the model isn't loaded. */
export function getRadiantWinProbability(radiant: number[], dire: number[]): number | null {
  if (!model || (radiant.length === 0 && dire.length === 0)) return null;
  return predictRadiantWinProb(model, radiant, dire);
}
