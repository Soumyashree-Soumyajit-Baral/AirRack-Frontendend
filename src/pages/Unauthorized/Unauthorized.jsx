import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: '#374151' }}>
      <FiAlertTriangle size={48} color="#f59e0b" />
      <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>You don&apos;t have permission to view this page.</p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
