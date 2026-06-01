'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Download, Calendar } from 'lucide-react';
import ServiceBookingDetailModal from '@/components/service/ServiceBookingDetailModal';

const STATUS_STYLE = {
  enquiry:   'bg-yellow-100 text-yellow-700',
  pending:   'bg-orange-100 text-orange-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function VendorBookings() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, enquiry: 0, pending: 0, confirmed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = () => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success) { setBookings(d.bookings); setStats(d.stats); }
    }).catch(() => toast.error('Failed to load'))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleConfirmBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to confirm this service booking?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Booking confirmed successfully!');
        fetchBookings();
        if (selectedBooking?._id === bookingId && data.booking) {
          setSelectedBooking(data.booking);
        }
      } else {
        toast.error(data.message || 'Failed to confirm booking');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to mark this booking as completed?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Booking marked as completed successfully!');
        fetchBookings();
        if (selectedBooking?._id === bookingId && data.booking) {
          setSelectedBooking(data.booking);
        }
      } else {
        toast.error(data.message || 'Failed to complete booking');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt('Please enter a reason for cancelling/rejecting this booking:');
    if (reason === null) return;
    if (!reason.trim()) return toast.error('Cancellation reason is required');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.refundProcessed ? 'Booking cancelled and refund initiated!' : 'Booking cancelled successfully!');
        fetchBookings();
        if (selectedBooking?._id === bookingId && data.booking) {
          setSelectedBooking(data.booking);
        }
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    if (newStatus === 'confirmed') {
      await handleConfirmBooking(bookingId);
    } else if (newStatus === 'cancelled') {
      await handleCancelBooking(bookingId);
    } else if (newStatus === 'completed') {
      await handleCompleteBooking(bookingId);
    } else {
      toast.error('Invalid status change for vendor');
    }
  };

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
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',     value: stats.total,    cls: 'bg-white border-gray-100' },
          { label: 'Pending',   value: stats.pending || 0, cls: 'bg-orange-50 border-orange-200' },
          { label: 'Confirmed', value: stats.confirmed, cls: 'bg-green-50 border-green-200' },
          { label: 'Cancelled', value: stats.cancelled || 0, cls: 'bg-red-50 border-red-200' },
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
                    <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{b.bookingNumber || '—'}</code>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    {b.downloadedAt && <span className="flex items-center gap-1 text-xs text-green-600"><Download className="w-3 h-3" />Downloaded</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{b.customerInfo?.name}</p>
                  <p className="text-xs text-gray-400">{b.customerInfo?.email} · {b.customerInfo?.phone}</p>
                  {b.status === 'pending' && b.confirmationDeadline && (
                    <div className="text-[10px] text-orange-600 font-bold mt-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit">
                      Confirm by: {new Date(b.confirmationDeadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
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
                  {b.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleConfirmBooking(b._id)}
                        className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors">
                        Accept
                      </button>
                      <button onClick={() => handleCancelBooking(b._id)}
                        className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <button onClick={() => handleCompleteBooking(b._id)}
                      className="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors">
                      Complete
                    </button>
                  )}
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
        onStatusChange={handleStatusChange}
        canChangeStatus={true}
      />
    )}
    </>
  );
}
