'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { IndianRupee, Wallet, TrendingUp, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmtRs = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

function StatCard({ title, value, note, icon: Icon, tone }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          {note ? <p className="mt-1 text-xs opacity-80">{note}</p> : null}
        </div>
        <div className="rounded-lg bg-white/70 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenuePage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0 });
  const [expenseSummary, setExpenseSummary] = useState({ totalExpenditure: 0, totalRecords: 0 });
  const [liabilitySummary, setLiabilitySummary] = useState({ totalAmount: 0, totalPaid: 0, totalPending: 0 });

  // Pagination states
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Date filter state
  const [dateMode, setDateMode] = useState('financial');
  const [selectedFY, setSelectedFY] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    const years = [];
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < 10; i++) {
      const s = fyStart - i, e = s + 1;
      years.push({ label: `FY ${s}-${e}`, value: `${s}-${e}`, startDate: new Date(s, 3, 1), endDate: new Date(e, 2, 31, 23, 59, 59) });
    }
    setFinancialYears(years);
    setSelectedFY(years[0].value);
  }, []);

  useEffect(() => {
    if (token && (selectedFY || (startDate && endDate) || dateMode === 'financial')) fetchRevenue();
  }, [token, selectedFY, startDate, endDate, dateMode, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFY, startDate, endDate, dateMode]);

  const getRange = () => {
    if (dateMode === 'financial' && selectedFY) {
      const fy = financialYears.find(f => f.value === selectedFY);
      if (!fy) return null;
      // fyYear = start year e.g. "2025" for FY 2025-26
      const fyYear = fy.value.split('-')[0];
      return { dateFilter: 'fy', fyYear };
    }
    if (dateMode === 'custom' && startDate && endDate) {
      const pad = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
      return { dateFilter: 'custom', from: pad(startDate), to: pad(endDate) };
    }
    return null;
  };

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const range = getRange();
      const rangeParams = range ? `?${new URLSearchParams(range)}` : '';
      
      const payQuery = new URLSearchParams();
      if (range) {
        Object.entries(range).forEach(([k, v]) => payQuery.append(k, v));
      }
      payQuery.append('status', 'paid');
      payQuery.append('page', currentPage);
      payQuery.append('limit', '10');

      const [paymentRes, expenseRes, liabilityRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments?${payQuery.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses${rangeParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/liabilities${rangeParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const data = await paymentRes.json();
      const expenseData = await expenseRes.json();
      const liabilityData = await liabilityRes.json();
      if (data.success) {
        setStats(data.stats || { totalRevenue: 0 });
        setPayments(data.payments || []);
        setTotalPages(data.totalPages || 1);
        setTotalRecords(data.total || 0);
        setExpenseSummary(expenseData?.summary || { totalExpenditure: 0, totalRecords: 0 });
        setLiabilitySummary(liabilityData?.summary || { totalAmount: 0, totalPaid: 0, totalPending: 0 });
      } else {
        toast.error('Revenue data load failed');
      }
    } catch {
      toast.error('Revenue data load failed');
    } finally {
      setLoading(false);
    }
  };

  const revenue = useMemo(() => {
    const payment = stats.totalPlatformRevenue || 0;
    const expenditure = expenseSummary.totalExpenditure || 0;
    const liabilities = liabilitySummary.totalAmount || 0;  // total liability (not just pending)
    return { payment, expenditure, liabilities, grossProfit: payment - expenditure - liabilities };
  }, [stats, expenseSummary, liabilitySummary]);

  const handleExportCSV = async () => {
    try {
      const range = getRange();
      const payQuery = new URLSearchParams();
      if (range) {
        Object.entries(range).forEach(([k, v]) => payQuery.append(k, v));
      }
      payQuery.append('status', 'paid');
      payQuery.append('export', 'true');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments?${payQuery.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        toast.error('Failed to fetch transaction details for export');
        return;
      }
      
      const allPaidPayments = data.payments || [];
      const period = dateMode === 'financial'
        ? selectedFY
        : `${startDate?.toLocaleDateString('en-IN') || 'All'} to ${endDate?.toLocaleDateString('en-IN') || 'All'}`;
        
      const rows = [
        ['RentalMeet Revenue & Platform Fee Report'],
        ['Period:', period],
        ['Generated:', new Date().toLocaleString('en-IN')],
        [],
        ['Summary Metrics'],
        ['Total Platform Fee (Excl. GST)', stats.totalPlatformFee || 0],
        ['Total Platform GST', stats.totalPlatformGST || 0],
        ['Total Platform Revenue (Incl. GST)', revenue.payment],
        ['Total Expenditure', revenue.expenditure],
        ['Total Liabilities', revenue.liabilities],
        ['Gross Profit', revenue.grossProfit],
        [],
        ['Detailed Revenue Statement (All Bookings)'],
        [
          'S.No',
          'Type', 
          'Booking No', 
          'Booking Date', 
          'Customer Name', 
          'Customer Email', 
          'Venue/Service Name',
          'Location', 
          'Total Booking Amount (Customer Paid)', 
          'Platform Fee (Excl. GST)', 
          'Platform GST', 
          'Total Platform Fee (Incl. GST)'
        ]
      ];

      allPaidPayments.forEach((p, index) => {
        const isVenue = p.bookingType === 'venue';
        const pb = p.priceBreakdown || {};
        const pi = p.platformInvoice || {};
        const pricing = p.pricing || {};
        
        const platformFee = isVenue 
          ? (pb.platformFee || pi.platformFee || 0)
          : (pricing.platformFee || 0);
        
        const platformGST = isVenue 
          ? (pb.platformFeeGST || (pi.cgst + pi.sgst) || 0)
          : (pricing.platformFeeGST || 0);
        
        const platformFeeTotal = isVenue 
          ? (pb.platformFeeTotal || pi.total || 0)
          : (platformFee + platformGST);

        const customerName = p.customer?.name || p.customerInfo?.name || 'N/A';
        const customerEmail = p.customer?.email || p.customerInfo?.email || 'N/A';
        
        const businessName = isVenue 
          ? (p.venue?.businessName || 'N/A')
          : (p.service?.title || p.serviceSnapshot?.title || 'N/A');
        
        const location = isVenue 
          ? (p.venue?.location?.city || 'N/A')
          : (p.service?.city || p.serviceSnapshot?.city || 'N/A');
        
        rows.push([
          index + 1,
          isVenue ? 'Venue' : 'Service',
          p.bookingNumber || 'N/A',
          p.bookingDate || p.eventDate 
            ? new Date(p.bookingDate || p.eventDate).toLocaleDateString('en-IN') 
            : 'N/A',
          customerName,
          customerEmail,
          businessName,
          location,
          p.amount || 0,
          platformFee,
          platformGST,
          platformFeeTotal
        ]);
      });

      const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      a.download = `Revenue_Statement_${period.replace(/\s/g, '_')}.csv`;
      a.click();
      toast.success('CSV downloaded');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <AdminLayout title="Revenue" subtitle="System revenue summary">
      <PermissionGuard permission="revenue">

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {['financial', 'custom'].map(m => (
              <button key={m} onClick={() => setDateMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateMode === m ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m === 'financial' ? 'Financial Year' : 'Custom Range'}
              </button>
            ))}
          </div>
          {dateMode === 'financial' && (
            <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white">
              {financialYears.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
            </select>
          )}
          {dateMode === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker selected={startDate} onChange={setStartDate} maxDate={endDate || new Date()} dateFormat="dd/MM/yyyy" placeholderText="From" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
              <span className="text-gray-400">—</span>
              <DatePicker selected={endDate} onChange={setEndDate} minDate={startDate} maxDate={new Date()} dateFormat="dd/MM/yyyy" placeholderText="To" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
            </div>
          )}
          <button onClick={handleExportCSV} disabled={loading}
            className="ml-auto flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Expenditure"
                value={fmtRs(revenue.expenditure)}
                note={`Expense entries (${expenseSummary.totalRecords || 0})`}
                icon={Wallet}
                tone="bg-rose-50 border-rose-100 text-rose-700"
              />
              <StatCard
                title="Liabilities (Total)"
                value={fmtRs(revenue.liabilities)}
                note={`Paid: ${fmtRs(liabilitySummary.totalPaid)} · Pending: ${fmtRs(liabilitySummary.totalPending)}`}
                icon={Wallet}
                tone="bg-orange-50 border-orange-100 text-orange-700"
              />
              <StatCard
                title="Platform Revenue"
                value={fmtRs(revenue.payment)}
                note={`Platform Fee: ${fmtRs(stats.totalPlatformFee || 0)} · GST: ${fmtRs(stats.totalPlatformGST || 0)}`}
                icon={IndianRupee}
                tone="bg-blue-50 border-blue-100 text-blue-700"
              />
              <StatCard
                title="Gross Profit"
                value={fmtRs(revenue.grossProfit)}
                note="Revenue − Expenditure − Liabilities"
                icon={TrendingUp}
                tone="bg-emerald-50 border-emerald-100 text-emerald-700"
              />
            </div>

            {/* Platform Fee & GST Statement Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-950 text-lg">Platform Fee & GST Statement</h3>
                  <p className="text-xs text-gray-500 mt-1">Detailed list of bookings with platform fee breakdown</p>
                </div>
                <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full">
                  {totalRecords} Bookings
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-4">S.No</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Booking No</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Venue/Service</th>
                      <th className="px-6 py-4 text-right">Booking Amount</th>
                      <th className="px-6 py-4 text-right">Platform Fee</th>
                      <th className="px-6 py-4 text-right">Platform GST</th>
                      <th className="px-6 py-4 text-right">Total Fee (Incl. GST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center text-gray-400 font-normal">
                          No paid bookings found in this period
                        </td>
                      </tr>
                    ) : (
                      payments.map((p, index) => {
                        const isVenue = p.bookingType === 'venue';
                        const pb = p.priceBreakdown || {};
                        const pi = p.platformInvoice || {};
                        const pricing = p.pricing || {};
                        
                        // Platform fee calculation based on type
                        const platformFee = isVenue 
                          ? (pb.platformFee || pi.platformFee || 0)
                          : (pricing.platformFee || 0);
                        
                        const platformGST = isVenue 
                          ? (pb.platformFeeGST || (pi.cgst + pi.sgst) || 0)
                          : (pricing.platformFeeGST || 0);
                        
                        const platformFeeTotal = isVenue 
                          ? (pb.platformFeeTotal || pi.total || 0)
                          : (platformFee + platformGST);

                        // Customer info
                        const customerName = p.customer?.name || p.customerInfo?.name || 'N/A';
                        const customerEmail = p.customer?.email || p.customerInfo?.email || 'N/A';
                        
                        // Venue/Service info
                        const businessName = isVenue 
                          ? (p.venue?.businessName || 'N/A')
                          : (p.service?.title || p.serviceSnapshot?.title || 'N/A');
                        
                        const location = isVenue 
                          ? (p.venue?.location?.city || 'N/A')
                          : (p.service?.city || p.serviceSnapshot?.city || 'N/A');
                        
                        return (
                          <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-gray-400 text-xs">
                              {(currentPage - 1) * 10 + index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                isVenue 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {isVenue ? 'Venue' : 'Service'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-900">
                              {p.bookingNumber || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {p.bookingDate || p.eventDate 
                                ? new Date(p.bookingDate || p.eventDate).toLocaleDateString('en-IN') 
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-[150px] truncate">
                                <p className="text-gray-900 text-xs truncate font-semibold">{customerName}</p>
                                <p className="text-gray-400 text-[10px] truncate">{customerEmail}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-[150px] truncate">
                                <p className="text-gray-900 text-xs truncate font-semibold">{businessName}</p>
                                <p className="text-gray-400 text-[10px] truncate">{location}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 text-xs">
                              {fmtRs(p.amount)}
                            </td>
                            <td className="px-6 py-4 text-right text-xs">
                              {fmtRs(platformFee)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 text-xs">
                              {fmtRs(platformGST)}
                            </td>
                            <td className="px-6 py-4 text-right text-primary-600 font-bold text-xs">
                              {fmtRs(platformFeeTotal)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-gray-500">
                    Showing Page {currentPage} of {totalPages} ({totalRecords} total records)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </PermissionGuard>
    </AdminLayout>
  );
}
