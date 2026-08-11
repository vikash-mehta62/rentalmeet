'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  IndianRupee,
  TrendingUp,
  Award,
  Zap,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  RefreshCw
} from 'lucide-react';

export default function AmbassadorEarningsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rewards'); // 'rewards' | 'payouts'

  // Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('upi'); // 'upi' | 'bank'
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchEarningsAndPayouts = async () => {
    setLoading(true);
    try {
      const [earnRes, payRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/earnings`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/payouts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const earnJson = await earnRes.json();
      const payJson = await payRes.json();

      if (earnJson.success) setData(earnJson.data);
      if (payJson.success) setPayouts(payJson.payouts || []);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEarningsAndPayouts();
  }, [token]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    const amt = Number(payoutAmount);
    if (!amt || amt < 100) {
      setModalError('Minimum withdrawal amount is ₹100');
      return;
    }
    if (amt > (data?.walletBalance || 0)) {
      setModalError('Requested amount exceeds current wallet balance');
      return;
    }

    if (payoutMethod === 'upi' && !upiId.trim()) {
      setModalError('Please enter a valid UPI ID');
      return;
    }

    if (payoutMethod === 'bank') {
      if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName) {
        setModalError('Please fill in all bank details');
        return;
      }
    }

    setSubmittingPayout(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amt,
          payoutMethod,
          upiId: payoutMethod === 'upi' ? upiId : undefined,
          bankDetails: payoutMethod === 'bank' ? bankDetails : undefined
        })
      });
      const json = await res.json();

      if (json.success) {
        setModalSuccess('Payout request submitted successfully!');
        setPayoutAmount('');
        setTimeout(() => {
          setShowPayoutModal(false);
          setModalSuccess('');
          fetchEarningsAndPayouts();
        }, 1500);
      } else {
        setModalError(json.message || 'Failed to submit withdrawal request');
      }
    } catch {
      setModalError('Something went wrong. Please try again.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const { walletBalance, breakdown, recentRewards } = data || {};

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Earnings &amp; <span className="text-primary-600">Wallet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View your listing rewards, 25% recurring booking shares, and withdrawal settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEarningsAndPayouts}
            className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" /> Request Payout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Available Wallet Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-xl relative overflow-hidden">
          <p className="text-xs font-bold text-green-100 uppercase tracking-wider">Available Balance</p>
          <p className="text-3xl sm:text-4xl font-black mt-2">
            ₹{(walletBalance || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-green-100 mt-4">Instant withdrawal to UPI or Bank</p>
        </div>

        {/* Listing Rewards */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-amber-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Listing Rewards</span>
            <Award className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{(breakdown?.listingRewards || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">Earned from approved venue listings</p>
        </div>

        {/* Challenge Bonuses */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Streak &amp; Challenges</span>
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{(breakdown?.challengeBonuses || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">Daily, weekly &amp; monthly streak bonuses</p>
        </div>

        {/* 25% Booking Share */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-purple-600 mb-2">
            <span className="text-xs font-bold text-slate-500">25% Booking Shares</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-purple-600">
            ₹{(breakdown?.bookingShare || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">12-Month recurring booking revenue</p>
        </div>
      </div>

      {/* Tabs: Reward Ledger vs Payout History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rewards'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Reward Credits Ledger
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'payouts'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Withdrawal Settlements ({payouts.length})
          </button>
        </div>

        {/* Tab 1: Reward Ledger */}
        {activeTab === 'rewards' && (
          <div className="overflow-x-auto">
            {recentRewards?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No reward transactions recorded yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentRewards?.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white capitalize">
                        {r.rewardType?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{r.description}</td>
                      <td className="py-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-right font-black text-green-600">+₹{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Payouts */}
        {activeTab === 'payouts' && (
          <div className="overflow-x-auto">
            {payouts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No withdrawal requests submitted yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Destination</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 uppercase font-bold text-slate-700 dark:text-slate-300">{p.payoutMethod}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {p.payoutMethod === 'upi' ? p.upiId : `${p.bankDetails?.bankName} (A/C: ••••${p.bankDetails?.accountNumber?.slice(-4)})`}
                      </td>
                      <td className="py-3">
                        {p.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid (UTR: {p.transactionReference || 'N/A'})
                          </span>
                        ) : p.status === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Processing
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-black text-slate-900 dark:text-white">₹{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Payout</h3>
                <p className="text-xs text-slate-500">Available: ₹{(walletBalance || 0).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl border border-green-200">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Withdrawal Amount (₹) *
                </label>
                <input
                  type="number"
                  placeholder="Min. ₹100"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('upi')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === 'upi' ? 'bg-primary-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === 'bank' ? 'bg-primary-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {payoutMethod === 'upi' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">UPI ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails((p) => ({ ...p, accountHolderName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none uppercase"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submittingPayout}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-lg active:scale-95 disabled:opacity-50"
              >
                {submittingPayout ? 'Submitting Request...' : 'Confirm Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
