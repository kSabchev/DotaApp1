// Turns a drafted match into a sparse feature row for the win model.
//
// Phase 1 feature sets (all signed from radiant's perspective; the model's
// intercept captures the radiant-side base advantage):
//
//  • HERO presence      — +1 if hero on radiant, −1 if on dire. Learns a
//                         per-hero win-contribution weight.
//  • SYNERGY (pairs)    — two heroes on the SAME team. +1 both radiant,
//                         −1 both dire. Learns "this duo over/under-performs".
//  • COUNTER (matchups) — two heroes on OPPOSITE teams, keyed unordered (lo,hi);
//                         +1 when lo is radiant facing hi, −1 when lo is dire.
//                         Learns "lo beats/loses to hi".
//
// Pair features are only created for pairs with enough support (minPairCount),
// and — crucially for honest CV — the feature space must be built from the
// TRAINING matches only, so test-fold co-occurrence never defines features.
import type { SparseRow } from './logreg';

export interface CorpusMatch {
  match_id: number;
  radiant_win: number;
  radiant: number[];
  dire: number[];
}

export interface FeatureSpace {
  heroIndex: Map<number, number>;
  synergyIndex: Map<string, number>;
  counterIndex: Map<string, number>;
  nFeatures: number;
  includePairs: boolean;
}

const synKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const cntKey = (a: number, b: number) => (a < b ? `${a}x${b}` : `${b}x${a}`);

export interface SpaceOpts {
  includePairs?: boolean;
  minPairCount?: number;
}

export function buildFeatureSpace(matches: CorpusMatch[], opts: SpaceOpts = {}): FeatureSpace {
  const { includePairs = false, minPairCount = 20 } = opts;

  // Hero features first (stable, sorted).
  const ids = new Set<number>();
  for (const m of matches) { for (const id of m.radiant) ids.add(id); for (const id of m.dire) ids.add(id); }
  const heroIndex = new Map<number, number>();
  let next = 0;
  for (const id of [...ids].sort((a, b) => a - b)) heroIndex.set(id, next++);

  const synergyIndex = new Map<string, number>();
  const counterIndex = new Map<string, number>();

  if (includePairs) {
    const synCount = new Map<string, number>();
    const cntCount = new Map<string, number>();
    for (const m of matches) {
      countSameTeam(m.radiant, synCount);
      countSameTeam(m.dire, synCount);
      for (const a of m.radiant) for (const b of m.dire) {
        cntCount.set(cntKey(a, b), (cntCount.get(cntKey(a, b)) ?? 0) + 1);
      }
    }
    for (const [k, c] of [...synCount].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (c >= minPairCount) synergyIndex.set(k, next++);
    }
    for (const [k, c] of [...cntCount].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (c >= minPairCount) counterIndex.set(k, next++);
    }
  }

  return { heroIndex, synergyIndex, counterIndex, nFeatures: next, includePairs };
}

function countSameTeam(team: number[], counts: Map<string, number>) {
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const k = synKey(team[i], team[j]);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
}

export function matchToRow(m: CorpusMatch, space: FeatureSpace): SparseRow {
  const row: SparseRow = [];

  // Hero presence
  for (const id of m.radiant) { const idx = space.heroIndex.get(id); if (idx !== undefined) row.push({ idx, val: +1 }); }
  for (const id of m.dire)    { const idx = space.heroIndex.get(id); if (idx !== undefined) row.push({ idx, val: -1 }); }

  if (space.includePairs) {
    // Synergy: same-team pairs
    pushSameTeam(m.radiant, +1, space.synergyIndex, row);
    pushSameTeam(m.dire, -1, space.synergyIndex, row);

    // Counter: opposite-team matchups, signed by which side the lower id is on
    for (const a of m.radiant) {
      for (const b of m.dire) {
        const idx = space.counterIndex.get(cntKey(a, b));
        if (idx === undefined) continue;
        const lo = Math.min(a, b);
        // lo on radiant? a is radiant here, so lo===a ⇒ +1, else −1
        row.push({ idx, val: lo === a ? +1 : -1 });
      }
    }
  }

  return row;
}

function pushSameTeam(team: number[], sign: number, index: Map<string, number>, row: SparseRow) {
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const idx = index.get(synKey(team[i], team[j]));
      if (idx !== undefined) row.push({ idx, val: sign });
    }
  }
}
