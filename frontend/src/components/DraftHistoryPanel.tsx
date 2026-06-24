import { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import { loadDraft } from '../store/draftSlice';
import { loadSavedDrafts, deleteDraft, type SavedDraft, type DraftOutcome } from '../data/draftStorage';
import HeroPortrait from './HeroPortrait';

interface Props {
  onClose: () => void;
}

const OUTCOME_BADGE: Record<DraftOutcome, { label: string; cls: string }> = {
  radiant_win: { label: 'Radiant Won', cls: 'bg-green-900/60 text-green-300 border-green-700' },
  dire_win:    { label: 'Dire Won',    cls: 'bg-red-900/60 text-red-300 border-red-700' },
  unknown:     { label: 'TBD',         cls: 'bg-gray-800 text-gray-500 border-gray-700' },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function DraftHistoryPanel({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const allHeroes = useAppSelector(selectAllHeroes);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setDrafts(loadSavedDrafts());
  }, []);

  function handleDelete(id: string) {
    deleteDraft(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
    setConfirmDelete(null);
  }

  function handleLoad(draft: SavedDraft) {
    dispatch(loadDraft(draft));
    onClose();
  }

  const filtered = search.trim()
    ? drafts.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.notes.toLowerCase().includes(search.toLowerCase())
      )
    : drafts;

  const picksForDraft = (draft: SavedDraft, team: 'radiant' | 'dire') =>
    draft.slots
      .filter(s => s.phase === 'pick' && s.team === team && s.heroId !== null)
      .map(s => allHeroes.find(h => h.id === s.heroId))
      .filter(Boolean) as typeof allHeroes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-dota-surface border border-dota-border rounded-xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dota-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-100">Draft History</h2>
            <p className="text-[10px] text-gray-600 mt-0.5">{drafts.length} saved draft{drafts.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">✕</button>
        </div>

        {/* Search */}
        {drafts.length > 3 && (
          <div className="px-5 py-3 border-b border-dota-border shrink-0">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search drafts or notes..."
              className="w-full bg-dota-bg border border-dota-border rounded px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-dota-accent"
            />
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto scrollbar-thin flex-1 p-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm">
                {drafts.length === 0 ? 'No saved drafts yet' : 'No drafts match your search'}
              </p>
              {drafts.length === 0 && (
                <p className="text-gray-700 text-xs mt-1">Use the Save button to record drafts during a session</p>
              )}
            </div>
          ) : (
            filtered.map(draft => {
              const radiant = picksForDraft(draft, 'radiant');
              const dire = picksForDraft(draft, 'dire');
              const badge = OUTCOME_BADGE[draft.outcome];
              return (
                <div key={draft.id} className="bg-dota-bg border border-dota-border rounded-lg p-3 flex flex-col gap-2">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-gray-100 truncate block">{draft.name}</span>
                      <span className="text-[10px] text-gray-600">{formatDate(draft.savedAt)}</span>
                    </div>
                    <span className={['text-[9px] font-bold px-2 py-0.5 rounded border shrink-0', badge.cls].join(' ')}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Hero rows */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-green-600 font-bold w-12 shrink-0">RADIANT</span>
                      <div className="flex gap-0.5 flex-wrap">
                        {radiant.map(h => <HeroPortrait key={h.id} hero={h} size="sm" team="radiant" selected />)}
                        {radiant.length === 0 && <span className="text-[10px] text-gray-700">No picks</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-red-600 font-bold w-12 shrink-0">DIRE</span>
                      <div className="flex gap-0.5 flex-wrap">
                        {dire.map(h => <HeroPortrait key={h.id} hero={h} size="sm" team="dire" selected />)}
                        {dire.length === 0 && <span className="text-[10px] text-gray-700">No picks</span>}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {draft.notes && (
                    <p className="text-[10px] text-gray-500 leading-relaxed border-t border-dota-border/50 pt-2">
                      {draft.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleLoad(draft)}
                      className="flex-1 py-1 rounded border border-dota-accent text-[11px] font-semibold text-dota-accent hover:bg-dota-accent hover:text-dota-bg transition-colors"
                    >
                      Load Draft
                    </button>
                    {confirmDelete === draft.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(draft.id)}
                          className="px-3 py-1 rounded bg-red-800 text-[11px] text-red-100 font-semibold hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1 rounded border border-dota-border text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(draft.id)}
                        className="px-3 py-1 rounded border border-dota-border text-[11px] text-gray-600 hover:text-red-400 hover:border-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
