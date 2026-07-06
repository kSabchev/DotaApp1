// Tests for hero playstyles (shared/heroPlaystyles.ts): override validity,
// label/description completeness, derivation rules, and full coverage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYSTYLE_OVERRIDES, PLAYSTYLE_LABEL, PLAYSTYLE_DESCRIPTION,
  derivePlaystyles, getHeroPlaystyles,
} from '../../shared/heroPlaystyles';
import { HERO_IDS } from '../../shared/interactions';
import { hero } from './helpers';
import type { Hero, Playstyle } from '../../shared/types';

const ALL_STYLES: Playstyle[] = [
  'constant_fighter', 'cooldown_fighter', 'split_map_farmer', 'greedy_farmer',
  'initiator', 'frontline', 'backline', 'roamer', 'tempo_controller', 'global_presence',
];

test('every override key is a valid hero short-name', () => {
  for (const key of Object.keys(PLAYSTYLE_OVERRIDES)) {
    assert.ok(HERO_IDS[key] !== undefined, `override key '${key}' is not in HERO_IDS`);
  }
});

test('every override array is non-empty and uses valid playstyles', () => {
  for (const [key, styles] of Object.entries(PLAYSTYLE_OVERRIDES)) {
    assert.ok(styles.length > 0, `override for '${key}' is empty`);
    for (const s of styles) assert.ok(ALL_STYLES.includes(s), `'${key}' has unknown playstyle '${s}'`);
    assert.equal(new Set(styles).size, styles.length, `'${key}' has duplicate playstyles`);
  }
});

test('labels and descriptions exist for every playstyle', () => {
  for (const s of ALL_STYLES) {
    assert.ok(PLAYSTYLE_LABEL[s], `missing label for '${s}'`);
    assert.ok(PLAYSTYLE_DESCRIPTION[s], `missing description for '${s}'`);
  }
});

test('user-named examples carry their signature playstyles', () => {
  assert.ok(PLAYSTYLE_OVERRIDES.spectre.includes('split_map_farmer'));
  assert.ok(PLAYSTYLE_OVERRIDES.dawnbreaker.includes('split_map_farmer'));
  assert.ok(PLAYSTYLE_OVERRIDES.wisp.includes('split_map_farmer'));
  assert.ok(PLAYSTYLE_OVERRIDES.antimage.includes('greedy_farmer'));
  assert.ok(PLAYSTYLE_OVERRIDES.enigma.includes('cooldown_fighter'));
  assert.ok(PLAYSTYLE_OVERRIDES.axe.includes('frontline'));
});

test('derivation: initiation tag makes an initiator (and cooldown fighter)', () => {
  const h: Hero = { ...hero('largo', 155, 'offlane'), utilityTags: ['initiation'], attribute: 'strength' };
  const styles = derivePlaystyles(h);
  assert.ok(styles.includes('initiator'));
  assert.ok(styles.includes('cooldown_fighter'));
  assert.ok(styles.includes('frontline')); // melee + str + initiation
});

test('derivation: ranged scaler defaults to backline', () => {
  const h: Hero = { ...hero('largo', 155, 'carry'), attack: 'ranged', utilityTags: ['scaling'] };
  assert.ok(derivePlaystyles(h).includes('backline'));
});

test('derivation: rotate support becomes a roamer', () => {
  const h: Hero = { ...hero('largo', 155, 'support'), utilityTags: ['rotate'] };
  assert.ok(derivePlaystyles(h).includes('roamer'));
});

test('derivation: space user becomes a greedy farmer', () => {
  // medusa is in SPACE_USERS but has no override-independent tags here
  const h: Hero = { ...hero('medusa', 94, 'carry'), utilityTags: [] };
  assert.ok(derivePlaystyles(h).includes('greedy_farmer'));
});

test('playstyles are never empty for any hero', () => {
  // Bare stub with no tags at all — fallback fires.
  const bareMelee: Hero = { ...hero('largo', 155), utilityTags: [] };
  const bareRanged: Hero = { ...hero('largo', 155), attack: 'ranged', utilityTags: [] };
  assert.ok(getHeroPlaystyles(bareMelee).length > 0);
  assert.ok(getHeroPlaystyles(bareRanged).length > 0);
  // Overridden hero returns the override verbatim.
  assert.deepEqual(getHeroPlaystyles(hero('spectre', 67)), PLAYSTYLE_OVERRIDES.spectre);
});
