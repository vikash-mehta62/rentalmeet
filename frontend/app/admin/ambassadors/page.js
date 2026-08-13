'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuthStore } from '@/lib/store';
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
  Download
} from 'lucide-react';

export default function AdminAmbassadorsPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('ambassadors'); // 'ambassadors' | 'payouts' | 'bookings'
  
  // Ambassadors List State
  const [ambassadors, setAmbassadors] = useState([]);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
        limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ambassadors?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAmbassadors(json.ambassadors || []);
        setTotalPages(json.totalPages || 1);
        setTotalCount(json.total || 0);
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
  }, [token, activeTab, page, statusFilter, payoutStatusFilter, bookingStatusFilter]);

  const handleOpenReviewModal = (amb) => {
    setSelectedAmbassador(amb);
    setReviewStatus(amb.applicationStatus || amb.status || 'approved');
    setCustomAmbassadorId(amb.ambassadorId || '');
    setCustomLevel(amb.assignedLevel || amb.level || 'LV.1 Venue Explorer');
    setRejectionReason(amb.rejectionReason || '');
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
          rejectionReason: reviewStatus === 'rejected' ? rejectionReason : undefined
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
      'Ambassador ID',
      'Name',
      'Email',
      'Phone',
      'City',
      'State',
      'Area Coverage',
      'Level',
      'Badge',
      'Status',
      'Approved Venues',
      'Total Venues',
      'Wallet Balance (INR)',
      'Joined Date'
    ];

    const rows = ambassadors.map((a) => [
      `"${a.ambassadorId || 'Pending'}"`,
      `"${a.userId?.name || a.personalInfo?.fullName || 'N/A'}"`,
      `"${a.userId?.email || a.personalInfo?.email || 'N/A'}"`,
      `"${a.userId?.phone || a.personalInfo?.mobileNumber || 'N/A'}"`,
      `"${a.addressDetails?.city || 'N/A'}"`,
      `"${a.addressDetails?.state || 'N/A'}"`,
      `"${a.addressDetails?.areaCoverage || 'N/A'}"`,
      `"${a.assignedLevel || a.level || 'LV.1'}"`,
      `"${a.badge || 'Bronze Explorer'}"`,
      `"${(a.applicationStatus || a.status || 'pending').toUpperCase()}"`,
      a.totalVenuesApproved || 0,
      a.totalVenuesSubmitted || 0,
      a.walletBalance || 0,
      `"${a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : 'N/A'}"`
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
    <AdminLayout title="Venue Ambassador Management" subtitle="Manage Ambassador Partners, Applications, and Payout Settlements">
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
            <Award className="w-4 h-4" /> Ambassador Partners ({totalCount})
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
                  <p className="text-lg font-black text-gray-900">{totalCount}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Approved Partners</p>
                  <p className="text-lg font-black text-green-600">
                    {ambassadors.filter(a => (a.applicationStatus || a.status) === 'approved').length}
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
                    {ambassadors.filter(a => (a.applicationStatus || a.status) === 'pending').length}
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

            {/* Search, Status Filters & Export CSV */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, city or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAmbassadors()}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Status Filter Chips */}
                <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
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

                {/* Export CSV Button */}
                <button
                  onClick={exportAmbassadorsToCSV}
                  disabled={ambassadors.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Ambassadors Table */}
            {loadingAmbassadors ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading Ambassadors...</p>
              </div>
            ) : ambassadors.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No Ambassadors found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="p-4">Ambassador</th>
                        <th className="p-4">ID &amp; Level</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Venues (App/Tot)</th>
                        <th className="p-4">Wallet Balance</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ambassadors.map((a) => (
                        <tr key={a._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{a.userId?.name || a.personalInfo?.fullName || 'Ambassador Partner'}</div>
                            <div className="text-[11px] text-gray-500">{a.userId?.email || a.personalInfo?.email}</div>
                            <div className="text-[11px] text-gray-400">{a.userId?.phone || a.personalInfo?.mobileNumber}</div>
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-[11px]">
                              {a.ambassadorId || 'Pending ID'}
                            </span>
                            <div className="text-[11px] text-gray-600 mt-1 font-semibold">
                              {a.assignedLevel || a.level} • {a.badge}
                            </div>
                          </td>

                          <td className="p-4 text-gray-600">
                            <div>{a.addressDetails?.city || 'N/A'}, {a.addressDetails?.state}</div>
                            <div className="text-[11px] text-gray-400">{a.addressDetails?.areaCoverage}</div>
                          </td>

                          <td className="p-4">
                            {(a.applicationStatus || a.status) === 'approved' ? (
                              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            ) : (a.applicationStatus || a.status) === 'rejected' ? (
                              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending Review
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-gray-900">
                              <span className="text-green-600">{a.totalVenuesApproved || 0}</span> / {a.totalVenuesSubmitted || 0}
                            </div>
                          </td>

                          <td className="p-4 font-black text-gray-900 text-sm">
                            ₹{(a.walletBalance || 0).toLocaleString('en-IN')}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenReviewModal(a)}
                              className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Review Application
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 bg-gray-50/70 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">
                      Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} entries)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-50"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                        <button
                          key={pNum}
                          onClick={() => setPage(pNum)}
                          className={`px-3 py-1.5 rounded-lg font-bold ${
                            page === pNum
                              ? 'bg-primary-600 text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
                <p className="text-xs text-gray-500">Loading payout requests...</p>
              </div>
            ) : payouts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                <p className="text-sm font-bold text-gray-700">No payout requests found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-4">Ambassador</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Method &amp; Destination</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Requested Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payouts.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/60">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">
                            {p.ambassador?.name || p.profile?.personalInfo?.fullName || p.userId?.name || 'Ambassador Partner'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {p.ambassador?.email || p.profile?.personalInfo?.email || p.userId?.email || 'N/A'}
                          </div>
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            ID: {p.profile?.ambassadorId || p.payoutNumber} {p.ambassador?.phone ? `• ${p.ambassador.phone}` : ''}
                          </div>
                        </td>
                        <td className="p-4 font-black text-gray-900 text-sm">₹{p.amount}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-gray-100 uppercase text-[10px] font-bold mr-1.5">
                            {p.payoutMethod || 'UPI'}
                          </span>
                          <span className="text-gray-800 text-xs font-semibold">
                            {(p.payoutMethod?.toLowerCase().includes('upi') || p.payoutDetails?.upiId || p.upiId) ? (
                              <span className="font-mono text-primary-600">{p.payoutDetails?.upiId || p.upiId || 'N/A'}</span>
                            ) : (
                              <span>
                                {p.payoutDetails?.bankName || p.bankDetails?.bankName || 'Bank'} (A/C: <span className="font-mono">{p.payoutDetails?.accountNumber || p.bankDetails?.accountNumber || 'N/A'}</span>, IFSC: <span className="font-mono">{p.payoutDetails?.ifscCode || p.bankDetails?.ifscCode || 'N/A'}</span>)
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
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Review Ambassador Application</h3>
                  <p className="text-xs text-gray-500">Applicant: {selectedAmbassador.userId?.name}</p>
                </div>
                <button onClick={() => setSelectedAmbassador(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
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
                    <div><span className="font-semibold">Aadhaar/PAN:</span> {selectedAmbassador.personalInfo?.aadhaarNumber || 'N/A'}</div>
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
                {selectedAmbassador.documents && (
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                    <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Part I: Uploaded KYC Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAmbassador.documents.passportPhoto && (
                        <a href={selectedAmbassador.documents.passportPhoto} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-primary-600 font-bold inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Photo
                        </a>
                      )}
                      {selectedAmbassador.documents.identityProof && (
                        <a href={selectedAmbassador.documents.identityProof} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-primary-600 font-bold inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" /> ID Proof
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
                      placeholder="e.g. RM-AMB-8801"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono uppercase"
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
                    <option value="suspended">Suspend Ambassador</option>
                  </select>
                </div>

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
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
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
    </AdminLayout>
  );
}
