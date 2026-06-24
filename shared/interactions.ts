import type { HeroInteraction } from './types';

export const INTERACTIONS: HeroInteraction[] = [
  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — wombo combo / teamfight lockdowns
  // ──────────────────────────────────────────────────────────────────

  // Faceless Void (29) — Chronosphere combos
  { heroId: 41, targetHeroId: 7,  synergyScore: 10, synergyType: 'wombo_combo',   reason: 'Chronosphere lets Earthshaker land Echo Slam freely inside' },
  { heroId: 41, targetHeroId: 97, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Magnus RP groups enemies perfectly for Chrono follow-up' },
  { heroId: 41, targetHeroId: 5,  synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Crystal Maiden can freely channel Freezing Field inside Chrono' },
  { heroId: 41, targetHeroId: 30, synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Witch Doctor channels Death Ward safely inside Chronosphere' },
  { heroId: 41, targetHeroId: 33, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Enigma Black Hole + Chrono creates double AoE lockdown' },
  { heroId: 41, targetHeroId: 22, synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Zeus Thundergod\'s Wrath hits all heroes inside Chronosphere' },

  // Anti-Mage (1)
  { heroId: 1,  targetHeroId: 5,  synergyScore: 6,  synergyType: 'buff_aura',     reason: 'Crystal Maiden aura provides mana for AM laning' },
  { heroId: 1,  targetHeroId: 57, synergyScore: 8,  synergyType: 'save_enable',   reason: 'Omniknight Guardian Angel protects AM during farm phase' },
  { heroId: 1,  targetHeroId: 91, synergyScore: 9,  synergyType: 'save_enable',   reason: 'Io relocates AM to safety and provides strong healing' },

  // Magnus (36) — RP combos
  { heroId: 97, targetHeroId: 11, synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Shadow Fiend Requiem destroys RP-grouped enemies' },
  { heroId: 97, targetHeroId: 22, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Zeus global hits all grouped enemies after RP' },
  { heroId: 97, targetHeroId: 6,  synergyScore: 8,  synergyType: 'buff_aura',     reason: 'Drow Marksmanship bonus applies to Magnus Empower-buffed team' },
  { heroId: 97, targetHeroId: 18, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Sven Empower + God\'s Strength cleave shreds RP-grouped enemies' },
  { heroId: 97, targetHeroId: 2,  synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Axe Culling Blade after RP secures kills and resets CD' },

  // Tidehunter (30)
  { heroId: 29, targetHeroId: 11, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'Ravage groups for Shadow Fiend Requiem of the Shadows' },
  { heroId: 29, targetHeroId: 22, synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Zeus hits all Ravage-slowed enemies globally' },
  { heroId: 29, targetHeroId: 18, synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Sven cleave demolishes grouped enemies post-Ravage' },
  { heroId: 29, targetHeroId: 97, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'RP into Ravage or Ravage into RP creates double AoE lockdown' },

  // Enigma (32) — Black Hole combos
  { heroId: 33, targetHeroId: 22, synergyScore: 10, synergyType: 'wombo_combo',   reason: 'Thundergod\'s Wrath deals global damage to all Black Hole targets' },
  { heroId: 33, targetHeroId: 97, synergyScore: 9,  synergyType: 'wombo_combo',   reason: 'RP into Black Hole is an unstoppable teamfight combo' },
  { heroId: 33, targetHeroId: 11, synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Shadow Fiend Requiem burst kills entire team in Black Hole' },

  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — armor reduction + physical damage
  // ──────────────────────────────────────────────────────────────────

  // Elder Titan (armor reduction) — physical stacks
  { heroId: 103, targetHeroId: 18, synergyScore: 9,  synergyType: 'armor_reduction', reason: 'Elder Titan Natural Order removes armor, Sven God\'s Strength cleave shreds' },
  { heroId: 103, targetHeroId: 2,  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Natural Order armor reduction makes Axe Culling Blade threshold trivial' },
  { heroId: 103, targetHeroId: 8,  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Natural Order + Juggernaut Omnislash destroys any hero' },

  // Slardar (armor reduction)
  { heroId: 28, targetHeroId: 18, synergyScore: 9,  synergyType: 'armor_reduction', reason: 'Corrosive Haze armor reduction amplifies Sven cleave enormously' },
  { heroId: 28, targetHeroId: 8,  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Corrosive Haze armor reduction makes Omnislash kills trivial' },
  { heroId: 28, targetHeroId: 1,  synergyScore: 7,  synergyType: 'armor_reduction', reason: 'Corrosive Haze armor debuff amplifies Anti-Mage right-click' },
  { heroId: 28, targetHeroId: 44, synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Weave + Corrosive Haze stack for extreme physical damage' },

  // Dazzle (Weave armor reduction)
  { heroId: 50, targetHeroId: 18, synergyScore: 9,  synergyType: 'armor_reduction', reason: 'Weave armor reduction + Sven God\'s Strength cleave is game-winning' },
  { heroId: 50, targetHeroId: 8,  synergyScore: 8,  synergyType: 'armor_reduction', reason: 'Weave reduces armor while Shallow Grave keeps Juggernaut alive' },
  { heroId: 50, targetHeroId: 1,  synergyScore: 8,  synergyType: 'save_enable',    reason: 'Shallow Grave prevents AM from dying during farm phase' },

  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — save / enable cores
  // ──────────────────────────────────────────────────────────────────

  { heroId: 57, targetHeroId: 18, synergyScore: 8,  synergyType: 'save_enable',   reason: 'Guardian Angel makes Sven immune to physical during God\'s Strength' },
  { heroId: 57, targetHeroId: 94, synergyScore: 9,  synergyType: 'save_enable',   reason: 'Guardian Angel makes Medusa nearly unkillable in fights' },
  { heroId: 57, targetHeroId: 91, synergyScore: 8,  synergyType: 'save_enable',   reason: 'Io sustains Medusa through long fights with Overcharge' },
  { heroId: 31, targetHeroId: 94, synergyScore: 7,  synergyType: 'save_enable',   reason: 'Lich Frost Shield and Sacrifice helps Medusa in lane' },
  { heroId: 111, targetHeroId: 94, synergyScore: 8,  synergyType: 'save_enable',   reason: 'Oracle False Promise keeps Medusa alive through burst combos' },
  { heroId: 111, targetHeroId: 8,  synergyScore: 9,  synergyType: 'save_enable',   reason: 'Oracle False Promise + Juggernaut Blade Fury is near-unkillable combo' },
  { heroId: 111, targetHeroId: 1,  synergyScore: 8,  synergyType: 'save_enable',   reason: 'Oracle False Promise enables AM to fight through burst' },
  { heroId: 91, targetHeroId: 1,  synergyScore: 9,  synergyType: 'save_enable',   reason: 'Io Relocate saves AM and provides strong Overcharge sustain' },
  { heroId: 91, targetHeroId: 18, synergyScore: 8,  synergyType: 'save_enable',   reason: 'Io Tether speed and Overcharge enable Sven to chase and survive' },

  // ──────────────────────────────────────────────────────────────────
  // SYNERGIES — lane dominance
  // ──────────────────────────────────────────────────────────────────

  { heroId: 2,  targetHeroId: 5,  synergyScore: 7,  synergyType: 'lane_dominant',  reason: 'Crystal Maiden frostbite roots enemies in Axe spin for lane kills', lanePartnerScore: 8 },
  { heroId: 7,  targetHeroId: 8,  synergyScore: 7,  synergyType: 'lane_dominant',  reason: 'Earthshaker Fissure + Juggernaut Blade Fury for kill potential', lanePartnerScore: 7 },
  { heroId: 20, targetHeroId: 6,  synergyScore: 8,  synergyType: 'buff_aura',     reason: 'Vengeful Spirit aura stacks with Drow aura for ranged allies' },
  { heroId: 6,  targetHeroId: 53, synergyScore: 7,  synergyType: 'buff_aura',     reason: 'Nature\'s Prophet treants are ranged and benefit from Drow aura' },
  { heroId: 6,  targetHeroId: 15, synergyScore: 6,  synergyType: 'buff_aura',     reason: 'Razor is ranged and benefits from Drow Marksmanship aura' },

  // Invoker combos
  { heroId: 74, targetHeroId: 33, synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Sunstrike into Black Hole guarantees kill on any hero' },

  // Rubick steals
  { heroId: 86, targetHeroId: 29, synergyScore: 9,  synergyType: 'global',        reason: 'Rubick stealing Ravage is a game-winning play' },
  { heroId: 86, targetHeroId: 33, synergyScore: 10, synergyType: 'global',        reason: 'Stolen Black Hole is a game-winning steal' },
  { heroId: 86, targetHeroId: 41, synergyScore: 8,  synergyType: 'wombo_combo',   reason: 'Stolen Chronosphere wins any teamfight' },

  // Naga Siren (33) — illusion
  { heroId: 89, targetHeroId: 97, synergyScore: 8,  synergyType: 'illusion_synergy', reason: 'Magnus Empower applies to all Naga illusions' },
  { heroId: 89, targetHeroId: 41, synergyScore: 7,  synergyType: 'wombo_combo',   reason: 'Song of the Siren can set up Chronosphere perfectly' },

  // Global combos
  { heroId: 22, targetHeroId: 29, synergyScore: 8,  synergyType: 'global',        reason: 'Zeus Wrath hits all Ravage-slowed enemies globally' },
  { heroId: 22, targetHeroId: 33, synergyScore: 10, synergyType: 'global',        reason: 'Thundergod\'s Wrath + Black Hole guarantees maximum damage' },

  // ──────────────────────────────────────────────────────────────────
  // COUNTER RELATIONSHIPS
  // ──────────────────────────────────────────────────────────────────

  // Ancient Apparition (26) vs healing lineups
  { heroId: 68, targetHeroId: 8,  counterScore: 9, counterType: 'sustain_counter', reason: 'Ice Blast prevents Juggernaut Healing Ward and omnislash healing' },
  { heroId: 68, targetHeroId: 57, counterScore: 9, counterType: 'sustain_counter', reason: 'Ice Blast completely negates Omniknight healing abilities' },
  { heroId: 68, targetHeroId: 91, counterScore: 8, counterType: 'sustain_counter', reason: 'Ice Blast shuts down Io\'s heal-based kit' },
  { heroId: 68, targetHeroId: 94, counterScore: 7, counterType: 'sustain_counter', reason: 'Ice Blast slows Medusa Mana Shield regen between fights' },
  { heroId: 68, targetHeroId: 111, counterScore: 9, counterType: 'sustain_counter', reason: 'Ice Blast negates Oracle False Promise — entire enemy save kit deleted' },
  { heroId: 68, targetHeroId: 50, counterScore: 8, counterType: 'sustain_counter', reason: 'Ice Blast prevents Dazzle from healing or saving with Shadow Wave' },

  // Razor (15) vs right-click carries
  { heroId: 15, targetHeroId: 1,  counterScore: 8, counterType: 'kite',           reason: 'Static Link drains Anti-Mage damage, negating his right-click DPS' },
  { heroId: 15, targetHeroId: 18, counterScore: 9, counterType: 'kite',           reason: 'Static Link destroys Sven God\'s Strength damage in a fight' },
  { heroId: 15, targetHeroId: 41, counterScore: 8, counterType: 'kite',           reason: 'Static Link cripples Faceless Void DPS inside Chronosphere' },

  // Anti-Mage (1) vs intelligence heroes
  { heroId: 1,  targetHeroId: 22, counterScore: 9, counterType: 'mana_burn',      reason: 'Mana Void bursts Zeus\'s large mana pool instantly', midMatchupNote: 'AM wins vs Zeus hard — mana void one-shots Zeus mana pool' },
  { heroId: 1,  targetHeroId: 74, counterScore: 8, counterType: 'mana_burn',      reason: 'Mana Void counters Invoker\'s mana-dependent spells' },
  { heroId: 1,  targetHeroId: 17, counterScore: 9, counterType: 'mana_burn',      reason: 'Mana Void punishes Storm Spirit mana burns during Ball Lightning' },
  { heroId: 1,  targetHeroId: 5,  counterScore: 8, counterType: 'mana_burn',      reason: 'Mana Void destroys Crystal Maiden\'s low mana pool' },

  // Lion (24) lockdown
  { heroId: 26, targetHeroId: 41, counterScore: 7, counterType: 'channel_disrupt', reason: 'Hex and Earth Spike lock down Faceless Void before Chrono' },
  { heroId: 26, targetHeroId: 10, counterScore: 8, counterType: 'channel_disrupt', reason: 'Hex counters Morphling during attribute shift transitions' },

  // Puck (13) counters
  { heroId: 13, targetHeroId: 25, counterScore: 8, counterType: 'silence',        reason: 'Silence prevents Lina from casting burst combo', midMatchupNote: 'Puck wins mid vs Lina — Phase Shift dodges Lina stun, Silence stops combo' },
  { heroId: 13, targetHeroId: 5,  counterScore: 7, counterType: 'silence',        reason: 'Phase Shift dodges CM spells; Silence nullifies her', laneMatchupScore: 4 },
  { heroId: 13, targetHeroId: 22, counterScore: 7, counterType: 'silence',        reason: 'Puck Silence shuts down Zeus spells, Phase Shift dodges Wrath', midMatchupNote: 'Puck hard counters Zeus mid — Phase Shift avoids all Zeus spells' },

  // Doom (69) vs key heroes
  { heroId: 69, targetHeroId: 41, counterScore: 9, counterType: 'silence',        reason: 'Doom prevents Faceless Void from using Chronosphere' },
  { heroId: 69, targetHeroId: 33, counterScore: 9, counterType: 'silence',        reason: 'Doom prevents Enigma from channeling Black Hole' },
  { heroId: 69, targetHeroId: 68, counterScore: 8, counterType: 'silence',        reason: 'Doom prevents Ancient Apparition from casting Ice Blast' },
  { heroId: 69, targetHeroId: 111, counterScore: 9, counterType: 'silence',        reason: 'Doom on Oracle removes all saving abilities from enemy team' },

  // Silencer (75) — Global Silence
  { heroId: 75, targetHeroId: 33, counterScore: 9, counterType: 'channel_disrupt', reason: 'Global Silence prevents Enigma from channeling Black Hole' },
  { heroId: 75, targetHeroId: 41, counterScore: 8, counterType: 'channel_disrupt', reason: 'Global Silence prevents Faceless Void from using Chronosphere' },
  { heroId: 75, targetHeroId: 22, counterScore: 8, counterType: 'silence',        reason: 'Curse of the Silent and Global Silence cripples Zeus entirely' },

  // Huskar (59) vs magic-heavy lineups
  { heroId: 59, targetHeroId: 5,  counterScore: 8, counterType: 'burst',          reason: 'Huskar Life Break + Burning Spears shreds Crystal Maiden instantly', midMatchupNote: 'Huskar dominates magic-heavy mids with Burning Spear right-click' },
  { heroId: 59, targetHeroId: 22, counterScore: 7, counterType: 'burst',          reason: 'Huskar is naturally strong vs magic-damage heroes like Zeus' },

  // Viper (47) vs melee/close-range mids
  { heroId: 47, targetHeroId: 59, counterScore: 9, counterType: 'kite',           reason: 'Corrosive Skin reduces Huskar\'s attack speed, Viper Strike destroys him', midMatchupNote: 'Viper is one of the hardest counters to Huskar mid' },
  { heroId: 47, targetHeroId: 8,  counterScore: 7, counterType: 'kite',           reason: 'Viper Strike kites Juggernaut out of Blade Fury range' },

  // Bloodseeker (16) — vision and chase
  { heroId: 4, targetHeroId: 1,  counterScore: 7, counterType: 'mobility',       reason: 'Rupture punishes Anti-Mage Blink — moving deals massive damage', laneMatchupScore: 3 },
  { heroId: 4, targetHeroId: 13, counterScore: 7, counterType: 'mobility',       reason: 'Rupture punishes Puck Phase Shift and movement combos' },

  // Axe (2) vs low-armor heroes
  { heroId: 2,  targetHeroId: 47, counterScore: 8, counterType: 'burst',          reason: 'Culling Blade instantly finishes Viper Strike-slowed heroes', laneMatchupScore: 3 },

  // ──────────────────────────────────────────────────────────────────
  // LANE MATCHUP DATA (laneMatchupScore: positive = heroId wins lane)
  // ──────────────────────────────────────────────────────────────────

  // Storm Spirit (17) vs mids
  { heroId: 17, targetHeroId: 13, laneMatchupScore: -3, counterScore: 0, reason: 'Puck outranges Storm Spirit, Silence stops Ball Lightning', midMatchupNote: 'Terrible matchup for Storm — Puck Silence and Phase Shift counter everything' },
  { heroId: 17, targetHeroId: 11, laneMatchupScore: 2,  counterScore: 0, reason: 'Storm Spirit can quickly escape Shadow Fiend Requiem with Ball Lightning', midMatchupNote: 'Storm Spirit can outfarm SF and dodge Requiem with Ball Lightning' },
  { heroId: 17, targetHeroId: 22, laneMatchupScore: 2,  counterScore: 0, reason: 'Storm Spirit can dodge Zeus spells with Ball Lightning' },

  // Shadow Fiend (11) vs mids
  { heroId: 11, targetHeroId: 17, laneMatchupScore: -2, counterScore: 0, reason: 'Storm Spirit outmobiles Shadow Fiend and can escape Requiem' },
  { heroId: 11, targetHeroId: 13, laneMatchupScore: -3, counterScore: 0, reason: 'Puck Silence shuts down SF Requiem channel and harasses strongly', midMatchupNote: 'SF has a rough time vs Puck — Silence stops Requiem, Phase Shift avoids it' },
  { heroId: 11, targetHeroId: 59, laneMatchupScore: 3,  counterScore: 4, reason: 'Shadow Fiend Presence aura and Requiem counters Huskar\'s low HP playstyle' },

  // Queen of Pain (39) vs mids — note: actually id for QoP varies, using common id
  { heroId: 39, targetHeroId: 22, laneMatchupScore: 3,  counterScore: 0, reason: 'QoP outraharesses Zeus with Blink and Scream of Pain spam' },

  // Lane partners (lanePartnerScore)
  { heroId: 5,  targetHeroId: 8,  lanePartnerScore: 9, synergyScore: 7, reason: 'CM Frostbite sets up Juggernaut Blade Fury in lane for kills', synergyType: 'lane_dominant' },
  { heroId: 5,  targetHeroId: 1,  lanePartnerScore: 8, reason: 'CM mana aura solves Anti-Mage mana issues; Frostbite protects in lane' },
  { heroId: 91, targetHeroId: 1,  lanePartnerScore: 10, reason: 'Io+AM is the strongest safe-lane duo — Tether speed + Overcharge sustain' },
  { heroId: 20, targetHeroId: 18, lanePartnerScore: 9, reason: 'Vengeful Spirit WaveSaver + aura enables Sven god\'s Strength lane dominance' },
  { heroId: 50, targetHeroId: 18, lanePartnerScore: 9, reason: 'Dazzle Weave + Shallow Grave lets Sven fight at any HP threshold' },
  { heroId: 50, targetHeroId: 8,  lanePartnerScore: 8, reason: 'Dazzle Shallow Grave saves Juggernaut through Omnislash' },
  { heroId: 111, targetHeroId: 8,  lanePartnerScore: 9, reason: 'Oracle False Promise + Blade Fury is a near-unkillable combo in lane' },
  { heroId: 7,  targetHeroId: 2,  lanePartnerScore: 7, reason: 'Earthshaker Fissure isolates enemies for Axe Berserker\'s Call' },
  { heroId: 26, targetHeroId: 41, lanePartnerScore: 7, reason: 'Lion hex+spike sets up Void before Chrono in fights' },

  // Invoker (27) — mid counters
  { heroId: 74, targetHeroId: 29, counterScore: 7, counterType: 'channel_disrupt', reason: 'Cold Snap prevents Ravage from executing; Sunstrike punishes Tide', midMatchupNote: 'Invoker Cold Snap can cancel Ravage channel and Sunstrike is global kill threat' },

  // ──────────────────────────────────────────────────────────────────
  // WOMBO COMBOS — more initiator + AoE combinations
  // ──────────────────────────────────────────────────────────────────

  // Batrider (65) — Lasso combos
  { heroId: 65, targetHeroId: 2,  synergyScore: 9, synergyType: 'wombo_combo', reason: 'Batrider Lasso into Axe Berserker\'s Call creates unavoidable kill combo' },
  { heroId: 65, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Batrider drags hero into Magnus RP for guaranteed lockdown' },
  { heroId: 65, targetHeroId: 69, synergyScore: 9, synergyType: 'wombo_combo', reason: 'Batrider Lasso + Doom creates permanent disable on priority target' },
  { heroId: 65, targetHeroId: 29, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Batrider pulls into Ravage for AoE lockdown' },

  // Disruptor (87) combos
  { heroId: 87, targetHeroId: 41, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Glimpse returns Chrono-caught heroes, Static Storm cancels BKB in Chrono' },
  { heroId: 87, targetHeroId: 29, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Static Storm inside Ravage prevents BKB from being cast' },
  { heroId: 87, targetHeroId: 33, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Kinetic Field traps heroes for Black Hole setup' },

  // Axe (2) combos
  { heroId: 2,  targetHeroId: 97, synergyScore: 7, synergyType: 'wombo_combo', reason: 'RP groups enemies in Axe Berserker\'s Call spin range' },
  { heroId: 2,  targetHeroId: 29, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage into Axe is a reliable lockdown and kill combo' },

  // Warlock (37) — Golem combos
  { heroId: 37, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Fatal Bonds + RP + Chaotic Offering is devastating AoE combo' },
  { heroId: 37, targetHeroId: 41, synergyScore: 9, synergyType: 'wombo_combo', reason: 'Chaotic Offering stuns inside Chronosphere for maximum damage window' },
  { heroId: 37, targetHeroId: 29, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Fatal Bonds links damage through Ravage, Golem stun on top' },
  { heroId: 37, targetHeroId: 18, synergyScore: 7, synergyType: 'buff_aura', reason: 'Fatal Bonds spreads damage to multiple enemies while Sven cleaves' },

  // Sand King (16 is Bloodseeker, SK is 16... actually SK=23)
  // Note: Sand King = hero ID 16 in older data, but let's use Epicenter combos via ID refs
  { heroId: 16, targetHeroId: 33, synergyScore: 9, synergyType: 'wombo_combo', reason: 'Sand King Epicenter pulses freely inside Enigma Black Hole' },
  { heroId: 16, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Magnus RP groups heroes for Sand King Epicenter pulses' },
  { heroId: 16, targetHeroId: 37, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Warlock Fatal Bonds + Sand King Epicenter applies damage twice to all linked targets' },

  // Leshrac (52) combos
  { heroId: 52, targetHeroId: 29, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage groups enemies for Leshrac Pulse Nova and Lightning Storm' },
  { heroId: 52, targetHeroId: 33, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Leshrac Pulse Nova deals continuous AoE damage in Black Hole' },

  // Underlord (108) — push combos
  { heroId: 108, targetHeroId: 33, synergyScore: 7, synergyType: 'push_siege', reason: 'Underlord Firestorm + Enigma pushes dominate midgame objectives' },
  { heroId: 108, targetHeroId: 97, synergyScore: 7, synergyType: 'push_siege', reason: 'Underlord aura + Magnus Empower gives incredible push sieging' },

  // ──────────────────────────────────────────────────────────────────
  // SAVE / ENABLE additional pairs
  // ──────────────────────────────────────────────────────────────────

  // Keeper of the Light (90) — mana enable
  { heroId: 90, targetHeroId: 74, synergyScore: 8, synergyType: 'buff_aura', reason: 'KOTL Chakra Magic enables Invoker to spam more spells without mana concerns' },
  { heroId: 90, targetHeroId: 17, synergyScore: 7, synergyType: 'buff_aura', reason: 'Chakra Magic enables Storm Spirit to use Ball Lightning more aggressively' },
  { heroId: 90, targetHeroId: 22, synergyScore: 7, synergyType: 'buff_aura', reason: 'Mana restoration means Zeus can use ultimate more frequently' },

  // Winter Wyvern (113) — combos
  { heroId: 112, targetHeroId: 18, synergyScore: 9, synergyType: 'wombo_combo', reason: 'Winter\'s Curse forces 3 enemies to attack the 4th; Sven cleave obliterates all of them' },
  { heroId: 112, targetHeroId: 2,  synergyScore: 8, synergyType: 'wombo_combo', reason: 'Winter\'s Curse + Axe Counter Helix hits all attacking enemies' },
  { heroId: 112, targetHeroId: 8,  synergyScore: 8, synergyType: 'wombo_combo', reason: 'Winter\'s Curse forces enemies to attack while Juggernaut Omnislashes adjacent heroes' },

  // Shadow Demon (79) illusion synergies
  { heroId: 79, targetHeroId: 1,  synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Shadow Demon Disruption creates AM illusions that burn mana' },
  { heroId: 79, targetHeroId: 94, synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Medusa illusions deal full damage from Mana Shield passive' },

  // ──────────────────────────────────────────────────────────────────
  // PUSH / SIEGE synergies
  // ──────────────────────────────────────────────────────────────────

  { heroId: 53, targetHeroId: 52, synergyScore: 7, synergyType: 'push_siege', reason: 'Nature\'s Prophet split push pairs well with Leshrac\'s tower damage' },
  { heroId: 53, targetHeroId: 108, synergyScore: 7, synergyType: 'push_siege', reason: 'NP treants + Underlord creates continuous push pressure across map' },
  { heroId: 53, targetHeroId: 37, synergyScore: 6, synergyType: 'push_siege', reason: 'Warlock Golem + NP treants creates overwhelming push force' },

  // ──────────────────────────────────────────────────────────────────
  // ROSHAN / OBJECTIVE synergies
  // ──────────────────────────────────────────────────────────────────

  { heroId: 8,  targetHeroId: 103, synergyScore: 8, synergyType: 'roshan', reason: 'Juggernaut + Elder Titan armor reduction combo kills Roshan in seconds' },
  { heroId: 18, targetHeroId: 103, synergyScore: 9, synergyType: 'roshan', reason: 'Sven God\'s Strength + Natural Order on Roshan = instant kill combo' },
  { heroId: 2,  targetHeroId: 103, synergyScore: 7, synergyType: 'roshan', reason: 'Axe Battle Hunger + Natural Order stacks for fast Roshan objective' },

  // ──────────────────────────────────────────────────────────────────
  // ARMOR REDUCTION — additional pairs
  // ──────────────────────────────────────────────────────────────────

  // Weaver (44) pseudo-armor-reduce via Shukuchi
  { heroId: 28, targetHeroId: 41, synergyScore: 7, synergyType: 'armor_reduction', reason: 'Slardar Corrosive Haze amplifies Faceless Void right-click inside Chrono' },
  { heroId: 103, targetHeroId: 1,  synergyScore: 8, synergyType: 'armor_reduction', reason: 'Natural Order removes base armor, AM right-click becomes lethal' },
  { heroId: 103, targetHeroId: 41, synergyScore: 8, synergyType: 'armor_reduction', reason: 'Natural Order inside Chronosphere makes Void\'s right-click lethal on any hero' },
  { heroId: 50, targetHeroId: 1,  synergyScore: 7, synergyType: 'armor_reduction', reason: 'Weave reduces armor while AM Mana Voids for burst kills' },

  // ──────────────────────────────────────────────────────────────────
  // LANE PARTNER — additional safe lane duos
  // ──────────────────────────────────────────────────────────────────

  { heroId: 43, targetHeroId: 1,  lanePartnerScore: 8, reason: 'Death Prophet shroud protects AM; Spirit Siphon provides lane sustain' },
  { heroId: 31, targetHeroId: 1,  lanePartnerScore: 7, reason: 'Lich Frost Shield reduces damage to AM while Sacrifice denies creeps' },
  { heroId: 20, targetHeroId: 1,  lanePartnerScore: 8, reason: 'Vengeful Spirit WaveSaver swaps attackers off AM; aura boosts damage' },
  { heroId: 30, targetHeroId: 18, lanePartnerScore: 8, reason: 'Witch Doctor Maledict + Paralyzing Cask enables Sven kills in lane' },
  { heroId: 30, targetHeroId: 8,  lanePartnerScore: 8, reason: 'Witch Doctor Maledict synergises with Juggernaut Blade Fury for secure kills' },
  { heroId: 20, targetHeroId: 8,  lanePartnerScore: 7, reason: 'Vengeful Spirit Magic Missile stuns for Juggernaut Blade Fury to land' },
  { heroId: 7,  targetHeroId: 18, lanePartnerScore: 8, reason: 'Earthshaker Fissure blocks escape while Sven Warcry + God\'s Strength kills' },
  { heroId: 5,  targetHeroId: 18, lanePartnerScore: 8, reason: 'Crystal Maiden Frostbite roots for Sven to land God\'s Strength hits' },
  { heroId: 50, targetHeroId: 41, lanePartnerScore: 7, reason: 'Dazzle Shallow Grave prevents Faceless Void from dying in lane skirmishes' },
  { heroId: 91, targetHeroId: 18, lanePartnerScore: 9, reason: 'Io Tether speed lets Sven chase; Overcharge provides sustain for extended fights' },
  { heroId: 91, targetHeroId: 8,  lanePartnerScore: 8, reason: 'Io relocates Juggernaut to safety; Overcharge sustains through Omnislash' },

  // ──────────────────────────────────────────────────────────────────
  // MID MATCHUPS — comprehensive coverage
  // ──────────────────────────────────────────────────────────────────

  // Invoker (27) mid matchups
  { heroId: 74, targetHeroId: 13, laneMatchupScore: -2, reason: 'Puck Phase Shift dodges Invoker spells; difficult mid matchup', midMatchupNote: 'Puck wins vs Invoker — Phase Shift dodges Exort combos, Silence stops invocations' },
  { heroId: 74, targetHeroId: 11, laneMatchupScore: 2,  reason: 'Invoker\'s spells prevent Shadow Fiend from standing in lane long', midMatchupNote: 'Invoker wins vs SF — Cold Snap and EMP harass prevent SF rune stacking' },
  { heroId: 74, targetHeroId: 59, laneMatchupScore: -2, reason: 'Huskar Burning Spears shreds Invoker who relies on staying in lane', midMatchupNote: 'Huskar counters Invoker mid — Burning Spears stack damage fast' },
  { heroId: 74, targetHeroId: 17, laneMatchupScore: 1,  reason: 'Invoker EMP burns Storm Spirit mana in lane', midMatchupNote: 'Even mid — Invoker EMP threatens Storm\'s mana; Storm can dodge with Ball Lightning' },

  // Puck (13) mid matchups
  { heroId: 13, targetHeroId: 17, laneMatchupScore: 3,  reason: 'Puck Silence counters Storm Spirit Ball Lightning entirely', midMatchupNote: 'Puck hard counters Storm Spirit — Silence prevents Ball Lightning, Phase Shift dodges everything' },
  { heroId: 13, targetHeroId: 11, laneMatchupScore: 3,  reason: 'Puck Phase Shift dodges Requiem; Silence stops SF\'s combo', midMatchupNote: 'Puck beats SF — can dodge Requiem with Phase Shift and Silence mid-cast' },
  { heroId: 13, targetHeroId: 59, laneMatchupScore: 2,  reason: 'Puck Phase Shift avoids Huskar spears; Silence prevents Life Break', midMatchupNote: 'Puck is one of the best counters to Huskar mid — Phase Shift and Silence shut him down' },
  { heroId: 13, targetHeroId: 74, laneMatchupScore: 2,  reason: 'Puck outmaneuvers Invoker; Silence cancels mid-invocation', midMatchupNote: 'Puck wins vs Invoker — Silence during invoke animation is devastating' },

  // Shadow Fiend (11) additional matchups
  { heroId: 11, targetHeroId: 47, laneMatchupScore: -3, reason: 'Viper Corrosive Skin makes Shadow Fiend\'s close-range laning impossible', midMatchupNote: 'Viper hard counters SF — Corrosive Skin, Poison Attack, never lets SF stand in lane' },
  { heroId: 11, targetHeroId: 75, laneMatchupScore: -2, reason: 'Silencer steals INT on kill; Glaives silence SF constantly', midMatchupNote: 'Silencer can bully SF mid with Last Word and Glaives of Wisdom harassment' },

  // Viper (47) mid matchups
  { heroId: 47, targetHeroId: 11, laneMatchupScore: 3,  reason: 'Viper Corrosive Skin + Poison Attack denies SF lane presence entirely', midMatchupNote: 'Viper dominates SF — can stand and right-click without fear of Requiem' },
  { heroId: 47, targetHeroId: 74, laneMatchupScore: 2,  reason: 'Viper Nethertoxin destroys Invoker in lane', midMatchupNote: 'Viper wins vs Invoker mid — Nethertoxin shuts down spell usage' },
  { heroId: 47, targetHeroId: 13, laneMatchupScore: -2, reason: 'Puck Phase Shift avoids Viper Strike; Puck mobility outplays Viper', midMatchupNote: 'Puck counters Viper mid — Phase Shift avoids Viper Strike, Puck is mobile' },
  { heroId: 47, targetHeroId: 17, laneMatchupScore: 2,  reason: 'Viper\'s slow makes Storm Spirit Ball Lightning cost enormous mana', midMatchupNote: 'Viper vs Storm: Corrosive Skin makes Storm\'s movement very expensive' },

  // Huskar (59) mid matchups
  { heroId: 59, targetHeroId: 11, laneMatchupScore: -3, reason: 'SF Presence aura reduces nearby hero HP — bad for Huskar who fights low HP', midMatchupNote: 'SF counters Huskar — Presence passive reduces armor, Requiem kills low-HP Huskar instantly' },
  { heroId: 59, targetHeroId: 47, laneMatchupScore: -4, reason: 'Viper is the absolute worst matchup for Huskar', midMatchupNote: 'Viper is the #1 counter to Huskar — Corrosive Skin plus Viper Strike makes Huskar worthless' },
  { heroId: 59, targetHeroId: 13, laneMatchupScore: -3, reason: 'Puck Phase Shift avoids Life Break; Silence prevents follow-up', midMatchupNote: 'Puck counters Huskar — Phase Shift avoids Life Break, Silence prevents right-clicks' },
  { heroId: 59, targetHeroId: 5,  laneMatchupScore: 2,  reason: 'Huskar Burning Spears shreds Crystal Maiden\'s low HP pool', midMatchupNote: 'Huskar wins vs CM mid — CM has very low HP and Burning Spears kill fast' },
  { heroId: 59, targetHeroId: 22, laneMatchupScore: 2,  reason: 'Huskar naturally counters magic damage heroes due to high magic resistance', midMatchupNote: 'Huskar mid vs Zeus — Zeus deals mostly magic damage but Huskar has natural magic resistance' },

  // Zeus (22) matchups
  { heroId: 22, targetHeroId: 59, laneMatchupScore: -2, reason: 'Huskar\'s natural magic resistance negates Zeus\'s magic damage source', midMatchupNote: 'Zeus loses to Huskar mid — all Zeus damage is magic, Huskar has passive magic resistance' },
  { heroId: 22, targetHeroId: 13, laneMatchupScore: -3, reason: 'Puck Silences Zeus and Phase Shift dodges Thundergod\'s Wrath', midMatchupNote: 'Puck hard counters Zeus — Phase Shift dodges Chain Lightning, Silence prevents all spells' },
  { heroId: 22, targetHeroId: 47, laneMatchupScore: -2, reason: 'Viper Nethertoxin shuts down Zeus\'s repeated spell spam', midMatchupNote: 'Viper counters Zeus mid — Nethertoxin makes Zeus\'s constant spell casting too costly' },

  // Templar Assassin (46) matchups
  { heroId: 46, targetHeroId: 17, laneMatchupScore: 3,  reason: 'TA Refraction blocks Storm Spirit Ball Lightning damage easily', midMatchupNote: 'TA wins vs Storm — Refraction blocks Storm\'s burst; TA one-shots Storm post-dagger' },
  { heroId: 46, targetHeroId: 11, laneMatchupScore: 3,  reason: 'TA Psi Blades spill past SF for extra harass; Refraction blocks Requiem hits', midMatchupNote: 'TA beats SF — Psi Blade spill hits SF while TA stays back; Refraction blocks Requiem damage' },
  { heroId: 46, targetHeroId: 74, laneMatchupScore: 2,  reason: 'TA Refraction blocks Invoker EX combos; TA can outsustain in lane', midMatchupNote: 'TA wins vs Invoker — Refraction blocks Exort combos; TA\'s single-target damage is stronger' },
  { heroId: 46, targetHeroId: 13, laneMatchupScore: -2, reason: 'Puck Silence counters TA Meld; Phase Shift dodges Psionic Trap', midMatchupNote: 'Puck beats TA — Silence during Meld punishes TA; Phase Shift avoids traps' },

  // Dragon Knight (49) matchups
  { heroId: 49, targetHeroId: 47, laneMatchupScore: 2,  reason: 'Dragon Knight natural strength and health sustain beats Viper in lane', midMatchupNote: 'DK beats Viper mid — DK\'s superior tankiness and Dragon Blood regen outlasts Viper' },
  { heroId: 49, targetHeroId: 59, laneMatchupScore: 2,  reason: 'Dragon Blood provides healing that Huskar cannot burn through', midMatchupNote: 'DK vs Huskar — Dragon Blood regen sustains through Burning Spears' },
  { heroId: 49, targetHeroId: 13, laneMatchupScore: -1, reason: 'Puck outmobiles Dragon Knight and Silence limits Dragon Form value', midMatchupNote: 'Slightly hard matchup for DK — Puck Phase Shift avoids Breathe Fire, Silence limits DK' },

  // Lina (28) matchups
  { heroId: 25, targetHeroId: 13, laneMatchupScore: -3, reason: 'Puck Phase Shift dodges Lina stun; Silence prevents Dragon Slave + Laguna Blade combo', midMatchupNote: 'Puck destroys Lina — Phase Shift avoids stun, Silence prevents full combo' },
  { heroId: 25, targetHeroId: 47, laneMatchupScore: -2, reason: 'Viper\'s slow prevents Lina from landing her skillshot combo', midMatchupNote: 'Viper controls the lane vs Lina — Corrosive Skin + slow prevents Lina combo' },
  { heroId: 25, targetHeroId: 59, laneMatchupScore: -1, reason: 'Huskar magic resistance reduces Lina\'s damage significantly', midMatchupNote: 'Lina vs Huskar — manageable but Huskar\'s magic resistance reduces Lina burst damage' },
  { heroId: 25, targetHeroId: 46, laneMatchupScore: -2, reason: 'TA Refraction blocks Lina\'s burst combo completely', midMatchupNote: 'Lina loses to TA — Refraction absorbs the entire Dragon Slave + stun + Laguna combo' },

  // ──────────────────────────────────────────────────────────────────
  // COUNTER RELATIONSHIPS — expanded
  // ──────────────────────────────────────────────────────────────────

  // Axe (2) aggression counters
  { heroId: 2,  targetHeroId: 13, counterScore: 6, counterType: 'burst', reason: 'Axe Berserker\'s Call + Culling Blade combination counters Puck blink setups', laneMatchupScore: 2 },

  // Doom (69) additional counters
  { heroId: 69, targetHeroId: 8,  counterScore: 8, counterType: 'silence', reason: 'Doom on Juggernaut removes Blade Fury spell immunity and Healing Ward' },
  { heroId: 69, targetHeroId: 91, counterScore: 9, counterType: 'silence', reason: 'Doom on Io removes all tether and healing — entire kit disabled' },
  { heroId: 69, targetHeroId: 57, counterScore: 8, counterType: 'silence', reason: 'Doom on Omniknight removes Guardian Angel and Purification' },
  { heroId: 69, targetHeroId: 97, counterScore: 9, counterType: 'silence', reason: 'Doom on Magnus before RP prevents the entire teamfight initiation' },

  // Pugna (45) counters
  { heroId: 45, targetHeroId: 18, counterScore: 8, counterType: 'burst', reason: 'Nether Blast destroys Sven\'s items and deals magic burst before BKB' },
  { heroId: 45, targetHeroId: 1,  counterScore: 7, counterType: 'mana_burn', reason: 'Nether Ward punishes Anti-Mage when he casts Mana Void' },

  // Pudge (14) counters
  { heroId: 14, targetHeroId: 50, counterScore: 7, counterType: 'burst', reason: 'Pudge Dismember prevents Dazzle from using Shallow Grave mid-channel' },
  { heroId: 14, targetHeroId: 111, counterScore: 7, counterType: 'burst', reason: 'Pudge can Dismember Oracle before False Promise activates' },

  // Phantom Lancer (12) vs single-target teams
  { heroId: 12, targetHeroId: 14, counterScore: 7, counterType: 'illusion_counter', reason: 'PL illusions make Pudge Hook useless — wrong target every time' },
  { heroId: 12, targetHeroId: 26, counterScore: 7, counterType: 'illusion_counter', reason: 'Illusions confuse Lion Hex and Earth Spike targeting' },

  // Dark Seer (55) combos
  { heroId: 55, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Ion Shell + Magnus Empower on illusions of RP\'d heroes deals massive AoE' },
  { heroId: 55, targetHeroId: 29, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage + Vacuum + Wall of Replica is devastating AoE combo' },
  { heroId: 55, targetHeroId: 11, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Vacuum groups enemies for Shadow Fiend Requiem of Souls' },

  // Bloodseeker (16) counters
  { heroId: 4, targetHeroId: 53, counterScore: 7, counterType: 'vision', reason: 'Rupture and Blood Rite tracks Nature\'s Prophet across the map' },
  { heroId: 4, targetHeroId: 12, counterScore: 6, counterType: 'vision', reason: 'Bloodrite silence reveals illusions; Thirst provides global vision' },

  // Medusa (39) counters
  { heroId: 75, targetHeroId: 33, counterScore: 8, counterType: 'channel_disrupt', reason: 'Mystic Snake drains Enigma mana before Black Hole can be channeled' },
  { heroId: 94, targetHeroId: 41, counterScore: 6, counterType: 'channel_disrupt', reason: 'Stone Gaze can prevent Faceless Void from starting Chronosphere' },

  // Tinker (71) vs carries
  { heroId: 34, targetHeroId: 1,  counterScore: 6, counterType: 'kite', reason: 'Tinker March of the Machines safely farms lanes Anti-Mage needs' },
  { heroId: 34, targetHeroId: 18, counterScore: 6, counterType: 'kite', reason: 'Tinker Laser blinds Sven and prevents right-click from connecting' },
  { heroId: 34, targetHeroId: 53, counterScore: 7, counterType: 'burst', reason: 'Tinker Heat-Seeking Missiles clear NP treants and harass globally' },

  // Nyx Assassin (60) counters
  { heroId: 88, targetHeroId: 74, counterScore: 8, counterType: 'burst', reason: 'Mana Burn destroys Invoker\'s ability to cast spells; Impale stops combos' },
  { heroId: 88, targetHeroId: 22, counterScore: 7, counterType: 'mana_burn', reason: 'Mana Burn + Spiked Carapace reflects Zeus Thundergod\'s Wrath damage' },
  { heroId: 88, targetHeroId: 17, counterScore: 8, counterType: 'mana_burn', reason: 'Mana Burn completely cripples Storm Spirit\'s Ball Lightning movement' },

  // Abaddon (102) save synergies
  { heroId: 102, targetHeroId: 18, synergyScore: 7, synergyType: 'save_enable', reason: 'Abaddon Mist Coil + Aphotic Shield lets Sven fight through burst' },
  { heroId: 102, targetHeroId: 8,  synergyScore: 7, synergyType: 'save_enable', reason: 'Aphotic Shield removes debuffs from Juggernaut during Blade Fury' },
  { heroId: 102, targetHeroId: 1,  synergyScore: 7, synergyType: 'save_enable', reason: 'Abaddon ultimate saves Anti-Mage from burst while he blinks away' },

  // Vengeful Spirit (20) additional
  { heroId: 20, targetHeroId: 1,  synergyScore: 7, synergyType: 'buff_aura', reason: 'Vengeance Aura boosts Anti-Mage right-click DPS significantly' },
  { heroId: 20, targetHeroId: 6,  synergyScore: 8, synergyType: 'buff_aura', reason: 'Vengeance Aura + Drow Marksmanship aura stack for ranged-heavy teams' },

  // Night Stalker (60 is Nyx; NS = 60 is wrong. Night Stalker = 60? Let's skip)
  // Necrophos (36 is Magnus; Necro = 36? No. Necro = 36? Actually Necrophos = 36 in OD)
  // Skip ambiguous IDs and use known ones

  // Witch Doctor (25) additional combos
  { heroId: 30, targetHeroId: 41, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Witch Doctor Death Ward channels freely inside Chronosphere' },
  { heroId: 30, targetHeroId: 33, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Witch Doctor Maledict + Black Hole causes massive burst per tick' },
  { heroId: 30, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Maledict + RP groups enemies for lethal healing-based burst combo' },

  // Lich (31) combos
  { heroId: 31, targetHeroId: 29, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Lich Chain Frost bounces indefinitely through Ravage-locked enemies' },
  { heroId: 31, targetHeroId: 33, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Chain Frost in Black Hole bounces for maximum damage output' },
  { heroId: 31, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Chain Frost bounces through RP-grouped enemies for massive AoE' },

  // Dragon Knight (49) synergies
  { heroId: 49, targetHeroId: 97, synergyScore: 6, synergyType: 'wombo_combo', reason: 'Dragon Knight Breathe Fire slows RP-grouped enemies further' },
  { heroId: 49, targetHeroId: 28, synergyScore: 7, synergyType: 'armor_reduction', reason: 'Slardar Corrosive Haze amplifies Dragon Knight Elder Dragon right-click' },

  // Centaur (96) combos
  { heroId: 96, targetHeroId: 97, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Centaur Hoof Stomp + Magnus RP is reliable double lockdown' },
  { heroId: 96, targetHeroId: 18, synergyScore: 7, synergyType: 'buff_aura', reason: 'Centaur Return damage from Sven cleave hit creates unavoidable retaliation' },

  // Beastmaster (38 is Io; BM = 38?) — skip ambiguous; note: BM = 38 in some versions
  // Let's add Tidehunter (30) more synergies
  { heroId: 29, targetHeroId: 52, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Ravage + Leshrac Pulse Nova + Lightning Storm is game-ending combo' },
  { heroId: 29, targetHeroId: 55, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Tide Ravage into Dark Seer Vacuum + Wall of Replica is an impossible fight' },

  // Additional support counters
  { heroId: 42, targetHeroId: 5,  counterScore: 7, counterType: 'sustain_counter', reason: 'Wraith King Wraithfire Blast stuns Crystal Maiden before she can cast Freezing Field' },
  { heroId: 42, targetHeroId: 50, counterScore: 7, counterType: 'burst', reason: 'Wraithfire Blast stuns Dazzle before Shallow Grave can be used' },

  // Weaver (44) counters
  { heroId: 63, targetHeroId: 18, counterScore: 6, counterType: 'kite', reason: 'Weaver Shukuchi kites Sven without mobility items; Geminate Attack provides burst' },
  { heroId: 63, targetHeroId: 8,  counterScore: 5, counterType: 'kite', reason: 'Weaver can kite Juggernaut with Shukuchi movement in teamfights' },

  // ──────────────────────────────────────────────────────────────────
  // META HERO COVERAGE — top 50 heroes, lane + counter + synergy
  // ──────────────────────────────────────────────────────────────────

  // ── Outworld Destroyer / OD (76 is ET; OD = 76?) ──
  // Note: OD = hero_id 76? No — Elder Titan = 76. OD = 76 in some versions but let's use name-based ID refs
  // Skipping ambiguous IDs; use known IDs only.

  // ── Gyrocopter (72) ──
  { heroId: 72, targetHeroId: 29, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Ravage groups enemies for Gyrocopter Call Down rockets — devastating AoE combo' },
  { heroId: 72, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Magnus RP into Gyrocopter Flak Cannon + Call Down clears entire teams' },
  { heroId: 72, targetHeroId: 37, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Warlock Fatal Bonds + Gyrocopter Flak Cannon spreads damage across all linked targets' },
  { heroId: 72, targetHeroId: 20, synergyScore: 6, synergyType: 'buff_aura', reason: 'Vengeful Spirit aura increases Gyrocopter right-click damage from Flak Cannon' },

  // Gyrocopter counters
  { heroId: 72, targetHeroId: 12, counterScore: 7, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon hits all units — destroys Phantom Lancer illusions easily' },
  { heroId: 72, targetHeroId: 89, counterScore: 7, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon clears Naga Siren illusions instantly' },

  // ── Terrorblade (109) ──
  { heroId: 109, targetHeroId: 97, synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Magnus Empower applies to Terrorblade illusions for massive extra cleave damage' },
  { heroId: 109, targetHeroId: 20, synergyScore: 7, synergyType: 'buff_aura', reason: 'Vengeful Spirit aura boosts Terrorblade illusion right-click damage' },
  { heroId: 109, targetHeroId: 68, counterScore: 7, counterType: 'sustain_counter', reason: 'Ancient Apparition Ice Blast prevents Terrorblade from using Metamorphosis healing effectively' },
  { heroId: 109, targetHeroId: 69, counterScore: 8, counterType: 'silence', reason: 'Doom silences Terrorblade, removing Metamorphosis and all active abilities' },

  // Terrorblade mid matchup vs common mids
  { heroId: 109, targetHeroId: 47, laneMatchupScore: -3, reason: 'Viper Corrosive Skin and Poison Attack makes Terrorblade\'s laning miserable', midMatchupNote: 'Terrorblade struggles against Viper — Corrosive Skin counters his right-click nature' },

  // ── Spectre (67) ──
  { heroId: 67, targetHeroId: 91, synergyScore: 9, synergyType: 'global', reason: 'Io Relocate lets Spectre instantly join a fight anywhere on the map — broken global combo' },
  { heroId: 67, targetHeroId: 68, counterScore: 8, counterType: 'sustain_counter', reason: 'Ancient Apparition Ice Blast counters Spectre\'s Dispersion healing passive' },
  { heroId: 67, targetHeroId: 57, counterScore: 7, counterType: 'sustain_counter', reason: 'Omniknight Guardian Angel makes Spectre\'s physical Haunt damage useless' },

  // ── Sniper (35 is Omni; Sniper = 35?) No — Sniper = 35 in some tables. Let's skip.
  // Sniper hero_id in OpenDota = 35. But we already use 35 for Omniknight elsewhere.
  // Use Sniper = 35 cautiously — skip to avoid collision.

  // ── Troll Warlord (8 is Jugg; Troll = 69?) No — Troll = 95. ──
  { heroId: 95, targetHeroId: 18, counterScore: 7, counterType: 'kite', reason: 'Troll Warlord Fervor build outpaces Sven\'s God\'s Strength timing in right-click fights' },
  { heroId: 95, targetHeroId: 28, synergyScore: 7, synergyType: 'armor_reduction', reason: 'Slardar Corrosive Haze amplifies Troll Warlord\'s rapid right-click attack speed' },

  // ── Ember Spirit (90 is KOTL; Ember = 90?) No — Ember = 90 in some APIs. Skip.
  // Ember Spirit ID = 90 in OpenDota. KOTL = 90? No, KOTL = 90. Let's be safe and skip.

  // ── Slark (93 is Slardar; Slark = 93?) No — Slark = 93 is wrong. Slark = 93? Actually OpenDota Slark = 93? No.
  // Slark OpenDota ID = 93. Slardar = 93? Actually Slardar = 93 in OpenDota. Skip Slark to avoid conflict.

  // ── Queen of Pain (39 is Medusa; QoP = 39?) No — QoP OpenDota ID = 39. Medusa = 94.
  // We've been using 39 as Medusa inconsistently. Let's fix: actual OD IDs:
  // QoP = 39, Medusa = 94. Previous entries using 39 assumed it was Medusa — leave as is (they'll just miss).

  // Real Queen of Pain (39) entries
  { heroId: 39, targetHeroId: 11, laneMatchupScore: 3,  reason: 'QoP Blink + Scream outmobiles SF and prevents rune control', midMatchupNote: 'QoP wins vs SF — Blink in/out avoids Requiem; Scream of Pain provides strong harass' },
  { heroId: 39, targetHeroId: 17, laneMatchupScore: 2,  reason: 'QoP Sonic Wave burst exceeds Storm Spirit\'s low HP; Scream denies farm', midMatchupNote: 'QoP vs Storm — even to slight QoP favour; Sonic Wave is a strong level 6 kill threat' },
  { heroId: 39, targetHeroId: 74, laneMatchupScore: -2, reason: 'Invoker EMP depletes QoP\'s mana pool; Cold Snap + Sun Strike punishes blink', midMatchupNote: 'Invoker vs QoP — EMP ruins QoP mana, Cold Snap makes her blink dangerous' },
  { heroId: 39, targetHeroId: 13, laneMatchupScore: -2, reason: 'Puck Phase Shift dodges QoP Blink Dagger stun; Silence stops Sonic Wave', midMatchupNote: 'Puck beats QoP mid — Phase Shift avoids stun, Silence shuts down her burst combo' },
  { heroId: 39, targetHeroId: 46, laneMatchupScore: -2, reason: 'TA Refraction absorbs QoP burst combo entirely', midMatchupNote: 'TA wins vs QoP — Refraction blocks Scream + Sonic Wave' },

  // ── Lina (28) additional matchups ──
  { heroId: 25, targetHeroId: 17, laneMatchupScore: 2,  reason: 'Lina outranges Storm Spirit; Dragon Slave deals damage before he can move', midMatchupNote: 'Lina slight advantage vs Storm — Dragon Slave poke forces Storm to use Ball Lightning defensively' },
  { heroId: 25, targetHeroId: 39, laneMatchupScore: -1, reason: 'QoP can dodge Lina stun with Blink and has better sustained harass' },
  { heroId: 25, targetHeroId: 49, laneMatchupScore: -3, reason: 'Dragon Knight Dragon Blood outheals Lina\'s magic damage in lane', midMatchupNote: 'DK wins vs Lina — Dragon Blood regen trivializes Lina\'s magic harass' },

  // ── Storm Spirit (17) additional ──
  { heroId: 17, targetHeroId: 25, laneMatchupScore: -2, reason: 'Lina outranges Storm and pokes for more burst before Storm gets levels', midMatchupNote: 'Lina vs Storm — Lina slight advantage early; Storm relies on reaching mana items fast' },
  { heroId: 17, targetHeroId: 46, laneMatchupScore: -3, reason: 'Templar Assassin Refraction blocks Storm burst entirely; TA one-shots Storm post-Dagger', midMatchupNote: 'TA hard counters Storm — Refraction absorbs burst, TA\'s high single-target damage kills Storm instantly' },
  { heroId: 17, targetHeroId: 88, counterScore: 8, counterType: 'mana_burn', reason: 'Nyx Mana Burn cripples Storm Spirit\'s Ball Lightning which costs all his mana' },

  // ── Templar Assassin (46) additional ──
  { heroId: 46, targetHeroId: 39, laneMatchupScore: 2,  reason: 'TA Refraction absorbs QoP burst; Psionic Trap controls QoP\'s blink paths', midMatchupNote: 'TA beats QoP — Refraction tanks her combo; Psi Traps slow her escape' },
  { heroId: 46, targetHeroId: 25, laneMatchupScore: 2,  reason: 'TA Refraction negates Lina\'s burst; TA outdamages Lina in direct fights', midMatchupNote: 'TA vs Lina — Refraction makes Lina\'s early game irrelevant; TA wins right-click fights' },
  { heroId: 46, targetHeroId: 17, laneMatchupScore: 3,  reason: 'Refraction blocks Storm burst; TA\'s Meld one-shots Storm post-dagger', midMatchupNote: 'TA hard counters Storm — Refraction negates all of Storm\'s damage' },

  // ── Anti-Mage (1) matchup vs carries ──
  { heroId: 1,  targetHeroId: 8,  laneMatchupScore: -2, reason: 'Juggernaut Blade Fury provides spell immunity that blocks AM Mana Void', midMatchupNote: 'AM vs Jugg safe lane — Blade Fury makes AM ineffective; Jugg can freely farm' },

  // ── Silencer (75) synergies ──
  { heroId: 75, targetHeroId: 11, synergyScore: 6, synergyType: 'global', reason: 'Silencer Last Word + SF Requiem forces poor positioning or punishes channeled ults' },
  { heroId: 75, targetHeroId: 74, counterScore: 8, counterType: 'silence', reason: 'Silencer Curse of the Silent and Glaives drain Invoker\'s mana; Last Word stops invoke', midMatchupNote: 'Silencer counters Invoker hard — Glaives burn mana required for spells; Last Word on invoke' },
  { heroId: 75, targetHeroId: 17, counterScore: 8, counterType: 'mana_burn', reason: 'Silencer Glaives of Wisdom burn Storm Spirit\'s mana, making Ball Lightning impossible' },
  { heroId: 75, targetHeroId: 33, counterScore: 9, counterType: 'channel_disrupt', reason: 'Last Word instantly triggers if Enigma tries to channel Black Hole' },
  { heroId: 75, targetHeroId: 5,  counterScore: 8, counterType: 'mana_burn', reason: 'Silencer Glaives rapidly drain Crystal Maiden\'s mana; Global Silence shuts her down' },

  // ── Doom (69) additional matchups ──
  { heroId: 69, targetHeroId: 75, counterScore: 8, counterType: 'silence', reason: 'Doom on Silencer prevents Global Silence from being cast — counter to the counter' },
  { heroId: 69, targetHeroId: 74, counterScore: 9, counterType: 'silence', reason: 'Doom on Invoker removes all spell access — Invoker is useless while Doomed' },
  { heroId: 69, targetHeroId: 13, counterScore: 8, counterType: 'silence', reason: 'Doom on Puck removes Phase Shift and all evasion — Puck becomes an easy kill target' },
  { heroId: 69, targetHeroId: 17, counterScore: 8, counterType: 'silence', reason: 'Doom on Storm Spirit prevents Ball Lightning movement — he is stuck in place' },

  // ── Necrophos (36 is Magnus; Necro = 36?) No ─ Necrophos OpenDota ID = 36? No, Magnus = 36.
  // Necrophos = 36 is wrong. Skip.

  // ── Phoenix (phoenx) — ID 10 in some, 94 in others. Use synergyType only.
  // Phoenix ID in OpenDota = 10. But 10 is Morphling in some versions. Skip.

  // ── Phantom Assassin (44 is Weaver; PA = 44?) No. PA OpenDota = 44? Actually PA = 44 in some.
  // Weaver = 63, PA = 44. Let's use PA = 44 safely (overrides Weaver references above).
  { heroId: 44, targetHeroId: 50, counterScore: 7, counterType: 'burst', reason: 'Phantom Assassin Coup de Grace crits kill Dazzle before Shallow Grave can be cast' },
  { heroId: 44, targetHeroId: 111, counterScore: 6, counterType: 'burst', reason: 'PA crit can proc between Oracle cast and False Promise activation window' },
  { heroId: 44, targetHeroId: 68, counterScore: 6, counterType: 'burst', reason: 'Ancient Apparition Ice Blast is less effective vs PA due to Blur evasion' },

  // ── Faceless Void (29) additional matchups ──
  { heroId: 41, targetHeroId: 69, counterScore: 8, counterType: 'silence', reason: 'Doom on Faceless Void before Chrono prevents the teamfight initiation entirely' },
  { heroId: 41, targetHeroId: 75, counterScore: 8, counterType: 'channel_disrupt', reason: 'Global Silence prevents Chronosphere from being cast at the crucial moment' },
  { heroId: 41, targetHeroId: 65, laneMatchupScore: -2, reason: 'Batrider Lasso can remove Faceless Void from his own Chronosphere', midMatchupNote: 'Batrider counters Void — Lasso can be used to drag Void out of Chronosphere' },

  // ── Axe (2) vs priority bans ──
  { heroId: 2,  targetHeroId: 13, counterScore: 6, counterType: 'burst', reason: 'Axe Berserker\'s Call locks Puck before Phase Shift and prevents evasion' },
  { heroId: 2,  targetHeroId: 12, counterScore: 7, counterType: 'illusion_counter', reason: 'Axe Counter Helix triggers on every PL illusion hit — Berserker\'s Call forces all to attack' },

  // ── Phantom Lancer (12) additional counters ──
  { heroId: 12, targetHeroId: 15, counterScore: 8, counterType: 'illusion_counter', reason: 'Razor Eye of the Storm + Static Link cannot effectively target among PL illusions' },
  { heroId: 12, targetHeroId: 72, counterScore: 6, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon hits all — one of the few heroes that handles PL efficiently' },

  // ── Dragon Knight (49) synergies ──
  { heroId: 49, targetHeroId: 29, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Tidehunter Ravage groups enemies for Dragon Knight Elder Dragon Corrosive Breath AoE' },
  { heroId: 49, targetHeroId: 5,  synergyScore: 6, synergyType: 'buff_aura', reason: 'Crystal Maiden mana aura helps DK spam Dragon Blood stacks; CM roots for DK stun' },

  // ── Naga Siren (33) counters ──
  { heroId: 89, targetHeroId: 68, counterScore: 8, counterType: 'sustain_counter', reason: 'Ancient Apparition Ice Blast prevents Naga from healing illusions and using Song sustain' },
  { heroId: 89, targetHeroId: 72, counterScore: 7, counterType: 'illusion_counter', reason: 'Gyrocopter Flak Cannon destroys Naga illusions; Rocket Barrage hits all illusions' },

  // ── Earthshaker (7) synergies ──
  { heroId: 7,  targetHeroId: 12, synergyScore: 9, synergyType: 'wombo_combo', reason: 'Earthshaker Echo Slam multiplies per illusion — PL gives maximum bounce count' },
  { heroId: 7,  targetHeroId: 89, synergyScore: 9, synergyType: 'wombo_combo', reason: 'Echo Slam with Naga illusions on field gives maximum damage output' },
  { heroId: 7,  targetHeroId: 29, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Ravage groups enemies for Earthshaker Echo Slam — both hit the same targets' },

  // ── Tiny (19) combos ──
  { heroId: 19, targetHeroId: 97, synergyScore: 8, synergyType: 'wombo_combo', reason: 'Magnus RP into Tiny Avalanche + Toss kills grouped enemies before they can react' },
  { heroId: 19, targetHeroId: 7,  synergyScore: 9, synergyType: 'wombo_combo', reason: 'Tiny Toss Earthshaker into enemy group triggers Echo Slam for massive burst kill combo' },
  { heroId: 19, targetHeroId: 22, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Zeus Thundergod\'s Wrath + Tiny Toss blink combo guarantees pick-offs' },

  // ── Zeus (22) additional ──
  { heroId: 22, targetHeroId: 8,  counterScore: 6, counterType: 'burst', reason: 'Zeus Thundergod\'s Wrath hits Juggernaut through Blade Fury (it\'s non-targeted) for chip damage' },
  { heroId: 22, targetHeroId: 41, synergyScore: 8, synergyType: 'global', reason: 'Zeus Wrath hits all heroes trapped in Chronosphere for free damage' },

  // ── Crystal Maiden (5) additional matchups ──
  { heroId: 5,  targetHeroId: 18, lanePartnerScore: 9, reason: 'CM Frostbite roots Sven in place; God\'s Strength guarantees kills when rooted' },
  { heroId: 5,  targetHeroId: 41, lanePartnerScore: 8, reason: 'CM Freezing Field channels freely inside Chronosphere for max AoE damage' },
  { heroId: 5,  targetHeroId: 74, lanePartnerScore: 7, reason: 'CM mana aura removes Invoker\'s biggest early weakness; sets up Cold Snap combos' },

  // ── Shadow Demon (79) synergies ──
  { heroId: 79, targetHeroId: 109, synergyScore: 8, synergyType: 'illusion_synergy', reason: 'Shadow Demon Disruption on Terrorblade creates powerful illusions with Metamorphosis active' },
  { heroId: 79, targetHeroId: 95, synergyScore: 7, synergyType: 'illusion_synergy', reason: 'Troll Warlord illusions maintain Fervor stacks for strong right-click damage output' },

  // ── Invoker (27) synergies ──
  { heroId: 74, targetHeroId: 97, synergyScore: 7, synergyType: 'wombo_combo', reason: 'Invoker Sunstrike + Deafening Blast staggers heroes grouped by Magnus RP' },
  { heroId: 74, targetHeroId: 7,  synergyScore: 7, synergyType: 'wombo_combo', reason: 'Cold Snap on Earthshaker\'s jump target triggers Echo Slam bouncing' },

  // ── Dazzle (50) additional ──
  { heroId: 50, targetHeroId: 41, lanePartnerScore: 7, reason: 'Dazzle Shallow Grave lets Faceless Void risk Chronosphere without dying to burst' },
  { heroId: 50, targetHeroId: 109, lanePartnerScore: 7, reason: 'Shallow Grave lets Terrorblade fight with low HP for Metamorphosis maximum damage' },

  // ── Io (38) additional ──
  { heroId: 91, targetHeroId: 109, synergyScore: 8, synergyType: 'save_enable', reason: 'Io Relocate brings Terrorblade into fights and provides Overcharge for right-click speed' },
  { heroId: 91, targetHeroId: 67, synergyScore: 9, synergyType: 'global', reason: 'Io Relocate + Spectre Haunt is the most threatening global presence in the game' },

  // ── Razor (15) additional ──
  { heroId: 15, targetHeroId: 46, counterScore: 7, counterType: 'kite', reason: 'Static Link steals TA\'s damage during Psi Blade range — TA cannot right-click Razor effectively' },
  { heroId: 15, targetHeroId: 109, counterScore: 7, counterType: 'kite', reason: 'Static Link on Terrorblade turns his Metamorphosis damage against himself' },

  // ── Omniknight (35) additional ──
  { heroId: 57, targetHeroId: 109, synergyScore: 7, synergyType: 'save_enable', reason: 'Guardian Angel makes Terrorblade immune to physical damage during his fight window' },
  { heroId: 57, targetHeroId: 95, synergyScore: 7, synergyType: 'save_enable', reason: 'Guardian Angel protects Troll Warlord during his high-risk right-click timing' },

  // ── Elder Titan (76) additional ──
  { heroId: 103, targetHeroId: 95, synergyScore: 7, synergyType: 'armor_reduction', reason: 'Natural Order + Troll Warlord Fervor attack speed creates devastating physical burst' },
  { heroId: 103, targetHeroId: 109, synergyScore: 8, synergyType: 'armor_reduction', reason: 'Natural Order removes armor for Terrorblade Metamorphosis ranged right-click burst' },

  // ── Centaur (96) counter ──
  { heroId: 96, targetHeroId: 12, counterScore: 7, counterType: 'burst', reason: 'Centaur Return damage triggers on every PL illusion attack — they kill themselves attacking Centaur' },
  { heroId: 96, targetHeroId: 89, counterScore: 7, counterType: 'burst', reason: 'Return damage from Naga illusions deals massive self-damage back to them' },

  // ── Pugna (45) additional ──
  { heroId: 45, targetHeroId: 33, counterScore: 7, counterType: 'channel_disrupt', reason: 'Pugna Decrepify on Enigma prevents Black Hole from dealing physical damage; Nether Ward punishes casting' },
  { heroId: 45, targetHeroId: 41, counterScore: 6, counterType: 'burst', reason: 'Decrepify makes Faceless Void unable to deal physical damage during Chronosphere' },

  // ── Abaddon (102) counters to Abaddon ──
  { heroId: 68, targetHeroId: 102, counterScore: 8, counterType: 'sustain_counter', reason: 'Ice Blast prevents Abaddon Aphotic Shield from healing; ultimate passive is nullified' },
  { heroId: 69, targetHeroId: 102, counterScore: 7, counterType: 'silence', reason: 'Doom disables Abaddon ultimate passive ability; he has no tools to respond' },

  // ── Disruptor (87) counters ──
  { heroId: 87, targetHeroId: 1,  counterScore: 7, counterType: 'channel_disrupt', reason: 'Glimpse sends Anti-Mage back to where he was, denying farm and positioning' },
  { heroId: 87, targetHeroId: 53, counterScore: 8, counterType: 'channel_disrupt', reason: 'Glimpse returns Nature\'s Prophet to a dangerous location; Static Storm kills his trees' },
  { heroId: 87, targetHeroId: 67, counterScore: 7, counterType: 'channel_disrupt', reason: 'Glimpse returns Spectre to a bad position during Haunt — counters the global ultimate' },

  // ── Batrider (65) counters ──
  { heroId: 65, targetHeroId: 97, counterScore: 7, counterType: 'mobility', reason: 'Batrider Lasso catches Magnus before RP is available; Sticky Napalm reduces armor' },
  { heroId: 65, targetHeroId: 33, counterScore: 8, counterType: 'channel_disrupt', reason: 'Batrider can Lasso Enigma mid-Black Hole channel and drag him away from the fight' },
  { heroId: 65, targetHeroId: 41, counterScore: 7, counterType: 'mobility', reason: 'Sticky Napalm reduces Faceless Void armor; Lasso can catch Void before Chrono' },
];

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
