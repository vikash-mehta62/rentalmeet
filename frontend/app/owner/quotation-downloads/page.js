'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { FileText, Building2, Search, Download, Printer } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function OwnerQuotationDownloads() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venueFilter, setVenueFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (token) { fetchVenues(); fetchRecords(); }
  }, [token]);

  useEffect(() => {
    if (token) fetchRecords();
  }, [venueFilter]);

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${API}/owner/venues`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setVenues(data.venues);
    } catch {}
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = `${API}/owner/quotation-downloads${venueFilter ? `?venueId=${venueFilter}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setRecords(data.records);
    } catch {}
    setLoading(false);
  };

  const filtered = records.filter(r =>
    !search ||
    r.customerSnapshot?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.customerSnapshot?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.customerSnapshot?.phone?.includes(search) ||
    r.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.customerSnapshot?.eventType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OwnerLayout title="Quotation Downloads" subtitle="Customers who downloaded or printed quotations for your venues">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, event or quotation no..."
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
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No quotation downloads yet</p>
          <p className="text-slate-400 text-sm mt-1">When customers download or print quotations for your venues, they'll appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Row summary */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                {/* Quotation number + action badge */}
                <div className="flex items-center gap-2 min-w-[160px]">
                  <span className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-1 rounded font-semibold">
                    {r.quotationNumber || '—'}
                  </span>
                  {r.action === 'print'
                    ? <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full"><Printer size={10} />Print</span>
                    : <span className="flex items-center gap-1 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full"><Download size={10} />PDF</span>
                  }
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold text-slate-800 text-sm">{r.customerSnapshot?.name || r.customer?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{r.customerSnapshot?.phone || r.customer?.phone}</p>
                </div>

                {/* Event */}
                <div className="min-w-[120px]">
                  <p className="text-sm text-slate-700">{r.customerSnapshot?.eventType || '—'}</p>
                  {r.customerSnapshot?.guestCount && (
                    <p className="text-xs text-gray-400">{r.customerSnapshot.guestCount} guests</p>
                  )}
                </div>

                {/* Venue */}
                <div className="min-w-[140px]">
                  <p className="text-sm font-semibold text-slate-700">{r.venueSnapshot?.businessName || r.venue?.businessName || '—'}</p>
                  <p className="text-xs text-gray-400">{r.venueSnapshot?.city || r.venue?.location?.city}</p>
                </div>

                {/* Amount */}
                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-green-700 text-sm">
                    {r.priceSnapshot?.grandTotal ? `₹${r.priceSnapshot.grandTotal.toLocaleString('en-IN')}` : r.totalAmount ? `₹${r.totalAmount.toLocaleString('en-IN')}` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(r.downloadedAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === i && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  {/* Customer details */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Details</p>
                    <div className="space-y-1">
                      <p><span className="text-gray-500">Name:</span> <span className="font-medium text-slate-800">{r.customerSnapshot?.name || '—'}</span></p>
                      <p><span className="text-gray-500">Email:</span> <span className="font-medium text-slate-800">{r.customerSnapshot?.email || '—'}</span></p>
                      <p><span className="text-gray-500">Phone:</span> <span className="font-medium text-slate-800">{r.customerSnapshot?.phone || '—'}</span></p>
                      <p><span className="text-gray-500">Event:</span> <span className="font-medium text-slate-800">{r.customerSnapshot?.eventType || '—'}</span></p>
                      <p><span className="text-gray-500">Guests:</span> <span className="font-medium text-slate-800">{r.customerSnapshot?.guestCount || '—'}</span></p>
                      {r.customerSnapshot?.specialRequirements && (
                        <p><span className="text-gray-500">Note:</span> <span className="font-medium text-slate-800">{r.customerSnapshot.specialRequirements}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Booking details */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Booking Details</p>
                    <div className="space-y-1">
                      <p><span className="text-gray-500">Date:</span> <span className="font-medium text-slate-800">{r.bookingSnapshot?.date ? new Date(r.bookingSnapshot.date).toLocaleDateString('en-IN') : '—'}</span></p>
                      <p><span className="text-gray-500">Time:</span> <span className="font-medium text-slate-800">{r.bookingSnapshot?.startTime} {r.bookingSnapshot?.endTime ? `- ${r.bookingSnapshot.endTime}` : ''}</span></p>
                      <p><span className="text-gray-500">Type:</span> <span className="font-medium text-slate-800 capitalize">{r.bookingSnapshot?.bookingType || '—'}</span></p>
                      <p><span className="text-gray-500">Venue:</span> <span className="font-medium text-slate-800">{r.venueSnapshot?.businessName || '—'}</span></p>
                      <p><span className="text-gray-500">Address:</span> <span className="font-medium text-slate-800">{r.venueSnapshot?.address || '—'}</span></p>
                      <p><span className="text-gray-500">Capacity:</span> <span className="font-medium text-slate-800">{r.venueSnapshot?.capacity || '—'}</span></p>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price Breakdown</p>
                    {r.priceSnapshot ? (
                      <div className="space-y-1">
                        <p><span className="text-gray-500">Base Price:</span> <span className="font-medium">₹{(r.priceSnapshot.basePrice || 0).toLocaleString('en-IN')}</span></p>
                        {r.priceSnapshot.amenitiesTotal > 0 && (
                          <p><span className="text-gray-500">Amenities:</span> <span className="font-medium">₹{r.priceSnapshot.amenitiesTotal.toLocaleString('en-IN')}</span></p>
                        )}
                        <p><span className="text-gray-500">Subtotal:</span> <span className="font-medium">₹{(r.priceSnapshot.subtotal || 0).toLocaleString('en-IN')}</span></p>
                        {r.priceSnapshot.gst > 0 && (
                          <p><span className="text-gray-500">GST:</span> <span className="font-medium">₹{r.priceSnapshot.gst.toLocaleString('en-IN')}</span></p>
                        )}
                        {r.priceSnapshot.platformFee > 0 && (
                          <p><span className="text-gray-500">Platform Fee:</span> <span className="font-medium">₹{r.priceSnapshot.platformFee.toLocaleString('en-IN')}</span></p>
                        )}
                        {r.priceSnapshot.discount > 0 && (
                          <p><span className="text-gray-500">Discount:</span> <span className="font-medium text-green-600">-₹{r.priceSnapshot.discount.toLocaleString('en-IN')}</span></p>
                        )}
                        <p className="border-t border-gray-200 pt-1 mt-1">
                          <span className="text-gray-700 font-semibold">Grand Total:</span>
                          <span className="font-bold text-green-700 ml-1">₹{(r.priceSnapshot.grandTotal || 0).toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400">₹{r.totalAmount?.toLocaleString('en-IN') || '—'}</p>
                    )}
                    <p className="mt-3 text-xs text-gray-400">
                      {r.action === 'print' ? '🖨️ Printed' : '⬇️ Downloaded'} at {new Date(r.downloadedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
