import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronRight, FiChevronDown, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { getAllUsersApi, createUserApi, updateUserApi, deleteUserApi } from '../../api/users.api';
import useAuthStore from '../../store/authStore';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '../../constants/roles';
import './Users.css';

const ROLES = ['super_admin', 'admin', 'tech_rep'];

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role: 'tech_rep' };

const Users = () => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ super_admin: true, admin: true, tech_rep: true });

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [pageError, setPageError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await getAllUsersApi();
      setUsers(data.users);
    } catch {
      setPageError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (role) =>
    setExpanded((p) => ({ ...p, [role]: !p[role] }));

  const filtered = search
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const grouped = ROLES.reduce((acc, role) => {
    acc[role] = filtered.filter((u) => u.role === role);
    return acc;
  }, {});

  /* ── Modal helpers ── */
  const openAdd = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditUser(null); setFormError(''); };

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email) { setFormError('Name and email are required.'); return; }
    if (!editUser && !form.password) { setFormError('Password is required for new users.'); return; }

    setSaving(true);
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role };
        const { data } = await updateUserApi(editUser.id, payload);
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? data.user : u));
      } else {
        const { data } = await createUserApi(form);
        setUsers((prev) => [data.user, ...prev]);
      }
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteUserApi(deleteId);
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleteId(null);
    }
  };

  const PermissionTags = ({ role }) => {
    const perms = ROLE_PERMISSIONS[role] || [];
    const shown = perms.slice(0, 3);
    const rest = perms.length - 3;
    return (
      <div className="perm-tags">
        {shown.map((p) => (
          <span key={p} className="perm-tag">{p.replace(/_/g, '_').toUpperCase()}</span>
        ))}
        {rest > 0 && <span className="perm-more">+{rest} more</span>}
      </div>
    );
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1 className="users-title">Users Management</h1>
        <button className="btn-add-user" onClick={openAdd}>
          <FiPlus size={16} /> Add User
        </button>
      </div>

      <div className="users-search-bar">
        <FiSearch size={16} className="users-search-icon" />
        <input
          className="users-search-input"
          placeholder="Search users by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {pageError && (
        <div className="alert-error">
          <FiAlertCircle size={14} /> {pageError}
          <button onClick={() => setPageError('')}><FiX size={13} /></button>
        </div>
      )}

      {loading ? (
        <div className="users-loading">Loading users...</div>
      ) : (
        <div className="users-groups">
          {ROLES.map((role) => {
            const group = grouped[role];
            const isOpen = expanded[role];
            return (
              <div className="role-group" key={role}>
                <button className="role-group-header" onClick={() => toggleGroup(role)}>
                  {isOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  <span className="role-group-label">
                    {ROLE_LABELS[role]} <span className="role-group-count">({group.length})</span>
                  </span>
                </button>

                {isOpen && group.length > 0 && (
                  <div className="role-group-body">
                    <table className="users-table">
                      <colgroup>
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '28%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '6%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Role</th>
                          <th>Permissions</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((u) => (
                          <tr key={u.id}>
                            <td className="td-name">{u.name}</td>
                            <td className="td-email">{u.email}</td>
                            <td>{u.phone || '-'}</td>
                            <td>
                              <span className={`role-badge role-${u.role}`}>
                                {ROLE_LABELS[u.role]}
                              </span>
                            </td>
                            <td className="td-perms"><PermissionTags role={u.role} /></td>
                            <td>
                              <span className={`status-dot ${u.isActive ? 'active' : 'inactive'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="td-actions">
                              <button className="action-btn edit" onClick={() => openEdit(u)} title="Edit">
                                <FiEdit2 size={15} />
                              </button>
                              {isSuperAdmin && u.id !== currentUser.id && (
                                <button className="action-btn delete" onClick={() => setDeleteId(u.id)} title="Delete">
                                  <FiTrash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isOpen && group.length === 0 && (
                  <div className="role-group-empty">No {ROLE_LABELS[role]} users found.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {formError && (
              <div className="alert-error modal-err">
                <FiAlertCircle size={14} /> {formError}
              </div>
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field-group">
                  <label>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div className="field-group">
                  <label>Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
                </div>
                <div className="field-group">
                  <label>Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="9999999999" />
                </div>
                <div className="field-group">
                  <label>Role *</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
                {!editUser && (
                  <div className="field-group field-full">
                    <label>Password *</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-add-user" disabled={saving}>
                  {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}><FiX size={18} /></button>
            </div>
            <p className="confirm-text">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
