'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import toast from 'react-hot-toast';
import { Download, Printer, FileText } from 'lucide-react';

export default function VendorQuotationDownloads() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-quotation-downloads`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success) setRecords(d.records);
    }).catch(() => toast.error('Failed to load'))
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <VendorLayout title="Quotation Downloads" subtitle="Loading...">
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </VendorLayout>
  );

  return (
    <VendorLayout title="Quotation Downloads" subtitle={`${records.length} records`}>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No downloads yet</h3>
          <p className="text-sm text-gray-400">When customers download quotations, they'll appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Quotation No</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Service</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Event Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Downloaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r, i) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{r.quotationNumber}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${r.action === 'print' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.action === 'print' ? <Printer className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-800">{r.customerSnapshot?.name}</p>
                    <p className="text-xs text-gray-400">{r.customerSnapshot?.email}</p>
                    {r.customerSnapshot?.phone && <p className="text-xs text-gray-400">{r.customerSnapshot.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-800">{r.serviceSnapshot?.title}</p>
                    <p className="text-xs text-gray-400">{r.serviceSnapshot?.category}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.eventDate ? new Date(r.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-primary-600">
                    {r.totalAmount ? `₹${r.totalAmount.toLocaleString()}` : '—'}
                    {r.priceSnapshot?.discount > 0 && (
                      <p className="text-[10px] text-green-600 font-normal">Coupon: -{r.priceSnapshot.couponCode}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(r.downloadedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VendorLayout>
  );
}
