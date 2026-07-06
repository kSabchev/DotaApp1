import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllHeroes } from '../../store/selectors';
import { loadDraft } from '../../store/draftSlice';
import { API_BASE } from '../../config';
import { apiFetch } from '../../data/backendStatus';
import { savedDraftFromMatch, matchHasCmDraft } from '../../data/matchImport';
import type { OpenDotaMatch } from '../../services/api';

/** Paste any Dota 2 match ID (Dotabuff/OpenDota) and load its draft. */
export default function MatchIdTab({ onLoaded }: { onLoaded: () => void }) {
  const dispatch = useAppDispatch();
  const heroes = useAppSelector(selectAllHeroes);
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OpenDotaMatch | null>(null);

  async function fetchMatch() {
    if (!matchId.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await apiFetch(`${API_BASE}/matches/${matchId.trim()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OpenDotaMatch;
      if (!data?.match_id) throw new Error('Match not found');
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch match');
    } finally {
      setLoading(false);
    }
  }

  function importDraft() {
    if (!preview) return;
    dispatch(loadDraft(savedDraftFromMatch(preview, heroes)));
    onLoaded();
  }

  const heroName = (id: number) => heroes.find(h => h.id === id)?.displayName ?? `#${id}`;
  const isCm = preview ? matchHasCmDraft(preview) : false;

  const radiantPicks = preview
    ? isCm
      ? preview.picks_bans!.filter(pb => pb.is_pick && pb.team === 0).map(pb => heroName(pb.hero_id))
      : (preview.players ?? []).filter(p => (p.player_slot ?? (p.team_number === 0 ? 0 : 128)) < 128 && p.hero_id > 0).map(p => heroName(p.hero_id))
    : [];
  const direPicks = preview
    ? isCm
      ? preview.picks_bans!.filter(pb => pb.is_pick && pb.team === 1).map(pb => heroName(pb.hero_id))
      : (preview.players ?? []).filter(p => (p.player_slot ?? (p.team_number === 0 ? 0 : 128)) >= 128 && p.hero_id > 0).map(p => heroName(p.hero_id))
    : [];
  const bans = preview && isCm
    ? preview.picks_bans!.filter(pb => !pb.is_pick).map(pb => heroName(pb.hero_id))
    : [];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-gray-400 text-xs">
        Enter a Dota 2 match ID to load its draft. You can find match IDs on Dotabuff or OpenDota.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={matchId}
          onChange={e => setMatchId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchMatch()}
          placeholder="e.g. 8863619325"
          className="flex-1 bg-dota-bg border border-dota-border rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-dota-accent"
        />
        <button
          onClick={fetchMatch}
          disabled={loading || !matchId.trim()}
          className="px-4 py-2 rounded bg-dota-accent text-dota-bg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {loading ? '...' : 'Fetch'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/50 rounded p-2">{error}</div>
      )}

      {preview && (
        <div className="flex flex-col gap-3">
          {!isCm && (
            <div className="text-amber-300 text-[10px] bg-amber-950/30 border border-amber-900/50 rounded p-2">
              No Captains Mode draft data in this match — picks reconstructed from the players list (no bans, manual mode).
            </div>
          )}
          <div className="bg-dota-bg rounded-lg p-3 border border-dota-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Match {preview.match_id}</span>
              <span className={['text-xs font-bold', preview.radiant_win ? 'text-green-400' : 'text-red-400'].join(' ')}>
                {preview.radiant_win ? 'Radiant Win' : 'Dire Win'}
              </span>
            </div>
            {(preview.radiant_team || preview.dire_team) && (
              <div className="flex justify-between text-xs mb-2">
                <span className="text-green-400">{preview.radiant_team?.name ?? 'Radiant'}</span>
                <span className="text-gray-500">vs</span>
                <span className="text-red-400">{preview.dire_team?.name ?? 'Dire'}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] font-bold text-green-600 mb-1">RADIANT PICKS</div>
                {radiantPicks.map((name, i) => (
                  <div key={i} className="text-[11px] text-gray-300">• {name}</div>
                ))}
              </div>
              <div>
                <div className="text-[10px] font-bold text-red-600 mb-1">DIRE PICKS</div>
                {direPicks.map((name, i) => (
                  <div key={i} className="text-[11px] text-gray-300">• {name}</div>
                ))}
              </div>
            </div>
            {bans.length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] font-bold text-gray-500 mb-1">BANS ({bans.length})</div>
                <div className="text-[10px] text-gray-500">{bans.join(', ')}</div>
              </div>
            )}
          </div>

          <button
            onClick={importDraft}
            className="w-full py-2 rounded bg-green-700 text-white text-sm font-bold hover:bg-green-600 transition-colors"
          >
            Import This Draft
          </button>
        </div>
      )}
    </div>
  );
}
