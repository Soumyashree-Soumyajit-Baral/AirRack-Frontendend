import { NavLink, useNavigate } from 'react-router-dom';
import { FiPackage, FiHome, FiUsers, FiSettings, FiLogOut, FiChevronDown, FiChevronsLeft, FiChevronsRight, FiDatabase, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { ROLE_LABELS } from '../../constants/roles';
import './Layout.css';

const NAV_ITEMS = [
  { label: 'Home',       path: '/home',       icon: FiHome,     minRole: 'tech_rep' },
  { label: 'Warehouses', path: '/warehouses', icon: FiDatabase, minRole: 'tech_rep' },
  { label: 'Users',      path: '/users',      icon: FiUsers,    minRole: 'admin' },
  { label: 'Settings',   path: '/settings',   icon: FiSettings, minRole: 'tech_rep' },
  { label: 'Trash',      path: '/trash',      icon: FiTrash2,   minRole: 'admin' },
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout, hasMinRole } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const visibleNav = NAV_ITEMS.filter((item) => hasMinRole(item.minRole));

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          {collapsed ? (
            <img src="/logoImage.png" alt="AirRack" className="brand-img-icon" />
          ) : (
            <img src="/newAirRackLogo.png" alt="AirRack" className="brand-img" />
          )}
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item--active' : ''} ${collapsed ? 'nav-item--collapsed' : ''}`
              }
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="sidebar-collapse-row">
          <button
            className="collapse-btn"
            onClick={() => { setCollapsed((v) => !v); setDropdownOpen(false); }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FiChevronsRight size={16} /> : <FiChevronsLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          <div
            className="user-menu"
            onClick={() => !collapsed && setDropdownOpen((v) => !v)}
            title={collapsed ? `${user?.name} (${ROLE_LABELS[user?.role]})` : undefined}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{ROLE_LABELS[user?.role]}</span>
                </div>
                <FiChevronDown
                  size={14}
                  className={`chevron ${dropdownOpen ? 'chevron--open' : ''}`}
                />
              </>
            )}
          </div>

          {dropdownOpen && !collapsed && (
            <div className="user-dropdown">
              <button className="dropdown-item logout" onClick={handleLogout}>
                <FiLogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
