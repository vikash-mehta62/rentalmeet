'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import { Shield, Plus, Edit2, Trash2, Eye, EyeOff, X, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubAdminsPage() {
  const { token, user } = useAuthStore();
  const [subadmins, setSubadmins] = useState([]);
  const [filteredSubAdmins, setFilteredSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    permissions: {
      dashboard: false,
      venues: false, venueTypes: false, bookings: false, payments: false, coupons: false, quotations: false,
      vendorServices: false, vendorPayments: false, vendorCoupons: false, serviceBookings: false, serviceQuotations: false,
      heroSlides: false, users: false, employees: false, subadmins: false,
      expenses: false, revenue: false, reports: false, reviews: false,
      platformSettings: false, faqs: false, chatbot: false, settings: false
    }
  });

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchSubAdmins();
    }
  }, [token, user]);

  useEffect(() => {
    filterSubAdmins();
  }, [subadmins, searchQuery]);

  const fetchSubAdmins = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subadmins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubadmins(data.data);
      }
    } catch (error) {
      console.error('Error fetching subadmins:', error);
      toast.error('Failed to fetch subadmins');
    } finally {
      setLoading(false);
    }
  };

  const filterSubAdmins = () => {
    let filtered = [...subadmins];

    if (searchQuery) {
      filtered = filtered.filter(sa =>
        sa.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sa.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sa.phone?.includes(searchQuery) ||
        sa.userId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSubAdmins(filtered);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingSubAdmin
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/subadmins/${editingSubAdmin._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/subadmins`;

      const response = await fetch(url, {
        method: editingSubAdmin ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingSubAdmin ? 'SubAdmin updated successfully!' : 'SubAdmin created successfully!');
        fetchSubAdmins();
        handleCloseModal();
      } else {
        toast.error(data.message || 'Failed to save subadmin');
      }
    } catch (error) {
      console.error('Error saving subadmin:', error);
      toast.error('Failed to save subadmin');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subadmin) => {
    setEditingSubAdmin(subadmin);
    setFormData({
      name: subadmin.name || '',
      email: subadmin.email || '',
      phone: subadmin.phone || '',
      alternatePhone: subadmin.alternatePhone || '',
      address: subadmin.address || '',
      city: subadmin.city || '',
      state: subadmin.state || '',
      pincode: subadmin.pincode || '',
      password: '',
      permissions: subadmin.permissions || {
        dashboard: false,
        venues: false, venueTypes: false, bookings: false, payments: false, coupons: false, quotations: false,
        vendorServices: false, vendorPayments: false, vendorCoupons: false, serviceBookings: false, serviceQuotations: false,
        heroSlides: false, users: false, employees: false, subadmins: false,
        expenses: false, revenue: false, reports: false, reviews: false,
        platformSettings: false, faqs: false, chatbot: false, settings: false
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this SubAdmin?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subadmins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchSubAdmins();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting subadmin:', error);
      toast.error('Failed to delete subadmin');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subadmins/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchSubAdmins();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      password: '',
      permissions: {
        dashboard: false,
        venues: false, venueTypes: false, bookings: false, payments: false, coupons: false, quotations: false,
        vendorServices: false, vendorPayments: false, vendorCoupons: false, serviceBookings: false, serviceQuotations: false,
        heroSlides: false, users: false, employees: false, subadmins: false,
        expenses: false, revenue: false, reports: false, reviews: false,
        platformSettings: false, faqs: false, chatbot: false, settings: false
      }
    });
  };

  const exportToCSV = () => {
    const headers = ['S.No', 'SubAdmin ID', 'Name', 'Email', 'Phone', 'City', 'Status', 'Created Date'];
    
    const rows = filteredSubAdmins.map((sa, index) => [
      index + 1,
      sa.userId || `RM-${sa._id.slice(-8).toUpperCase()}`,
      sa.name,
      sa.email,
      sa.phone,
      sa.city || 'N/A',
      sa.isActive ? 'Active' : 'Inactive',
      new Date(sa.createdAt).toLocaleDateString('en-IN')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `subadmins_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully!');
  };

  // Only main admin can access this page
  if (user?.role !== 'admin') {
    return (
      <AdminLayout title="Access Denied">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only main administrators can manage SubAdmins.</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading && subadmins.length === 0) {
    return (
      <AdminLayout title="SubAdmin Management" subtitle="Loading...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="SubAdmin Management" subtitle={`Manage all ${subadmins.length} SubAdmins`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 mt-1">Manage SubAdmins with custom access permissions</p>
          </div>
          <button
            onClick={() => {
              setEditingSubAdmin(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                alternatePhone: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                password: '',
                permissions: {
                  dashboard: false,
                  venues: false, venueTypes: false, bookings: false, payments: false, coupons: false, quotations: false,
                  vendorServices: false, vendorPayments: false, vendorCoupons: false, serviceBookings: false, serviceQuotations: false,
                  heroSlides: false, users: false, employees: false, subadmins: false,
                  expenses: false, revenue: false, reports: false, reviews: false,
                  platformSettings: false, faqs: false, chatbot: false, settings: false
                }
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add SubAdmin
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total SubAdmins</p>
                <p className="text-2xl font-bold text-gray-900">{subadmins.length}</p>
              </div>
              <Shield className="w-12 h-12 text-primary-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {subadmins.filter(sa => sa.isActive !== false).length}
                </p>
              </div>
              <Eye className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {subadmins.filter(sa => sa.isActive === false).length}
                </p>
              </div>
              <EyeOff className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Search & Export */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              onClick={exportToCSV}
              disabled={filteredSubAdmins.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* SubAdmins Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SubAdmin ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No SubAdmins found
                    </td>
                  </tr>
                ) : (
                  filteredSubAdmins.map((subadmin, index) => (
                    <tr key={subadmin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subadmin.userId || `RM-${subadmin._id.slice(-8).toUpperCase()}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                            {subadmin.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{subadmin.name}</p>
                            <p className="text-xs text-purple-600 font-medium">SubAdmin</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <p>{subadmin.email}</p>
                        <p className="text-xs">{subadmin.phone}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subadmin.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          subadmin.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subadmin.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(subadmin)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(subadmin._id, subadmin.isActive)}
                            className={`${
                              subadmin.isActive !== false
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={subadmin.isActive !== false ? 'Deactivate' : 'Activate'}
                          >
                            {subadmin.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(subadmin._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSubAdmin ? 'Edit SubAdmin' : 'Add New SubAdmin'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {!editingSubAdmin && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required={!editingSubAdmin}
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingSubAdmin ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                </p>
              </div>

              {/* Permissions Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Access Permissions <span className="text-red-500">*</span>
                  </label>
                  <button type="button"
                    onClick={() => {
                      const allSelected = Object.values(formData.permissions).every(v => v);
                      const newPerms = {};
                      Object.keys(formData.permissions).forEach(k => { newPerms[k] = !allSelected; });
                      setFormData({ ...formData, permissions: newPerms });
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    {Object.values(formData.permissions).every(v => v) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-5">
                  {[
                    {
                      section: 'Overview',
                      items: [
                        { key: 'dashboard', label: 'Dashboard' },
                      ]
                    },
                    {
                      section: 'Venues',
                      items: [
                        { key: 'venues', label: 'Venues' },
                        { key: 'venueTypes', label: 'Venue Types' },
                        { key: 'bookings', label: 'Bookings' },
                        { key: 'payments', label: 'Payments' },
                        { key: 'coupons', label: 'Coupons' },
                        { key: 'quotations', label: 'Quotations' },
                      ]
                    },
                    {
                      section: 'Vendors',
                      items: [
                        { key: 'vendorServices', label: 'Vendor Services' },
                        { key: 'vendorPayments', label: 'Vendor Payments' },
                        { key: 'vendorCoupons', label: 'Vendor Coupons' },
                        { key: 'serviceBookings', label: 'Service Bookings' },
                        { key: 'serviceQuotations', label: 'Service Quotations' },
                      ]
                    },
                    {
                      section: 'System',
                      items: [
                        { key: 'heroSlides', label: 'Hero Slides' },
                        { key: 'users', label: 'Users' },
                        { key: 'employees', label: 'Employees' },
                        { key: 'subadmins', label: 'SubAdmins' },
                        { key: 'expenses', label: 'Expenses' },
                        { key: 'revenue', label: 'Revenue' },
                        { key: 'reports', label: 'Reports' },
                        { key: 'reviews', label: 'Reviews' },
                        { key: 'platformSettings', label: 'Platform Settings' },
                        { key: 'faqs', label: 'FAQ Management' },
                        { key: 'chatbot', label: 'Chatbot Settings' },
                        { key: 'settings', label: 'Settings' },
                      ]
                    }
                  ].map(group => (
                    <div key={group.section}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-200">{group.section}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {group.items.map(perm => (
                          <label key={perm.key}
                            className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 transition-colors ${formData.permissions[perm.key] ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <input type="checkbox"
                              checked={!!formData.permissions[perm.key]}
                              onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, [perm.key]: e.target.checked } })}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingSubAdmin ? 'Update SubAdmin' : 'Create SubAdmin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
