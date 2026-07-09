import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import { loadItemConstants, getItemConstants } from '../data/heroBuildService';
import { itemIconUrl } from '../../../shared/items';
import type { ImportedPlayerStats } from '../data/matchImport';
import HeroPortrait from './HeroPortrait';

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ItemIcons({ itemIds }: { itemIds: number[] }) {
  const constants = getItemConstants();
  if (itemIds.length === 0) return <span className="text-[9px] text-gray-700">—</span>;
  return (
    <div className="flex gap-0.5">
      {itemIds.map((id, i) => {
        const c = constants?.[id];
        if (!c) return <span key={i} className="w-7 h-5 rounded-sm bg-dota-bg border border-dota-border" title={`item #${id}`} />;
        return (
          <img
            key={i}
            src={itemIconUrl(c.key)}
            alt={c.name}
            title={c.name}
            className="w-7 h-5 rounded-sm border border-dota-border object-cover bg-dota-bg"
            loading="lazy"
            onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
          />
        );
      })}
    </div>
  );
}

function TeamTable({ side, players }: { side: 'radiant' | 'dire'; players: ImportedPlayerStats[] }) {
  const heroes = useAppSelector(selectAllHeroes);
  const color = side === 'radiant' ? 'text-green-400' : 'text-red-400';
  return (
    <div className="min-w-0">
      <div className={['text-[10px] font-bold uppercase tracking-wider mb-1.5', color].join(' ')}>{side}</div>
      <div className="flex flex-col gap-1">
        {/* column header */}
        <div className="grid grid-cols-[8rem_3.5rem_2.5rem_2.5rem_1fr] gap-2 items-center text-[8px] text-gray-600 uppercase tracking-wide px-1">
          <span>Hero</span><span>K / D / A</span><span>GPM</span><span>XPM</span><span>Items</span>
        </div>
        {players.map((p, i) => {
          const hero = heroes.find(h => h.id === p.heroId);
          return (
            <div key={i} className="grid grid-cols-[8rem_3.5rem_2.5rem_2.5rem_1fr] gap-2 items-center bg-dota-bg/40 rounded px-1 py-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {hero && <HeroPortrait hero={hero} size="sm" />}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-gray-200 truncate">{hero?.displayName ?? `#${p.heroId}`}</span>
                  {p.playerName && <span className="text-[9px] text-gray-500 truncate">{p.playerName}</span>}
                </div>
              </div>
              <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">
                {p.kills} / <span className="text-red-400/80">{p.deaths}</span> / {p.assists}
              </span>
              <span className="text-[10px] text-amber-300/90">{p.gpm || '—'}</span>
              <span className="text-[10px] text-sky-300/90">{p.xpm || '—'}</span>
              <ItemIcons itemIds={p.itemIds} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Collapsible scoreboard for an imported real match — winner, per-hero K/D/A,
 * final items, GPM and XPM. Shown above the draft analysis; renders nothing
 * for hand-built drafts (importedMatch is null).
 */
export default function ImportedMatchPanel() {
  const info = useAppSelector(s => s.draft.importedMatch);
  const [open, setOpen] = useState(true);
  const [, setConstantsTick] = useState(0);

  // Resolve numeric item ids → names/icons; re-render once the map arrives.
  useEffect(() => {
    if (info && !getItemConstants()) {
      loadItemConstants().then(() => setConstantsTick(t => t + 1));
    }
  }, [info]);

  if (!info) return null;

  const radiant = info.players.filter(p => p.isRadiant);
  const dire = info.players.filter(p => !p.isRadiant);
  const winnerName = info.radiantWin
    ? (info.radiantTeamName ?? 'Radiant')
    : (info.direTeamName ?? 'Dire');

  return (
    <div className="bg-dota-surface rounded-xl border border-dota-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-dota-hover/30 rounded-xl transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 shrink-0">
            Imported Match
          </h3>
          <span className="text-[10px] text-gray-600">#{info.matchId}</span>
          <span className={['text-[11px] font-black uppercase tracking-wide', info.radiantWin ? 'text-green-400' : 'text-red-400'].join(' ')}>
            {winnerName} Victory
          </span>
          {info.radiantScore !== null && info.direScore !== null && (
            <span className="text-[10px] text-gray-400">
              <span className="text-green-400">{info.radiantScore}</span>
              <span className="text-gray-600"> : </span>
              <span className="text-red-400">{info.direScore}</span>
            </span>
          )}
          <span className="text-[10px] text-gray-500">{fmtDuration(info.durationSec)}</span>
          {info.leagueName && <span className="text-[9px] text-gray-600 truncate">{info.leagueName}</span>}
        </div>
        <span className="text-gray-600 text-xs shrink-0 ml-2">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-x-auto scrollbar-thin">
          <TeamTable side="radiant" players={radiant} />
          <TeamTable side="dire" players={dire} />
        </div>
      )}
    </div>
  );
}
