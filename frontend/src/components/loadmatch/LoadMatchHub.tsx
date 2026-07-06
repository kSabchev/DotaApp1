import { useState } from 'react';
import MyGamesTab from './MyGamesTab';
import ProMatchesTab from './ProMatchesTab';
import ShowcaseTab from './ShowcaseTab';
import MatchIdTab from './MatchIdTab';

type TabId = 'mine' | 'pro' | 'showcase' | 'byid';

const TABS: { id: TabId; label: string }[] = [
  { id: 'mine', label: 'My Games' },
  { id: 'pro', label: 'Pro Matches' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'byid', label: 'Match ID' },
];

/** One hub for every way to load a draft: your games, pro games, curated showcases, raw match id. */
export default function LoadMatchHub({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabId>('mine');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dota-surface border border-dota-border rounded-xl p-6 w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-dota-accent font-black text-lg">Load Match</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl">×</button>
        </div>

        <div className="flex rounded border border-dota-border overflow-hidden text-xs mb-4 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 px-2.5 py-1.5 font-medium transition-colors',
                tab === t.id ? 'bg-dota-accent text-dota-bg' : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 min-h-0">
          {tab === 'mine' && <MyGamesTab onLoaded={onClose} />}
          {tab === 'pro' && <ProMatchesTab onLoaded={onClose} />}
          {tab === 'showcase' && <ShowcaseTab onLoaded={onClose} />}
          {tab === 'byid' && <MatchIdTab onLoaded={onClose} />}
        </div>
      </div>
    </div>
  );
}
