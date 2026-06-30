import type { HeroInteraction, SynergyType, CounterType } from './types';

// Canonical OpenDota short-name → permanent OpenDota hero id. The live hero pool
// (heroPool.ts) and the match corpus both key heroes by this id, so the table below
// is authored in readable short-names and resolved to ids at load. An unknown name
// throws immediately (covered by the data test) — that is what makes this table
// self-verifying: the silent id-mismatch that once corrupted every synergy/counter
// lookup can no longer occur.
export const HERO_IDS: Record<string, number> = {
  antimage: 1,
  axe: 2,
  bane: 3,
  bloodseeker: 4,
  crystal_maiden: 5,
  drow_ranger: 6,
  earthshaker: 7,
  juggernaut: 8,
  mirana: 9,
  morphling: 10,
  nevermore: 11,
  phantom_lancer: 12,
  puck: 13,
  pudge: 14,
  razor: 15,
  sand_king: 16,
  storm_spirit: 17,
  sven: 18,
  tiny: 19,
  vengefulspirit: 20,
  windrunner: 21,
  zuus: 22,
  kunkka: 23,
  lina: 25,
  lion: 26,
  shadow_shaman: 27,
  slardar: 28,
  tidehunter: 29,
  witch_doctor: 30,
  lich: 31,
  riki: 32,
  enigma: 33,
  tinker: 34,
  sniper: 35,
  necrolyte: 36,
  warlock: 37,
  beastmaster: 38,
  queenofpain: 39,
  venomancer: 40,
  faceless_void: 41,
  skeleton_king: 42,
  death_prophet: 43,
  phantom_assassin: 44,
  pugna: 45,
  templar_assassin: 46,
  viper: 47,
  luna: 48,
  dragon_knight: 49,
  dazzle: 50,
  rattletrap: 51,
  leshrac: 52,
  furion: 53,
  life_stealer: 54,
  dark_seer: 55,
  clinkz: 56,
  omniknight: 57,
  enchantress: 58,
  huskar: 59,
  night_stalker: 60,
  broodmother: 61,
  bounty_hunter: 62,
  weaver: 63,
  jakiro: 64,
  batrider: 65,
  chen: 66,
  spectre: 67,
  ancient_apparition: 68,
  doom_bringer: 69,
  ursa: 70,
  spirit_breaker: 71,
  gyrocopter: 72,
  alchemist: 73,
  invoker: 74,
  silencer: 75,
  obsidian_destroyer: 76,
  lycan: 77,
  brewmaster: 78,
  shadow_demon: 79,
  lone_druid: 80,
  chaos_knight: 81,
  meepo: 82,
  treant: 83,
  ogre_magi: 84,
  undying: 85,
  rubick: 86,
  disruptor: 87,
  nyx_assassin: 88,
  naga_siren: 89,
  keeper_of_the_light: 90,
  wisp: 91,
  visage: 92,
  slark: 93,
  medusa: 94,
  troll_warlord: 95,
  centaur: 96,
  magnataur: 97,
  shredder: 98,
  bristleback: 99,
  tusk: 100,
  skywrath_mage: 101,
  abaddon: 102,
  elder_titan: 103,
  legion_commander: 104,
  techies: 105,
  ember_spirit: 106,
  earth_spirit: 107,
  abyssal_underlord: 108,
  terrorblade: 109,
  phoenix: 110,
  oracle: 111,
  winter_wyvern: 112,
  arc_warden: 113,
  monkey_king: 114,
  dark_willow: 119,
  pangolier: 120,
  grimstroke: 121,
  hoodwink: 123,
  void_spirit: 126,
  snapfire: 128,
  mars: 129,
  ringmaster: 131,
  dawnbreaker: 135,
  marci: 136,
  primal_beast: 137,
  muerta: 138,
  kez: 145,
  largo: 155
};

// Authoring shape — heroes referenced by short-name. Resolved to HeroInteraction
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
  laneNote?: string;
  midMatchupNote?: string;
}

