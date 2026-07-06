// Phase-2 hero traits for the capability profile: primary DAMAGE TYPE, SPACE role
// (creates vs needs farm), and ROSHAN reliance. Hand-curated by short-name; the
// damage lookup falls back to the hero's attribute so there are never gaps.
import type { Hero, DamageType, DamageProfile, SpaceBalance, TeamTraits } from './types';

// ── Damage type (coarse, primary) ─────────────────────────────────────────────
const PHYSICAL = new Set([
  'antimage', 'alchemist', 'arc_warden', 'bloodseeker', 'broodmother', 'chaos_knight',
  'clinkz', 'drow_ranger', 'faceless_void', 'juggernaut', 'kez', 'life_stealer',
  'lone_druid', 'luna', 'lycan', 'marci', 'medusa', 'monkey_king', 'morphling',
  'naga_siren', 'night_stalker', 'phantom_assassin', 'phantom_lancer', 'riki',
  'skeleton_king', 'slardar', 'slark', 'sniper', 'spectre', 'sven', 'templar_assassin',
  'terrorblade', 'troll_warlord', 'ursa', 'weaver', 'razor', 'spirit_breaker',
  'bounty_hunter', 'brewmaster', 'legion_commander', 'abaddon', 'tusk',
]);
const MAGICAL = new Set([
  'bane', 'batrider', 'crystal_maiden', 'dark_seer', 'dark_willow', 'dazzle',
  'death_prophet', 'disruptor', 'earth_spirit', 'earthshaker', 'enigma', 'grimstroke',
  'invoker', 'jakiro', 'keeper_of_the_light', 'leshrac', 'lich', 'lina', 'lion',
  'necrolyte', 'obsidian_destroyer', 'omniknight', 'oracle', 'phoenix', 'puck', 'pugna',
  'queenofpain', 'rubick', 'sand_king', 'shadow_demon', 'shadow_shaman', 'silencer',
  'skywrath_mage', 'storm_spirit', 'techies', 'tinker', 'treant', 'undying', 'venomancer',
  'void_spirit', 'warlock', 'winter_wyvern', 'witch_doctor', 'zuus', 'chen', 'nyx_assassin', 'wisp',
]);
const PURE = new Set(['ancient_apparition']);
const MIXED = new Set([
  'axe', 'beastmaster', 'bristleback', 'centaur', 'dawnbreaker', 'doom_bringer',
  'dragon_knight', 'elder_titan', 'ember_spirit', 'enchantress', 'gyrocopter', 'hoodwink',
  'huskar', 'kunkka', 'magnataur', 'mars', 'meepo', 'mirana', 'muerta', 'nevermore',
  'pangolier', 'primal_beast', 'pudge', 'snapfire', 'tidehunter', 'tiny', 'vengefulspirit',
  'viper', 'visage', 'windrunner', 'ringmaster', 'furion',
]);

export function damageTypeOf(hero: Hero): DamageType {
  const n = hero.name;
  if (PHYSICAL.has(n)) return 'physical';
  if (MAGICAL.has(n)) return 'magical';
  if (PURE.has(n)) return 'pure';
  if (MIXED.has(n)) return 'mixed';
  // Fallback by attribute for any hero not explicitly tagged.
  if (hero.attribute === 'agility') return 'physical';
  if (hero.attribute === 'intelligence') return 'magical';
  return 'mixed';
}

// ── Space economy ─────────────────────────────────────────────────────────────
// Users need farm + protection to scale; providers create pressure/space for them.
const SPACE_USERS = new Set([
  'medusa', 'spectre', 'antimage', 'terrorblade', 'phantom_lancer', 'naga_siren',
  'faceless_void', 'morphling', 'alchemist', 'luna', 'gyrocopter', 'troll_warlord',
  'phantom_assassin', 'slark', 'weaver', 'drow_ranger', 'arc_warden', 'meepo',
  'lone_druid', 'chaos_knight', 'life_stealer', 'monkey_king', 'templar_assassin',
  'sven', 'juggernaut',
]);
const SPACE_PROVIDERS = new Set([
  'axe', 'tidehunter', 'mars', 'centaur', 'bristleback', 'magnataur', 'beastmaster',
  'dark_seer', 'batrider', 'sand_king', 'earthshaker', 'enigma', 'doom_bringer',
  'brewmaster', 'spirit_breaker', 'night_stalker', 'bounty_hunter', 'slardar', 'tusk',
  'pangolier', 'primal_beast', 'legion_commander', 'furion', 'clinkz', 'lycan',
  'broodmother', 'windrunner', 'dawnbreaker', 'kunkka', 'abaddon', 'nyx_assassin', 'earth_spirit',
]);

