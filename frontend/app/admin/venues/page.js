'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import VenueDetailsModal from '@/components/venue/VenueDetailsModal';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Building2, Eye, Search, Filter, Download,
  ChevronDown, ChevronLeft, ChevronRight, Award, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeCustomGST, normalizeCustomPlatformFee } from '@/lib/venuePricing';

const LIMIT = 12;
const DEFAULT_CUSTOM_PLATFORM_FEE = { enabled: false, feeType: 'fixed', feeValue: 0, percentage: 0, platformCGSTRate: 9, platformSGSTRate: 9 };
const DEFAULT_CUSTOM_GST = { enabled: false, rate: 18, cgstRate: 9, sgstRate: 9, hsnCode: '9973' };

export default function AdminVenues() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, resubmitted: 0, suspended: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueTypeFilter, setVenueTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'owner' | 'ambassador'
  const [venueTypes, setVenueTypes] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    customPlatformFee: DEFAULT_CUSTOM_PLATFORM_FEE,
    customGST: DEFAULT_CUSTOM_GST
  });
  const [venueTypeDropdownOpen, setVenueTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVenues, setTotalVenues] = useState(0);
  const [rejectModal, setRejectModal] = useState({ open: false, venueId: null, reason: '' });
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 10000 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (venueTypeFilter !== 'all') params.set('venueType', venueTypeFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) { toast.error('Export failed'); return; }
      const allVenues = data.venues;
      const headers = ['S.No','Venue Name','SKU','Source','Ambassador Name','Ambassador Phone','Owner Name','Owner Email','Owner Phone','City','Area','State','Capacity','Food Type','Total Bookings','Rating','Total Earnings','Status'];
      const rows = allVenues.map((v, i) => [
        i+1, v.businessName||'N/A', v.sku||'N/A',
        v.listingSource === 'ambassador' || v.ambassador ? 'Ambassador' : 'Direct Owner',
        v.ambassador?.name || 'N/A',
        v.ambassador?.phone || 'N/A',
        v.owner?.name||'N/A', v.owner?.email||'N/A', v.owner?.phone||'N/A',
        v.location?.city||'N/A', v.location?.area||'N/A', v.location?.state||'N/A',
        v.capacity||'N/A', v.foodType || 'Veg', v.totalBookings||0,
        v.rating ? `${v.rating}/5` : 'N/A',
        v.totalEarnings ? `₹${v.totalEarnings}` : '₹0',
        v.status||'N/A'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      link.download = `venues_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success(`Exported ${allVenues.length} venues!`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const fetchVenues = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (venueTypeFilter !== 'all') params.set('venueType', venueTypeFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchQuery) params.set('search', searchQuery);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVenues(data.venues);
        setTotalPages(data.totalPages || 1);
        setTotalVenues(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, venueTypeFilter, sourceFilter, searchQuery]);

  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPlatformSettings(data.settings);
    } catch (e) {
      console.error('Failed to fetch platform settings', e);
    }
  };

  const fetchVenueTypes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/types`);
      const data = await res.json();
      if (data.success) setVenueTypes(data.types || []);
    } catch (e) {
      console.error('Failed to fetch venue types', e);
    }
  };

  useEffect(() => {
    if (token) { fetchPlatformSettings(); fetchVenueTypes(); }
  }, [token]);

  useEffect(() => {
    if (token) { setCurrentPage(1); fetchVenues(1); }
  }, [token, statusFilter, venueTypeFilter, sourceFilter, searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setVenueTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (venue) => {
    setSelectedVenue(venue);
    setCustomSettings({
      customPlatformFee: normalizeCustomPlatformFee(venue.customPlatformFee),
      customGST: normalizeCustomGST(venue.customGST)
    });
    setModalOpen(true);
  };

  const handleStatusChange = async (venueId, newStatus, reason = '') => {
    try {
      const endpoint = newStatus === 'approved' ? 'approve' :
                       newStatus === 'rejected' ? 'reject' :
                       newStatus === 'suspended' ? 'suspend' : 'activate';
      const body = newStatus === 'rejected' ? { reason } : {};
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${venueId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Venue ${newStatus} successfully`);
        fetchVenues(currentPage);
        if (selectedVenue && selectedVenue._id === venueId) {
          setSelectedVenue({ ...selectedVenue, status: newStatus });
        }
        setRejectModal({ open: false, venueId: null, reason: '' });
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSaveCustomSettings = async () => {
    if (!selectedVenue) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${selectedVenue._id}/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(customSettings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Custom settings saved');
        setSelectedVenue({ ...selectedVenue, ...customSettings });
        fetchVenues(currentPage);
      } else toast.error(data.message || 'Failed to update settings');
    } catch { toast.error('Failed to update settings'); }
  };

  if (loading && venues.length === 0) {
    return (
      <AdminLayout title="Venues Management" subtitle="Loading venues...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Venues Management" subtitle={`Total ${totalVenues} venues`}>
      <PermissionGuard permission="venues">
        {/* Venue Type Filter */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Filter by Venue Type:</label>
            <div className="flex-1 relative" ref={dropdownRef}>
              <button
                onClick={() => setVenueTypeDropdownOpen(!venueTypeDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between hover:border-gray-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {venueTypeFilter === 'all' ? <><Building2 className="w-4 h-4" /><span>All Venues</span></> : <span>{venueTypeFilter}</span>}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${venueTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {venueTypeDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  <button onClick={() => { setVenueTypeFilter('all'); setVenueTypeDropdownOpen(false); }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${venueTypeFilter === 'all' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'}`}>
                    <Building2 className="w-5 h-5" /><span>All Venues</span>
                  </button>
                  {venueTypes.map((type) => (
                    <button key={type._id} onClick={() => { setVenueTypeFilter(type.name); setVenueTypeDropdownOpen(false); }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100 ${venueTypeFilter === type.name ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'}`}>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-white border-gray-100 text-dark-800', filter: 'all' },
            { label: 'Approved', value: stats.approved, cls: 'bg-green-50 border-green-200 text-green-700', filter: 'approved' },
            { label: 'Pending', value: stats.pending, cls: 'bg-yellow-50 border-yellow-200 text-yellow-700', filter: 'pending' },
            { label: 'Rejected', value: stats.rejected, cls: 'bg-red-50 border-red-200 text-red-700', filter: 'rejected' },
            { label: 'Resubmitted ↩', value: stats.resubmitted, cls: 'bg-blue-50 border-blue-200 text-blue-700', filter: 'resubmitted' },
            { label: 'Suspended', value: stats.suspended, cls: 'bg-gray-50 border-gray-200 text-gray-700', filter: 'suspended' },
          ].map(({ label, value, cls, filter }) => (
            <div key={label} onClick={() => setStatusFilter(filter)}
              className={`rounded-lg shadow-soft border p-4 cursor-pointer hover:shadow-md transition-shadow ${cls} ${statusFilter === filter ? 'ring-2 ring-primary-400' : ''}`}>
              <p className="text-xs mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search by venue name, owner, or city..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-sm">
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="resubmitted">Resubmitted ↩</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-sm font-medium">
                <option value="all">All Sources</option>
                <option value="ambassador">Ambassador Listed 🏆</option>
                <option value="owner">Direct Owner 🏢</option>
              </select>
            </div>
            <button onClick={handleExportCSV} disabled={exporting || totalVenues === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" />{exporting ? 'Exporting...' : `Export CSV (${totalVenues})`}
            </button>
          </div>
        </div>

        {/* Venues Table */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['S.No','Venue','Owner','Location','Capacity','Food Type','Bookings','Rating','Earnings','Status','Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase ${['Bookings','Rating','Earnings'].includes(h) ? 'bg-yellow-50' : ''}`}>
                      {h === 'Earnings' ? (
                        <div className="flex items-center gap-1" title="Owner earnings (excluding platform fee & GST)">
                          {h}
                          <span className="text-[10px] text-gray-400">(Owner)</span>
                        </div>
                      ) : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="11" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : venues.length === 0 ? (
                  <tr><td colSpan="11" className="px-6 py-8 text-center text-gray-500">No venues found</td></tr>
                ) : venues.map((venue, index) => (
                  <tr key={venue._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{(currentPage - 1) * LIMIT + index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-dark-800">{venue.businessName}</p>
                      {(venue.listingSource === 'ambassador' || venue.ambassador) ? (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200" title={venue.ambassador?.email || ''}>
                            <Award className="w-3 h-3 text-amber-600" /> Amb: {venue.ambassador?.name || 'Ambassador Partner'}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px]">
                            Direct Owner
                          </span>
                        </div>
                      )}
                      {venue.status === 'resubmitted' && venue.rejectionReason && (
                        <p className="text-[10px] text-blue-600 mt-0.5 max-w-[180px] truncate">↩ {venue.rejectionReason}</p>
                      )}
                      {venue.status === 'rejected' && venue.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-0.5 max-w-[180px] truncate">✗ {venue.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-dark-800">{venue.owner?.name}</p>
                      <p className="text-xs text-gray-500">{venue.owner?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{venue.location?.city}</p>
                      <p className="text-xs text-gray-500">{venue.location?.area}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{venue.capacity} guests</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {venue.foodType || 'Veg'}
                      </span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">{venue.totalBookings || 0}</span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50 text-xs font-semibold text-amber-600">{venue.rating ? `${venue.rating}/5` : 'N/A'}</td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-green-700">₹{(venue.totalEarnings || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-gray-500">(Excl. platform fee)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        venue.status === 'approved' ? 'bg-green-100 text-green-700' :
                        venue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        venue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        venue.status === 'resubmitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{venue.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openModal(venue)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        <Eye className="w-3 h-3" />View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalVenues)} of {totalVenues} venues
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); fetchVenues(p); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span className="text-xs font-semibold text-gray-700">{currentPage} / {totalPages}</span>
                <button onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); fetchVenues(p); }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1">
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PermissionGuard>

      {/* Modal */}
      {selectedVenue && modalOpen && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => setModalOpen(false)}
          onStatusUpdate={(venueId, action) => {
            if (action === 'reject') {
              setRejectModal({ open: true, venueId, reason: '' });
            } else {
              handleStatusChange(venueId, action);
            }
          }}
          showActions={true}
          platformSettings={platformSettings}
          customSettings={customSettings}
          onUpdateSettings={handleSaveCustomSettings}
        />
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-dark-800 mb-4">Reject Venue</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectModal({ open: false, venueId: null, reason: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectModal.reason.trim()) {
                    toast.error('Please provide a rejection reason');
                    return;
                  }
                  handleStatusChange(rejectModal.venueId, 'rejected', rejectModal.reason);
                  setModalOpen(false);
                }}
                disabled={!rejectModal.reason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Reject Venue
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
