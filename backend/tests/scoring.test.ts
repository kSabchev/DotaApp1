// Smoke test for the scoring engine — analyzeTeam should return a complete,
// well-typed analysis for a normal draft without throwing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTeam } from '../../shared/scoring';
import { HEROES } from '../../shared/heroes';

const ids = HEROES.slice(0, 10).map(h => h.id);
const radiant = ids.slice(0, 5);
const dire = ids.slice(5, 10);

test('analyzeTeam returns a complete analysis', () => {
  const a = analyzeTeam(radiant, dire, [], HEROES, {});
  assert.equal(typeof a.totalScore, 'number');
  assert.ok(a.totalScore >= 0);
  assert.ok(a.draftVerdict, 'has a draft verdict');
  assert.ok(a.draftVerdict.primaryWinCondition.label.length > 0);
  assert.ok(Array.isArray(a.strengths));
  assert.ok(Array.isArray(a.weaknesses));
  assert.ok(Array.isArray(a.recommendedPicks));
  assert.ok(Array.isArray(a.draftVerdict.laneVerdict.predictions));
});

test('analyzeTeam handles an empty draft without throwing', () => {
  const a = analyzeTeam([], [], [], HEROES, {});
  assert.equal(typeof a.totalScore, 'number');
});

test('scores are bounded by their component maxima', () => {
  const a = analyzeTeam(radiant, dire, [], HEROES, {});
  assert.ok(a.synergyScore <= 25);
  assert.ok(a.counterScore <= 15);
  assert.ok(a.roleBalanceScore <= 10);
});
