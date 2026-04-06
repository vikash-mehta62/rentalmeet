'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import {
  CreditCard, CheckCircle2, ArrowLeft, Building2,
  Calendar, Clock, IndianRupee, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayRemainingPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    loadRazorpay();
    fetchBooking();
  }, [token, bookingId]);

  const loadRazorpay = () => {
    if (window.Razorpay) return;
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(s);
  };

  const fetchBooking = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBooking(data.booking);
      else { toast.error('Booking not found'); router.push('/customer/bookings'); }
    } catch (e) {
      toast.error('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  // Calculate balance due from ledger transactions
  const calcBalance = (b) => {
    if (!b) return 0;
    const txns = b.paymentLedger?.transactions || [];
    const totalPaid = txns
      .filter(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const totalRefunded = txns
      .filter(t => ['refund', 'manual_refund'].includes(t.type) && t.status === 'completed')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const netPaid = totalPaid - totalRefunded;
    const balance = (b.amount || 0) - netPaid;
    return balance > 0 ? balance : 0;
  };

  const amountDue = calcBalance(booking);

  const handlePay = async () => {
    if (!amountDue || amountDue <= 0) return toast.error('No pending amount');
    if (!window.Razorpay) return toast.error('Payment gateway not loaded. Please refresh.');
    setPaying(true);

    try {
      // Create order — use /api/payment (singular, matches server.js)
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amountDue, bookingId: booking._id })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        toast.error(orderData.message || 'Failed to create order');
        setPaying(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: booking.venue?.businessName || 'Venue Booking',
        description: `Remaining payment — #${booking.bookingNumber}`,
        order_id: orderData.order.id,
        prefill: {
          name: booking.customerDetails?.name || user?.name || '',
          email: booking.customerDetails?.email || user?.email || '',
          contact: booking.customerDetails?.phone || user?.phone || ''
        },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking._id,
                paidAmount: amountDue
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setBooking(verifyData.booking);
              setPaid(true);
              toast.success('Payment successful!');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Verification error');
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
      setPaying(false);
    }
  };

  if (loading) return (
    <CustomerLayout activePage="bookings">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </CustomerLayout>
  );

  if (!booking) return null;

  const newBalance = calcBalance(booking);

  return (
    <CustomerLayout activePage="bookings">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Back */}
        <button onClick={() => router.push('/customer/bookings')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>

        {/* Success State */}
        {paid && newBalance === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-6">Your booking is now fully paid and settled.</p>
            <button onClick={() => router.push('/customer/bookings')} className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-colors">
              View My Bookings
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Booking Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                {booking.venue?.images?.[0]?.url ? (
                  <img src={booking.venue.images[0].url} alt="" className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-gray-900">{booking.venue?.businessName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">#{booking.bookingNumber}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.startTime} – {booking.endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary-500" /> Payment Summary
              </h3>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Total</span>
                  <span className="font-semibold">₹{booking.amount?.toLocaleString()}</span>
                </div>
                {(() => {
                  const txns = booking.paymentLedger?.transactions || [];
                  const payments = txns.filter(t => ['payment','manual_payment'].includes(t.type) && t.status === 'completed');
                  return payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-green-600">
                      <span>
                        {p.type === 'payment' ? 'Online Payment' : 'Manual Payment'}
                        <span className="text-gray-400 ml-1 text-[10px]">
                          {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </span>
                      <span className="font-semibold">- ₹{p.amount?.toLocaleString()}</span>
                    </div>
                  ));
                })()}
                <div className="flex justify-between border-t-2 border-dashed border-gray-200 pt-2 font-black text-base">
                  <span className="text-red-600">Remaining Due</span>
                  <span className="text-red-600">₹{newBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Alert */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2 mb-5 text-xs text-orange-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>This amount is due after your booking was modified. Please pay to keep your booking confirmed.</p>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePay}
                disabled={paying || newBalance <= 0}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-black text-lg shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-3"
              >
                <CreditCard className="w-5 h-5" />
                {paying ? 'Opening Payment...' : `Pay ₹${newBalance.toLocaleString()}`}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">Secured by Razorpay · UPI · Cards · Net Banking</p>
            </div>

            {/* Transaction History */}
            {(booking.paymentLedger?.transactions?.length > 0 || booking.paymentLedger?.adjustments?.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Transaction History</h3>
                <div className="space-y-2">
                  {(booking.paymentLedger?.adjustments || []).map((adj, i) => (
                    <div key={`adj-${i}`} className="flex items-center gap-3 text-xs p-2 bg-orange-50 rounded-lg">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${adj.difference > 0 ? 'bg-orange-200 text-orange-700' : 'bg-blue-200 text-blue-700'}`}>
                        {adj.difference > 0 ? '▲' : '▼'}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700">Booking Modified</p>
                        <p className="text-gray-400">{new Date(adj.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <p className={adj.difference > 0 ? 'text-orange-600 font-bold' : 'text-blue-600 font-bold'}>
                        {adj.difference > 0 ? '+' : ''}₹{adj.difference?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(booking.paymentLedger?.transactions || []).filter(t => t.type !== 'adjustment').map((txn, i) => (
                    <div key={`txn-${i}`} className={`flex items-center gap-3 text-xs p-2 rounded-lg ${['payment','manual_payment'].includes(txn.type) ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${['payment','manual_payment'].includes(txn.type) ? 'bg-green-200' : 'bg-red-200'}`}>
                        {['payment','manual_payment'].includes(txn.type)
                          ? <CheckCircle2 className="w-3 h-3 text-green-700" />
                          : <AlertCircle className="w-3 h-3 text-red-700" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700">
                          {txn.type === 'payment' ? 'Online Payment' : txn.type === 'manual_payment' ? 'Manual Payment' : 'Refund'}
                        </p>
                        <p className="text-gray-400">{new Date(txn.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <p className={`font-bold ${['payment','manual_payment'].includes(txn.type) ? 'text-green-600' : 'text-red-600'}`}>
                        {['payment','manual_payment'].includes(txn.type) ? '+' : '-'}₹{txn.amount?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
