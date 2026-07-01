import { useState } from 'react';
import type { CapabilityProfile, CapabilityAxisId, TeamTraits } from '../../../shared/types';
import { CAPABILITY_ORDER, CAPABILITY_SHORT, capabilityHighlights } from '../../../shared/capabilities';

interface Props {
  radiant: CapabilityProfile;
  dire: CapabilityProfile;
  radiantTraits: TeamTraits;
  direTraits: TeamTraits;
}

const RADIANT = '#56b870';
const DIRE = '#d4605a';

// SVG geometry
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2 + 4;
const R = 96;
const N = CAPABILITY_ORDER.length;

const angleFor = (i: number) => (-90 + i * (360 / N)) * (Math.PI / 180);
const point = (i: number, frac: number) => [
  CX + Math.cos(angleFor(i)) * R * frac,
  CY + Math.sin(angleFor(i)) * R * frac,
];

function polygon(profile: CapabilityProfile): string {
  return CAPABILITY_ORDER
    .map((id, i) => { const [x, y] = point(i, profile[id].score / 10); return `${x.toFixed(1)},${y.toFixed(1)}`; })
    .join(' ');
}

export default function CapabilityPanel({ radiant, dire, radiantTraits, direTraits }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">Team Capabilities</span>
        <span className="text-gray-500 text-xs">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          {/* Radar */}
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[340px] mx-auto block">
            {/* grid rings */}
            {[0.25, 0.5, 0.75, 1].map(level => (
              <polygon
                key={level}
                points={CAPABILITY_ORDER.map((_, i) => { const [x, y] = point(i, level); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ')}
                fill="none" stroke="#3a3a3a" strokeWidth={0.5}
              />
            ))}
            {/* spokes + labels */}
            {CAPABILITY_ORDER.map((id, i) => {
              const [sx, sy] = point(i, 1);
              const [lx, ly] = point(i, 1.17);
              const cos = Math.cos(angleFor(i));
              const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
              return (
                <g key={id}>
                  <line x1={CX} y1={CY} x2={sx} y2={sy} stroke="#333" strokeWidth={0.5} />
                  <text x={lx} y={ly} fontSize={9} fill="#9aa0a6" textAnchor={anchor} dominantBaseline="middle">
                    {CAPABILITY_SHORT[id as CapabilityAxisId]}
                  </text>
                </g>
              );
            })}
            {/* team polygons */}
            <polygon points={polygon(dire)} fill={DIRE} fillOpacity={0.18} stroke={DIRE} strokeWidth={2} />
            <polygon points={polygon(radiant)} fill={RADIANT} fillOpacity={0.18} stroke={RADIANT} strokeWidth={2} />
          </svg>

          {/* legend */}
          <div className="flex justify-center gap-4 -mt-1 mb-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: RADIANT }} />Radiant</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: DIRE }} />Dire</span>
          </div>

          {/* Can do / Can't do + traits per team */}
          <div className="grid grid-cols-2 gap-3">
            <TeamHighlights profile={radiant} traits={radiantTraits} color={RADIANT} label="Radiant" />
            <TeamHighlights profile={dire} traits={direTraits} color={DIRE} label="Dire" />
          </div>
        </div>
      )}
    </div>
  );
}

const DMG_COLORS = { physical: '#7fa8c9', magical: '#a87fc9', pure: '#d9d2a8' };

function DamageBar({ traits }: { traits: TeamTraits }) {
  const { physical, magical, pure } = traits.damage;
  const total = physical + magical + pure || 1;
  const seg = (v: number) => `${(v / total) * 100}%`;
  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[9px] text-gray-500 uppercase tracking-wide">Damage</span>
        <div className="flex-1 h-2 rounded-sm overflow-hidden flex bg-dota-bg">
          {physical > 0 && <div style={{ width: seg(physical), background: DMG_COLORS.physical }} title="Physical" />}
          {magical > 0 && <div style={{ width: seg(magical), background: DMG_COLORS.magical }} title="Magical" />}
          {pure > 0 && <div style={{ width: seg(pure), background: DMG_COLORS.pure }} title="Pure" />}
        </div>
      </div>
      <p className="text-[9px] text-gray-500 leading-tight">{traits.damage.note}</p>
    </div>
  );
}

function TeamHighlights({ profile, traits, color, label }: { profile: CapabilityProfile; traits: TeamTraits; color: string; label: string }) {
  const { can, cant } = capabilityHighlights(profile);
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold mb-1" style={{ color }}>{label}</div>
      <div className="text-[10px] text-gray-400 leading-tight">
        <span className="text-green-400 font-semibold">Can: </span>
        {can.length ? can.map(a => a.label).join(', ') : <span className="text-gray-600">no clear strength yet</span>}
      </div>
      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">
        <span className="text-red-400 font-semibold">Can't: </span>
        {cant.length ? cant.map(a => a.label).join(', ') : <span className="text-gray-600">no major gaps</span>}
      </div>
      <DamageBar traits={traits} />
      <p className="text-[9px] text-gray-500 leading-tight mt-1">{traits.space.note}</p>
      {traits.roshanNote && <p className="text-[9px] text-amber-500/80 leading-tight mt-0.5">🛡 {traits.roshanNote}</p>}
    </div>
  );
}
