'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Plus, Edit2, Trash2, Save, X, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminVenueTypes() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [venueTypes, setVenueTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: '🏢',
    order: 0
  });

  useEffect(() => {
    if (token) {
      fetchVenueTypes();
    }
  }, [token]);

  const fetchVenueTypes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVenueTypes(data.venueTypes);
      }
    } catch (error) {
      console.error('Error fetching venue types:', error);
      toast.error('Failed to load venue types');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingType
        ? `${process.env.NEXT_PUBLIC_API_URL}/venue-types/admin/${editingType._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/venue-types/admin`;
      
      const response = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchVenueTypes();
        handleCloseModal();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to save venue type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this venue type?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Venue type deleted successfully');
        fetchVenueTypes();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to delete venue type');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code || '',
      description: type.description || '',
      icon: type.icon || '🏢',
      order: type.order || 0
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      icon: '🏢',
      order: 0
    });
  };

  const toggleActive = async (type) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types/admin/${type._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...type,
          isActive: !type.isActive
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Venue type ${type.isActive ? 'deactivated' : 'activated'}`);
        fetchVenueTypes();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <AdminLayout title="Venue Types" subtitle="Manage venue type categories">
      <PermissionGuard permission="venueTypes">
        <div className="w-full">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">Total: {venueTypes.length} types</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Venue Type
            </button>
          </div>
        </div>

        {/* Venue Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venueTypes.map((type) => (
            <div
              key={type._id}
              className={`bg-white rounded-xl shadow-soft border p-6 transition-all ${
                type.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{type.icon}</span>
                  <div>
                    <h3 className="font-bold text-dark-800">{type.name}</h3>
                    <p className="text-xs text-gray-500">Code: {type.code} • Order: {type.order}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {type.description && (
                <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className={`text-xs font-semibold ${type.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {type.isActive ? 'Active' : 'Inactive'}
                </span>
                
                {/* Toggle Switch */}
                <button
                  onClick={() => toggleActive(type)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    type.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={type.isActive}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      type.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {venueTypes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No venue types found</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold"
            >
              Add First Type
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-800">
                {editingType ? 'Edit Venue Type' : 'Add Venue Type'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code (2 letters) *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                  maxLength="2"
                  minLength="2"
                  pattern="[A-Z]{2}"
                  placeholder="MH"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">2-letter code for booking numbers (e.g., MH for Meeting Hall)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-2xl text-center"
                    maxLength="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingType ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
