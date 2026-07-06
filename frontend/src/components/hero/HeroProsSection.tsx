import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllHeroes } from '../../store/selectors';
import { loadDraft } from '../../store/draftSlice';
import { API_BASE } from '../../config';
import { apiFetch, useBackendStatus } from '../../data/backendStatus';
import { fetchHeroPros, type HeroProEntry } from '../../data/heroProsService';
import { savedDraftFromMatch } from '../../data/matchImport';
import type { Hero } from '../../types';
import type { OpenDotaMatch } from '../../services/api';

function timeAgo(unixSec: number): string {
  const hours = Math.floor((Date.now() / 1000 - unixSec) / 3600);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Pro players to watch on this hero, with replay ids that load straight into the draft screen. */
export default function HeroProsSection({ hero }: { hero: Hero }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const heroes = useAppSelector(selectAllHeroes);
  const [pros, setPros] = useState<HeroProEntry[] | 'loading'>('loading');
  const [loadingMatch, setLoadingMatch] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backendStatus = useBackendStatus();

  useEffect(() => {
    let alive = true;
    setPros('loading');
    fetchHeroPros(hero.id).then(p => { if (alive) setPros(p); });
    return () => { alive = false; };
  }, [hero.id]);

  async function loadReplay(matchId: number) {
    setLoadingMatch(matchId);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/matches/${matchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const match = (await res.json()) as OpenDotaMatch;
      dispatch(loadDraft(savedDraftFromMatch(match, heroes)));
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load match');
    } finally {
      setLoadingMatch(null);
    }
  }

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-3">
        Pros to Watch · Recent Replays
      </h4>
      {pros === 'loading' && (
        <p className="text-[10px] text-gray-600">
          {backendStatus === 'waking'
            ? 'Backend is waking up (free hosting) — this can take up to a minute…'
            : 'Loading pro data…'}
        </p>
      )}
      {pros !== 'loading' && pros.length === 0 && (
        <p className="text-[10px] text-gray-600">No recent pro games on this hero — it may be out of the current pro meta.</p>
      )}
      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/50 rounded p-2 mb-2">{error}</div>}
      {pros !== 'loading' && pros.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {pros.map(p => (
            <div key={p.accountId} className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-col min-w-0 w-40 shrink-0">
                <span className="text-xs font-semibold text-gray-200 truncate">{p.playerName}</span>
                {p.teamName && <span className="text-[10px] text-gray-500 truncate">{p.teamName}</span>}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {p.recentMatches.map(m => (
                  <button
                    key={m.matchId}
                    onClick={() => loadReplay(m.matchId)}
                    disabled={loadingMatch !== null}
                    title={`Load the draft of match ${m.matchId} (${timeAgo(m.startTime)})`}
                    className={[
                      'text-[9px] px-1.5 py-0.5 rounded border font-bold transition-colors',
                      m.win
                        ? 'border-green-800/60 text-green-400 hover:bg-green-950/40'
                        : 'border-red-900/60 text-red-400 hover:bg-red-950/40',
                      loadingMatch === m.matchId ? 'opacity-50' : '',
                    ].join(' ')}
                  >
                    {loadingMatch === m.matchId ? 'loading…' : `${m.win ? 'W' : 'L'} · ${m.matchId}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[9px] text-gray-600">Click a match id to load its draft into the analyzer.</p>
        </div>
      )}
    </div>
  );
}
