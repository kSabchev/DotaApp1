// Item ontology. Each item declares the MECHANICS it provides (shared/mechanics.ts)
// plus who builds it and when. The matcher uses `mechanics` to answer enemy heroes;
// `builtBy` decides which ally is advised to buy it. `icon` is the OpenDota item key
// for image display: cdn…/items/<icon>.png
import type { Role } from './types';
import type { Mechanic } from './mechanics';

export interface ItemDef {
  id: string;          // stable key (also the OpenDota icon key)
  name: string;
  category: 'carry' | 'support' | 'aura' | 'utility';
  mechanics: Mechanic[];
  builtBy: Role[];
  timing: 'early' | 'mid' | 'late';
  note?: string;
}

export const ITEMS: ItemDef[] = [
  // ── Targeted-spell / save ──
  { id: 'sphere', name: "Linken's Sphere", category: 'carry', mechanics: ['targeted_block', 'save'],
    builtBy: ['carry', 'mid'], timing: 'mid', note: 'Blocks one targeted spell every 13s.' },
  { id: 'cyclone', name: "Eul's Scepter", category: 'utility', mechanics: ['interrupt', 'dispel', 'save'],
    builtBy: ['mid', 'support', 'offlane'], timing: 'mid', note: 'Cyclone dispels & interrupts.' },
  { id: 'wind_waker', name: 'Wind Waker', category: 'utility', mechanics: ['interrupt', 'dispel', 'save'],
    builtBy: ['mid', 'support'], timing: 'late' },
  { id: 'lotus_orb', name: 'Lotus Orb', category: 'support', mechanics: ['dispel', 'targeted_block', 'save'],
    builtBy: ['support', 'offlane'], timing: 'mid', note: 'Echo Shell reflects targeted spells.' },
  { id: 'force_staff', name: 'Force Staff', category: 'support', mechanics: ['save'],
    builtBy: ['support', 'mid', 'offlane'], timing: 'early' },
  { id: 'glimmer_cape', name: 'Glimmer Cape', category: 'support', mechanics: ['magic_barrier', 'save'],
    builtBy: ['support', 'hard_support'], timing: 'early' },
  { id: 'aeon_disk', name: 'Aeon Disk', category: 'support', mechanics: ['save'],
    builtBy: ['support', 'carry'], timing: 'mid' },
  { id: 'ghost', name: 'Ghost Scepter', category: 'support', mechanics: ['physical_barrier', 'save'],
    builtBy: ['support', 'mid'], timing: 'early' },

  // ── Break ──
  { id: 'silver_edge', name: 'Silver Edge', category: 'carry', mechanics: ['break'],
    builtBy: ['carry', 'offlane', 'mid'], timing: 'mid', note: 'Breaks passives on hit.' },

  // ── True strike (anti-evasion) ──
  { id: 'monkey_king_bar', name: 'Monkey King Bar', category: 'carry', mechanics: ['true_strike'],
    builtBy: ['carry'], timing: 'mid' },
  { id: 'bloodthorn', name: 'Bloodthorn', category: 'carry', mechanics: ['true_strike', 'silence'],
    builtBy: ['carry', 'mid'], timing: 'late' },
  { id: 'witch_blade', name: 'Witch Blade', category: 'carry', mechanics: ['true_strike'],
    builtBy: ['carry', 'mid'], timing: 'mid' },

  // ── Magic mitigation ──
  { id: 'pipe', name: 'Pipe of Insight', category: 'aura', mechanics: ['magic_barrier', 'sustain'],
    builtBy: ['offlane', 'support'], timing: 'mid', note: 'Team barrier vs magic burst.' },
  { id: 'hood_of_defiance', name: 'Hood of Defiance', category: 'utility', mechanics: ['magic_barrier'],
    builtBy: ['offlane', 'mid'], timing: 'early' },

  // ── Physical mitigation ──
  { id: 'crimson_guard', name: 'Crimson Guard', category: 'aura', mechanics: ['physical_barrier'],
    builtBy: ['offlane', 'support'], timing: 'mid', note: 'Team block vs right-click & illusions.' },
  { id: 'shivas_guard', name: "Shiva's Guard", category: 'utility', mechanics: ['physical_barrier', 'armor_reduction', 'heal_reduction'],
    builtBy: ['mid', 'offlane'], timing: 'late' },

  // ── Armor auras / shred ──
  { id: 'assault', name: 'Assault Cuirass', category: 'aura', mechanics: ['armor_aura', 'armor_reduction'],
    builtBy: ['carry', 'offlane'], timing: 'late', note: '+armor for you, −armor for them.' },
  { id: 'solar_crest', name: 'Solar Crest', category: 'support', mechanics: ['armor_aura', 'armor_reduction', 'save'],
    builtBy: ['support', 'offlane'], timing: 'mid' },
  { id: 'vladmir', name: "Vladmir's Offering", category: 'aura', mechanics: ['armor_aura', 'sustain'],
    builtBy: ['offlane', 'carry'], timing: 'mid' },
  { id: 'desolator', name: 'Desolator', category: 'carry', mechanics: ['armor_reduction'],
    builtBy: ['carry'], timing: 'mid' },

  // ── Anti-heal ──
  { id: 'spirit_vessel', name: 'Spirit Vessel', category: 'support', mechanics: ['heal_reduction'],
    builtBy: ['support', 'offlane'], timing: 'early', note: 'Heavy anti-heal + %HP magic damage.' },
  { id: 'skadi', name: 'Eye of Skadi', category: 'carry', mechanics: ['heal_reduction'],
    builtBy: ['carry'], timing: 'late' },

  // ── Magic immunity ──
  { id: 'black_king_bar', name: 'Black King Bar', category: 'carry', mechanics: ['magic_immunity'],
    builtBy: ['carry', 'mid'], timing: 'mid', note: 'Ignores magic burst & most disables.' },

  // ── Detection (anti-invis) ──
  { id: 'gem', name: 'Gem of True Sight', category: 'utility', mechanics: ['detection'],
    builtBy: ['offlane', 'carry', 'support'], timing: 'mid' },
  { id: 'ward_sentry', name: 'Sentry Ward', category: 'support', mechanics: ['detection'],
    builtBy: ['support', 'hard_support'], timing: 'early' },
  { id: 'dust', name: 'Dust of Appearance', category: 'support', mechanics: ['detection'],
    builtBy: ['support', 'hard_support'], timing: 'early' },

  // ── Illusion / summon clear ──
  { id: 'mjollnir', name: 'Mjollnir', category: 'carry', mechanics: ['illusion_clear'],
    builtBy: ['carry'], timing: 'late' },
  { id: 'bfury', name: 'Battle Fury', category: 'carry', mechanics: ['illusion_clear'],
    builtBy: ['carry'], timing: 'mid' },
  { id: 'maelstrom', name: 'Maelstrom', category: 'carry', mechanics: ['illusion_clear'],
    builtBy: ['carry', 'mid'], timing: 'mid' },
  { id: 'radiance', name: 'Radiance', category: 'carry', mechanics: ['illusion_clear'],
    builtBy: ['carry', 'mid'], timing: 'mid', note: 'AoE burn clears illusions; blind weakens right-click.' },

  // ── Hard control ──
  { id: 'sheepstick', name: 'Scythe of Vyse', category: 'utility', mechanics: ['hard_control'],
    builtBy: ['mid', 'support'], timing: 'late', note: 'Hex — catches slippery cores.' },
  { id: 'abyssal_blade', name: 'Abyssal Blade', category: 'carry', mechanics: ['hard_control'],
    builtBy: ['carry'], timing: 'late' },
  { id: 'gungir', name: 'Gleipnir', category: 'utility', mechanics: ['hard_control'],
    builtBy: ['mid', 'support'], timing: 'mid', note: 'AoE root.' },
  { id: 'rod_of_atos', name: 'Rod of Atos', category: 'utility', mechanics: ['hard_control'],
    builtBy: ['mid', 'support', 'offlane'], timing: 'mid' },

  // ── Silence ──
  { id: 'orchid', name: 'Orchid Malevolence', category: 'carry', mechanics: ['silence'],
    builtBy: ['mid', 'carry'], timing: 'mid' },
  { id: 'nullifier', name: 'Nullifier', category: 'carry', mechanics: ['dispel', 'silence'],
    builtBy: ['carry'], timing: 'late', note: 'Mutes items & dispels.' },

  // ── Disarm ──
  { id: 'heavens_halberd', name: "Heaven's Halberd", category: 'utility', mechanics: ['disarm', 'physical_barrier'],
    builtBy: ['offlane', 'support', 'carry'], timing: 'mid', note: 'Disarms a right-click carry for 5s.' },

  // ── Team sustain ──
  { id: 'guardian_greaves', name: 'Guardian Greaves', category: 'aura', mechanics: ['sustain', 'dispel'],
    builtBy: ['support', 'offlane'], timing: 'mid' },
  { id: 'mekansm', name: 'Mekansm', category: 'aura', mechanics: ['sustain'],
    builtBy: ['support', 'offlane'], timing: 'early' },
];

export const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));

// Items that provide a given mechanic, cheapest/earliest first-ish (kept stable here).
export function itemsProviding(mechanic: Mechanic): ItemDef[] {
  return ITEMS.filter(i => i.mechanics.includes(mechanic));
}

export function itemIconUrl(id: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${id}.png`;
}
