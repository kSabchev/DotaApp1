// Content audit for shared/interactions.ts: now that entries are name-keyed,
// flag any whose reason text names a hero that is NEITHER the source nor the
// target — the strongest signal of a wrong partner or a copy-pasted reason.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const od = JSON.parse(readFileSync(resolve(root, 'backend/data/heroes.json'), 'utf8'));

// short-name -> display name, and reverse lookups
const shortToDisplay = {};
for (const h of od) shortToDisplay[h.name.replace('npc_dota_hero_', '')] = h.localized_name;

// Hand aliases / abbreviations used in the reason text (short-name -> extra patterns).
const ALIAS = {
  antimage: ['anti-mage'], nevermore: ['shadow fiend', 'SF'], magnataur: ['magnus'],
  zuus: ['zeus'], wisp: ['io'], furion: ["nature's prophet", 'natures prophet', 'NP'],
  necrolyte: ['necrophos'], obsidian_destroyer: ['outworld destroyer', 'outworld devourer', 'OD'],
  skeleton_king: ['wraith king', 'WK'], rattletrap: ['clockwerk', 'clockwork'],
  shredder: ['timbersaw', 'timber'], abyssal_underlord: ['underlord'], doom_bringer: ['doom'],
  vengefulspirit: ['vengeful spirit'], queenofpain: ['queen of pain', 'qop'],
  crystal_maiden: ['crystal maiden', 'CM'], phantom_assassin: ['phantom assassin', 'PA'],
  phantom_lancer: ['phantom lancer', 'PL'], witch_doctor: ['witch doctor', 'WD'],
  templar_assassin: ['templar assassin', 'TA'], dragon_knight: ['dragon knight', 'DK'],
  ancient_apparition: ['ancient apparition', 'AA'], bounty_hunter: ['bounty hunter'],
  spirit_breaker: ['spirit breaker'], keeper_of_the_light: ['keeper of the light', 'kotl'],
  terrorblade: ['terrorblade', 'TB'], winter_wyvern: ['winter wyvern', 'wyvern'],
  juggernaut: ['juggernaut', 'jugg'], drow_ranger: ['drow ranger', 'drow'],
  naga_siren: ['naga siren', 'naga'], sand_king: ['sand king'], troll_warlord: ['troll warlord', 'troll'],
  shadow_shaman: ['shadow shaman'], shadow_demon: ['shadow demon'], nyx_assassin: ['nyx assassin', 'nyx'],
  night_stalker: ['night stalker'], skywrath_mage: ['skywrath mage', 'skywrath'],
  centaur: ['centaur warrunner', 'centaur'], treant: ['treant protector'],
  legion_commander: ['legion commander'], death_prophet: ['death prophet'],
  elder_titan: ['elder titan'], dark_seer: ['dark seer'], faceless_void: ['faceless void'],
  templar: [], outworld_destroyer: ['outworld destroyer'],
};

// Build matchers: each hero -> array of word-boundary regexes (display name + aliases).
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['']?");
const matchers = [];
for (const short of Object.keys(shortToDisplay)) {
  const names = new Set([shortToDisplay[short], ...(ALIAS[short] ?? [])]);
  const pats = [...names].filter(Boolean).map(n => new RegExp(`\\b${esc(n)}\\b`, 'i'));
  matchers.push({ short, pats });
}

const refsIn = reason => {
  const hits = new Set();
  for (const m of matchers) if (m.pats.some(p => p.test(reason))) hits.add(m.short);
  return hits;
};

// Parse entries (one per line) and flag third-hero references.
const src = readFileSync(resolve(root, 'shared/interactions.ts'), 'utf8');
const LINE = /hero:\s*'([a-z_0-9]+)',\s*target:\s*'([a-z_0-9]+)',[^]*?reason:\s*'((?:\\.|[^'])*)'/;
let total = 0, flagged = 0;
for (const line of src.split('\n')) {
  const m = line.match(LINE);
  if (!m) continue;
  total++;
  const [, hero, target, reason] = m;
  const stray = [...refsIn(reason)].filter(s => s !== hero && s !== target);
  if (stray.length) {
    flagged++;
    console.log(`⚠ ${hero} → ${target}  [stray: ${stray.join(', ')}]`);
    console.log(`    ${reason.slice(0, 90)}`);
  }
}
console.log(`\nScanned ${total} entries, flagged ${flagged}.`);
