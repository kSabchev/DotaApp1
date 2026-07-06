import { useEffect, useState } from 'react';
import type { Hero } from '../../types';
import { getHeroBuild, type HeroBuild, type BuildItem } from '../../data/heroBuildService';

const PHASES: { key: keyof HeroBuild; label: string }[] = [
  { key: 'start', label: 'Starting' },
  { key: 'early', label: 'Early game' },
  { key: 'mid', label: 'Mid game' },
  { key: 'late', label: 'Late game' },
];

function ItemChip({ item }: { item: BuildItem }) {
  return (
    <div className="flex items-center gap-1.5 bg-dota-bg/60 rounded border border-dota-border px-1.5 py-1" title={`${item.name} — bought in ${item.count.toLocaleString()} recent games`}>
      <img src={item.iconUrl} alt={item.name} className="w-8 h-6 rounded object-cover" loading="lazy"
           onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
      <span className="text-[10px] text-gray-300">{item.name}</span>
    </div>
  );
}

/** Item progression by game phase, from live OpenDota popularity data. */
export default function HeroItemBuildSection({ hero }: { hero: Hero }) {
  const [build, setBuild] = useState<HeroBuild | null | 'loading'>('loading');

  useEffect(() => {
    let alive = true;
    setBuild('loading');
    getHeroBuild(hero.id).then(b => { if (alive) setBuild(b); });
    return () => { alive = false; };
  }, [hero.id]);

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Item Progression</h4>
        <span className="text-[8px] font-bold uppercase tracking-wide text-emerald-400/80"
              title="Live OpenDota item popularity">● live</span>
      </div>
      {build === 'loading' && <p className="text-[10px] text-gray-600">Loading item data…</p>}
      {build === null && <p className="text-[10px] text-gray-600">Item data unavailable — is the backend reachable?</p>}
      {build !== 'loading' && build !== null && (
        <div className="flex flex-col gap-2.5">
          {PHASES.map(p => (
            build[p.key].length > 0 && (
              <div key={p.key} className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-gray-500 w-16 shrink-0 pt-1.5">{p.label}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {build[p.key].map(item => <ItemChip key={item.id} item={item} />)}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
