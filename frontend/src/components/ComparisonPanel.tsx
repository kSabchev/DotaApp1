import { useEffect, useState } from 'react';
import type { TeamAnalysis } from '../types';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import HeroPortrait from './HeroPortrait';
import {
  getRadiantWinProbability, isWinModelLoaded, loadWinModel, getModelInfo,
} from '../data/winModelService';

interface Props {
  radiantPickIds: number[];
  direPickIds: number[];
  radiantAnalysis: TeamAnalysis;
  direAnalysis: TeamAnalysis;
}

const WIN_CON_ICON: Record<string, string> = {
  teamfight: '⚔',
  deathball: '⬛',
  pickoff: '🗡',
  splitpush: '↔',
  lategame: '⏳',
  physical_domination: '🛡',
};

function DualBar({ radiant, dire, max }: { radiant: number; dire: number; max: number }) {
  const rPct = Math.round((radiant / max) * 100);
  const dPct = Math.round((dire / max) * 100);
  const rWins = radiant > dire;
  const dWins = dire > radiant;
  return (
    <div className="flex items-center gap-0.5 w-full h-2">
      <div className="flex-1 h-full bg-dota-border/30 rounded-l-full overflow-hidden flex justify-end">
        <div className={['h-full rounded-l-full transition-all', rWins ? 'bg-green-500' : 'bg-green-900'].join(' ')} style={{ width: `${rPct}%` }} />
      </div>
      <div className="w-px h-3 bg-dota-border/60 shrink-0" />
      <div className="flex-1 h-full bg-dota-border/30 rounded-r-full overflow-hidden">
        <div className={['h-full rounded-r-full transition-all', dWins ? 'bg-red-500' : 'bg-red-900'].join(' ')} style={{ width: `${dPct}%` }} />
      </div>
    </div>
  );
}

const METRICS = [
  { label: 'Fight', radiantKey: 'synergyScore' as const, direKey: 'synergyScore' as const, max: 25 },
  { label: 'Counter', radiantKey: 'counterScore' as const, direKey: 'counterScore' as const, max: 15 },
  { label: 'Timing', radiantKey: 'timingScore' as const, direKey: 'timingScore' as const, max: 10 },
  { label: 'Lanes', radiantKey: 'laneScore' as const, direKey: 'laneScore' as const, max: 10 },
  { label: 'Roles', radiantKey: 'roleBalanceScore' as const, direKey: 'roleBalanceScore' as const, max: 10 },
  { label: 'Obj', radiantKey: 'objectiveScore' as const, direKey: 'objectiveScore' as const, max: 10 },
];

