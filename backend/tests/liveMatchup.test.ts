// Tests for the live-data blend (B1): setLiveMatchupProvider lets confident
// OpenDota win-rate advantage flow into analyzeTeam's lane-matchup signal while
// the hand-authored table stays the explanatory layer. No provider → pure hand data.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTeam, setLiveMatchupProvider } from '../../shared/scoring';
import { hero } from './helpers';

// Two heroes with no hand-authored lane matchup between them (filler ids).
const myCarry = hero('largo', 155, 'carry');
const enemyCarry = hero('marci_x', 156, 'carry');
const pool = [myCarry, enemyCarry];

// Keep global provider state from leaking into other test files.
afterEach(() => setLiveMatchupProvider(null));

function laneEntry() {
  const a = analyzeTeam([myCarry.id], [enemyCarry.id], [], pool);
  return a.laneMatchups.find(m => m.heroId === myCarry.id && m.enemyHeroId === enemyCarry.id);
}

test('with no live provider, an un-authored matchup produces no lane entry', () => {
  setLiveMatchupProvider(null);
  assert.equal(laneEntry(), undefined);
});

test('a confident live win-rate drives a lane-matchup advantage + provenance', () => {
  // Stub: my carry strongly favoured (+5) vs the enemy carry; 0 elsewhere.
  setLiveMatchupProvider((a, b) => (a === myCarry.id && b === enemyCarry.id ? 5 : 0));
  const m = laneEntry();
  assert.ok(m, 'live data created a lane-matchup entry');
  assert.ok(m!.advantage > 0, 'advantage reflects the live win-rate');
  assert.equal(m!.dataBacked, true, 'flagged as live-data-backed');
});

test('a below-threshold matchup (provider returns 0) stays hand-only', () => {
  // matchupService returns 0 below MIN_GAMES — must not fabricate a counter.
  setLiveMatchupProvider(() => 0);
  assert.equal(laneEntry(), undefined);
});
