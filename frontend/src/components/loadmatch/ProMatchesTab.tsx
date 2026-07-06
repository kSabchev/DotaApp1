import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllHeroes } from '../../store/selectors';
import { loadDraft } from '../../store/draftSlice';
import { API_BASE } from '../../config';
import { apiFetch } from '../../data/backendStatus';
import { useGetProMatchesQuery, type OpenDotaMatch } from '../../services/api';
import { savedDraftFromMatch } from '../../data/matchImport';

function timeAgo(unixSec: number): string {
  const hours = Math.floor((Date.now() / 1000 - unixSec) / 3600);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Recent professional matches, one click to load the full CM draft. */
export default function ProMatchesTab({ onLoaded }: { onLoaded: () => void }) {
  const dispatch = useAppDispatch();
  const heroes = useAppSelector(selectAllHeroes);
  const { data: proMatches, isLoading, isError } = useGetProMatchesQuery();
  const [loadingMatch, setLoadingMatch] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMatch(matchId: number) {
    setLoadingMatch(matchId);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/matches/${matchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const match = (await res.json()) as OpenDotaMatch;
      dispatch(loadDraft(savedDraftFromMatch(match, heroes)));
      onLoaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load match');
    } finally {
      setLoadingMatch(null);
    }
  }

  if (isLoading) return <p className="text-gray-500 text-xs py-4 text-center">Loading pro matches…</p>;
  if (isError || !proMatches) return <p className="text-gray-500 text-xs py-4 text-center">Pro matches unavailable — is the backend running?</p>;

  return (
    <div className="flex flex-col gap-2">
      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/50 rounded p-2">{error}</div>}
      {proMatches.slice(0, 15).map(m => (
        <button
          key={m.match_id}
          onClick={() => loadMatch(m.match_id)}
          disabled={loadingMatch !== null}
          className="flex items-center gap-2 p-2 rounded border border-dota-border bg-dota-bg/40 hover:border-dota-accent/60 hover:bg-dota-bg transition-colors text-left disabled:opacity-50"
        >
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={['text-xs font-semibold truncate', m.radiant_win ? 'text-green-400' : 'text-gray-300'].join(' ')}>
                {m.radiant_name || 'Radiant'}
              </span>
              <span className="text-[10px] text-gray-600 shrink-0">vs</span>
              <span className={['text-xs font-semibold truncate', !m.radiant_win ? 'text-red-400' : 'text-gray-300'].join(' ')}>
                {m.dire_name || 'Dire'}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 truncate">
              {m.league_name || 'League match'} · {Math.round(m.duration / 60)} min · {timeAgo(m.start_time)}
            </span>
          </div>
          <span className="text-[10px] text-dota-accent font-bold shrink-0">
            {loadingMatch === m.match_id ? 'loading…' : 'load →'}
          </span>
        </button>
      ))}
    </div>
  );
}
