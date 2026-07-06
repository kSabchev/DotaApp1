// Hero playstyles: how a hero actually wants to play the game — constant
// skirmishing vs fighting around big cooldowns, farming the far side of the
// map, initiating, holding the frontline, or roaming. Hand-curated overrides
// (authoritative, complete arrays) cover the notable heroes; everything else
// derives sensible defaults from tags/role/attack so the full roster is
// always covered.
import type { Hero, Playstyle } from './types';
import { spaceRoleOf } from './heroTraits';

export const PLAYSTYLE_LABEL: Record<Playstyle, string> = {
  constant_fighter: 'Constant fighter',
  cooldown_fighter: 'Cooldown fighter',
  split_map_farmer: 'Split-map farmer',
  greedy_farmer: 'Greedy farmer',
  initiator: 'Initiator',
  frontline: 'Frontline',
  backline: 'Backline',
  roamer: 'Roamer',
  tempo_controller: 'Tempo controller',
  global_presence: 'Global presence',
};

export const PLAYSTYLE_DESCRIPTION: Record<Playstyle, string> = {
  constant_fighter: 'Skirmishes from the early game on short cooldowns — always looking for the next fight.',
  cooldown_fighter: 'Fights around a big ultimate window; between cooldowns the team should avoid forced engagements.',
  split_map_farmer: 'Lives on the other side of the map — farms or pushes away from the team and joins remotely or on rotation.',
  greedy_farmer: 'Needs farm and protection before contributing — the draft must buy this hero time.',
  initiator: 'Starts the fight — the team engages on this hero’s timing.',
  frontline: 'Absorbs damage at the front so the damage dealers behind can work.',
  backline: 'Delivers damage or utility from range and must be protected.',
  roamer: 'Leaves lane to make plays across the map.',
  tempo_controller: 'Dictates the mid-game pace off early item and level spikes.',
  global_presence: 'Threatens the whole map with global spells or cross-map mobility.',
};

