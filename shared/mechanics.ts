// The shared vocabulary that links heroes ↔ items without an N×M table.
//
// A hero declares what it RELIES on (relianceTags) and any extra mechanic it is
// directly VULNERABLE to. An item declares which MECHANICS it provides. The
// matcher (shared/matchups.ts) connects them: for each enemy hero, find the
// mechanics that answer it, then the items that supply those mechanics.

// What an item can provide.
export type Mechanic =
  | 'targeted_block'   // Linken's Sphere, Lotus Orb — blocks a single-target spell
  | 'dispel'           // Eul's, Nullifier, Lotus — removes buffs/debuffs
  | 'break'            // Silver Edge — disables passives
  | 'true_strike'      // MKB, Bloodthorn — pierces evasion
  | 'magic_barrier'    // Pipe, Hood, Glimmer — absorbs magic damage
  | 'physical_barrier' // Crimson Guard, Shiva's, Ghost — blocks physical damage
  | 'armor_aura'       // Assault Cuirass, Solar Crest — armor vs right-click
  | 'armor_reduction'  // Assault Cuirass, Desolator — shred enemy armor (offense)
  | 'heal_reduction'   // Spirit Vessel, Skadi — cuts healing / regen
  | 'magic_immunity'   // Black King Bar — ignore magic & most disables
  | 'detection'        // Gem, Sentry, Dust — reveal invisibility
  | 'illusion_clear'   // Mjollnir, Battle Fury — clear illusions / summons
  | 'hard_control'     // Scythe of Vyse, Abyssal, Gleipnir — lock down slippery heroes
  | 'silence'          // Orchid, Bloodthorn — stop spellcasters / channels
  | 'interrupt'        // Eul's — cyclone interrupts channels / charges (Spirit Breaker)
  | 'disarm'           // Heaven's Halberd — turn off a right-click carry
  | 'save'             // Force Staff, Glimmer, Lotus, Aeon Disk — peel/save
  | 'sustain';         // Mekansm, Greaves, Pipe heal — team sustain

// What a hero depends on; neutralizing it cripples the hero.
export type Reliance =
  | 'passive'             // Bristleback, Tidehunter Kraken Shell, PA Blur — answered by break
  | 'evasion'             // PA, Brewmaster — answered by true_strike
  | 'single_target_spell' // Lion hex, Doom, SB charge — answered by targeted_block / BKB
  | 'channel'             // Enigma, Witch Doctor, Bane — answered by control / silence
  | 'invisibility'        // Riki, Clinkz, Bounty — answered by detection
  | 'illusions'           // PL, Naga, summons — answered by illusion_clear
  | 'regen'               // Huskar, Wraith King, Bristleback — answered by heal_reduction
  | 'magic_burst'         // Zeus, Lina, Lion — answered by magic_barrier / BKB
  | 'right_click';        // most carries — answered by physical_barrier / armor / disarm

// Which item-mechanics answer each reliance.
export const RELIANCE_ANSWERS: Record<Reliance, Mechanic[]> = {
  passive:             ['break'],
  evasion:             ['true_strike'],
  single_target_spell: ['targeted_block', 'magic_immunity'],
  channel:             ['hard_control', 'silence', 'interrupt'],
  invisibility:        ['detection'],
  illusions:           ['illusion_clear'],
  regen:               ['heal_reduction'],
  magic_burst:         ['magic_barrier', 'magic_immunity'],
  right_click:         ['physical_barrier', 'armor_aura', 'disarm'],
};

// Generic "this mechanic is good against …" phrasing for the item-table viewer.
export const MECHANIC_COUNTERS: Record<Mechanic, string> = {
  targeted_block: 'single-target spells',
  dispel: 'buffs & debuffs',
  break: 'passive-reliant heroes',
  true_strike: 'evasion',
  magic_barrier: 'magic burst',
  physical_barrier: 'right-click damage',
  armor_aura: 'physical cores',
  armor_reduction: 'tanky / high-armor heroes',
  heal_reduction: 'regen & lifesteal',
  magic_immunity: 'magic damage & disables',
  detection: 'invisible heroes',
  illusion_clear: 'illusions & summons',
  hard_control: 'slippery casters',
  silence: 'spellcasters',
  interrupt: 'channels & charges',
  disarm: 'right-click carries',
  save: 'burst / pick-off',
  sustain: 'attrition / poke',
};

export const MECHANIC_LABEL: Record<Mechanic, string> = {
  targeted_block: 'Targeted block', dispel: 'Dispel', break: 'Break',
  true_strike: 'True strike', magic_barrier: 'Magic barrier', physical_barrier: 'Physical barrier',
  armor_aura: 'Armor aura', armor_reduction: 'Armor shred', heal_reduction: 'Anti-heal',
  magic_immunity: 'Magic immunity', detection: 'Detection', illusion_clear: 'Illusion clear',
  hard_control: 'Hard control', silence: 'Silence', interrupt: 'Interrupt', disarm: 'Disarm',
  save: 'Save', sustain: 'Sustain',
};

// Human phrasing for "this item answers that hero", e.g. "pierces Phantom Assassin's evasion".
export function mechanicReason(mechanic: Mechanic, heroName: string): string {
  switch (mechanic) {
    case 'break':           return `breaks ${heroName}'s passive`;
    case 'true_strike':     return `pierces ${heroName}'s evasion`;
    case 'heal_reduction':  return `cuts ${heroName}'s healing/regen`;
    case 'detection':       return `reveals ${heroName}'s invisibility`;
    case 'illusion_clear':  return `clears ${heroName}'s illusions/summons`;
    case 'magic_barrier':   return `absorbs ${heroName}'s magic burst`;
    case 'magic_immunity':  return `ignores ${heroName}'s magic/disables`;
    case 'physical_barrier':return `blocks ${heroName}'s physical damage`;
    case 'armor_aura':      return `armor vs ${heroName}'s right-click`;
    case 'armor_reduction': return `shreds armor to out-trade ${heroName}`;
    case 'disarm':          return `disarms ${heroName}`;
    case 'targeted_block':  return `blocks ${heroName}'s targeted spell`;
    case 'hard_control':    return `locks down ${heroName}`;
    case 'silence':         return `silences ${heroName}`;
    case 'interrupt':       return `interrupts ${heroName}'s channel/charge`;
    case 'dispel':          return `dispels ${heroName}`;
    case 'save':            return `saves allies from ${heroName}`;
    case 'sustain':         return `out-sustains ${heroName}`;
  }
}
