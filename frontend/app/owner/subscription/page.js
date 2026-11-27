'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import {
  Check,
  Crown,
  Sparkles,
  Zap,
  Building2,
  Calendar,
  Camera,
  Film,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calculator,
  Percent,
  Sliders
} from 'lucide-react';

export default function OwnerSubscriptionPage() {
  const { token, user } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [customVenuesCount, setCustomVenuesCount] = useState(8); // min 8 venues for custom plan

  const fetchStatusAndPlans = async () => {
    try {
      setLoading(true);
      const [resPlans, resStatus] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/plans`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/my-status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const dataPlans = await resPlans.json();
      const dataStatus = await resStatus.json();

      if (dataPlans.success) setPlans(dataPlans.plans);
      if (dataStatus.success) setSubStatus(dataStatus);
    } catch (err) {
      console.error('Fetch subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStatusAndPlans();
  }, [token]);

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planKey) => {
    try {
      setUpgrading(planKey);
      setFeedback({ error: '', success: '' });

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setFeedback({ error: 'Failed to load Razorpay checkout. Please check internet connection.', success: '' });
        setUpgrading(null);
        return;
      }

      // 1. Create order on backend
      const resOrder = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planKey,
          billingCycle,
          venueCount: planKey === 'custom' ? customVenuesCount : undefined
        })
      });
      const dataOrder = await resOrder.json();

      if (!dataOrder.success || !dataOrder.order) {
        setFeedback({ error: dataOrder.message || 'Failed to create subscription order.', success: '' });
        setUpgrading(null);
        return;
      }

      // 2. Open Razorpay Modal
      const options = {
        key: dataOrder.key,
        amount: dataOrder.order.amount,
        currency: 'INR',
        name: 'RentalMeet',
        description: `Upgrade to ${dataOrder.planDetails.planName} (${billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
        image: '/logo.png',
        order_id: dataOrder.order.id,
        handler: async function (response) {
          try {
            const resVerify = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey,
                billingCycle,
                venueCount: planKey === 'custom' ? customVenuesCount : undefined
              })
            });

            const dataVerify = await resVerify.json();
            if (dataVerify.success) {
              setFeedback({ success: 'Subscription activated successfully! Welcome to your new plan.', error: '' });
              fetchStatusAndPlans();
            } else {
              setFeedback({ error: dataVerify.message || 'Payment verification failed.', success: '' });
            }
          } catch (err) {
            console.error('Payment verify error:', err);
            setFeedback({ error: 'Failed to verify payment with server.', success: '' });
          } finally {
            setUpgrading(null);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#e11d48'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setFeedback({ error: resp.error.description || 'Payment failed or cancelled.', success: '' });
        setUpgrading(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Upgrade process error:', err);
      setFeedback({ error: 'An unexpected error occurred during checkout.', success: '' });
      setUpgrading(null);
    }
  };

  const currentPlanId = subStatus?.planId || 'starter';

  // Custom Plan Calculator values
  const customMonthlyTotal = customVenuesCount * 90;
  const customAnnualTotal = customVenuesCount * 90 * 12;

  return (
    <OwnerLayout
      title="Subscription Plans"
      subtitle="Choose the perfect plan for your venues · Unlock high-resolution media, unlimited bookings, and priority exposure"
    >
      <div className="space-y-8 pb-16">
        {/* Feedback Alert */}
        {feedback.error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}
        {feedback.success && (
          <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.success}</span>
          </div>
        )}

        {/* Current Plan Status Card */}
        {subStatus && (
          <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/40 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-primary-400" />
                  Current Active Plan
                </span>
                <span className="text-xs text-slate-400 font-medium capitalize">
                  {subStatus.status || 'Active'}
                </span>
              </div>
              <h2 className="text-2xl font-black">{subStatus.planName || 'Free Forever Starter Plan'}</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {subStatus.daysRemaining !== null && subStatus.daysRemaining !== undefined
                  ? `${subStatus.daysRemaining} days remaining in current billing cycle. Auto-renews or reverts to Free Forever on expiry.`
                  : 'Free Forever Starter Plan active. Upgrade anytime to unlock unlimited bookings and priority listings.'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-bold">Venues Listed</span>
                <span className="text-lg font-black">{subStatus.venuesCount || 0} / {subStatus.limits?.maxVenues === Infinity ? 'Unlimited' : subStatus.limits?.maxVenues || 1}</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-bold">Bookings Quota</span>
                <span className="text-lg font-black">{subStatus.monthlyBookingsCount || 0} / {subStatus.limits?.monthlyOnlineBookings === Infinity ? 'Unlimited' : subStatus.limits?.monthlyOnlineBookings || 3}</span>
              </div>
            </div>
          </div>
        )}

        {/* Monthly vs Annual Toggle */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full uppercase">
                Save 50%
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {billingCycle === 'annual' ? '🎉 Annual discount applied to all premium plans' : 'Pay month-to-month with instant cancellation anytime'}
          </p>
        </div>

        {/* Dynamic Plans Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[520px] rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))
          ) : (
            plans.map((p) => {
              const isCurrent = currentPlanId === p.planId || currentPlanId === p.id;
              const isCustom = p.planId === 'custom' || p.id === 'custom';
              const isStarter = p.planId === 'starter' || p.id === 'starter';
              const planKey = p.planId || p.id;

              const monthlyPrice = p.price ?? 0;
              const annualPrice = p.annualPrice ?? p.price ?? 0;
              const currentPrice = billingCycle === 'annual' ? annualPrice : monthlyPrice;

              const regularMonthly = p.regularMonthlyPrice ?? 0;
              const regularAnnual = p.regularAnnualPrice ?? 0;
              const regularPrice = billingCycle === 'annual' ? regularAnnual : regularMonthly;

              const customRate = p.perVenueMonthlyPrice ?? 90;
              const customMin = p.minVenues ?? 8;
              const effectiveVenues = Math.max(customMin, customVenuesCount);
              const customCalcTotal = billingCycle === 'annual'
                ? effectiveVenues * customRate * 12
                : effectiveVenues * customRate;

              return (
                <div
                  key={planKey}
                  className={`rounded-3xl p-6 bg-white dark:bg-slate-900 border flex flex-col justify-between shadow-sm relative transition-all ${
                    p.isHighlighted
                      ? 'border-2 border-primary-500 shadow-xl ring-2 ring-primary-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Badge */}
                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {p.badge || p.name}
                    </span>

                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">{p.name}</h3>
                      {p.subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">{p.subtitle}</p>
                      )}
                    </div>

                    {/* Price display */}
                    {isCustom ? (
                      <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1">
                            <Calculator className="w-3.5 h-3.5 text-amber-600" />
                            Calculator Deploy
                          </span>
                          <span className="font-black text-amber-800 dark:text-amber-300">₹{customRate} / venue / mo</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                            <span>Number of Venues:</span>
                            <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded font-black text-amber-700">
                              {effectiveVenues}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={customMin}
                            max="50"
                            step="1"
                            value={effectiveVenues}
                            onChange={(e) => setCustomVenuesCount(parseInt(e.target.value) || customMin)}
                            className="w-full accent-amber-600 cursor-pointer h-2 bg-amber-200 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Min: {customMin} Venues</span>
                            <span>Max: 50+</span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-amber-200 dark:border-amber-800/60 flex items-baseline justify-between">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {billingCycle === 'annual' ? 'Total Annual:' : 'Total Monthly:'}
                          </span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            ₹{customCalcTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ) : isStarter ? (
                      <div className="py-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">₹0</span>
                          <span className="text-xs text-slate-500">/ month</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Free forever, no credit card required</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            ₹{currentPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500">
                            /{billingCycle === 'annual' ? 'year' : 'month'}
                          </span>
                        </div>
                        {regularPrice > currentPrice && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 line-through">
                              ₹{regularPrice.toLocaleString('en-IN')}/{billingCycle === 'annual' ? 'yr' : 'mo'}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                              Offer Price
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Limits breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Venue listings</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isCustom ? `${effectiveVenues} Venues` : (p.limits?.maxVenues >= 99999 ? 'Unlimited' : `Up to ${p.limits?.maxVenues || 1}`)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Photographs</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.limits?.photosPerVenue || 5} per venue</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Venue videos</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.limits?.videosPerVenue || 3} per venue</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Online bookings</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {p.limits?.monthlyOnlineBookings >= 99999 ? 'Unlimited' : `${p.limits?.monthlyOnlineBookings || 3} / month`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Offline bookings</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {p.limits?.monthlyOfflineBookings >= 99999 ? 'Unlimited' : `${p.limits?.monthlyOfflineBookings || 3} / month`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">CRM &amp; Dashboard</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.limits?.crm || 'Basic'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Search visibility</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.limits?.searchVisibility || 'Standard'}</span>
                      </div>
                    </div>

                    {/* Features list */}
                    {(p.features && p.features.length > 0) && (
                      <div className="pt-2 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                        <p className="font-bold text-slate-700 dark:text-slate-300">Included Services &amp; Features:</p>
                        {p.features.map((feat, fIdx) => (
                          <p key={fIdx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-default"
                      >
                        ✓ Currently Active
                      </button>
                    ) : isStarter ? (
                      <button
                        disabled
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-default"
                      >
                        Free Forever
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(planKey)}
                        disabled={upgrading === planKey}
                        className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                          isCustom
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : p.isHighlighted
                            ? 'bg-primary-600 hover:bg-primary-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {upgrading === planKey ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Upgrade to {p.name}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Operating Rules */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Subscription Operating Rules &amp; Data Safeguards
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">Booking Count Policy</p>
              <p className="leading-relaxed">
                Only accepted and confirmed bookings count against Starter’s 3/month limit. Cancelled and rejected requests never consume quota.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">Zero Data Deletion on Expiry</p>
              <p className="leading-relaxed">
                On expiry, paid limits pause but no confirmed booking, customer record, or venue detail is ever deleted.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">Instant Plan Activation</p>
              <p className="leading-relaxed">
                Upgrading instantly activates your venue quota, unlimited bookings, and priority placement in search results.
              </p>
            </div>
          </div>
        </div>

      </div>
    </OwnerLayout>
  );
}
