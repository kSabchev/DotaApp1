// Tests for the team capability profile (shared/capabilities.ts): each axis is
// derived from the picked heroes' utilityTags, and win conditions read from it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTeamCapabilities, capabilityHighlights, CAPABILITY_ORDER } from '../../shared/capabilities';
import { analyzeTeam } from '../../shared/scoring';
import type { Hero, UtilityTag } from '../../shared/types';
import { hero } from './helpers';

// Stub hero with explicit utility tags.
const tagged = (name: string, id: number, tags: UtilityTag[]): Hero => ({ ...hero(name, id), utilityTags: tags });

test('an AoE-control comp scores high on teamfight', () => {
  const picks = [
    tagged('a', 1, ['initiation']), tagged('b', 2, ['stun']), tagged('c', 3, ['wave_clear']),
    tagged('d', 4, ['lockdown']), tagged('e', 5, ['burst']),
  ];
  const p = computeTeamCapabilities(picks, 0);
  assert.ok(p.teamfight.score >= 7, `teamfight ${p.teamfight.score} should be high`);
  assert.ok(p.teamfight.contributors.length >= 4, 'most heroes contribute to teamfight');
});

test('a siege comp scores high on push', () => {
  const picks = [
    tagged('a', 1, ['tower_damage']), tagged('b', 2, ['tower_damage']),
    tagged('c', 3, ['wave_clear']), tagged('d', 4, ['lane_pressure']), tagged('e', 5, []),
  ];
  const p = computeTeamCapabilities(picks, 0);
  assert.ok(p.push.score >= 7, `push ${p.push.score} should be high`);
});

test('empty picks yield all-zero axes', () => {
  const p = computeTeamCapabilities([], 0);
  assert.ok(CAPABILITY_ORDER.every(id => p[id].score === 0), 'every axis is 0');
});

test('roshan axis reflects the roshan tag and physical stack', () => {
  const p = computeTeamCapabilities([tagged('a', 1, ['roshan'])], 2);
  assert.ok(p.roshan.score > 0, 'roshan capability registered');
  assert.deepEqual(p.roshan.contributors, [1]);
});

test('capabilityHighlights splits strengths (≥7) from gaps (≤3)', () => {
  const picks = [
    tagged('a', 1, ['initiation']), tagged('b', 2, ['stun']), tagged('c', 3, ['wave_clear']),
    tagged('d', 4, ['lockdown']), tagged('e', 5, ['burst']),
  ];
  const { can, cant } = capabilityHighlights(computeTeamCapabilities(picks, 0));
  assert.ok(can.some(a => a.id === 'teamfight'), 'teamfight is a strength');
  assert.ok(cant.length > 0 && cant.every(a => a.score <= 3), 'gaps are all low-scored');
  // This comp has no scaling/sustain → those should be gaps.
  assert.ok(cant.some(a => a.id === 'scaling'));
});

test('pick suggestions reward a damage-balancing hero (Phase 3)', () => {
  // Three physical cores → suggestions should flag a magical hero as balancing.
  const pool = [
    hero('medusa', 94), hero('spectre', 67), hero('antimage', 1),
    hero('lina', 25, 'mid'), hero('crystal_maiden', 5, 'hard_support'),
  ];
  const a = analyzeTeam([94, 67, 1], [], [25, 5], pool, {});
  const lina = a.recommendedPicks.find(r => r.heroId === 25);
  assert.ok(lina, 'magical hero is suggested');
  assert.ok(lina!.reasons.some(r => /magical/i.test(r)), 'reason calls out the damage balance');
});

test('pick suggestions reward a space-creator for a greedy comp (Phase 3)', () => {
  // Three farm-hungry cores with no space → a provider should be flagged.
  const pool = [
    hero('medusa', 94), hero('spectre', 67), hero('antimage', 1),
    hero('tidehunter', 29, 'offlane'), hero('crystal_maiden', 5, 'hard_support'),
  ];
  const a = analyzeTeam([94, 67, 1], [], [29, 5], pool, {});
  const tide = a.recommendedPicks.find(r => r.heroId === 29);
  assert.ok(tide, 'space-creator is suggested');
  assert.ok(tide!.reasons.some(r => /space/i.test(r)), 'reason calls out creating space');
});

test('analyzeTeam exposes a full capability profile', () => {
  const pool = [
    tagged('a', 1, ['initiation']), tagged('b', 2, ['stun']), tagged('c', 3, ['wave_clear']),
    tagged('d', 4, ['lockdown']), tagged('e', 5, ['scaling']),
  ];
  const a = analyzeTeam([1, 2, 3, 4, 5], [], [], pool, {});
  assert.ok(a.capabilities, 'capabilities present on the analysis');
  assert.ok(CAPABILITY_ORDER.every(id => typeof a.capabilities[id].score === 'number'), 'all 11 axes scored');
});
