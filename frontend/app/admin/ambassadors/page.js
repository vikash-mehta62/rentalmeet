'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useAuthStore } from '@/lib/store';
import { generateAmbassadorPDF } from '@/utils/generateAmbassadorPDF';
import {
  Award,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  Check,
  FileText,
  MapPin,
  Briefcase,
  Calendar,
  TrendingUp,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ban,
  UserCheck,
  Printer
} from 'lucide-react';

// Helper Component for KYC Document Preview & Fallback
function KYCDocCard({ title, url, isOptional = false }) {
  const [imgError, setImgError] = useState(false);

  const cleanUrl = (() => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanPath}`;
  })();

  const isPdf = cleanUrl?.toLowerCase()?.includes('.pdf') || imgError;

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col justify-between text-center space-y-2 shadow-xs">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-gray-800">{title}</span>
          {cleanUrl ? (
            <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 font-bold rounded">Uploaded</span>
          ) : (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isOptional ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-600'}`}>
              {isOptional ? 'Optional' : 'Missing'}
            </span>
          )}
        </div>

        {cleanUrl ? (
          isPdf ? (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-28 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-primary-600 hover:bg-gray-100 transition-colors group p-2"
            >
              <FileText className="w-8 h-8 mb-1 text-primary-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-700">Document File</span>
              <span className="text-[9px] text-primary-600 font-semibold mt-0.5 inline-flex items-center gap-0.5">
                Open File <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>
          ) : (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative group overflow-hidden rounded-lg border border-gray-200 bg-gray-50 h-28"
            >
              <img
                src={cleanUrl}
                alt={title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                <Eye className="w-3 h-3" /> View Original
              </div>
            </a>
          )
        ) : (
          <div className="h-28 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-6 h-6 text-gray-300 mb-1" />
            <span className="text-[10px]">Not Uploaded</span>
          </div>
        )}
      </div>

      {cleanUrl && (
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-bold py-1 px-2 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
        >
          <Eye className="w-3 h-3" /> View {title.split(' ')[0]} <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
        </a>
      )}
    </div>
  );
}

