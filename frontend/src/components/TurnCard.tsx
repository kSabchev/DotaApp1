import type { PickContext } from '../types';

interface Props {
  action: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  count: number;            // how many heroes are highlighted in the grid
  pickContext: PickContext | null;
}

// A compact "your turn" prompt above the hero grid. It doesn't single out one
// hero — the grid below highlights all of the suggested picks / ban threats —
// it just states the action and the draft-position cue.
export default function TurnCard({ action, team, count, pickContext }: Props) {
  const teamBorder = team === 'radiant' ? 'border-green-700/70' : 'border-red-700/70';
  const actionCls = action === 'ban'
    ? 'bg-red-800 text-red-100'
    : team === 'radiant' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100';

  const msg = action === 'pick'
    ? `${count} suggested pick${count === 1 ? '' : 's'} highlighted below`
    : `top ban threats highlighted below`;

  const contextLine = action === 'pick' && pickContext
    ? (pickContext.enemyPicksAfter === 0
        ? `🔓 ${pickContext.isMyLastPick ? 'Last pick' : 'Protected slot'} — free game; the enemy can no longer counter`
        : pickContext.isMyLastPick
          ? `Your last pick — commit now (${pickContext.enemyPicksAfter} enemy pick${pickContext.enemyPicksAfter === 1 ? '' : 's'} can still respond)`
          : pickContext.enemyPicksAfter >= 3
            ? `Early pick — favour safe / flexible heroes (${pickContext.enemyPicksAfter} enemy picks can still respond)`
            : `${pickContext.enemyPicksAfter} enemy pick${pickContext.enemyPicksAfter === 1 ? '' : 's'} can still respond`)
    : null;

  return (
    <div className={['rounded-xl border-2 bg-dota-surface px-3 py-2 flex flex-col gap-1', teamBorder].join(' ')}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={['text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded', actionCls].join(' ')}>
          {action}
        </span>
        <span className="text-xs font-bold text-gray-200 capitalize">{team}&apos;s turn</span>
        <span className="text-[11px] text-gray-400">— {msg}</span>
      </div>
      {contextLine && <p className="text-[10px] text-gray-500">{contextLine}</p>}
    </div>
  );
}
