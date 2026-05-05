'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import toast from 'react-hot-toast';
import { Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import ServiceBookingDetailModal from '@/components/service/ServiceBookingDetailModal';

const PAY_STYLE = { paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700' };

export default function AdminServiceBookings() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, enquiry: 0, confirmed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/service-bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { setBookings(data.bookings); setStats(data.stats); }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchBookings(); }, [token, statusFilter]);

  const handleStatusChange = async (id, status) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/service-bookings/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Status updated');
      setBookings(p => p.map(b => b._id === id ? { ...b, status } : b));
      if (selected?._id === id) setSelected(p => ({ ...p, status }));
    } else toast.error(data.message);
  };

  const bNum = (b) => b?.bookingNumber || '—';

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return bNum(b).toLowerCase().includes(q) ||
      b.customerInfo?.name?.toLowerCase().includes(q) ||
      b.customerInfo?.email?.toLowerCase().includes(q) ||
      b.serviceSnapshot?.title?.toLowerCase().includes(q) ||
      b.vendor?.name?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Service Bookings" subtitle="All vendor service enquiries & bookings">
      <PermissionGuard permission="serviceBookings">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[['Total', stats.total, 'bg-white border-gray-100'], ['Enquiries', stats.enquiry, 'bg-yellow-50 border-yellow-200'], ['Confirmed', stats.confirmed, 'bg-green-50 border-green-200'], ['Cancelled', stats.cancelled, 'bg-red-50 border-red-200']].map(([label, value, cls]) => (
            <div key={label} className={`rounded-xl border shadow-sm p-4 ${cls}`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by booking no, customer, service, vendor..."
              value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchBookings()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="all">All Status</option>
            <option value="enquiry">Enquiry</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#','Booking No','Customer','Service','Vendor','Event Date','Total','Payment','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">No bookings found</td></tr>
                : filtered.map((b, i) => {
                  return (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3"><code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{bNum(b)}</code></td>
                      <td className="px-4 py-3"><p className="text-xs font-semibold">{b.customerInfo?.name}</p><p className="text-xs text-gray-400">{b.customerInfo?.email}</p><p className="text-xs text-gray-400">{b.customerInfo?.phone}</p></td>
                      <td className="px-4 py-3"><p className="text-xs font-semibold">{b.serviceSnapshot?.title}</p><p className="text-xs text-gray-400">{b.serviceSnapshot?.category}</p></td>
                      <td className="px-4 py-3"><p className="text-xs font-semibold">{b.vendor?.name}</p><p className="text-xs text-gray-400">{b.vendor?.companyName}</p></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-primary-600">{b.pricing?.total ? `₹${b.pricing.total.toLocaleString()}` : '—'}{b.coupon?.code && <p className="text-[10px] text-green-600 font-normal">Coupon: {b.coupon.code}</p>}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PAY_STYLE[b.paymentStatus] || PAY_STYLE.pending}`}>{b.paymentStatus || 'pending'}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(b)} className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PermissionGuard>

      {selected && (
        <ServiceBookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          canChangeStatus={true}
        />
      )}
    </AdminLayout>
  );
}
