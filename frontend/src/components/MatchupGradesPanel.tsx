import { useEffect, useMemo, useState } from 'react';
import type { Hero } from '../types';
import { gradeMatchups, type ScaleSummary } from '../../../shared/matchupGrades';
import { primeMatchups, getApiMatchupAdvantage } from '../data/matchupService';
import HeroPortrait from './HeroPortrait';

interface Props {
  myPicks: Hero[];
  enemyPicks: Hero[];
}

function GradeBar({ s }: { s: ScaleSummary }) {
  const pct = Math.round(s.grade * 10);
  const color = s.relative
    ? s.grade >= 5.7 ? 'bg-green-500' : s.grade >= 4.3 ? 'bg-gray-500' : 'bg-red-500'
    : s.grade >= 5 ? 'bg-green-500' : s.grade >= 3 ? 'bg-yellow-500' : 'bg-gray-600';
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-gray-400 font-semibold">{s.label}</span>
        <span className="text-gray-500">{s.verdict} · {s.grade.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-dota-border/40 rounded-full overflow-hidden">
        <div className={[color, 'h-full rounded-full transition-all'].join(' ')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MatchupGradesPanel({ myPicks, enemyPicks }: Props) {
  const [open, setOpen] = useState(true);
  // Prime live win-rate data for both teams; bump state so grades refine once loaded.
  const [, setTick] = useState(0);
  useEffect(() => {
    primeMatchups([...myPicks, ...enemyPicks].map(h => h.id));
    const t1 = setTimeout(() => setTick(n => n + 1), 700);
    const t2 = setTimeout(() => setTick(n => n + 1), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPicks.map(h => h.id).join(','), enemyPicks.map(h => h.id).join(',')]);

  // Computed every render (cheap) so it reflects win-rate data as it streams in.
  const grades = gradeMatchups(myPicks, enemyPicks, getApiMatchupAdvantage);

  const byId = useMemo(() => {
    const m = new Map<number, Hero>();
    for (const h of [...myPicks, ...enemyPicks]) m.set(h.id, h);
    return m;
  }, [myPicks, enemyPicks]);

  if (enemyPicks.length === 0) return null;

  const scales = [grades.synergy, grades.lanePartner, grades.laneMatchup, grades.gameMatchup];

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-dota-hover/30 rounded-lg transition-colors">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          Matchup Grades
        </h4>
        <span className="text-gray-600 text-[10px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
      <div className="px-3 pb-3 flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        {scales.map(s => <GradeBar key={s.key} s={s} />)}
      </div>

      {/* Counters against us — most actionable, pairs with the item panel */}
      {grades.counteredBy.length > 0 && (
        <div className="border-t border-dota-border/50 pt-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-red-500/80 mb-1.5">
            They counter your heroes
          </div>
          <div className="flex flex-col gap-1.5">
            {grades.counteredBy.map((e, i) => {
              const enemy = byId.get(e.aId);
              const mine = byId.get(e.bId);
              return (
                <div key={i} className="flex items-center gap-1.5">
                  {enemy && <HeroPortrait hero={enemy} size="sm" team="dire" />}
                  <span className="text-red-500 text-xs font-black">›</span>
                  {mine && <HeroPortrait hero={mine} size="sm" team="radiant" />}
                  <span className="text-[10px] text-gray-400 leading-tight min-w-0">{e.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
