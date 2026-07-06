import { useMemo } from 'react';
import type { Hero } from '../../types';
import { itemsThatCounter, itemIconUrl } from '../../../../shared/matchups';

/** "Items that counter this hero" — Break vs Bristleback, MKB vs PA, detection vs invis. */
export default function HeroCounterItemsSection({ hero }: { hero: Hero }) {
  const counters = useMemo(() => itemsThatCounter(hero), [hero]);
  if (counters.length === 0) return null;

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-3">
        Items that counter {hero.displayName}
      </h4>
      <div className="flex flex-col gap-2">
        {counters.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <img
              src={itemIconUrl(c.item.id)}
              alt={c.item.name}
              className="w-11 h-8 rounded border border-dota-border shrink-0 object-cover bg-dota-bg"
              loading="lazy"
              onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-200">{c.item.name}</span>
                {c.priority === 'core' && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-orange-900/60 text-orange-300 font-bold">strong</span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">{c.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
