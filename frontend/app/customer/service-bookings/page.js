'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Calendar, ChevronDown, ChevronUp, Download, CheckCircle2, Clock, XCircle } from 'lucide-react';
import ServiceBookingDetailModal from '@/components/service/ServiceBookingDetailModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const STATUS_STYLE = {
  enquiry:   { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,        label: 'Enquiry' },
  pending:   { cls: 'bg-orange-100 text-orange-700', icon: Clock,        label: 'Pending' },
  confirmed: { cls: 'bg-green-100 text-green-700',  icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-100 text-red-700',      icon: XCircle,      label: 'Cancelled' },
  completed: { cls: 'bg-blue-100 text-blue-700',    icon: CheckCircle2, label: 'Completed' },
};

const PAY_STYLE = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed:  'bg-red-100 text-red-700',
};

export default function CustomerServiceBookings() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filters State
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const getFilteredBookings = () => {
    return bookings.filter(b => {
      // 1. Status Filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // 2. Date Filter
      if (!b.eventDate) return dateFilter === 'all';
      const bDate = new Date(b.eventDate);
      bDate.setHours(0, 0, 0, 0);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        return bDate.getTime() === now.getTime();
      }

      if (dateFilter === 'this-week') {
        const day = now.getDay();
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diffToMonday));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        startOfWeek.setHours(0, 0, 0, 0);
        return bDate >= startOfWeek && bDate <= endOfWeek;
      }

      if (dateFilter === 'this-month') {
        return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
      }

      if (dateFilter === 'custom') {
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (bDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (bDate > eDate) return false;
        }
        return true;
      }

      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  // Cancellation States
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelCustomReason, setCancelCustomReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const REASONS = [
    'Change of plans',
    'Found a better alternative',
    'Budget constraints',
    'Event details changed',
    'Other',
  ];

  const fetchBookings = () => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/service-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success) setBookings(d.bookings);
      else toast.error('Failed to load');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token || user?.role !== 'customer') { router.push('/login'); return; }
    fetchBookings();
  }, [token, user]);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    const finalReason = cancelReason === 'Other' ? cancelCustomReason.trim() : cancelReason;
    if (!finalReason) return toast.error('Please select a reason');

    setCancelSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings/${cancellingBooking._id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: finalReason })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.refundProcessed ? 'Booking cancelled — refund initiated' : 'Booking cancelled');
        if (!data.refundProcessed && data.refundEligible && data.refundFailReason) {
          toast.error(`Refund failed: ${data.refundFailReason}`, { duration: 6000 });
        }
        setCancellingBooking(null);
        setCancelReason('');
        setCancelCustomReason('');
        fetchBookings();
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Something went wrong');
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (loading) return (
    <CustomerLayout activePage="service-bookings" title="Service Bookings" subtitle="Loading bookings...">
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </CustomerLayout>
  );

  return (
    <>
    <CustomerLayout 
      activePage="service-bookings" 
      title="Service Bookings" 
      subtitle={bookings.length > 0 ? `${filteredBookings.length} booking(s) found (out of ${bookings.length})` : '0 bookings found'}
    >
      <div className="w-full">

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Briefcase className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No service bookings yet</h3>
            <p className="text-sm text-gray-400 mb-5">Browse premium services and make your first booking</p>
            <button onClick={() => router.push('/other-services')}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors">
              Browse Services
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-end gap-4">
              {/* Status Filter */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary-500 w-36 font-semibold text-gray-700 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="enquiry">Enquiry</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event Period</span>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary-500 w-40 font-semibold text-gray-700 transition-all"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Datepicker fields */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-left duration-250">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From</span>
                    <DatePicker
                      selected={startDate}
                      onChange={setStartDate}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      placeholderText="DD/MM/YYYY"
                      dateFormat="dd/MM/yyyy"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary-500 w-32 font-semibold text-gray-700"
                    />
                  </div>
                  <span className="text-gray-400 font-bold self-center mt-4">—</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To</span>
                    <DatePicker
                      selected={endDate}
                      onChange={setEndDate}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      placeholderText="DD/MM/YYYY"
                      dateFormat="dd/MM/yyyy"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary-500 w-32 font-semibold text-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-600 mb-1">No matching bookings</h3>
                <p className="text-xs text-gray-400 mb-4">Try clearing or changing your filters</p>
                <button
                  onClick={() => { setStatusFilter('all'); setDateFilter('all'); setStartDate(null); setEndDate(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredBookings.map(b => {
                const st = STATUS_STYLE[b.status] || STATUS_STYLE.enquiry;
                const Icon = st.icon;
                return (
                  <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start gap-4 p-5">
                      {/* Service image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {b.service?.featuredImage
                          ? <img src={b.service.featuredImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Briefcase className="w-6 h-6 text-gray-300" /></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-bold text-gray-900">{b.serviceSnapshot?.title || b.service?.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{b.serviceSnapshot?.category}</p>
                            {(b.serviceSnapshot?.city || b.serviceSnapshot?.state) && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {[b.serviceSnapshot?.city, b.serviceSnapshot?.state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                              <Icon className="w-3 h-3" />{st.label}
                            </span>
                            {b.paymentStatus && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PAY_STYLE[b.paymentStatus] || PAY_STYLE.pending}`}>
                                {b.paymentStatus}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{b.bookingNumber || '—'}</code>
                          {b.eventDate && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          <span className="text-sm font-bold text-primary-600">
                            ₹{b.pricing?.total?.toLocaleString() || '—'}
                          </span>
                          {b.downloadedAt && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Download className="w-3 h-3" />Quotation Downloaded
                            </span>
                          )}
                        </div>
                      </div>

                      <button onClick={() => setExpanded(expanded === b._id ? null : b._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                        {expanded === b._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button onClick={() => setCancellingBooking(b)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0">
                          Cancel
                        </button>
                      )}
                      <button onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0">
                        View Details
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expanded === b._id && (
                      <div className="border-t border-gray-100 p-5 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                          {/* Vendor */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Service Provider</p>
                            <p className="font-semibold text-gray-800">{b.vendor?.companyName || b.vendor?.name || b.serviceSnapshot?.companyName || '—'}</p>
                            <p className="text-xs text-gray-500">{[b.serviceSnapshot?.city, b.serviceSnapshot?.state].filter(Boolean).join(', ')}</p>
                          </div>

                          {/* Items */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Selected Services</p>
                            {(b.items || []).map((item, i) => (
                              <div key={i} className="flex justify-between text-xs py-0.5">
                                <span className="text-gray-700">{item.name} × {item.quantity} {item.unit}</span>
                                <span className="font-semibold">₹{item.amount?.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          {/* Price Breakdown */}
                          {b.pricing && (
                            <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-200">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Price Breakdown</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{b.pricing.subtotal?.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>CGST ({b.pricing.cgstPct}%) + SGST ({b.pricing.sgstPct}%)</span><span>₹{((b.pricing.serviceCGST || 0) + (b.pricing.serviceSGST || 0)).toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Platform Fee ({b.pricing.platformFeePct}%) + GST</span><span>₹{((b.pricing.platformFee || 0) + (b.pricing.platformFeeGST || 0)).toLocaleString()}</span></div>
                                {b.pricing.discount > 0 && (
                                  <div className="flex justify-between text-green-600 font-semibold">
                                    <span>Coupon Discount {b.coupon?.code ? `(${b.coupon.code})` : ''}</span>
                                    <span>- ₹{b.pricing.discount?.toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-gray-200 pt-2 mt-1">
                                  <span>Total Paid</span>
                                  <span className="text-primary-600">₹{b.pricing.total?.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </CustomerLayout>

    {selectedBooking && (
      <ServiceBookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        canChangeStatus={false}
      />
    )}

    {cancellingBooking && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCancellingBooking(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Service Booking</h3>
          <p className="text-xs text-gray-500 mb-4">Are you sure you want to cancel your booking for <strong>{cancellingBooking.serviceSnapshot?.title}</strong>?</p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 space-y-1">
            <p className="font-bold">Cancellation Policy:</p>
            <p>• Cancel 48 hours or more before event: 100% refund.</p>
            <p>• Cancel 24–48 hours before event: 50% refund.</p>
            <p>• Cancel less than 24 hours before event: No refund.</p>
          </div>

          <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Cancellation</label>
          <select
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 mb-3 bg-white outline-none"
          >
            <option value="">Select a reason</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {cancelReason === 'Other' && (
            <textarea
              value={cancelCustomReason}
              onChange={e => setCancelCustomReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 mb-4 outline-none resize-none"
            />
          )}

          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => setCancellingBooking(null)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={cancelSubmitting || !cancelReason}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
