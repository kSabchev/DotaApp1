import { useEffect, useState } from 'react';
import type { Hero } from '../types';
import { getHeroBuild, getItemConstants, type HeroBuild, type BuildItem } from '../data/heroBuildService';
import { itemIconUrl } from '../../../shared/items';
import HeroPortrait from './HeroPortrait';

interface Props {
  heroes: Hero[];
}

const PHASES: (keyof HeroBuild)[] = ['start', 'early', 'mid', 'late'];
const PHASE_LABEL: Record<keyof HeroBuild, string> = {
  start: 'Start', early: 'Early', mid: 'Mid', late: 'Late',
};

// Per-item controls shown in edit mode
function EditableItem({ it, isFirst, isLast, onRemove, onMoveLeft, onMoveRight }: {
  it: BuildItem;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className="relative">
        <img
          src={it.iconUrl}
          alt={it.name}
          title={it.name}
          className="w-6 h-[18px] rounded-sm border border-dota-border/60 object-cover bg-dota-bg"
          loading="lazy"
          onError={e => { e.currentTarget.style.opacity = '0.3'; }}
        />
        <button
          onClick={onRemove}
          title="Remove"
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-700 hover:bg-red-500 text-white flex items-center justify-center text-[8px] leading-none z-10"
        >×</button>
      </div>
      <div className="flex gap-0.5">
        <button
          onClick={onMoveLeft}
          disabled={isFirst}
          className="text-[7px] text-gray-500 hover:text-gray-200 disabled:opacity-20 w-2 leading-none"
          title="Move left"
        >◀</button>
        <button
          onClick={onMoveRight}
          disabled={isLast}
          className="text-[7px] text-gray-500 hover:text-gray-200 disabled:opacity-20 w-2 leading-none"
          title="Move right"
        >▶</button>
      </div>
    </div>
  );
}

