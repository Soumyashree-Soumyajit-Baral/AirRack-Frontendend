import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiSearch,
  FiAlertCircle, FiClock, FiRotateCcw, FiFilter, FiChevronDown, FiMapPin, FiArrowUp, FiArrowDown, FiHome, FiDownload,
} from 'react-icons/fi';
import {
  getAllRecordsApi, createRecordApi, updateRecordApi, deleteRecordApi,
} from '../../api/racksData.api';
import { getRecordTimelineApi, getDeletedLogsApi } from '../../api/audit.api';
import { getAllWarehousesApi } from '../../api/warehouse.api';
import useAuthStore from '../../store/authStore';
import './Home.css';

const EMPTY_FORM = {
  boxId: '', aircraftType: '', aircraftRegistration: '', msn: '',
  recordType: '', recordDescription: '', dateRangeFrom: '', dateRangeTo: '',
  zone: '', aisle: '', rack: '', level: '',
  boxStatus: 'Active', condition: 'Good',
  lastMovementDate: '', issuedTo: '', returnDueDate: '', remarks: '',
};

const BOX_STATUS_OPTIONS = ['Active', 'Inactive', 'Issued', 'Archived'];
const CONDITION_OPTIONS = ['Good', 'Fair', 'Damaged'];

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return '-';
  return dt.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const fmtDateTime = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return '-';
  return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtTimeOnly = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const fmtDayLabel = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const toInputDate = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
};

const conditionClass = (condition) => {
  if (condition === 'Damaged') return 'row-damaged';
  if (condition === 'Fair') return 'row-fair';
  return '';
};

