import type { Hero, MetaRole } from '../types';
import type { OpenDotaHero } from '../services/api';
import { heroImageUrl, heroShortName } from '../services/api';
import { HERO_METADATA, META_ROLE_MAP, FLEX_ROLES_MAP, mapAttr, mapRoles, deriveUtilityTags } from './heroMetadata';

// Complexity heuristic based on roles
function deriveComplexity(roles: string[]): 1 | 2 | 3 {
  const complex = ['Invoker', 'Meepo', 'Earth Spirit', 'Arc Warden', 'Morphling', 'Lone Druid', 'Chen'];
  const medium = ['Disabler', 'Initiator', 'Escape', 'Nuker'];
  if (complex.some(c => roles.includes(c))) return 3;
  if (roles.filter(r => medium.includes(r)).length >= 2) return 2;
  return 1;
}

function deriveMetaRole(shortName: string, preferredRoles: import('../types').Role[]): MetaRole {
  if (META_ROLE_MAP[shortName]) return META_ROLE_MAP[shortName];
  // Fallback heuristic from preferred roles
  if (preferredRoles.includes('carry')) return 'pos1';
  if (preferredRoles.includes('mid')) return 'pos2';
  if (preferredRoles.includes('offlane')) return 'pos3';
  if (preferredRoles.includes('support')) return 'pos4';
  if (preferredRoles.includes('hard_support')) return 'pos5';
  return 'flex';
}

export function buildHeroFromOpenDota(odHero: OpenDotaHero): Hero {
  const shortName = heroShortName(odHero.name);
  const local = HERO_METADATA[shortName] ?? {};
  const odRoles = odHero.roles ?? [];
  const roles = local.preferredRoles?.length
    ? (local.preferredRoles as import('../types').Role[])
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
    imageUrl: heroImageUrl(odHero.name),
  };
}

// Sort heroes: by attribute, then by name
export function sortHeroes(heroes: Hero[]): Hero[] {
  const attrOrder = { strength: 0, agility: 1, intelligence: 2, universal: 3 };
  return [...heroes].sort((a, b) => {
    const ao = attrOrder[a.attribute] ?? 4;
    const bo = attrOrder[b.attribute] ?? 4;
    if (ao !== bo) return ao - bo;
    return a.displayName.localeCompare(b.displayName);
  });
}
