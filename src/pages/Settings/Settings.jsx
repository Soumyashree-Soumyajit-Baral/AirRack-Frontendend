import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiShield, FiCalendar, FiPhone, FiClock, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import { ROLE_LABELS } from '../../constants/roles';
import { changePasswordApi } from '../../api/auth.api';
import './Settings.css';

const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB');
};

const InfoCard = ({ label, icon: Icon, value }) => (
  <div className="info-card">
    <span className="info-card-label">{label}</span>
    <div className="info-card-row">
      <div className="info-card-icon"><Icon size={18} /></div>
      <span className="info-card-value">{value}</span>
    </div>
  </div>
);

const PasswordField = ({ label, name, value, onChange, show, onToggle, placeholder }) => (
  <div className="pw-field-group">
    <label className="pw-label">{label}</label>
    <div className="pw-input-wrap">
      <FiLock size={15} className="pw-input-icon" />
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pw-input"
        autoComplete="new-password"
      />
      <button type="button" className="pw-toggle" onClick={onToggle} tabIndex={-1}>
        {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
      </button>
    </div>
  </div>
);

const EMPTY_PW = { currentPassword: '', newPassword: '', confirmPassword: '' };

const Settings = () => {
  const { user, fetchMe } = useAuthStore();

  // Always load fresh user data so phone/lastLogin reflect latest DB state
  useEffect(() => { fetchMe(); }, []);

  const [pwForm, setPwForm] = useState(EMPTY_PW);
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handlePwChange = (e) =>
    setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleShow = (field) =>
    setShow((p) => ({ ...p, [field]: !p[field] }));

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('All fields are required.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await changePasswordApi({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully.');
      setPwForm(EMPTY_PW);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">

      {/* Account Information */}
      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-dot" />
          <h2 className="settings-section-title">Account Information</h2>
        </div>
        <div className="info-grid">
          <InfoCard label="NAME"       icon={FiUser}     value={user?.name  || '-'} />
          <InfoCard label="EMAIL"      icon={FiMail}     value={user?.email || '-'} />
          <InfoCard label="ROLE"       icon={FiShield}   value={ROLE_LABELS[user?.role] || user?.role || '-'} />
          <InfoCard label="JOINED"     icon={FiCalendar} value={fmtDate(user?.createdAt)} />
          <InfoCard label="PHONE"      icon={FiPhone}    value={user?.phone || '-'} />
          <InfoCard label="LAST LOGIN" icon={FiClock}    value={user?.lastLogin ? fmtDate(user.lastLogin) : '-'} />
        </div>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-dot" />
          <h2 className="settings-section-title">Change Password</h2>
        </div>

        <div className="pw-card">
          {pwError && (
            <div className="pw-alert pw-alert--error">
              <FiAlertCircle size={14} /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="pw-alert pw-alert--success">
              <FiCheck size={14} /> {pwSuccess}
            </div>
          )}

          <form className="pw-form" onSubmit={handlePwSubmit}>
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              show={show.current}
              onToggle={() => toggleShow('current')}
              placeholder="Enter current password"
            />
            <PasswordField
              label="New Password"
              name="newPassword"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              show={show.newPw}
              onToggle={() => toggleShow('newPw')}
              placeholder="Min. 6 characters"
            />
            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              show={show.confirm}
              onToggle={() => toggleShow('confirm')}
              placeholder="Repeat new password"
            />

            <div className="pw-form-footer">
              <button type="submit" className="pw-submit-btn" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Settings;
