import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/tasks', icon: '📋', label: 'Tasks' },
    { path: '/global-chat', icon: '💬', label: 'Global Chat' },
    { path: '/queries', icon: '❓', label: 'Support' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' }
  ];

  if (user?.role === 'admin') {
    navItems.push(
      { path: '/admin', icon: '⚙️', label: 'Admin Panel' },
      { path: '/analytics', icon: '📈', label: 'Analytics' }
    );
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">DT</div>
          <span className="sidebar-brand">DTMS</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-title">Navigation</span>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <span className="sidebar-section-title">Account</span>
          <NavLink
            to="/submissions"
            className={`sidebar-link ${isActive('/submissions') ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="icon">📤</span>
            Submissions
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="navbar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
