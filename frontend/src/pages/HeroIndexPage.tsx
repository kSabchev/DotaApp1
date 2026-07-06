import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import PageShell from '../components/layout/PageShell';
import HeroPortrait from '../components/HeroPortrait';
import { getHeroPlaystyles, PLAYSTYLE_LABEL } from '../../../shared/heroPlaystyles';
import type { Attribute, Playstyle } from '../types';

const ATTRIBUTES: { id: Attribute; label: string; color: string }[] = [
  { id: 'strength', label: 'STR', color: 'text-red-400 border-red-800/60' },
  { id: 'agility', label: 'AGI', color: 'text-green-400 border-green-800/60' },
  { id: 'intelligence', label: 'INT', color: 'text-blue-400 border-blue-800/60' },
  { id: 'universal', label: 'UNI', color: 'text-purple-400 border-purple-800/60' },
];

const ALL_PLAYSTYLES = Object.keys(PLAYSTYLE_LABEL) as Playstyle[];

export default function HeroIndexPage() {
  const heroes = useAppSelector(selectAllHeroes);
  const [search, setSearch] = useState('');
  const [attr, setAttr] = useState<Attribute | null>(null);
  const [style, setStyle] = useState<Playstyle | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return heroes
      .filter(h => !q || h.displayName.toLowerCase().includes(q) || h.name.includes(q))
      .filter(h => !attr || h.attribute === attr)
      .filter(h => !style || getHeroPlaystyles(h).includes(style))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [heroes, search, attr, style]);

  return (
    <PageShell title="Heroes">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search heroes…"
            className="w-56 bg-dota-bg border border-dota-border rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-dota-accent"
          />
          <div className="flex gap-1">
            {ATTRIBUTES.map(a => (
              <button
                key={a.id}
                onClick={() => setAttr(attr === a.id ? null : a.id)}
                className={[
                  'text-[10px] px-2 py-1 rounded border font-bold transition-colors',
                  attr === a.id ? `${a.color} bg-dota-surface` : 'text-gray-500 border-dota-border hover:text-gray-300',
                ].join(' ')}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_PLAYSTYLES.map(p => (
            <button
              key={p}
              onClick={() => setStyle(style === p ? null : p)}
              className={[
                'text-[9px] px-1.5 py-0.5 rounded border font-medium transition-colors',
                style === p
                  ? 'bg-violet-900/60 text-violet-200 border-violet-700'
                  : 'text-gray-500 border-dota-border hover:text-violet-300 hover:border-violet-800/60',
              ].join(' ')}
            >
              {PLAYSTYLE_LABEL[p]}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-600">{filtered.length} heroes</span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
        {filtered.map(hero => (
          <Link
            key={hero.id}
            to={`/heroes/${hero.name}`}
            className="flex flex-col items-center gap-1 group"
          >
            <HeroPortrait hero={hero} size="md" />
            <span className="text-[10px] text-gray-400 group-hover:text-dota-accent text-center leading-tight transition-colors">
              {hero.displayName}
            </span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-8">No heroes match the current filters.</p>
      )}
    </PageShell>
  );
}
