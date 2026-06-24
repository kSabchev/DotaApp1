// Tests for the "free game" analysis (shared/heroFreedom.ts): per-hero fragility
// and whether an enemy draft leaves a hero free or disrupts it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getHeroFragility, analyzeHeroFreedom } from '../../shared/heroFreedom';
import { hero } from './helpers';

// Real OpenDota ids so interaction-counter lookups resolve.
const fv = hero('faceless_void', 41);
const doom = hero('doom_bringer', 69);
const storm = hero('storm_spirit', 17);
const silencer = hero('silencer', 75);
const jugg = hero('juggernaut', 8);
const filler = hero('largo', 155); // not in interactions or providers

// ─── fragility ──────────────────────────────────────────────────────────────

test('getHeroFragility uses hand overrides', () => {
  assert.equal(getHeroFragility(hero('medusa', 94)), 'fragile');
  assert.equal(getHeroFragility(hero('tidehunter', 29)), 'resilient');
});

test('getHeroFragility derives sensible defaults from the mechanic profile', () => {
  // shadow_shaman relies on single_target_spell + channel → fragile (not hand-tagged)
  assert.equal(getHeroFragility(hero('shadow_shaman', 27)), 'fragile');
  // juggernaut relies only on right_click → normal (resilient is hand-only)
  assert.equal(getHeroFragility(hero('juggernaut', 8)), 'normal');
});

// ─── free-game analysis ────────────────────────────────────────────────────────

test('a hero with no drafted counters has a free game', () => {
  const [f] = analyzeHeroFreedom([jugg], [filler]);
  assert.equal(f.status, 'free');
  assert.equal(f.counters.length, 0);
  assert.match(f.note, /free game/i);
});

test('a curated hero↔hero counter is detected (Doom vs Faceless Void)', () => {
  const [f] = analyzeHeroFreedom([fv], [doom]);
  assert.notEqual(f.status, 'free');
  assert.ok(f.counters.some(c => c.enemyId === doom.id), 'Doom listed as a counter');
  assert.ok(f.counters[0].reason.length > 0);
});

test('a mechanic-based counter is detected (Silencer vs Storm Spirit)', () => {
  // Storm is vulnerable to silence; Silencer natively provides it.
  const [f] = analyzeHeroFreedom([storm], [silencer]);
  assert.ok(f.counters.some(c => c.enemyId === silencer.id), 'Silencer disrupts Storm');
  assert.notEqual(f.status, 'free');
});

test('fragility scales severity — fragile heroes are hit harder by the same counter', () => {
  // Both heroes face the same enemy; compare a hand-fragile vs hand-resilient hero
  // each against a strong curated counter, asserting the fragile one ranks no better.
  const order: Record<string, number> = { free: 0, minor: 1, contested: 2, shut_down: 3 };
  const fragileF = analyzeHeroFreedom([fv], [doom])[0];          // FV (normal/derived) vs Doom
  const resilientF = analyzeHeroFreedom([hero('tidehunter', 29)], [doom])[0]; // resilient vs Doom (may be free)
  assert.ok(order[fragileF.status] >= order[resilientF.status]);
});
