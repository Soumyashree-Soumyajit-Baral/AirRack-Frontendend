import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiPackage, FiShield, FiBarChart2, FiBox } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import './Login.css';

const FEATURES = [
  { icon: FiBarChart2, label: 'Real-time Records',   sub: 'Live warehouse insights' },
  { icon: FiShield,    label: 'Secure & Compliant',  sub: 'Enterprise-grade security' },
  { icon: FiBox,       label: 'Built for Warehouses', sub: 'By operations experts' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    const result = await login(form.email.trim(), form.password);
    if (result.success) navigate('/dashboard', { replace: true });
    else setError(result.message);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <img src="/newAirRackLogo.png" alt="AirRack" className="login-brand-img" />
        </div>

        {/* Heading */}
        <div className="login-heading">
          <p className="login-welcome">Welcome to</p>
          <h1 className="login-app-name">AirRack</h1>
          <p className="login-tagline">Smarter Warehouse. Smarter Decisions.</p>
        </div>

        {/* Form box */}
        <div className="login-form-box">
          <h2 className="form-heading">Welcome Back</h2>
          <p className="form-sub">Sign in to access your warehouse dashboard.</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiMail size={15} /></span>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  className="form-input" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock size={15} /></span>
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required
                  className="form-input" placeholder="Enter your password"
                  value={form.password} onChange={handleChange} disabled={isLoading}
                />
                <button type="button" className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="login-features">
          {FEATURES.map(({ icon: Icon, label, sub }) => (
            <div className="feature-item" key={label}>
              <Icon size={17} className="feature-icon" />
              <div>
                <p className="feature-label">{label}</p>
                <p className="feature-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="login-footer">© {new Date().getFullYear()} AirRack. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