// ── Roshan-reliant (timing leans on an early Aegis) ──────────────────────────────
const ROSHAN_RELIANT = new Set([
  'ursa', 'huskar', 'meepo', 'troll_warlord', 'lycan', 'beastmaster', 'lone_druid',
  'chaos_knight', 'dragon_knight', 'life_stealer', 'slark', 'monkey_king',
]);

export function spaceRoleOf(hero: Hero): 'provider' | 'user' | 'neutral' {
  if (SPACE_PROVIDERS.has(hero.name)) return 'provider';
  if (SPACE_USERS.has(hero.name)) return 'user';
  return 'neutral';
}

const pct = (n: number, total: number) => Math.round((n / total) * 100);

export function computeTeamTraits(picks: Hero[]): TeamTraits {
  // ── damage mix (mixed splits half/half) ──
  let physical = 0, magical = 0, pure = 0;
  for (const h of picks) {
    const t = damageTypeOf(h);
    if (t === 'physical') physical += 1;
    else if (t === 'magical') magical += 1;
    else if (t === 'pure') pure += 1;
    else { physical += 0.5; magical += 0.5; }
  }
  const total = physical + magical + pure || 1;
  const pPct = pct(physical, total), mPct = pct(magical, total), purePct = pct(pure, total);
  let dominant: DamageProfile['dominant'] = 'balanced';
  let note: string;
  if (purePct >= 40) { dominant = 'pure'; note = 'Heavy pure damage — ignores armor and magic resist.'; }
  else if (pPct >= 65) { dominant = 'physical'; note = `${pPct}% physical — enemy can stack armor (Assault Cuirass, Solar Crest, Ghost Scepter).`; }
  else if (mPct >= 65) { dominant = 'magical'; note = `${mPct}% magical — enemy can stack magic resist (Pipe, Hood, BKB).`; }
  else { note = 'Balanced physical/magical damage — hard to itemize against.'; }
  const damage: DamageProfile = { physical, magical, pure, dominant, note };

  // ── space economy ──
  const userIds = picks.filter(h => SPACE_USERS.has(h.name)).map(h => h.id);
  const providerIds = picks.filter(h => SPACE_PROVIDERS.has(h.name)).map(h => h.id);
  let rating: SpaceBalance['rating'];
  let spaceNote: string;
  // Wording note: this is the ECONOMY view (counts and balance). The word
  // "greedy" and the who-fights-when narrative belong to Team Identity
  // (shared/teamIdentity.ts), which reads this rating — keep the two voices
  // distinct so the panels complement instead of repeating each other.
  if (userIds.length >= 3 && providerIds.length === 0) {
    rating = 'no_space';
    spaceNote = `${userIds.length} farm-hungry cores, zero space-creators — nobody makes room for them to scale.`;
  } else if (userIds.length >= 3) {
    rating = 'user_heavy';
    spaceNote = `${userIds.length} space-hungry cores leaning on ${providerIds.length} space-creator${providerIds.length === 1 ? '' : 's'} — the creators must stay active.`;
  } else if (providerIds.length >= 1 && userIds.length >= 1) {
    rating = 'balanced';
    spaceNote = `Space looks healthy — ${providerIds.length} creator(s) make room for ${userIds.length} farmer(s).`;
  } else if (userIds.length > 0) {
    rating = 'neutral';
    spaceNote = `${userIds.length} farm-dependent core${userIds.length === 1 ? '' : 's'}, no dedicated space-creator — tempo must come from elsewhere.`;
  } else {
    rating = 'neutral';
    spaceNote = 'Flexible / support-heavy — no strong space dynamic either way.';
  }
  const space: SpaceBalance = { providerIds, userIds, rating, note: spaceNote };

  // ── Roshan reliance ──
  const roshHeroes = picks.filter(h => ROSHAN_RELIANT.has(h.name));
  const roshanReliantIds = roshHeroes.map(h => h.id);
  const roshanNote = roshHeroes.length
    ? `${roshHeroes.map(h => h.displayName).join(', ')} spike with an early Aegis — prioritise and contest Roshan.`
    : '';

  return { damage, space, roshanReliantIds, roshanNote };
}
