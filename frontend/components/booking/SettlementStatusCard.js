'use client';

import { CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react';

const money = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const STATUS = {
  settled: {
    label: 'Settled',
    cls: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    cls: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  unsettled: {
    label: 'Unsettled',
    cls: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
  },
};

export default function SettlementStatusCard({ booking, title = 'Settlement Status', payoutLabel = 'Payout Amount', fallbackAmount = 0 }) {
  if (!booking) return null;

  const statusKey = booking.settlementStatus || 'unsettled';
  const status = STATUS[statusKey] || STATUS.unsettled;
  const Icon = status.icon;
  const details = booking.settlementDetails || {};
  const platformTotal = Number(booking.priceBreakdown?.platformFeeTotal) || 0;
  const maxPayoutFromPaidAmount = Math.max(0, (Number(booking.amount) || 0) - platformTotal);
  const fallbackPayout = booking.ownerEarnings ?? fallbackAmount;
  const payoutAmount = details.amount ?? Math.min(Number(fallbackPayout) || 0, maxPayoutFromPaidAmount || Number(fallbackPayout) || 0);
  const isEligible = booking.status === 'completed' && booking.paymentStatus === 'paid';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-3">
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-gray-500" /> {title}
          </p>
          {!isEligible && statusKey === 'unsettled' && (
            <p className="text-gray-500 dark:text-slate-400 mt-1">Eligible after booking is completed and payment is paid.</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold capitalize ${status.cls}`}>
          <Icon className="w-3.5 h-3.5" /> {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div>
          <p className="text-gray-500 dark:text-slate-400">{payoutLabel}</p>
          <p className="font-black text-gray-900 dark:text-slate-100 text-base mt-0.5">{money(payoutAmount)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-slate-400">Method</p>
          <p className="font-semibold text-gray-900 dark:text-slate-100 capitalize mt-0.5">{details.settlementMethod || 'automatic'}</p>
        </div>
        {details.transactionId && (
          <div className="sm:col-span-2">
            <p className="text-gray-500 dark:text-slate-400">Transaction Reference</p>
            <code className="inline-block max-w-full break-all font-mono bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded mt-1 text-gray-800 dark:text-slate-100">
              {details.transactionId}
            </code>
          </div>
        )}
        {details.settledAt && (
          <div>
            <p className="text-gray-500 dark:text-slate-400">Updated At</p>
            <p className="font-semibold text-gray-900 dark:text-slate-100 mt-0.5">{new Date(details.settledAt).toLocaleString('en-IN')}</p>
          </div>
        )}
        {details.remarks && (
          <div className="sm:col-span-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-3">
            <p className="text-gray-500 dark:text-slate-400 uppercase tracking-wide text-[10px] font-bold">Remarks</p>
            <p className="text-gray-700 dark:text-slate-300 mt-1 leading-relaxed">{details.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
}
