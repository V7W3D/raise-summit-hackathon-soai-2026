import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../features/home/use-home-api-queries';
import { userInitials } from '../lib/user-display';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/missions', label: 'Missions' },
  { to: '/discover', label: 'Discover' },
];

export function AppLayout() {
  const { data: user, isPending } = useCurrentUser();

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
          <NavLink to="/profile" className="sidebar-user">
            <span className="sidebar-user-avatar">
              {user ? userInitials(user.name) : '…'}
            </span>
            <span className="sidebar-user-name">
              {user?.name ?? (isPending ? 'Loading…' : 'User')}
            </span>
          </NavLink>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
