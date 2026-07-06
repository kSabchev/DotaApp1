// Tests for the Team Identity beta (shared/teamIdentity.ts): greed warnings,
// missing-initiation warnings, line balance, rhythm narration, and safety.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTeamIdentity } from '../../shared/teamIdentity';
import { hero } from './helpers';

// Real short-names/ids so PLAYSTYLE_OVERRIDES resolve.
const am = hero('antimage', 1, 'carry', 'Anti-Mage');
const medusa = hero('medusa', 94, 'carry', 'Medusa');
const spectre = hero('spectre', 67, 'carry', 'Spectre');
const terrorblade = hero('terrorblade', 109, 'carry', 'Terrorblade');
const invoker = hero('invoker', 74, 'mid', 'Invoker');
const magnus = hero('magnataur', 97, 'offlane', 'Magnus');
const enigma = hero('enigma', 33, 'offlane', 'Enigma');
const tide = hero('tidehunter', 29, 'offlane', 'Tidehunter');
const axe = hero('axe', 2, 'offlane', 'Axe');
const tusk = hero('tusk', 100, 'support', 'Tusk');
const cm = hero('crystal_maiden', 5, 'hard_support', 'Crystal Maiden');
const lich = hero('lich', 31, 'hard_support', 'Lich');

test('empty picks are safe and produce an empty identity', () => {
  const id = computeTeamIdentity([]);
  assert.equal(id.members.length, 0);
  assert.equal(id.notes.length, 0);
  assert.ok(id.summary.length > 0);
});

test('a greedy 5-farmer draft with no space-creator triggers the greed warning', () => {
  const id = computeTeamIdentity([am, medusa, spectre, terrorblade, invoker]);
  const greed = id.notes.find(n => n.kind === 'greed');
  assert.ok(greed, 'expected a greed note');
  assert.equal(greed!.severity, 'warning');
  assert.match(greed!.headline, /greedy/i);
  assert.match(greed!.detail, /nobody creates space/i);
  assert.ok(greed!.heroIds.length >= 3);
});

test('a space-creator downgrades the greed warning to an info plan (agrees with the space economy)', () => {
  // Same greedy core trio, but Tidehunter is a SPACE_PROVIDER — the identity
  // note must not contradict the capability panel's space rating.
  const id = computeTeamIdentity([am, medusa, spectre, tide, cm]);
  const greed = id.notes.find(n => n.kind === 'greed');
  assert.ok(greed, 'expected a greed note');
  assert.equal(greed!.severity, 'info');
  assert.match(greed!.headline, /supported/i);
  assert.match(greed!.detail, /Tidehunter/);
  assert.ok(greed!.heroIds.includes(tide.id), 'provider should be referenced in the note');
});

test('no initiator with 4+ picks triggers the initiation warning', () => {
  const id = computeTeamIdentity([am, medusa, spectre, invoker]);
  const init = id.notes.find(n => n.kind === 'initiation');
  assert.ok(init, 'expected an initiation note');
  assert.equal(init!.severity, 'warning');
});

test('initiators are credited when present', () => {
  const id = computeTeamIdentity([magnus, tide, am, cm]);
  const init = id.notes.find(n => n.kind === 'initiation');
  assert.ok(init);
  assert.equal(init!.severity, 'good');
  assert.match(init!.detail, /Magnus|Tidehunter/);
});

test('cooldown-heavy comps narrate fighting on big ultimates', () => {
  const id = computeTeamIdentity([magnus, enigma, medusa]);
  const rhythm = id.notes.find(n => n.kind === 'fighting_rhythm');
  assert.ok(rhythm, 'expected a fighting rhythm note');
  assert.match(rhythm!.detail, /ultimate|cooldown/i);
});

test('split-map heroes are called out in map presence', () => {
  const id = computeTeamIdentity([spectre, am, axe]);
  const map = id.notes.find(n => n.kind === 'map_presence');
  assert.ok(map, 'expected a map presence note');
  assert.match(map!.detail, /other side of the map/i);
});

test('all-backline comps with no frontline are flagged', () => {
  // All four have backline overrides and none brings a frontline presence.
  const snapfire = hero('snapfire', 128, 'hard_support', 'Snapfire');
  const id = computeTeamIdentity([invoker, snapfire, lich, medusa]);
  const line = id.notes.find(n => n.kind === 'line_balance');
  assert.ok(line, 'expected a line balance note');
  assert.equal(line!.severity, 'warning');
  assert.match(line!.headline, /no frontline/i);
});

test('roaming supports are credited under support mobility', () => {
  const id = computeTeamIdentity([am, magnus, tide, tusk, cm]);
  const mob = id.notes.find(n => n.kind === 'support_mobility');
  assert.ok(mob, 'expected a support mobility note');
  assert.equal(mob!.severity, 'good');
  assert.match(mob!.detail, /Tusk/);
});

test('warnings sort before info and good notes', () => {
  const id = computeTeamIdentity([am, medusa, spectre, terrorblade, invoker]);
  const sev = id.notes.map(n => n.severity);
  const firstInfo = sev.indexOf('info');
  const firstGood = sev.indexOf('good');
  const lastWarning = sev.lastIndexOf('warning');
  if (lastWarning >= 0 && firstInfo >= 0) assert.ok(lastWarning < firstInfo);
  if (lastWarning >= 0 && firstGood >= 0) assert.ok(lastWarning < firstGood);
});

test('members carry playstyles for every pick', () => {
  const id = computeTeamIdentity([am, magnus, cm]);
  assert.equal(id.members.length, 3);
  for (const m of id.members) assert.ok(m.playstyles.length > 0);
});
