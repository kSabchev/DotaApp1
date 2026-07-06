import { useMemo, Fragment, type ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectRadiantPicks, selectDirePicks, selectAvailableHeroes, selectAllHeroes } from '../store/selectors';
import { analyzeTeam, pickContextForTeam } from '../utils/scoring';
import { useMatchupVersion } from '../data/useMatchupVersion';
import ScoreBar from './ScoreBar';
import HeroPortrait from './HeroPortrait';
import TeamTags from './TeamTags';
import DraftVerdictCard from './DraftVerdictCard';
import LanePredictionsPanel from './LanePredictionsPanel';
import BanThreatsPanel from './BanThreatsPanel';
import MatchupItemPanel from './MatchupItemPanel';
import MatchupGradesPanel from './MatchupGradesPanel';
import TeamIdentityPanel from './TeamIdentityPanel';
import Section from './Section';
import { ROLE_LABEL } from './RolePicker';
import type { Role } from '../types';

interface Props {
  team: 'radiant' | 'dire';
}

export default function AnalysisPanel({ team }: Props) {
  const radiantPicks = useAppSelector(selectRadiantPicks);
  const direPicks = useAppSelector(selectDirePicks);
  const availableHeroes = useAppSelector(selectAvailableHeroes);
  const allHeroes = useAppSelector(selectAllHeroes);
  const roleAssignments = useAppSelector(s => s.draft.roleAssignments) as Record<number, Role>;
  const slots = useAppSelector(s => s.draft.slots);
  const currentSlotIndex = useAppSelector(s => s.draft.currentSlotIndex);
  const availableIds = availableHeroes.map(h => h.id);

  const myPicks = team === 'radiant' ? radiantPicks : direPicks;
  const enemyPicks = team === 'radiant' ? direPicks : radiantPicks;

  const pickContext = useMemo(
    () => pickContextForTeam(slots, team, currentSlotIndex),
    [slots, currentSlotIndex, team],
  );
  const isMyTurn = slots[currentSlotIndex]?.phase === 'pick' && slots[currentSlotIndex]?.team === team;

  // This team's next move in the sequence — drives whether picks or bans lead.
  const nextMove = useMemo<'pick' | 'ban' | null>(() => {
    for (let i = currentSlotIndex; i < slots.length; i++) {
      const s = slots[i];
      if (s.team === team && s.heroId === null) return s.phase;
    }
    return null;
  }, [slots, currentSlotIndex, team]);

  // Live OpenDota win-rates blended into matchup advantage; recompute as data loads.
  const matchupVersion = useMatchupVersion([...myPicks, ...enemyPicks]);

  const analysis = useMemo(
    () => analyzeTeam(myPicks, enemyPicks, availableIds, allHeroes, roleAssignments, pickContext),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myPicks.join(','), enemyPicks.join(','), availableIds.join(','), allHeroes.length, JSON.stringify(roleAssignments), JSON.stringify(pickContext), matchupVersion],
  );

  const totalMax = 25 + 15 + 10 + 10 + 10 + 10 + 10;
  const hasPicks = myPicks.length > 0;
  const myHeroes = myPicks.map(id => allHeroes.find(h => h.id === id)!).filter(Boolean);
  const enemyHeroes = enemyPicks.map(id => allHeroes.find(h => h.id === id)!).filter(Boolean);
  const midMatchups = analysis.laneMatchups.filter(m => m.isMid);
  const laneMatchups = analysis.laneMatchups.filter(m => !m.isMid);

  // ── Section nodes (null = not shown) ──────────────────────────────────────────
  const nodes: Record<string, ReactNode> = {
    threatsToBan: (
      <Section title="Threats to Ban" accent="text-red-500">
        <BanThreatsPanel activeTeam={team} />
      </Section>
    ),

    draftVerdict: hasPicks ? <DraftVerdictCard verdict={analysis.draftVerdict} /> : null,

    teamIdentity: myPicks.length >= 2 ? <TeamIdentityPanel identity={analysis.identity} /> : null,

    itemsToBuild: hasPicks ? <MatchupItemPanel myPicks={myHeroes} enemyPicks={enemyHeroes} /> : null,

    matchupGrades: hasPicks ? <MatchupGradesPanel myPicks={myHeroes} enemyPicks={enemyHeroes} /> : null,

    lanePredictions: hasPicks && analysis.draftVerdict.laneVerdict.predictions.length > 0 ? (
      <Section title="Lane Predictions">
        <LanePredictionsPanel predictions={analysis.draftVerdict.laneVerdict.predictions} team={team} />
      </Section>
    ) : null,

    scoreBreakdown: hasPicks ? (
      <details className="group bg-dota-surface rounded-lg border border-dota-border">
        <summary className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer select-none uppercase tracking-wider font-bold px-3 py-2">
          Score breakdown ({analysis.totalScore}/{totalMax})
        </summary>
        <div className="flex flex-col gap-2 px-3 pb-3">
          <ScoreBar label="Synergy" value={analysis.synergyScore} max={25} color="bg-purple-500" />
          <ScoreBar label="Counter" value={analysis.counterScore} max={15} color="bg-orange-500" />
          <ScoreBar label="Lane" value={analysis.laneScore} max={10} color="bg-yellow-500" />
          <ScoreBar label="Roles" value={analysis.roleBalanceScore} max={10} color="bg-blue-500" />
          <ScoreBar label="Timing" value={analysis.timingScore} max={10} color="bg-cyan-500" />
          <ScoreBar label="Objectives" value={analysis.objectiveScore} max={10} color="bg-emerald-500" />
          <ScoreBar label="Utility" value={analysis.utilityCoverageScore} max={10} color="bg-pink-500" />
        </div>
      </details>
    ) : null,

    comboSynergies: hasPicks && analysis.synergyPairs.length > 0 ? (
      <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Combo Synergies</h4>
        <div className="flex flex-col gap-2">
          {analysis.synergyPairs.slice(0, 4).map((pair, i) => {
            const h1 = allHeroes.find(h => h.id === pair.heroIds[0]);
            const h2 = allHeroes.find(h => h.id === pair.heroIds[1]);
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex gap-1 shrink-0">
                  {h1 && <HeroPortrait hero={h1} size="sm" />}
                  {h2 && <HeroPortrait hero={h2} size="sm" />}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-bold">{pair.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    ) : null,

    physicalStack: hasPicks && analysis.physicalStackScore >= 2 ? (
      <div className="bg-orange-950/30 rounded-lg border border-orange-900/50 p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-1">
          Physical Stack {analysis.physicalStackScore === 3 ? '⚠ Strong' : ''}
        </h4>
        <p className="text-[10px] text-orange-200">
          Armor reduction hero + right-click cores. Prioritize armor-shred items. Ban enemy armor stackers.
        </p>
      </div>
    ) : null,

    midMatchup: hasPicks && midMatchups.length > 0 ? (
      <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Mid Matchup</h4>
        {midMatchups.slice(0, 3).map((m, i) => {
          const hero = allHeroes.find(h => h.id === m.heroId);
          const enemy = allHeroes.find(h => h.id === m.enemyHeroId);
          const color = m.advantage > 0 ? 'text-green-400' : 'text-red-400';
          return (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="flex items-center gap-1 shrink-0">
                {hero && <HeroPortrait hero={hero} size="sm" />}
                <span className={['text-sm font-black', color].join(' ')}>{m.advantage > 0 ? '▲' : '▼'}</span>
                {enemy && <HeroPortrait hero={enemy} size="sm" />}
              </div>
              <p className="text-[10px] text-gray-400 leading-tight flex-1">{m.note}</p>
              {m.dataBacked && (
                <span className="shrink-0 self-center text-[8px] font-bold uppercase tracking-wide text-emerald-400/80"
                      title="Backed by live OpenDota win-rate data">● live</span>
              )}
            </div>
          );
        })}
      </div>
    ) : null,

    laneMatchups: hasPicks && laneMatchups.length > 0 ? (
      <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 mb-2">Lane Matchups</h4>
        {laneMatchups.slice(0, 3).map((m, i) => {
          const hero = allHeroes.find(h => h.id === m.heroId);
          const enemy = allHeroes.find(h => h.id === m.enemyHeroId);
          const color = m.advantage > 0 ? 'text-green-400' : 'text-red-400';
          return (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 shrink-0">
                {hero && <HeroPortrait hero={hero} size="sm" />}
                <span className={['text-xs font-bold', color].join(' ')}>{m.advantage > 0 ? '+' : ''}{m.advantage}</span>
                {enemy && <HeroPortrait hero={enemy} size="sm" />}
              </div>
              <p className="text-[10px] text-gray-500 leading-tight truncate flex-1">{m.note}</p>
              {m.dataBacked && (
                <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-emerald-400/80"
                      title="Backed by live OpenDota win-rate data">● live</span>
              )}
            </div>
          );
        })}
      </div>
    ) : null,

    strengths: hasPicks && analysis.strengths.length > 0 ? (
      <div className="bg-green-950/30 rounded-lg border border-green-900/50 p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-500 mb-1.5">Strengths</h4>
        <ul className="flex flex-col gap-1">
          {analysis.strengths.map((s, i) => (
            <li key={i} className="text-xs text-green-300 flex gap-1.5"><span className="text-green-600 mt-0.5">+</span><span>{s}</span></li>
          ))}
        </ul>
      </div>
    ) : null,

    weaknesses: hasPicks && analysis.weaknesses.length > 0 ? (
      <div className="bg-red-950/30 rounded-lg border border-red-900/50 p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">Weaknesses</h4>
        <ul className="flex flex-col gap-1">
          {analysis.weaknesses.map((w, i) => (
            <li key={i} className="text-xs text-red-300 flex gap-1.5"><span className="text-red-600 mt-0.5">–</span><span>{w}</span></li>
          ))}
        </ul>
      </div>
    ) : null,

    teamProfile: hasPicks ? (
      <Section title="Team Profile">
        <TeamTags picks={myHeroes} team={team} />
      </Section>
    ) : null,

    missingUtility: hasPicks && analysis.missingUtility.length > 0 ? (
      <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Missing Utility</h4>
        <div className="flex gap-1 flex-wrap">
          {analysis.missingUtility.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-800/50">
              {tag.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    ) : null,

    suggestedPicks: analysis.recommendedPicks.length > 0 ? (
      <Section
        title="Suggested Picks"
        headerExtra={analysis.draftVerdict.laneVerdict.missingRoles.length > 0 ? (
          <span className="text-[8px] font-bold text-amber-400/90">
            still need: {analysis.draftVerdict.laneVerdict.missingRoles.map(r => ROLE_LABEL[r]).join(', ')}
          </span>
        ) : undefined}
      >
        {isMyTurn && pickContext && (
          <div className={[
            'text-[9px] font-bold mb-2 px-2 py-1 rounded border',
            pickContext.enemyPicksAfter === 0
              ? 'text-green-300 border-green-800/60 bg-green-950/30'
              : pickContext.enemyPicksAfter >= 3
                ? 'text-sky-300 border-sky-800/50 bg-sky-950/20'
                : 'text-gray-400 border-dota-border bg-dota-bg/40',
          ].join(' ')}>
            {pickContext.enemyPicksAfter === 0
              ? `🔓 ${pickContext.isMyLastPick ? 'Last pick' : 'Safest pick'} — free game; commit your most counterable hero`
              : pickContext.isMyLastPick
                ? `Your last pick — commit now (${pickContext.enemyPicksAfter} enemy pick${pickContext.enemyPicksAfter === 1 ? '' : 's'} can still respond)`
                : pickContext.enemyPicksAfter >= 3
                  ? `Early pick — favour safe/flexible heroes (${pickContext.enemyPicksAfter} enemy picks can still respond)`
                  : `${pickContext.enemyPicksAfter} enemy pick${pickContext.enemyPicksAfter === 1 ? '' : 's'} can still respond to this pick`}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {analysis.recommendedPicks.map(rec => {
            const hero = allHeroes.find(h => h.id === rec.heroId);
            if (!hero) return null;
            return (
              <div key={rec.heroId} className="flex gap-2 items-start">
                <HeroPortrait hero={hero} size="sm" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-200">{hero.displayName}</span>
                    {rec.tag && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">{rec.tag}</span>}
                    {rec.timing === 'commit_now' && <span className="text-[8px] px-1 py-0.5 rounded bg-green-900/60 text-green-300 font-bold">commit now</span>}
                    {rec.timing === 'save_for_later' && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold">save for last</span>}
                  </div>
                  {rec.reasons.slice(0, 3).map((r, i) => (
                    <span key={i} className="text-[10px] text-gray-500 leading-tight">{r}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    ) : null,
  };

  // ── Ordering: suggestions lead; on a ban turn, ban threats lead ───────────────
  const base = [
    'threatsToBan', 'draftVerdict', 'teamIdentity', 'itemsToBuild', 'matchupGrades', 'lanePredictions',
    'scoreBreakdown', 'comboSynergies', 'physicalStack', 'midMatchup', 'laneMatchups',
    'strengths', 'weaknesses', 'teamProfile', 'missingUtility', 'suggestedPicks',
  ];
  const priority = nextMove === 'ban'
    ? ['threatsToBan', 'suggestedPicks']
    : ['suggestedPicks'];
  const order = [...priority, ...base.filter(k => !priority.includes(k))];

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto scrollbar-thin">
      {order.map(key => <Fragment key={key}>{nodes[key]}</Fragment>)}
      {!hasPicks && (
        <p className="text-gray-600 text-[10px] text-center py-2">Pick heroes for the full draft analysis.</p>
      )}
    </div>
  );
}
