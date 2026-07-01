// Tests for Phase-2 team traits (shared/heroTraits.ts): damage type mix, space
// economy (providers vs users), and Roshan reliance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTeamTraits, damageTypeOf } from '../../shared/heroTraits';
import { hero } from './helpers';
import type { Hero } from '../../shared/types';

// Real OpenDota ids so name-keyed trait maps resolve.
const medusa = hero('medusa', 94);
const spectre = hero('spectre', 67);
const antimage = hero('antimage', 1);
const lina = hero('lina', 25);
const lion = hero('lion', 26);
const tide = hero('tidehunter', 29);
const ursa = hero('ursa', 70);

test('damageTypeOf uses hand tags then attribute fallback', () => {
  assert.equal(damageTypeOf(medusa), 'physical');
  assert.equal(damageTypeOf(lina), 'magical');
  assert.equal(damageTypeOf(hero('ancient_apparition', 68)), 'pure');
  // Unknown hero falls back to attribute (helpers default = agility → physical).
  assert.equal(damageTypeOf(hero('largo', 155)), 'physical');
});

test('a physical carry lineup is flagged lopsided physical', () => {
  const t = computeTeamTraits([medusa, spectre, antimage]);
  assert.equal(t.damage.dominant, 'physical');
  assert.match(t.damage.note, /armor/i);
});

test('a caster lineup is flagged lopsided magical', () => {
  const t = computeTeamTraits([lina, lion, hero('crystal_maiden', 5)]);
  assert.equal(t.damage.dominant, 'magical');
  assert.match(t.damage.note, /magic resist/i);
});

test('space economy flags too many farm-hungry cores with no creators', () => {
  const t = computeTeamTraits([medusa, spectre, antimage, lina, lion]);
  assert.equal(t.space.rating, 'no_space');
  assert.equal(t.space.userIds.length, 3);
  assert.equal(t.space.providerIds.length, 0);
});

test('space economy reads balanced when a provider supports the farmers', () => {
  const t = computeTeamTraits([medusa, tide, lina]);
  assert.equal(t.space.rating, 'balanced');
  assert.ok(t.space.providerIds.includes(tide.id));
  assert.ok(t.space.userIds.includes(medusa.id));
});

test('Roshan-reliant heroes are detected and named', () => {
  const t = computeTeamTraits([ursa, lina]);
  assert.deepEqual(t.roshanReliantIds, [ursa.id]);
  assert.match(t.roshanNote, /Aegis/i);
});
