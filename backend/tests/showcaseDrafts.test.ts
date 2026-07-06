// Data-integrity tests for the curated showcase drafts (shared/showcaseDrafts.ts):
// every entry must be a valid, complete, loadable picks-only manual draft.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHOWCASE_DRAFTS } from '../../shared/showcaseDrafts';
import { HERO_IDS } from '../../shared/interactions';

const VALID_IDS = new Set(Object.values(HERO_IDS));

test('showcase drafts have unique ids and non-empty copy', () => {
  const ids = SHOWCASE_DRAFTS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate showcase ids');
  for (const s of SHOWCASE_DRAFTS) {
    assert.ok(s.title.length > 0);
    assert.ok(s.blurb.length > 0);
    assert.ok(s.teams.radiant.length > 0 && s.teams.dire.length > 0);
  }
});

test('every showcase draft is a complete 5v5 picks-only manual draft', () => {
  for (const s of SHOWCASE_DRAFTS) {
    const d = s.draft;
    assert.equal(d.mode, 'manual', `${s.id}: mode must be manual`);
    assert.equal(d.slots.length, 10, `${s.id}: expected exactly 10 slots`);
    assert.ok(d.slots.every(sl => sl.phase === 'pick'), `${s.id}: bans are not allowed in showcase drafts`);
    const radiant = d.slots.filter(sl => sl.team === 'radiant');
    const dire = d.slots.filter(sl => sl.team === 'dire');
    assert.equal(radiant.length, 5, `${s.id}: radiant must have 5 picks`);
    assert.equal(dire.length, 5, `${s.id}: dire must have 5 picks`);
  }
});

test('every showcase pick is a valid, unique hero id', () => {
  for (const s of SHOWCASE_DRAFTS) {
    const heroIds = s.draft.slots.map(sl => sl.heroId);
    for (const id of heroIds) {
      assert.ok(id !== null && VALID_IDS.has(id), `${s.id}: invalid hero id ${id}`);
    }
    assert.equal(new Set(heroIds).size, heroIds.length, `${s.id}: duplicate hero within draft`);
  }
});

test('role assignments cover exactly the picked heroes with all five roles per team', () => {
  for (const s of SHOWCASE_DRAFTS) {
    const d = s.draft;
    const pickedIds = new Set(d.slots.map(sl => sl.heroId));
    const assignedIds = Object.keys(d.roleAssignments).map(Number);
    assert.equal(assignedIds.length, 10, `${s.id}: every pick needs a role`);
    for (const id of assignedIds) {
      assert.ok(pickedIds.has(id), `${s.id}: role assigned to unpicked hero ${id}`);
    }
    for (const team of ['radiant', 'dire'] as const) {
      const roles = d.slots
        .filter(sl => sl.team === team)
        .map(sl => d.roleAssignments[sl.heroId!]);
      assert.deepEqual(
        [...roles].sort(),
        ['carry', 'hard_support', 'mid', 'offlane', 'support'],
        `${s.id}: ${team} must cover all five roles`,
      );
    }
  }
});
