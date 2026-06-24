// Minimal Hero stubs for tests — the matcher/grades only read id, name (short),
// displayName, and a role (metaRole/preferredRoles), so we don't need the full pool.
import type { Hero, MetaRole, Role } from '../../shared/types';

const META_BY_ROLE: Record<Role, MetaRole> = {
  carry: 'pos1', mid: 'pos2', offlane: 'pos3', support: 'pos4', hard_support: 'pos5',
};

export function hero(name: string, id: number, role: Role = 'carry', displayName?: string): Hero {
  return {
    id,
    name,
    displayName: displayName ?? name,
    attribute: 'agility',
    attack: 'melee',
    complexity: 1,
    roles: [role],
    preferredRoles: [role],
    metaRole: META_BY_ROLE[role],
    strengths: [],
    weaknesses: [],
    powerSpikes: [],
    utilityTags: [],
    needs: [],
  };
}
