import { useState, useEffect } from 'react';
import { FiTrash2, FiAlertCircle, FiSearch } from 'react-icons/fi';
import { getDeletedLogsApi } from '../../api/audit.api';
import './Trash.css';

const fmtDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const Trash = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getDeletedLogsApi();
        setLogs(data.logs || []);
      } catch {
        setError('Failed to load deleted records.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      log.boxId?.toLowerCase().includes(q) ||
      log.snapshot?.aircraftType?.toLowerCase().includes(q) ||
      log.snapshot?.msn?.toLowerCase().includes(q) ||
      log.snapshot?.recordType?.toLowerCase().includes(q) ||
      log.snapshot?.fullLocationCode?.toLowerCase().includes(q) ||
      log.performedByName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="trash-page">
      {/* Header */}
      <div className="trash-header">
        <div className="trash-header-left">
          <div className="trash-icon-wrap">
            <FiTrash2 size={20} />
          </div>
          <div>
            <h1 className="trash-title">Trash</h1>
            <p className="trash-subtitle">{logs.length} deleted record{logs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="trash-search-box">
          <FiSearch size={14} className="trash-search-icon" />
          <input
            className="trash-search-input"
            placeholder="Search by Box ID, type, deleted by..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="trash-error">
          <FiAlertCircle size={14} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="trash-table-wrap">
        <table className="trash-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Box ID</th>
              <th>Aircraft Type</th>
              <th>MSN</th>
              <th>Record Type</th>
              <th>Full Location Code</th>
              <th>Deleted By</th>
              <th>Date / Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="trash-td-center">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="trash-td-center trash-td-empty">No deleted records found.</td></tr>
            ) : (
              filtered.map((log, i) => (
                <tr key={log._id}>
                  <td className="trash-td-sno">{i + 1}</td>
                  <td className="trash-td-bold">{log.boxId || '-'}</td>
                  <td>{log.snapshot?.aircraftType || '-'}</td>
                  <td>{log.snapshot?.msn || '-'}</td>
                  <td>{log.snapshot?.recordType || '-'}</td>
                  <td className="trash-td-loc">{log.snapshot?.fullLocationCode || '-'}</td>
                  <td>
                    <span className="trash-deleted-by">{log.performedByName || '-'}</span>
                  </td>
                  <td className="trash-td-time">{fmtDateTime(log.timestamp)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trash;