const RAW: RawInteraction[] = [
  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — wombo combo / teamfight lockdowns
  // ──────────────────────────────────────────────────────────────────

  // Faceless Void — Chronosphere combos
  { hero: 'faceless_void', target: 'earthshaker',  synergyScore: 10, synergyType: 'wombo_combo',   reason: 'Chronosphere lets Earthshaker land Echo Slam freely inside' },
  { hero: 'faceless_void', target: 'magnataur', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Magnus RP groups enemies perfectly for Chrono follow-up' },
  { hero: 'faceless_void', target: 'crystal_maiden',  synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Crystal Maiden can freely channel Freezing Field inside Chrono' },
  { hero: 'faceless_void', target: 'witch_doctor', synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Witch Doctor channels Death Ward safely inside Chronosphere' },
  { hero: 'faceless_void', target: 'enigma', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Enigma Black Hole + Chrono creates double AoE lockdown' },
  { hero: 'faceless_void', target: 'zuus', synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Zeus Thundergod\'s Wrath hits all heroes inside Chronosphere' },

  // Anti-Mage
  { hero: 'antimage', target: 'crystal_maiden',  synergyScore: 6,  synergyType: 'buff_aura',     reason: 'Crystal Maiden aura provides mana for AM laning' },
  { hero: 'antimage', target: 'omniknight', synergyScore: 8,  synergyType: 'save_enable',   reason: 'Omniknight Guardian Angel protects AM during farm phase' },
  { hero: 'antimage', target: 'wisp', synergyScore: 9,  synergyType: 'save_enable',   reason: 'Io relocates AM to safety and provides strong healing' },

  // Magnus — RP combos
  { hero: 'magnataur', target: 'nevermore', synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Shadow Fiend Requiem destroys RP-grouped enemies' },
  { hero: 'magnataur', target: 'zuus', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Zeus global hits all grouped enemies after RP' },
  { hero: 'magnataur', target: 'drow_ranger',  synergyScore: 8,  synergyType: 'buff_aura',     reason: 'Drow Marksmanship bonus applies to Magnus Empower-buffed team' },
  { hero: 'magnataur', target: 'sven', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Sven Empower + God\'s Strength cleave shreds RP-grouped enemies' },
  { hero: 'magnataur', target: 'axe',  synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Axe Culling Blade after RP secures kills and resets CD' },

  // Tidehunter
  { hero: 'tidehunter', target: 'nevermore', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Ravage groups for Shadow Fiend Requiem of the Shadows' },
  { hero: 'tidehunter', target: 'zuus', synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Zeus hits all Ravage-slowed enemies globally' },
  { hero: 'tidehunter', target: 'sven', synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Sven cleave demolishes grouped enemies post-Ravage' },
  { hero: 'tidehunter', target: 'magnataur', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'RP into Ravage or Ravage into RP creates double AoE lockdown' },

  // Enigma — Black Hole combos
  { hero: 'enigma', target: 'zuus', synergyScore: 10, synergyType: 'wombo_combo',   reason: 'Thundergod\'s Wrath deals global damage to all Black Hole targets' },
  { hero: 'enigma', target: 'magnataur', synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'RP into Black Hole is an unstoppable teamfight combo' },
  { hero: 'enigma', target: 'nevermore', synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Shadow Fiend Requiem burst kills entire team in Black Hole' },

  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — armor reduction + physical damage
  // ──────────────────────────────────────────────────────────────────

  // Elder Titan (armor reduction) — physical stacks
  { hero: 'elder_titan', target: 'sven', synergyScore: 9,  synergyType: 'armor_reduction', reason: 'Elder Titan Natural Order removes armor, Sven God\'s Strength cleave shreds' },
  { hero: 'elder_titan', target: 'axe',  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Natural Order armor reduction makes Axe Culling Blade threshold trivial' },
  { hero: 'elder_titan', target: 'juggernaut',  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Natural Order + Juggernaut Omnislash destroys any hero' },

  // Slardar (armor reduction)
  { hero: 'slardar', target: 'sven', synergyScore: 9,  synergyType: 'armor_reduction', reason: 'Corrosive Haze armor reduction amplifies Sven cleave enormously' },
  { hero: 'slardar', target: 'juggernaut',  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Corrosive Haze armor reduction makes Omnislash kills trivial' },
  { hero: 'slardar', target: 'antimage',  synergyScore: 7,  synergyType: 'armor_reduction', reason: 'Corrosive Haze armor debuff amplifies Anti-Mage right-click' },
  { hero: 'slardar', target: 'phantom_assassin', synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Weave + Corrosive Haze stack for extreme physical damage' },

  // Dazzle (Weave armor reduction)
  { hero: 'dazzle', target: 'sven', synergyScore: 9,  synergyType: 'armor_reduction', reason: 'Weave armor reduction + Sven God\'s Strength cleave is game-winning' },
  { hero: 'dazzle', target: 'juggernaut',  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Weave reduces armor while Shallow Grave keeps Juggernaut alive' },
  { hero: 'dazzle', target: 'antimage',  synergyScore: 8,  synergyType: 'save_enable',    reason: 'Shallow Grave prevents AM from dying during farm phase' },

  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — save / enable cores
  // ──────────────────────────────────────────────────────────────────

  { hero: 'omniknight', target: 'sven', synergyScore: 8,  synergyType: 'save_enable',   reason: 'Guardian Angel makes Sven immune to physical during God\'s Strength' },
  { hero: 'omniknight', target: 'medusa', synergyScore: 9,  synergyType: 'save_enable',   reason: 'Guardian Angel makes Medusa nearly unkillable in fights' },
  { hero: 'medusa', target: 'wisp', synergyScore: 8,  synergyType: 'save_enable',   reason: 'Io sustains Medusa through long fights with Overcharge' },
  { hero: 'lich', target: 'medusa', synergyScore: 7,  synergyType: 'save_enable',   reason: 'Lich Frost Shield and Sacrifice helps Medusa in lane' },
  { hero: 'oracle', target: 'medusa', synergyScore: 8,  synergyType: 'save_enable',   reason: 'Oracle False Promise keeps Medusa alive through burst combos' },
  { hero: 'oracle', target: 'juggernaut',  synergyScore: 9,  synergyType: 'save_enable',   reason: 'Oracle False Promise + Juggernaut Blade Fury is near-unkillable combo' },
  { hero: 'oracle', target: 'antimage',  synergyScore: 8,  synergyType: 'save_enable',   reason: 'Oracle False Promise enables AM to fight through burst' },
  { hero: 'wisp', target: 'antimage',  synergyScore: 9,  synergyType: 'save_enable',   reason: 'Io Relocate saves AM and provides strong Overcharge sustain' },
  { hero: 'wisp', target: 'sven', synergyScore: 8,  synergyType: 'save_enable',   reason: 'Io Tether speed and Overcharge enable Sven to chase and survive' },

  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — lane dominance
  // ──────────────────────────────────────────────────────────────────

  { hero: 'axe', target: 'crystal_maiden',  synergyScore: 7,  synergyType: 'lane_dominant',  reason: 'Crystal Maiden frostbite roots enemies in Axe spin for lane kills', lanePartnerScore: 8 },
  { hero: 'earthshaker', target: 'juggernaut',  synergyScore: 7,  synergyType: 'lane_dominant',  reason: 'Earthshaker Fissure + Juggernaut Blade Fury for kill potential', lanePartnerScore: 7 },
  { hero: 'vengefulspirit', target: 'drow_ranger',  synergyScore: 8,  synergyType: 'buff_aura',     reason: 'Vengeful Spirit aura stacks with Drow aura for ranged allies' },
  { hero: 'drow_ranger', target: 'furion', synergyScore: 7,  synergyType: 'buff_aura',     reason: 'Nature\'s Prophet treants are ranged and benefit from Drow aura' },
  { hero: 'drow_ranger', target: 'razor', synergyScore: 6,  synergyType: 'buff_aura',     reason: 'Razor is ranged and benefits from Drow Marksmanship aura' },

  // Invoker combos
  { hero: 'invoker', target: 'enigma', synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Sunstrike into Black Hole guarantees kill on any hero' },

  // Rubick steals
  { hero: 'rubick', target: 'tidehunter', synergyScore: 9,  synergyType: 'global',        reason: 'Rubick stealing Ravage is a game-winning play' },
  { hero: 'rubick', target: 'enigma', synergyScore: 10, synergyType: 'global',        reason: 'Stolen Black Hole is a game-winning steal' },
  { hero: 'rubick', target: 'faceless_void', synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Stolen Chronosphere wins any teamfight' },

  // Naga Siren — illusion
  { hero: 'naga_siren', target: 'magnataur', synergyScore: 8,  synergyType: 'illusion_synergy', reason: 'Magnus Empower applies to all Naga illusions' },
  { hero: 'naga_siren', target: 'faceless_void', synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Song of the Siren can set up Chronosphere perfectly' },

  // Global combos
  { hero: 'zuus', target: 'tidehunter', synergyScore: 8,  synergyType: 'global',        reason: 'Zeus Wrath hits all Ravage-slowed enemies globally' },
  { hero: 'zuus', target: 'enigma', synergyScore: 10, synergyType: 'global',        reason: 'Thundergod\'s Wrath + Black Hole guarantees maximum damage' },

  // ──────────────────────────────────────────────────────────────────
  // COUNTER RELATIONSHIPS
  // ──────────────────────────────────────────────────────────────────

  // Ancient Apparition vs healing lineups
  { hero: 'ancient_apparition', target: 'juggernaut',  counterScore: 9, counterType: 'sustain_counter', reason: 'Ice Blast prevents Juggernaut Healing Ward and omnislash healing' },
  { hero: 'ancient_apparition', target: 'omniknight', counterScore: 9, counterType: 'sustain_counter', reason: 'Ice Blast completely negates Omniknight healing abilities' },
  { hero: 'ancient_apparition', target: 'wisp', counterScore: 8, counterType: 'sustain_counter', reason: 'Ice Blast shuts down Io\'s heal-based kit' },
  { hero: 'ancient_apparition', target: 'medusa', counterScore: 7, counterType: 'sustain_counter', reason: 'Ice Blast slows Medusa Mana Shield regen between fights' },
  { hero: 'ancient_apparition', target: 'oracle', counterScore: 9, counterType: 'sustain_counter', reason: 'Ice Blast negates Oracle False Promise — entire enemy save kit deleted' },
  { hero: 'ancient_apparition', target: 'dazzle', counterScore: 8, counterType: 'sustain_counter', reason: 'Ice Blast prevents Dazzle from healing or saving with Shadow Wave' },

  // Razor vs right-click carries
  { hero: 'razor', target: 'antimage',  counterScore: 8, counterType: 'kite',           reason: 'Static Link drains Anti-Mage damage, negating his right-click DPS' },
  { hero: 'razor', target: 'sven', counterScore: 9, counterType: 'kite',           reason: 'Static Link destroys Sven God\'s Strength damage in a fight' },
  { hero: 'razor', target: 'faceless_void', counterScore: 8, counterType: 'kite',           reason: 'Static Link cripples Faceless Void DPS inside Chronosphere' },

  // Anti-Mage vs intelligence heroes
  { hero: 'antimage', target: 'zuus', counterScore: 9, counterType: 'mana_burn',      reason: 'Mana Void bursts Zeus\'s large mana pool instantly', midMatchupNote: 'AM wins vs Zeus hard — mana void one-shots Zeus mana pool' },
  { hero: 'antimage', target: 'invoker', counterScore: 8, counterType: 'mana_burn',      reason: 'Mana Void counters Invoker\'s mana-dependent spells' },
  { hero: 'antimage', target: 'storm_spirit', counterScore: 9, counterType: 'mana_burn',      reason: 'Mana Void punishes Storm Spirit mana burns during Ball Lightning' },
  { hero: 'antimage', target: 'crystal_maiden',  counterScore: 8, counterType: 'mana_burn',      reason: 'Mana Void destroys Crystal Maiden\'s low mana pool' },

  // Lion lockdown
  { hero: 'lion', target: 'faceless_void', counterScore: 7, counterType: 'channel_disrupt', reason: 'Hex and Earth Spike lock down Faceless Void before Chrono' },
  { hero: 'lion', target: 'morphling', counterScore: 8, counterType: 'channel_disrupt', reason: 'Hex counters Morphling during attribute shift transitions' },

  // Puck counters
  { hero: 'puck', target: 'lina', counterScore: 8, counterType: 'silence',        reason: 'Silence prevents Lina from casting burst combo', midMatchupNote: 'Puck wins mid vs Lina — Phase Shift dodges Lina stun, Silence stops combo' },
  { hero: 'puck', target: 'crystal_maiden',  counterScore: 7, counterType: 'silence',        reason: 'Phase Shift dodges CM spells; Silence nullifies her', laneMatchupScore: 4 },
  { hero: 'puck', target: 'zuus', counterScore: 7, counterType: 'silence',        reason: 'Puck Silence shuts down Zeus spells, Phase Shift dodges Wrath', midMatchupNote: 'Puck hard counters Zeus mid — Phase Shift avoids all Zeus spells' },

  // Doom vs key heroes
  { hero: 'doom_bringer', target: 'faceless_void', counterScore: 9, counterType: 'silence',        reason: 'Doom prevents Faceless Void from using Chronosphere' },
  { hero: 'doom_bringer', target: 'enigma', counterScore: 9, counterType: 'silence',        reason: 'Doom prevents Enigma from channeling Black Hole' },
  { hero: 'doom_bringer', target: 'ancient_apparition', counterScore: 8, counterType: 'silence',        reason: 'Doom prevents Ancient Apparition from casting Ice Blast' },
  { hero: 'doom_bringer', target: 'oracle', counterScore: 9, counterType: 'silence',        reason: 'Doom on Oracle removes all saving abilities from enemy team' },

  // Silencer — Global Silence
  { hero: 'silencer', target: 'enigma', counterScore: 9, counterType: 'channel_disrupt', reason: 'Global Silence prevents Enigma from channeling Black Hole' },
  { hero: 'silencer', target: 'faceless_void', counterScore: 8, counterType: 'channel_disrupt', reason: 'Global Silence prevents Faceless Void from using Chronosphere' },
  { hero: 'silencer', target: 'zuus', counterScore: 8, counterType: 'silence',        reason: 'Curse of the Silent and Global Silence cripples Zeus entirely' },

  // Huskar vs magic-heavy lineups
  { hero: 'huskar', target: 'crystal_maiden',  counterScore: 8, counterType: 'burst',          reason: 'Huskar Life Break + Burning Spears shreds Crystal Maiden instantly', midMatchupNote: 'Huskar dominates magic-heavy mids with Burning Spear right-click' },
  { hero: 'huskar', target: 'zuus', counterScore: 7, counterType: 'burst',          reason: 'Huskar is naturally strong vs magic-damage heroes like Zeus' },

  // Viper vs melee/close-range mids
  { hero: 'viper', target: 'huskar', counterScore: 9, counterType: 'kite',           reason: 'Corrosive Skin reduces Huskar\'s attack speed, Viper Strike destroys him', midMatchupNote: 'Viper is one of the hardest counters to Huskar mid' },
  { hero: 'viper', target: 'juggernaut',  counterScore: 7, counterType: 'kite',           reason: 'Viper Strike kites Juggernaut out of Blade Fury range' },

  // Bloodseeker — vision and chase
  { hero: 'bloodseeker', target: 'antimage',  counterScore: 7, counterType: 'mobility',       reason: 'Rupture punishes Anti-Mage Blink — moving deals massive damage', laneMatchupScore: 3 },
  { hero: 'bloodseeker', target: 'puck', counterScore: 7, counterType: 'mobility',       reason: 'Rupture punishes Puck Phase Shift and movement combos' },

  // Axe vs low-armor heroes
  { hero: 'axe', target: 'viper', counterScore: 8, counterType: 'burst',          reason: 'Culling Blade instantly finishes Viper Strike-slowed heroes', laneMatchupScore: 3 },

  // ──────────────────────────────────────────────────────────────────
  // LANE MATCHUP DATA (laneMatchupScore: positive = heroId wins lane)
  // ──────────────────────────────────────────────────────────────────

  // Storm Spirit vs mids
  { hero: 'storm_spirit', target: 'puck', laneMatchupScore: -3, counterScore: 0, reason: 'Puck outranges Storm Spirit, Silence stops Ball Lightning', midMatchupNote: 'Terrible matchup for Storm — Puck Silence and Phase Shift counter everything' },
  { hero: 'storm_spirit', target: 'nevermore', laneMatchupScore: 2,  counterScore: 0, reason: 'Storm Spirit can quickly escape Shadow Fiend Requiem with Ball Lightning', midMatchupNote: 'Storm Spirit can outfarm SF and dodge Requiem with Ball Lightning' },
  { hero: 'storm_spirit', target: 'zuus', laneMatchupScore: 2,  counterScore: 0, reason: 'Storm Spirit can dodge Zeus spells with Ball Lightning' },

  // Shadow Fiend vs mids
  { hero: 'nevermore', target: 'storm_spirit', laneMatchupScore: -2, counterScore: 0, reason: 'Storm Spirit outmobiles Shadow Fiend and can escape Requiem' },
  { hero: 'nevermore', target: 'puck', laneMatchupScore: -3, counterScore: 0, reason: 'Puck Silence shuts down SF Requiem channel and harasses strongly', midMatchupNote: 'SF has a rough time vs Puck — Silence stops Requiem, Phase Shift avoids it' },
  { hero: 'nevermore', target: 'huskar', laneMatchupScore: 3,  counterScore: 4, reason: 'Shadow Fiend Presence aura and Requiem counters Huskar\'s low HP playstyle' },

  // Queen of Pain vs mids — note: actually id for QoP varies, using common id
  { hero: 'queenofpain', target: 'zuus', laneMatchupScore: 3,  counterScore: 0, reason: 'QoP outraharesses Zeus with Blink and Scream of Pain spam' },

  // Lane partners (lanePartnerScore)
  { hero: 'crystal_maiden', target: 'juggernaut',  lanePartnerScore: 9, synergyScore: 7, reason: 'CM Frostbite sets up Juggernaut Blade Fury in lane for kills', synergyType: 'lane_dominant' },
  { hero: 'crystal_maiden', target: 'antimage',  lanePartnerScore: 8, reason: 'CM mana aura solves Anti-Mage mana issues; Frostbite protects in lane' },
  { hero: 'wisp', target: 'antimage',  lanePartnerScore: 10, reason: 'Io+AM is the strongest safe-lane duo — Tether speed + Overcharge sustain' },
  { hero: 'vengefulspirit', target: 'sven', lanePartnerScore: 9, reason: 'Vengeful Spirit WaveSaver + aura enables Sven god\'s Strength lane dominance' },
  { hero: 'dazzle', target: 'sven', lanePartnerScore: 9, reason: 'Dazzle Weave + Shallow Grave lets Sven fight at any HP threshold' },
  { hero: 'dazzle', target: 'juggernaut',  lanePartnerScore: 8, reason: 'Dazzle Shallow Grave saves Juggernaut through Omnislash' },
  { hero: 'oracle', target: 'juggernaut',  lanePartnerScore: 9, reason: 'Oracle False Promise + Blade Fury is a near-unkillable combo in lane' },
  { hero: 'earthshaker', target: 'axe',  lanePartnerScore: 7, reason: 'Earthshaker Fissure isolates enemies for Axe Berserker\'s Call' },
  { hero: 'lion', target: 'faceless_void', lanePartnerScore: 7, reason: 'Lion hex+spike sets up Void before Chrono in fights' },

  // Invoker — mid counters
  { hero: 'invoker', target: 'tidehunter', counterScore: 7, counterType: 'channel_disrupt', reason: 'Cold Snap prevents Ravage from executing; Sunstrike punishes Tide', midMatchupNote: 'Invoker Cold Snap can cancel Ravage channel and Sunstrike is global kill threat' },

  // ──────────────────────────────────────────────────────────────────
  // WOMBO COMBOS — more initiator + AoE combinations
  // ──────────────────────────────────────────────────────────────────

  // Batrider — Lasso combos
  { hero: 'batrider', target: 'axe',  synergyScore: 9, synergyType: 'wombo_combo', reason: 'Batrider Lasso into Axe Berserker\'s Call creates unavoidable kill combo' },
  { hero: 'batrider', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Batrider drags hero into Magnus RP for guaranteed lockdown' },
  { hero: 'batrider', target: 'doom_bringer', synergyScore: 9, synergyType: 'wombo_combo', reason: 'Batrider Lasso + Doom creates permanent disable on priority target' },
  { hero: 'batrider', target: 'tidehunter', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Batrider pulls into Ravage for AoE lockdown' },

  // Disruptor combos
  { hero: 'disruptor', target: 'faceless_void', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Glimpse returns Chrono-caught heroes, Static Storm cancels BKB in Chrono' },
  { hero: 'disruptor', target: 'tidehunter', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Static Storm inside Ravage prevents BKB from being cast' },
  { hero: 'disruptor', target: 'enigma', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Kinetic Field traps heroes for Black Hole setup' },

  // Axe combos
  { hero: 'axe', target: 'magnataur', synergyScore: 7, synergyType: 'wombo_combo', reason: 'RP groups enemies in Axe Berserker\'s Call spin range' },
  { hero: 'axe', target: 'tidehunter', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage into Axe is a reliable lockdown and kill combo' },

  // Warlock — Golem combos
  { hero: 'warlock', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Fatal Bonds + RP + Chaotic Offering is devastating AoE combo' },
  { hero: 'warlock', target: 'faceless_void', synergyScore: 9, synergyType: 'wombo_combo', reason: 'Chaotic Offering stuns inside Chronosphere for maximum damage window' },
  { hero: 'warlock', target: 'tidehunter', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Fatal Bonds links damage through Ravage, Golem stun on top' },
  { hero: 'warlock', target: 'sven', synergyScore: 7, synergyType: 'buff_aura', reason: 'Fatal Bonds spreads damage to multiple enemies while Sven cleaves' },

  // Sand King (16 is Bloodseeker, SK is 16... actually SK=23)
  // Note: Sand King = hero ID 16 in older data, but let's use Epicenter combos via ID refs
  { hero: 'sand_king', target: 'enigma', synergyScore: 9, synergyType: 'wombo_combo', reason: 'Sand King Epicenter pulses freely inside Enigma Black Hole' },
  { hero: 'sand_king', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Magnus RP groups heroes for Sand King Epicenter pulses' },
  { hero: 'sand_king', target: 'warlock', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Warlock Fatal Bonds + Sand King Epicenter applies damage twice to all linked targets' },

  // Leshrac combos
  { hero: 'leshrac', target: 'tidehunter', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage groups enemies for Leshrac Pulse Nova and Lightning Storm' },
  { hero: 'leshrac', target: 'enigma', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Leshrac Pulse Nova deals continuous AoE damage in Black Hole' },

  // Underlord — push combos
  { hero: 'abyssal_underlord', target: 'enigma', synergyScore: 7, synergyType: 'push_siege', reason: 'Underlord Firestorm + Enigma pushes dominate midgame objectives' },
  { hero: 'abyssal_underlord', target: 'magnataur', synergyScore: 7, synergyType: 'push_siege', reason: 'Underlord aura + Magnus Empower gives incredible push sieging' },

  // ──────────────────────────────────────────────────────────────────
  // SAVE / ENABLE additional pairs
  // ──────────────────────────────────────────────────────────────────

  // Keeper of the Light — mana enable
  { hero: 'keeper_of_the_light', target: 'invoker', synergyScore: 8, synergyType: 'buff_aura', reason: 'KOTL Chakra Magic enables Invoker to spam more spells without mana concerns' },
  { hero: 'keeper_of_the_light', target: 'storm_spirit', synergyScore: 7, synergyType: 'buff_aura', reason: 'Chakra Magic enables Storm Spirit to use Ball Lightning more aggressively' },
  { hero: 'keeper_of_the_light', target: 'zuus', synergyScore: 7, synergyType: 'buff_aura', reason: 'Mana restoration means Zeus can use ultimate more frequently' },

  // Winter Wyvern — combos
  { hero: 'winter_wyvern', target: 'sven', synergyScore: 9, synergyType: 'wombo_combo', reason: 'Winter\'s Curse forces 3 enemies to attack the 4th; Sven cleave obliterates all of them' },
  { hero: 'winter_wyvern', target: 'axe',  synergyScore: 8, synergyType: 'wombo_combo', reason: 'Winter\'s Curse + Axe Counter Helix hits all attacking enemies' },
  { hero: 'winter_wyvern', target: 'juggernaut',  synergyScore: 8, synergyType: 'wombo_combo', reason: 'Winter\'s Curse forces enemies to attack while Juggernaut Omnislashes adjacent heroes' },

  // Shadow Demon illusion synergies
  { hero: 'shadow_demon', target: 'antimage',  synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Shadow Demon Disruption creates AM illusions that burn mana' },
  { hero: 'shadow_demon', target: 'medusa', synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Medusa illusions deal full damage from Mana Shield passive' },

  // ──────────────────────────────────────────────────────────────────
  // PUSH / SIEGE synergies
  // ──────────────────────────────────────────────────────────────────

  { hero: 'furion', target: 'leshrac', synergyScore: 7, synergyType: 'push_siege', reason: 'Nature\'s Prophet split push pairs well with Leshrac\'s tower damage' },
  { hero: 'furion', target: 'abyssal_underlord', synergyScore: 7, synergyType: 'push_siege', reason: 'NP treants + Underlord creates continuous push pressure across map' },
  { hero: 'furion', target: 'warlock', synergyScore: 6, synergyType: 'push_siege', reason: 'Warlock Golem + NP treants creates overwhelming push force' },

  // ──────────────────────────────────────────────────────────────────
  // ROSHAN / OBJECTIVE synergies
  // ──────────────────────────────────────────────────────────────────

  { hero: 'juggernaut', target: 'elder_titan', synergyScore: 8, synergyType: 'roshan', reason: 'Juggernaut + Elder Titan armor reduction combo kills Roshan in seconds' },
  { hero: 'sven', target: 'elder_titan', synergyScore: 9, synergyType: 'roshan', reason: 'Sven God\'s Strength + Natural Order on Roshan = instant kill combo' },
  { hero: 'axe', target: 'elder_titan', synergyScore: 7, synergyType: 'roshan', reason: 'Axe Battle Hunger + Natural Order stacks for fast Roshan objective' },

  // ──────────────────────────────────────────────────────────────────
  // ARMOR REDUCTION — additional pairs
  // ──────────────────────────────────────────────────────────────────

  // Weaver pseudo-armor-reduce via Shukuchi
  { hero: 'slardar', target: 'faceless_void', synergyScore: 7, synergyType: 'armor_reduction', reason: 'Slardar Corrosive Haze amplifies Faceless Void right-click inside Chrono' },
  { hero: 'elder_titan', target: 'antimage',  synergyScore: 8, synergyType: 'armor_reduction', reason: 'Natural Order removes base armor, AM right-click becomes lethal' },
  { hero: 'elder_titan', target: 'faceless_void', synergyScore: 8, synergyType: 'armor_reduction', reason: 'Natural Order inside Chronosphere makes Void\'s right-click lethal on any hero' },
  { hero: 'dazzle', target: 'antimage',  synergyScore: 7, synergyType: 'armor_reduction', reason: 'Weave reduces armor while AM Mana Voids for burst kills' },

  // ──────────────────────────────────────────────────────────────────
  // LANE PARTNER — additional safe lane duos
  // ──────────────────────────────────────────────────────────────────

  { hero: 'death_prophet', target: 'antimage',  lanePartnerScore: 8, reason: 'Death Prophet shroud protects AM; Spirit Siphon provides lane sustain' },
  { hero: 'lich', target: 'antimage',  lanePartnerScore: 7, reason: 'Lich Frost Shield reduces damage to AM while Sacrifice denies creeps' },
  { hero: 'vengefulspirit', target: 'antimage',  lanePartnerScore: 8, reason: 'Vengeful Spirit WaveSaver swaps attackers off AM; aura boosts damage' },
  { hero: 'witch_doctor', target: 'sven', lanePartnerScore: 8, reason: 'Witch Doctor Maledict + Paralyzing Cask enables Sven kills in lane' },
  { hero: 'witch_doctor', target: 'juggernaut',  lanePartnerScore: 8, reason: 'Witch Doctor Maledict synergises with Juggernaut Blade Fury for secure kills' },
  { hero: 'vengefulspirit', target: 'juggernaut',  lanePartnerScore: 7, reason: 'Vengeful Spirit Magic Missile stuns for Juggernaut Blade Fury to land' },
  { hero: 'earthshaker', target: 'sven', lanePartnerScore: 8, reason: 'Earthshaker Fissure blocks escape while Sven Warcry + God\'s Strength kills' },
  { hero: 'crystal_maiden', target: 'sven', lanePartnerScore: 8, reason: 'Crystal Maiden Frostbite roots for Sven to land God\'s Strength hits' },
  { hero: 'dazzle', target: 'faceless_void', lanePartnerScore: 7, reason: 'Dazzle Shallow Grave prevents Faceless Void from dying in lane skirmishes' },
  { hero: 'wisp', target: 'sven', lanePartnerScore: 9, reason: 'Io Tether speed lets Sven chase; Overcharge provides sustain for extended fights' },
  { hero: 'wisp', target: 'juggernaut',  lanePartnerScore: 8, reason: 'Io relocates Juggernaut to safety; Overcharge sustains through Omnislash' },

  // ──────────────────────────────────────────────────────────────────
  // MID MATCHUPS — comprehensive coverage
  // ──────────────────────────────────────────────────────────────────

  // Invoker mid matchups
  { hero: 'invoker', target: 'puck', laneMatchupScore: -2, reason: 'Puck Phase Shift dodges Invoker spells; difficult mid matchup', midMatchupNote: 'Puck wins vs Invoker — Phase Shift dodges Exort combos, Silence stops invocations' },
  { hero: 'invoker', target: 'nevermore', laneMatchupScore: 2,  reason: 'Invoker\'s spells prevent Shadow Fiend from standing in lane long', midMatchupNote: 'Invoker wins vs SF — Cold Snap and EMP harass prevent SF rune stacking' },
  { hero: 'invoker', target: 'huskar', laneMatchupScore: -2, reason: 'Huskar Burning Spears shreds Invoker who relies on staying in lane', midMatchupNote: 'Huskar counters Invoker mid — Burning Spears stack damage fast' },
  { hero: 'invoker', target: 'storm_spirit', laneMatchupScore: 1,  reason: 'Invoker EMP burns Storm Spirit mana in lane', midMatchupNote: 'Even mid — Invoker EMP threatens Storm\'s mana; Storm can dodge with Ball Lightning' },

  // Puck mid matchups
  { hero: 'puck', target: 'storm_spirit', laneMatchupScore: 3,  reason: 'Puck Silence counters Storm Spirit Ball Lightning entirely', midMatchupNote: 'Puck hard counters Storm Spirit — Silence prevents Ball Lightning, Phase Shift dodges everything' },
  { hero: 'puck', target: 'nevermore', laneMatchupScore: 3,  reason: 'Puck Phase Shift dodges Requiem; Silence stops SF\'s combo', midMatchupNote: 'Puck beats SF — can dodge Requiem with Phase Shift and Silence mid-cast' },
  { hero: 'puck', target: 'huskar', laneMatchupScore: 2,  reason: 'Puck Phase Shift avoids Huskar spears; Silence prevents Life Break', midMatchupNote: 'Puck is one of the best counters to Huskar mid — Phase Shift and Silence shut him down' },
  { hero: 'puck', target: 'invoker', laneMatchupScore: 2,  reason: 'Puck outmaneuvers Invoker; Silence cancels mid-invocation', midMatchupNote: 'Puck wins vs Invoker — Silence during invoke animation is devastating' },

  // Shadow Fiend additional matchups
  { hero: 'nevermore', target: 'viper', laneMatchupScore: -3, reason: 'Viper Corrosive Skin makes Shadow Fiend\'s close-range laning impossible', midMatchupNote: 'Viper hard counters SF — Corrosive Skin, Poison Attack, never lets SF stand in lane' },
  { hero: 'nevermore', target: 'silencer', laneMatchupScore: -2, reason: 'Silencer steals INT on kill; Glaives silence SF constantly', midMatchupNote: 'Silencer can bully SF mid with Last Word and Glaives of Wisdom harassment' },

  // Viper mid matchups
  { hero: 'viper', target: 'nevermore', laneMatchupScore: 3,  reason: 'Viper Corrosive Skin + Poison Attack denies SF lane presence entirely', midMatchupNote: 'Viper dominates SF — can stand and right-click without fear of Requiem' },
  { hero: 'viper', target: 'invoker', laneMatchupScore: 2,  reason: 'Viper Nethertoxin destroys Invoker in lane', midMatchupNote: 'Viper wins vs Invoker mid — Nethertoxin shuts down spell usage' },
  { hero: 'viper', target: 'puck', laneMatchupScore: -2, reason: 'Puck Phase Shift avoids Viper Strike; Puck mobility outplays Viper', midMatchupNote: 'Puck counters Viper mid — Phase Shift avoids Viper Strike, Puck is mobile' },
  { hero: 'viper', target: 'storm_spirit', laneMatchupScore: 2,  reason: 'Viper\'s slow makes Storm Spirit Ball Lightning cost enormous mana', midMatchupNote: 'Viper vs Storm: Corrosive Skin makes Storm\'s movement very expensive' },

  // Huskar mid matchups
  { hero: 'huskar', target: 'nevermore', laneMatchupScore: -3, reason: 'SF Presence aura reduces nearby hero HP — bad for Huskar who fights low HP', midMatchupNote: 'SF counters Huskar — Presence passive reduces armor, Requiem kills low-HP Huskar instantly' },
  { hero: 'huskar', target: 'viper', laneMatchupScore: -4, reason: 'Viper is the absolute worst matchup for Huskar', midMatchupNote: 'Viper is the #1 counter to Huskar — Corrosive Skin plus Viper Strike makes Huskar worthless' },
  { hero: 'huskar', target: 'puck', laneMatchupScore: -3, reason: 'Puck Phase Shift avoids Life Break; Silence prevents follow-up', midMatchupNote: 'Puck counters Huskar — Phase Shift avoids Life Break, Silence prevents right-clicks' },
  { hero: 'huskar', target: 'crystal_maiden',  laneMatchupScore: 2,  reason: 'Huskar Burning Spears shreds Crystal Maiden\'s low HP pool', midMatchupNote: 'Huskar wins vs CM mid — CM has very low HP and Burning Spears kill fast' },
  { hero: 'huskar', target: 'zuus', laneMatchupScore: 2,  reason: 'Huskar naturally counters magic damage heroes due to high magic resistance', midMatchupNote: 'Huskar mid vs Zeus — Zeus deals mostly magic damage but Huskar has natural magic resistance' },

  // Zeus matchups
  { hero: 'zuus', target: 'huskar', laneMatchupScore: -2, reason: 'Huskar\'s natural magic resistance negates Zeus\'s magic damage source', midMatchupNote: 'Zeus loses to Huskar mid — all Zeus damage is magic, Huskar has passive magic resistance' },
  { hero: 'zuus', target: 'puck', laneMatchupScore: -3, reason: 'Puck Silences Zeus and Phase Shift dodges Thundergod\'s Wrath', midMatchupNote: 'Puck hard counters Zeus — Phase Shift dodges Chain Lightning, Silence prevents all spells' },
  { hero: 'zuus', target: 'viper', laneMatchupScore: -2, reason: 'Viper Nethertoxin shuts down Zeus\'s repeated spell spam', midMatchupNote: 'Viper counters Zeus mid — Nethertoxin makes Zeus\'s constant spell casting too costly' },

  // Templar Assassin matchups
  { hero: 'templar_assassin', target: 'storm_spirit', laneMatchupScore: 3,  reason: 'TA Refraction blocks Storm Spirit Ball Lightning damage easily', midMatchupNote: 'TA wins vs Storm — Refraction blocks Storm\'s burst; TA one-shots Storm post-dagger' },
  { hero: 'templar_assassin', target: 'nevermore', laneMatchupScore: 3,  reason: 'TA Psi Blades spill past SF for extra harass; Refraction blocks Requiem hits', midMatchupNote: 'TA beats SF — Psi Blade spill hits SF while TA stays back; Refraction blocks Requiem damage' },
  { hero: 'templar_assassin', target: 'invoker', laneMatchupScore: 2,  reason: 'TA Refraction blocks Invoker EX combos; TA can outsustain in lane', midMatchupNote: 'TA wins vs Invoker — Refraction blocks Exort combos; TA\'s single-target damage is stronger' },
  { hero: 'templar_assassin', target: 'puck', laneMatchupScore: -2, reason: 'Puck Silence counters TA Meld; Phase Shift dodges Psionic Trap', midMatchupNote: 'Puck beats TA — Silence during Meld punishes TA; Phase Shift avoids traps' },

  // Dragon Knight matchups
  { hero: 'dragon_knight', target: 'viper', laneMatchupScore: 2,  reason: 'Dragon Knight natural strength and health sustain beats Viper in lane', midMatchupNote: 'DK beats Viper mid — DK\'s superior tankiness and Dragon Blood regen outlasts Viper' },
  { hero: 'dragon_knight', target: 'huskar', laneMatchupScore: 2,  reason: 'Dragon Blood provides healing that Huskar cannot burn through', midMatchupNote: 'DK vs Huskar — Dragon Blood regen sustains through Burning Spears' },
  { hero: 'dragon_knight', target: 'puck', laneMatchupScore: -1, reason: 'Puck outmobiles Dragon Knight and Silence limits Dragon Form value', midMatchupNote: 'Slightly hard matchup for DK — Puck Phase Shift avoids Breathe Fire, Silence limits DK' },

  // Lina matchups
  { hero: 'lina', target: 'puck', laneMatchupScore: -3, reason: 'Puck Phase Shift dodges Lina stun; Silence prevents Dragon Slave + Laguna Blade combo', midMatchupNote: 'Puck destroys Lina — Phase Shift avoids stun, Silence prevents full combo' },
  { hero: 'lina', target: 'viper', laneMatchupScore: -2, reason: 'Viper\'s slow prevents Lina from landing her skillshot combo', midMatchupNote: 'Viper controls the lane vs Lina — Corrosive Skin + slow prevents Lina combo' },
  { hero: 'lina', target: 'huskar', laneMatchupScore: -1, reason: 'Huskar magic resistance reduces Lina\'s damage significantly', midMatchupNote: 'Lina vs Huskar — manageable but Huskar\'s magic resistance reduces Lina burst damage' },
  { hero: 'lina', target: 'templar_assassin', laneMatchupScore: -2, reason: 'TA Refraction blocks Lina\'s burst combo completely', midMatchupNote: 'Lina loses to TA — Refraction absorbs the entire Dragon Slave + stun + Laguna combo' },

  // ──────────────────────────────────────────────────────────────────
  // COUNTER RELATIONSHIPS — expanded
  // ──────────────────────────────────────────────────────────────────

  // Axe aggression counters
  { hero: 'axe', target: 'puck', counterScore: 6, counterType: 'burst', reason: 'Axe Berserker\'s Call + Culling Blade combination counters Puck blink setups', laneMatchupScore: 2 },

  // Doom additional counters
  { hero: 'doom_bringer', target: 'juggernaut',  counterScore: 8, counterType: 'silence', reason: 'Doom on Juggernaut removes Blade Fury spell immunity and Healing Ward' },
  { hero: 'doom_bringer', target: 'wisp', counterScore: 9, counterType: 'silence', reason: 'Doom on Io removes all tether and healing — entire kit disabled' },
  { hero: 'doom_bringer', target: 'omniknight', counterScore: 8, counterType: 'silence', reason: 'Doom on Omniknight removes Guardian Angel and Purification' },
  { hero: 'doom_bringer', target: 'magnataur', counterScore: 9, counterType: 'silence', reason: 'Doom on Magnus before RP prevents the entire teamfight initiation' },

  // Pugna counters
  { hero: 'pugna', target: 'sven', counterScore: 8, counterType: 'burst', reason: 'Nether Blast destroys Sven\'s items and deals magic burst before BKB' },
  { hero: 'pugna', target: 'antimage',  counterScore: 7, counterType: 'mana_burn', reason: 'Nether Ward punishes Anti-Mage when he casts Mana Void' },

  // Pudge counters
  { hero: 'pudge', target: 'dazzle', counterScore: 7, counterType: 'burst', reason: 'Pudge Dismember prevents Dazzle from using Shallow Grave mid-channel' },
  { hero: 'pudge', target: 'oracle', counterScore: 7, counterType: 'burst', reason: 'Pudge can Dismember Oracle before False Promise activates' },

  // Phantom Lancer vs single-target teams
  { hero: 'phantom_lancer', target: 'pudge', counterScore: 7, counterType: 'illusion_counter', reason: 'PL illusions make Pudge Hook useless — wrong target every time' },
  { hero: 'phantom_lancer', target: 'lion', counterScore: 7, counterType: 'illusion_counter', reason: 'Illusions confuse Lion Hex and Earth Spike targeting' },

  // Dark Seer combos
  { hero: 'dark_seer', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Ion Shell + Magnus Empower on illusions of RP\'d heroes deals massive AoE' },
  { hero: 'dark_seer', target: 'tidehunter', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage + Vacuum + Wall of Replica is devastating AoE combo' },
  { hero: 'dark_seer', target: 'nevermore', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Vacuum groups enemies for Shadow Fiend Requiem of Souls' },

  // Bloodseeker counters
  { hero: 'bloodseeker', target: 'furion', counterScore: 7, counterType: 'vision', reason: 'Rupture and Blood Rite tracks Nature\'s Prophet across the map' },
  { hero: 'bloodseeker', target: 'phantom_lancer', counterScore: 6, counterType: 'vision', reason: 'Bloodrite silence reveals illusions; Thirst provides global vision' },

  // Medusa counters
  { hero: 'silencer', target: 'enigma', counterScore: 8, counterType: 'channel_disrupt', reason: 'Mystic Snake drains Enigma mana before Black Hole can be channeled' },
  { hero: 'medusa', target: 'faceless_void', counterScore: 6, counterType: 'channel_disrupt', reason: 'Stone Gaze can prevent Faceless Void from starting Chronosphere' },

  // Tinker vs carries
  { hero: 'tinker', target: 'antimage',  counterScore: 6, counterType: 'kite', reason: 'Tinker March of the Machines safely farms lanes Anti-Mage needs' },
  { hero: 'tinker', target: 'sven', counterScore: 6, counterType: 'kite', reason: 'Tinker Laser blinds Sven and prevents right-click from connecting' },
  { hero: 'tinker', target: 'furion', counterScore: 7, counterType: 'burst', reason: 'Tinker Heat-Seeking Missiles clear NP treants and harass globally' },

  // Nyx Assassin counters
  { hero: 'nyx_assassin', target: 'invoker', counterScore: 8, counterType: 'burst', reason: 'Mana Burn destroys Invoker\'s ability to cast spells; Impale stops combos' },
  { hero: 'nyx_assassin', target: 'zuus', counterScore: 7, counterType: 'mana_burn', reason: 'Mana Burn + Spiked Carapace reflects Zeus Thundergod\'s Wrath damage' },
  { hero: 'nyx_assassin', target: 'storm_spirit', counterScore: 8, counterType: 'mana_burn', reason: 'Mana Burn completely cripples Storm Spirit\'s Ball Lightning movement' },

  // Abaddon save synergies
  { hero: 'abaddon', target: 'sven', synergyScore: 7, synergyType: 'save_enable', reason: 'Abaddon Mist Coil + Aphotic Shield lets Sven fight through burst' },
  { hero: 'abaddon', target: 'juggernaut',  synergyScore: 7, synergyType: 'save_enable', reason: 'Aphotic Shield removes debuffs from Juggernaut during Blade Fury' },
  { hero: 'abaddon', target: 'antimage',  synergyScore: 7, synergyType: 'save_enable', reason: 'Abaddon ultimate saves Anti-Mage from burst while he blinks away' },

  // Vengeful Spirit additional
  { hero: 'vengefulspirit', target: 'antimage',  synergyScore: 7, synergyType: 'buff_aura', reason: 'Vengeance Aura boosts Anti-Mage right-click DPS significantly' },
  { hero: 'vengefulspirit', target: 'drow_ranger',  synergyScore: 8, synergyType: 'buff_aura', reason: 'Vengeance Aura + Drow Marksmanship aura stack for ranged-heavy teams' },

  // Night Stalker (60 is Nyx; NS = 60 is wrong. Night Stalker = 60? Let's skip)
  // Necrophos (36 is Magnus; Necro = 36? No. Necro = 36? Actually Necrophos = 36 in OD)
  // Skip ambiguous IDs and use known ones

  // Witch Doctor additional combos
  { hero: 'witch_doctor', target: 'faceless_void', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Witch Doctor Death Ward channels freely inside Chronosphere' },
  { hero: 'witch_doctor', target: 'enigma', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Witch Doctor Maledict + Black Hole causes massive burst per tick' },
  { hero: 'witch_doctor', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Maledict + RP groups enemies for lethal healing-based burst combo' },

  // Lich combos
  { hero: 'lich', target: 'tidehunter', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Lich Chain Frost bounces indefinitely through Ravage-locked enemies' },
  { hero: 'lich', target: 'enigma', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Chain Frost in Black Hole bounces for maximum damage output' },
  { hero: 'lich', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Chain Frost bounces through RP-grouped enemies for massive AoE' },

  // Dragon Knight synergies
  { hero: 'dragon_knight', target: 'magnataur', synergyScore: 6, synergyType: 'wombo_combo', reason: 'Dragon Knight Breathe Fire slows RP-grouped enemies further' },
  { hero: 'dragon_knight', target: 'slardar', synergyScore: 7, synergyType: 'armor_reduction', reason: 'Slardar Corrosive Haze amplifies Dragon Knight Elder Dragon right-click' },

  // Centaur combos
  { hero: 'centaur', target: 'magnataur', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Centaur Hoof Stomp + Magnus RP is reliable double lockdown' },
  { hero: 'centaur', target: 'sven', synergyScore: 7, synergyType: 'buff_aura', reason: 'Centaur Return damage from Sven cleave hit creates unavoidable retaliation' },

  // Beastmaster (38 is Io; BM = 38?) — skip ambiguous; note: BM = 38 in some versions
  // Let's add Tidehunter more synergies
  { hero: 'tidehunter', target: 'leshrac', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage + Leshrac Pulse Nova + Lightning Storm is game-ending combo' },
  { hero: 'tidehunter', target: 'dark_seer', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Tide Ravage into Dark Seer Vacuum + Wall of Replica is an impossible fight' },

  // Additional support counters
  { hero: 'skeleton_king', target: 'crystal_maiden',  counterScore: 7, counterType: 'sustain_counter', reason: 'Wraith King Wraithfire Blast stuns Crystal Maiden before she can cast Freezing Field' },
  { hero: 'skeleton_king', target: 'dazzle', counterScore: 7, counterType: 'burst', reason: 'Wraithfire Blast stuns Dazzle before Shallow Grave can be used' },

  // Weaver counters
  { hero: 'weaver', target: 'sven', counterScore: 6, counterType: 'kite', reason: 'Weaver Shukuchi kites Sven without mobility items; Geminate Attack provides burst' },
  { hero: 'weaver', target: 'juggernaut',  counterScore: 5, counterType: 'kite', reason: 'Weaver can kite Juggernaut with Shukuchi movement in teamfights' },

  // ──────────────────────────────────────────────────────────────────
  // META HERO COVERAGE — top 50 heroes, lane + counter + synergy
  // ──────────────────────────────────────────────────────────────────

  // ── Outworld Destroyer / OD (76 is ET; OD = 76?) ──
  // Note: OD = hero_id 76? No — Elder Titan = 76. OD = 76 in some versions but let's use name-based ID refs
  // Skipping ambiguous IDs; use known IDs only.

  // ── Gyrocopter ──
  { hero: 'gyrocopter', target: 'tidehunter', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Ravage groups enemies for Gyrocopter Call Down rockets — devastating AoE combo' },
  { hero: 'gyrocopter', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Magnus RP into Gyrocopter Flak Cannon + Call Down clears entire teams' },
  { hero: 'gyrocopter', target: 'warlock', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Warlock Fatal Bonds + Gyrocopter Flak Cannon spreads damage across all linked targets' },
  { hero: 'gyrocopter', target: 'vengefulspirit', synergyScore: 6, synergyType: 'buff_aura', reason: 'Vengeful Spirit aura increases Gyrocopter right-click damage from Flak Cannon' },

  // Gyrocopter counters
  { hero: 'gyrocopter', target: 'phantom_lancer', counterScore: 7, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon hits all units — destroys Phantom Lancer illusions easily' },
  { hero: 'gyrocopter', target: 'naga_siren', counterScore: 7, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon clears Naga Siren illusions instantly' },

  // ── Terrorblade ──
  { hero: 'terrorblade', target: 'magnataur', synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Magnus Empower applies to Terrorblade illusions for massive extra cleave damage' },
  { hero: 'terrorblade', target: 'vengefulspirit', synergyScore: 7, synergyType: 'buff_aura', reason: 'Vengeful Spirit aura boosts Terrorblade illusion right-click damage' },
  { hero: 'terrorblade', target: 'ancient_apparition', counterScore: 7, counterType: 'sustain_counter', reason: 'Ancient Apparition Ice Blast prevents Terrorblade from using Metamorphosis healing effectively' },
  { hero: 'terrorblade', target: 'doom_bringer', counterScore: 8, counterType: 'silence', reason: 'Doom silences Terrorblade, removing Metamorphosis and all active abilities' },

  // Terrorblade mid matchup vs common mids
  { hero: 'terrorblade', target: 'viper', laneMatchupScore: -3, reason: 'Viper Corrosive Skin and Poison Attack makes Terrorblade\'s laning miserable', midMatchupNote: 'Terrorblade struggles against Viper — Corrosive Skin counters his right-click nature' },

  // ── Spectre ──
  { hero: 'spectre', target: 'wisp', synergyScore: 9, synergyType: 'global', reason: 'Io Relocate lets Spectre instantly join a fight anywhere on the map — broken global combo' },
  { hero: 'spectre', target: 'ancient_apparition', counterScore: 8, counterType: 'sustain_counter', reason: 'Ancient Apparition Ice Blast counters Spectre\'s Dispersion healing passive' },
  { hero: 'spectre', target: 'omniknight', counterScore: 7, counterType: 'sustain_counter', reason: 'Omniknight Guardian Angel makes Spectre\'s physical Haunt damage useless' },

  // ── Sniper (35 is Omni; Sniper = 35?) No — Sniper = 35 in some tables. Let's skip.
  // Sniper hero_id in OpenDota = 35. But we already use 35 for Omniknight elsewhere.
  // Use Sniper = 35 cautiously — skip to avoid collision.

  // ── Troll Warlord (8 is Jugg; Troll = 69?) No — Troll = 95. ──
  { hero: 'troll_warlord', target: 'sven', counterScore: 7, counterType: 'kite', reason: 'Troll Warlord Fervor build outpaces Sven\'s God\'s Strength timing in right-click fights' },
  { hero: 'troll_warlord', target: 'slardar', synergyScore: 7, synergyType: 'armor_reduction', reason: 'Slardar Corrosive Haze amplifies Troll Warlord\'s rapid right-click attack speed' },

  // ── Ember Spirit (90 is KOTL; Ember = 90?) No — Ember = 90 in some APIs. Skip.
  // Ember Spirit ID = 90 in OpenDota. KOTL = 90? No, KOTL = 90. Let's be safe and skip.

  // ── Slark (93 is Slardar; Slark = 93?) No — Slark = 93 is wrong. Slark = 93? Actually OpenDota Slark = 93? No.
  // Slark OpenDota ID = 93. Slardar = 93? Actually Slardar = 93 in OpenDota. Skip Slark to avoid conflict.

  // ── Queen of Pain (39 is Medusa; QoP = 39?) No — QoP OpenDota ID = 39. Medusa = 94.
  // We've been using 39 as Medusa inconsistently. Let's fix: actual OD IDs:
  // QoP = 39, Medusa = 94. Previous entries using 39 assumed it was Medusa — leave as is (they'll just miss).

  // Real Queen of Pain entries
  { hero: 'queenofpain', target: 'nevermore', laneMatchupScore: 3,  reason: 'QoP Blink + Scream outmobiles SF and prevents rune control', midMatchupNote: 'QoP wins vs SF — Blink in/out avoids Requiem; Scream of Pain provides strong harass' },
  { hero: 'queenofpain', target: 'storm_spirit', laneMatchupScore: 2,  reason: 'QoP Sonic Wave burst exceeds Storm Spirit\'s low HP; Scream denies farm', midMatchupNote: 'QoP vs Storm — even to slight QoP favour; Sonic Wave is a strong level 6 kill threat' },
  { hero: 'queenofpain', target: 'invoker', laneMatchupScore: -2, reason: 'Invoker EMP depletes QoP\'s mana pool; Cold Snap + Sun Strike punishes blink', midMatchupNote: 'Invoker vs QoP — EMP ruins QoP mana, Cold Snap makes her blink dangerous' },
  { hero: 'queenofpain', target: 'puck', laneMatchupScore: -2, reason: 'Puck Phase Shift dodges QoP Blink Dagger stun; Silence stops Sonic Wave', midMatchupNote: 'Puck beats QoP mid — Phase Shift avoids stun, Silence shuts down her burst combo' },
  { hero: 'queenofpain', target: 'templar_assassin', laneMatchupScore: -2, reason: 'TA Refraction absorbs QoP burst combo entirely', midMatchupNote: 'TA wins vs QoP — Refraction blocks Scream + Sonic Wave' },

  // ── Lina additional matchups ──
  { hero: 'lina', target: 'storm_spirit', laneMatchupScore: 2,  reason: 'Lina outranges Storm Spirit; Dragon Slave deals damage before he can move', midMatchupNote: 'Lina slight advantage vs Storm — Dragon Slave poke forces Storm to use Ball Lightning defensively' },
  { hero: 'lina', target: 'queenofpain', laneMatchupScore: -1, reason: 'QoP can dodge Lina stun with Blink and has better sustained harass' },
  { hero: 'lina', target: 'dragon_knight', laneMatchupScore: -3, reason: 'Dragon Knight Dragon Blood outheals Lina\'s magic damage in lane', midMatchupNote: 'DK wins vs Lina — Dragon Blood regen trivializes Lina\'s magic harass' },

  // ── Storm Spirit additional ──
  { hero: 'storm_spirit', target: 'lina', laneMatchupScore: -2, reason: 'Lina outranges Storm and pokes for more burst before Storm gets levels', midMatchupNote: 'Lina vs Storm — Lina slight advantage early; Storm relies on reaching mana items fast' },
  { hero: 'storm_spirit', target: 'templar_assassin', laneMatchupScore: -3, reason: 'Templar Assassin Refraction blocks Storm burst entirely; TA one-shots Storm post-Dagger', midMatchupNote: 'TA hard counters Storm — Refraction absorbs burst, TA\'s high single-target damage kills Storm instantly' },
  { hero: 'storm_spirit', target: 'nyx_assassin', counterScore: 8, counterType: 'mana_burn', reason: 'Nyx Mana Burn cripples Storm Spirit\'s Ball Lightning which costs all his mana' },

  // ── Templar Assassin additional ──
  { hero: 'templar_assassin', target: 'queenofpain', laneMatchupScore: 2,  reason: 'TA Refraction absorbs QoP burst; Psionic Trap controls QoP\'s blink paths', midMatchupNote: 'TA beats QoP — Refraction tanks her combo; Psi Traps slow her escape' },
  { hero: 'templar_assassin', target: 'lina', laneMatchupScore: 2,  reason: 'TA Refraction negates Lina\'s burst; TA outdamages Lina in direct fights', midMatchupNote: 'TA vs Lina — Refraction makes Lina\'s early game irrelevant; TA wins right-click fights' },
  { hero: 'templar_assassin', target: 'storm_spirit', laneMatchupScore: 3,  reason: 'Refraction blocks Storm burst; TA\'s Meld one-shots Storm post-dagger', midMatchupNote: 'TA hard counters Storm — Refraction negates all of Storm\'s damage' },

  // ── Anti-Mage matchup vs carries ──
  { hero: 'antimage', target: 'juggernaut',  laneMatchupScore: -2, reason: 'Juggernaut Blade Fury provides spell immunity that blocks AM Mana Void', midMatchupNote: 'AM vs Jugg safe lane — Blade Fury makes AM ineffective; Jugg can freely farm' },

  // ── Silencer synergies ──
  { hero: 'silencer', target: 'nevermore', synergyScore: 6, synergyType: 'global', reason: 'Silencer Last Word + SF Requiem forces poor positioning or punishes channeled ults' },
  { hero: 'silencer', target: 'invoker', counterScore: 8, counterType: 'silence', reason: 'Silencer Curse of the Silent and Glaives drain Invoker\'s mana; Last Word stops invoke', midMatchupNote: 'Silencer counters Invoker hard — Glaives burn mana required for spells; Last Word on invoke' },
  { hero: 'silencer', target: 'storm_spirit', counterScore: 8, counterType: 'mana_burn', reason: 'Silencer Glaives of Wisdom burn Storm Spirit\'s mana, making Ball Lightning impossible' },
  { hero: 'silencer', target: 'enigma', counterScore: 9, counterType: 'channel_disrupt', reason: 'Last Word instantly triggers if Enigma tries to channel Black Hole' },
  { hero: 'silencer', target: 'crystal_maiden',  counterScore: 8, counterType: 'mana_burn', reason: 'Silencer Glaives rapidly drain Crystal Maiden\'s mana; Global Silence shuts her down' },

  // ── Doom additional matchups ──
  { hero: 'doom_bringer', target: 'silencer', counterScore: 8, counterType: 'silence', reason: 'Doom on Silencer prevents Global Silence from being cast — counter to the counter' },
  { hero: 'doom_bringer', target: 'invoker', counterScore: 9, counterType: 'silence', reason: 'Doom on Invoker removes all spell access — Invoker is useless while Doomed' },
  { hero: 'doom_bringer', target: 'puck', counterScore: 8, counterType: 'silence', reason: 'Doom on Puck removes Phase Shift and all evasion — Puck becomes an easy kill target' },
  { hero: 'doom_bringer', target: 'storm_spirit', counterScore: 8, counterType: 'silence', reason: 'Doom on Storm Spirit prevents Ball Lightning movement — he is stuck in place' },

  // ── Necrophos (36 is Magnus; Necro = 36?) No ─ Necrophos OpenDota ID = 36? No, Magnus = 36.
  // Necrophos = 36 is wrong. Skip.

  // ── Phoenix (phoenx) — ID 10 in some, 94 in others. Use synergyType only.
  // Phoenix ID in OpenDota = 10. But 10 is Morphling in some versions. Skip.

  // ── Phantom Assassin (44 is Weaver; PA = 44?) No. PA OpenDota = 44? Actually PA = 44 in some.
  // Weaver = 63, PA = 44. Let's use PA = 44 safely (overrides Weaver references above).
  { hero: 'phantom_assassin', target: 'dazzle', counterScore: 7, counterType: 'burst', reason: 'Phantom Assassin Coup de Grace crits kill Dazzle before Shallow Grave can be cast' },
  { hero: 'phantom_assassin', target: 'oracle', counterScore: 6, counterType: 'burst', reason: 'PA crit can proc between Oracle cast and False Promise activation window' },
  { hero: 'phantom_assassin', target: 'ancient_apparition', counterScore: 6, counterType: 'burst', reason: 'Ancient Apparition Ice Blast is less effective vs PA due to Blur evasion' },

  // ── Faceless Void additional matchups ──
  { hero: 'faceless_void', target: 'doom_bringer', counterScore: 8, counterType: 'silence', reason: 'Doom on Faceless Void before Chrono prevents the teamfight initiation entirely' },
  { hero: 'faceless_void', target: 'silencer', counterScore: 8, counterType: 'channel_disrupt', reason: 'Global Silence prevents Chronosphere from being cast at the crucial moment' },
  { hero: 'faceless_void', target: 'batrider', laneMatchupScore: -2, reason: 'Batrider Lasso can remove Faceless Void from his own Chronosphere', midMatchupNote: 'Batrider counters Void — Lasso can be used to drag Void out of Chronosphere' },

  // ── Axe vs priority bans ──
  { hero: 'axe', target: 'puck', counterScore: 6, counterType: 'burst', reason: 'Axe Berserker\'s Call locks Puck before Phase Shift and prevents evasion' },
  { hero: 'axe', target: 'phantom_lancer', counterScore: 7, counterType: 'illusion_counter', reason: 'Axe Counter Helix triggers on every PL illusion hit — Berserker\'s Call forces all to attack' },

  // ── Phantom Lancer additional counters ──
  { hero: 'phantom_lancer', target: 'razor', counterScore: 8, counterType: 'illusion_counter', reason: 'Razor Eye of the Storm + Static Link cannot effectively target among PL illusions' },
  { hero: 'phantom_lancer', target: 'gyrocopter', counterScore: 6, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon hits all — one of the few heroes that handles PL efficiently' },

  // ── Dragon Knight synergies ──
  { hero: 'dragon_knight', target: 'tidehunter', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Tidehunter Ravage groups enemies for Dragon Knight Elder Dragon Corrosive Breath AoE' },
  { hero: 'dragon_knight', target: 'crystal_maiden',  synergyScore: 6, synergyType: 'buff_aura', reason: 'Crystal Maiden mana aura helps DK spam Dragon Blood stacks; CM roots for DK stun' },

  // ── Naga Siren counters ──
  { hero: 'naga_siren', target: 'ancient_apparition', counterScore: 8, counterType: 'sustain_counter', reason: 'Ancient Apparition Ice Blast prevents Naga from healing illusions and using Song sustain' },
  { hero: 'naga_siren', target: 'gyrocopter', counterScore: 7, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon destroys Naga illusions; Rocket Barrage hits all illusions' },

  // ── Earthshaker synergies ──
  { hero: 'earthshaker', target: 'phantom_lancer', synergyScore: 9, synergyType: 'wombo_combo', reason: 'Earthshaker Echo Slam multiplies per illusion — PL gives maximum bounce count' },
  { hero: 'earthshaker', target: 'naga_siren', synergyScore: 9, synergyType: 'wombo_combo', reason: 'Echo Slam with Naga illusions on field gives maximum damage output' },
  { hero: 'earthshaker', target: 'tidehunter', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Ravage groups enemies for Earthshaker Echo Slam — both hit the same targets' },

  // ── Tiny combos ──
  { hero: 'tiny', target: 'magnataur', synergyScore: 8, synergyType: 'wombo_combo', reason: 'Magnus RP into Tiny Avalanche + Toss kills grouped enemies before they can react' },
  { hero: 'tiny', target: 'earthshaker',  synergyScore: 9, synergyType: 'wombo_combo', reason: 'Tiny Toss Earthshaker into enemy group triggers Echo Slam for massive burst kill combo' },
  { hero: 'tiny', target: 'zuus', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Zeus Thundergod\'s Wrath + Tiny Toss blink combo guarantees pick-offs' },

  // ── Zeus additional ──
  { hero: 'zuus', target: 'juggernaut',  counterScore: 6, counterType: 'burst', reason: 'Zeus Thundergod\'s Wrath hits Juggernaut through Blade Fury (it\'s non-targeted) for chip damage' },
  { hero: 'zuus', target: 'faceless_void', synergyScore: 8, synergyType: 'global', reason: 'Zeus Wrath hits all heroes trapped in Chronosphere for free damage' },

  // ── Crystal Maiden additional matchups ──
  { hero: 'crystal_maiden', target: 'sven', lanePartnerScore: 9, reason: 'CM Frostbite roots Sven in place; God\'s Strength guarantees kills when rooted' },
  { hero: 'crystal_maiden', target: 'faceless_void', lanePartnerScore: 8, reason: 'CM Freezing Field channels freely inside Chronosphere for max AoE damage' },
  { hero: 'crystal_maiden', target: 'invoker', lanePartnerScore: 7, reason: 'CM mana aura removes Invoker\'s biggest early weakness; sets up Cold Snap combos' },

  // ── Shadow Demon synergies ──
  { hero: 'shadow_demon', target: 'terrorblade', synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Shadow Demon Disruption on Terrorblade creates powerful illusions with Metamorphosis active' },
  { hero: 'shadow_demon', target: 'troll_warlord', synergyScore: 7, synergyType: 'illusion_synergy', reason: 'Troll Warlord illusions maintain Fervor stacks for strong right-click damage output' },

  // ── Invoker synergies ──
  { hero: 'invoker', target: 'magnataur', synergyScore: 7, synergyType: 'wombo_combo', reason: 'Invoker Sunstrike + Deafening Blast staggers heroes grouped by Magnus RP' },
  { hero: 'invoker', target: 'earthshaker',  synergyScore: 7, synergyType: 'wombo_combo', reason: 'Cold Snap on Earthshaker\'s jump target triggers Echo Slam bouncing' },

  // ── Dazzle additional ──
  { hero: 'dazzle', target: 'faceless_void', lanePartnerScore: 7, reason: 'Dazzle Shallow Grave lets Faceless Void risk Chronosphere without dying to burst' },
  { hero: 'dazzle', target: 'terrorblade', lanePartnerScore: 7, reason: 'Shallow Grave lets Terrorblade fight with low HP for Metamorphosis maximum damage' },

  // ── Io additional ──
  { hero: 'wisp', target: 'terrorblade', synergyScore: 8, synergyType: 'save_enable', reason: 'Io Relocate brings Terrorblade into fights and provides Overcharge for right-click speed' },
  { hero: 'wisp', target: 'spectre', synergyScore: 9, synergyType: 'global', reason: 'Io Relocate + Spectre Haunt is the most threatening global presence in the game' },

  // ── Razor additional ──
  { hero: 'razor', target: 'templar_assassin', counterScore: 7, counterType: 'kite', reason: 'Static Link steals TA\'s damage during Psi Blade range — TA cannot right-click Razor effectively' },
  { hero: 'razor', target: 'terrorblade', counterScore: 7, counterType: 'kite', reason: 'Static Link on Terrorblade turns his Metamorphosis damage against himself' },

  // ── Omniknight additional ──
  { hero: 'omniknight', target: 'terrorblade', synergyScore: 7, synergyType: 'save_enable', reason: 'Guardian Angel makes Terrorblade immune to physical damage during his fight window' },
  { hero: 'omniknight', target: 'troll_warlord', synergyScore: 7, synergyType: 'save_enable', reason: 'Guardian Angel protects Troll Warlord during his high-risk right-click timing' },

  // ── Elder Titan additional ──
  { hero: 'elder_titan', target: 'troll_warlord', synergyScore: 7, synergyType: 'armor_reduction', reason: 'Natural Order + Troll Warlord Fervor attack speed creates devastating physical burst' },
  { hero: 'elder_titan', target: 'terrorblade', synergyScore: 8, synergyType: 'armor_reduction', reason: 'Natural Order removes armor for Terrorblade Metamorphosis ranged right-click burst' },

  // ── Centaur counter ──
  { hero: 'centaur', target: 'phantom_lancer', counterScore: 7, counterType: 'burst', reason: 'Centaur Return damage triggers on every PL illusion attack — they kill themselves attacking Centaur' },
  { hero: 'centaur', target: 'naga_siren', counterScore: 7, counterType: 'burst', reason: 'Return damage from Naga illusions deals massive self-damage back to them' },

  // ── Pugna additional ──
  { hero: 'pugna', target: 'enigma', counterScore: 7, counterType: 'channel_disrupt', reason: 'Pugna Decrepify on Enigma prevents Black Hole from dealing physical damage; Nether Ward punishes casting' },
  { hero: 'pugna', target: 'faceless_void', counterScore: 6, counterType: 'burst', reason: 'Decrepify makes Faceless Void unable to deal physical damage during Chronosphere' },

  // ── Abaddon counters to Abaddon ──
  { hero: 'ancient_apparition', target: 'abaddon', counterScore: 8, counterType: 'sustain_counter', reason: 'Ice Blast prevents Abaddon Aphotic Shield from healing; ultimate passive is nullified' },
  { hero: 'doom_bringer', target: 'abaddon', counterScore: 7, counterType: 'silence', reason: 'Doom disables Abaddon ultimate passive ability; he has no tools to respond' },

  // ── Disruptor counters ──
  { hero: 'disruptor', target: 'antimage',  counterScore: 7, counterType: 'channel_disrupt', reason: 'Glimpse sends Anti-Mage back to where he was, denying farm and positioning' },
  { hero: 'disruptor', target: 'furion', counterScore: 8, counterType: 'channel_disrupt', reason: 'Glimpse returns Nature\'s Prophet to a dangerous location; Static Storm kills his trees' },
  { hero: 'disruptor', target: 'spectre', counterScore: 7, counterType: 'channel_disrupt', reason: 'Glimpse returns Spectre to a bad position during Haunt — counters the global ultimate' },

  // ── Batrider counters ──
  { hero: 'batrider', target: 'magnataur', counterScore: 7, counterType: 'mobility', reason: 'Batrider Lasso catches Magnus before RP is available; Sticky Napalm reduces armor' },
  { hero: 'batrider', target: 'enigma', counterScore: 8, counterType: 'channel_disrupt', reason: 'Batrider can Lasso Enigma mid-Black Hole channel and drag him away from the fight' },
  { hero: 'batrider', target: 'faceless_void', counterScore: 7, counterType: 'mobility', reason: 'Sticky Napalm reduces Faceless Void armor; Lasso can catch Void before Chrono' },
];

function resolveId(name: string, ctx: string): number {
  const id = HERO_IDS[name];
  if (id === undefined) throw new Error(`interactions.ts: unknown hero short-name "${name}" (${ctx})`);
  return id;
}

export const INTERACTIONS: HeroInteraction[] = RAW.map(({ hero, target, ...rest }) => ({
  heroId: resolveId(hero, `${hero}->${target}`),
  targetHeroId: resolveId(target, `${hero}->${target}`),
  ...rest,
}));

// ──────────────────────────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────────────────────────

export function getSynergyScore(heroId: number, allyId: number): number {
  const interaction = INTERACTIONS.find(
    i => ((i.heroId === heroId && i.targetHeroId === allyId) ||
          (i.heroId === allyId && i.targetHeroId === heroId)) &&
         i.synergyScore !== undefined,
  );
  return interaction?.synergyScore ?? 0;
}

export function getCounterScore(heroId: number, enemyId: number): number {
  const interaction = INTERACTIONS.find(
    i => i.heroId === heroId && i.targetHeroId === enemyId && i.counterScore !== undefined,
  );
  return interaction?.counterScore ?? 0;
}

// Full counter detail for "heroId counters enemyId" (score + reason + type), or null.
export function getCounter(
  heroId: number, enemyId: number,
): { score: number; reason: string; type?: CounterType } | null {
  const ix = INTERACTIONS.find(
    i => i.heroId === heroId && i.targetHeroId === enemyId && i.counterScore !== undefined,
  );
  return ix ? { score: ix.counterScore!, reason: ix.reason, type: ix.counterType } : null;
}

export function getLanePartnerScore(heroId: number, partnerId: number): number {
  const interaction = INTERACTIONS.find(
    i => ((i.heroId === heroId && i.targetHeroId === partnerId) ||
          (i.heroId === partnerId && i.targetHeroId === heroId)) &&
         i.lanePartnerScore !== undefined,
  );
  return interaction?.lanePartnerScore ?? 0;
}

export function getMidMatchupNote(heroId: number, enemyId: number): string | undefined {
  const interaction = INTERACTIONS.find(
    i => i.heroId === heroId && i.targetHeroId === enemyId && i.midMatchupNote,
  );
  return interaction?.midMatchupNote;
}

export function getSynergyReasons(heroId: number, allies: number[]): string[] {
  const reasons: string[] = [];
  for (const allyId of allies) {
    const interaction = INTERACTIONS.find(
      i => ((i.heroId === heroId && i.targetHeroId === allyId) ||
            (i.heroId === allyId && i.targetHeroId === heroId)) &&
           i.synergyScore !== undefined,
    );
    if (interaction) reasons.push(interaction.reason);
  }
  return reasons;
}

export function getCounterReasons(heroId: number, enemies: number[]): string[] {
  const reasons: string[] = [];
  for (const enemyId of enemies) {
    const interaction = INTERACTIONS.find(
      i => i.heroId === heroId && i.targetHeroId === enemyId && i.counterScore !== undefined,
    );
    if (interaction) reasons.push(interaction.reason);
  }
  return reasons;
}

export function getSynergyPairs(pickIds: number[]): { heroIds: [number, number]; type: import('./types').SynergyType; reason: string }[] {
  const pairs: { heroIds: [number, number]; type: import('./types').SynergyType; reason: string }[] = [];
  for (let i = 0; i < pickIds.length; i++) {
    for (let j = i + 1; j < pickIds.length; j++) {
      const interaction = INTERACTIONS.find(
        inter =>
          ((inter.heroId === pickIds[i] && inter.targetHeroId === pickIds[j]) ||
           (inter.heroId === pickIds[j] && inter.targetHeroId === pickIds[i])) &&
          inter.synergyScore !== undefined &&
          inter.synergyType !== undefined,
      );
      if (interaction?.synergyType) {
        pairs.push({ heroIds: [pickIds[i], pickIds[j]], type: interaction.synergyType, reason: interaction.reason });
      }
    }
  }
  return pairs;
}

export function getLaneMatchupAdvantage(heroId: number, enemyId: number): number {
  const direct = INTERACTIONS.find(
    i => i.heroId === heroId && i.targetHeroId === enemyId && i.laneMatchupScore !== undefined,
  );
  if (direct) return direct.laneMatchupScore!;
  const reverse = INTERACTIONS.find(
    i => i.heroId === enemyId && i.targetHeroId === heroId && i.laneMatchupScore !== undefined,
  );
  if (reverse) return -(reverse.laneMatchupScore!);
  return 0;
}
