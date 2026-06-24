// One-shot transform: re-key shared/interactions.ts from the broken custom
// numeric hero-id scheme to OpenDota short-names. Names are resolved back to
// real OpenDota ids at module load, so the runtime shape (INTERACTIONS:
// HeroInteraction[] with heroId/targetHeroId) is unchanged — only the authored
// source becomes human-readable and self-verifying.
//
// Decoding is by the entry's ability text (the only reliable signal of intent),
// captured here as a fixed id->name map that is consistent across the whole
// file EXCEPT ids 39 (Medusa | Queen of Pain) and 44 (Weaver | Phantom
// Assassin), disambiguated per-line, plus one garbled entry (35->38 that the
// reason shows was meant as Io->Medusa).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, '../../shared/interactions.ts');

// Canonical OpenDota short-name -> id (ids are permanent in OpenDota).
const HERO_IDS = {
  antimage: 1, axe: 2, bane: 3, bloodseeker: 4, crystal_maiden: 5, drow_ranger: 6,
  earthshaker: 7, juggernaut: 8, mirana: 9, morphling: 10, nevermore: 11,
  phantom_lancer: 12, puck: 13, pudge: 14, razor: 15, sand_king: 16, storm_spirit: 17,
  sven: 18, tiny: 19, vengefulspirit: 20, windrunner: 21, zuus: 22, kunkka: 23,
  lina: 25, lion: 26, shadow_shaman: 27, slardar: 28, tidehunter: 29, witch_doctor: 30,
  lich: 31, riki: 32, enigma: 33, tinker: 34, sniper: 35, necrolyte: 36, warlock: 37,
  beastmaster: 38, queenofpain: 39, venomancer: 40, faceless_void: 41, skeleton_king: 42,
  death_prophet: 43, phantom_assassin: 44, pugna: 45, templar_assassin: 46, viper: 47,
  luna: 48, dragon_knight: 49, dazzle: 50, rattletrap: 51, leshrac: 52, furion: 53,
  life_stealer: 54, dark_seer: 55, clinkz: 56, omniknight: 57, enchantress: 58, huskar: 59,
  night_stalker: 60, broodmother: 61, bounty_hunter: 62, weaver: 63, jakiro: 64, batrider: 65,
  chen: 66, spectre: 67, ancient_apparition: 68, doom_bringer: 69, ursa: 70, spirit_breaker: 71,
  gyrocopter: 72, alchemist: 73, invoker: 74, silencer: 75, obsidian_destroyer: 76, lycan: 77,
  brewmaster: 78, shadow_demon: 79, lone_druid: 80, chaos_knight: 81, meepo: 82, treant: 83,
  ogre_magi: 84, undying: 85, rubick: 86, disruptor: 87, nyx_assassin: 88, naga_siren: 89,
  keeper_of_the_light: 90, wisp: 91, visage: 92, slark: 93, medusa: 94, troll_warlord: 95,
  centaur: 96, magnataur: 97, shredder: 98, bristleback: 99, tusk: 100, skywrath_mage: 101,
  abaddon: 102, elder_titan: 103, legion_commander: 104, techies: 105, ember_spirit: 106,
  earth_spirit: 107, abyssal_underlord: 108, terrorblade: 109, phoenix: 110, oracle: 111,
  winter_wyvern: 112, arc_warden: 113, monkey_king: 114, dark_willow: 119, pangolier: 120,
  grimstroke: 121, hoodwink: 123, void_spirit: 126, snapfire: 128, mars: 129, ringmaster: 131,
  dawnbreaker: 135, marci: 136, primal_beast: 137, muerta: 138, kez: 145, largo: 155,
};

// The hero each authored id was *intended* to mean (decoded from ability text).
// Consistent file-wide except 39 and 44 (handled below).
const DECODE = {
  1: 'antimage', 2: 'axe', 5: 'crystal_maiden', 6: 'drow_ranger', 7: 'earthshaker',
  8: 'juggernaut', 10: 'morphling', 11: 'nevermore', 12: 'phantom_lancer', 13: 'puck',
  14: 'pudge', 15: 'razor', 16: 'bloodseeker', 17: 'storm_spirit', 18: 'sven', 19: 'tiny',
  20: 'vengefulspirit', 22: 'zuus', 23: 'sand_king', 24: 'lion', 25: 'witch_doctor',
  26: 'ancient_apparition', 27: 'invoker', 28: 'lina', 29: 'faceless_void', 30: 'tidehunter',
  31: 'lich', 32: 'enigma', 33: 'naga_siren', 34: 'furion', 35: 'omniknight', 36: 'magnataur',
  37: 'warlock', 38: 'wisp', 40: 'rubick', 42: 'skeleton_king', 43: 'death_prophet',
  45: 'pugna', 46: 'templar_assassin', 47: 'viper', 49: 'dragon_knight', 50: 'dazzle',
  52: 'leshrac', 53: 'oracle', 55: 'dark_seer', 59: 'huskar', 60: 'nyx_assassin',
  65: 'batrider', 67: 'spectre', 69: 'doom_bringer', 71: 'tinker', 72: 'gyrocopter',
  75: 'silencer', 76: 'elder_titan', 79: 'shadow_demon', 87: 'disruptor',
  90: 'keeper_of_the_light', 93: 'slardar', 95: 'troll_warlord', 96: 'centaur', 102: 'abaddon',
  108: 'abyssal_underlord', 109: 'terrorblade', 113: 'winter_wyvern',
};

