// Integration test for the item-matchup engine: validates that the mechanic
// vocabulary + item table + hero profiles wire together to produce the expected
// counter-item advice (the examples from the original feature request).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeItemMatchups, type ItemRec } from '../../shared/matchups';
import { hero } from './helpers';

// True if some recommended item answers `enemyName` with a reason containing `phrase`.
function answers(recs: ItemRec[], itemName: string, enemyName: string, phrase: string): boolean {
  const rec = recs.find(r => r.itemName === itemName);
  if (!rec) return false;
  return rec.answers.some(a => a.heroName === enemyName && a.reason.includes(phrase));
}

test('Silver Edge breaks passive-reliant heroes (Tidehunter, Phantom Assassin)', () => {
  const me = [hero('sven', 1), hero('crystal_maiden', 2, 'hard_support')];
  const enemy = [hero('tidehunter', 3, 'offlane'), hero('phantom_assassin', 4)];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, 'Silver Edge', 'tidehunter', 'breaks'), 'Silver Edge should break Tidehunter');
  assert.ok(answers(recommended, 'Silver Edge', 'phantom_assassin', 'breaks'), 'Silver Edge should break PA');
});

test('Monkey King Bar pierces Phantom Assassin evasion', () => {
  const me = [hero('juggernaut', 1)];
  const enemy = [hero('phantom_assassin', 2)];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, 'Monkey King Bar', 'phantom_assassin', 'evasion'));
});

test("Linken's Sphere blocks Spirit Breaker's targeted charge", () => {
  const me = [hero('juggernaut', 1)];
  const enemy = [hero('spirit_breaker', 2, 'offlane')];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, "Linken's Sphere", 'spirit_breaker', 'targeted'));
});

test("Eul's interrupts Spirit Breaker charge and Enigma channel", () => {
  const me = [hero('lina', 1, 'mid'), hero('jakiro', 2, 'support')];
  const enemy = [hero('spirit_breaker', 3, 'offlane'), hero('enigma', 4, 'offlane')];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, "Eul's Scepter", 'spirit_breaker', 'interrupts'));
  assert.ok(answers(recommended, "Eul's Scepter", 'enigma', 'interrupts'));
});

test('Hard control (Scythe of Vyse) is advised against slippery Puck', () => {
  const me = [hero('lina', 1, 'mid'), hero('lion', 2, 'support')];
  const enemy = [hero('puck', 3, 'mid')];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, 'Scythe of Vyse', 'puck', 'locks down'));
});

test('Detection (Gem) is advised against invisible Riki', () => {
  const me = [hero('tidehunter', 1, 'offlane')];
  const enemy = [hero('riki', 2)];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, 'Gem of True Sight', 'riki', 'invisibility'));
});

test('Spirit Vessel anti-heal is advised against Huskar', () => {
  const me = [hero('tidehunter', 1, 'offlane'), hero('jakiro', 2, 'support')];
  const enemy = [hero('huskar', 3)];
  const { recommended } = computeItemMatchups(me, enemy);
  assert.ok(answers(recommended, 'Spirit Vessel', 'huskar', 'healing'));
});

test('threats list is symmetric (enemy answers to my heroes)', () => {
  const me = [hero('phantom_assassin', 1)];
  const enemy = [hero('juggernaut', 2)];
  const { threats } = computeItemMatchups(me, enemy);
  // they should be advised MKB vs our PA's evasion
  assert.ok(threats.some(r => r.itemName === 'Monkey King Bar'), 'enemy should consider MKB vs our PA');
});
