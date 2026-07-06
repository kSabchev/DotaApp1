import type { Hero } from '../../types';
import { getHeroPlaystyles, PLAYSTYLE_LABEL, PLAYSTYLE_DESCRIPTION } from '../../../../shared/heroPlaystyles';

/** Violet playstyle chips with tooltip descriptions — used on hero pages and filters. */
export default function PlaystyleBadges({ hero, size = 'md' }: { hero: Hero; size?: 'sm' | 'md' }) {
  const styles = getHeroPlaystyles(hero);
  const cls = size === 'sm'
    ? 'text-[8px] px-1 py-0.5'
    : 'text-[10px] px-1.5 py-0.5';
  return (
    <div className="flex gap-1 flex-wrap">
      {styles.map(p => (
        <span
          key={p}
          title={PLAYSTYLE_DESCRIPTION[p]}
          className={`${cls} rounded bg-violet-900/40 text-violet-300 border border-violet-800/40 font-medium`}
        >
          {PLAYSTYLE_LABEL[p]}
        </span>
      ))}
    </div>
  );
}
