import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectDraft } from '../store/selectors';
import { saveDraft, generateId, type DraftOutcome } from '../data/draftStorage';
import HeroPortrait from './HeroPortrait';
import { useAppSelector as useHeroes } from '../store/hooks';
import { selectAllHeroes, selectRadiantPicks, selectDirePicks } from '../store/selectors';

interface Props {
  onClose: () => void;
}

const OUTCOME_OPTIONS: { value: DraftOutcome; label: string; color: string }[] = [
  { value: 'unknown',     label: 'TBD / Unknown', color: 'border-gray-600 text-gray-400' },
  { value: 'radiant_win', label: 'Radiant Won',   color: 'border-green-600 text-green-300' },
  { value: 'dire_win',    label: 'Dire Won',       color: 'border-red-600 text-red-300' },
];

export default function SaveDraftModal({ onClose }: Props) {
  const draft = useAppSelector(selectDraft);
  const allHeroes = useHeroes(selectAllHeroes);
  const radiantPicks = useHeroes(selectRadiantPicks);
  const direPicks = useHeroes(selectDirePicks);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<DraftOutcome>('unknown');
  const [saved, setSaved] = useState(false);

  const hasPicks = radiantPicks.length > 0 || direPicks.length > 0;

  function handleSave() {
    const trimmed = name.trim() || `Draft ${new Date().toLocaleDateString()}`;
    saveDraft({
      id: generateId(),
      name: trimmed,
      notes,
      outcome,
      savedAt: Date.now(),
      slots: draft.slots,
      mode: draft.mode,
      startingTeam: draft.startingTeam,
      roleAssignments: draft.roleAssignments as Record<number, import('../types').Role>,
    });
    setSaved(true);
    setTimeout(onClose, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-dota-surface border border-dota-border rounded-xl shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-100">Save Draft</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">✕</button>
          </div>

          {/* Hero preview */}
          {hasPicks && (
            <div className="flex gap-2 items-center">
              <div className="flex gap-0.5">
                {radiantPicks.map(id => {
                  const h = allHeroes.find(h => h.id === id);
                  return h ? <HeroPortrait key={id} hero={h} size="sm" team="radiant" selected /> : null;
                })}
              </div>
              <span className="text-xs text-gray-600">vs</span>
              <div className="flex gap-0.5">
                {direPicks.map(id => {
                  const h = allHeroes.find(h => h.id === id);
                  return h ? <HeroPortrait key={id} hero={h} size="sm" team="dire" selected /> : null;
                })}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Draft Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`Draft ${new Date().toLocaleDateString()}`}
              maxLength={60}
              className="bg-dota-bg border border-dota-border rounded px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-dota-accent"
              autoFocus
            />
          </div>

          {/* Outcome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Outcome</label>
            <div className="flex gap-2">
              {OUTCOME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  className={[
                    'flex-1 py-1.5 rounded border text-xs font-semibold transition-all',
                    outcome === opt.value
                      ? `${opt.color} bg-white/5`
                      : 'border-dota-border text-gray-600 hover:text-gray-400',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notes / Scouting</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enemy team prefers teamfight, always bans Enigma..."
              rows={3}
              maxLength={500}
              className="bg-dota-bg border border-dota-border rounded px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-dota-accent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-dota-border text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className={[
                'px-5 py-1.5 rounded text-xs font-bold transition-all',
                saved
                  ? 'bg-green-700 text-green-200'
                  : 'bg-dota-accent text-dota-bg hover:opacity-90',
              ].join(' ')}
            >
              {saved ? '✓ Saved!' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
