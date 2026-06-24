import { useMemo, useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectRadiantPicks, selectDirePicks, selectAvailableHeroes, selectAllHeroes } from '../store/selectors';
import { analyzeTeam } from '../utils/scoring';
import {
  getRadiantWinProbability, isWinModelLoaded, loadWinModel, getModelInfo,
} from '../data/winModelService';
import type { Role } from '../types';
import HeroPortrait from './HeroPortrait';
import ScoreBar from './ScoreBar';
import TeamTags from './TeamTags';
import DraftVerdictCard from './DraftVerdictCard';
import LanePredictionsPanel from './LanePredictionsPanel';
import MatchupItemPanel from './MatchupItemPanel';
import MatchupGradesPanel from './MatchupGradesPanel';
import HeroBuildPanel from './HeroBuildPanel';
import DraftHealthPanel from './DraftHealthPanel';
import GamePlanTimelinePanel from './GamePlanTimelinePanel';
import HeroFreedomPanel from './HeroFreedomPanel';
import RolePicker from './RolePicker';

export default function DraftSummary() {
  const radiantPicks = useAppSelector(selectRadiantPicks);
  const direPicks = useAppSelector(selectDirePicks);
  const availableHeroes = useAppSelector(selectAvailableHeroes);
  const allHeroes = useAppSelector(selectAllHeroes);
  const roleAssignments = useAppSelector(s => s.draft.roleAssignments) as Record<number, Role>;
  const availableIds = availableHeroes.map(h => h.id);

  const radiantAnalysis = useMemo(
    () => analyzeTeam(radiantPicks, direPicks, availableIds, allHeroes, roleAssignments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radiantPicks.join(','), direPicks.join(','), allHeroes.length, JSON.stringify(roleAssignments)],
  );
  const direAnalysis = useMemo(
    () => analyzeTeam(direPicks, radiantPicks, availableIds, allHeroes, roleAssignments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direPicks.join(','), radiantPicks.join(','), allHeroes.length, JSON.stringify(roleAssignments)],
  );

  const winner =
    radiantAnalysis.totalScore > direAnalysis.totalScore ? 'radiant' :
    direAnalysis.totalScore > radiantAnalysis.totalScore ? 'dire' : 'tie';

  // Role confirmation — reset when assignments change, set on explicit confirm
  const [rolesConfirmed, setRolesConfirmed] = useState(false);
  const prevRoleKey = useRef('');
  useEffect(() => {
    const key = JSON.stringify(roleAssignments);
    if (key !== prevRoleKey.current) {
      prevRoleKey.current = key;
      setRolesConfirmed(false);
    }
  });

  const allRolesAssigned = (pickIds: number[]) => {
    const assigned = pickIds.map(id => {
      const hero = allHeroes.find(h => h.id === id);
      return roleAssignments[id] ?? (hero?.metaRole ? hero.metaRole : undefined);
    });
    return assigned.filter(Boolean).length === pickIds.length;
  };

  // Trained-model win probability (loads async on boot; re-render once ready).
  const [modelReady, setModelReady] = useState(isWinModelLoaded());
  useEffect(() => {
    if (!modelReady) loadWinModel().then(() => setModelReady(isWinModelLoaded()));
  }, [modelReady]);
  const winProb = modelReady ? getRadiantWinProbability(radiantPicks, direPicks) : null;
  const radiantPct = winProb !== null ? Math.round(winProb * 100) : null;
  const modelInfo = getModelInfo();

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
      <h2 className="text-2xl font-black text-dota-accent text-center">Draft Analysis</h2>

      {/* Win probability (model) + draft-quality advantage (heuristic) */}
      <div className="bg-dota-surface rounded-xl border border-dota-border p-5 flex flex-col gap-3">
        {radiantPct !== null ? (
          <>
            <div className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Predicted Win Probability
            </div>
            <div className="flex items-end justify-between px-2">
              <div className="text-left">
                <div className="text-4xl font-black text-green-400 leading-none">{radiantPct}%</div>
                <div className="text-xs text-green-600 font-bold uppercase tracking-wider mt-1">Radiant</div>
              </div>
              <div className="text-gray-600 text-xs font-bold pb-1">vs</div>
              <div className="text-right">
                <div className="text-4xl font-black text-red-400 leading-none">{100 - radiantPct}%</div>
                <div className="text-xs text-red-600 font-bold uppercase tracking-wider mt-1">Dire</div>
              </div>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-dota-border/40">
              <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${radiantPct}%` }} />
              <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${100 - radiantPct}%` }} />
            </div>
            <div className="text-[10px] text-gray-600 text-center">
              Logistic model · {modelInfo?.trainMatches ?? ''} {modelInfo?.source === 'opendota_pro' ? 'pro' : ''} matches · draft signal only (execution not modeled)
            </div>
          </>
        ) : (
          <div className="text-center">
            {winner === 'tie' ? (
              <p className="text-gray-300 text-lg font-semibold">Drafts are evenly matched</p>
            ) : (
              <p className={['text-lg font-bold', winner === 'radiant' ? 'text-green-400' : 'text-red-400'].join(' ')}>
                <span className="capitalize">{winner}</span> has the draft advantage
              </p>
            )}
          </div>
        )}

        {/* Heuristic draft-quality score (secondary detail) */}
        <div className="flex gap-4 justify-center text-xs text-gray-500 border-t border-dota-border/50 pt-2">
          <span>Draft-quality score — Radiant <strong className="text-green-400">{radiantAnalysis.totalScore}</strong></span>
          <span>Dire <strong className="text-red-400">{direAnalysis.totalScore}</strong></span>
        </div>
      </div>

      {/* Side-by-side analysis */}
      <div className="grid grid-cols-2 gap-4">
        {(['radiant', 'dire'] as const).map(team => {
          const picks = team === 'radiant' ? radiantPicks : direPicks;
          const enemyPickIds = team === 'radiant' ? direPicks : radiantPicks;
          const analysis = team === 'radiant' ? radiantAnalysis : direAnalysis;
          const myHeroes = picks.map(id => allHeroes.find(h => h.id === id)!).filter(Boolean);
          const enemyHeroes = enemyPickIds.map(id => allHeroes.find(h => h.id === id)!).filter(Boolean);
          return (
            <div
              key={team}
              className={[
                'rounded-xl border p-4 flex flex-col gap-3',
                team === 'radiant' ? 'border-green-900 bg-green-950/20' : 'border-red-900 bg-red-950/20',
              ].join(' ')}
            >
              <h3 className={['text-sm font-bold uppercase tracking-wider', team === 'radiant' ? 'text-green-400' : 'text-red-400'].join(' ')}>
                {team}
              </h3>

              {/* Hero portraits with editable role assignment (re-runs analysis) */}
              <div className="flex gap-2 flex-wrap">
                {picks.map(id => {
                  const hero = allHeroes.find(h => h.id === id);
                  if (!hero) return null;
                  return (
                    <div key={id} className="flex flex-col items-center gap-1">
                      <HeroPortrait hero={hero} size="sm" team={team} selected />
                      <RolePicker heroId={id} current={roleAssignments[id]} metaRole={hero.metaRole} flexRoles={hero.flexRoles} />
                    </div>
                  );
                })}
              </div>

              {/* Confirm Roles button — always clickable so roles can be re-confirmed after fixes */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRolesConfirmed(true)}
                  className={[
                    'text-[9px] px-2 py-1 rounded border font-bold transition-all',
                    rolesConfirmed
                      ? 'border-green-700 text-green-500 bg-green-950/30 hover:bg-green-950/50 hover:border-green-500'
                      : allRolesAssigned(picks)
                        ? 'border-dota-accent text-dota-accent hover:bg-dota-accent/10'
                        : 'border-dota-border text-gray-500 hover:border-gray-500 hover:text-gray-300',
                  ].join(' ')}
                >
                  {rolesConfirmed ? '✓ Roles confirmed · Re-confirm' : 'Confirm Roles & Reanalyze'}
                </button>
                {!rolesConfirmed && (
                  <span className="text-[8px] text-gray-600">
                    {allRolesAssigned(picks) ? 'All roles assigned — click to update verdict' : 'Assign roles above to sharpen the verdict'}
                  </span>
                )}
              </div>

              {/* Team tags */}
              <TeamTags
                picks={picks.map(id => allHeroes.find(h => h.id === id)!).filter(Boolean)}
                team={team}
              />

              {/* Draft verdict card */}
              {rolesConfirmed && (
                <div className="flex items-center gap-1.5 text-[9px] text-green-600 font-bold">
                  <span>✓</span>
                  <span>Verdict reflects your assigned roles</span>
                </div>
              )}
              <DraftVerdictCard verdict={analysis.draftVerdict} />

              {/* Minute-by-minute execution plan */}
              <GamePlanTimelinePanel timeline={analysis.gamePlanTimeline} />

              {/* Free game check — who plays freely vs. is disrupted */}
              <HeroFreedomPanel freedom={analysis.heroFreedom} heroes={myHeroes} />

              {/* Rotations & draft health */}
              <DraftHealthPanel health={analysis.draftHealth} team={team} />

              {/* Lane predictions */}
              {analysis.draftVerdict.laneVerdict.predictions.length > 0 && (
                <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Lane Predictions</h4>
                  <LanePredictionsPanel predictions={analysis.draftVerdict.laneVerdict.predictions} team={team} />
                </div>
              )}

              {/* Items to build vs enemy */}
              <MatchupItemPanel myPicks={myHeroes} enemyPicks={enemyHeroes} />

              {/* Graded matchup scales */}
              <MatchupGradesPanel myPicks={myHeroes} enemyPicks={enemyHeroes} />

              {/* Typical item builds (OpenDota) */}
              <HeroBuildPanel heroes={myHeroes} />

              {/* Score breakdown */}
              <details>
                <summary className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer uppercase tracking-wider font-bold">
                  Score breakdown ({analysis.totalScore})
                </summary>
                <div className="flex flex-col gap-1.5 mt-2">
                  <ScoreBar label="Synergy" value={analysis.synergyScore} max={25} color="bg-purple-500" />
                  <ScoreBar label="Counter" value={analysis.counterScore} max={15} color="bg-orange-500" />
                  <ScoreBar label="Roles" value={analysis.roleBalanceScore} max={10} color="bg-blue-500" />
                  <ScoreBar label="Utility" value={analysis.utilityCoverageScore} max={10} color="bg-pink-500" />
                </div>
              </details>

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">Strengths</div>
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="text-[11px] text-green-300">+ {s}</div>
                  ))}
                </div>
              )}

              {/* Weaknesses */}
              {analysis.weaknesses.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">Weaknesses</div>
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} className="text-[11px] text-red-300">– {w}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
