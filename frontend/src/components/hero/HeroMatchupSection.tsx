import { useMemo } from 'react';
import type { Hero } from '../../types';
import { INTERACTIONS } from '../../../../shared/interactions';
import { useMatchupVersion } from '../../data/useMatchupVersion';
import { getMatchupRowsFor } from '../../data/matchupService';
import HeroPortrait from '../HeroPortrait';

interface Row {
  enemy: Hero;
  score: number;      // positive = good for THIS hero
  note: string;
}

function RowList({ title, color, rows }: { title: string; color: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${color}`}>{title}</h5>
      <div className="flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <HeroPortrait hero={r.enemy} size="sm" />
            <span className={['text-xs font-bold shrink-0 w-7', r.score > 0 ? 'text-green-400' : 'text-red-400'].join(' ')}>
              {r.score > 0 ? '+' : ''}{r.score}
            </span>
            <p className="text-[10px] text-gray-500 leading-tight flex-1">{r.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Curated lane/game matchups + live win-rate best/worst for one hero. */
export default function HeroMatchupSection({ hero, heroes }: { hero: Hero; heroes: Hero[] }) {
  const matchupVersion = useMatchupVersion([hero.id]);
  const byId = (id: number) => heroes.find(h => h.id === id);

  const curated = useMemo(() => {
    const winsLane: Row[] = [];
    const losesLane: Row[] = [];
    const counters: Row[] = [];
    const counteredBy: Row[] = [];

    for (const it of INTERACTIONS) {
      if (it.heroId === hero.id) {
        const enemy = byId(it.targetHeroId);
        if (!enemy) continue;
        const note = it.laneNote ?? it.midMatchupNote ?? it.reason;
        if (it.laneMatchupScore !== undefined && it.laneMatchupScore !== 0) {
          (it.laneMatchupScore > 0 ? winsLane : losesLane).push({ enemy, score: it.laneMatchupScore, note });
        }
        if ((it.counterScore ?? 0) >= 6) {
          counters.push({ enemy, score: it.counterScore!, note: it.reason });
        }
      } else if (it.targetHeroId === hero.id) {
        const enemy = byId(it.heroId);
        if (!enemy) continue;
        const note = it.laneNote ?? it.midMatchupNote ?? it.reason;
        // laneMatchupScore is from the OTHER hero's perspective — invert.
        if (it.laneMatchupScore !== undefined && it.laneMatchupScore !== 0) {
          (it.laneMatchupScore < 0 ? winsLane : losesLane).push({ enemy, score: -it.laneMatchupScore, note });
        }
        if ((it.counterScore ?? 0) >= 6) {
          counteredBy.push({ enemy, score: -it.counterScore!, note: it.reason });
        }
      }
    }

    const bySeverity = (a: Row, b: Row) => Math.abs(b.score) - Math.abs(a.score);
    return {
      winsLane: winsLane.sort(bySeverity).slice(0, 5),
      losesLane: losesLane.sort(bySeverity).slice(0, 5),
      counters: counters.sort(bySeverity).slice(0, 5),
      counteredBy: counteredBy.sort(bySeverity).slice(0, 5),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero.id, heroes.length]);

  const live = useMemo(() => {
    const rows = getMatchupRowsFor(hero.id);
    if (!rows) return null;
    const mapped = rows
      .map(r => ({ enemy: byId(r.enemyId), advantage: r.advantage }))
      .filter((r): r is { enemy: Hero; advantage: number } => Boolean(r.enemy) && r.advantage !== 0);
    const sorted = [...mapped].sort((a, b) => b.advantage - a.advantage);
    return {
      best: sorted.slice(0, 5),
      worst: sorted.slice(-5).reverse(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero.id, heroes.length, matchupVersion]);

  const hasCurated = curated.winsLane.length + curated.losesLane.length + curated.counters.length + curated.counteredBy.length > 0;

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-4 flex flex-col gap-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">Matchups</h4>

      {hasCurated ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RowList title="Wins lane against" color="text-green-500" rows={curated.winsLane} />
          <RowList title="Loses lane against" color="text-red-500" rows={curated.losesLane} />
          <RowList title="Counters (game)" color="text-green-500" rows={curated.counters} />
          <RowList title="Countered by (game)" color="text-red-500" rows={curated.counteredBy} />
        </div>
      ) : (
        <p className="text-[10px] text-gray-600">No hand-curated matchup notes for this hero yet — live data below.</p>
      )}

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live win rates</h5>
          <span className="text-[8px] font-bold uppercase tracking-wide text-emerald-400/80"
                title="Backed by live OpenDota win-rate data">● live</span>
        </div>
        {!live ? (
          <p className="text-[10px] text-gray-600">Loading live matchup data…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-green-500 mb-1.5">Strong against</h5>
              <div className="flex flex-col gap-1.5">
                {live.best.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <HeroPortrait hero={r.enemy} size="sm" />
                    <span className="text-xs text-gray-300">{r.enemy.displayName}</span>
                    <span className="text-xs font-bold text-green-400 ml-auto">+{r.advantage}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">Weak against</h5>
              <div className="flex flex-col gap-1.5">
                {live.worst.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <HeroPortrait hero={r.enemy} size="sm" />
                    <span className="text-xs text-gray-300">{r.enemy.displayName}</span>
                    <span className="text-xs font-bold text-red-400 ml-auto">{r.advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
