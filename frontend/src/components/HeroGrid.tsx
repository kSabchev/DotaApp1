import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectUsedHeroIds, selectAllHeroes } from '../store/selectors';
import { selectHero } from '../store/draftSlice';
import HeroPortrait from './HeroPortrait';
import type { Attribute, Role, PickTiming } from '../types';

export interface GridAnnotation { kind: 'recommend' | 'threat'; rank: number; timing?: PickTiming }

function portraitAnno(a: GridAnnotation) {
  if (a.kind === 'threat') return { ring: 'ring-2 ring-red-500/80', badge: '⊘', badgeCls: 'bg-red-700 text-white' };
  if (a.timing === 'commit_now') return { ring: 'ring-2 ring-green-500', badge: 'now', badgeCls: 'bg-green-600 text-white' };
  if (a.timing === 'save_for_later') return { ring: 'ring-2 ring-amber-400', badge: 'save', badgeCls: 'bg-amber-600 text-black' };
  return { ring: 'ring-2 ring-amber-400', badge: String(a.rank), badgeCls: 'bg-amber-500 text-black' };
}

const ATTRIBUTES: { label: string; value: Attribute | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'STR', value: 'strength' },
  { label: 'AGI', value: 'agility' },
  { label: 'INT', value: 'intelligence' },
  { label: 'UNI', value: 'universal' },
];

const ROLES: { label: string; value: Role | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Carry', value: 'carry' },
  { label: 'Mid', value: 'mid' },
  { label: 'Offlane', value: 'offlane' },
  { label: 'Support', value: 'support' },
  { label: 'Hard Sup', value: 'hard_support' },
];

export default function HeroGrid({ annotations }: { annotations?: Map<number, GridAnnotation> }) {
  const dispatch = useAppDispatch();
  const usedIds = useAppSelector(selectUsedHeroIds);
  const allHeroes = useAppSelector(selectAllHeroes);
  const currentSlotIndex = useAppSelector(s => s.draft.currentSlotIndex);
  const phase = useAppSelector(s => s.draft.phase);
  const slots = useAppSelector(s => s.draft.slots);

  const [search, setSearch] = useState('');
  const [attrFilter, setAttrFilter] = useState<Attribute | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const currentSlot = slots[currentSlotIndex];

  const filtered = allHeroes.filter(h => {
    if (search && !h.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    if (attrFilter !== 'all' && h.attribute !== attrFilter) return false;
    if (roleFilter !== 'all' && !h.roles.includes(roleFilter)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Phase indicator */}
      {phase === 'drafting' && currentSlot && (
        <div className={[
          'text-center py-1.5 px-3 rounded-lg text-sm font-semibold',
          currentSlot.phase === 'ban'
            ? 'bg-red-900/40 text-red-300 border border-red-800'
            : currentSlot.team === 'radiant'
            ? 'bg-green-900/40 text-green-300 border border-green-800'
            : 'bg-red-900/40 text-red-300 border border-red-800',
        ].join(' ')}>
          {currentSlot.phase === 'ban' ? 'BAN' : 'PICK'} —{' '}
          <span className="capitalize">{currentSlot.team}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search hero..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[120px] bg-dota-surface border border-dota-border rounded px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-dota-accent"
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {ATTRIBUTES.map(a => (
          <button
            key={a.value}
            onClick={() => setAttrFilter(a.value as Attribute | 'all')}
            className={[
              'px-2 py-0.5 rounded text-xs font-medium transition-colors',
              attrFilter === a.value
                ? 'bg-dota-accent text-dota-bg'
                : 'bg-dota-surface text-gray-400 hover:text-gray-200 border border-dota-border',
            ].join(' ')}
          >
            {a.label}
          </button>
        ))}
        <div className="w-px bg-dota-border" />
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value as Role | 'all')}
            className={[
              'px-2 py-0.5 rounded text-xs font-medium transition-colors',
              roleFilter === r.value
                ? 'bg-blue-700 text-white'
                : 'bg-dota-surface text-gray-400 hover:text-gray-200 border border-dota-border',
            ].join(' ')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Hero grid */}
      <div className="overflow-y-auto scrollbar-thin flex-1">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-9 lg:grid-cols-10 xl:grid-cols-11 gap-1 pb-2">
          {filtered.map(hero => {
            const used = usedIds.includes(hero.id) || phase === 'complete';
            const anno = !used ? annotations?.get(hero.id) : undefined;
            return (
              <div key={hero.id} className="flex flex-col items-center gap-0.5">
                <HeroPortrait
                  hero={hero}
                  size="sm"
                  disabled={used}
                  showName
                  annotation={anno ? portraitAnno(anno) : undefined}
                  onClick={() => {
                    if (!used) dispatch(selectHero(hero.id));
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
