'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Calendar, ChevronDown, ChevronUp, Download, CheckCircle2, Clock, XCircle } from 'lucide-react';
import ServiceBookingDetailModal from '@/components/service/ServiceBookingDetailModal';

const STATUS_STYLE = {
  enquiry:   { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,        label: 'Enquiry' },
  confirmed: { cls: 'bg-green-100 text-green-700',  icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-100 text-red-700',      icon: XCircle,      label: 'Cancelled' },
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

  useEffect(() => {
    if (!token || user?.role !== 'customer') { router.push('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/service-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success) setBookings(d.bookings);
      else toast.error('Failed to load');
    }).finally(() => setLoading(false));
  }, [token, user]);

  if (loading) return (
    <CustomerLayout activePage="service-bookings">
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </CustomerLayout>
  );

  return (
    <>
    <CustomerLayout activePage="service-bookings">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Service Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">{bookings.length} booking(s) found</p>
        </div>

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
            {bookings.map(b => {
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
                        <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{b.bookingNumber || b.quotationNumber}</code>
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
            })}
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
    </>
  );
}
