import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  accent?: string;          // header text colour class
  defaultOpen?: boolean;
  headerExtra?: ReactNode;  // small node shown next to the title (e.g. a badge)
  children: ReactNode;
}

// A collapsible side-panel section: clickable header (title + chevron) over a body.
export default function Section({ title, accent = 'text-gray-500', defaultOpen = true, headerExtra, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-dota-surface rounded-lg border border-dota-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-dota-hover/30 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <h4 className={['text-[10px] font-bold uppercase tracking-wider', accent].join(' ')}>{title}</h4>
          {headerExtra}
        </span>
        <span className="text-gray-600 text-[10px] shrink-0">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
