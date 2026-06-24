// The scoring engine now lives in the framework-free shared core
// (`shared/scoring.ts`) so the backend backtest can run the exact same
// logic in Node. This file re-exports it and re-binds `rankBanThreats`
// to the live OpenDota-backed services (matchup win rates + meta tiers),
// keeping existing frontend behavior and call signatures unchanged.
import {
  rankBanThreats as coreRankBanThreats,
  type BanThreat,
} from '../../../shared/scoring';
import type { Hero, WinConditionResult } from '../types';
import { getApiCounterThreats } from '../data/matchupService';
import { metaBanBoost } from '../data/metaService';

export * from '../../../shared/scoring';

// Inject the live data services that aren't available in a pure/Node context.
export function rankBanThreats(
  myPickIds: number[],
  enemyPickIds: number[],
  availableIds: number[],
  heroPool?: Hero[],
  primaryWinCon?: WinConditionResult,
): BanThreat[] {
  return coreRankBanThreats(
    myPickIds, enemyPickIds, availableIds, heroPool, primaryWinCon,
    { getApiCounterThreats, metaBanBoost },
  );
}
