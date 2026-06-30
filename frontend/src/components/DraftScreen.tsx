import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectDraft, selectRadiantPicks, selectDirePicks, selectAvailableHeroes, selectAllHeroes } from '../store/selectors';
import { undoLastPick, resetDraft, setMode, setBansEnabled, setStartingTeam } from '../store/draftSlice';
import { analyzeTeam, pickContextForTeam, rankBanThreats, type BanThreat } from '../utils/scoring';
import { useMatchupVersion } from '../data/useMatchupVersion';
import TeamPanel from './TeamPanel';
import BanPanel from './BanPanel';
import HeroGrid, { type GridAnnotation } from './HeroGrid';
import TurnCard from './TurnCard';
import AnalysisPanel from './AnalysisPanel';
import ComparisonPanel from './ComparisonPanel';
import DraftRoleBoard from './DraftRoleBoard';
import DraftSummary from './DraftSummary';
import DraftImport from './DraftImport';
import SaveDraftModal from './SaveDraftModal';
import DraftHistoryPanel from './DraftHistoryPanel';
import ItemTablePanel from './ItemTablePanel';
import type { Role } from '../types';

export default function DraftScreen() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const { slots, currentSlotIndex, mode, phase, history, bansEnabled, startingTeam } = draft;
  const [showImport, setShowImport] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const radiantPicks = useAppSelector(selectRadiantPicks);
  const direPicks = useAppSelector(selectDirePicks);
  const availableHeroes = useAppSelector(selectAvailableHeroes);
  const allHeroes = useAppSelector(selectAllHeroes);
  const roleAssignments = useAppSelector(s => s.draft.roleAssignments) as Record<number, Role>;
  const availableIds = availableHeroes.map(h => h.id);

  // Draft-position context per team (drives timing-aware suggestions + turn card).
  const radiantCtx = useMemo(() => pickContextForTeam(slots, 'radiant', currentSlotIndex), [slots, currentSlotIndex]);
  const direCtx = useMemo(() => pickContextForTeam(slots, 'dire', currentSlotIndex), [slots, currentSlotIndex]);

  // Live OpenDota win-rates blended into matchup advantage; recompute as data loads.
  const matchupVersion = useMatchupVersion([...radiantPicks, ...direPicks]);

  const radiantAnalysis = useMemo(
    () => analyzeTeam(radiantPicks, direPicks, availableIds, allHeroes, roleAssignments, radiantCtx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radiantPicks.join(','), direPicks.join(','), availableIds.join(','), allHeroes.length, JSON.stringify(roleAssignments), JSON.stringify(radiantCtx), matchupVersion],
  );
  const direAnalysis = useMemo(
    () => analyzeTeam(direPicks, radiantPicks, availableIds, allHeroes, roleAssignments, direCtx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direPicks.join(','), radiantPicks.join(','), availableIds.join(','), allHeroes.length, JSON.stringify(roleAssignments), JSON.stringify(direCtx), matchupVersion],
  );

  // Active turn → grid annotations + the single "next action" card.
  const currentSlot = slots[currentSlotIndex];
  const activeAnalysis = currentSlot?.team === 'dire' ? direAnalysis : radiantAnalysis;
  const activeCtx = currentSlot?.team === 'dire' ? direCtx : radiantCtx;

  // Ban slots use the richer threat ranking (same source as the Threats panel).
  const banThreats = useMemo<BanThreat[]>(() => {
    if (phase !== 'drafting' || currentSlot?.phase !== 'ban') return [];
    const my = currentSlot.team === 'radiant' ? radiantPicks : direPicks;
    const enemy = currentSlot.team === 'radiant' ? direPicks : radiantPicks;
    return rankBanThreats(my, enemy, availableIds, allHeroes, activeAnalysis.draftVerdict.primaryWinCondition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSlotIndex, radiantPicks.join(','), direPicks.join(','), availableIds.join(','), allHeroes.length]);

  const gridAnnotations = useMemo(() => {
    const map = new Map<number, GridAnnotation>();
    if (phase !== 'drafting' || !currentSlot) return map;
    if (currentSlot.phase === 'pick') {
      activeAnalysis.recommendedPicks.forEach((r, i) => map.set(r.heroId, { kind: 'recommend', rank: i + 1, timing: r.timing }));
    } else {
      banThreats.forEach((t, i) => map.set(t.heroId, { kind: 'threat', rank: i + 1 }));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSlotIndex, activeAnalysis, banThreats]);

  // The grid highlights every suggestion; the card just announces the turn + count.
  const turn = useMemo(() => {
    if (phase !== 'drafting' || !currentSlot || gridAnnotations.size === 0) return null;
    return { action: currentSlot.phase as 'ban' | 'pick', team: currentSlot.team, count: gridAnnotations.size };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSlotIndex, gridAnnotations]);

  const radiantPickIndices = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.phase === 'pick' && s.team === 'radiant')
    .map(({ i }) => i);

  const direPickIndices = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.phase === 'pick' && s.team === 'dire')
    .map(({ i }) => i);

  return (
    <div className="flex flex-col h-screen bg-dota-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dota-border bg-dota-surface shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-dota-accent font-black text-lg tracking-tight">DOTA 2</span>
          <span className="text-gray-500 font-semibold text-sm">Draft Analyzer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-dota-border overflow-hidden text-xs">
            <button
              onClick={() => dispatch(setMode('captains'))}
              className={['px-2.5 py-1 font-medium transition-colors', mode === 'captains' ? 'bg-dota-accent text-dota-bg' : 'text-gray-400 hover:text-gray-200'].join(' ')}
            >
              Captains Mode
            </button>
            <button
              onClick={() => dispatch(setMode('manual'))}
              className={['px-2.5 py-1 font-medium transition-colors', mode === 'manual' ? 'bg-dota-accent text-dota-bg' : 'text-gray-400 hover:text-gray-200'].join(' ')}
            >
              Manual
            </button>
          </div>
          {/* Starting team */}
          <div className="flex rounded border border-dota-border overflow-hidden text-xs">
            <button
              onClick={() => dispatch(setStartingTeam('radiant'))}
              className={['px-2.5 py-1 font-medium transition-colors', startingTeam === 'radiant' ? 'bg-green-800 text-green-200' : 'text-gray-400 hover:text-gray-200'].join(' ')}
              title="Radiant gets first ban"
            >
              ⬤ Radiant First
            </button>
            <button
              onClick={() => dispatch(setStartingTeam('dire'))}
              className={['px-2.5 py-1 font-medium transition-colors', startingTeam === 'dire' ? 'bg-red-900 text-red-200' : 'text-gray-400 hover:text-gray-200'].join(' ')}
              title="Dire gets first ban"
            >
              ⬤ Dire First
            </button>
          </div>
          {mode === 'manual' && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-400 hover:text-gray-200 transition-colors">
              <input
                type="checkbox"
                checked={bansEnabled}
                onChange={e => dispatch(setBansEnabled(e.target.checked))}
                className="w-3.5 h-3.5 accent-dota-accent cursor-pointer"
              />
              Bans
            </label>
          )}
          <button
            onClick={() => dispatch(undoLastPick())}
            disabled={history.length === 0}
            className="px-3 py-1 rounded border border-dota-border text-xs text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1 rounded border border-dota-border text-xs text-gray-400 hover:text-dota-accent transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => setShowItems(true)}
            className="px-3 py-1 rounded border border-dota-border text-xs text-gray-400 hover:text-cyan-400 transition-colors"
          >
            Items
          </button>
          <button
            onClick={() => setShowSave(true)}
            className="px-3 py-1 rounded border border-dota-border text-xs text-gray-400 hover:text-green-400 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1 rounded border border-dota-border text-xs text-gray-400 hover:text-blue-400 transition-colors"
          >
            History
          </button>
          <button
            onClick={() => dispatch(resetDraft())}
            className="px-3 py-1 rounded border border-dota-border text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      {showImport && <DraftImport onClose={() => setShowImport(false)} />}
      {showSave && <SaveDraftModal onClose={() => setShowSave(false)} />}
      {showHistory && <DraftHistoryPanel onClose={() => setShowHistory(false)} />}
      {showItems && <ItemTablePanel onClose={() => setShowItems(false)} />}

      {phase === 'complete' ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between px-6 pt-4">
            <h2 className="text-green-400 font-semibold">Draft Complete</h2>
            <button
              onClick={() => dispatch(resetDraft())}
              className="px-4 py-1.5 rounded bg-dota-accent text-dota-bg text-xs font-bold hover:opacity-90 transition-opacity"
            >
              New Draft
            </button>
          </div>
          <DraftSummary />
        </div>
      ) : (
        /* Main 3-column layout */
        <div className="flex flex-1 overflow-hidden gap-0">
          {/* Left: Radiant team + Radiant analysis */}
          <div className="w-64 shrink-0 flex flex-col gap-2 p-3 border-r border-dota-border overflow-y-auto scrollbar-thin">
            <TeamPanel
              team="radiant"
              slots={slots}
              currentSlotIndex={currentSlotIndex}
              slotIndices={radiantPickIndices}
            />
            <div className="border-t border-dota-border pt-2">
              <AnalysisPanel team="radiant" />
            </div>
          </div>

          {/* Center: Bans + Hero Grid + Live Comparison */}
          <div className="flex-1 flex flex-col gap-2 p-3 overflow-hidden">
            {/* Single "next action" turn card */}
            {turn && (
              <TurnCard
                action={turn.action}
                team={turn.team}
                count={turn.count}
                pickContext={activeCtx}
              />
            )}
            {(mode === 'captains' || bansEnabled) && (
              <BanPanel slots={slots} currentSlotIndex={currentSlotIndex} />
            )}
            <div className="flex-1 overflow-hidden">
              <HeroGrid annotations={gridAnnotations} />
            </div>
            {(radiantPicks.length > 0 || direPicks.length > 0) && (
              <div className="shrink-0 border-t border-dota-border pt-2 flex flex-col gap-2 overflow-y-auto scrollbar-thin">
                <DraftRoleBoard radiantPickIds={radiantPicks} direPickIds={direPicks} />
                {radiantPicks.length >= 4 && direPicks.length >= 4 && (
                  <div className="border-t border-dota-border/50 pt-2">
                    <ComparisonPanel
                      radiantPickIds={radiantPicks}
                      direPickIds={direPicks}
                      radiantAnalysis={radiantAnalysis}
                      direAnalysis={direAnalysis}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Dire team + Dire analysis */}
          <div className="w-64 shrink-0 border-l border-dota-border overflow-y-auto scrollbar-thin flex flex-col gap-2 p-3">
            <TeamPanel
              team="dire"
              slots={slots}
              currentSlotIndex={currentSlotIndex}
              slotIndices={direPickIndices}
            />
            <div className="border-t border-dota-border pt-2">
              <AnalysisPanel team="dire" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
