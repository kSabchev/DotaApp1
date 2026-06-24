import type { DraftHealthReport, HealthRating } from '../../../shared/types';

interface Props {
  health: DraftHealthReport;
  team: 'radiant' | 'dire';
}

const RATING_COLOR: Record<HealthRating, string> = {
  strong:  'text-green-400',
  decent:  'text-amber-400',
  weak:    'text-red-400',
  warning: 'text-orange-400',
};

const RATING_DOT: Record<HealthRating, string> = {
  strong:  'bg-green-500',
  decent:  'bg-amber-400',
  weak:    'bg-red-500',
  warning: 'bg-orange-400',
};

const RATING_LABEL: Record<HealthRating, string> = {
  strong: 'Yes', decent: 'Situational', weak: 'No', warning: '⚠',
};

const COMBO_TYPE_LABEL: Record<string, string> = {
  armor_reduction: 'Armor Shred',
  control_damage: 'Burst Combo',
  save_enable: 'Save + Initiation',
  wombo_combo: 'Wombo',
  lane_dominant: 'Lane Bully',
  buff_aura: 'Aura Synergy',
  push_siege: 'Siege Push',
  roshan: 'Roshan Control',
  global: 'Global Threat',
  illusion_synergy: 'Illusion',
};

function HealthRow({ label, rating, detail }: { label: string; rating: HealthRating; detail: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <div className={['w-1.5 h-1.5 rounded-full shrink-0', RATING_DOT[rating]].join(' ')} />
        <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
        <span className={['text-[9px] font-bold ml-auto shrink-0', RATING_COLOR[rating]].join(' ')}>
          {RATING_LABEL[rating]}
        </span>
      </div>
      <p className="text-[9px] text-gray-500 leading-relaxed ml-3">{detail}</p>
    </div>
  );
}

export default function DraftHealthPanel({ health }: Props) {
  const hasContent =
    health.combos.length > 0 ||
    health.blinkBreakers.length > 0 ||
    health.laneAvoids.length > 0 ||
    health.flexWarning;

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border p-3 flex flex-col gap-3">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">
        Rotations &amp; Draft Health
      </h4>

      {/* Rotation metrics */}
      <div className="flex flex-col gap-2">
        <HealthRow
          label="Rune Control"
          rating={health.runeControl.rating}
          detail={health.runeControl.detail}
        />
        <HealthRow
          label="Gate Rotations"
          rating={health.gateRotations.rating}
          detail={health.gateRotations.detail}
        />
        <HealthRow
          label="Mid Rotation"
          rating={health.midRotation.rating}
          detail={health.midRotation.detail}
        />
        <HealthRow
          label="Farm Balance"
          rating={health.farmBalance.rating}
          detail={health.farmBalance.detail}
        />
      </div>

      {/* Blink breakers */}
      {health.blinkBreakers.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-1">
            Blink Breakers
          </div>
          <p className="text-[9px] text-gray-400 leading-relaxed">
            <span className="text-gray-200">{health.blinkBreakers.join(', ')}</span>
            {' '}— expect Blink Dagger at 10–15 min; laning phase will break once this hits
          </p>
        </div>
      )}

      {/* Combo callouts */}
      {health.combos.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 mb-1.5">
            Key Combos
          </div>
          <div className="flex flex-col gap-1.5">
            {health.combos.map((combo, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-1 py-0.5 rounded font-bold uppercase tracking-wide">
                    {COMBO_TYPE_LABEL[combo.type] ?? combo.type}
                  </span>
                  <span className="text-[9px] text-gray-300 font-semibold">
                    {combo.heroes.join(' + ')}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500 leading-relaxed ml-1">{combo.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flex warning */}
      {health.flexWarning && (
        <div className="bg-orange-950/30 border border-orange-800/40 rounded p-2">
          <div className="text-[9px] font-bold text-orange-400 mb-0.5">⚠ Flex Draft Warning</div>
          <p className="text-[9px] text-orange-300/80 leading-relaxed">{health.flexWarning}</p>
        </div>
      )}

      {/* Lane avoids */}
      {health.laneAvoids.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-red-500 mb-1.5">
            Avoid / Adapt
          </div>
          <div className="flex flex-col gap-1.5">
            {health.laneAvoids.map((la, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-red-400 font-semibold">{la.hero}</span>
                <p className="text-[9px] text-gray-500 leading-relaxed ml-1">{la.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasContent && (
        <p className="text-[9px] text-gray-600">Pick more heroes for detailed analysis.</p>
      )}
    </div>
  );
}
