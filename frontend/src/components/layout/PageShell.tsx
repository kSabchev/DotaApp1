import type { ReactNode } from 'react';
import NavTabs from './NavTabs';

/**
 * Chrome for the non-draft routes (Heroes, Tips): same top bar branding as
 * DraftScreen but with a normally-scrolling content area instead of the
 * draft screen's h-screen/overflow-hidden layout.
 */
export default function PageShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-dota-bg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dota-border bg-dota-surface shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-dota-accent font-black text-lg tracking-tight">DOTA 2</span>
          <span className="text-gray-500 font-semibold text-sm">Draft Analyzer</span>
        </div>
        <NavTabs />
      </div>
      <div className="flex-1 px-4 py-4 max-w-6xl w-full mx-auto">
        {title && <h1 className="text-dota-accent font-bold text-xl mb-4">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
