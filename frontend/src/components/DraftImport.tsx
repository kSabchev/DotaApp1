import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import { loadDraft } from '../store/draftSlice';
import { generateId } from '../data/draftStorage';
import { inferRoles } from '../utils/scoring';
import type { OpenDotaMatch } from '../services/api';

interface Props {
  onClose: () => void;
}

export default function DraftImport({ onClose }: Props) {
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
      const res = await fetch(`http://localhost:3001/api/matches/${matchId.trim()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OpenDotaMatch = await res.json();
      if (!data.picks_bans) throw new Error('No draft data in this match');
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch match');
    } finally {
      setLoading(false);
    }
  }

  function importDraft() {
    if (!preview?.picks_bans) return;

    const sorted = [...preview.picks_bans].sort((a, b) => a.order - b.order);

    // Build slots directly from OpenDota data — phase and team come from the match,
    // NOT from our hardcoded CM order (which can differ in tournament formats with extra bans).
    // OpenDota: team 0 = radiant, team 1 = dire.
    const slots = sorted.map(pb => ({
      phase: (pb.is_pick ? 'pick' : 'ban') as 'pick' | 'ban',
      team: (pb.team === 0 ? 'radiant' : 'dire') as 'radiant' | 'dire',
      heroId: pb.hero_id as number | null,
    }));

    const startingTeam: 'radiant' | 'dire' = sorted[0]?.team === 0 ? 'radiant' : 'dire';

    // OpenDota picks_bans carry no lane data, so infer a clean 1:1 role
    // assignment per team — otherwise every position falls back to metaRole
    // and the analysis sees duplicate carries / no mid.
    const heroesOf = (team: 'radiant' | 'dire') =>
      slots
        .filter(s => s.phase === 'pick' && s.team === team && s.heroId !== null)
        .map(s => heroes.find(h => h.id === s.heroId))
        .filter((h): h is NonNullable<typeof h> => Boolean(h));
    const roleAssignments = {
      ...inferRoles(heroesOf('radiant')),
      ...inferRoles(heroesOf('dire')),
    };

    dispatch(loadDraft({
      id: generateId(),
      name: `Match ${preview.match_id}`,
      notes: '',
      outcome: preview.radiant_win ? 'radiant_win' : 'dire_win',
      savedAt: Date.now(),
      slots,
      mode: 'captains',
      startingTeam,
      roleAssignments,
    }));

    onClose();
  }

  const radiantPicks = preview?.picks_bans
    ?.filter(pb => pb.is_pick && pb.team === 0)
    .map(pb => heroes.find(h => h.id === pb.hero_id)?.displayName ?? `#${pb.hero_id}`)
    ?? [];
  const direPicks = preview?.picks_bans
    ?.filter(pb => pb.is_pick && pb.team === 1)
    .map(pb => heroes.find(h => h.id === pb.hero_id)?.displayName ?? `#${pb.hero_id}`)
    ?? [];
  const bans = preview?.picks_bans
    ?.filter(pb => !pb.is_pick)
    .map(pb => heroes.find(h => h.id === pb.hero_id)?.displayName ?? `#${pb.hero_id}`)
    ?? [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dota-surface border border-dota-border rounded-xl p-6 w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-dota-accent font-black text-lg">Import Draft from Match</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl">×</button>
        </div>

        <p className="text-gray-400 text-xs mb-4">
          Enter a Dota 2 match ID to load its draft. You can find match IDs on Dotabuff or OpenDota.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={matchId}
            onChange={e => setMatchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchMatch()}
            placeholder="e.g. 7916872537"
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
          <div className="text-red-400 text-xs mb-3 bg-red-950/30 border border-red-900/50 rounded p-2">{error}</div>
        )}

        {preview && (
          <div className="flex flex-col gap-3">
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
    </div>
  );
}
