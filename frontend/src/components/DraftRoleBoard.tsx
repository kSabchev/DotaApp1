import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import type { Hero, Role } from '../types';
import HeroPortrait from './HeroPortrait';
import RolePicker, { ROLES, ROLE_LABEL, META_TO_ROLE } from './RolePicker';

interface Props {
  radiantPickIds: number[];
  direPickIds: number[];
}

function effectiveRole(hero: Hero, assignments: Record<number, Role>): Role | undefined {
  return assignments[hero.id] ?? (hero.metaRole ? META_TO_ROLE[hero.metaRole] : undefined);
}

function TeamColumn({ team, heroes, assignments }: {
  team: 'radiant' | 'dire'; heroes: Hero[]; assignments: Record<number, Role>;
}) {
  const covered = new Set(heroes.map(h => effectiveRole(h, assignments)).filter(Boolean) as Role[]);
  const missing = ROLES.filter(r => !covered.has(r));
  const accent = team === 'radiant' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className={['text-[10px] font-bold uppercase tracking-wider', accent].join(' ')}>{team}</span>
        {missing.length > 0 && heroes.length > 0 && (
          <span className="text-[8px] text-gray-500">
            missing: {missing.map(r => ROLE_LABEL[r]).join(', ')}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {heroes.map(hero => {
          const isFlex = hero.flexRoles && hero.flexRoles.length > 1;
          return (
            <div key={hero.id} className="flex items-center gap-1.5">
              <HeroPortrait hero={hero} size="sm" team={team} selected />
              <span className="text-[10px] text-gray-300 truncate flex-1 min-w-0">{hero.displayName}</span>
              {isFlex && (
                <span className="text-[7px] px-1 rounded bg-indigo-900/60 text-indigo-300 font-bold shrink-0" title="Flexible pick">FLEX</span>
              )}
              <RolePicker
                heroId={hero.id}
                current={assignments[hero.id]}
                metaRole={hero.metaRole}
                flexRoles={hero.flexRoles}
              />
            </div>
          );
        })}
        {heroes.length === 0 && <span className="text-[10px] text-gray-600">No picks yet</span>}
      </div>
    </div>
  );
}

export default function DraftRoleBoard({ radiantPickIds, direPickIds }: Props) {
  const allHeroes = useAppSelector(selectAllHeroes);
  const assignments = useAppSelector(s => s.draft.roleAssignments) as Record<number, Role>;

  const radiant = radiantPickIds.map(id => allHeroes.find(h => h.id === id)).filter(Boolean) as Hero[];
  const dire = direPickIds.map(id => allHeroes.find(h => h.id === id)).filter(Boolean) as Hero[];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-dota-accent">Roles &amp; Flex Picks</h4>
        <span className="text-[8px] text-gray-600">click a role to assign · drives the analysis</span>
      </div>
      <div className="flex gap-4">
        <TeamColumn team="radiant" heroes={radiant} assignments={assignments} />
        <div className="w-px bg-dota-border/60 shrink-0" />
        <TeamColumn team="dire" heroes={dire} assignments={assignments} />
      </div>
    </div>
  );
}
