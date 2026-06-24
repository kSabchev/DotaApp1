import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import { assignRole } from '../store/draftSlice';
import HeroPortrait from './HeroPortrait';
import TeamTags from './TeamTags';
import type { DraftSlot, MetaRole, Role } from '../types';

interface Props {
  team: 'radiant' | 'dire';
  slots: DraftSlot[];
  currentSlotIndex: number;
  slotIndices: number[];
}

const META_ROLE_LABELS: Record<MetaRole, string> = {
  pos1: 'Carry', pos2: 'Mid', pos3: 'Off', pos4: 'Sup', pos5: 'HSup', flex: 'Flex',
};

const META_ROLE_COLORS: Record<MetaRole, string> = {
  pos1: 'bg-yellow-900/60 text-yellow-300',
  pos2: 'bg-blue-900/60 text-blue-300',
  pos3: 'bg-orange-900/60 text-orange-300',
  pos4: 'bg-teal-900/60 text-teal-300',
  pos5: 'bg-purple-900/60 text-purple-300',
  flex: 'bg-gray-700/60 text-gray-300',
};

const ROLE_CYCLE: Role[] = ['carry', 'mid', 'offlane', 'support', 'hard_support'];
const ROLE_DISPLAY: Record<Role, string> = {
  carry: 'Carry', mid: 'Mid', offlane: 'Off', support: 'Sup', hard_support: 'HSup',
};
const ROLE_COLORS: Record<Role, string> = {
  carry: 'bg-yellow-900/60 text-yellow-300',
  mid: 'bg-blue-900/60 text-blue-300',
  offlane: 'bg-orange-900/60 text-orange-300',
  support: 'bg-teal-900/60 text-teal-300',
  hard_support: 'bg-purple-900/60 text-purple-300',
};

export default function TeamPanel({ team, slots, currentSlotIndex, slotIndices }: Props) {
  const allHeroes = useAppSelector(selectAllHeroes);
  const roleAssignments = useAppSelector(s => s.draft.roleAssignments);
  const dispatch = useAppDispatch();
  const pickSlots = slotIndices.map(i => ({ slot: slots[i], index: i }));
  const pickedHeroes = pickSlots
    .filter(({ slot }) => slot.heroId !== null)
    .map(({ slot }) => allHeroes.find(h => h.id === slot.heroId)!)
    .filter(Boolean);

  const isRadiant = team === 'radiant';
  const teamColor = isRadiant ? 'text-green-400' : 'text-red-400';
  const borderColor = isRadiant ? 'border-green-900' : 'border-red-900';
  const bgColor = isRadiant ? 'bg-green-950/20' : 'bg-red-950/20';

  function cycleRole(heroId: number, currentRole?: Role) {
    const idx = currentRole ? ROLE_CYCLE.indexOf(currentRole) : -1;
    const nextRole = ROLE_CYCLE[(idx + 1) % ROLE_CYCLE.length];
    dispatch(assignRole({ heroId, role: nextRole }));
  }

  return (
    <div className={['rounded-xl border p-3 flex flex-col gap-2', borderColor, bgColor].join(' ')}>
      <h3 className={['text-xs font-bold uppercase tracking-wider', teamColor].join(' ')}>
        {isRadiant ? 'Radiant' : 'Dire'}
      </h3>

      <div className="flex flex-col gap-1.5">
        {pickSlots.map(({ slot, index }) => {
          const hero = slot.heroId ? allHeroes.find(h => h.id === slot.heroId) : null;
          const isActive = index === currentSlotIndex;
          const isEmpty = slot.heroId === null;
          const assignedRole = hero ? roleAssignments[hero.id] as Role | undefined : undefined;
          const isFlexPick = hero && hero.flexRoles && hero.flexRoles.length > 1;

          return (
            <div
              key={index}
              className={[
                'flex items-center gap-2 rounded-lg p-1.5 transition-all',
                isActive && isEmpty ? 'bg-dota-accent/10 border border-dota-accent active-slot' : 'border border-transparent',
              ].join(' ')}
            >
              {hero ? (
                <>
                  <HeroPortrait hero={hero} size="sm" team={team} selected />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-gray-200 truncate">
                        {hero.displayName}
                      </span>
                      {isFlexPick && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-bold shrink-0">
                          FLEX
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Role badge — click to cycle */}
                      <button
                        onClick={() => cycleRole(hero.id, assignedRole)}
                        title="Click to change role assignment"
                        className={[
                          'text-[9px] px-1.5 py-0.5 rounded font-bold transition-opacity hover:opacity-80 shrink-0',
                          assignedRole
                            ? ROLE_COLORS[assignedRole]
                            : hero.metaRole
                            ? META_ROLE_COLORS[hero.metaRole]
                            : 'bg-gray-700/60 text-gray-400',
                        ].join(' ')}
                      >
                        {assignedRole
                          ? ROLE_DISPLAY[assignedRole]
                          : hero.metaRole
                          ? META_ROLE_LABELS[hero.metaRole]
                          : '?'}
                      </button>
                      {/* Flex alternatives */}
                      {hero.flexRoles && hero.flexRoles.length > 0 && (
                        <span className="text-[9px] text-gray-600 truncate">
                          {hero.flexRoles.slice(0, 2).map(r => ROLE_DISPLAY[r] || r).join('/')}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={[
                    'w-14 h-10 rounded border flex items-center justify-center',
                    isActive ? 'border-dota-accent/60' : 'border-dota-border/40',
                    'bg-dota-surface/50',
                  ].join(' ')}>
                    <span className="text-gray-600 text-lg">?</span>
                  </div>
                  <span className={['text-xs', isActive ? 'text-dota-accent' : 'text-gray-600'].join(' ')}>
                    {isActive ? 'Picking now...' : 'Empty'}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {pickedHeroes.length > 0 && (
        <div className="border-t border-dota-border/30 pt-2">
          <TeamTags picks={pickedHeroes} team={team} />
        </div>
      )}
    </div>
  );
}