// Complete playstyle arrays per hero (short-name keyed, validated against
// HERO_IDS by the data test). An entry here fully replaces derivation.
export const PLAYSTYLE_OVERRIDES: Record<string, Playstyle[]> = {
  // ── farm-dependent cores & split-map heroes ──
  antimage: ['split_map_farmer', 'greedy_farmer'],
  spectre: ['split_map_farmer', 'greedy_farmer', 'global_presence'],
  terrorblade: ['split_map_farmer', 'greedy_farmer'],
  phantom_lancer: ['split_map_farmer', 'greedy_farmer'],
  naga_siren: ['split_map_farmer', 'greedy_farmer', 'cooldown_fighter'],
  arc_warden: ['split_map_farmer', 'greedy_farmer', 'backline'],
  medusa: ['greedy_farmer', 'backline'],
  morphling: ['greedy_farmer', 'backline'],
  luna: ['greedy_farmer', 'backline'],
  gyrocopter: ['greedy_farmer', 'backline'],
  drow_ranger: ['backline', 'greedy_farmer'],
  sniper: ['backline', 'greedy_farmer'],
  muerta: ['backline', 'greedy_farmer', 'cooldown_fighter'],
  obsidian_destroyer: ['backline', 'greedy_farmer'],
  invoker: ['backline', 'cooldown_fighter', 'greedy_farmer'],
  silencer: ['backline', 'global_presence', 'greedy_farmer'],
  alchemist: ['greedy_farmer', 'frontline'],
  lone_druid: ['split_map_farmer', 'greedy_farmer'],
  meepo: ['split_map_farmer', 'greedy_farmer', 'constant_fighter'],
  troll_warlord: ['greedy_farmer', 'constant_fighter', 'frontline'],
  life_stealer: ['greedy_farmer', 'frontline'],
  skeleton_king: ['frontline', 'greedy_farmer'],
  chaos_knight: ['greedy_farmer', 'cooldown_fighter', 'frontline'],
  sven: ['greedy_farmer', 'cooldown_fighter', 'frontline'],
  monkey_king: ['greedy_farmer', 'cooldown_fighter'],
  slark: ['constant_fighter', 'greedy_farmer'],
  weaver: ['greedy_farmer', 'constant_fighter'],
  nevermore: ['tempo_controller', 'greedy_farmer'],
  templar_assassin: ['tempo_controller', 'greedy_farmer'],

  // ── split-map pushers / global threats ──
  furion: ['split_map_farmer', 'global_presence'],
  lycan: ['split_map_farmer', 'cooldown_fighter'],
  clinkz: ['split_map_farmer', 'constant_fighter'],
  broodmother: ['split_map_farmer', 'constant_fighter'],
  tinker: ['split_map_farmer', 'global_presence', 'backline'],
  techies: ['split_map_farmer', 'backline'],
  wisp: ['roamer', 'global_presence', 'split_map_farmer'],
  dawnbreaker: ['frontline', 'constant_fighter', 'global_presence', 'split_map_farmer'],
  abyssal_underlord: ['frontline', 'global_presence', 'cooldown_fighter'],
  zuus: ['backline', 'global_presence', 'constant_fighter'],
  ancient_apparition: ['backline', 'global_presence', 'cooldown_fighter'],
  chen: ['roamer', 'global_presence'],

  // ── initiators & big-ult cooldown fighters ──
  enigma: ['initiator', 'cooldown_fighter', 'split_map_farmer'],
  magnataur: ['initiator', 'cooldown_fighter'],
  tidehunter: ['initiator', 'frontline', 'cooldown_fighter'],
  earthshaker: ['initiator', 'cooldown_fighter'],
  faceless_void: ['cooldown_fighter', 'greedy_farmer'],
  sand_king: ['initiator', 'cooldown_fighter'],
  mars: ['initiator', 'frontline', 'cooldown_fighter'],
  brewmaster: ['initiator', 'frontline', 'cooldown_fighter'],
  elder_titan: ['initiator', 'cooldown_fighter'],
  phoenix: ['cooldown_fighter', 'initiator'],
  dark_seer: ['initiator', 'cooldown_fighter', 'frontline'],
  batrider: ['initiator', 'tempo_controller', 'cooldown_fighter'],
  pangolier: ['initiator', 'tempo_controller', 'cooldown_fighter'],
  puck: ['tempo_controller', 'initiator', 'cooldown_fighter'],
  rattletrap: ['initiator', 'roamer', 'cooldown_fighter'],
  dragon_knight: ['frontline', 'cooldown_fighter'],
  omniknight: ['frontline', 'cooldown_fighter'],
  kunkka: ['frontline', 'cooldown_fighter'],
  doom_bringer: ['frontline', 'cooldown_fighter', 'split_map_farmer'],
  treant: ['cooldown_fighter', 'global_presence'],
  visage: ['cooldown_fighter', 'backline'],
  death_prophet: ['tempo_controller', 'cooldown_fighter'],
  windrunner: ['backline', 'cooldown_fighter'],

  // ── constant fighters, brawlers, frontliners ──
  axe: ['initiator', 'frontline', 'constant_fighter'],
  centaur: ['initiator', 'frontline', 'constant_fighter'],
  bristleback: ['frontline', 'constant_fighter'],
  slardar: ['initiator', 'frontline', 'constant_fighter'],
  night_stalker: ['constant_fighter', 'frontline', 'initiator'],
  legion_commander: ['initiator', 'constant_fighter', 'frontline'],
  primal_beast: ['initiator', 'frontline', 'constant_fighter'],
  huskar: ['constant_fighter', 'frontline'],
  ursa: ['constant_fighter', 'frontline'],
  razor: ['frontline', 'constant_fighter'],
  viper: ['constant_fighter', 'frontline'],
  necrolyte: ['frontline', 'constant_fighter'],
  shredder: ['frontline', 'constant_fighter'],
  bloodseeker: ['constant_fighter'],
  marci: ['constant_fighter', 'frontline', 'roamer'],
  ogre_magi: ['frontline', 'constant_fighter'],
  undying: ['frontline', 'constant_fighter'],
  abaddon: ['frontline'],
  kez: ['tempo_controller', 'constant_fighter'],

  // ── roamers & playmaking supports ──
  pudge: ['roamer', 'constant_fighter', 'frontline'],
  spirit_breaker: ['roamer', 'initiator', 'constant_fighter', 'global_presence'],
  tusk: ['roamer', 'initiator', 'constant_fighter'],
  bounty_hunter: ['roamer', 'constant_fighter'],
  riki: ['roamer', 'constant_fighter'],
  nyx_assassin: ['roamer', 'initiator', 'cooldown_fighter'],
  earth_spirit: ['roamer', 'initiator', 'constant_fighter'],
  mirana: ['roamer', 'cooldown_fighter', 'global_presence'],
  vengefulspirit: ['roamer', 'initiator'],
  skywrath_mage: ['backline', 'roamer'],
  hoodwink: ['backline', 'roamer'],
  enchantress: ['roamer', 'backline'],

  // ── tempo mids ──
  storm_spirit: ['tempo_controller', 'constant_fighter'],
  queenofpain: ['tempo_controller', 'constant_fighter'],
  ember_spirit: ['tempo_controller', 'constant_fighter'],
  void_spirit: ['tempo_controller', 'initiator'],
  leshrac: ['tempo_controller', 'constant_fighter'],

  // ── backline casters ──
  lina: ['backline', 'constant_fighter'],
  lion: ['backline', 'cooldown_fighter'],
  shadow_shaman: ['backline', 'cooldown_fighter'],
  witch_doctor: ['backline', 'cooldown_fighter'],
  warlock: ['backline', 'cooldown_fighter'],
  disruptor: ['backline', 'cooldown_fighter'],
  jakiro: ['backline', 'cooldown_fighter'],
  lich: ['backline', 'cooldown_fighter'],
  winter_wyvern: ['backline', 'cooldown_fighter'],
  oracle: ['backline', 'cooldown_fighter'],
  bane: ['backline', 'cooldown_fighter'],
  shadow_demon: ['backline', 'cooldown_fighter'],
  grimstroke: ['backline', 'cooldown_fighter'],
  dark_willow: ['backline', 'cooldown_fighter'],
  snapfire: ['backline', 'cooldown_fighter'],
  rubick: ['backline', 'cooldown_fighter'],
  pugna: ['backline', 'constant_fighter'],
  ringmaster: ['backline', 'cooldown_fighter'],
};

