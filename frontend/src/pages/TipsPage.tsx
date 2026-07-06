import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import PageShell from '../components/layout/PageShell';
import HeroPortrait from '../components/HeroPortrait';
import { TIPS, TIP_CATEGORY_LABEL, type TipCategory } from '../data/tips';

const CATEGORIES = Object.keys(TIP_CATEGORY_LABEL) as TipCategory[];

const CATEGORY_COLOR: Record<TipCategory, string> = {
  drafting: 'text-dota-accent border-dota-accent/60',
  laning: 'text-green-400 border-green-800/60',
  midgame: 'text-sky-400 border-sky-800/60',
  itemization: 'text-cyan-400 border-cyan-800/60',
  map: 'text-violet-400 border-violet-800/60',
};

export default function TipsPage() {
  const heroes = useAppSelector(selectAllHeroes);
  const [category, setCategory] = useState<TipCategory | null>(null);

  const filtered = useMemo(
    () => (category ? TIPS.filter(t => t.category === category) : TIPS),
    [category],
  );

  return (
    <PageShell title="Tips">
      <div className="flex gap-1.5 flex-wrap mb-4">
        <button
          onClick={() => setCategory(null)}
          className={[
            'text-[10px] px-2 py-1 rounded border font-bold transition-colors',
            category === null ? 'text-gray-200 border-gray-500 bg-dota-surface' : 'text-gray-500 border-dota-border hover:text-gray-300',
          ].join(' ')}
        >
          All ({TIPS.length})
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? null : c)}
            className={[
              'text-[10px] px-2 py-1 rounded border font-bold transition-colors',
              category === c ? `${CATEGORY_COLOR[c]} bg-dota-surface` : 'text-gray-500 border-dota-border hover:text-gray-300',
            ].join(' ')}
          >
            {TIP_CATEGORY_LABEL[c]} ({TIPS.filter(t => t.category === c).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(tip => {
          const tipHeroes = (tip.heroNames ?? [])
            .map(name => heroes.find(h => h.name === name))
            .filter((h): h is NonNullable<typeof h> => Boolean(h));
          return (
            <div key={tip.id} className="bg-dota-surface rounded-lg border border-dota-border p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={['text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide', CATEGORY_COLOR[tip.category]].join(' ')}>
                  {TIP_CATEGORY_LABEL[tip.category]}
                </span>
                <h3 className="text-sm font-bold text-gray-200">{tip.title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{tip.body}</p>
              {tipHeroes.length > 0 && (
                <div className="flex gap-1.5 mt-auto pt-1">
                  {tipHeroes.map(h => (
                    <Link key={h.id} to={`/heroes/${h.name}`} title={h.displayName}>
                      <HeroPortrait hero={h} size="sm" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
