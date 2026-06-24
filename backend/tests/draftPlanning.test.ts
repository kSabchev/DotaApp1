// Tests for the role/coaching layer added in shared/scoring.ts:
//   inferRoles            — optimal 1:1 role assignment (used on draft import)
//   computeDraftHealth    — via analyzeTeam().draftHealth
//   buildGamePlanTimeline — via analyzeTeam().gamePlanTimeline
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTeam, inferRoles } from '../../shared/scoring';
import type { Hero, Role, UtilityTag } from '../../shared/types';
import { hero } from './helpers';

const ROLES: Role[] = ['carry', 'mid', 'offlane', 'support', 'hard_support'];

// Build a stub hero with explicit role + utility tags.
function mk(id: number, role: Role, tags: UtilityTag[] = [], name = `h${id}`): Hero {
  return { ...hero(name, id, role, name), utilityTags: tags };
}

// ─── inferRoles ────────────────────────────────────────────────────────────────

test('inferRoles maps five distinct-position heroes 1:1 onto all five roles', () => {
  const heroes = ROLES.map((r, i) => mk(100 + i, r));
  const result = inferRoles(heroes);
  ROLES.forEach((r, i) => assert.equal(result[100 + i], r, `${r} hero should keep its role`));
  assert.equal(new Set(Object.values(result)).size, 5, 'all five roles distinct');
});

test('inferRoles never assigns duplicate roles even when every hero wants carry', () => {
  const heroes = [mk(200, 'carry'), mk(201, 'carry'), mk(202, 'carry')];
  const result = inferRoles(heroes);
  const roles = Object.values(result);
  assert.equal(roles.length, 3);
  assert.equal(new Set(roles).size, 3, 'no duplicate roles');
  assert.ok(roles.includes('carry'), 'one hero still takes the carry slot');
  roles.forEach(r => assert.ok(ROLES.includes(r)));
});

test('inferRoles returns an empty map for no heroes', () => {
  assert.deepEqual(inferRoles([]), {});
});

// ─── computeDraftHealth (via analyzeTeam) ───────────────────────────────────────

const ASSIGN = (heroes: Hero[], roles: Role[]): Record<number, Role> =>
  Object.fromEntries(heroes.map((h, i) => [h.id, roles[i]]));

test('draftHealth rates a 3-core / 2-support draft as strong farm balance', () => {
  const picks = ROLES.map((r, i) => mk(300 + i, r));
  const roles = ASSIGN(picks, ROLES);
  const a = analyzeTeam(picks.map(h => h.id), [], [], picks, roles);
  assert.equal(a.draftHealth.farmBalance.rating, 'strong');
  // all four health notes are well-formed
  for (const note of [a.draftHealth.runeControl, a.draftHealth.gateRotations, a.draftHealth.midRotation, a.draftHealth.farmBalance]) {
    assert.ok(['strong', 'decent', 'weak', 'warning'].includes(note.rating));
    assert.ok(note.detail.length > 0, `${note.label} has a detail line`);
  }
});

test('draftHealth flags a greedy 4-core draft as a farm-balance warning', () => {
  // Two carries + mid + offlane + one support → coreCount 4 (regression guard:
  // coreCount must count core heroes, not just filled slots).
  const picks = [mk(400, 'carry'), mk(401, 'carry'), mk(402, 'mid'), mk(403, 'offlane'), mk(404, 'support')];
  const roles: Role[] = ['carry', 'carry', 'mid', 'offlane', 'support'];
  const a = analyzeTeam(picks.map(h => h.id), [], [], picks, ASSIGN(picks, roles));
  assert.equal(a.draftHealth.farmBalance.rating, 'warning');
});

test('draftHealth blink-breakers list non-carry initiators but not the carry', () => {
  const picks = [
    mk(500, 'carry', ['initiation']),   // carry initiator — excluded
    mk(501, 'offlane', ['initiation']), // off initiator — included
    mk(502, 'mid'),
    mk(503, 'support'),
    mk(504, 'hard_support'),
  ];
  const roles: Role[] = ['carry', 'offlane', 'mid', 'support', 'hard_support'];
  const a = analyzeTeam(picks.map(h => h.id), [], [], picks, ASSIGN(picks, roles));
  assert.ok(a.draftHealth.blinkBreakers.includes('h501'), 'offlane initiator is a blink breaker');
  assert.ok(!a.draftHealth.blinkBreakers.includes('h500'), 'carry initiator is not a blink breaker');
});

test('draftHealth surfaces a double-nuke combo for two burst heroes', () => {
  const picks = [
    mk(600, 'mid', ['burst'], 'Nuker A'),
    mk(601, 'support', ['burst'], 'Nuker B'),
    mk(602, 'carry'),
    mk(603, 'offlane'),
    mk(604, 'hard_support'),
  ];
  const roles: Role[] = ['mid', 'support', 'carry', 'offlane', 'hard_support'];
  const a = analyzeTeam(picks.map(h => h.id), [], [], picks, ASSIGN(picks, roles));
  const combo = a.draftHealth.combos.find(c => c.heroes.includes('Nuker A') && c.heroes.includes('Nuker B'));
  assert.ok(combo, 'two burst heroes form a combo callout');
});

// ─── buildGamePlanTimeline (via analyzeTeam) ────────────────────────────────────

function timelineFor(tags: UtilityTag[]) {
  const picks = ROLES.map((r, i) => mk(700 + i, r, tags));
  return analyzeTeam(picks.map(h => h.id), [], [], picks, ASSIGN(picks, ROLES)).gamePlanTimeline;
}

test('timeline always has the four ordered phases, valid tempo and non-empty actions', () => {
  const tl = timelineFor(['scaling']);
  assert.deepEqual(tl.phases.map(p => p.id), ['laning', 'early', 'mid', 'late']);
  assert.deepEqual(tl.phases.map(p => p.range), ['0–10 min', '10–20 min', '20–30 min', '35+ min']);
  for (const p of tl.phases) {
    assert.ok(['aggressive', 'neutral', 'defensive'].includes(p.tempo));
    assert.ok(p.headline.length > 0);
    assert.ok(p.actions.length >= 1 && p.actions.length <= 4);
  }
});

test('timeline marks exactly one peak phase and it is never the 10–20 window', () => {
  const tl = timelineFor(['scaling']); // late-peaking lineup
  const peaks = tl.phases.filter(p => p.isPeak);
  assert.equal(peaks.length, 1, 'exactly one peak phase');
  assert.equal(peaks[0].id, 'late', 'a pure-scaling draft peaks late');
  assert.ok(!tl.phases.find(p => p.id === 'early')!.isPeak);
});

test('timeline winBy is null for a late-game draft and a deadline for an early one', () => {
  assert.equal(timelineFor(['scaling']).winBy, null, 'late-game lineups have no deadline');
  const early = timelineFor(['lane_pressure', 'burst']);
  assert.match(early.winBy ?? '', /25 min/, 'early-peaking lineups must close by ~25 min');
});
