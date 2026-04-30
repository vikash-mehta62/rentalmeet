'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Search } from 'lucide-react';
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

  return (
    <AdminLayout title="Vendor Payments" subtitle={`Showing ${payments.length} service payment records`}>
      <PermissionGuard permission="payments">
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
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Booking No', 'Vendor', 'Customer', 'Service', 'Total', 'Platform Fee + GST', 'Vendor Payout', 'Payment', 'Paid At'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No vendor payments found</td></tr>
                ) : (
                  payments.map((p, idx) => {
                    const meta = p.paymentMeta || {};
                    const feeGst = (meta.platformFee || 0) + (meta.platformFeeGST || 0);
                    return (
                      <tr key={p._id} className="border-t border-gray-100">
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
