'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { FileText, Building2, Search, Download, Printer, ChevronDown, ChevronUp, FileDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminQuotationDownloads() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venueFilter, setVenueFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (token) { fetchVenues(); fetchRecords(); }
  }, [token]);

  useEffect(() => {
    if (token) fetchRecords();
  }, [venueFilter, actionFilter]);

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${API}/venues?status=all&limit=500`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVenues(data.venues);
    } catch {}
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (venueFilter) params.set('venueId', venueFilter);
      const res = await fetch(`${API}/admin/quotation-downloads?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRecords(data.records);
    } catch {}
    setLoading(false);
  };

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.customerSnapshot?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.customerSnapshot?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.customerSnapshot?.phone?.includes(search) ||
      r.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.customerSnapshot?.eventType?.toLowerCase().includes(search.toLowerCase()) ||
      r.venueSnapshot?.businessName?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || r.action === actionFilter;
    return matchSearch && matchAction;
  });

  // Group by venue for summary
  const venueSummary = filtered.reduce((acc, r) => {
    const name = r.venueSnapshot?.businessName || r.venue?.businessName || 'Unknown';
    if (!acc[name]) acc[name] = { downloads: 0, prints: 0 };
    if (r.action === 'print') acc[name].prints++;
    else acc[name].downloads++;
    return acc;
  }, {});

  const handleExportCSV = () => {
    const rows = [
      ['#', 'Quotation No', 'Action', 'Customer Name', 'Customer Email', 'Customer Phone', 'Event Type', 'Guests', 'Venue', 'City', 'State', 'Booking Date', 'Start Time', 'End Time', 'Base Price', 'Amenities', 'Subtotal', 'GST', 'Platform Fee', 'Discount', 'Grand Total', 'Downloaded At'],
      ...filtered.map((r, i) => [
        i + 1,
        r.quotationNumber || '',
        r.action || '',
        r.customerSnapshot?.name || '',
        r.customerSnapshot?.email || '',
        r.customerSnapshot?.phone || '',
        r.customerSnapshot?.eventType || '',
        r.customerSnapshot?.guestCount || '',
        r.venueSnapshot?.businessName || r.venue?.businessName || '',
        r.venueSnapshot?.city || r.venue?.location?.city || '',
        r.venueSnapshot?.state || r.venue?.location?.state || '',
        r.bookingSnapshot?.date ? new Date(r.bookingSnapshot.date).toLocaleDateString('en-IN') : '',
        r.bookingSnapshot?.startTime || '',
        r.bookingSnapshot?.endTime || '',
        r.priceSnapshot?.basePrice || 0,
        r.priceSnapshot?.amenitiesTotal || 0,
        r.priceSnapshot?.subtotal || 0,
        r.priceSnapshot?.gst || 0,
        r.priceSnapshot?.platformFee || 0,
        r.priceSnapshot?.discount || 0,
        r.priceSnapshot?.grandTotal || r.totalAmount || 0,
        new Date(r.downloadedAt).toLocaleString('en-IN'),
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `Venue_Quotations_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="Quotation Downloads" subtitle={`${filtered.length} records`}>
      <PermissionGuard permission="quotations">

      {/* Venue-wise Summary Cards */}
      {Object.keys(venueSummary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(venueSummary).map(([name, counts]) => (
            <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-soft p-4">
              <p className="text-xs font-bold text-gray-500 truncate mb-2">{name}</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <Download size={12} className="text-green-500" />
                  <span className="text-lg font-black text-green-700">{counts.downloads}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Printer size={12} className="text-blue-500" />
                  <span className="text-lg font-black text-blue-700">{counts.prints}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, event, venue or quotation no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={venueFilter}
            onChange={e => setVenueFilter(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white min-w-[200px]"
          >
            <option value="">All Venues</option>
            {venues.map(v => <option key={v._id} value={v._id}>{v.businessName}</option>)}
          </select>
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Actions</option>
          <option value="download">PDF Download</option>
          <option value="print">Print</option>
        </select>
        <button onClick={handleExportCSV} disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
          <FileDown className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* Records */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No quotation records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Quotation No</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Event</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Venue</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Booking Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => (
                <>
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                        {r.quotationNumber || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.action === 'print'
                        ? <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full w-fit"><Printer size={10} />Print</span>
                        : <span className="flex items-center gap-1 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full w-fit"><Download size={10} />PDF</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.customerSnapshot?.name || r.customer?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{r.customerSnapshot?.email || r.customer?.email}</p>
                      <p className="text-xs text-gray-400">{r.customerSnapshot?.phone || r.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{r.customerSnapshot?.eventType || '—'}</p>
                      {r.customerSnapshot?.guestCount && (
                        <p className="text-xs text-gray-400">{r.customerSnapshot.guestCount} guests</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.venueSnapshot?.businessName || r.venue?.businessName || '—'}</p>
                      <p className="text-xs text-gray-400">{r.venueSnapshot?.city || r.venue?.location?.city}, {r.venueSnapshot?.state || r.venue?.location?.state}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {r.bookingSnapshot?.date ? new Date(r.bookingSnapshot.date).toLocaleDateString('en-IN') : '—'}
                      {r.bookingSnapshot?.startTime && <p className="text-gray-400">{r.bookingSnapshot.startTime}{r.bookingSnapshot.endTime ? ` - ${r.bookingSnapshot.endTime}` : ''}</p>}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-700">
                      {r.priceSnapshot?.grandTotal
                        ? `₹${r.priceSnapshot.grandTotal.toLocaleString('en-IN')}`
                        : r.totalAmount ? `₹${r.totalAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(r.downloadedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        className="text-slate-400 hover:text-primary-600 transition-colors"
                      >
                        {expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded price breakdown */}
                  {expanded === i && (
                    <tr key={`exp-${i}`}>
                      <td colSpan={9} className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          {/* Customer */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Details</p>
                            <div className="space-y-1">
                              <p><span className="text-gray-500">Name:</span> <span className="font-medium">{r.customerSnapshot?.name || '—'}</span></p>
                              <p><span className="text-gray-500">Email:</span> <span className="font-medium">{r.customerSnapshot?.email || '—'}</span></p>
                              <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{r.customerSnapshot?.phone || '—'}</span></p>
                              <p><span className="text-gray-500">Event:</span> <span className="font-medium">{r.customerSnapshot?.eventType || '—'}</span></p>
                              <p><span className="text-gray-500">Guests:</span> <span className="font-medium">{r.customerSnapshot?.guestCount || '—'}</span></p>
                              {r.customerSnapshot?.specialRequirements && (
                                <p><span className="text-gray-500">Note:</span> <span className="font-medium">{r.customerSnapshot.specialRequirements}</span></p>
                              )}
                            </div>
                          </div>

                          {/* Venue + Booking */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Venue & Booking</p>
                            <div className="space-y-1">
                              <p><span className="text-gray-500">Venue:</span> <span className="font-medium">{r.venueSnapshot?.businessName || '—'}</span></p>
                              <p><span className="text-gray-500">Address:</span> <span className="font-medium">{r.venueSnapshot?.address || '—'}</span></p>
                              <p><span className="text-gray-500">City:</span> <span className="font-medium">{r.venueSnapshot?.city}, {r.venueSnapshot?.state}</span></p>
                              <p><span className="text-gray-500">Capacity:</span> <span className="font-medium">{r.venueSnapshot?.capacity || '—'}</span></p>
                              <p><span className="text-gray-500">Date:</span> <span className="font-medium">{r.bookingSnapshot?.date ? new Date(r.bookingSnapshot.date).toLocaleDateString('en-IN') : '—'}</span></p>
                              <p><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{r.bookingSnapshot?.bookingType || '—'}</span></p>
                            </div>
                          </div>

                          {/* Price */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price Breakdown</p>
                            {r.priceSnapshot ? (
                              <div className="space-y-1">
                                <p><span className="text-gray-500">Base:</span> <span className="font-medium">₹{(r.priceSnapshot.basePrice || 0).toLocaleString('en-IN')}</span></p>
                                {r.priceSnapshot.amenitiesTotal > 0 && <p><span className="text-gray-500">Amenities:</span> <span className="font-medium">₹{r.priceSnapshot.amenitiesTotal.toLocaleString('en-IN')}</span></p>}
                                <p><span className="text-gray-500">Subtotal:</span> <span className="font-medium">₹{(r.priceSnapshot.subtotal || 0).toLocaleString('en-IN')}</span></p>
                                {r.priceSnapshot.gst > 0 && <p><span className="text-gray-500">GST:</span> <span className="font-medium">₹{r.priceSnapshot.gst.toLocaleString('en-IN')}</span></p>}
                                {r.priceSnapshot.platformFee > 0 && <p><span className="text-gray-500">Platform Fee:</span> <span className="font-medium">₹{r.priceSnapshot.platformFee.toLocaleString('en-IN')}</span></p>}
                                {r.priceSnapshot.discount > 0 && <p><span className="text-gray-500">Discount:</span> <span className="font-medium text-green-600">-₹{r.priceSnapshot.discount.toLocaleString('en-IN')}</span></p>}
                                <p className="border-t border-gray-200 pt-1 mt-1 font-bold text-green-700">Grand Total: ₹{(r.priceSnapshot.grandTotal || 0).toLocaleString('en-IN')}</p>
                              </div>
                            ) : <p className="text-gray-400">₹{r.totalAmount?.toLocaleString('en-IN') || '—'}</p>}
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
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
