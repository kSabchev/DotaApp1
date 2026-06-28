import { useMemo, useState } from 'react';
import type { Hero, Role } from '../types';
import { computeItemMatchups } from '../../../shared/matchups';

interface Props {
  myPicks: Hero[];
  enemyPicks: Hero[];
}

const ROLE_LABEL: Record<Role, string> = {
  carry: 'Carry', mid: 'Mid', offlane: 'Off', support: 'Sup', hard_support: 'Hard Sup',
};
const ROLE_COLOR: Record<Role, string> = {
  carry: 'bg-amber-900/60 text-amber-300', mid: 'bg-sky-900/60 text-sky-300',
  offlane: 'bg-teal-900/60 text-teal-300', support: 'bg-fuchsia-900/60 text-fuchsia-300',
  hard_support: 'bg-fuchsia-900/60 text-fuchsia-300',
};

export default function MatchupItemPanel({ myPicks, enemyPicks }: Props) {
  const [open, setOpen] = useState(true);
  const { recommended } = useMemo(
    () => computeItemMatchups(myPicks, enemyPicks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myPicks.map(h => h.id).join(','), enemyPicks.map(h => h.id).join(',')],
  );

  if (enemyPicks.length === 0 || recommended.length === 0) return null;

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-dota-hover/30 rounded-lg transition-colors">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
          Items to Build vs Enemy
        </h4>
        <span className="text-gray-600 text-[10px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
      <div className="flex flex-col gap-2 px-3 pb-3">
        {recommended.slice(0, 7).map(rec => (
          <div key={rec.itemId} className="flex gap-2 items-start">
            <img
              src={rec.iconUrl}
              alt={rec.itemName}
              className="w-11 h-8 rounded border border-dota-border shrink-0 object-cover bg-dota-bg"
              loading="lazy"
              onError={e => { (e.currentTarget.style.visibility = 'hidden'); }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold text-gray-200">{rec.itemName}</span>
                <span className={['text-[8px] px-1 py-0.5 rounded font-bold', ROLE_COLOR[rec.buyerRole]].join(' ')}>
                  {ROLE_LABEL[rec.buyerRole]}{rec.buyerInTeam ? '' : '?'}
                </span>
                {rec.priority === 'core' && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-bold">core</span>
                )}
              </div>
              {rec.answers.slice(0, 3).map((a, i) => (
                <div key={i} className="text-[10px] text-gray-500 leading-tight">· {a.reason}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
