import type { GamePlanTimeline, TempoStance } from '../../../shared/types';

interface Props {
  timeline: GamePlanTimeline;
}

const TEMPO: Record<TempoStance, { label: string; dot: string; text: string; bg: string; border: string }> = {
  aggressive: { label: 'AGGRESSIVE', dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-950/20', border: 'border-orange-800/50' },
  neutral:    { label: 'STEADY',     dot: 'bg-sky-500',    text: 'text-sky-400',    bg: 'bg-sky-950/20',    border: 'border-sky-800/50' },
  defensive:  { label: 'DEFENSIVE',  dot: 'bg-teal-500',   text: 'text-teal-400',   bg: 'bg-teal-950/20',   border: 'border-teal-800/50' },
};

export default function GamePlanTimelinePanel({ timeline }: Props) {
  if (timeline.phases.length === 0) return null;

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          Game Plan Timeline
        </h4>
        {timeline.winBy && (
          <span className="text-[8px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
            ⏱ {timeline.winBy}
          </span>
        )}
      </div>

      {/* Vertical timeline rail */}
      <div className="relative flex flex-col gap-2 pl-4">
        {/* connecting line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-dota-border" />

        {timeline.phases.map(phase => {
          const t = TEMPO[phase.tempo];
          return (
            <div key={phase.id} className="relative">
              {/* node dot */}
              <div className={['absolute -left-4 top-1 w-[11px] h-[11px] rounded-full border-2 border-dota-surface z-10', t.dot].join(' ')} />

              <div className={['rounded-lg border p-2', t.bg, t.border].join(' ')}>
                {/* Header */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="text-[10px] font-black text-gray-200 tabular-nums">{phase.range}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{phase.label}</span>
                  <span className={['text-[7px] font-bold px-1 py-0.5 rounded uppercase tracking-wide', t.text, 'bg-dota-bg/60'].join(' ')}>
                    {t.label}
                  </span>
                  {phase.isPeak && (
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded uppercase tracking-wide text-yellow-300 bg-yellow-900/40 border border-yellow-700/50">
                      ⚡ Power Peak
                    </span>
                  )}
                </div>

                {/* Headline */}
                <p className={['text-[9px] font-semibold italic mb-1', t.text].join(' ')}>{phase.headline}</p>

                {/* Actions */}
                <ul className="flex flex-col gap-0.5">
                  {phase.actions.map((a, i) => (
                    <li key={i} className="text-[9px] text-gray-400 leading-relaxed flex gap-1">
                      <span className="text-gray-600 shrink-0">›</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
