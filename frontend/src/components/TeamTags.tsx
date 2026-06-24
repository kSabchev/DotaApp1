import type { Hero, UtilityTag } from '../types';

const TAG_CONFIG: Partial<Record<UtilityTag, { label: string; color: string; icon: string }>> = {
  stun: { label: 'Stun', color: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50', icon: '⚡' },
  silence: { label: 'Silence', color: 'bg-purple-900/60 text-purple-300 border-purple-700/50', icon: '🔇' },
  save: { label: 'Save', color: 'bg-green-900/60 text-green-300 border-green-700/50', icon: '🛡' },
  dispel: { label: 'Dispel', color: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50', icon: '✨' },
  wave_clear: { label: 'Wave Clear', color: 'bg-orange-900/60 text-orange-300 border-orange-700/50', icon: '🌊' },
  tower_damage: { label: 'Tower Dmg', color: 'bg-red-900/60 text-red-300 border-red-700/50', icon: '🏰' },
  roshan: { label: 'Roshan', color: 'bg-stone-700/60 text-stone-300 border-stone-600/50', icon: '💀' },
  initiation: { label: 'Initiation', color: 'bg-blue-900/60 text-blue-300 border-blue-700/50', icon: '⚔️' },
  mobility: { label: 'Mobility', color: 'bg-sky-900/60 text-sky-300 border-sky-700/50', icon: '💨' },
  scaling: { label: 'Scaling', color: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50', icon: '📈' },
  aura_carrier: { label: 'Aura', color: 'bg-amber-900/60 text-amber-300 border-amber-700/50', icon: '✦' },
  lane_pressure: { label: 'Lane Pressure', color: 'bg-lime-900/60 text-lime-300 border-lime-700/50', icon: '💪' },
  heal: { label: 'Sustain', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50', icon: '💚' },
  vision: { label: 'Vision', color: 'bg-teal-900/60 text-teal-300 border-teal-700/50', icon: '👁' },
  lockdown: { label: 'Lockdown', color: 'bg-fuchsia-900/60 text-fuchsia-300 border-fuchsia-700/50', icon: '🔒' },
  burst: { label: 'Burst Dmg', color: 'bg-rose-900/60 text-rose-300 border-rose-700/50', icon: '💥' },
};

const ATTR_TIMING: Record<string, string> = {
  strength: 'Mid-game',
  agility: 'Late-game',
  intelligence: 'All-stages',
  universal: 'Flexible',
};

interface Props {
  picks: Hero[];
  team: 'radiant' | 'dire';
}

export default function TeamTags({ picks, team }: Props) {
  if (picks.length === 0) return null;

  // Collect all unique tags across picks, count coverage
  const tagCoverage = new Map<UtilityTag, string[]>();
  for (const hero of picks) {
    for (const tag of hero.utilityTags) {
      if (!tagCoverage.has(tag)) tagCoverage.set(tag, []);
      tagCoverage.get(tag)!.push(hero.displayName);
    }
  }

  // Power timing analysis
  const hasEarlyStr = picks.some(h => h.utilityTags.includes('lane_pressure'));
  const hasMidFight = picks.some(h => h.utilityTags.includes('initiation') || h.utilityTags.includes('stun'));
  const hasLateScale = picks.some(h => h.utilityTags.includes('scaling'));

  const timings: string[] = [];
  if (hasEarlyStr) timings.push('Early');
  if (hasMidFight) timings.push('Mid');
  if (hasLateScale) timings.push('Late');

  // Complexity indicator
  const avgComplexity = picks.reduce((s, h) => s + h.complexity, 0) / picks.length;

  // Attribute composition
  const attrCounts = picks.reduce((acc, h) => {
    acc[h.attribute] = (acc[h.attribute] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantAttr = Object.entries(attrCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'universal';

  // Attack type mix
  const meleeCount = picks.filter(h => h.attack === 'melee').length;
  const rangedCount = picks.filter(h => h.attack === 'ranged').length;

  const teamColor = team === 'radiant' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="flex flex-col gap-2">
      {/* Utility tag chips */}
      <div className="flex flex-wrap gap-1">
        {[...tagCoverage.entries()].map(([tag, sources]) => {
          const cfg = TAG_CONFIG[tag];
          if (!cfg) return null;
          return (
            <div
              key={tag}
              title={`Provided by: ${sources.join(', ')}`}
              className={[
                'flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-medium cursor-default',
                cfg.color,
              ].join(' ')}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              {sources.length > 1 && (
                <span className="opacity-60 ml-0.5">×{sources.length}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Power timing bar */}
      {timings.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-600">Power:</span>
          {(['Early', 'Mid', 'Late'] as const).map(phase => (
            <div
              key={phase}
              className={[
                'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                timings.includes(phase)
                  ? 'bg-dota-accent/20 text-dota-accent border-dota-accent/40'
                  : 'bg-dota-bg/50 text-gray-700 border-dota-border/30',
              ].join(' ')}
            >
              {phase}
            </div>
          ))}
        </div>
      )}

      {/* Meta indicators */}
      <div className="flex gap-2 text-[10px] text-gray-500 flex-wrap">
        <span>
          <span className="text-gray-400">Complexity:</span>{' '}
          {avgComplexity < 1.5 ? '⭐ Basic' : avgComplexity < 2.3 ? '⭐⭐ Medium' : '⭐⭐⭐ High'}
        </span>
        <span>
          <span className="text-gray-400">Attack:</span>{' '}
          {meleeCount}M / {rangedCount}R
        </span>
        <span className={teamColor}>
          {ATTR_TIMING[dominantAttr] ?? 'Flexible'} favored
        </span>
      </div>
    </div>
  );
}
