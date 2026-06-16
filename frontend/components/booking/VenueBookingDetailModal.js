'use client';

import { useRef } from 'react';
import {
  X, CheckCircle2, Clock, XCircle,
  CreditCard, Calendar, MapPin
} from 'lucide-react';
import InvoiceDownload from '@/components/booking/InvoiceDownload';
import SettlementStatusCard from '@/components/booking/SettlementStatusCard';
import { VenueAmenitiesDetails, VenueBookingPartyCards, VenueInvoiceBreakdownCards, getVenueBookingBreakdown } from '@/components/booking/VenueBookingSummaryCards';

const STATUS_STYLE = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,        label: 'Pending' },
  confirmed: { cls: 'bg-green-100 text-green-700',  icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-100 text-red-700',      icon: XCircle,      label: 'Cancelled' },
  completed: { cls: 'bg-blue-100 text-blue-700',    icon: CheckCircle2, label: 'Completed' },
};
const PAY_STYLE = {
  paid:     'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  failed:   'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
};

export default function VenueBookingDetailModal({ booking: b, onClose }) {
  const printRef = useRef(null);
  if (!b) return null;

  const bNum = b.bookingNumber || `#${b._id?.slice(-8).toUpperCase()}`;
  const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
  const Icon = st.icon;

  const breakdown = getVenueBookingBreakdown(b);
  const total = breakdown.grandTotal;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-primary-50 to-orange-50 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{b.venue?.businessName || 'Venue Booking'}</h2>
            <code className="text-xs font-mono text-primary-600 bg-white px-2 py-0.5 rounded border border-primary-200 mt-0.5 inline-block">{bNum}</code>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5" ref={printRef}>

          {/* Status + Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </p>
              <p className="font-bold text-gray-900 text-sm">{b.venue?.location?.city || '—'}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Booking Date & Time
              </p>
              <p className="font-bold text-gray-900 text-sm">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
              <p className="text-xs text-gray-600">{b.startTime} - {b.endTime}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Booked On
              </p>
              <p className="font-bold text-gray-900 text-sm">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs text-gray-500 mb-1">Amount</p>
              <p className="font-bold text-green-700 text-lg">₹{total.toLocaleString()}</p>
            </div>
          </div>

          {/* Status badges */}
          {b.status === 'cancelled' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">Booking is cancelled</p>
                {b.cancellationReason && <p className="text-xs text-red-700 mt-0.5">{b.cancellationReason}</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${st.cls}`}>
              <Icon className="w-3.5 h-3.5" />{st.label}
            </span>
            {b.paymentStatus && (
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${PAY_STYLE[b.paymentStatus] || PAY_STYLE.pending}`}>
                <CreditCard className="w-3 h-3 inline mr-1" />{b.paymentStatus}
              </span>
            )}
          </div>

          <VenueBookingPartyCards booking={b} />

          {/* Cancellation & Refund Details */}
          {b.status === 'cancelled' && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-xs">
              <p className="font-bold text-red-800 mb-2 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" /> Cancellation & Refund Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 font-medium">Cancelled By</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {b.cancelledByRole || 'system'} 
                    {b.cancellationType ? ` (${b.cancellationType})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Cancellation Reason</p>
                  <p className="font-semibold text-gray-900">
                    {b.cancellationReason || 'No reason provided'}
                  </p>
                </div>
                {b.paymentStatus === 'refunded' || b.refundDetails?.refundStatus ? (
                  <>
                    <div>
                      <p className="text-gray-500 font-medium">Refund Status</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize mt-0.5 ${
                        b.refundDetails?.refundStatus === 'processed' || b.paymentStatus === 'refunded'
                          ? 'bg-purple-100 text-purple-700'
                          : b.refundDetails?.refundStatus === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {b.refundDetails?.refundStatus || (b.paymentStatus === 'refunded' ? 'processed' : 'pending')}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Refund Amount</p>
                      <p className="font-semibold text-gray-900">
                        ₹{(b.refundDetails?.refundAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    {b.refundDetails?.refundId && (
                      <div>
                        <p className="text-gray-500 font-medium">Refund ID</p>
                        <code className="font-mono text-xs bg-white border px-1 rounded">
                          {b.refundDetails.refundId}
                        </code>
                      </div>
                    )}
                    {b.refundDetails?.refundedAt && (
                      <div>
                        <p className="text-gray-500 font-medium">Refunded At</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(b.refundDetails.refundedAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 italic">No refund processed (Booking was unpaid or pending at cancellation)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <VenueAmenitiesDetails booking={b} />

          <VenueInvoiceBreakdownCards booking={b} />

          <SettlementStatusCard
            booking={b}
            title="Owner Settlement"
            payoutLabel="Owner Payout"
            fallbackAmount={Math.max(0, breakdown.venueTotal - breakdown.discount)}
          />

          {/* Invoice Download */}
          {b.status === 'completed' && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-600">Download Invoice</p>
              <InvoiceDownload booking={b} userRole="admin" />
            </div>
          )}

          {/* Payment Details */}
          {b.paymentDetails?.razorpay_payment_id && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-xs">
              <p className="font-bold text-green-800 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Payment Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p className="text-gray-600">Payment ID: <code className="font-mono bg-white px-1 rounded">{b.paymentDetails.razorpay_payment_id}</code></p>
                <p className="text-gray-600">Order ID: <code className="font-mono bg-white px-1 rounded">{b.paymentDetails.razorpay_order_id}</code></p>
                {b.paymentDetails.paidAt && <p className="text-gray-600">Paid At: <strong>{new Date(b.paymentDetails.paidAt).toLocaleString('en-IN')}</strong></p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
