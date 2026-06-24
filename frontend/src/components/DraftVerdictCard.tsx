import type { DraftVerdict, VerdictRating } from '../types';

interface Props {
  verdict: DraftVerdict;
}

const RATING_STYLES: Record<VerdictRating, { border: string; bg: string; text: string; badge: string }> = {
  dominant:   { border: 'border-yellow-500',  bg: 'bg-yellow-950/30',  text: 'text-yellow-300',  badge: 'bg-yellow-900/60 text-yellow-200' },
  strong:     { border: 'border-green-600',   bg: 'bg-green-950/20',   text: 'text-green-300',   badge: 'bg-green-900/60 text-green-200' },
  solid:      { border: 'border-blue-600',    bg: 'bg-blue-950/20',    text: 'text-blue-300',    badge: 'bg-blue-900/60 text-blue-200' },
  needs_work: { border: 'border-orange-700',  bg: 'bg-orange-950/20',  text: 'text-orange-300',  badge: 'bg-orange-900/60 text-orange-200' },
  incomplete: { border: 'border-gray-700',    bg: 'bg-gray-900/20',    text: 'text-gray-400',    badge: 'bg-gray-800/60 text-gray-400' },
};

const WIN_CON_ICON: Record<string, string> = {
  teamfight: '⚔',
  deathball: '⬛',
  pickoff: '🗡',
  splitpush: '↔',
  lategame: '⏳',
  physical_domination: '🛡',
};

const PEAK_COLORS = {
  early: { bar: 'bg-orange-500', label: 'text-orange-400' },
  mid:   { bar: 'bg-yellow-500', label: 'text-yellow-400' },
  late:  { bar: 'bg-blue-500',   label: 'text-blue-400' },
};

