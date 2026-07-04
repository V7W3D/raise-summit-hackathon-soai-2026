import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/missions', label: 'Missions' },
  { to: '/discover', label: 'Discover' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/insights', label: 'Insights' },
  { to: '/contacts', label: 'Contacts' },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo">
          Scouter
        </NavLink>
        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="sidebar-user">
            <span className="sidebar-user-avatar">AZ</span>
            <span className="sidebar-user-name">Azzedine</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
