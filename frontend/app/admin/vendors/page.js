'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import toast from 'react-hot-toast';
import {
  Search, User, Building2, CheckCircle, XCircle, Clock,
  Package, Eye, X, ChevronDown, AlertCircle
} from 'lucide-react';

const PROFILE_STATUS = {
  incomplete: { cls: 'bg-gray-100 text-gray-600',    label: 'Incomplete' },
  pending:    { cls: 'bg-yellow-100 text-yellow-700', label: 'Pending Review' },
  approved:   { cls: 'bg-green-100 text-green-700',   label: 'Approved' },
  rejected:   { cls: 'bg-red-100 text-red-700',       label: 'Rejected' },
};

const SVC_STATUS = {
  draft:    { cls: 'bg-gray-100 text-gray-500',     label: 'Draft' },
  pending:  { cls: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  approved: { cls: 'bg-green-100 text-green-700',   label: 'Approved' },
  rejected: { cls: 'bg-red-100 text-red-700',       label: 'Rejected' },
};

export default function AdminVendors() {
  const { token } = useAuthStore();
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null); // vendor detail modal
  const [services, setServices] = useState([]);
  const [rejectModal, setRejectModal] = useState({ open: false, type: '', id: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 12;

  const fetchVendors = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors);
        setFiltered(data.vendors);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || data.vendors.length);
      }
    } catch (e) { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) { setCurrentPage(1); fetchVendors(1); } }, [token, statusFilter, search]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchVendors(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openVendor = async (vendor) => {
    setSelected(vendor);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${vendor._id}/services`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setServices(data.services);
  };

  const handleProfileAction = async (vendorId, action, reason = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${vendorId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchVendors(currentPage);
        setSelected(prev => prev ? { ...prev, profile: data.profile } : null);
        setRejectModal({ open: false, type: '', id: '', reason: '' });
      } else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setActionLoading(false); }
  };

  const handleServiceAction = async (svcId, action, reason = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services/${svcId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setServices(prev => prev.map(s => s._id === svcId ? data.service : s));
        setRejectModal({ open: false, type: '', id: '', reason: '' });
      } else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setActionLoading(false); }
  };

  const stats = {
    total:    totalCount,
    pending:  vendors.filter(v => v.profile?.status === 'pending').length,
    approved: vendors.filter(v => v.profile?.status === 'approved').length,
    rejected: vendors.filter(v => v.profile?.status === 'rejected').length,
  };

  return (
    <AdminLayout title="Vendors" subtitle="Manage service vendors">
      <PermissionGuard permission="users">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-white border-gray-100' },
            { label: 'Pending Review', value: stats.pending, cls: 'bg-yellow-50 border-yellow-200' },
            { label: 'Approved', value: stats.approved, cls: 'bg-green-50 border-green-200' },
            { label: 'Rejected', value: stats.rejected, cls: 'bg-red-50 border-red-200' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`rounded-xl border shadow-sm p-4 ${cls}`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, company..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="all">All Status</option>
            <option value="incomplete">Incomplete</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Services</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Profile Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No vendors found</td></tr>
              ) : filtered.map((v, i) => {
                const ps = PROFILE_STATUS[v.profile?.status || 'incomplete'];
                return (
                  <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                          {v.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{v.name}</p>
                          <p className="text-xs text-gray-400">{v.email}</p>
                          {v.companyName && <p className="text-xs text-gray-500">{v.companyName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{v.vendorCategory || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-700">{v.serviceCount || 0}</span>
                      {v.pendingCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold">{v.pendingCount} pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ps.cls}`}>{ps.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openVendor(v)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {v.profile?.status === 'pending' && (
                          <>
                            <button onClick={() => handleProfileAction(v._id, 'approve')} disabled={actionLoading}
                              className="px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors">
                              ✓
                            </button>
                            <button onClick={() => setRejectModal({ open: true, type: 'vendor', id: v._id, reason: '' })}
                              className="px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors">
                              ✗
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, totalCount)} of {totalCount} vendors
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">Previous</button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">Next</button>
            </div>
          </div>
        )}

        {/* Vendor Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-xs text-gray-400">{selected.email} · {selected.userId}</p>
                </div>
                <button onClick={() => { setSelected(null); setServices([]); }} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {/* Vendor Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    ['Company', selected.companyName],
                    ['Category', selected.vendorCategory],
                    ['Phone', selected.phone],
                    ['City', selected.city],
                    ['State', selected.state],
                    ['Profile Status', selected.profile?.status || 'incomplete'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="font-semibold text-gray-800">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                {/* Profile Actions */}
                {selected.profile?.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleProfileAction(selected._id, 'approve')} disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Approve Vendor
                    </button>
                    <button onClick={() => setRejectModal({ open: true, type: 'vendor', id: selected._id, reason: '' })}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold">
                      <XCircle className="w-4 h-4" /> Reject Vendor
                    </button>
                  </div>
                )}

                {/* Services */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Services ({services.length})</p>
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No services listed yet</p>
                  ) : (
                    <div className="space-y-2">
                      {services.map(svc => {
                        const ss = SVC_STATUS[svc.status] || SVC_STATUS.draft;
                        return (
                          <div key={svc._id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            {svc.featuredImage
                              ? <img src={svc.featuredImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                              : <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-gray-400" /></div>}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{svc.title}</p>
                              <p className="text-xs text-gray-400">{svc.category} · {svc.city || '—'}</p>
                              {svc.startingPrice && <p className="text-xs text-primary-600 font-semibold">₹{svc.startingPrice.toLocaleString()}+</p>}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${ss.cls}`}>{ss.label}</span>
                            {svc.status === 'pending' && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button onClick={() => handleServiceAction(svc._id, 'approve')} disabled={actionLoading}
                                  className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold">✓</button>
                                <button onClick={() => setRejectModal({ open: true, type: 'service', id: svc._id, reason: '' })}
                                  className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold">✗</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Reject {rejectModal.type === 'vendor' ? 'Vendor Profile' : 'Service'}
              </h3>
              <textarea
                value={rejectModal.reason}
                onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))}
                placeholder="Rejection reason (required)..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 mb-4"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!rejectModal.reason.trim()) { toast.error('Reason required'); return; }
                    if (rejectModal.type === 'vendor') handleProfileAction(rejectModal.id, 'reject', rejectModal.reason);
                    else handleServiceAction(rejectModal.id, 'reject', rejectModal.reason);
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
                <button onClick={() => setRejectModal({ open: false, type: '', id: '', reason: '' })}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </PermissionGuard>
    </AdminLayout>
  );
}
