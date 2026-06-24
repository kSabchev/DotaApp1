import { useMemo, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectRadiantPicks, selectDirePicks, selectAvailableHeroes, selectAllHeroes, selectCurrentSlot } from '../store/selectors';
import { rankBanThreats, type BanThreatUrgency } from '../utils/scoring';
import { analyzeTeam } from '../utils/scoring';
import { primeMatchups } from '../data/matchupService';
import { getHeroMeta, TIER_LABEL, TIER_COLOR } from '../data/metaService';
import HeroPortrait from './HeroPortrait';
import type { Role } from '../types';

const URGENCY_STYLES: Record<BanThreatUrgency, { border: string; bg: string; badge: string; label: string }> = {
  critical: { border: 'border-red-600',    bg: 'bg-red-950/30',    badge: 'bg-red-800 text-red-100',    label: 'Must Ban' },
  high:     { border: 'border-orange-700', bg: 'bg-orange-950/20', badge: 'bg-orange-800 text-orange-100', label: 'High' },
  medium:   { border: 'border-gray-700',   bg: 'bg-dota-surface',  badge: 'bg-gray-700 text-gray-300',   label: 'Consider' },
};

interface Props {
  activeTeam: 'radiant' | 'dire';
}

export default function BanThreatsPanel({ activeTeam }: Props) {
  const radiantPicks = useAppSelector(selectRadiantPicks);
  const direPicks = useAppSelector(selectDirePicks);
  const availableHeroes = useAppSelector(selectAvailableHeroes);
  const allHeroes = useAppSelector(selectAllHeroes);
  const currentSlot = useAppSelector(selectCurrentSlot);
  const roleAssignments = useAppSelector(s => s.draft.roleAssignments) as Record<number, Role>;

  const myPicks = activeTeam === 'radiant' ? radiantPicks : direPicks;
  const enemyPicks = activeTeam === 'radiant' ? direPicks : radiantPicks;
  const availableIds = availableHeroes.map(h => h.id);

  // Prime API matchup data for current picks in background
  useEffect(() => {
    if (myPicks.length > 0) primeMatchups(myPicks);
  }, [myPicks.join(',')]);

  const isBanSlot = currentSlot?.phase === 'ban';

  // Get current win condition for context-aware threats
  const winCon = useMemo(() => {
    if (myPicks.length === 0) return undefined;
    const analysis = analyzeTeam(myPicks, enemyPicks, availableIds, allHeroes, roleAssignments);
    return analysis.draftVerdict.primaryWinCondition.strength > 0
      ? analysis.draftVerdict.primaryWinCondition
      : undefined;
  }, [myPicks.join(','), enemyPicks.join(','), allHeroes.length]);

  const threats = useMemo(
    () => rankBanThreats(myPicks, enemyPicks, availableIds, allHeroes, winCon),
    [myPicks.join(','), enemyPicks.join(','), availableIds.join(','), allHeroes.length, winCon?.id],
  );

  if (threats.length === 0) {
    return (
      <div className="text-[10px] text-gray-600 text-center py-3">
        {myPicks.length === 0
          ? 'Pick or ban heroes to see threats'
          : 'No significant threats detected yet'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {isBanSlot && (
        <p className="text-[10px] text-dota-accent font-bold uppercase tracking-wider mb-1">
          ← Ban one of these now
        </p>
      )}
      {threats.map((threat, idx) => {
        const hero = allHeroes.find(h => h.id === threat.heroId);
        if (!hero) return null;
        const style = URGENCY_STYLES[threat.urgency];
        const meta = getHeroMeta(hero.id);
        const tierLabel = meta ? TIER_LABEL[meta.tier] : '';
        const tierColor = meta ? TIER_COLOR[meta.tier] : '';
        return (
          <div key={threat.heroId} className={['rounded-lg border p-2 flex gap-2 items-start', style.border, style.bg].join(' ')}>
            {/* Rank number */}
            <span className="text-[10px] font-black text-gray-600 w-4 shrink-0 mt-0.5">{idx + 1}.</span>

            {/* Portrait */}
            <div className="shrink-0">
              <HeroPortrait hero={hero} size="sm" />
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-100 truncate">{hero.displayName}</span>
                <span className={['text-[8px] px-1 py-0.5 rounded font-bold shrink-0', style.badge].join(' ')}>
                  {style.label}
                </span>
                {tierLabel && (
                  <span className={['text-[8px] px-1 py-0.5 rounded font-black shrink-0', tierColor].join(' ')}>
                    {tierLabel}
                  </span>
                )}
              </div>
              {meta && meta.tier !== 'normal' && (
                <p className="text-[9px] text-amber-400/80 leading-tight">
                  Immortal: {Math.round(meta.highWinRate * 100)}% wr · {Math.round(meta.highPickRate * 100)}% rel. pick
                </p>
              )}
              {threat.reasons.slice(0, 2).map((r, i) => (
                <p key={i} className="text-[9px] text-gray-400 leading-tight">{r}</p>
              ))}
              {threat.winRateNote && !threat.reasons.includes(threat.winRateNote) && (
                <p className="text-[9px] text-blue-400/70 leading-tight">📊 {threat.winRateNote}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
