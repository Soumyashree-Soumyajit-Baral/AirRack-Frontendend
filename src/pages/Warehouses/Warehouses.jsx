import { useState, useEffect } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiAlertCircle,
  FiMapPin, FiExternalLink, FiHome, FiDatabase,
} from 'react-icons/fi';
import {
  getAllWarehousesApi, createWarehouseApi,
  updateWarehouseApi, deleteWarehouseApi,
} from '../../api/warehouse.api';
import useAuthStore from '../../store/authStore';
import './Warehouses.css';

const EMPTY_FORM = {
  name: '', plotNo: '', street: '', landmark: '',
  area: '', city: '', district: '', state: '', pin: '', country: '', googleMapLocation: '',
};

const FIELDS = [
  { name: 'name',              label: 'Warehouse Name *', placeholder: 'Central Warehouse', span: 2 },
  { name: 'plotNo',            label: 'Plot No',          placeholder: 'Plot 14B' },
  { name: 'area',              label: 'Area',             placeholder: 'Whitefield' },
  { name: 'street',            label: 'Street',           placeholder: '5th Cross, MG Road' },
  { name: 'landmark',          label: 'Landmark',         placeholder: 'Near City Mall' },
  { name: 'city',              label: 'City',             placeholder: 'Bengaluru' },
  { name: 'district',          label: 'District',         placeholder: 'Bengaluru Urban' },
  { name: 'state',             label: 'State',            placeholder: 'Karnataka' },
  { name: 'pin',               label: 'PIN Code',         placeholder: '560001' },
  { name: 'country',           label: 'Country',          placeholder: 'India' },
  { name: 'googleMapLocation', label: 'Google Map Link',  placeholder: 'https://maps.google.com/...', span: 2 },
];

const Warehouses = () => {
  const { hasMinRole } = useAuthStore();
  const canManage = hasMinRole('admin');

  const [warehouses, setWarehouses]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await getAllWarehousesApi();
      setWarehouses(data.warehouses);
    } catch {
      setError('Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (wh) => {
    setEditingId(wh._id);
    setForm({
      name: wh.name || '', plotNo: wh.plotNo || '', street: wh.street || '',
      landmark: wh.landmark || '', area: wh.area || '', city: wh.city || '', district: wh.district || '', state: wh.state || '',
      pin: wh.pin || '', country: wh.country || '', googleMapLocation: wh.googleMapLocation || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Warehouse name is required.'); return; }
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        const { data } = await updateWarehouseApi(editingId, form);
        setWarehouses((prev) => prev.map((w) => w._id === editingId ? data.warehouse : w));
      } else {
        const { data } = await createWarehouseApi(form);
        setWarehouses((prev) => [data.warehouse, ...prev]);
      }
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save warehouse.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWarehouseApi(deleteId);
      setWarehouses((prev) => prev.filter((w) => w._id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const formatAddress = (wh) => {
    const parts = [wh.plotNo, wh.area, wh.street, wh.landmark, wh.city, wh.district, wh.state, wh.pin, wh.country];
    return parts.filter(Boolean).join(', ') || 'No address provided';
  };

  return (
    <div className="wh-page">

      {/* Header */}
      <div className="wh-header">
        <div className="wh-header-left">
          <div className="wh-header-icon"><FiDatabase size={18} /></div>
          <div>
            <h1 className="wh-title">Warehouses</h1>
            <p className="wh-subtitle">{warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
        {canManage && (
          <button className="wh-add-btn" onClick={openAdd}>
            <FiPlus size={16} /> Add Warehouse
          </button>
        )}
      </div>

      {error && (
        <div className="wh-error">
          <FiAlertCircle size={14} /> {error}
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="wh-empty">Loading...</div>
      ) : warehouses.length === 0 ? (
        <div className="wh-empty">No warehouses found. {canManage && 'Click "Add Warehouse" to get started.'}</div>
      ) : (
        <div className="wh-grid">
          {warehouses.map((wh) => (
            <div key={wh._id} className="wh-card">
              <div className="wh-card-header">
                <div className="wh-card-icon">
                  <FiHome size={20} />
                </div>
                <div className="wh-card-title-wrap">
                  <h3 className="wh-card-name">{wh.name}</h3>
                  {(wh.district || wh.state) && (
                    <span className="wh-card-region">{[wh.district, wh.state].filter(Boolean).join(', ')}</span>
                  )}
                </div>
                {canManage && (
                  <div className="wh-card-actions">
                    <button className="wh-btn-icon wh-btn-edit" onClick={() => openEdit(wh)} title="Edit">
                      <FiEdit2 size={14} />
                    </button>
                    <button className="wh-btn-icon wh-btn-delete" onClick={() => setDeleteId(wh._id)} title="Delete">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="wh-card-address">
                <FiMapPin size={13} className="wh-address-icon" />
                <span>{formatAddress(wh)}</span>
              </div>

              {wh.googleMapLocation && (
                <a
                  href={wh.googleMapLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wh-map-link"
                >
                  <FiExternalLink size={13} /> View on Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="wh-overlay" onClick={closeModal}>
          <div className="wh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wh-modal-header">
              <h2>{editingId ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
              <button className="wh-modal-close" onClick={closeModal}><FiX size={18} /></button>
            </div>

            {formError && (
              <div className="wh-form-error">
                <FiAlertCircle size={14} /> {formError}
              </div>
            )}

            <form className="wh-form" onSubmit={handleSubmit}>
              <div className="wh-form-grid">
                {FIELDS.map(({ name, label, placeholder, span }) => (
                  <div key={name} className={`wh-field${span === 2 ? ' wh-field--full' : ''}`}>
                    <label className="wh-label">{label}</label>
                    <input
                      className="wh-input"
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              <div className="wh-form-footer">
                <button type="button" className="wh-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="wh-btn-submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Warehouse' : 'Add Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="wh-overlay" onClick={() => setDeleteId(null)}>
          <div className="wh-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="wh-confirm-icon"><FiTrash2 size={22} /></div>
            <h3 className="wh-confirm-title">Delete Warehouse?</h3>
            <p className="wh-confirm-sub">This action cannot be undone.</p>
            <div className="wh-confirm-btns">
              <button className="wh-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="wh-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