const ACTION_META = {
  created:        { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Created' },
  updated:        { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Updated' },
  status_changed: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Status Changed' },
  deleted:        { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Deleted' },
};

const groupByDate = (logs) => {
  const map = new Map();
  logs.forEach((log) => {
    const key = new Date(log.timestamp).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(log);
  });
  return Array.from(map.entries()).map(([dateStr, items]) => ({ dateStr, items }));
};

const TimelineEntry = ({ log }) => {
  const meta = ACTION_META[log.action] || ACTION_META.updated;
  let title = '';
  if (log.action === 'created') title = 'Record Created';
  else if (log.action === 'deleted') title = 'Record Deleted';
  else title = `${log.fieldLabel || log.field}: "${log.oldValue}" → "${log.newValue}"`;

  return (
    <div className="tl-entry" style={{ background: meta.bg, borderColor: meta.border }}>
      <div className="tl-entry-icon" style={{ background: meta.bg, border: `1.5px solid ${meta.border}`, color: meta.color }}>
        {log.action === 'status_changed' ? <FiRotateCcw size={14} /> : <FiEdit2 size={14} />}
      </div>
      <div className="tl-entry-body">
        <span className="tl-entry-title" style={{ color: '#111827' }}>{title}</span>
        <span className="tl-entry-by">Performed by <strong>{log.performedByName}</strong></span>
      </div>
      <span className="tl-entry-time">{fmtTimeOnly(log.timestamp)}</span>
    </div>
  );
};

/* ── Timeline Drawer ── */
const TimelineDrawer = ({ recordId, boxId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecordTimelineApi(recordId)
      .then(({ data }) => setLogs(data.logs))
      .finally(() => setLoading(false));
  }, [recordId]);

  const counts = logs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});
  const total = logs.length;

  const grouped = groupByDate(logs);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="timeline-drawer">
        <div className="tl-header">
          <span className="tl-header-title">Action Timeline</span>
          <div className="tl-header-right">
            <span className="tl-item-chip">Item #{boxId}</span>
            <button className="tl-close" onClick={onClose}><FiX size={17} /></button>
          </div>
        </div>

        {loading ? (
          <div className="tl-loading">Loading timeline...</div>
        ) : total === 0 ? (
          <div className="tl-loading">No activity recorded yet.</div>
        ) : (
          <div className="tl-body">
            {/* Distribution */}
            <div className="tl-dist">
              <span className="tl-dist-label">Action Distribution ({total} total)</span>
              <div className="tl-dist-bar">
                {['updated', 'status_changed', 'created'].map((a) => counts[a] ? (
                  <div
                    key={a}
                    className="tl-dist-seg"
                    style={{ flex: counts[a], background: ACTION_META[a].color }}
                    title={`${ACTION_META[a].label}: ${counts[a]}`}
                  />
                ) : null)}
              </div>
              <div className="tl-dist-legend">
                {['updated', 'status_changed', 'created'].map((a) => counts[a] ? (
                  <span key={a} className="tl-legend-item">
                    <span className="tl-legend-dot" style={{ background: ACTION_META[a].color }} />
                    {ACTION_META[a].label} <strong>{counts[a]}</strong>
                  </span>
                ) : null)}
              </div>
            </div>

            {/* Grouped entries */}
            <div className="tl-groups">
              {grouped.map(({ dateStr, items }) => (
                <div key={dateStr} className="tl-group">
                  <div className="tl-date-col">
                    <span className="tl-date-label">{fmtDayLabel(items[0].timestamp)}</span>
                    <span className="tl-day-name">
                      {new Date(items[0].timestamp).toLocaleDateString('en-GB', { weekday: 'short' })}
                    </span>
                    <span className="tl-date-dot" style={{ background: ACTION_META[items[0].action]?.color || '#2563eb' }} />
                  </div>
                  <div className="tl-entries">
                    {items.map((log, i) => <TimelineEntry key={i} log={log} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ── Delete Logs Modal ── */
const DeleteLogsModal = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeletedLogsApi()
      .then(({ data }) => setLogs(data.logs))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dl-header">
          <div className="dl-header-left">
            <div className="dl-header-icon"><FiTrash2 size={18} /></div>
            <div>
              <h2 className="dl-title">Delete Logs</h2>
              <p className="dl-subtitle">History of permanently deleted records</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* Summary bar */}
        {!loading && logs.length > 0 && (
          <div className="dl-summary">
            <span className="dl-summary-count">{logs.length}</span>
            <span className="dl-summary-label">record{logs.length !== 1 ? 's' : ''} deleted in total</span>
          </div>
        )}

        {/* Body */}
        <div className="dl-body">
          {loading ? (
            <div className="dl-empty">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="dl-empty">
              <FiTrash2 size={28} className="dl-empty-icon" />
              <p>No records have been deleted yet.</p>
            </div>
          ) : (
            <div className="dl-list">
              {logs.map((log, i) => {
                const s = log.snapshot || {};
                const dateRange = s.dateRangeFrom && s.dateRangeTo
                  ? `${fmtDate(s.dateRangeFrom)} → ${fmtDate(s.dateRangeTo)}`
                  : '—';
                const snapFields = [
                  { label: 'Aircraft Type',   value: s.aircraftType         || '—' },
                  { label: 'Aircraft Reg',    value: s.aircraftRegistration || '—' },
                  { label: 'MSN',             value: s.msn                  || '—' },
                  { label: 'Record Type',     value: s.recordType           || '—' },
                  { label: 'Date Range',      value: dateRange },
                  { label: 'Zone',            value: s.zone                 || '—' },
                  { label: 'Aisle',           value: s.aisle                || '—' },
                  { label: 'Rack',            value: s.rack                 || '—' },
                  { label: 'Level',           value: s.level                || '—' },
                  { label: 'Location Code',   value: s.fullLocationCode     || '—' },
                  { label: 'Box Status',      value: s.boxStatus            || '—' },
                  { label: 'Condition',       value: s.condition            || '—' },
                ];
                return (
                  <div key={log._id} className="dl-card">
                    {/* Card header */}
                    <div className="dl-card-header">
                      <span className="dl-card-num">#{i + 1}</span>
                      <div className="dl-card-box">
                        <span className="dl-box-id">{log.boxId}</span>
                        <span className="dl-box-label">Box ID</span>
                      </div>
                      <div className="dl-card-divider" />
                      <div className="dl-card-by">
                        <div className="dl-avatar">{log.performedByName?.charAt(0).toUpperCase()}</div>
                        <div>
                          <span className="dl-by-name">{log.performedByName}</span>
                          <span className="dl-by-label">Deleted by</span>
                        </div>
                      </div>
                      <div className="dl-card-divider" />
                      <div className="dl-card-time">
                        <span className="dl-time-val">{fmtDateTime(log.timestamp)}</span>
                        <span className="dl-time-label">Deleted at</span>
                      </div>
                    </div>
                    {/* Snapshot grid */}
                    <div className="dl-snap-grid">
                      {snapFields.map(({ label, value }) => (
                        <div key={label} className="dl-snap-field">
                          <span className="dl-snap-label">{label}</span>
                          <span className="dl-snap-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Main Home component
════════════════════════════════════════ */
const Home = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('manage_records');
  const canAdd = hasPermission('add_records') || canManage;

  const [warehouses, setWarehouses]             = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showWhPicker, setShowWhPicker]           = useState(false);
  const whPickerRef                               = useRef(null);

  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});

  const [showModal, setShowModal] = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [addError, setAddError]   = useState('');
  const [saving, setSaving]       = useState(false);

  const [deleteId, setDeleteId]             = useState(null);
  const [showDeleteLogs, setShowDeleteLogs] = useState(false);
  const [timelineRecord, setTimelineRecord] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const EMPTY_FILTERS = { msn: '', recordType: '', dateFrom: '', dateTo: '', boxStatus: '', condition: '' };
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const SORT_OPTIONS = [
    { key: 'srno',  label: 'Sr. No' },
    { key: 'boxId', label: 'Box Number' },
    { key: 'zone',  label: 'Zone' },
  ];
  const [sortBy, setSortBy]               = useState('srno');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const sortPickerRef                       = useRef(null);

  const [showExportPicker, setShowExportPicker] = useState(false);
  const exportPickerRef                          = useRef(null);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const recordTypeOptions = useMemo(() =>
    [...new Set(records.map((r) => r.recordType).filter(Boolean))].sort(),
  [records]);

  // Close warehouse picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (whPickerRef.current && !whPickerRef.current.contains(e.target)) {
        setShowWhPicker(false);
      }
      if (sortPickerRef.current && !sortPickerRef.current.contains(e.target)) {
        setShowSortPicker(false);
      }
      if (exportPickerRef.current && !exportPickerRef.current.contains(e.target)) {
        setShowExportPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch warehouses once, auto-select first
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const { data } = await getAllWarehousesApi();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0) setSelectedWarehouse(data.warehouses[0]);
      } catch { /* silent */ }
    };
    loadWarehouses();
  }, []);

  // Re-fetch records when warehouse changes
  useEffect(() => {
    fetchRecords(selectedWarehouse?._id);
  }, [selectedWarehouse]);

  const fetchRecords = async (warehouseId) => {
    setLoading(true);
    try {
      const { data } = await getAllRecordsApi(warehouseId);
      setRecords(data.records);
    } catch {
      setError('Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  const fmtWhAddress = (wh) => {
    if (!wh) return '';
    const parts = [wh.area, wh.city, wh.district, wh.state, wh.pin, wh.country].filter(Boolean);
    return parts.join(', ');
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (
      r.boxId?.toLowerCase().includes(q) ||
      r.aircraftType?.toLowerCase().includes(q) ||
      r.aircraftRegistration?.toLowerCase().includes(q) ||
      r.recordType?.toLowerCase().includes(q) ||
      r.fullLocationCode?.toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (filters.msn && !r.msn?.toLowerCase().includes(filters.msn.toLowerCase())) return false;
    if (filters.recordType && r.recordType !== filters.recordType) return false;
    if (filters.boxStatus && r.boxStatus !== filters.boxStatus) return false;
    if (filters.condition && r.condition !== filters.condition) return false;
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      const rFrom = r.dateRangeFrom ? new Date(r.dateRangeFrom) : null;
      if (!rFrom || rFrom < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      const rTo = r.dateRangeTo ? new Date(r.dateRangeTo) : null;
      if (!rTo || rTo > to) return false;
    }
    return true;
  });

  const sorted = useMemo(() => {
    if (sortBy === 'boxId') return [...filtered].sort((a, b) => (a.boxId || '').localeCompare(b.boxId || ''));
    if (sortBy === 'zone')  return [...filtered].sort((a, b) => (a.zone || '').localeCompare(b.zone || ''));
    return filtered;
  }, [filtered, sortBy]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

  const buildExportRows = () =>
    sorted.map((r, i) => ({
      'Sr. No':             i + 1,
      'Box ID':             r.boxId             || '-',
      'Aircraft Type':      r.aircraftType       || '-',
      'Aircraft Reg.':      r.aircraftRegistration || '-',
      'MSN':                r.msn               || '-',
      'Record Type':        r.recordType        || '-',
      'Record Description': r.recordDescription || '-',
      'Date From':          fmtDate(r.dateRangeFrom),
      'Date To':            fmtDate(r.dateRangeTo),
      'Zone':               r.zone              || '-',
      'Aisle':              r.aisle             || '-',
      'Rack':               r.rack              || '-',
      'Level':              r.level             || '-',
      'Full Location Code': r.fullLocationCode  || '-',
      'Box Status':         r.boxStatus         || '-',
      'Condition':          r.condition         || '-',
      'Last Movement':      fmtDate(r.lastMovementDate),
      'Issued To':          r.issuedTo          || '-',
      'Return Due':         fmtDate(r.returnDueDate),
      'Remarks':            r.remarks           || '-',
    }));

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const rows = buildExportRows();
    const headers = Object.keys(rows[0] || {});

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Records', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Header row
    ws.addRow(headers);
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
      cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF15803D' } },
      };
    });
    headerRow.height = 22;

    // Data rows
    rows.forEach((r, i) => {
      const row = ws.addRow(headers.map((h) => r[h]));
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        });
      }
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: false };
      });
    });

    // Auto column widths
    ws.columns.forEach((col, idx) => {
      const header = headers[idx] || '';
      const maxLen = Math.max(
        header.length,
        ...rows.map((r) => String(r[header] ?? '').length),
      );
      col.width = Math.min(Math.max(maxLen + 2, 10), 40);
    });

    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `AirRack_Records_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportPicker(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const rows = buildExportRows();
    const headers = Object.keys(rows[0] || {});

    // A3 landscape: ~1190 x 842 pt
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;

    // ── Logo (top-right) ──────────────────────────────────────
    try {
      const res = await fetch('/newAirRackLogo.png');
      const blob = await res.blob();
      const b64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      // draw logo: 130px wide, maintain aspect — placed top-right
      doc.addImage(b64, 'PNG', pageW - margin - 130, 18, 130, 38);
    } catch { /* skip logo if unavailable */ }

    // ── Header text (top-left) ───────────────────────────────
    doc.setFontSize(15);
    doc.setTextColor(22, 101, 52);   // dark green
    doc.setFont(undefined, 'bold');
    doc.text(`AirRack Records — ${selectedWarehouse?.name || ''}`, margin, 36);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Exported: ${new Date().toLocaleString('en-GB')}   |   ${rows.length} record(s)`,
      margin, 52,
    );

    // ── Divider line ─────────────────────────────────────────
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1);
    doc.line(margin, 60, pageW - margin, 60);

    // ── Table ────────────────────────────────────────────────
    autoTable(doc, {
      startY: 68,
      head: [headers],
      body: rows.map((r) => headers.map((h) => r[h])),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      tableLineColor: [209, 250, 229],
      tableLineWidth: 0.3,
    });

    // ── Signature / Stamp — pinned to bottom of last page ────
    const pageH    = doc.internal.pageSize.getHeight();
    const sigY     = pageH - 36;   // 36pt above the very bottom edge

    doc.setPage(doc.internal.getNumberOfPages());
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, 'normal');
    const sigLabel = 'Signature / Stamp:';
    doc.text(sigLabel, margin, sigY);
    const labelW = doc.getTextWidth(sigLabel);
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.6);
    doc.line(margin + labelW + 8, sigY, margin + labelW + 200, sigY);

    // ── Footer on each page ───────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Page ${p} of ${totalPages}   |   AirRack Warehouse Management`,
        margin, doc.internal.pageSize.getHeight() - 14,
      );
    }

    doc.save(`AirRack_Records_${new Date().toISOString().slice(0,10)}.pdf`);
    setShowExportPicker(false);
  };

  const startEdit = (record) => {
    setEditId(record._id);
    setEditData({
      boxId: record.boxId || '',
      aircraftType: record.aircraftType || '',
      aircraftRegistration: record.aircraftRegistration || '',
      msn: record.msn || '',
      recordType: record.recordType || '',
      recordDescription: record.recordDescription || '',
      dateRangeFrom: toInputDate(record.dateRangeFrom),
      dateRangeTo: toInputDate(record.dateRangeTo),
      zone: record.zone || '',
      aisle: record.aisle || '',
      rack: record.rack || '',
      level: record.level || '',
      fullLocationCode: record.fullLocationCode || '',
      boxStatus: record.boxStatus || 'Active',
      condition: record.condition || 'Good',
      lastMovementDate: toInputDate(record.lastMovementDate),
      issuedTo: record.issuedTo || '',
      returnDueDate: toInputDate(record.returnDueDate),
      remarks: record.remarks || '',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const { data } = await updateRecordApi(id, editData);
      setRecords((prev) => prev.map((r) => r._id === id ? data.record : r));
      cancelEdit();
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRecordApi(deleteId);
      setRecords((prev) => prev.filter((r) => r._id !== deleteId));
    } catch {
      setError('Failed to delete record.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddChange = (e) =>
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.boxId) { setAddError('Box ID is required.'); return; }
    setSaving(true);
    try {
      const payload = { ...addForm, warehouseId: selectedWarehouse?._id };
      const { data } = await createRecordApi(payload);
      setRecords((prev) => [...prev, data.record]);
      setShowModal(false);
      setAddForm(EMPTY_FORM);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add record.');
    } finally {
      setSaving(false);
    }
  };

  const totalCols = canManage ? 20 : 19;

  return (
    <div className="home">
      {/* Header */}
      <div className="home-header">
        <div className="wh-switcher-wrap" ref={whPickerRef}>
          <button className="wh-switcher-btn" onClick={() => setShowWhPicker((v) => !v)}>
            <div className="wh-switcher-icon"><FiHome size={18} /></div>
            <div className="wh-switcher-text">
              <div className="wh-switcher-title-row">
                <h1 className="home-title">
                  {selectedWarehouse ? selectedWarehouse.name : 'Select Warehouse'}
                </h1>
                <span className="wh-record-badge">{records.length} records</span>
              </div>
              {selectedWarehouse && (
                <p className="home-subtitle">
                  <FiMapPin size={11} style={{ marginRight: 4, color: '#2563eb' }} />
                  {fmtWhAddress(selectedWarehouse) || 'No address set'}
                </p>
              )}
            </div>
            <FiChevronDown size={16} className={`wh-switcher-chevron ${showWhPicker ? 'open' : ''}`} />
          </button>

          {showWhPicker && (
            <div className="wh-picker-dropdown">
              {warehouses.length === 0 ? (
                <div className="wh-picker-empty">No warehouses found</div>
              ) : (
                warehouses.map((wh) => (
                  <button
                    key={wh._id}
                    className={`wh-picker-item ${selectedWarehouse?._id === wh._id ? 'active' : ''}`}
                    onClick={() => { setSelectedWarehouse(wh); setShowWhPicker(false); }}
                  >
                    <span className="wh-picker-name">{wh.name}</span>
                    {fmtWhAddress(wh) && <span className="wh-picker-addr">{fmtWhAddress(wh)}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="home-actions">
          <div className="search-box">
            <FiSearch size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by Box ID, aircraft, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="export-picker-wrap" ref={exportPickerRef}>
            <button
              className={`btn-export ${showExportPicker ? 'btn-export--active' : ''}`}
              onClick={() => setShowExportPicker((v) => !v)}
            >
              <FiDownload size={14} />
              <span>Export</span>
              <FiChevronDown size={13} className={`export-chevron ${showExportPicker ? 'open' : ''}`} />
            </button>
            {showExportPicker && (
              <div className="export-dropdown">
                <button className="export-option" onClick={exportExcel}>
                  <span className="export-option-icon excel">XLS</span> Excel
                </button>
                <button className="export-option" onClick={exportPDF}>
                  <span className="export-option-icon pdf">PDF</span> PDF
                </button>
              </div>
            )}
          </div>
          <div className="sort-picker-wrap" ref={sortPickerRef}>
            <button
              className={`btn-sort ${showSortPicker ? 'btn-sort--active' : ''}`}
              onClick={() => setShowSortPicker((v) => !v)}
            >
              <FiArrowUp size={13} className="sort-icon-up" />
              <FiArrowDown size={13} className="sort-icon-down" />
              <span>Sort: <strong>{SORT_OPTIONS.find((o) => o.key === sortBy)?.label}</strong></span>
              <FiChevronDown size={13} className={`sort-chevron ${showSortPicker ? 'open' : ''}`} />
            </button>
            {showSortPicker && (
              <div className="sort-dropdown">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className={`sort-option ${sortBy === opt.key ? 'active' : ''}`}
                    onClick={() => { setSortBy(opt.key); setShowSortPicker(false); }}
                  >
                    {sortBy === opt.key && <span className="sort-check">✓</span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className={`btn-filter ${showFilter ? 'btn-filter--active' : ''}`}
            onClick={() => setShowFilter((v) => !v)}
          >
            <FiFilter size={15} /> Filters
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>
          <button className="btn-delete-logs" onClick={() => setShowDeleteLogs(true)}>
            <FiRotateCcw size={15} /> Delete Logs
          </button>
          {canAdd && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <FiPlus size={16} /> Add Record
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <FiAlertCircle size={15} /> {error}
          <button onClick={() => setError('')}><FiX size={13} /></button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <span className="filter-panel-title"><FiFilter size={14} /> Filters</span>
            {activeFilterCount > 0 && (
              <button className="filter-clear-all" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear all filters
              </button>
            )}
          </div>
          <div className="filter-grid">
            {/* MSN */}
            <div className="filter-field">
              <label className="filter-label">MSN</label>
              <input
                className="filter-input"
                placeholder="All or type/select MSN"
                value={filters.msn}
                onChange={(e) => setFilters((p) => ({ ...p, msn: e.target.value }))}
              />
            </div>

            {/* Record Type */}
            <div className="filter-field">
              <label className="filter-label">Record Type</label>
              <select
                className="filter-select"
                value={filters.recordType}
                onChange={(e) => setFilters((p) => ({ ...p, recordType: e.target.value }))}
              >
                <option value="">All</option>
                {recordTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Box Status */}
            <div className="filter-field">
              <label className="filter-label">Box Status</label>
              <select
                className="filter-select"
                value={filters.boxStatus}
                onChange={(e) => setFilters((p) => ({ ...p, boxStatus: e.target.value }))}
              >
                <option value="">All</option>
                {BOX_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div className="filter-field">
              <label className="filter-label">Condition</label>
              <select
                className="filter-select"
                value={filters.condition}
                onChange={(e) => setFilters((p) => ({ ...p, condition: e.target.value }))}
              >
                <option value="">All</option>
                {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Date Range */}
            <div className="filter-field filter-field--date">
              <label className="filter-label">Date Range</label>
              <div className="filter-date-row">
                <div className="filter-date-group">
                  <span className="filter-date-sub">From Date</span>
                  <input
                    type="date"
                    className="filter-input"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="filter-date-group">
                  <span className="filter-date-sub">To Date</span>
                  <input
                    type="date"
                    className="filter-input"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                  />
                </div>
                {(filters.dateFrom || filters.dateTo) && (
                  <button
                    className="filter-clear-date"
                    onClick={() => setFilters((p) => ({ ...p, dateFrom: '', dateTo: '' }))}
                  >
                    Clear Date Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="rack-table">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th>Box ID</th>
              <th>Aircraft Type</th>
              <th>Aircraft Reg</th>
              <th>MSN</th>
              <th>Record Type</th>
              <th>Record Description</th>
              <th>Date Range</th>
              <th>Zone</th>
              <th>Aisle</th>
              <th>Rack</th>
              <th>Level</th>
              <th>Full Location Code</th>
              <th>Box Status</th>
              <th>Condition</th>
              <th>Last Movement</th>
              <th>Issued To</th>
              <th>Return Due</th>
              <th>Remarks</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={totalCols} className="td-center">Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={totalCols} className="td-center td-empty">No records found.</td></tr>
            ) : sorted.map((record, idx) => {
              const isEditing = editId === record._id;
              const ed = (field) => (e) => setEditData((p) => ({ ...p, [field]: e.target.value }));

              return (
                <tr key={record._id} className={conditionClass(isEditing ? editData.condition : record.condition)}>
                  <td className="col-sno">{idx + 1}</td>

                  {isEditing ? (
                    <>
                      <td><input className="td-input" value={editData.boxId} onChange={ed('boxId')} placeholder="BOX-001" /></td>
                      <td><input className="td-input" value={editData.aircraftType} onChange={ed('aircraftType')} placeholder="A320" /></td>
                      <td><input className="td-input" value={editData.aircraftRegistration} onChange={ed('aircraftRegistration')} placeholder="VT-ABC" /></td>
                      <td><input className="td-input" value={editData.msn} onChange={ed('msn')} placeholder="MSN" /></td>
                      <td><input className="td-input" value={editData.recordType} onChange={ed('recordType')} placeholder="Record type" /></td>
                      <td><input className="td-input" value={editData.recordDescription} onChange={ed('recordDescription')} placeholder="Description" /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                          <input type="date" className="td-input" value={editData.dateRangeFrom} onChange={ed('dateRangeFrom')} />
                          <input type="date" className="td-input" value={editData.dateRangeTo} onChange={ed('dateRangeTo')} />
                        </div>
                      </td>
                      <td><input className="td-input" value={editData.zone} onChange={ed('zone')} placeholder="Z01" /></td>
                      <td><input className="td-input" value={editData.aisle} onChange={ed('aisle')} placeholder="A2R" /></td>
                      <td><input className="td-input" value={editData.rack} onChange={ed('rack')} placeholder="R005" /></td>
                      <td><input className="td-input" value={editData.level} onChange={ed('level')} placeholder="L07" /></td>
                      <td><input className="td-input" value={editData.fullLocationCode} onChange={ed('fullLocationCode')} placeholder="e.g. Z01-A2R-R005-L07" /></td>
                      <td>
                        <select className="td-select" value={editData.boxStatus} onChange={ed('boxStatus')}>
                          {BOX_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="td-select" value={editData.condition} onChange={ed('condition')}>
                          {CONDITION_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td><input type="date" className="td-input" value={editData.lastMovementDate} onChange={ed('lastMovementDate')} /></td>
                      <td><input className="td-input" value={editData.issuedTo} onChange={ed('issuedTo')} placeholder="Issued to" /></td>
                      <td><input type="date" className="td-input" value={editData.returnDueDate} onChange={ed('returnDueDate')} /></td>
                      <td><textarea className="td-textarea" rows={2} value={editData.remarks} onChange={ed('remarks')} /></td>
                      <td className="td-actions">
                        <button className="btn-icon btn-icon--save" onClick={() => saveEdit(record._id)} disabled={saving} title="Save">
                          <FiSave size={15} />
                        </button>
                        <button className="btn-icon btn-icon--cancel" onClick={cancelEdit} title="Cancel">
                          <FiX size={15} />
                        </button>
                        <button className="btn-icon btn-icon--delete" onClick={() => setDeleteId(record._id)} title="Delete">
                          <FiTrash2 size={15} />
                        </button>
                        <button className="btn-icon btn-icon--timeline" onClick={() => setTimelineRecord(record)} title="View Timeline">
                          <FiClock size={15} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="td-bold">{record.boxId}</td>
                      <td>{record.aircraftType || '-'}</td>
                      <td>{record.aircraftRegistration || '-'}</td>
                      <td>{record.msn || '-'}</td>
                      <td>{record.recordType || '-'}</td>
                      <td>{record.recordDescription || '-'}</td>
                      <td className="td-nowrap">
                        {record.dateRangeFrom && record.dateRangeTo
                          ? `${fmtDate(record.dateRangeFrom)} to ${fmtDate(record.dateRangeTo)}`
                          : '-'}
                      </td>
                      <td>{record.zone || '-'}</td>
                      <td>{record.aisle || '-'}</td>
                      <td>{record.rack || '-'}</td>
                      <td>{record.level || '-'}</td>
                      <td className="td-bold td-nowrap">{record.fullLocationCode || '-'}</td>
                      <td><span className={`badge badge-${record.boxStatus?.toLowerCase()}`}>{record.boxStatus || '-'}</span></td>
                      <td><span className={`badge badge-${record.condition?.toLowerCase()}`}>{record.condition || '-'}</span></td>
                      <td>{fmtDate(record.lastMovementDate)}</td>
                      <td>{record.issuedTo || '-'}</td>
                      <td>{fmtDate(record.returnDueDate)}</td>
                      <td className="td-remarks">{record.remarks || '-'}</td>
                      {canManage ? (
                        <td className="td-actions">
                          <button className="btn-icon btn-icon--edit" onClick={() => startEdit(record)} title="Edit">
                            <FiEdit2 size={15} />
                          </button>
                          <button className="btn-icon btn-icon--delete" onClick={() => setDeleteId(record._id)} title="Delete">
                            <FiTrash2 size={15} />
                          </button>
                          <button className="btn-icon btn-icon--timeline" onClick={() => setTimelineRecord(record)} title="View Timeline">
                            <FiClock size={15} />
                          </button>
                        </td>
                      ) : (
                        <td className="td-actions">
                          <button className="btn-icon btn-icon--timeline" onClick={() => setTimelineRecord(record)} title="View Timeline">
                            <FiClock size={15} />
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Timeline Drawer ── */}
      {timelineRecord && (
        <TimelineDrawer
          recordId={timelineRecord._id}
          boxId={timelineRecord.boxId}
          onClose={() => setTimelineRecord(null)}
        />
      )}

      {/* ── Delete Logs Modal ── */}
      {showDeleteLogs && <DeleteLogsModal onClose={() => setShowDeleteLogs(false)} />}

      {/* ── Add Record Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Record</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX size={18} /></button>
            </div>

            {addError && <div className="alert-error modal-err"><FiAlertCircle size={14} />{addError}</div>}

            <form className="modal-form" onSubmit={handleAddSubmit}>
              <div className="form-grid">
                <div className="field-group">
                  <label>Box ID *</label>
                  <input name="boxId" value={addForm.boxId} onChange={handleAddChange} placeholder="BOX-001" required />
                </div>
                <div className="field-group">
                  <label>Aircraft Type</label>
                  <input name="aircraftType" value={addForm.aircraftType} onChange={handleAddChange} placeholder="A320" />
                </div>
                <div className="field-group">
                  <label>Aircraft Registration</label>
                  <input name="aircraftRegistration" value={addForm.aircraftRegistration} onChange={handleAddChange} placeholder="VT-ABC" />
                </div>
                <div className="field-group">
                  <label>MSN</label>
                  <input name="msn" value={addForm.msn} onChange={handleAddChange} placeholder="1234" />
                </div>
                <div className="field-group">
                  <label>Record Type</label>
                  <input name="recordType" value={addForm.recordType} onChange={handleAddChange} placeholder="Tech Log Pages" />
                </div>
                <div className="field-group">
                  <label>Record Description</label>
                  <input name="recordDescription" value={addForm.recordDescription} onChange={handleAddChange} placeholder="Brief description of the record" />
                </div>
                <div className="field-group">
                  <label>Date Range From</label>
                  <input type="date" name="dateRangeFrom" value={addForm.dateRangeFrom} onChange={handleAddChange} />
                </div>
                <div className="field-group">
                  <label>Date Range To</label>
                  <input type="date" name="dateRangeTo" value={addForm.dateRangeTo} onChange={handleAddChange} />
                </div>
                <div className="field-group">
                  <label>Zone</label>
                  <input name="zone" value={addForm.zone} onChange={handleAddChange} placeholder="Z01" />
                </div>
                <div className="field-group">
                  <label>Aisle</label>
                  <input name="aisle" value={addForm.aisle} onChange={handleAddChange} placeholder="A2R" />
                </div>
                <div className="field-group">
                  <label>Rack</label>
                  <input name="rack" value={addForm.rack} onChange={handleAddChange} placeholder="R005" />
                </div>
                <div className="field-group">
                  <label>Level</label>
                  <input name="level" value={addForm.level} onChange={handleAddChange} placeholder="L07" />
                </div>
                <div className="field-group">
                  <label>Box Status</label>
                  <select name="boxStatus" value={addForm.boxStatus} onChange={handleAddChange}>
                    {BOX_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label>Condition</label>
                  <select name="condition" value={addForm.condition} onChange={handleAddChange}>
                    {CONDITION_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label>Last Movement Date</label>
                  <input type="date" name="lastMovementDate" value={addForm.lastMovementDate} onChange={handleAddChange} />
                </div>
                <div className="field-group">
                  <label>Issued To</label>
                  <input name="issuedTo" value={addForm.issuedTo} onChange={handleAddChange} placeholder="Name / Dept" />
                </div>
                <div className="field-group">
                  <label>Return Due Date</label>
                  <input type="date" name="returnDueDate" value={addForm.returnDueDate} onChange={handleAddChange} />
                </div>
                <div className="field-group field-full">
                  <label>Remarks</label>
                  <textarea name="remarks" rows={3} value={addForm.remarks} onChange={handleAddChange} placeholder="Any notes..." />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cd-icon-wrap">
              <FiTrash2 size={26} />
            </div>
            <button className="cd-close" onClick={() => setDeleteId(null)}><FiX size={16} /></button>
            <h2 className="cd-title">Delete Record</h2>
            <p className="cd-text">
              This record will be <strong>moved to Trash</strong>. You can restore it or permanently delete it from the <strong>Trash</strong> page.
            </p>
            <div className="cd-record-chip">
              {records.find((r) => r._id === deleteId)?.boxId || 'Record'}
            </div>
            <div className="cd-actions">
              <button className="cd-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="cd-btn-delete" onClick={confirmDelete}>
                <FiTrash2 size={14} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
