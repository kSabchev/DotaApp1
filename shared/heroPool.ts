// Framework-free hero-pool builder. Merges the OpenDota hero list (which
// supplies id ↔ name and base attributes) with the rich HERO_METADATA
// (utilityTags, roles, metaRole) that the scoring engine relies on.
//
// This is the same merge the frontend's heroBuilder performs, minus the
// browser-only image URL — so the backend backtest scores matches with the
// exact same hero attributes the live app uses.
import type { Hero, MetaRole, Role } from './types';
import {
  HERO_METADATA, META_ROLE_MAP, FLEX_ROLES_MAP, mapAttr, mapRoles, deriveUtilityTags,
} from './heroMetadata';

export interface OpenDotaHeroRaw {
  id: number;
  name: string;            // e.g. "npc_dota_hero_antimage"
  localized_name: string;  // e.g. "Anti-Mage"
  primary_attr: string;    // "str" | "agi" | "int" | "all"
  attack_type: string;     // "Melee" | "Ranged"
  roles: string[];
}

export function heroShortName(name: string): string {
  return name.replace('npc_dota_hero_', '');
}

function deriveComplexity(roles: string[]): 1 | 2 | 3 {
  const complex = ['Invoker', 'Meepo', 'Earth Spirit', 'Arc Warden', 'Morphling', 'Lone Druid', 'Chen'];
  const medium = ['Disabler', 'Initiator', 'Escape', 'Nuker'];
  if (complex.some(c => roles.includes(c))) return 3;
  if (roles.filter(r => medium.includes(r)).length >= 2) return 2;
  return 1;
}

function deriveMetaRole(shortName: string, preferredRoles: Role[]): MetaRole {
  if (META_ROLE_MAP[shortName]) return META_ROLE_MAP[shortName];
  if (preferredRoles.includes('carry')) return 'pos1';
  if (preferredRoles.includes('mid')) return 'pos2';
  if (preferredRoles.includes('offlane')) return 'pos3';
  if (preferredRoles.includes('support')) return 'pos4';
  if (preferredRoles.includes('hard_support')) return 'pos5';
  return 'flex';
}

export function buildHeroFromOpenDota(odHero: OpenDotaHeroRaw): Hero {
  const shortName = heroShortName(odHero.name);
  const local = HERO_METADATA[shortName] ?? {};
  const odRoles = odHero.roles ?? [];
  const roles = local.preferredRoles?.length
    ? (local.preferredRoles as Role[])
    : mapRoles(odRoles);
  const preferredRoles = local.preferredRoles ?? roles;
  const metaRole = deriveMetaRole(shortName, preferredRoles);
  const flexRoles = FLEX_ROLES_MAP[shortName] ?? [];

  return {
    id: odHero.id,
    name: shortName,
    displayName: odHero.localized_name,
    attribute: mapAttr(odHero.primary_attr),
    attack: odHero.attack_type === 'Melee' ? 'melee' : 'ranged',
    complexity: deriveComplexity(odRoles),
    roles,
    preferredRoles,
    flexRoles,
    metaRole,
    strengths: local.strengths ?? odRoles.slice(0, 3).map(r => `${r} role`),
    weaknesses: local.weaknesses ?? ['Requires specific items to be effective'],
    powerSpikes: local.powerSpikes ?? ['Level 6', 'Core item completion'],
    utilityTags: local.utilityTags ?? deriveUtilityTags(odRoles),
    needs: local.needs ?? ['teamwork'],
  };
}

export function buildHeroPool(odHeroes: OpenDotaHeroRaw[]): Hero[] {
  return odHeroes.map(buildHeroFromOpenDota);
}
