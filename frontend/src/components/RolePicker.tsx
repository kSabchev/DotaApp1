import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch } from '../store/hooks';
import { assignRole } from '../store/draftSlice';
import type { MetaRole, Role } from '../types';

export const ROLES: Role[] = ['carry', 'mid', 'offlane', 'support', 'hard_support'];
export const ROLE_LABEL: Record<Role, string> = {
  carry: 'Carry', mid: 'Mid', offlane: 'Off', support: 'Sup', hard_support: 'Hard Sup',
};
export const ROLE_COLOR: Record<Role, string> = {
  carry: 'bg-yellow-900/60 text-yellow-300',
  mid: 'bg-blue-900/60 text-blue-300',
  offlane: 'bg-orange-900/60 text-orange-300',
  support: 'bg-teal-900/60 text-teal-300',
  hard_support: 'bg-purple-900/60 text-purple-300',
};
export const META_TO_ROLE: Record<MetaRole, Role | undefined> = {
  pos1: 'carry', pos2: 'mid', pos3: 'offlane', pos4: 'support', pos5: 'hard_support', flex: undefined,
};

interface Props {
  heroId: number;
  current?: Role;
  metaRole?: MetaRole;
  flexRoles?: Role[];
}

const MENU_W = 96;   // fallback menu width before measurement (px)
const MENU_H = 180;  // fallback menu height before measurement (px)

/** Click-to-open role selector. Shows the assigned role (or the metaRole-derived
 *  suggestion with a "?"), and dispatches assignRole on pick. The menu renders in
 *  a portal with fixed positioning so it never gets clipped by scroll containers. */
export default function RolePicker({ heroId, current, metaRole, flexRoles }: Props) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const suggested = !current && metaRole ? META_TO_ROLE[metaRole] : undefined;
  const label = current ? ROLE_LABEL[current] : suggested ? `${ROLE_LABEL[suggested]}?` : 'Role?';
  const color = current ? ROLE_COLOR[current] : 'bg-gray-700/60 text-gray-400';

  // Position the portal menu relative to the button: open below, flip up if it
  // would overflow, then clamp to the viewport. Re-measures once rendered so the
  // exact menu height is used (never relies on a guessed height).
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const h = menuRef.current?.offsetHeight ?? MENU_H;
      const w = menuRef.current?.offsetWidth ?? MENU_W;
      let top = r.bottom + 2;
      if (top + h > window.innerHeight - 8) top = r.top - h - 2; // flip up
      top = Math.max(8, Math.min(top, window.innerHeight - h - 8)); // clamp
      const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      setCoords(prev => (prev && prev.top === top && prev.left === left) ? prev : { top, left });
    };
    place();
    const raf = requestAnimationFrame(place); // re-place after the menu mounts/measures
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, coords]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        title="Assign role"
        className={['text-[9px] px-1.5 py-0.5 rounded font-bold transition-opacity hover:opacity-80', color].join(' ')}
      >
        {label} ▾
      </button>
      {open && coords && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            className="fixed z-[61] bg-dota-surface border border-dota-border rounded shadow-2xl p-1 flex flex-col gap-0.5"
            style={{ top: coords.top, left: coords.left, minWidth: MENU_W }}
          >
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => { dispatch(assignRole({ heroId, role: r })); setOpen(false); }}
                className={[
                  'text-[9px] px-2 py-0.5 rounded text-left whitespace-nowrap font-semibold',
                  r === current ? ROLE_COLOR[r] : 'text-gray-300 hover:bg-dota-hover',
                ].join(' ')}
              >
                {ROLE_LABEL[r]}
                {flexRoles?.includes(r) && <span className="text-indigo-400 ml-1">· flex</span>}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
