import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Draft', end: true },
  { to: '/heroes', label: 'Heroes', end: false },
  { to: '/tips', label: 'Tips', end: false },
];

/** Top-bar navigation between the draft screen and the info pages. */
export default function NavTabs() {
  return (
    <nav className="flex rounded border border-dota-border overflow-hidden text-xs">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            [
              'px-2.5 py-1 font-medium transition-colors',
              isActive ? 'bg-dota-accent text-dota-bg' : 'text-gray-400 hover:text-gray-200',
            ].join(' ')
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
