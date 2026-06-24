// The four graded matchup scales should always be well-formed (0–10) and the
// game-matchup scale should respond to injected win-rate advantage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeMatchups } from '../../shared/matchupGrades';
import { hero } from './helpers';

const me = [hero('juggernaut', 1), hero('crystal_maiden', 2, 'hard_support')];
const enemy = [hero('phantom_assassin', 3), hero('lion', 4, 'support')];

test('all four scales are present and graded 0–10', () => {
  const g = gradeMatchups(me, enemy);
  for (const s of [g.synergy, g.lanePartner, g.laneMatchup, g.gameMatchup]) {
    assert.ok(s.grade >= 0 && s.grade <= 10, `${s.label} grade out of range: ${s.grade}`);
    assert.ok(s.verdict.length > 0);
    assert.ok(Array.isArray(s.entries));
  }
});

test('game matchup responds to injected win-rate advantage', () => {
  // Directional: my heroes (ids 1,2) favoured vs enemies (ids 3,4), and vice-versa.
  const mine = (a: number) => (a === 1 || a === 2);
  const favoured = gradeMatchups(me, enemy, a => (mine(a) ? 4 : -4));
  const against = gradeMatchups(me, enemy, a => (mine(a) ? -4 : 4));
  assert.ok(favoured.gameMatchup.grade > against.gameMatchup.grade,
    'a favourable win-rate edge should grade higher than an unfavourable one');
});

test('counteredBy lists enemies that beat my heroes', () => {
  const g = gradeMatchups(me, enemy, (a, b) => (a === 3 && b === 1 ? 5 : 0)); // PA beats Jugg
  assert.ok(g.counteredBy.some(e => e.aId === 3 && e.bId === 1));
});
