import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllHeroes } from '../../store/selectors';
import { loadDraft } from '../../store/draftSlice';
import { API_BASE } from '../../config';
import { apiFetch, useBackendStatus } from '../../data/backendStatus';
import { getPlayerIdentity, setPlayerIdentity, clearPlayerIdentity, type PlayerIdentity } from '../../data/playerIdentity';
import { fetchRecentMatches, type RecentMatchSummary } from '../../data/playerMatchesService';
import { savedDraftFromMatch } from '../../data/matchImport';
import type { OpenDotaMatch } from '../../services/api';
import HeroPortrait from '../HeroPortrait';

function timeAgo(unixSec: number): string {
  const mins = Math.floor((Date.now() / 1000 - unixSec) / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Enter your Dota Friend ID once; load any of your last 10 games with one click. */
export default function MyGamesTab({ onLoaded }: { onLoaded: () => void }) {
  const dispatch = useAppDispatch();
  const heroes = useAppSelector(selectAllHeroes);
  const [identity, setIdentity] = useState<PlayerIdentity | null>(() => getPlayerIdentity());
  const [idInput, setIdInput] = useState('');
  const [matches, setMatches] = useState<RecentMatchSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backendStatus = useBackendStatus();

  useEffect(() => {
    if (!identity) return;
    setLoading(true);
    setError(null);
    fetchRecentMatches(identity.accountId)
      .then(setMatches)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load matches'))
      .finally(() => setLoading(false));
  }, [identity]);

  function linkAccount() {
    const trimmed = idInput.trim();
    if (!/^\d+$/.test(trimmed)) {
      setError('Friend ID must be a number — find it in Dota 2 on your profile page.');
      return;
    }
    const next: PlayerIdentity = { provider: 'friend_id', accountId: parseInt(trimmed, 10), linkedAt: Date.now() };
    setPlayerIdentity(next);
    setIdentity(next);
  }

  function unlink() {
    clearPlayerIdentity();
    setIdentity(null);
    setMatches(null);
    setIdInput('');
  }

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

  if (!identity) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-gray-400 text-xs">
          Enter your Dota <span className="text-gray-200 font-semibold">Friend ID</span> (the number on your in-game
          profile) to list your recent games. Your match history must be public
          (Settings → Options → Advanced → Expose Public Match Data). No login needed.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && linkAccount()}
            placeholder="e.g. 86745912"
            className="flex-1 bg-dota-bg border border-dota-border rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-dota-accent"
          />
          <button
            onClick={linkAccount}
            disabled={!idInput.trim()}
            className="px-4 py-2 rounded bg-dota-accent text-dota-bg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Link
          </button>
        </div>
        {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/50 rounded p-2">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Friend ID <span className="text-gray-200 font-semibold">{identity.accountId}</span>
        </span>
        <button onClick={unlink} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">unlink</button>
      </div>

      {loading && (
        <p className="text-gray-500 text-xs py-4 text-center">
          {backendStatus === 'waking'
            ? 'Backend is waking up (free hosting) — this can take up to a minute…'
            : 'Loading recent games…'}
        </p>
      )}
      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/50 rounded p-2">{error}</div>}
      {matches && matches.length === 0 && !loading && (
        <p className="text-gray-500 text-xs py-4 text-center">
          No recent games found — is your match history set to public?
        </p>
      )}

      {matches?.map(m => {
        const hero = heroes.find(h => h.id === m.heroId);
        return (
          // div, not button: HeroPortrait renders its own <button> and nested
          // buttons are invalid HTML (React logs hydration errors).
          <div
            key={m.matchId}
            role="button"
            tabIndex={0}
            onClick={() => { if (loadingMatch === null) loadMatch(m.matchId); }}
            onKeyDown={e => { if (e.key === 'Enter' && loadingMatch === null) loadMatch(m.matchId); }}
            className={[
              'flex items-center gap-2 p-2 rounded border border-dota-border bg-dota-bg/40 hover:border-dota-accent/60 hover:bg-dota-bg transition-colors text-left cursor-pointer',
              loadingMatch !== null ? 'opacity-50 pointer-events-none' : '',
            ].join(' ')}
          >
            {hero && <HeroPortrait hero={hero} size="sm" />}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-200">{hero?.displayName ?? `Hero #${m.heroId}`}</span>
                <span className={['text-[9px] font-bold', m.win ? 'text-green-400' : 'text-red-400'].join(' ')}>
                  {m.win ? 'WON' : 'LOST'}
                </span>
                {m.gameMode === 2 && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">CM</span>
                )}
              </div>
              <span className="text-[10px] text-gray-500">
                {m.kills}/{m.deaths}/{m.assists} · {Math.round(m.durationSec / 60)} min · {timeAgo(m.startTime)}
              </span>
            </div>
            <span className="text-[10px] text-dota-accent font-bold shrink-0">
              {loadingMatch === m.matchId ? 'loading…' : 'load →'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
