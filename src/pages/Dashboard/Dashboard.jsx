import useAuthStore from '../../store/authStore';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '../../constants/roles';
import { FiPackage, FiUsers, FiShield, FiTool } from 'react-icons/fi';
import './Dashboard.css';

const ROLE_ICON = {
  super_admin: FiShield,
  admin: FiUsers,
  tech_rep: FiTool,
};

const ROLE_COLOR = {
  super_admin: '#7c3aed',
  admin: '#2563eb',
  tech_rep: '#059669',
};

const STAT_CARDS = [
  { label: 'Total Records', value: '—', icon: FiPackage },
  { label: 'Active Users', value: '—', icon: FiUsers },
];

const Dashboard = () => {
  const { user } = useAuthStore();
  const RoleIcon = ROLE_ICON[user?.role] || FiShield;
  const roleColor = ROLE_COLOR[user?.role] || '#2563eb';
  const permissions = ROLE_PERMISSIONS[user?.role] || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name}</strong>
          </p>
        </div>
        <div className="role-badge" style={{ '--role-color': roleColor }}>
          <RoleIcon size={15} />
          <span>{ROLE_LABELS[user?.role]}</span>
        </div>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="permission-panel">
        <h2 className="panel-title">Your Permissions</h2>
        <div className="permission-list">
          {permissions.map((perm) => (
            <span key={perm} className="permission-tag">
              {perm.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="info-panel">
        <h2 className="panel-title">Account Info</h2>
        <dl className="info-list">
          <div className="info-row">
            <dt>Name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div className="info-row">
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="info-row">
            <dt>Role</dt>
            <dd>{ROLE_LABELS[user?.role]}</dd>
          </div>
          <div className="info-row">
            <dt>Status</dt>
            <dd>
              <span className="status-active">Active</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default Dashboard;