// Defaults for heroes without an override — every rule reads fields that exist
// on all Hero objects (curated or heroBuilder-generated), so this never gaps.
export function derivePlaystyles(hero: Hero): Playstyle[] {
  const tags = new Set(hero.utilityTags);
  const pos = hero.metaRole;
  const out = new Set<Playstyle>();

  if (tags.has('initiation')) out.add('initiator');
  if (tags.has('rotate') && (pos === 'pos4' || pos === 'pos5')) out.add('roamer');
  if (tags.has('global')) out.add('global_presence');
  if (spaceRoleOf(hero) === 'user') out.add('greedy_farmer');
  if (
    hero.attack === 'melee' &&
    (hero.attribute === 'strength' || hero.attribute === 'universal') &&
    (pos === 'pos3' || tags.has('initiation'))
  ) {
    out.add('frontline');
  }
  if (
    hero.attack === 'ranged' &&
    (tags.has('scaling') || tags.has('aura_carrier') || tags.has('burst'))
  ) {
    out.add('backline');
  }
  if (pos === 'pos2' && (tags.has('mobility') || tags.has('rotate') || tags.has('lane_pressure'))) {
    out.add('tempo_controller');
  }
  // Big-ult initiators default to fighting on cooldown windows.
  if (out.has('initiator')) out.add('cooldown_fighter');
  if (out.size === 0) out.add(hero.attack === 'melee' ? 'frontline' : 'backline');
  return [...out];
}

export function getHeroPlaystyles(hero: Hero): Playstyle[] {
  const override = PLAYSTYLE_OVERRIDES[hero.name];
  return override && override.length ? override : derivePlaystyles(hero);
}