function StrengthBar({ value, max = 10, peak = false }: { value: number; max?: number; peak?: boolean }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex-1 h-1.5 bg-dota-border rounded-full overflow-hidden">
      <div
        className={['h-full rounded-full transition-all', peak ? 'bg-yellow-400' : 'bg-dota-accent/60'].join(' ')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DraftVerdictCard({ verdict }: Props) {
  const style = RATING_STYLES[verdict.rating];
  const pw = verdict.powerWindow;
  const peakLabel = pw.peak.charAt(0).toUpperCase() + pw.peak.slice(0);

  return (
    <div className={['rounded-lg border p-3 flex flex-col gap-3', style.border, style.bg].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={['text-[10px] font-bold uppercase tracking-wider', style.text].join(' ')}>
          Draft Verdict
        </span>
        <span className={['text-[10px] px-2 py-0.5 rounded font-bold', style.badge].join(' ')}>
          {verdict.ratingLabel}
        </span>
      </div>

      {/* Primary Win Condition */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{WIN_CON_ICON[verdict.primaryWinCondition.id] ?? '▶'}</span>
            <span className={['text-xs font-bold', style.text].join(' ')}>
              {verdict.primaryWinCondition.label}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">
            {verdict.primaryWinCondition.strength}/10
          </span>
        </div>
        <StrengthBar value={verdict.primaryWinCondition.strength} peak />
        <p className="text-[10px] text-gray-400 mt-1 leading-tight">
          {verdict.primaryWinCondition.description}
        </p>
      </div>

      {/* Secondary Win Condition */}
      {verdict.secondaryWinCondition && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{WIN_CON_ICON[verdict.secondaryWinCondition.id] ?? '▶'}</span>
              <span className="text-[10px] text-gray-400 font-semibold">
                {verdict.secondaryWinCondition.label}
              </span>
            </div>
            <span className="text-[10px] text-gray-600">
              {verdict.secondaryWinCondition.strength}/10
            </span>
          </div>
          <StrengthBar value={verdict.secondaryWinCondition.strength} />
        </div>
      )}

      {/* Power Window */}
      <div className="border-t border-dota-border/40 pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Power Window</span>
          <span className={['text-[10px] font-bold', PEAK_COLORS[pw.peak].label].join(' ')}>
            Peaks {peakLabel}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['early', 'mid', 'late'] as const).map(phase => {
            const val = pw[phase];
            const label = pw[`${phase}Label` as 'earlyLabel' | 'midLabel' | 'lateLabel'];
            const isPeak = pw.peak === phase;
            return (
              <div key={phase} className={['rounded p-1.5 flex flex-col gap-0.5', isPeak ? 'bg-dota-border/40' : ''].join(' ')}>
                <div className="flex items-center justify-between">
                  <span className={['text-[9px] uppercase font-bold', isPeak ? PEAK_COLORS[phase].label : 'text-gray-600'].join(' ')}>
                    {phase}
                  </span>
                  <span className="text-[9px] text-gray-600">{val}/10</span>
                </div>
                <div className="h-1 bg-dota-border/40 rounded-full overflow-hidden">
                  <div
                    className={['h-full rounded-full', isPeak ? PEAK_COLORS[phase].bar : 'bg-gray-600'].join(' ')}
                    style={{ width: `${(val / 10) * 100}%` }}
                  />
                </div>
                <span className={['text-[9px]', isPeak ? PEAK_COLORS[phase].label : 'text-gray-600'].join(' ')}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coach narrative — plain-English summary */}
      {verdict.coachNarrative && verdict.coachNarrative !== 'Pick more heroes to generate a draft summary.' && (
        <div className="border-t border-dota-border/40 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Summary</span>
          <p className="text-[11px] text-gray-200 leading-relaxed mt-1">{verdict.coachNarrative}</p>
        </div>
      )}

      {/* Gameplan — bullet steps */}
      {verdict.gameplan.length > 0 && (
        <div className="border-t border-dota-border/40 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Execution</span>
          <ol className="flex flex-col gap-1 mt-1">
            {verdict.gameplan.map((step, i) => (
              <li key={i} className="flex gap-1.5 text-[10px] text-gray-300 leading-tight">
                <span className={['shrink-0 font-bold', style.text].join(' ')}>{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Lane Verdict */}
      {verdict.laneVerdict.overallScore > 0 && (
        <div className="border-t border-dota-border/40 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Lanes</span>
            <span className="text-[10px] text-gray-500">{verdict.laneVerdict.overallScore}/10</span>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { key: 'safeLane', label: 'Safe' },
              { key: 'midLane', label: 'Mid' },
              { key: 'offLane', label: 'Off' },
            ].map(({ key, label }) => {
              const lane = verdict.laneVerdict[key as 'safeLane' | 'midLane' | 'offLane'];
              const hasGap = lane.needs && lane.needs.length > 0;
              return (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-[9px] text-gray-600 uppercase font-bold w-6 shrink-0 mt-0.5">{label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1 bg-dota-border/40 rounded-full overflow-hidden">
                        <div
                          className={['h-full rounded-full', hasGap ? 'bg-orange-600' : 'bg-green-600'].join(' ')}
                          style={{ width: `${((lane.strength ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-600 shrink-0">{lane.verdict}</span>
                    </div>
                    {hasGap && lane.needs[0] && (
                      <p className="text-[9px] text-orange-400 mt-0.5 leading-tight">{lane.needs[0]}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {verdict.laneVerdict.missingRoles.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {verdict.laneVerdict.missingRoles.map(r => (
                <span key={r} className="text-[9px] px-1 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40">
                  No {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key Threats */}
      {verdict.keyThreats.length > 0 && (
        <div className="border-t border-dota-border/40 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Key Threats</span>
          <ul className="flex flex-col gap-0.5 mt-1">
            {verdict.keyThreats.map((t, i) => (
              <li key={i} className="text-[10px] text-red-300/80 leading-tight flex gap-1">
                <span className="text-red-700 shrink-0">▸</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Bans */}
      {verdict.keyBans.length > 0 && (
        <div className="border-t border-dota-border/40 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Priority Bans</span>
          <ul className="flex flex-col gap-0.5 mt-1">
            {verdict.keyBans.map((b, i) => (
              <li key={i} className="text-[10px] text-gray-400 leading-tight flex gap-1">
                <span className="text-gray-600 shrink-0">✕</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