function decode(id, reason, otherId) {
  // garbled entry: heroId 35 / target 38 with an Io+Medusa reason
  if ((id === 35 || id === 38) && /Io sustains Medusa/.test(reason)) {
    return id === 35 ? 'wisp' : 'medusa';
  }
  if (id === 39) return /QoP|Queen of Pain/.test(reason) ? 'queenofpain' : 'medusa';
  if (id === 44) return /Weaver|Weave|Shukuchi/.test(reason) ? 'weaver' : 'phantom_assassin';
  const name = DECODE[id];
  if (!name) throw new Error(`No decode for id ${id} in line: ${reason}`);
  return name;
}

const src = readFileSync(FILE, 'utf8');

const START = 'export const INTERACTIONS: HeroInteraction[] = [';
const startIdx = src.indexOf(START);
if (startIdx < 0) throw new Error('array start not found');
const afterStart = startIdx + START.length;
const closeIdx = src.indexOf('\n];', afterStart);
if (closeIdx < 0) throw new Error('array close not found');

const entriesBlock = src.slice(afterStart, closeIdx);
const footer = src.slice(closeIdx + '\n];'.length); // begins with "\n\n// helpers..."

const ENTRY_RE = /heroId:\s*(\d+),\s*targetHeroId:\s*(\d+),/;
let transformedCount = 0;
const newEntries = entriesBlock.split('\n').map((line) => {
  const m = line.match(ENTRY_RE);
  if (!m) return line; // comments / blank lines untouched
  const hId = Number(m[1]);
  const tId = Number(m[2]);
  const hero = decode(hId, line, tId);
  const target = decode(tId, line, hId);
  transformedCount++;
  return line.replace(ENTRY_RE, `hero: '${hero}', target: '${target}',`);
}).join('\n');

const heroIdsLiteral = JSON.stringify(HERO_IDS, null, 2)
  .replace(/"([a-z_]+)":/g, '$1:'); // unquote keys for tidy TS

const header = `import type { HeroInteraction, SynergyType, CounterType } from './types';

// Canonical OpenDota short-name → permanent OpenDota hero id. The live hero pool
// (heroPool.ts) and the corpus both key heroes by this id, so the hand-authored
// interaction table below is written in readable short-names and resolved to ids
// at load. An unknown name throws immediately (caught by data.test.ts), which is
// what makes this table self-verifying — the class of silent id mismatch that
// previously corrupted every synergy/counter lookup can no longer occur.
export const HERO_IDS: Record<string, number> = ${heroIdsLiteral};

// Authoring shape: heroes referenced by short-name. Resolved to HeroInteraction
// (numeric heroId/targetHeroId) below so every downstream consumer is unchanged.
interface RawInteraction {
  hero: string;
  target: string;
  synergyScore?: number;
  counterScore?: number;
  laneMatchupScore?: number;
  lanePartnerScore?: number;
  reason: string;
  synergyType?: SynergyType;
  counterType?: CounterType;
  midMatchupNote?: string;
}

const RAW: RawInteraction[] = [`;

const resolver = `
];

function resolveId(name: string, ctx: string): number {
  const id = HERO_IDS[name];
  if (id === undefined) throw new Error(\`interactions.ts: unknown hero short-name "\${name}" (\${ctx})\`);
  return id;
}

export const INTERACTIONS: HeroInteraction[] = RAW.map(({ hero, target, ...rest }) => ({
  heroId: resolveId(hero, \`\${hero}->\${target}\`),
  targetHeroId: resolveId(target, \`\${hero}->\${target}\`),
  ...rest,
}));`;

const out = header + newEntries + resolver + footer;
writeFileSync(FILE, out, 'utf8');
console.log(`Transformed ${transformedCount} interaction entries → name-keyed.`);
