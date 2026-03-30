'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeForm from '@/components/admin/EmployeeForm';
import EmployeeDetailsModal from '@/components/admin/EmployeeDetailsModal';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, X, Download, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const { token } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, statusFilter]);

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

  const filterEmployees = () => {
    let filtered = [...employees];

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(e => e.isActive === isActive);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.phone?.includes(searchQuery) ||
        e.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.employeeDetails?.position?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
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

  const viewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const exportToCSV = () => {
    const headers = [
      'S.No', 'Employee ID', 'Name', 'Email', 'Phone', 'Position',
      'Department', 'Employment Type', 'City', 'State', 'Status',
      'Joining Date', 'Referral Code', 'No. of Referrals', 'Earning'
    ];
    
    const rows = filteredEmployees.map((emp, index) => [
      index + 1,
      emp.userId || `RM-${emp._id.slice(-8).toUpperCase()}`,
      emp.name,
      emp.email,
      emp.phone,
      emp.employeeDetails?.position || 'N/A',
      emp.employeeDetails?.department || 'N/A',
      emp.employeeDetails?.employmentType || 'N/A',
      emp.city || 'N/A',
      emp.state || 'N/A',
      emp.isActive !== false ? 'Active' : 'Inactive',
      emp.employeeDetails?.joiningDate ? new Date(emp.employeeDetails.joiningDate).toLocaleDateString('en-IN') : 'N/A',
      emp.referralCode || 'N/A',
      emp.referralCount || 0,
      emp.earning || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully!');
  };

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <AdminLayout title="Employee Management" subtitle="Loading employees...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Employee Management" subtitle={`Manage all ${employees.length} employees`}>
      <PermissionGuard permission="employees">
        <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 mt-1">Manage your employees and their details</p>
          </div>
          <button
            onClick={() => {
              setEditingEmployee(null);
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={filteredEmployees.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-yellow-50">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-yellow-50">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-yellow-50">Referral Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-yellow-50">Referrals</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-yellow-50">Earning</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((employee, index) => (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-gray-700">{startIndex + index + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {employee.employeeDetails?.photo ? (
                            <img src={employee.employeeDetails.photo} alt={employee.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 text-xs flex-shrink-0">
                              {employee.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.userId || `RM-${employee._id.slice(-8).toUpperCase()}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">{employee.email}</p>
                        <p className="text-xs text-gray-500">{employee.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-900">{employee.employeeDetails?.position || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{employee.employeeDetails?.department || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          employee.employeeDetails?.employmentType === 'Permanent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {employee.employeeDetails?.employmentType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 bg-yellow-50">
                        <span className="text-xs text-gray-700">{employee.city || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 bg-yellow-50">
                        <span className="text-xs text-gray-700">{employee.state || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          employee.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 bg-yellow-50">
                        <code className="text-xs font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          {employee.referralCode || 'N/A'}
                        </code>
                      </td>
                      <td className="px-4 py-3 bg-yellow-50">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                          {employee.referralCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 bg-yellow-50">
                        <span className="text-xs font-semibold text-green-700">
                          ₹{(employee.earning || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => viewDetails(employee)} className="text-blue-600 hover:text-blue-900" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(employee)} className="text-yellow-600 hover:text-yellow-900" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(employee._id, employee.isActive)}
                            className={employee.isActive !== false ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            title={employee.isActive !== false ? 'Deactivate' : 'Activate'}
                          >
                            {employee.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(employee._id)} className="text-red-600 hover:text-red-900" title="Delete">
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

          {/* Pagination */}
          {filteredEmployees.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-600">
                  entries (Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length})
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                              currentPage === page
                                ? 'bg-primary-500 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={fetchEmployees}
          token={token}
        />
      )}

      {/* Details Modal - Enhanced version with tabs */}
      {showDetailsModal && selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
