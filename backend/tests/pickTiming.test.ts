// Tests for draft-position timing: pickContextForTeam (slot counting) and the
// timing advice rankPicks attaches to suggestions (via analyzeTeam).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTeam, pickContextForTeam } from '../../shared/scoring';
import type { DraftSlot, DraftTeam, Role, PickContext } from '../../shared/types';
import { hero } from './helpers';

const pick = (team: DraftTeam): DraftSlot => ({ phase: 'pick', team, heroId: null });
const filled = (team: DraftTeam): DraftSlot => ({ phase: 'pick', team, heroId: 1 });

// ─── pickContextForTeam ────────────────────────────────────────────────────────

test('pickContextForTeam counts remaining picks after the team\'s next pick', () => {
  const slots = [pick('radiant'), pick('dire'), pick('radiant'), pick('dire'), pick('radiant'), pick('dire')];
  const r = pickContextForTeam(slots, 'radiant', 0)!;
  assert.equal(r.enemyPicksAfter, 3);
  assert.equal(r.myPicksAfter, 2);
  assert.equal(r.isMyLastPick, false);
  const d = pickContextForTeam(slots, 'dire', 0)!;
  assert.equal(d.enemyPicksAfter, 2);
  assert.equal(d.myPicksAfter, 2);
});

test('pickContextForTeam marks the final pick as protected (no enemy after)', () => {
  const slots = [pick('radiant'), pick('dire'), pick('radiant'), pick('dire')];
  const d = pickContextForTeam(slots, 'dire', 3)!;
  assert.equal(d.enemyPicksAfter, 0);
  assert.equal(d.isMyLastPick, true);
});

test('pickContextForTeam ignores filled slots and returns null when the team is done', () => {
  const slots = [filled('radiant'), filled('dire'), pick('radiant'), pick('dire')];
  const r = pickContextForTeam(slots, 'radiant', 0)!;
  assert.equal(r.enemyPicksAfter, 1);   // only dire's empty pick remains after
  assert.equal(r.isMyLastPick, true);
  assert.equal(pickContextForTeam([filled('radiant'), filled('dire')], 'radiant', 0), null);
});

// ─── timing advice (rankPicks via analyzeTeam) ──────────────────────────────────

const medusa = hero('medusa', 94, 'carry'); // hand-tagged fragile
const myTeam = [hero('m', 501, 'mid'), hero('o', 502, 'offlane'), hero('s', 503, 'support'), hero('h', 504, 'hard_support')];
const assign: Record<number, Role> = { 501: 'mid', 502: 'offlane', 503: 'support', 504: 'hard_support' };
const pool = [...myTeam, medusa];
const recFor = (ctx: PickContext | null) =>
  analyzeTeam(myTeam.map(h => h.id), [], [medusa.id], pool, assign, ctx)
    .recommendedPicks.find(r => r.heroId === medusa.id);

test('a fragile hero is flagged save-for-later when the enemy can still respond', () => {
  const rec = recFor({ enemyPicksAfter: 2, myPicksAfter: 1, isMyLastPick: false });
  assert.ok(rec, 'medusa is still suggested (fills the open carry slot)');
  assert.equal(rec!.timing, 'save_for_later');
});

test('a fragile hero is commit-now on a protected free-game slot', () => {
  const rec = recFor({ enemyPicksAfter: 0, myPicksAfter: 0, isMyLastPick: true });
  assert.equal(rec!.timing, 'commit_now');
});

test('a fragile hero on your last pick is commit-now even if the enemy still picks', () => {
  const rec = recFor({ enemyPicksAfter: 1, myPicksAfter: 0, isMyLastPick: true });
  assert.equal(rec!.timing, 'commit_now');
});

test('no pick context → no timing attached', () => {
  assert.equal(recFor(null)!.timing, undefined);
});
