'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * RetryRefundButton — shown when refundStatus === 'failed'
 * role: 'admin' | 'owner'
 * onSuccess(updatedBooking) — callback after successful retry
 */
export default function RetryRefundButton({ booking, token, role = 'admin', onSuccess }) {
  const [loading, setLoading] = useState(false);

  if (!booking || booking.refundDetails?.refundStatus !== 'failed') return null;

  const refundAmount = booking.refundDetails?.refundAmount || booking.amount || 0;
  const hasRazorpayId = !!booking.paymentDetails?.razorpay_payment_id;

  const handleRetry = async () => {
    if (!confirm(`Retry Razorpay refund of ₹${refundAmount.toLocaleString('en-IN')} to customer's original payment source?`)) return;
    setLoading(true);
    try {
      const endpoint = role === 'admin'
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${booking._id}/retry-refund`
        : `${process.env.NEXT_PUBLIC_API_URL}/owner/bookings/${booking._id}/retry-refund`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Refund of ₹${refundAmount.toLocaleString('en-IN')} processed! ID: ${data.refundId}`);
        onSuccess?.(data.booking);
      } else {
        toast.error(data.message || 'Refund failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {hasRazorpayId ? (
        <button
          onClick={handleRetry}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Processing Refund...' : `Retry Razorpay Refund — ₹${refundAmount.toLocaleString('en-IN')}`}
        </button>
      ) : (
        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          ⚠️ No Razorpay payment ID found. Use "Record Manual Refund" via Payment History to process this refund.
        </p>
      )}
    </div>
  );
}
