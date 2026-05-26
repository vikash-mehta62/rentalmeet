'use client';

import { useState } from 'react';
import {
  X, History, Plus, RefreshCw, CheckCircle, XCircle,
  User, Building2, Calendar, ArrowDownLeft,
  AlertTriangle, Banknote, Smartphone, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

const TXN_META = {
  payment:        { label: 'Online Payment (Razorpay)', color: 'green',  Icon: Smartphone,    sign: '+' },
  manual_payment: { label: 'Manual Payment',            color: 'green',  Icon: Banknote,      sign: '+' },
  refund:         { label: 'Refund',                    color: 'red',    Icon: ArrowDownLeft, sign: '-' },
  manual_refund:  { label: 'Manual Refund',             color: 'red',    Icon: ArrowDownLeft, sign: '-' },
};

const STATUS_CLS = {
  completed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  failed:    'bg-red-100 text-red-700',
};

const fmt = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

export default function PaymentHistoryModal({ booking, token, onClose, onUpdate }) {
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({ amount: '', txnId: '', note: '', method: 'cash' });
  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  const ledger = booking.paymentLedger || {};
  const rawTxns = ledger.transactions || [];
  const rawAdj  = ledger.adjustments  || [];

  const totalPaid = rawTxns
    .filter(t => ['payment','manual_payment'].includes(t.type) && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalRefunded = rawTxns
    .filter(t => ['refund','manual_refund'].includes(t.type) && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalDue = booking.amount || 0;
  const balance  = totalDue - (totalPaid - totalRefunded);

  // For active (non-cancelled) bookings, negative balance means overpaid due to modification
  // — not a refund due. Refund only applies after cancellation.
  const isCancelled = booking.status === 'cancelled';
  const isOverpaid = balance < 0 && !isCancelled;
  const isRefundDue = balance < 0 && isCancelled;

  const timeline = [
    ...rawTxns.map(t => ({ ...t, _kind: 'txn' })),
    ...rawAdj.map(a  => ({ ...a, _kind: 'adj', type: 'adjustment' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${booking._id}/ledger/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            amount: amt,
            txnId: form.txnId || `${form.method.toUpperCase()}-${Date.now()}`,
            note: form.note || `${form.method.toUpperCase()} ${action}`
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'payment' ? 'Payment recorded!' : 'Refund recorded!');
        setAction(null);
        setForm({ amount: '', txnId: '', note: '', method: 'cash' });
        onUpdate?.(data.booking);
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <History className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Payment History</h2>
              <p className="text-xs text-gray-500">#{booking.bookingNumber} · {booking.customer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Due',   val: totalDue,       cls: 'bg-gray-50 border-gray-200 text-gray-900' },
              { label: 'Total Paid',  val: totalPaid,      cls: 'bg-green-50 border-green-200 text-green-600' },
              { label: 'Refunded',    val: totalRefunded,  cls: 'bg-red-50 border-red-200 text-red-500' },
              {
                label: isRefundDue
                  ? 'Refund Due'
                  : isOverpaid
                  ? 'Overpaid'
                  : balance > 0
                  ? 'Balance Due'
                  : 'Settled',
                val: Math.abs(balance),
                cls: isRefundDue
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : isOverpaid
                  ? 'bg-orange-50 border-orange-200 text-orange-600'
                  : balance > 0
                  ? 'bg-orange-50 border-orange-200 text-orange-600'
                  : 'bg-green-50 border-green-200 text-green-600',
                override: balance === 0 ? '✓ Clear' : null
              }
            ].map(({ label, val, cls, override }) => (
              <div key={label} className={`rounded-xl p-3 text-center border ${cls}`}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-lg font-black ${cls.split(' ').find(c => c.startsWith('text-'))}`}>
                  {override ?? `₹${val.toLocaleString()}`}
                </p>
              </div>
            ))}
          </div>

          {/* Overpaid notice for active modified bookings */}
          {isOverpaid && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
              <p className="font-bold mb-1">ℹ️ Overpaid by ₹{Math.abs(balance).toLocaleString()} — Booking Active</p>
              <p className="text-orange-700">
                Customer modified the booking and reduced amenities. The extra ₹{Math.abs(balance).toLocaleString()} will be settled
                after the booking is completed. No refund is due while the booking is active.
              </p>
            </div>
          )}

          {/* Booking strip */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600 border border-gray-200">
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{booking.venue?.businessName}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
              {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : 'N/A'}
            </span>
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{booking.customer?.name}</span>
            <span className={`ml-auto px-2 py-0.5 rounded-full font-semibold capitalize ${
              booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
              booking.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>{booking.paymentStatus}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={() => setAction(action === 'payment' ? null : 'payment')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                action === 'payment'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}>
              <Plus className="w-4 h-4" /> Record Payment
            </button>
            {/* Only show Record Refund for cancelled bookings or when there's an actual refund to process */}
            {(isCancelled || totalRefunded > 0 || balance > 0) && (
              <button onClick={() => setAction(action === 'refund' ? null : 'refund')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  action === 'refund'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}>
                <RefreshCw className="w-4 h-4" /> Record Refund
              </button>
            )}
            {/* For active overpaid bookings, show manual refund option with warning */}
            {isOverpaid && (
              <button onClick={() => setAction(action === 'refund' ? null : 'refund')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  action === 'refund'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}>
                <RefreshCw className="w-4 h-4" /> Refund Overpaid Amount
              </button>
            )}
          </div>

          {/* Form */}
          {action && (
            <form onSubmit={handleSubmit}
              className={`rounded-xl border p-4 space-y-3 ${action === 'payment' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className="text-sm font-bold text-gray-800">
                {action === 'payment' ? '💵 Record Manual Payment' : '↩️ Record Refund'}
                {action === 'payment' && balance > 0 &&
                  <span className="ml-2 text-xs font-normal text-gray-500">Balance due: ₹{balance.toLocaleString()}</span>}
              </p>
              {/* Warning for active booking refund */}
              {action === 'refund' && isOverpaid && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                  ℹ️ Booking is active — only ledger entry will be recorded. Booking & payment status will NOT change.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹) *</label>
                  <input type="number" required min="1" value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder={action === 'payment' && balance > 0 ? String(balance) : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                  <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white">
                    {['cash','upi','neft','cheque','razorpay','other'].map(m =>
                      <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">UTR / Ref No.</label>
                  <input type="text" value={form.txnId}
                    onChange={e => setForm(p => ({ ...p, txnId: e.target.value }))}
                    placeholder="UTR / Cheque / Txn ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Note</label>
                  <input type="text" value={form.note}
                    onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="Optional note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={submitting}
                  className={`px-5 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-60 ${
                    action === 'payment' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}>
                  {submitting ? 'Saving...' : action === 'payment' ? 'Save Payment' : 'Save Refund'}
                </button>
                <button type="button" onClick={() => setAction(null)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Transaction Timeline ({timeline.length})
            </p>
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transactions recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.map((item, i) => {
                  if (item._kind === 'adj') {
                    return (
                      <div key={`adj-${i}`} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-orange-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">Booking Amount Modified</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ₹{item.oldAmount?.toLocaleString()} → ₹{item.newAmount?.toLocaleString()}
                            {item.reason ? ` · ${item.reason}` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmt(item.date)}</p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${item.difference > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                          {item.difference > 0 ? '+' : ''}₹{item.difference?.toLocaleString()}
                        </span>
                      </div>
                    );
                  }

                  const meta = TXN_META[item.type] || TXN_META.payment;
                  const { Icon } = meta;
                  const isCredit = ['payment','manual_payment'].includes(item.type);
                  return (
                    <div key={`txn-${i}`} className={`flex items-start gap-3 p-3 rounded-xl border ${
                      isCredit ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-green-200' : 'bg-red-200'
                      }`}>
                        <Icon className={`w-4 h-4 ${isCredit ? 'text-green-700' : 'text-red-700'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[item.status] || STATUS_CLS.completed}`}>
                            {item.status}
                          </span>
                        </div>
                        {item.txnId && <p className="text-xs font-mono text-gray-500 mt-0.5 truncate">{item.txnId}</p>}
                        {item.note && <p className="text-xs text-gray-600 mt-0.5">{item.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(item.date)}</p>
                      </div>
                      <span className={`text-base font-black flex-shrink-0 ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {meta.sign}₹{item.amount?.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
