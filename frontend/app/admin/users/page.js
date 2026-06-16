'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Users, Search, Filter, Eye, X, Mail, Phone, Calendar,
  CheckCircle, XCircle, Shield, User, Building2, Download, Lock, Eye as EyeIcon, EyeOff,
  Briefcase, MapPin, CreditCard, Clock, Star, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [activeTab, setActiveTab] = useState('customers'); // customers, owners, vendors
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState({ totalCustomers: 0, activeCustomers: 0, totalOwners: 0, activeOwners: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 12;

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || v.name?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q) || v.phone?.includes(q);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? v.isActive : !v.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchQuery, statusFilter]);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  // Vendor detail state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorServices, setVendorServices] = useState([]);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [expandedService, setExpandedService] = useState(null);
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchVendors();
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, activeTab, statusFilter, searchQuery, currentPage]);

  const fetchUsers = async () => {
    if (activeTab === 'vendors') return;
    try {
      const params = new URLSearchParams({ page: currentPage, limit: ITEMS_PER_PAGE });
      if (activeTab !== 'vendors') params.set('role', activeTab === 'customers' ? 'customer' : 'owner');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.users);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.globalStats) {
          setGlobalStats(data.globalStats);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors?limit=10000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVendors(data.vendors);
    } catch (e) { console.error('Error fetching vendors:', e); }
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when tab/filter changes
  useEffect(() => { setCurrentPage(1); }, [activeTab, statusFilter]);

  const openVendorModal = async (vendor) => {
    setSelectedVendor(vendor);
    setVendorModalOpen(true);
    setVendorLoading(true);
    setVendorServices([]);
    setExpandedService(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${vendor._id}/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVendorServices(data.services);
    } catch (e) { toast.error('Failed to load vendor services'); }
    finally { setVendorLoading(false); }
  };

  const handleServiceAction = async (serviceId, action, reason = '') => {
    setServiceActionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services/${serviceId}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Service ${action}d successfully`);
        setVendorServices(prev => prev.map(s => s._id === serviceId ? { ...s, status: action === 'approve' ? 'approved' : 'rejected', rejectionReason: reason } : s));
        fetchVendors();
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Something went wrong'); }
    finally { setServiceActionLoading(false); }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchUsers();
        setModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    setExporting(true);
    try {
      let headers, rows;
      if (activeTab === 'vendors') {
        headers = ['S.No', 'Vendor ID', 'Name', 'Email', 'Phone', 'Category', 'Services', 'Pending Services', 'Status', 'Joined Date'];
        rows = filteredVendors.map((vendor, i) => [
          i + 1,
          vendor.userId || `RM-${vendor._id.slice(-8).toUpperCase()}`,
          vendor.name,
          vendor.email,
          vendor.phone,
          vendor.vendorCategory || 'N/A',
          vendor.serviceCount || 0,
          vendor.pendingCount || 0,
          vendor.isActive ? 'Active' : 'Inactive',
          new Date(vendor.createdAt).toLocaleDateString('en-IN')
        ]);
      } else {
        // Fetch ALL records for export (no pagination limit)
        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (activeTab !== 'vendors') params.set('role', activeTab === 'customers' ? 'customer' : 'owner');
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (searchQuery) params.set('search', searchQuery);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) { toast.error('Export failed'); return; }
        const exportUsers = data.users;

        if (activeTab === 'customers') {
          headers = ['S.No','User ID','Name','Email','Phone','City','State','Status','Referral Code','Joined Date','No. of Bookings','No. of Referrals'];
          rows = exportUsers.map((user, i) => [
            i+1, user.userId || `RM-${user._id.slice(-8).toUpperCase()}`,
            user.name, user.email, user.phone,
            user.city||'N/A', user.state||'N/A',
            user.isActive ? 'Active' : 'Inactive',
            user.referralCode||'N/A',
            new Date(user.createdAt).toLocaleDateString('en-IN'),
            user.bookingCount||0, user.referralCount||0
          ]);
        } else {
          headers = ['S.No','User ID','Name','Email','Phone','City','State','No. of Venues','Status','Referral Code','No. of Referrals','Joined Date'];
          rows = exportUsers.map((user, i) => [
            i+1, user.userId || `RM-${user._id.slice(-8).toUpperCase()}`,
            user.name, user.email, user.phone,
            user.city||'N/A', user.state||'N/A',
            user.venueCount||0,
            user.isActive ? 'Active' : 'Inactive',
            user.referralCode||'N/A',
            user.referralCount||0,
            new Date(user.createdAt).toLocaleDateString('en-IN')
          ]);
        }
      }

      const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
      link.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${rows.length} ${activeTab}!`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const openModal = async (user) => {
    setSelectedUser(user); // Show basic info immediately
    setModalOpen(true);
    
    // Fetch full user details including KYC
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedUser(data.user); // Update with full details including KYC
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalOpen(false);
    setNewPassword('');
    setShowNewPassword(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Min 6 characters required');
    setPwdLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser._id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) { toast.success('Password updated!'); setNewPassword(''); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Something went wrong'); }
    finally { setPwdLoading(false); }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
      owner: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Building2 },
      customer: { bg: 'bg-green-100', text: 'text-green-700', icon: User },
      employee: { bg: 'bg-orange-100', text: 'text-orange-700', icon: User }
    };
    const badge = badges[role] || badges.customer;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {role}
      </span>
    );
  };

  const stats = {
    customers: {
      total: globalStats.totalCustomers,
      active: globalStats.activeCustomers,
    },
    owners: {
      total: globalStats.totalOwners,
      active: globalStats.activeOwners,
    },
    vendors: {
      total: vendors.length,
      active: vendors.filter(v => v.isActive).length,
    }
  };

  // Pagination — server-side, allUsers is already the current page
  const paginatedUsers = allUsers;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    // fixed at ITEMS_PER_PAGE for server-side pagination
  };

  if (loading) {
    return (
      <AdminLayout title="Users Management" subtitle="Loading users...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Users Management" subtitle="Manage all users and owners">
      <PermissionGuard permission="users">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'customers'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-5 h-5" />
              <span>Customers ({stats.customers.total})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'owners'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5" />
              <span>Owners ({stats.owners.total})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'vendors'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5" />
              <span>Vendors ({stats.vendors.total})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-dark-800">{activeTab === 'vendors' ? stats.vendors.total : stats[activeTab]?.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-soft border border-green-200 p-4">
          <p className="text-xs text-green-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-700">{activeTab === 'vendors' ? stats.vendors.active : stats[activeTab]?.active}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-soft border border-red-200 p-4">
          <p className="text-xs text-red-600 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-700">{activeTab === 'vendors' ? stats.vendors.total - stats.vendors.active : (stats[activeTab]?.total - stats[activeTab]?.active)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or user ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            disabled={exporting || (activeTab === 'vendors' ? filteredVendors.length === 0 : allUsers.length === 0)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : `Export CSV (${activeTab === 'vendors' ? filteredVendors.length : totalCount})`}
          </button>
        </div>
      </div>

      {/* Users Table — customers & owners */}
      {activeTab !== 'vendors' && (
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">State</th>
                {activeTab === 'owners' && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Venues</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Referral Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                {activeTab === 'customers' && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Bookings</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Referrals</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'customers' ? 12 : 12} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-700">{startIndex + index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 text-xs flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-dark-800">{user.name}</p>
                          <p className="text-xs text-gray-500">
                            {user.userId || `RM-${user._id.slice(-8).toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {user.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="text-xs text-gray-700">{user.city || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="text-xs text-gray-700">{user.state || 'N/A'}</span>
                    </td>
                    {activeTab === 'owners' && (
                      <td className="px-4 py-3 bg-yellow-50">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                          {user.venueCount || 0}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <code className="text-xs font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {user.referralCode || 'N/A'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    {activeTab === 'customers' && (
                      <td className="px-4 py-3 bg-yellow-50">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                          {user.bookingCount || 0}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                        {user.referralCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal(user)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {allUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalCount)} of {totalCount} {activeTab}
              </span>
            </div>

            {/* Page numbers */}
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
      )} {/* end activeTab !== vendors */}

      {/* Vendors Table */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Services</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pending</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">No vendors found</td></tr>
                ) : filteredVendors.map((vendor, index) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 text-xs flex-shrink-0">
                          {vendor.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-dark-800">{vendor.name}</p>
                          <p className="text-xs text-gray-500">{vendor.userId || `RM-${vendor._id.slice(-8).toUpperCase()}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" />{vendor.email}</p>
                      <p className="text-xs text-gray-700 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-gray-400" />{vendor.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700">{vendor.vendorCategory || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">{vendor.serviceCount || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {vendor.pendingCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">{vendor.pendingCount}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openVendorModal(vendor)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-800">{selectedUser.name}</h2>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUser.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-900">{selectedUser.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold text-gray-900">{selectedUser.phone}</span>
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Account Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">User ID</p>
                    <p className="font-semibold text-gray-900 font-mono">
                      {selectedUser.userId || `RM-${selectedUser._id.slice(-8).toUpperCase()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Joined Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Referral Information */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                <h3 className="text-lg font-semibold mb-3 text-orange-900">Referral Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Referral Code</p>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 bg-white rounded-lg font-mono font-bold text-orange-600 border border-orange-300">
                        {selectedUser.referralCode || 'Not Generated'}
                      </code>
                      {selectedUser.referralCount > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {selectedUser.referralCount} referral{selectedUser.referralCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedUser.referredBy && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Referred By</p>
                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <p className="font-semibold text-gray-900">{selectedUser.referredBy.name}</p>
                        <p className="text-sm text-gray-600">{selectedUser.referredBy.email}</p>
                        {selectedUser.referredByCode && (
                          <p className="text-xs text-orange-600 mt-1">
                            Code used: <code className="font-mono font-bold">{selectedUser.referredByCode}</code>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedUser.referrals && selectedUser.referrals.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Users Referred ({selectedUser.referrals.length})</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedUser.referrals.map((referral, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2 border border-orange-200 text-sm">
                            <p className="font-semibold text-gray-900">{referral.user?.name || 'User'}</p>
                            <p className="text-xs text-gray-600">{referral.user?.email || 'N/A'}</p>
                            <p className="text-xs text-orange-600 mt-1">
                              Joined: {new Date(referral.joinedAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedUser.referredBy && (!selectedUser.referrals || selectedUser.referrals.length === 0) && (
                    <div className="text-center py-3">
                      <p className="text-sm text-gray-500">No referral activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* KYC Documents — Customers */}
              {selectedUser.role === 'customer' && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    KYC Documents
                    {selectedUser.kyc?.idProof && selectedUser.kyc?.selfie && selectedUser.kyc?.addressProof ? (
                      <span className="ml-auto px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="ml-auto px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                        Incomplete
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* ID Proof Front */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        {selectedUser.kyc?.idProofType || 'ID Proof'} — Front
                      </p>
                      {selectedUser.kyc?.idProof ? (
                        <div>
                          <img src={selectedUser.kyc.idProof} alt="ID Proof Front"
                            className="w-full h-36 object-contain bg-white rounded-lg border border-gray-300 p-2" />
                          <a href={selectedUser.kyc.idProof} target="_blank" rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium">
                            <Eye className="w-3 h-3" /> View / Download
                          </a>
                        </div>
                      ) : (
                        <div className="h-36 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <p className="text-xs text-gray-400">Not uploaded</p>
                        </div>
                      )}
                    </div>
                    {/* ID Proof Back — shown if uploaded */}
                    {(selectedUser.kyc?.idProofBack || ['Aadhaar','Voter ID'].includes(selectedUser.kyc?.idProofType)) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          {selectedUser.kyc?.idProofType || 'ID Proof'} — Back
                        </p>
                        {selectedUser.kyc?.idProofBack ? (
                          <div>
                            <img src={selectedUser.kyc.idProofBack} alt="ID Proof Back"
                              className="w-full h-36 object-contain bg-white rounded-lg border border-gray-300 p-2" />
                            <a href={selectedUser.kyc.idProofBack} target="_blank" rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium">
                              <Eye className="w-3 h-3" /> View / Download
                            </a>
                          </div>
                        ) : (
                          <div className="h-36 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                            <p className="text-xs text-gray-400">Not uploaded</p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Address Proof */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Address Proof</p>
                      {selectedUser.kyc?.addressProof ? (
                        <div>
                          <img src={selectedUser.kyc.addressProof} alt="Address Proof"
                            className="w-full h-36 object-contain bg-white rounded-lg border border-gray-300 p-2" />
                          <a href={selectedUser.kyc.addressProof} target="_blank" rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium">
                            <Eye className="w-3 h-3" /> View / Download
                          </a>
                        </div>
                      ) : (
                        <div className="h-36 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <p className="text-xs text-gray-400">Not uploaded</p>
                        </div>
                      )}
                    </div>
                    {/* Selfie */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Real-time Selfie</p>
                      {selectedUser.kyc?.selfie ? (
                        <div>
                          <img src={selectedUser.kyc.selfie} alt="Selfie"
                            className="w-full h-36 object-cover rounded-lg border border-gray-300" />
                          <a href={selectedUser.kyc.selfie} target="_blank" rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium">
                            <Eye className="w-3 h-3" /> View / Download
                          </a>
                        </div>
                      ) : (
                        <div className="h-36 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <p className="text-xs text-gray-400">Not uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Documents */}
              {selectedUser.role === 'owner' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-lg font-semibold mb-3 text-green-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Owner Documents
                  </h3>
                  {selectedUser.documents ? (
                    <div className="space-y-4">
                      {/* Aadhaar */}
                      {selectedUser.documents.aadhaarNumber && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Aadhaar Number</p>
                          <p className="text-sm font-mono bg-white px-2.5 py-1.5 rounded border border-green-300 inline-block">
                            {selectedUser.documents.aadhaarNumber}
                          </p>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {selectedUser.documents.aadhaarFront && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Front</p>
                                <img src={selectedUser.documents.aadhaarFront} alt="Aadhaar Front"
                                  className="w-full h-28 object-contain bg-white rounded border border-gray-300 p-1" />
                                <a href={selectedUser.documents.aadhaarFront} target="_blank" rel="noopener noreferrer"
                                  className="text-primary-600 text-xs mt-1 inline-flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> View
                                </a>
                              </div>
                            )}
                            {selectedUser.documents.aadhaarBack && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Back</p>
                                <img src={selectedUser.documents.aadhaarBack} alt="Aadhaar Back"
                                  className="w-full h-28 object-contain bg-white rounded border border-gray-300 p-1" />
                                <a href={selectedUser.documents.aadhaarBack} target="_blank" rel="noopener noreferrer"
                                  className="text-primary-600 text-xs mt-1 inline-flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> View
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* PAN */}
                      {selectedUser.documents.panNumber && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">PAN Number</p>
                          <p className="text-sm font-mono bg-white px-2.5 py-1.5 rounded border border-green-300 inline-block">
                            {selectedUser.documents.panNumber}
                          </p>
                          {selectedUser.documents.panCard && (
                            <div className="mt-2">
                              <img src={selectedUser.documents.panCard} alt="PAN Card"
                                className="w-full max-w-xs h-28 object-contain bg-white rounded border border-gray-300 p-1" />
                              <a href={selectedUser.documents.panCard} target="_blank" rel="noopener noreferrer"
                                className="text-primary-600 text-xs mt-1 inline-flex items-center gap-1">
                                <Eye className="w-3 h-3" /> View
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {!selectedUser.documents.aadhaarNumber && !selectedUser.documents.panNumber && (
                        <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
                  )}
                </div>
              )}

              {/* Reset Password */}
              {selectedUser.role !== 'admin' && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-600" />
                    Reset Password
                  </h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                      <button type="button" onClick={() => setShowNewPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={handleResetPassword} disabled={pwdLoading || !newPassword}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                      {pwdLoading ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedUser.role !== 'admin' && (
                <div className="flex gap-3 pt-4 border-t">
                  {selectedUser.isActive ? (
                    <button
                      onClick={() => handleStatusToggle(selectedUser._id, selectedUser.isActive)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Deactivate User
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusToggle(selectedUser._id, selectedUser.isActive)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Activate User
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </PermissionGuard>

      {/* Vendor Detail Modal */}
      {vendorModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-dark-800">{selectedVendor.name}</h2>
                <p className="text-sm text-gray-500">{selectedVendor.email} · {selectedVendor.vendorCategory || 'Vendor'}</p>
              </div>
              <button onClick={() => setVendorModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">Phone</p><p className="font-semibold">{selectedVendor.phone || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedVendor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedVendor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div><p className="text-xs text-gray-500">Joined</p><p className="font-semibold">{new Date(selectedVendor.createdAt).toLocaleDateString('en-IN')}</p></div>
                <div><p className="text-xs text-gray-500">Total Services</p><p className="font-bold text-blue-600">{selectedVendor.serviceCount || 0}</p></div>
                <div><p className="text-xs text-gray-500">Pending Review</p><p className="font-bold text-orange-500">{selectedVendor.pendingCount || 0}</p></div>
                <div><p className="text-xs text-gray-500">City / State</p><p className="font-semibold">{selectedVendor.city || '—'} {selectedVendor.state ? `/ ${selectedVendor.state}` : ''}</p></div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-500" /> Services
                </h3>
                {vendorLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : vendorServices.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No services submitted yet</p>
                ) : (
                  <div className="space-y-3">
                    {vendorServices.map(svc => (
                      <div key={svc._id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Service Header */}
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedService(expandedService === svc._id ? null : svc._id)}
                        >
                          <div className="flex items-center gap-3">
                            {svc.featuredImage && (
                              <img src={svc.featuredImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{svc.title}</p>
                              <p className="text-xs text-gray-500">{svc.category} · {svc.city}, {svc.state}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              svc.status === 'approved' ? 'bg-green-100 text-green-700' :
                              svc.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              svc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              svc.status === 'suspended' ? 'bg-gray-100 text-gray-600' :
                              'bg-blue-100 text-blue-700'
                            }`}>{svc.status}</span>
                            {expandedService === svc._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>

                        {/* Service Detail */}
                        {expandedService === svc._id && (
                          <div className="p-4 space-y-4 text-sm">
                            {/* Business Info */}
                            <div className="grid grid-cols-2 gap-3">
                              <div><p className="text-xs text-gray-500">Company</p><p className="font-semibold">{svc.companyName || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Brand</p><p className="font-semibold">{svc.brandName || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Experience</p><p className="font-semibold">{svc.experienceYears ? `${svc.experienceYears} yrs` : '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Starting Price</p><p className="font-semibold text-green-700">₹{svc.startingPrice?.toLocaleString() || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Address</p><p className="font-semibold">{svc.officeAddress || '—'}</p></div>
                              <div><p className="text-xs text-gray-500">Pincode</p><p className="font-semibold">{svc.pincode || '—'}</p></div>
                            </div>

                            {/* Contact */}
                            {svc.contactInfo && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs font-bold text-blue-800 mb-2">Contact Info</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <p><span className="text-gray-500">Name:</span> {svc.contactInfo.fullName}</p>
                                  <p><span className="text-gray-500">Mobile:</span> {svc.contactInfo.primaryMobile}</p>
                                  <p><span className="text-gray-500">Role:</span> {svc.contactInfo.role}</p>
                                  {svc.contactInfo.secondaryMobile && <p><span className="text-gray-500">Alt:</span> {svc.contactInfo.secondaryMobile}</p>}
                                </div>
                              </div>
                            )}

                            {/* Description */}
                            {svc.description && (
                              <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-xs text-gray-700 bg-gray-50 rounded p-2">{svc.description}</p></div>
                            )}

                            {/* Portfolio Images */}
                            {svc.images?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-600 mb-2">Portfolio Photos</p>
                                <div className="flex gap-2 flex-wrap">
                                  {svc.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                      <img src={img} alt="" className="w-20 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Business Documents */}
                            {svc.businessDocs && (
                              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                <p className="text-xs font-bold text-yellow-800 mb-2">Business Documents</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {[
                                    ['registrationCertificate', 'Reg. Certificate'],
                                    ['msme', 'MSME'],
                                    ['gst', 'GST'],
                                    ['pan', 'PAN (Business)'],
                                    ['tradeLicense', 'Trade License'],
                                    ['fssai', 'FSSAI'],
                                  ].map(([key, label]) => svc.businessDocs[key] && (
                                    <div key={key}>
                                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                                      <a href={svc.businessDocs[key]} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium">
                                        <ExternalLink className="w-3 h-3" /> View
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Owner Documents */}
                            {svc.ownerDocs && (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-xs font-bold text-green-800 mb-2">Owner / KYC Documents</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    ['aadhaarFront', 'Aadhaar Front'],
                                    ['aadhaarBack', 'Aadhaar Back'],
                                    ['pan', 'PAN Card'],
                                    ['selfie', 'Selfie'],
                                  ].map(([key, label]) => svc.ownerDocs[key] && (
                                    <div key={key}>
                                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                                      <a href={svc.ownerDocs[key]} target="_blank" rel="noopener noreferrer">
                                        <img src={svc.ownerDocs[key]} alt={label}
                                          className="w-full h-24 object-contain bg-white rounded border border-gray-200 p-1 hover:opacity-80" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bank Details */}
                            {svc.bankDetails?.accountNumber && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Bank Details</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <p><span className="text-gray-500">Name:</span> {svc.bankDetails.accountHolderName}</p>
                                  <p><span className="text-gray-500">Bank:</span> {svc.bankDetails.bankName}</p>
                                  <p><span className="text-gray-500">A/C:</span> {svc.bankDetails.accountNumber}</p>
                                  <p><span className="text-gray-500">IFSC:</span> {svc.bankDetails.ifsc}</p>
                                  <p><span className="text-gray-500">Type:</span> {svc.bankDetails.accountType}</p>
                                  {svc.bankDetails.upiId && <p><span className="text-gray-500">UPI:</span> {svc.bankDetails.upiId}</p>}
                                </div>
                                {svc.bankDetails.proof && (
                                  <a href={svc.bankDetails.proof} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline mt-2 font-medium">
                                    <ExternalLink className="w-3 h-3" /> View Bank Proof
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Packages */}
                            {svc.packages?.filter(p => p.name).length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-600 mb-2">Rate List</p>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50"><tr>
                                      <th className="px-2 py-1.5 text-left text-gray-500">Service</th>
                                      <th className="px-2 py-1.5 text-left text-gray-500">Rate</th>
                                      <th className="px-2 py-1.5 text-left text-gray-500">Unit</th>
                                      <th className="px-2 py-1.5 text-left text-gray-500">Min</th>
                                      <th className="px-2 py-1.5 text-left text-gray-500">Max</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {svc.packages.filter(p => p.name).map((pkg, i) => (
                                        <tr key={i}>
                                          <td className="px-2 py-1.5">{pkg.name}</td>
                                          <td className="px-2 py-1.5 text-green-700 font-semibold">₹{pkg.price?.toLocaleString()}</td>
                                          <td className="px-2 py-1.5">{pkg.unit}</td>
                                          <td className="px-2 py-1.5">{pkg.minQty || '—'}</td>
                                          <td className="px-2 py-1.5">{pkg.maxQty || '—'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Rejection reason */}
                            {svc.rejectionReason && (
                              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                <p className="text-xs font-bold text-red-700 mb-1">Rejection Reason</p>
                                <p className="text-xs text-red-600">{svc.rejectionReason}</p>
                              </div>
                            )}

                            {/* Approve / Reject Actions */}
                            {(svc.status === 'pending' || svc.status === 'rejected') && (
                              <div className="flex gap-2 pt-2 border-t border-gray-100">
                                {svc.status === 'pending' && (
                                  <button
                                    disabled={serviceActionLoading}
                                    onClick={() => handleServiceAction(svc._id, 'approve')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Approve Service
                                  </button>
                                )}
                                {svc.status === 'pending' && (
                                  <button
                                    disabled={serviceActionLoading}
                                    onClick={() => {
                                      const reason = prompt('Rejection reason:');
                                      if (reason) handleServiceAction(svc._id, 'reject', reason);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

