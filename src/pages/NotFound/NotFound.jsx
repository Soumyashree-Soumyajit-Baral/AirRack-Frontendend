import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', color: '#374151' }}>
      <h1 style={{ margin: 0, fontSize: '5rem', fontWeight: 900, color: '#e5e7eb' }}>404</h1>
      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Page Not Found</h2>
      <p style={{ margin: 0, color: '#6b7280' }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <button
        onClick={() => navigate(-1)}
        style={{ padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
      >
        Go Back
      </button>
    </div>
  );
};

export default NotFound;
