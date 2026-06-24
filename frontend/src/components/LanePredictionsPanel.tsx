import type { LanePrediction } from '../types';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import HeroPortrait from './HeroPortrait';

interface Props {
  predictions: LanePrediction[];
  team: 'radiant' | 'dire';
}

const LANE_ICONS: Record<LanePrediction['lane'], string> = {
  safe: '🛡',
  mid: '⚔',
  off: '🌙',
  roam: '🏃',
};

function StrengthPip({ strength }: { strength: number }) {
  const filled = Math.round(strength / 2);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={[
            'w-1.5 h-1.5 rounded-full',
            i < filled
              ? strength >= 8 ? 'bg-green-500' : strength >= 5 ? 'bg-yellow-500' : 'bg-red-500'
              : 'bg-dota-border',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

export default function LanePredictionsPanel({ predictions, team }: Props) {
  const allHeroes = useAppSelector(selectAllHeroes);

  if (predictions.length === 0) {
    return (
      <div className="text-[10px] text-gray-600 text-center py-2">
        Assign hero roles to see lane predictions
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {predictions.map(pred => {
        const myHeroes = pred.heroIds.map(id => allHeroes.find(h => h.id === id)).filter(Boolean);
        const enemyHeroes = pred.enemyHeroIds.map(id => allHeroes.find(h => h.id === id)).filter(Boolean);
        const hasGap = pred.needs.length > 0;
        const borderColor = hasGap
          ? 'border-orange-900/50'
          : pred.strength >= 8 ? 'border-green-900/50'
          : pred.strength >= 5 ? 'border-dota-border'
          : 'border-red-900/50';
        const bgColor = hasGap
          ? 'bg-orange-950/20'
          : pred.strength >= 8 ? 'bg-green-950/15'
          : 'bg-dota-surface';

        return (
          <div key={pred.lane} className={['rounded-lg border p-2.5', borderColor, bgColor].join(' ')}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{LANE_ICONS[pred.lane]}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {pred.label}
                </span>
              </div>
              <StrengthPip strength={pred.strength} />
            </div>

            {/* Hero portraits row: my heroes vs enemy */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex gap-1">
                {myHeroes.map(h => h && (
                  <HeroPortrait key={h.id} hero={h} size="sm" team={team} selected />
                ))}
              </div>
              {enemyHeroes.length > 0 && (
                <>
                  <span className="text-gray-600 text-xs font-bold">vs</span>
                  <div className="flex gap-1 opacity-60">
                    {enemyHeroes.slice(0, 3).map(h => h && (
                      <HeroPortrait key={h.id} hero={h} size="sm" team={team === 'radiant' ? 'dire' : 'radiant'} selected />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Verdict */}
            <p className="text-[10px] text-gray-200 leading-snug mb-1">{pred.verdict}</p>

            {/* Synergy note */}
            {pred.synergyNote && (
              <p className="text-[9px] text-purple-400 leading-tight mb-0.5">
                ✦ {pred.synergyNote}
              </p>
            )}

            {/* Counter note */}
            {pred.counterNote && (
              <p className={['text-[9px] leading-tight mb-0.5', pred.strength >= 6 ? 'text-green-400' : 'text-orange-400'].join(' ')}>
                {pred.strength >= 6 ? '▲' : '▼'} {pred.counterNote}
              </p>
            )}

            {/* Gaps / warnings */}
            {pred.needs.slice(0, 1).map((need, i) => (
              <p key={i} className="text-[9px] text-orange-400 leading-tight mt-0.5">
                ⚠ {need}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
