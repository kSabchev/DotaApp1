// Consistency checks for the hand-authored data tables. These catch typos /
// orphaned references that TypeScript can't (e.g. an item providing a mechanic
// no item can satisfy, or a hero reliance with no answering item).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, ITEM_BY_ID, itemsProviding, itemIconUrl } from '../../shared/items';
import { MECHANIC_LABEL, MECHANIC_COUNTERS, RELIANCE_ANSWERS } from '../../shared/mechanics';
import { HERO_MECHANICS } from '../../shared/heroMechanics';

const MECHANICS = new Set(Object.keys(MECHANIC_LABEL));
const RELIANCES = new Set(Object.keys(RELIANCE_ANSWERS));
const ROLES = new Set(['carry', 'mid', 'offlane', 'support', 'hard_support']);
const TIMINGS = new Set(['early', 'mid', 'late']);

test('every item is well-formed (mechanics, roles, timing, unique id)', () => {
  const seen = new Set<string>();
  for (const it of ITEMS) {
    assert.ok(!seen.has(it.id), `duplicate item id ${it.id}`);
    seen.add(it.id);
    assert.ok(it.mechanics.length > 0, `${it.name} has no mechanics`);
    for (const m of it.mechanics) assert.ok(MECHANICS.has(m), `${it.name}: unknown mechanic ${m}`);
    for (const r of it.builtBy) assert.ok(ROLES.has(r), `${it.name}: unknown role ${r}`);
    assert.ok(TIMINGS.has(it.timing), `${it.name}: bad timing ${it.timing}`);
  }
});

test('every mechanic vocab entry has a label and a "counters" phrase', () => {
  for (const m of MECHANICS) {
    assert.ok(MECHANIC_LABEL[m as keyof typeof MECHANIC_LABEL], `no label for ${m}`);
    assert.ok(MECHANIC_COUNTERS[m as keyof typeof MECHANIC_COUNTERS], `no counters phrase for ${m}`);
  }
});

test('every answering mechanic is provided by at least one item', () => {
  // Otherwise the matcher could identify a need it can never satisfy.
  for (const mechs of Object.values(RELIANCE_ANSWERS)) {
    for (const m of mechs) {
      assert.ok(itemsProviding(m).length > 0, `no item provides ${m}`);
    }
  }
});

test('every hero mechanic profile references valid reliances / mechanics', () => {
  for (const [name, prof] of Object.entries(HERO_MECHANICS)) {
    for (const r of prof.reliance ?? []) assert.ok(RELIANCES.has(r), `${name}: unknown reliance ${r}`);
    for (const m of prof.vulnerable ?? []) assert.ok(MECHANICS.has(m), `${name}: unknown vulnerable ${m}`);
    assert.ok((prof.reliance?.length ?? 0) + (prof.vulnerable?.length ?? 0) > 0, `${name}: empty profile`);
  }
});

test('roster coverage is substantial (>100 heroes tagged)', () => {
  assert.ok(Object.keys(HERO_MECHANICS).length > 100, 'expected full-ish roster coverage');
});

test('item id map and icon url helper work', () => {
  assert.equal(ITEM_BY_ID.get('black_king_bar')?.name, 'Black King Bar');
  assert.match(itemIconUrl('pipe'), /items\/pipe\.png$/);
});
