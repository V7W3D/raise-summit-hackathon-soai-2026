import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  Target,
  Search,
  Filter,
  BarChart3,
  Users,
  ChevronDown,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/pipeline', label: 'Pipeline', icon: Filter },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/contacts', label: 'Contacts', icon: Users },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">P</span>
          ProspectPath
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <span className="avatar-fallback">AZ</span>
            <div>
              <div className="user-card-name">Azzedine</div>
              <div className="user-card-plan">Enterprise Plan</div>
            </div>
            <ChevronDown size={16} className="user-card-chevron" />
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
