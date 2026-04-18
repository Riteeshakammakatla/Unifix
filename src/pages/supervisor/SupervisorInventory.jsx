import React, { useState, useEffect } from 'react';
import { materialsAPI } from '../../services/api';
import { Box, Plus, Edit, Trash2, AlertTriangle, Search, Activity } from 'lucide-react';

const SupervisorInventory = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    material_name: '',
    total_quantity: 0,
    material_type: 'Consumable',
    category: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await materialsAPI.list();
      setMaterials(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await materialsAPI.update(editingItem.id, formData);
      } else {
        await materialsAPI.create({
          ...formData,
          available_quantity: formData.total_quantity
        });
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ material_name: '', total_quantity: 0, material_type: 'Consumable', category: '' });
      fetchMaterials();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      material_name: item.material_name,
      total_quantity: item.total_quantity,
      material_type: item.material_type,
      category: item.category || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await materialsAPI.delete(id);
      fetchMaterials();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Inventory Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Track and manage your department's tools and consumables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>
          <Plus size={18} /> Add Material
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Type</th>
                <th>Total</th>
                <th>Available</th>
                <th>Used</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading...</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Inventory is empty. Add your first item.</td></tr>
              ) : (
                materials.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600' }}>{item.material_name}</td>
                    <td><span className="badge badge-open">{item.material_type}</span></td>
                    <td>{item.total_quantity}</td>
                    <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{item.available_quantity}</td>
                    <td>{item.used_quantity}</td>
                    <td>
                      {item.available_quantity <= item.total_quantity * 0.2 ? (
                        <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-low">Healthy</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(item)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline text-error" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>{editingItem ? 'Edit Material' : 'Add New Material'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Material Name</label>
                <input 
                  className="input-field" 
                  value={formData.material_name} 
                  onChange={e => setFormData({...formData, material_name: e.target.value})} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Initial/Total Quantity</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.total_quantity} 
                  onChange={e => setFormData({...formData, total_quantity: parseInt(e.target.value)})} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Material Type</label>
                <select 
                  className="input-field" 
                  value={formData.material_type} 
                  onChange={e => setFormData({...formData, material_type: e.target.value})}
                >
                  <option value="Consumable">Consumable</option>
                  <option value="Reusable">Reusable</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-8)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingItem ? 'Save Changes' : 'Add to Inventory'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorInventory;
