import { useState } from 'react';
import type { Hero } from '../types';
import { getHeroMeta, TIER_LABEL, TIER_COLOR } from '../data/metaService';

const ATTR_COLOR: Record<string, string> = {
  strength: 'text-red-400',
  agility: 'text-green-400',
  intelligence: 'text-blue-400',
  universal: 'text-purple-400',
};

const ATTR_BG: Record<string, string> = {
  strength: 'linear-gradient(135deg,#1a0808,#2d1010)',
  agility: 'linear-gradient(135deg,#081a0d,#102d16)',
  intelligence: 'linear-gradient(135deg,#08101a,#101c2d)',
  universal: 'linear-gradient(135deg,#180a1a,#241030)',
};

interface Props {
  hero: Hero;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  team?: 'radiant' | 'dire';
  showName?: boolean;
  // Inline draft annotation (recommended pick / ban threat) drawn on the portrait.
  annotation?: { ring?: string; badge?: string; badgeCls?: string };
}

const SIZE_BOX = { sm: 'w-14 h-10', md: 'w-20 h-14', lg: 'w-24 h-16' };
const SIZE_FALLBACK = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export default function HeroPortrait({
  hero, size = 'md', disabled = false, selected = false,
  onClick, team, showName = false, annotation,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const meta = getHeroMeta(hero.id);
  const tierLabel = meta ? TIER_LABEL[meta.tier] : '';
  const tierColor = meta ? TIER_COLOR[meta.tier] : '';

  const ringClass = annotation?.ring ?? (selected
    ? team === 'radiant' ? 'ring-2 ring-green-500'
      : team === 'dire' ? 'ring-2 ring-red-500'
      : 'ring-2 ring-dota-accent'
    : '');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-0.5 transition-all select-none',
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      title={hero.displayName}
    >
      <div
        className={[
          SIZE_BOX[size],
          'rounded overflow-hidden relative border border-dota-border',
          'transition-all duration-150',
          ringClass,
          !disabled && !selected ? 'hover:border-dota-accent hover:scale-105' : '',
          disabled ? 'grayscale brightness-50' : '',
        ].join(' ')}
        style={{ background: ATTR_BG[hero.attribute] }}
      >
        {hero.imageUrl && !imgFailed ? (
          <img
            src={hero.imageUrl}
            alt={hero.displayName}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={[
            'w-full h-full flex items-center justify-center font-black',
            SIZE_FALLBACK[size],
            ATTR_COLOR[hero.attribute],
          ].join(' ')}>
            {hero.displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        {/* Attribute pip */}
        <span className={[
          'absolute top-0.5 left-0.5 text-[8px] font-bold px-0.5 rounded-sm',
          'bg-black/60',
          ATTR_COLOR[hero.attribute],
        ].join(' ')}>
          {hero.attribute.slice(0, 3).toUpperCase()}
        </span>
        {/* Meta tier badge */}
        {tierLabel && (
          <span className={[
            'absolute top-0.5 right-0.5 text-[7px] font-black px-0.5 rounded-sm leading-tight',
            tierColor,
          ].join(' ')}>
            {tierLabel}
          </span>
        )}
        {/* Draft annotation badge (recommended / threat) */}
        {annotation?.badge && (
          <span className={[
            'absolute bottom-0.5 right-0.5 text-[7px] font-black px-0.5 rounded-sm leading-tight',
            annotation.badgeCls ?? 'bg-black/70 text-white',
          ].join(' ')}>
            {annotation.badge}
          </span>
        )}
      </div>
      {showName && (
        <span className="text-[9px] text-gray-400 text-center leading-tight max-w-[56px] truncate w-full">
          {hero.displayName}
        </span>
      )}
    </button>
  );
}
