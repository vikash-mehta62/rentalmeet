'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Search, Download, Coins, Clock, CheckCircle, AlertCircle, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const BADGE = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700'
};

export default function AdminVendorPaymentsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    total: 0, paid: 0, pending: 0, failed: 0, paidAmount: 0, pendingAmount: 0, failedAmount: 0, vendorPayout: 0
  });
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [selectedVendorBank, setSelectedVendorBank] = useState(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const viewBankDetails = async (vendorId) => {
    if (!vendorId) return toast.error('No vendor linked to this service booking.');
    try {
      const loadingToast = toast.loading('Loading vendor bank details...');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${vendorId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      toast.dismiss(loadingToast);
      if (json.success && json.profile?.bankDetails) {
        setSelectedVendorBank({
          vendorName: json.vendor?.name || 'Vendor',
          ...json.profile.bankDetails
        });
        setBankModalOpen(true);
      } else {
        toast.error('No bank details linked for this vendor profile.');
      }
    } catch {
      toast.error('Failed to load bank details.');
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        setStats(data.stats || stats);
      } else {
        toast.error(data.message || 'Failed to load vendor payments');
      }
    } catch (e) {
      toast.error('Failed to load vendor payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPayments();
  }, [token, paymentStatus]);

  const handleExportCSV = () => {
    const rows = [
      ['#', 'Booking No', 'Vendor', 'Vendor Email', 'Customer', 'Customer Email', 'Service', 'Category', 'Total', 'Platform Fee+GST', 'Vendor Payout', 'Payment Status', 'Paid At', 'Settlement Status', 'Settled Reference', 'Settled At'],
      ...payments.map((p, idx) => {
        const meta = p.paymentMeta || {};
        const feeGst = (meta.platformFee || 0) + (meta.platformFeeGST || 0);
        return [
          idx + 1,
          p.bookingNumber || '',
          p.vendor?.name || '',
          p.vendor?.email || '',
          p.customerInfo?.name || '',
          p.customerInfo?.email || '',
          p.serviceSnapshot?.title || p.service?.title || '',
          p.serviceSnapshot?.category || p.service?.category || '',
          meta.total || 0,
          feeGst,
          meta.vendorPayout || 0,
          p.paymentStatus || 'pending',
          p.paymentDetails?.paidAt ? new Date(p.paymentDetails.paidAt).toLocaleString('en-IN') : '',
          p.settlementStatus || 'unsettled',
          p.settlementDetails?.transactionId || '',
          p.settlementDetails?.settledAt ? new Date(p.settlementDetails.settledAt).toLocaleString('en-IN') : '',
        ];
      })
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `Vendor_Payments_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  return (
    <AdminLayout title="Vendor Payments" subtitle={`Showing ${payments.length} service payment records`}>
      <PermissionGuard permission="vendorPayments">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700">Paid Amount</p>
            <p className="text-xl font-bold text-green-700">{fmtRs(stats.paidAmount)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">Vendor Payout</p>
            <p className="text-xl font-bold text-blue-700">{fmtRs(stats.vendorPayout)}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">Pending Amount</p>
            <p className="text-xl font-bold text-yellow-700">{fmtRs(stats.pendingAmount)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-4 mb-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
                placeholder="Search booking no, vendor, customer, payment id..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={fetchPayments} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold">
              Search
            </button>
            <button onClick={handleExportCSV} disabled={payments.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Booking No', 'Vendor', 'Customer', 'Service', 'Total', 'Platform Fee + GST', 'Vendor Payout', 'Payment', 'Paid At', 'Settlement', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400">No vendor payments found</td></tr>
                ) : (
                  payments.map((p, idx) => {
                    const meta = p.paymentMeta || {};
                    const feeGst = (meta.platformFee || 0) + (meta.platformFeeGST || 0);
                    return (
                      <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3"><code className="text-xs font-semibold text-primary-600">{p.bookingNumber || '—'}</code></td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-800">{p.vendor?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{p.vendor?.companyName || p.vendor?.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-800">{p.customerInfo?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{p.customerInfo?.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-800">{p.serviceSnapshot?.title || p.service?.title || '—'}</p>
                          <p className="text-xs text-gray-400">{p.serviceSnapshot?.category || p.service?.category || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-900">{fmtRs(meta.total)}</td>
                        <td className="px-4 py-3 text-xs text-purple-700 font-semibold">{fmtRs(feeGst)}</td>
                        <td className="px-4 py-3 text-xs text-blue-700 font-bold">{fmtRs(meta.vendorPayout)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE[p.paymentStatus] || BADGE.pending}`}>
                            {p.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {p.paymentDetails?.paidAt ? new Date(p.paymentDetails.paidAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {p.paymentStatus === 'paid' && p.status === 'completed' ? (
                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                p.settlementStatus === 'settled' ? 'bg-green-100 text-green-700' :
                                p.settlementStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {p.settlementStatus || 'unsettled'}
                              </span>
                              {p.settlementDetails?.transactionId && (
                                <p className="text-[10px] text-gray-400 font-mono mt-1 select-all truncate max-w-[80px]" title={p.settlementDetails.transactionId}>
                                  {p.settlementDetails.transactionId}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 space-y-1 md:space-y-0 md:space-x-1 whitespace-nowrap flex flex-wrap gap-1">
                          <button
                            onClick={() => viewBankDetails(p.vendor?._id)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center gap-1"
                            title="View Vendor Bank Details"
                          >
                            <Eye className="w-3 h-3" /> Bank Info
                          </button>
                          {p.paymentStatus === 'paid' && p.status === 'completed' && p.settlementStatus !== 'settled' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const loadingToast = toast.loading('Attempting automatic settlement...');
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/service-bookings/${p._id}/settle`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ method: 'automatic' })
                                    });
                                    const rData = await res.json();
                                    toast.dismiss(loadingToast);
                                    if (rData.success) {
                                      toast.success('Automatic service payout completed successfully!');
                                      fetchPayments();
                                    } else {
                                      toast.error(rData.message || 'Settlement failed. Check bank details.');
                                      fetchPayments();
                                    }
                                  } catch (err) {
                                    toast.error('Network error.');
                                  }
                                }}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold"
                              >
                                Retry Auto
                              </button>
                              
                              <button
                                onClick={() => {
                                  const txn = prompt('Enter manual transaction ID / UTN reference:');
                                  if (txn === null) return;
                                  const remark = prompt('Enter manual settlement remarks (optional):', 'Settled manually');
                                  if (remark === null) return;
                                  
                                  (async () => {
                                    try {
                                      const loadingToast = toast.loading('Marking manual payout...');
                                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/service-bookings/${p._id}/settle`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ method: 'manual', transactionId: txn, remarks: remark })
                                      });
                                      const rData = await res.json();
                                      toast.dismiss(loadingToast);
                                      if (rData.success) {
                                        toast.success('Service payout marked settled!');
                                        fetchPayments();
                                      } else {
                                        toast.error(rData.message || 'Action failed.');
                                      }
                                    } catch (err) {
                                      toast.error('Network error.');
                                    }
                                  })();
                                }}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold"
                              >
                                Manual Settle
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Bank Details Modal */}
        {bankModalOpen && selectedVendorBank && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Vendor Bank Details</h3>
                  <p className="text-xs text-blue-100">{selectedVendorBank.vendorName}</p>
                </div>
                <button
                  onClick={() => { setBankModalOpen(false); setSelectedVendorBank(null); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-700">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Account Holder Name</span>
                    <span className="font-semibold text-gray-900">{selectedVendorBank.accountHolderName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Bank Name</span>
                    <span className="font-semibold text-gray-900">{selectedVendorBank.bankName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Branch Name</span>
                    <span className="font-semibold text-gray-900">{selectedVendorBank.branchName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Account Number</span>
                    <span className="font-mono font-semibold text-gray-900 select-all">{selectedVendorBank.accountNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">IFSC Code</span>
                    <span className="font-mono font-semibold text-gray-900 select-all">{selectedVendorBank.ifsc || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Account Type</span>
                    <span className="font-semibold text-gray-900 capitalize">{selectedVendorBank.accountType || '—'}</span>
                  </div>
                  {selectedVendorBank.upiId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">UPI ID</span>
                      <span className="font-mono font-semibold text-gray-900 select-all">{selectedVendorBank.upiId}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-100">
                <button
                  onClick={() => { setBankModalOpen(false); setSelectedVendorBank(null); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </AdminLayout>
  );
}
