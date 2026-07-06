import type { TeamIdentity, IdentitySeverity } from '../types';
import { PLAYSTYLE_LABEL, PLAYSTYLE_DESCRIPTION } from '../../../shared/heroPlaystyles';

const SEVERITY_STYLE: Record<IdentitySeverity, { box: string; title: string; mark: string }> = {
  warning: { box: 'bg-red-950/30 border-red-900/50', title: 'text-red-400', mark: '⚠' },
  info: { box: 'bg-dota-bg/40 border-dota-border', title: 'text-sky-400', mark: 'ℹ' },
  good: { box: 'bg-green-950/20 border-green-900/40', title: 'text-green-400', mark: '✓' },
};

/** Beta panel: reads the picks as a cast and flags playstyle misalignment. */
export default function TeamIdentityPanel({ identity }: { identity: TeamIdentity }) {
  if (identity.members.length === 0) return null;

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Team Identity</h4>
        <span className="text-[8px] px-1 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold uppercase">beta</span>
      </div>

      <p className="text-[10px] text-gray-400 leading-snug mb-2">{identity.summary}</p>

      <div className="flex flex-col gap-1.5 mb-2">
        {identity.notes.map((n, i) => {
          const s = SEVERITY_STYLE[n.severity];
          return (
            <div key={i} className={['rounded border p-2', s.box].join(' ')}>
              <span className={['text-[10px] font-bold', s.title].join(' ')}>
                {s.mark} {n.headline}
              </span>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{n.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        {identity.members.map(m => (
          <div key={m.heroId} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-300 w-20 shrink-0 truncate">{m.displayName}</span>
            {m.playstyles.map(p => (
              <span
                key={p}
                title={PLAYSTYLE_DESCRIPTION[p]}
                className="text-[8px] px-1 py-0.5 rounded bg-violet-900/40 text-violet-300 border border-violet-800/40 font-medium"
              >
                {PLAYSTYLE_LABEL[p]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
