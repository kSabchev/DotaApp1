import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import type { DraftSlot } from '../types';

interface Props {
  slots: DraftSlot[];
  currentSlotIndex: number;
}

export default function BanPanel({ slots, currentSlotIndex }: Props) {
  const allHeroes = useAppSelector(selectAllHeroes);

  const banSlots = slots
    .map((s, i) => ({ slot: s, index: i }))
    .filter(({ slot }) => slot.phase === 'ban');

  const radiantBans = banSlots.filter(({ slot }) => slot.team === 'radiant');
  const direBans = banSlots.filter(({ slot }) => slot.team === 'dire');

  return (
    <div className="bg-dota-surface rounded-xl border border-dota-border p-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Bans</h3>
      <div className="flex gap-4">
        <BanRow label="Radiant" bans={radiantBans} currentSlotIndex={currentSlotIndex} heroPool={allHeroes} />
        <BanRow label="Dire" bans={direBans} currentSlotIndex={currentSlotIndex} heroPool={allHeroes} />
      </div>
    </div>
  );
}

function BanRow({
  label,
  bans,
  currentSlotIndex,
  heroPool,
}: {
  label: string;
  bans: { slot: DraftSlot; index: number }[];
  currentSlotIndex: number;
  heroPool: ReturnType<typeof useAppSelector<ReturnType<typeof selectAllHeroes>>>;
}) {
  return (
    <div className="flex-1">
      <div className="text-[10px] text-gray-600 mb-1">{label}</div>
      <div className="flex gap-1 flex-wrap">
        {bans.map(({ slot, index }) => {
          const hero = slot.heroId ? heroPool.find(h => h.id === slot.heroId) : null;
          const isActive = index === currentSlotIndex;

          return (
            <div
              key={index}
              className={[
                'w-10 h-7 rounded border relative overflow-hidden flex items-center justify-center',
                isActive && !hero
                  ? 'border-dota-accent/60 bg-dota-accent/10 active-slot'
                  : hero
                  ? 'border-red-900/60'
                  : 'border-dota-border bg-dota-bg',
              ].join(' ')}
              title={hero ? `Banned: ${hero.displayName}` : undefined}
            >
              {hero ? (
                <>
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt={hero.displayName}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[9px] font-black text-gray-300 z-10">
                      {hero.displayName.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  {/* Red overlay with X */}
                  <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                    <span className="text-red-400 text-base font-black leading-none drop-shadow">✕</span>
                  </div>
                </>
              ) : (
                <span className="text-gray-700 text-xs">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
