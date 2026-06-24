import type { Hero, HeroFreedom, FreedomStatus, Fragility } from '../../../shared/types';
import HeroPortrait from './HeroPortrait';

interface Props {
  freedom: HeroFreedom[];
  heroes: Hero[];
}

const STATUS: Record<FreedomStatus, { label: string; dot: string; text: string; border: string }> = {
  free:      { label: 'Free Game',  dot: 'bg-green-500',  text: 'text-green-400',  border: 'border-green-800/50' },
  minor:     { label: 'Minor',      dot: 'bg-sky-500',    text: 'text-sky-400',    border: 'border-sky-800/50' },
  contested: { label: 'Contested',  dot: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-800/50' },
  shut_down: { label: 'Shut Down',  dot: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-800/60' },
};

const FRAGILITY: Record<Fragility, { label: string; cls: string } | null> = {
  resilient: { label: 'resilient', cls: 'text-green-600 border-green-900/60' },
  normal: null,
  fragile: { label: 'fragile', cls: 'text-red-500 border-red-900/60' },
};

export default function HeroFreedomPanel({ freedom, heroes }: Props) {
  if (freedom.length === 0) return null;
  const byId = new Map(heroes.map(h => [h.id, h]));

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-lime-400">Free Game Check</h4>
        <span className="text-[8px] text-gray-600">who plays freely · who is disrupted</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {freedom.map(f => {
          const hero = byId.get(f.heroId);
          if (!hero) return null;
          const s = STATUS[f.status];
          const frag = FRAGILITY[f.fragility];
          return (
            <div key={f.heroId} className={['rounded border bg-dota-bg/30 p-1.5 flex flex-col gap-1', s.border].join(' ')}>
              {/* Header row */}
              <div className="flex items-center gap-1.5">
                <div className="shrink-0"><HeroPortrait hero={hero} size="sm" /></div>
                <span className="text-[10px] text-gray-300 font-semibold truncate flex-1 min-w-0">{hero.displayName}</span>
                {frag && (
                  <span className={['text-[7px] px-1 py-0.5 rounded border uppercase tracking-wide font-bold bg-dota-bg/60', frag.cls].join(' ')}>
                    {frag.label}
                  </span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                  <span className={['w-1.5 h-1.5 rounded-full', s.dot].join(' ')} />
                  <span className={['text-[9px] font-bold', s.text].join(' ')}>{s.label}</span>
                </span>
              </div>

              {/* Note */}
              <p className="text-[9px] text-gray-500 leading-relaxed">{f.note}</p>

              {/* Counters */}
              {f.counters.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {f.counters.map((c, i) => (
                    <li key={i} className="text-[9px] text-gray-400 leading-relaxed flex gap-1">
                      <span className={['shrink-0 font-bold', c.severity >= 8 ? 'text-red-500' : 'text-amber-500'].join(' ')}>✕</span>
                      <span>{c.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
