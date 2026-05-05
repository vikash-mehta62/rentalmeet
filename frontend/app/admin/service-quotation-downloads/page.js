'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Search, Download, Printer, ChevronDown, ChevronUp, FileDown } from 'lucide-react';

export default function AdminServiceQuotationDownloads() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/service-quotation-downloads`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { if (d.success) setRecords(d.records); })
    .finally(() => setLoading(false));
  }, [token]);

  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.quotationNumber?.toLowerCase().includes(q) ||
      r.customerSnapshot?.name?.toLowerCase().includes(q) ||
      r.customerSnapshot?.email?.toLowerCase().includes(q) ||
      r.serviceSnapshot?.title?.toLowerCase().includes(q) ||
      r.vendor?.name?.toLowerCase().includes(q);
  });

  // Group by service for summary
  const summary = filtered.reduce((acc, r) => {
    const key = r.serviceSnapshot?.title || 'Unknown';
    if (!acc[key]) acc[key] = { downloads: 0, prints: 0 };
    if (r.action === 'print') acc[key].prints++;
    else acc[key].downloads++;
    return acc;
  }, {});

  const handleExportCSV = () => {
    const rows = [
      ['#', 'Quotation No', 'Action', 'Customer Name', 'Customer Email', 'Customer Phone', 'Event Name', 'Service', 'Category', 'Company', 'Vendor', 'Vendor Email', 'Event Date', 'Subtotal', 'GST', 'Platform Fee+GST', 'Discount', 'Coupon', 'Total', 'Downloaded At'],
      ...filtered.map((r, i) => {
        const ps = r.priceSnapshot || {};
        return [
          i + 1,
          r.quotationNumber || '',
          r.action || '',
          r.customerSnapshot?.name || '',
          r.customerSnapshot?.email || '',
          r.customerSnapshot?.phone || '',
          r.customerSnapshot?.eventName || '',
          r.serviceSnapshot?.title || '',
          r.serviceSnapshot?.category || '',
          r.serviceSnapshot?.companyName || '',
          r.vendor?.name || '',
          r.vendor?.email || '',
          r.eventDate ? new Date(r.eventDate).toLocaleDateString('en-IN') : '',
          ps.subtotal || 0,
          ((ps.serviceCGST || 0) + (ps.serviceSGST || 0)),
          ((ps.platformFee || 0) + (ps.platformFeeGST || 0)),
          ps.discount || 0,
          ps.couponCode || '',
          ps.total || r.totalAmount || 0,
          new Date(r.downloadedAt).toLocaleString('en-IN'),
        ];
      })
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `Service_Quotations_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="Service Quotation Downloads" subtitle={`${filtered.length} records`}>
      <PermissionGuard permission="serviceQuotations">

        {/* Summary Cards */}
        {Object.keys(summary).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(summary).slice(0, 4).map(([name, counts]) => (
              <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-700 truncate mb-2">{name}</p>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-blue-600"><Download className="w-3 h-3" />{counts.downloads}</span>
                  <span className="flex items-center gap-1 text-purple-600"><Printer className="w-3 h-3" />{counts.prints}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by quotation no, customer, service, vendor..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <button onClick={handleExportCSV} disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              <FileDown className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Quotation No</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Service</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Event Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Downloaded At</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No records found</td></tr>
              ) : filtered.map(r => (
                <>
                  <tr key={r._id} className="hover:bg-gray-50">
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
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-800">{r.serviceSnapshot?.title}</p>
                      <p className="text-xs text-gray-400">{r.serviceSnapshot?.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700">{r.vendor?.name}</p>
                      <p className="text-xs text-gray-400">{r.vendor?.companyName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.eventDate ? new Date(r.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-primary-600">
                      {r.totalAmount ? `₹${r.totalAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(r.downloadedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        {expanded === r._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                    </td>
                  </tr>
                  {expanded === r._id && (
                    <tr key={`${r._id}-exp`} className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="font-bold text-gray-500 uppercase mb-2">Customer</p>
                            <p className="font-semibold">{r.customerSnapshot?.name}</p>
                            {r.customerSnapshot?.company && <p className="text-gray-500">{r.customerSnapshot.company}</p>}
                            <p className="text-gray-500">{r.customerSnapshot?.email}</p>
                            <p className="text-gray-500">{r.customerSnapshot?.phone}</p>
                            {r.customerSnapshot?.eventName && <p className="text-gray-500 mt-1">Event: {r.customerSnapshot.eventName}</p>}
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="font-bold text-gray-500 uppercase mb-2">Service</p>
                            <p className="font-semibold">{r.serviceSnapshot?.title}</p>
                            <p className="text-gray-500">{r.serviceSnapshot?.category}</p>
                            <p className="text-gray-500">{r.serviceSnapshot?.companyName}</p>
                            <p className="text-gray-500">{[r.serviceSnapshot?.city, r.serviceSnapshot?.state].filter(Boolean).join(', ')}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="font-bold text-gray-500 uppercase mb-2">Price Breakdown</p>
                            {r.priceSnapshot && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between"><span>Subtotal</span><span>₹{r.priceSnapshot.subtotal?.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>GST</span><span>₹{((r.priceSnapshot.serviceCGST || 0) + (r.priceSnapshot.serviceSGST || 0)).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Platform Fee + GST</span><span>₹{((r.priceSnapshot.platformFee || 0) + (r.priceSnapshot.platformFeeGST || 0)).toLocaleString()}</span></div>
                                {r.priceSnapshot.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({r.priceSnapshot.couponCode})</span><span>-₹{r.priceSnapshot.discount?.toLocaleString()}</span></div>}
                                <div className="flex justify-between font-bold text-primary-600 border-t border-gray-200 pt-1 mt-1"><span>Total</span><span>₹{r.priceSnapshot.total?.toLocaleString()}</span></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

      </PermissionGuard>
    </AdminLayout>
  );
}