export default function ComparisonPanel({ radiantPickIds, direPickIds, radiantAnalysis, direAnalysis }: Props) {
  const allHeroes = useAppSelector(selectAllHeroes);

  // Trained-model win probability (loads async on boot; re-render once ready).
  const [modelReady, setModelReady] = useState(isWinModelLoaded());
  useEffect(() => {
    if (!modelReady) loadWinModel().then(() => setModelReady(isWinModelLoaded()));
  }, [modelReady]);

  const winProb = modelReady ? getRadiantWinProbability(radiantPickIds, direPickIds) : null;
  const radiantPct = winProb !== null ? Math.round(winProb * 100) : null;
  const draftComplete = radiantPickIds.length === 5 && direPickIds.length === 5;
  const modelInfo = getModelInfo();

  const rTotal = radiantAnalysis.totalScore;
  const dTotal = direAnalysis.totalScore;
  const advantage = rTotal > dTotal ? 'radiant' : dTotal > rTotal ? 'dire' : 'even';
  const margin = Math.abs(rTotal - dTotal);

  const rWinCon = radiantAnalysis.draftVerdict.primaryWinCondition;
  const dWinCon = direAnalysis.draftVerdict.primaryWinCondition;

  const rPeak = radiantAnalysis.draftVerdict.powerWindow.peak;
  const dPeak = direAnalysis.draftVerdict.powerWindow.peak;
  const peakColor = (p: string) => p === 'early' ? 'text-orange-400' : p === 'mid' ? 'text-yellow-400' : 'text-blue-400';

  const lv = { radiant: radiantAnalysis.draftVerdict.laneVerdict, dire: direAnalysis.draftVerdict.laneVerdict };

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: advantage banner + hero portraits */}
      <div className="flex items-center gap-3">
        {/* Radiant heroes */}
        <div className="flex gap-0.5 shrink-0">
          {radiantPickIds.map(id => {
            const h = allHeroes.find(h => h.id === id);
            return h ? <HeroPortrait key={id} hero={h} size="sm" team="radiant" selected /> : null;
          })}
          {Array.from({ length: Math.max(0, 5 - radiantPickIds.length) }).map((_, i) => (
            <div key={i} className="w-9 h-7 rounded border border-dota-border/20 bg-dota-surface/30" />
          ))}
        </div>

        {/* Center: model win probability (falls back to heuristic margin) */}
        {radiantPct !== null ? (
          <div className="flex-1 flex flex-col gap-0.5 px-1">
            <div className="flex items-center justify-between text-[10px] font-black leading-none">
              <span className="text-green-300">Radiant {radiantPct}%</span>
              <span className="text-[7px] text-gray-500 font-bold tracking-wide self-center">
                {draftComplete ? 'WIN PROBABILITY' : 'LIVE · PARTIAL'}
              </span>
              <span className="text-red-300">{100 - radiantPct}% Dire</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-dota-border/40">
              <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${radiantPct}%` }} />
              <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${100 - radiantPct}%` }} />
            </div>
            <div className="text-[7px] text-gray-600 text-center leading-none">
              model · {modelInfo?.source === 'opendota_pro' ? 'pro matches' : modelInfo?.source ?? 'data'}
              {modelInfo?.trainMatches ? ` (${modelInfo.trainMatches})` : ''} · draft only
            </div>
          </div>
        ) : (
          <div className={[
            'flex-1 rounded py-1 px-2 text-center text-[10px] font-bold',
            advantage === 'radiant' ? 'bg-green-950/50 text-green-300' :
            advantage === 'dire'    ? 'bg-red-950/50 text-red-300' :
                                      'bg-dota-border/20 text-gray-400',
          ].join(' ')}>
            {advantage === 'even' ? 'Even draft' :
              `${advantage === 'radiant' ? 'Radiant' : 'Dire'} +${margin} pts`}
          </div>
        )}

        {/* Dire heroes */}
        <div className="flex gap-0.5 shrink-0">
          {direPickIds.map(id => {
            const h = allHeroes.find(h => h.id === id);
            return h ? <HeroPortrait key={id} hero={h} size="sm" team="dire" selected /> : null;
          })}
          {Array.from({ length: Math.max(0, 5 - direPickIds.length) }).map((_, i) => (
            <div key={i} className="w-9 h-7 rounded border border-dota-border/20 bg-dota-surface/30" />
          ))}
        </div>
      </div>

      {/* Row 2: metrics grid + win conditions + lane advantage */}
      <div className="flex gap-3">
        {/* Win conditions */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-green-950/20 border border-green-900/30 rounded p-1.5 w-28">
            <div className="text-[8px] text-green-600 font-bold uppercase mb-0.5">Radiant</div>
            <div className="flex items-center gap-1">
              <span className="text-[11px]">{WIN_CON_ICON[rWinCon.id] ?? '▶'}</span>
              <span className="text-[9px] text-green-300 font-bold leading-tight truncate">{rWinCon.label}</span>
            </div>
            <div className="text-[8px] text-gray-500 mt-0.5">
              Peaks <span className={peakColor(rPeak)}>{rPeak}</span>
            </div>
          </div>
          <div className="bg-red-950/20 border border-red-900/30 rounded p-1.5 w-28">
            <div className="text-[8px] text-red-600 font-bold uppercase mb-0.5">Dire</div>
            <div className="flex items-center gap-1">
              <span className="text-[11px]">{WIN_CON_ICON[dWinCon.id] ?? '▶'}</span>
              <span className="text-[9px] text-red-300 font-bold leading-tight truncate">{dWinCon.label}</span>
            </div>
            <div className="text-[8px] text-gray-500 mt-0.5">
              Peaks <span className={peakColor(dPeak)}>{dPeak}</span>
            </div>
          </div>
        </div>

        {/* Metric bars */}
        <div className="flex-1 grid grid-cols-3 gap-x-3 gap-y-1 content-center">
          {METRICS.map(m => {
            const rVal = radiantAnalysis[m.radiantKey] as number;
            const dVal = direAnalysis[m.direKey] as number;
            const rNorm = Math.round((rVal / m.max) * 10);
            const dNorm = Math.round((dVal / m.max) * 10);
            const diff = Math.abs(rNorm - dNorm);
            const winner = rNorm > dNorm ? 'R' : dNorm > rNorm ? 'D' : null;
            return (
              <div key={m.label} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-600">{m.label}</span>
                  {winner && diff > 0 && (
                    <span className={['text-[8px] font-bold', winner === 'R' ? 'text-green-500' : 'text-red-500'].join(' ')}>
                      {winner}+{diff}
                    </span>
                  )}
                </div>
                <DualBar radiant={rNorm} dire={dNorm} max={10} />
              </div>
            );
          })}
        </div>

        {/* Lane advantage */}
        <div className="shrink-0 w-36 flex flex-col gap-1 justify-center">
          <div className="text-[8px] text-gray-600 font-bold uppercase mb-0.5">Lane Advantage</div>
          {(['safeLane', 'midLane', 'offLane'] as const).map(key => {
            const label = key === 'safeLane' ? 'Safe' : key === 'midLane' ? 'Mid' : 'Off';
            const rStr = lv.radiant[key].strength;
            const dStr = lv.dire[key].strength;
            const rWins = rStr > dStr;
            const dWins = dStr > rStr;
            return (
              <div key={key} className="flex items-center gap-1">
                <span className="text-[8px] text-gray-600 w-5 shrink-0">{label}</span>
                <div className="flex-1">
                  <DualBar radiant={rStr} dire={dStr} max={10} />
                </div>
                <span className={['text-[8px] font-bold w-8 text-right shrink-0',
                  rWins ? 'text-green-500' : dWins ? 'text-red-500' : 'text-gray-600'].join(' ')}>
                  {rWins ? '◀ R' : dWins ? 'D ▶' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
