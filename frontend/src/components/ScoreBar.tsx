interface Props {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export default function ScoreBar({ label, value, max, color = 'bg-dota-accent' }: Props) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-mono">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-dota-bg rounded-full overflow-hidden">
        <div
          className={['h-full rounded-full transition-all', color].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