function StaticItem({ it }: { it: BuildItem }) {
  return (
    <img
      src={it.iconUrl}
      alt={it.name}
      title={`${it.name} (${it.count})`}
      className="w-6 h-[18px] rounded-sm border border-dota-border/60 object-cover bg-dota-bg shrink-0"
      loading="lazy"
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

export default function HeroBuildPanel({ heroes }: Props) {
  const [builds, setBuilds] = useState<Record<number, HeroBuild | null>>({});
  const [editModes, setEditModes] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<Record<number, HeroBuild>>({});
  const [picker, setPicker] = useState<{ heroId: number; phase: keyof HeroBuild } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all(heroes.map(async h => [h.id, await getHeroBuild(h.id)] as const))
      .then(entries => { if (!cancelled) setBuilds(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes.map(h => h.id).join(',')]);

  const getPickerItems = (): BuildItem[] => {
    const c = getItemConstants();
    if (!c) return [];
    const q = search.toLowerCase();
    return Object.entries(c)
      .filter(([, v]) => !v.key.startsWith('recipe') && v.key !== '' && v.name.toLowerCase().includes(q))
      .map(([id, v]) => ({ id: Number(id), key: v.key, name: v.name, iconUrl: itemIconUrl(v.key), count: 0 } as BuildItem))
      .slice(0, 40);
  };

  if (heroes.length === 0) return null;

  const effectiveBuild = (heroId: number): HeroBuild | null =>
    overrides[heroId] ?? builds[heroId] ?? null;

  const isEditing = (id: number) => editModes.has(id);

  const toggleEdit = (id: number) => {
    setEditModes(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setPicker(null);
    setSearch('');
  };

  const removeItem = (heroId: number, phase: keyof HeroBuild, idx: number) => {
    const base = effectiveBuild(heroId) ?? { start: [], early: [], mid: [], late: [] };
    setOverrides(o => ({ ...o, [heroId]: { ...base, [phase]: base[phase].filter((_, i) => i !== idx) } }));
  };

  const moveItem = (heroId: number, phase: keyof HeroBuild, idx: number, dir: -1 | 1) => {
    const base = effectiveBuild(heroId);
    if (!base) return;
    const arr = [...base[phase]];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    setOverrides(o => ({ ...o, [heroId]: { ...base, [phase]: arr } }));
  };

  const addItem = (heroId: number, phase: keyof HeroBuild, item: BuildItem) => {
    const base = effectiveBuild(heroId) ?? { start: [], early: [], mid: [], late: [] };
    if (base[phase].some(i => i.id === item.id)) return;
    setOverrides(o => ({ ...o, [heroId]: { ...base, [phase]: [...base[phase], item] } }));
    setPicker(null);
    setSearch('');
  };

  const resetHero = (heroId: number) => {
    setOverrides(o => { const n = { ...o }; delete n[heroId]; return n; });
  };

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
        Typical Item Builds
      </h4>
      <p className="text-[8px] text-gray-600 mb-2">
        start › early › mid › late · click <span className="text-gray-500 font-bold">edit</span> to customise · session-only
      </p>

      <div className="flex flex-col gap-3">
        {heroes.map(hero => {
          const b = effectiveBuild(hero.id);
          const editing = isEditing(hero.id);
          const hasOverride = !!overrides[hero.id];
          const loading = builds[hero.id] === undefined;
          // In edit mode show all phases (so user can add to empty ones)
          const visiblePhases = editing ? PHASES : PHASES.filter(p => b && b[p].length > 0);

          return (
            <div key={hero.id} className="flex flex-col gap-1">
              {/* Hero row header */}
              <div className="flex items-center gap-2">
                <div className="shrink-0"><HeroPortrait hero={hero} size="sm" /></div>
                <span className="text-[10px] text-gray-400 font-semibold truncate flex-1 min-w-0">
                  {hero.displayName}
                </span>
                {!loading && (
                  <div className="flex items-center gap-1 shrink-0">
                    {hasOverride && !editing && (
                      <button
                        onClick={() => resetHero(hero.id)}
                        className="text-[8px] text-gray-600 hover:text-amber-400 underline underline-offset-2"
                        title="Revert to OpenDota data"
                      >reset</button>
                    )}
                    <button
                      onClick={() => toggleEdit(hero.id)}
                      className={[
                        'text-[8px] px-1.5 py-0.5 rounded border font-bold transition-colors',
                        editing
                          ? 'border-amber-600 text-amber-400 bg-amber-950/30 hover:border-amber-400'
                          : 'border-dota-border text-gray-500 hover:text-gray-300 hover:border-gray-500',
                      ].join(' ')}
                    >
                      {editing ? 'done ✓' : 'edit'}
                    </button>
                  </div>
                )}
              </div>

              {/* Build rows per phase */}
              {loading ? (
                <span className="text-[10px] text-gray-600 ml-8">loading…</span>
              ) : (
                <div className={['ml-8 flex flex-wrap gap-x-2 gap-y-1', editing ? 'flex-col' : 'flex-row items-center'].join(' ')}>
                  {visiblePhases.map((phase, pi) => {
                    const items = b ? b[phase] : [];
                    return (
                      <div key={phase} className="flex items-start gap-1 min-w-0">
                        {/* Phase separator (non-edit mode) */}
                        {!editing && pi > 0 && (
                          <span className="text-gray-600 text-[10px] self-center">›</span>
                        )}

                        {/* Phase block */}
                        <div className={[
                          'flex gap-0.5',
                          editing ? 'flex-col bg-dota-bg/40 rounded p-1.5 min-w-[120px]' : 'flex-row items-center',
                        ].join(' ')}>
                          {editing && (
                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                              {PHASE_LABEL[phase]}
                            </span>
                          )}
                          <div className={['flex gap-1 flex-wrap', editing ? '' : 'items-center'].join(' ')}>
                            {items.map((it, idx) =>
                              editing ? (
                                <EditableItem
                                  key={it.id}
                                  it={it}
                                  isFirst={idx === 0}
                                  isLast={idx === items.length - 1}
                                  onRemove={() => removeItem(hero.id, phase, idx)}
                                  onMoveLeft={() => moveItem(hero.id, phase, idx, -1)}
                                  onMoveRight={() => moveItem(hero.id, phase, idx, 1)}
                                />
                              ) : (
                                <StaticItem key={it.id} it={it} />
                              )
                            )}
                            {/* Add button + inline picker (edit mode) */}
                            {editing && (
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setPicker(p =>
                                      p?.heroId === hero.id && p.phase === phase ? null
                                      : { heroId: hero.id, phase }
                                    );
                                    setSearch('');
                                  }}
                                  className={[
                                    'w-6 h-[18px] rounded-sm border text-[11px] flex items-center justify-center transition-colors',
                                    picker?.heroId === hero.id && picker.phase === phase
                                      ? 'border-amber-500 text-amber-400 bg-amber-950/30'
                                      : 'border-dashed border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300',
                                  ].join(' ')}
                                  title={`Add item to ${PHASE_LABEL[phase]}`}
                                >+</button>
                                {picker?.heroId === hero.id && picker.phase === phase && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setPicker(null)} />
                                    <div className="absolute z-50 top-6 left-0 bg-dota-surface border border-dota-border rounded shadow-2xl p-2 w-56">
                                      <div className="text-[8px] text-gray-500 mb-1 font-bold uppercase">
                                        Add to {PHASE_LABEL[phase]}
                                      </div>
                                      <input
                                        autoFocus
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search items…"
                                        className="w-full text-[10px] bg-dota-bg border border-dota-border rounded px-2 py-1 text-gray-200 placeholder-gray-600 mb-1 outline-none focus:border-dota-accent"
                                      />
                                      <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin">
                                        {getPickerItems().map(it => (
                                          <button
                                            key={it.id}
                                            onClick={() => addItem(hero.id, picker.phase, it)}
                                            className="flex items-center gap-1.5 text-left text-[10px] text-gray-300 hover:bg-dota-hover px-1 py-0.5 rounded"
                                          >
                                            <img
                                              src={it.iconUrl}
                                              alt=""
                                              className="w-6 h-[18px] rounded-sm object-cover bg-dota-bg shrink-0"
                                              onError={e => { e.currentTarget.style.opacity = '0.2'; }}
                                            />
                                            <span className="truncate">{it.name}</span>
                                          </button>
                                        ))}
                                        {getPickerItems().length === 0 && (
                                          <span className="text-[10px] text-gray-600 px-1">No matches</span>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!editing && !b && (
                    <span className="text-[10px] text-gray-600">no data</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
