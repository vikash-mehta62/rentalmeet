'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Download, Calendar } from 'lucide-react';
import ServiceBookingDetailModal from '@/components/service/ServiceBookingDetailModal';

const STATUS_STYLE = {
  enquiry:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function VendorBookings() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, enquiry: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success) { setBookings(d.bookings); setStats(d.stats); }
    }).catch(() => toast.error('Failed to load'))
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <VendorLayout title="Service Bookings" subtitle="Loading...">
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </VendorLayout>
  );

  return (
    <>
    <VendorLayout title="Service Bookings" subtitle={`${stats.total} total`}>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',     value: stats.total,    cls: 'bg-white border-gray-100' },
          { label: 'Enquiries', value: stats.enquiry,  cls: 'bg-yellow-50 border-yellow-200' },
          { label: 'Confirmed', value: stats.confirmed, cls: 'bg-green-50 border-green-200' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl border shadow-sm p-4 ${cls}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h3>
          <p className="text-sm text-gray-400">Customer enquiries will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{b.bookingNumber || b.quotationNumber}</code>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    {b.downloadedAt && <span className="flex items-center gap-1 text-xs text-green-600"><Download className="w-3 h-3" />Downloaded</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{b.customerInfo?.name}</p>
                  <p className="text-xs text-gray-400">{b.customerInfo?.email} · {b.customerInfo?.phone}</p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-gray-400">Service</p>
                    <p className="text-xs font-semibold text-gray-700">{b.serviceSnapshot?.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Event Date</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-sm font-bold text-primary-600">₹{b.pricing?.total?.toLocaleString() || '—'}</p>
                  </div>
                  <button onClick={() => setExpanded(expanded === b._id ? null : b._id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {expanded === b._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => setSelectedBooking(b)}
                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    View
                  </button>
                </div>
              </div>

              {expanded === b._id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-gray-500 uppercase mb-2">Customer Details</p>
                      <p className="font-semibold">{b.customerInfo?.name}</p>
                      {b.customerInfo?.company && <p className="text-gray-500">{b.customerInfo.company}</p>}
                      <p className="text-gray-500">{b.customerInfo?.email}</p>
                      <p className="text-gray-500">{b.customerInfo?.phone}</p>
                      {b.customerInfo?.eventName && <p className="text-gray-500 mt-1">Event: {b.customerInfo.eventName}</p>}
                      {b.customerInfo?.notes && <p className="text-gray-400 mt-1 italic">{b.customerInfo.notes}</p>}
                    </div>
                    <div>
                      <p className="font-bold text-gray-500 uppercase mb-2">Selected Services</p>
                      {(b.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span>{item.name} × {item.quantity} {item.unit}</span>
                          <span className="font-semibold">₹{item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                      {b.pricing && (
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-0.5">
                          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{b.pricing.subtotal?.toLocaleString()}</span></div>
                          <div className="flex justify-between text-gray-500"><span>GST</span><span>₹{((b.pricing.serviceCGST || 0) + (b.pricing.serviceSGST || 0)).toLocaleString()}</span></div>
                          {b.pricing.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{b.pricing.discount?.toLocaleString()}</span></div>}
                          <div className="flex justify-between font-bold text-primary-600 border-t border-gray-200 pt-1"><span>Total</span><span>₹{b.pricing.total?.toLocaleString()}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </VendorLayout>

    {selectedBooking && (
      <ServiceBookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        canChangeStatus={false}
      />
    )}
    </>
  );
}