export default function AdminAmbassadorsPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('ambassadors'); // 'ambassadors' | 'payouts' | 'bookings'
  
  // Ambassadors List State
  const [ambassadors, setAmbassadors] = useState([]);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  // Ambassador Bookings State
  const [ambBookings, setAmbBookings] = useState([]);
  const [loadingAmbBookings, setLoadingAmbBookings] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Selected Ambassador for Review Modal
  const [selectedAmbassador, setSelectedAmbassador] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [customAmbassadorId, setCustomAmbassadorId] = useState('');
  const [customLevel, setCustomLevel] = useState('LV.1 Venue Explorer');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActiveStatus, setIsActiveStatus] = useState(true);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Payouts List State
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('');

  // Selected Payout for Settlement Modal
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [settlementStatus, setSettlementStatus] = useState('completed');
  const [transactionRef, setTransactionRef] = useState('');
  const [settlementNote, setSettlementNote] = useState('');
  const [updatingPayout, setUpdatingPayout] = useState(false);

  const fetchAmbBookings = async () => {
    setLoadingAmbBookings(true);
    try {
      const params = new URLSearchParams({
        source: 'ambassador',
        limit: 100,
        ...(bookingStatusFilter !== 'all' && { status: bookingStatusFilter })
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAmbBookings(json.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching ambassador bookings:', err);
    } finally {
      setLoadingAmbBookings(false);
    }
  };

  const fetchAmbassadors = async () => {
    setLoadingAmbassadors(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ambassadors?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAmbassadors(json.ambassadors || []);
        setTotalPages(json.totalPages || json.pages || 1);
        setTotalCount(json.total || json.totalCount || 0);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error('Error fetching ambassadors:', err);
    } finally {
      setLoadingAmbassadors(false);
    }
  };

  const fetchPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const params = new URLSearchParams({
        ...(payoutStatusFilter && { status: payoutStatusFilter })
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ambassador-payouts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setPayouts(json.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'ambassadors') fetchAmbassadors();
      else if (activeTab === 'payouts') fetchPayouts();
      else if (activeTab === 'bookings') fetchAmbBookings();
    }
  }, [token, activeTab, page, limit, statusFilter, payoutStatusFilter, bookingStatusFilter]);

  const handleOpenReviewModal = (amb) => {
    setSelectedAmbassador(amb);
    setReviewStatus(amb.applicationStatus || amb.status || 'approved');
    setCustomAmbassadorId(amb.ambassadorId || '');
    setCustomLevel(amb.assignedLevel || amb.level || 'LV.1 Venue Explorer');
    setRejectionReason(amb.rejectionReason || '');
    setIsActiveStatus(amb.isActive !== false);
    setDeactivationReason(amb.deactivationReason || amb.inactivityReason || '');
  };

  const handleDownloadPDF = async (amb) => {
    if (!amb) return;
    setDownloadingPdfId(amb._id);
    try {
      let fullAmbData = amb;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ambassadors/${amb._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.ambassador) {
          fullAmbData = {
            ...json.ambassador,
            venues: json.venues || []
          };
        }
      } catch (fetchErr) {
        console.warn('Could not fetch additional venue details:', fetchErr);
      }
      await generateAmbassadorPDF(fullAmbData);
    } catch (err) {
      alert('Failed to generate Ambassador PDF: ' + err.message);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleUpdateAmbassadorStatus = async (e) => {
    e.preventDefault();
    if (!selectedAmbassador) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ambassadors/${selectedAmbassador._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          applicationStatus: reviewStatus,
          ambassadorId: customAmbassadorId || undefined,
          assignedLevel: customLevel,
          level: customLevel,
          rejectionReason: reviewStatus === 'rejected' ? rejectionReason : undefined,
          isActive: isActiveStatus,
          deactivationReason: !isActiveStatus ? (deactivationReason || 'Deactivated by admin') : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedAmbassador(null);
        fetchAmbassadors();
      } else {
        alert(json.message || 'Status update failed');
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePayoutStatus = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;
    setUpdatingPayout(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ambassador-payouts/${selectedPayout._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: settlementStatus,
          transactionReference: transactionRef,
          notes: settlementNote
        })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedPayout(null);
        fetchPayouts();
      } else {
        alert(json.message || 'Payout update failed');
      }
    } catch {
      alert('Failed to update payout');
    } finally {
      setUpdatingPayout(false);
    }
  };

  const exportAmbassadorsToCSV = () => {
    if (!ambassadors || ambassadors.length === 0) return;
    const headers = [
      'S.No.',
      'Ambassador ID',
      'Name',
      'Email',
      'Phone',
      'City',
      'State',
      'Area Coverage',
      'Level',
      'Badge',
      'Approval Status',
      'Activity Status',
      'Approved Venues',
      'Total Venues',
      'Wallet Balance (INR)',
      'Application Date',
      'Approval Date'
    ];

    const rows = ambassadors.map((a, idx) => [
      (page - 1) * limit + idx + 1,
      `"${a.ambassadorId || 'Pending'}"`,
      `"${a.userId?.name || a.user?.name || a.personalInfo?.fullName || 'N/A'}"`,
      `"${a.userId?.email || a.user?.email || a.personalInfo?.email || 'N/A'}"`,
      `"${a.userId?.phone || a.user?.phone || a.personalInfo?.mobileNumber || 'N/A'}"`,
      `"${a.addressDetails?.city || 'N/A'}"`,
      `"${a.addressDetails?.state || 'N/A'}"`,
      `"${a.addressDetails?.areaCoverage || 'N/A'}"`,
      `"${a.assignedLevel || a.level || 'LV.1'}"`,
      `"${a.badge || 'Bronze Explorer'}"`,
      `"${(a.applicationStatus || a.status || 'pending').toUpperCase()}"`,
      `"${a.isActive === false ? 'INACTIVE (BLOCKED)' : 'ACTIVE'}"`,
      a.totalVenuesApproved || 0,
      a.totalVenuesSubmitted || 0,
      a.walletBalance || 0,
      `"${a.applicationDate || a.createdAt ? new Date(a.applicationDate || a.createdAt).toLocaleDateString('en-IN') : 'N/A'}"`,
      `"${a.approvalDate || a.verifiedAt ? new Date(a.approvalDate || a.verifiedAt).toLocaleDateString('en-IN') : 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ambassadors_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Venue Ambassador Management" subtitle="Manage Ambassador Partners, Applications, Profile Records, and Settlements">
      <PermissionGuard permission="ambassadors">
      <div className="space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab('ambassadors')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ambassadors'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Award className="w-4 h-4" /> Ambassador Partners ({stats.total || totalCount})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Ambassador Venue Bookings ({ambBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <IndianRupee className="w-4 h-4" /> Payout Requests
          </button>
        </div>

        {/* TAB 1: AMBASSADORS LIST */}
        {activeTab === 'ambassadors' && (
          <div className="space-y-4">
            
            {/* Overview KPI Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Total Partners</p>
                  <p className="text-lg font-black text-gray-900">{stats.total || totalCount}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Approved Partners</p>
                  <p className="text-lg font-black text-green-600">
                    {stats.approved !== undefined ? stats.approved : ambassadors.filter(a => (a.applicationStatus || a.status) === 'approved').length}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Pending Review</p>
                  <p className="text-lg font-black text-amber-600">
                    {stats.pending !== undefined ? stats.pending : ambassadors.filter(a => (a.applicationStatus || a.status) === 'pending').length}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Wallet Balances</p>
                  <p className="text-lg font-black text-emerald-600">
                    ₹{ambassadors.reduce((sum, a) => sum + (a.walletBalance || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Inactivity Notice Alert */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Active / Inactive 30-Day Rule:</span> If an Ambassador does not list at least 1 venue within 30 days of approval, their Ambassador ID is automatically blocked/deactivated.
              </div>
            </div>

            {/* Search, Status Filters, Limit & Export CSV */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-3 justify-between items-center">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, city, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPage(1);
                      fetchAmbassadors();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                {/* Status Filter Chips */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {['', 'pending', 'approved', 'rejected'].map((st) => (
                    <button
                      key={st}
                      onClick={() => { setStatusFilter(st); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        statusFilter === st
                          ? 'bg-white text-primary-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {st === '' ? 'All' : st}
                    </button>
                  ))}
                </div>

                {/* Limit Selector */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200">
                  <span className="font-semibold">Show:</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Export CSV Button */}
                <button
                  onClick={exportAmbassadorsToCSV}
                  disabled={ambassadors.length === 0}
                  className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Ambassadors Table */}
            {loadingAmbassadors ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-semibold">Loading Ambassadors...</p>
              </div>
            ) : ambassadors.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No Ambassadors found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 text-center w-12">S.No.</th>
                        <th className="p-4">Ambassador Partner</th>
                        <th className="p-4">ID &amp; Level</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Approval Status</th>
                        <th className="p-4">Activity Status</th>
                        <th className="p-4">Applied / Approved</th>
                        <th className="p-4">Venues (App/Tot)</th>
                        <th className="p-4">Wallet Balance</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ambassadors.map((a, idx) => {
                        const serialNum = (page - 1) * limit + idx + 1;
                        const appStatus = a.applicationStatus || a.status || 'pending';
                        
                        return (
                          <tr key={a._id} className="hover:bg-gray-50/70 transition-colors">
                            {/* 1. S.No. */}
                            <td className="p-4 text-center font-bold text-gray-500">
                              {serialNum}
                            </td>

                            {/* 2. Ambassador Details */}
                            <td className="p-4">
                              <div className="font-bold text-gray-900 text-sm">
                                {a.userId?.name || a.user?.name || a.personalInfo?.fullName || 'Ambassador Partner'}
                              </div>
                              <div className="text-[11px] text-gray-500">{a.userId?.email || a.user?.email || a.personalInfo?.email}</div>
                              <div className="text-[11px] text-gray-400 font-mono">{a.userId?.phone || a.user?.phone || a.personalInfo?.mobileNumber}</div>
                            </td>

                            {/* 3. ID & Level */}
                            <td className="p-4">
                              <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-[11px] border border-primary-100">
                                {a.ambassadorId || 'Pending ID'}
                              </span>
                              <div className="text-[11px] text-gray-600 mt-1 font-semibold">
                                {a.assignedLevel || a.level} • <span className="text-gray-500">{a.badge}</span>
                              </div>
                            </td>

                            {/* 4. Location */}
                            <td className="p-4 text-gray-600">
                              <div className="font-semibold text-gray-800">{a.addressDetails?.city || a.user?.city || 'N/A'}</div>
                              <div className="text-[11px] text-gray-500">{a.addressDetails?.state || a.user?.state}</div>
                              <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{a.addressDetails?.areaCoverage}</div>
                            </td>

                            {/* 5. Approval Status */}
                            <td className="p-4">
                              {appStatus === 'approved' ? (
                                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-bold text-[10px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Approved
                                </span>
                              ) : appStatus === 'rejected' ? (
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending Review
                                </span>
                              )}
                            </td>

                            {/* 6. Activity Status (Active / Inactive 30-Day Rule) */}
                            <td className="p-4">
                              {a.activityStatus === 'inactive_auto_blocked' || (!a.isActive && (a.totalVenuesSubmitted || 0) === 0 && (a.daysSinceApproval || 0) > 30) ? (
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1" title={a.inactivityReason || 'Auto-blocked: 0 venues listed within 30 days'}>
                                  <Ban className="w-3 h-3 text-red-600" /> Inactive (30d Inactive)
                                </span>
                              ) : a.isActive === false || a.activityStatus === 'inactive_admin_blocked' ? (
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1" title={a.inactivityReason || 'Blocked by administrator'}>
                                  <Ban className="w-3 h-3" /> Blocked
                                </span>
                              ) : appStatus === 'approved' ? (
                                (a.totalVenuesSubmitted || 0) > 0 ? (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active ({a.totalVenuesSubmitted} {a.totalVenuesSubmitted === 1 ? 'Venue' : 'Venues'})
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1" title={`Grace period: ${a.daysRemaining !== undefined ? a.daysRemaining : 30} days remaining to submit 1st venue`}>
                                    <Clock className="w-3 h-3 text-blue-600" /> Active ({a.daysRemaining !== undefined ? a.daysRemaining : 30}d left)
                                  </span>
                                )
                              ) : appStatus === 'rejected' ? (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold text-[10px]">
                                  Rejected
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                                  Under Review
                                </span>
                              )}
                            </td>

                            {/* 7. Applied / Approved Dates */}
                            <td className="p-4 text-gray-600">
                              <div className="text-[11px] font-semibold text-gray-800">
                                <span className="text-gray-400 font-normal">Applied:</span> {a.applicationDate || a.createdAt ? new Date(a.applicationDate || a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                <span className="text-gray-400 font-normal">Approved:</span> {a.approvalDate || a.verifiedAt ? (
                                  <span className="text-green-700 font-semibold">{new Date(a.approvalDate || a.verifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                ) : (
                                  <span className="text-amber-600 font-medium">Pending</span>
                                )}
                              </div>
                            </td>

                            {/* 8. Venues Count */}
                            <td className="p-4">
                              <div className="font-bold text-gray-900">
                                <span className="text-green-600 font-black">{a.totalVenuesApproved || 0}</span> / {a.totalVenuesSubmitted || 0}
                              </div>
                              <div className="text-[10px] text-gray-400">Approved / Submitted</div>
                            </td>

                            {/* 9. Wallet Balance */}
                            <td className="p-4 font-black text-gray-900 text-sm">
                              ₹{(a.walletBalance || 0).toLocaleString('en-IN')}
                            </td>

                            {/* 10. Actions */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Profile PDF Button */}
                                <button
                                  onClick={() => handleDownloadPDF(a)}
                                  disabled={downloadingPdfId === a._id}
                                  className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 border border-red-200 disabled:opacity-50"
                                  title="Download Ambassador Profile PDF"
                                >
                                  {downloadingPdfId === a._id ? (
                                    <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-red-600" />
                                  )}
                                  <span>PDF</span>
                                </button>

                                {/* Review Application Button */}
                                <button
                                  onClick={() => handleOpenReviewModal(a)}
                                  className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 border border-primary-200"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Review
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Complete Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50/80 border-t border-gray-200 text-xs gap-3">
                  <div className="text-gray-600 font-medium">
                    Showing <strong className="text-gray-900">{(page - 1) * limit + 1}</strong> to <strong className="text-gray-900">{Math.min(page * limit, totalCount)}</strong> of <strong className="text-gray-900">{totalCount}</strong> entries (Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong>)
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* First Page */}
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      title="First Page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Prev Page */}
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((pNum) => {
                        if (totalPages <= 7) return true;
                        return pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1;
                      })
                      .map((pNum, index, arr) => {
                        const prev = arr[index - 1];
                        return (
                          <div key={pNum} className="flex items-center gap-1">
                            {prev && pNum - prev > 1 && <span className="px-1 text-gray-400 font-bold">...</span>}
                            <button
                              onClick={() => setPage(pNum)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                page === pNum
                                  ? 'bg-primary-600 text-white shadow-xs'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pNum}
                            </button>
                          </div>
                        );
                      })}

                    {/* Next Page */}
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 shadow-xs"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last Page */}
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      title="Last Page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYOUTS LIST */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['', 'pending', 'completed', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPayoutStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize ${
                    payoutStatusFilter === st
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {st === '' ? 'All Payouts' : st}
                </button>
              ))}
            </div>

            {loadingPayouts ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading Payout Requests...</p>
              </div>
            ) : payouts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No Payout Requests</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-4">Payout #</th>
                      <th className="p-4">Ambassador</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payment Method / Destination</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Requested Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payouts.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/60">
                        <td className="p-4 font-mono font-bold text-gray-800">{p.payoutNumber || p._id.slice(-6).toUpperCase()}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{p.ambassador?.name || p.profile?.personalInfo?.fullName || p.userId?.name || 'Ambassador Partner'}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{p.profile?.ambassadorId || 'ID Pending'}</div>
                        </td>
                        <td className="p-4 font-black text-green-700 text-sm">₹{p.amount}</td>
                        <td className="p-4">
                          <span className="font-bold uppercase text-[11px] text-gray-800">{p.payoutMethod || 'UPI'}</span>
                          <span className="block text-[11px] text-gray-500 font-mono">
                            {(p.payoutMethod?.toLowerCase().includes('upi') || p.payoutDetails?.upiId || p.upiId) ? (
                              p.payoutDetails?.upiId || p.upiId
                            ) : (
                              <span>
                                {p.payoutDetails?.bankName || p.bankDetails?.bankName} | A/C: {p.payoutDetails?.accountNumber || p.bankDetails?.accountNumber} | IFSC: {p.payoutDetails?.ifscCode || p.bankDetails?.ifscCode}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-4">
                          {p.status === 'completed' ? (
                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-bold text-[10px]">
                              Paid (Ref: {p.transactionReference})
                            </span>
                          ) : p.status === 'rejected' ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 text-right">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedPayout(p);
                                setSettlementStatus('completed');
                                setTransactionRef('');
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                            >
                              Settle Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AMBASSADOR VENUE BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Total Ambassador Bookings</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{ambBookings.length}</p>
                <p className="text-[11px] text-gray-400 mt-1">Bookings on ambassador listings</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Total Paid Volume</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  ₹{ambBookings
                    .filter(b => b.paymentStatus === 'paid')
                    .reduce((sum, b) => sum + (b.amount || b.totalAmount || 0), 0)
                    .toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Gross paid transaction value</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Platform Commission</p>
                <p className="text-2xl font-black text-primary-600 mt-1">
                  ₹{ambBookings
                    .filter(b => b.paymentStatus === 'paid')
                    .reduce((sum, b) => sum + (b.commissionAmount || Math.round((b.amount || 0) * 0.15)), 0)
                    .toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Total RentalMeet profit</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Ambassador 25% Share</p>
                <p className="text-2xl font-black text-purple-600 mt-1">
                  ₹{ambBookings
                    .filter(b => b.paymentStatus === 'paid')
                    .reduce((sum, b) => sum + Math.round((b.commissionAmount || ((b.amount || 0) * 0.15)) * 0.25), 0)
                    .toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">25% profit share credited to partners</p>
              </div>
            </div>

            {/* Filter & Refresh */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Status:</span>
                {['all', 'confirmed', 'completed', 'pending', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      bookingStatusFilter === st
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchAmbBookings}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
                title="Refresh Bookings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Bookings Table */}
            {loadingAmbBookings ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-500 font-semibold">Loading Ambassador Bookings...</p>
              </div>
            ) : ambBookings.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">No Ambassador bookings found</p>
                <p className="text-xs text-gray-400 mt-1">Bookings on venues listed by Ambassadors will show up here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Booking #</th>
                      <th className="p-4">Venue</th>
                      <th className="p-4">Ambassador Partner</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Booking Date</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">25% Amb Share</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ambBookings.map((b) => {
                      const grandTotal = b.amount || b.totalAmount || 0;
                      const profitShare = Math.round((b.commissionAmount || (grandTotal * 0.15)) * 0.25);
                      return (
                        <tr key={b._id} className="hover:bg-gray-50/60">
                          <td className="p-4 font-mono font-bold text-gray-900">
                            {b.bookingNumber || `#${b._id.slice(-6).toUpperCase()}`}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{b.venue?.businessName}</p>
                            <p className="text-[11px] text-gray-500">{b.venue?.location?.city}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 font-bold text-amber-800">
                              <Award className="w-3.5 h-3.5 text-amber-600" />
                              {b.venue?.ambassador?.name || 'Ambassador Partner'}
                            </div>
                            <div className="text-[11px] text-gray-500">{b.venue?.ambassador?.phone || b.venue?.ambassador?.email}</div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-gray-800">{b.customer?.name}</p>
                            <p className="text-[11px] text-gray-500">{b.customer?.phone}</p>
                          </td>
                          <td className="p-4 text-gray-700">
                            <p className="font-semibold">{new Date(b.bookingDate).toLocaleDateString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400">{b.startTime} - {b.endTime}</p>
                          </td>
                          <td className="p-4 font-bold text-gray-900">
                            ₹{grandTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 font-black text-purple-700 text-sm">
                            ₹{profitShare.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              b.status === 'completed' ? 'bg-green-100 text-green-700' :
                              b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {b.paymentStatus || 'pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REVIEW APPLICATION MODAL */}
        {selectedAmbassador && (
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Review Ambassador Application</h3>
                  <p className="text-xs text-gray-500">
                    Applicant: <strong className="text-gray-800">{selectedAmbassador.user?.name || selectedAmbassador.userId?.name || selectedAmbassador.personalInfo?.fullName || 'Ambassador Partner'}</strong>
                    {selectedAmbassador.personalInfo?.mobileNumber || selectedAmbassador.user?.phone ? ` • ${selectedAmbassador.personalInfo?.mobileNumber || selectedAmbassador.user?.phone}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF Button in Modal */}
                  <button
                    onClick={() => handleDownloadPDF(selectedAmbassador)}
                    disabled={downloadingPdfId === selectedAmbassador._id}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 border border-red-200"
                  >
                    {downloadingPdfId === selectedAmbassador._id ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 text-red-600" />
                    )}
                    <span>Download Profile PDF</span>
                  </button>

                  <button onClick={() => setSelectedAmbassador(null)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Dates & Active Status Highlight Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Application Date</span>
                  <span className="font-bold text-gray-800">
                    {selectedAmbassador.applicationDate || selectedAmbassador.createdAt ? new Date(selectedAmbassador.applicationDate || selectedAmbassador.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Approval Date</span>
                  <span className="font-bold text-green-700">
                    {selectedAmbassador.approvalDate || selectedAmbassador.verifiedAt ? new Date(selectedAmbassador.approvalDate || selectedAmbassador.verifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending / Not Approved'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Application Status</span>
                  <span className="font-bold capitalize text-primary-700">
                    {selectedAmbassador.applicationStatus || selectedAmbassador.status || 'pending'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Account Activity</span>
                  <span className={`font-bold text-[11px] ${selectedAmbassador.isActive === false ? 'text-red-600' : 'text-emerald-700'}`}>
                    {selectedAmbassador.isActive === false ? 'Inactive / Blocked' : 'Active Account'}
                  </span>
                </div>
              </div>

              {/* Application Details Summary */}
              <div className="space-y-4 text-xs">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Part A: Personal Information</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div><span className="font-semibold">Parent:</span> {selectedAmbassador.personalInfo?.parentName || 'N/A'}</div>
                    <div><span className="font-semibold">DOB:</span> {selectedAmbassador.personalInfo?.dateOfBirth || 'N/A'}</div>
                    <div><span className="font-semibold">Gender:</span> {selectedAmbassador.personalInfo?.gender || 'N/A'}</div>
                    <div><span className="font-semibold">WhatsApp:</span> {selectedAmbassador.personalInfo?.whatsAppNumber || 'N/A'}</div>
                    <div><span className="font-semibold">Aadhaar:</span> {selectedAmbassador.personalInfo?.aadhaarNumber || 'N/A'}</div>
                    <div><span className="font-semibold">PAN:</span> {selectedAmbassador.personalInfo?.panNumber || 'N/A'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Part B: Address &amp; Coverage</p>
                  <p className="text-gray-600">{selectedAmbassador.addressDetails?.currentAddress}, {selectedAmbassador.addressDetails?.city}, {selectedAmbassador.addressDetails?.state} - {selectedAmbassador.addressDetails?.pincode}</p>
                  <p className="text-primary-700 font-semibold">Coverage Area: {selectedAmbassador.addressDetails?.areaCoverage}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Part C &amp; D: Professional &amp; Profile</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div><span className="font-semibold">Occupation:</span> {selectedAmbassador.professionalDetails?.currentOccupation || 'N/A'}</div>
                    <div><span className="font-semibold">Company:</span> {selectedAmbassador.professionalDetails?.companyName || 'N/A'}</div>
                    <div><span className="font-semibold">Profile Role:</span> {selectedAmbassador.profileType || 'Venue Explorer'}</div>
                    <div><span className="font-semibold">Sales Exp:</span> {selectedAmbassador.professionalDetails?.salesMarketingExperience ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Part G: Bank &amp; Payout Details</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div><span className="font-semibold">UPI ID:</span> {selectedAmbassador.bankDetails?.upiId || 'N/A'}</div>
                    <div><span className="font-semibold">A/C Name:</span> {selectedAmbassador.bankDetails?.accountHolderName || 'N/A'}</div>
                    <div><span className="font-semibold">Bank:</span> {selectedAmbassador.bankDetails?.bankName || 'N/A'}</div>
                    <div><span className="font-semibold">IFSC:</span> {selectedAmbassador.bankDetails?.ifscCode || 'N/A'}</div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary-600" />
                      <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Part I: Uploaded KYC Documents</p>
                    </div>
                    {selectedAmbassador.personalInfo?.aadhaarNumber && (
                      <span className="text-[10px] font-mono bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 text-gray-700 shadow-xs">
                        Aadhaar No: <strong className="text-gray-900">{selectedAmbassador.personalInfo.aadhaarNumber}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KYCDocCard
                      title="Aadhaar (Front)"
                      url={selectedAmbassador.documents?.aadhaarFront || selectedAmbassador.documents?.identityProof}
                    />
                    <KYCDocCard
                      title="Aadhaar (Back)"
                      url={selectedAmbassador.documents?.aadhaarBack || selectedAmbassador.documents?.identityProofBack}
                      isOptional={false}
                    />
                    <KYCDocCard
                      title="PAN Card"
                      url={selectedAmbassador.documents?.panCard}
                      isOptional={true}
                    />
                    <KYCDocCard
                      title="Passport Photo"
                      url={selectedAmbassador.documents?.passportPhoto}
                      isOptional={true}
                    />
                  </div>

                  {/* Optional Bank Proof & Address Proof if present */}
                  {(selectedAmbassador.documents?.bankProof || selectedAmbassador.documents?.addressProof) && (
                    <div className="pt-2 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedAmbassador.documents?.bankProof && (
                        <KYCDocCard
                          title="Bank / Passbook Proof"
                          url={selectedAmbassador.documents.bankProof}
                          isOptional={true}
                        />
                      )}
                      {selectedAmbassador.documents?.addressProof && (
                        <KYCDocCard
                          title="Address Proof"
                          url={selectedAmbassador.documents.addressProof}
                          isOptional={true}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateAmbassadorStatus} className="space-y-4 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Assign Ambassador ID</label>
                    <input
                      type="text"
                      value={customAmbassadorId}
                      onChange={(e) => setCustomAmbassadorId(e.target.value.toUpperCase())}
                      placeholder="e.g. RMA8448424952"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Assign Tier / Level</label>
                    <select
                      value={customLevel}
                      onChange={(e) => setCustomLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="LV.1 Venue Explorer">LV.1 Venue Explorer (₹100/venue)</option>
                      <option value="LV.2 Venue Champion">LV.2 Venue Champion (₹125/venue)</option>
                      <option value="LV.3 Venue Master">LV.3 Venue Master (₹150/venue)</option>
                      <option value="LV.4 City Venue Partner">LV.4 City Venue Partner (₹200/venue)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Application Decision</label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      <option value="approved">Approve Application</option>
                      <option value="pending">Keep as Pending</option>
                      <option value="rejected">Reject Application</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Account Activity (Active / Blocked)</label>
                    <select
                      value={isActiveStatus ? 'active' : 'inactive'}
                      onChange={(e) => setIsActiveStatus(e.target.value === 'active')}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${isActiveStatus ? 'border-green-300 text-green-700 bg-green-50/50' : 'border-red-300 text-red-700 bg-red-50/50'}`}
                    >
                      <option value="active">Active (Permit Venue Listings &amp; Payouts)</option>
                      <option value="inactive">Inactive / Block Ambassador ID</option>
                    </select>
                  </div>
                </div>

                {!isActiveStatus && (
                  <div>
                    <label className="text-xs font-bold text-red-600 block mb-1">Deactivation / Block Reason</label>
                    <input
                      type="text"
                      value={deactivationReason}
                      onChange={(e) => setDeactivationReason(e.target.value)}
                      placeholder="e.g. Inactive with 0 venues listed in 30 days or policy violation"
                      className="w-full px-3 py-2 border border-red-200 rounded-xl text-xs"
                    />
                  </div>
                )}

                {reviewStatus === 'rejected' && (
                  <div>
                    <label className="text-xs font-bold text-red-600 block mb-1">Rejection Reason</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="State why the application is rejected..."
                      rows="2"
                      className="w-full px-3 py-2 border border-red-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating Application...' : 'Save Decision & Update Ambassador'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SETTLE PAYOUT MODAL */}
        {selectedPayout && (
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900">Settle Withdrawal Request</h3>
                <button onClick={() => setSelectedPayout(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl text-xs space-y-1.5">
                <p><span className="font-semibold text-gray-700">Ambassador:</span> {selectedPayout.ambassador?.name || selectedPayout.profile?.personalInfo?.fullName || selectedPayout.userId?.name || 'Ambassador Partner'}</p>
                <p><span className="font-semibold text-gray-700">Contact:</span> {selectedPayout.ambassador?.email || selectedPayout.profile?.personalInfo?.email} {selectedPayout.ambassador?.phone ? `(${selectedPayout.ambassador.phone})` : ''}</p>
                <p><span className="font-semibold text-gray-700">Ambassador ID:</span> {selectedPayout.profile?.ambassadorId || selectedPayout.payoutNumber}</p>
                <p><span className="font-semibold text-gray-700">Withdrawal Amount:</span> <span className="font-black text-green-700 text-sm">₹{selectedPayout.amount}</span></p>
                <p><span className="font-semibold text-gray-700">Method:</span> <span className="uppercase font-bold">{selectedPayout.payoutMethod || 'UPI'}</span></p>
                <p><span className="font-semibold text-gray-700">Destination:</span> {(selectedPayout.payoutMethod?.toLowerCase().includes('upi') || selectedPayout.payoutDetails?.upiId || selectedPayout.upiId) ? (
                  <span className="font-mono font-bold text-primary-600">{selectedPayout.payoutDetails?.upiId || selectedPayout.upiId}</span>
                ) : (
                  <span className="font-semibold">{selectedPayout.payoutDetails?.bankName || selectedPayout.bankDetails?.bankName || 'Bank'} | A/C: <span className="font-mono">{selectedPayout.payoutDetails?.accountNumber || selectedPayout.bankDetails?.accountNumber}</span> | IFSC: <span className="font-mono">{selectedPayout.payoutDetails?.ifscCode || selectedPayout.bankDetails?.ifscCode}</span> ({selectedPayout.payoutDetails?.accountHolderName || selectedPayout.bankDetails?.accountHolderName || ''})</span>
                )}</p>
              </div>

              <form onSubmit={handleUpdatePayoutStatus} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={settlementStatus}
                    onChange={(e) => setSettlementStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="completed">Mark as Completed (Paid)</option>
                    <option value="rejected">Reject (Refund to Ambassador Wallet)</option>
                  </select>
                </div>

                {settlementStatus === 'completed' && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">UTR / Bank Reference Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR192837462819"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs uppercase"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Admin Notes</label>
                  <input
                    type="text"
                    placeholder="Optional transaction notes"
                    value={settlementNote}
                    onChange={(e) => setSettlementNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingPayout}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  {updatingPayout ? 'Updating...' : 'Confirm Settlement'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
