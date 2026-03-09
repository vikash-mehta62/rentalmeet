'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, X, Save, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const { token } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    password: ''
  });

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingEmployee
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/employees/${editingEmployee._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/employees`;

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        resetForm();
        fetchEmployees();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      alternatePhone: employee.alternatePhone || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      pincode: employee.pincode || '',
      password: '' // Don't populate password
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchEmployees();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/employees/${id}/status`, {
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
        fetchEmployees();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      password: ''
    });
    setEditingEmployee(null);
  };

  const viewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage your employees and their access</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
              <Users className="w-12 h-12 text-primary-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter(e => e.isActive !== false).length}
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
                  {employees.filter(e => e.isActive === false).length}
                </p>
              </div>
              <EyeOff className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Code
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
                {employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.userId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-mono text-xs">
                        {employee.referralCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        employee.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(employee)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(employee._id, employee.isActive)}
                          className={`${
                            employee.isActive !== false
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={employee.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {employee.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees yet</h3>
              <p className="text-gray-600 mb-4">Add your first employee to get started</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Employee
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password {!editingEmployee && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={!editingEmployee}
                      placeholder={editingEmployee ? 'Leave blank to keep current password' : ''}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingEmployee ? 'Update Employee' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-semibold">{selectedEmployee.userId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedEmployee.phone}</p>
                  </div>
                  {selectedEmployee.alternatePhone && (
                    <div>
                      <p className="text-sm text-gray-600">Alternate Phone</p>
                      <p className="font-semibold">{selectedEmployee.alternatePhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      selectedEmployee.isActive !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEmployee.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Referral Information */}
                <div className="pt-4 border-t bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-semibold mb-3 text-orange-900">Referral Information</h3>
                  <div className="space-y-3">
                    {/* Employee's Referral Code */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Employee's Referral Code</p>
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-white rounded-lg font-mono font-bold text-orange-600 border border-orange-300">
                          {selectedEmployee.referralCode || 'Not Generated'}
                        </code>
                        {selectedEmployee.referralCount > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {selectedEmployee.referralCount} referral{selectedEmployee.referralCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Referred By */}
                    {selectedEmployee.referredBy && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Referred By</p>
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <p className="font-semibold text-gray-900">{selectedEmployee.referredBy.name}</p>
                          <p className="text-sm text-gray-600">{selectedEmployee.referredBy.email}</p>
                          {selectedEmployee.referredBy.userId && (
                            <p className="text-xs text-gray-500 mt-1">ID: {selectedEmployee.referredBy.userId}</p>
                          )}
                          {selectedEmployee.referredByCode && (
                            <p className="text-xs text-orange-600 mt-1">
                              Code used: <code className="font-mono font-bold">{selectedEmployee.referredByCode}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Users Referred by This Employee */}
                    {selectedEmployee.referrals && selectedEmployee.referrals.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Users Referred ({selectedEmployee.referrals.length})</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedEmployee.referrals.map((referral, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-2 border border-orange-200 text-sm">
                              <p className="font-semibold text-gray-900">{referral.user?.name || 'User'}</p>
                              <p className="text-xs text-gray-600">{referral.user?.email || 'N/A'}</p>
                              {referral.user?.userId && (
                                <p className="text-xs text-gray-500">ID: {referral.user.userId}</p>
                              )}
                              {referral.user?.role && (
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mt-1">
                                  {referral.user.role}
                                </span>
                              )}
                              <p className="text-xs text-orange-600 mt-1">
                                Joined: {new Date(referral.joinedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Referral Activity */}
                    {!selectedEmployee.referredBy && (!selectedEmployee.referrals || selectedEmployee.referrals.length === 0) && (
                      <div className="text-center py-3">
                        <p className="text-sm text-gray-500">No referral activity</p>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedEmployee.address || selectedEmployee.city || selectedEmployee.state) && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Address</p>
                    <p className="font-semibold">
                      {[selectedEmployee.address, selectedEmployee.city, selectedEmployee.state, selectedEmployee.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Joined</p>
                  <p className="font-semibold">
                    {new Date(selectedEmployee.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
