// Smoke test for the scoring engine — analyzeTeam should return a complete,
// well-typed analysis for a normal draft without throwing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTeam, setMetaPickProvider } from '../../shared/scoring';
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

test('analyzeTeam returns a team identity with one member per pick', () => {
  const a = analyzeTeam(radiant, dire, [], HEROES, {});
  assert.ok(a.identity, 'has an identity');
  assert.equal(a.identity.members.length, radiant.length);
  for (const m of a.identity.members) assert.ok(m.playstyles.length > 0);
  assert.ok(a.identity.summary.length > 0);
});

test('scores are bounded by their component maxima', () => {
  const a = analyzeTeam(radiant, dire, [], HEROES, {});
  assert.ok(a.synergyScore <= 25);
  assert.ok(a.counterScore <= 15);
  assert.ok(a.roleBalanceScore <= 10);
});

test('meta pick provider boosts a hero into the suggestions and ablates cleanly', () => {
  const availableIds = HEROES.slice(10).map(h => h.id);

  // Pick a hero that does NOT organically make the top-5 — the boost must be
  // what puts it there, and ablation must drop it back out.
  const baseline = analyzeTeam(radiant, dire, availableIds, HEROES, {});
  const baselineTop = new Set(baseline.recommendedPicks.map(r => r.heroId));
  const boosted = availableIds.find(id => !baselineTop.has(id))!;
  assert.ok(boosted, 'expected at least one hero outside the organic top-5');

  try {
    setMetaPickProvider(id => (id === boosted ? { boost: 50, note: 'Meta test note' } : { boost: 0 }));

    const withMeta = analyzeTeam(radiant, dire, availableIds, HEROES, {});
    assert.equal(withMeta.recommendedPicks[0]?.heroId, boosted, 'boosted hero should rank first');

    // Ablating the meta module removes the boost entirely — back out of the top-5.
    const ablated = analyzeTeam(radiant, dire, availableIds, HEROES, {}, null, { meta: true });
    assert.ok(!ablated.recommendedPicks.some(r => r.heroId === boosted), 'ablated run should not contain the boosted hero');
  } finally {
    setMetaPickProvider(null); // never leak the provider into other tests
  }

  // With no provider the engine behaves exactly as before.
  const without = analyzeTeam(radiant, dire, availableIds, HEROES, {});
  assert.ok(!without.recommendedPicks.some(r => r.heroId === boosted));
});
