import { useState, useEffect } from 'react';
import { FiTrash2, FiAlertCircle, FiSearch, FiRotateCcw, FiX } from 'react-icons/fi';
import { getDeletedLogsApi, restoreRecordApi, permanentDeleteLogApi } from '../../api/audit.api';
import useAuthStore from '../../store/authStore';
import './Trash.css';

const fmtDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const Trash = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('manage_records');

  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  const [confirmPermaId, setConfirmPermaId] = useState(null);
  const [actionLoading, setActionLoading]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getDeletedLogsApi();
        setLogs(data.logs || []);
      } catch {
        setError('Failed to load deleted records.');
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const handleRestore = async (id) => {
    setActionLoading(id);
    try {
      await restoreRecordApi(id);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch {
      setError('Failed to restore record. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmPermaId) return;
    setActionLoading(confirmPermaId);
    try {
      await permanentDeleteLogApi(confirmPermaId);
      setLogs((prev) => prev.filter((l) => l._id !== confirmPermaId));
    } catch {
      setError('Failed to permanently delete record.');
    } finally {
      setActionLoading(null);
      setConfirmPermaId(null);
    }
  };

  const colSpan = canManage ? 9 : 8;
  const confirmLog = logs.find((l) => l._id === confirmPermaId);

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
          <button className="trash-error-close" onClick={() => setError('')}><FiX size={13} /></button>
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
              {canManage && <th className="trash-th-action">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colSpan} className="trash-td-center">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={colSpan} className="trash-td-center trash-td-empty">No deleted records found.</td></tr>
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
                  {canManage && (
                    <td className="trash-td-actions">
                      <button
                        className="trash-btn-restore"
                        title="Restore record"
                        disabled={actionLoading === log._id}
                        onClick={() => handleRestore(log._id)}
                      >
                        <FiRotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        className="trash-btn-perma"
                        title="Permanently delete"
                        disabled={actionLoading === log._id}
                        onClick={() => setConfirmPermaId(log._id)}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {confirmPermaId && (
        <div className="trash-modal-overlay" onClick={() => setConfirmPermaId(null)}>
          <div className="trash-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trash-confirm-icon">
              <FiTrash2 size={26} />
            </div>
            <button className="trash-confirm-close" onClick={() => setConfirmPermaId(null)}>
              <FiX size={15} />
            </button>
            <h2 className="trash-confirm-title">Permanently Delete?</h2>
            <p className="trash-confirm-text">
              This record will be <strong>erased forever</strong> and cannot be recovered or restored.
            </p>
            {confirmLog && (
              <div className="trash-confirm-chip">{confirmLog.boxId}</div>
            )}
            <div className="trash-confirm-actions">
              <button className="trash-confirm-cancel" onClick={() => setConfirmPermaId(null)}>
                Cancel
              </button>
              <button
                className="trash-confirm-delete"
                disabled={!!actionLoading}
                onClick={handlePermanentDelete}
              >
                <FiTrash2 size={14} />
                {actionLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trash;
