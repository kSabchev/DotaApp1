import { useState } from 'react';
import { ITEMS, itemIconUrl } from '../../../shared/items';
import { MECHANIC_LABEL, MECHANIC_COUNTERS } from '../../../shared/mechanics';
import type { Role } from '../types';

interface Props {
  onClose: () => void;
}

const CATEGORY_ORDER = ['carry', 'support', 'aura', 'utility'] as const;
const CATEGORY_LABEL: Record<string, string> = {
  carry: 'Carry Items', support: 'Support Items', aura: 'Auras / Team Items', utility: 'Utility Items',
};
const ROLE_LABEL: Record<Role, string> = {
  carry: 'Carry', mid: 'Mid', offlane: 'Off', support: 'Sup', hard_support: 'Hard Sup',
};
const TIMING_COLOR: Record<string, string> = {
  early: 'bg-green-900/60 text-green-300', mid: 'bg-yellow-900/60 text-yellow-300', late: 'bg-red-900/60 text-red-300',
};

export default function ItemTablePanel({ onClose }: Props) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const filtered = ITEMS.filter(it =>
    !q ||
    it.name.toLowerCase().includes(q) ||
    it.mechanics.some(m => MECHANIC_LABEL[m].toLowerCase().includes(q) || MECHANIC_COUNTERS[m].includes(q)),
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dota-surface border border-dota-border rounded-xl p-5 w-full max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-thin shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-dota-accent font-black text-lg">Counter-Item Reference</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl">×</button>
        </div>

        <p className="text-gray-500 text-xs mb-3">
          Which mechanic each item provides and what it answers. The draft panels use this to suggest items vs the enemy lineup.
        </p>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search item or what it counters (e.g. evasion, illusions)…"
          className="w-full bg-dota-bg border border-dota-border rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-dota-accent mb-4"
        />

        {CATEGORY_ORDER.map(cat => {
          const items = filtered.filter(i => i.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{CATEGORY_LABEL[cat]}</h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map(it => (
                  <div key={it.id} className="flex gap-2 bg-dota-bg/50 rounded-lg border border-dota-border p-2">
                    <img
                      src={itemIconUrl(it.id)}
                      alt={it.name}
                      className="w-11 h-8 rounded border border-dota-border shrink-0 object-cover bg-dota-bg"
                      loading="lazy"
                      onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-200">{it.name}</span>
                        <span className={['text-[8px] px-1 py-0.5 rounded font-bold uppercase', TIMING_COLOR[it.timing]].join(' ')}>
                          {it.timing}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 mb-0.5">
                        {it.builtBy.map(r => ROLE_LABEL[r]).join(' · ')}
                      </div>
                      {it.mechanics.map(m => (
                        <div key={m} className="text-[10px] leading-tight">
                          <span className="text-cyan-300 font-semibold">{MECHANIC_LABEL[m]}</span>
                          <span className="text-gray-500"> · vs {MECHANIC_COUNTERS[m]}</span>
                        </div>
                      ))}
                      {it.note && <p className="text-[9px] text-gray-600 italic mt-0.5 leading-tight">{it.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-6">No items match “{search}”.</p>
        )}
      </div>
    </div>
  );
}
