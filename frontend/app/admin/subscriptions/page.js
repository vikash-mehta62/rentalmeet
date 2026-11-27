'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Crown,
  Sparkles,
  Zap,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  IndianRupee,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sliders,
  RotateCcw,
  Tag,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'subscribers'

  // Plans Management State
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [planSaving, setPlanSaving] = useState(false);

  // Subscribers State
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [filterPlan, setFilterPlan] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Manual Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    ownerId: '',
    plan: 'pro',
    durationDays: 30
  });
  const [assigning, setAssigning] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Fetch Dynamic Subscription Plans
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subscription-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  // Fetch Subscribers & Stats
  const fetchSubscriptions = async () => {
    try {
      setSubscribersLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/subscriptions?plan=${filterPlan}&page=${page}&limit=20`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlans();
      fetchSubscriptions();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'subscribers') {
      fetchSubscriptions();
    }
  }, [token, filterPlan, page, activeTab]);

  // Open Plan Edit Modal
  const handleEditPlan = (plan) => {
    setSelectedPlan({
      ...plan,
      limits: { ...plan.limits },
      features: [...(plan.features || [])]
    });
    setNewFeatureText('');
    setShowPlanModal(true);
  };

  // Open Create Plan Modal
  const handleCreateNewPlan = () => {
    setSelectedPlan({
      planId: `custom-tier-${Date.now().toString().slice(-4)}`,
      name: 'New Custom Tier',
      badge: 'Special',
      subtitle: 'Custom plan for venue partners',
      description: 'Exclusive benefits and customized limits',
      regularMonthlyPrice: 599,
      price: 399,
      offerPrice: 399,
      regularAnnualPrice: 5999,
      annualPrice: 3999,
      annualOfferPrice: 3999,
      perVenueMonthlyPrice: 90,
      minVenues: 8,
      durationDays: 30,
      billingCycle: 'monthly',
      limits: {
        maxVenues: 3,
        photosPerVenue: 20,
        videosPerVenue: 10,
        monthlyOnlineBookings: 999999,
        monthlyOfflineBookings: 999999,
        crm: 'Advanced',
        dashboard: 'Advanced',
        searchVisibility: 'Priority'
      },
      features: [
        'Up to 3 Venue listings',
        '20 Photographs per venue',
        '10 Venue videos per venue',
        'Unlimited Online bookings',
        'Priority customer support'
      ],
      isActive: true,
      isHighlighted: false,
      displayOrder: plans.length + 1
    });
    setNewFeatureText('');
    setShowPlanModal(true);
  };

  // Save Plan Changes (Create or Update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedPlan.name) {
      alert('Plan Name is required');
      return;
    }

    try {
      setPlanSaving(true);
      setFeedback({ error: '', success: '' });

      const isNew = !selectedPlan._id;
      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/subscription-plans`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/subscription-plans/${selectedPlan._id}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedPlan)
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ success: data.message || 'Plan saved successfully', error: '' });
        setShowPlanModal(false);
        fetchPlans();
      } else {
        setFeedback({ error: data.message || 'Failed to save plan', success: '' });
      }
    } catch {
      setFeedback({ error: 'Error saving plan', success: '' });
    } finally {
      setPlanSaving(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (plan) => {
    if (plan.planId === 'starter') {
      alert('Cannot delete Free Forever Starter plan as it is the default fallback.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subscription-plans/${plan._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: data.message, error: '' });
        fetchPlans();
      } else {
        setFeedback({ error: data.message || 'Failed to delete plan', success: '' });
      }
    } catch {
      setFeedback({ error: 'Error deleting plan', success: '' });
    }
  };

  // Reset all plans to factory defaults from Excel
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all plans to factory defaults? Any custom price or description changes will be restored to the initial plans.')) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subscription-plans/reset-defaults`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: data.message, error: '' });
        fetchPlans();
      } else {
        setFeedback({ error: data.message || 'Failed to reset plans', success: '' });
      }
    } catch {
      setFeedback({ error: 'Error resetting plans', success: '' });
    }
  };

  // Add Feature item to list
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setSelectedPlan((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeatureText.trim()]
    }));
    setNewFeatureText('');
  };

  // Remove Feature item
  const handleRemoveFeature = (idx) => {
    setSelectedPlan((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  // Manual Assign Plan
  const handleAssignPlan = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setFeedback({ error: '', success: '' });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subscriptions/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: data.message, error: '' });
        setShowAssignModal(false);
        setAssignForm({ ownerId: '', plan: 'pro', durationDays: 30 });
        fetchSubscriptions();
      } else {
        setFeedback({ error: data.message || 'Failed to assign plan', success: '' });
      }
    } catch {
      setFeedback({ error: 'Error assigning plan', success: '' });
    } finally {
      setAssigning(false);
    }
  };

  const getPlanBadge = (planKey) => {
    switch (planKey) {
      case 'business':
        return (
          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black uppercase rounded-lg flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Business Premium
          </span>
        );
      case 'pro':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black uppercase rounded-lg flex items-center gap-1 w-fit">
            <Crown className="w-3 h-3 text-emerald-500" />
            Pro Plan
          </span>
        );
      case 'custom':
        return (
          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black uppercase rounded-lg flex items-center gap-1 w-fit">
            <Sliders className="w-3 h-3 text-amber-500" />
            Custom Plan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase rounded-lg w-fit">
            Starter (Free)
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Subscriptions & Pricing" subtitle="Configure dynamic subscription plans, pricing values, features & monitor active memberships">
      <div className="space-y-6 pb-12">

        {/* Feedback Alert */}
        {feedback.error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-3 text-red-700 dark:text-red-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{feedback.error}</span>
            </div>
            <button onClick={() => setFeedback({ ...feedback, error: '' })}><X className="w-4 h-4" /></button>
          </div>
        )}
        {feedback.success && (
          <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl flex items-center justify-between gap-3 text-green-700 dark:text-green-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{feedback.success}</span>
            </div>
            <button onClick={() => setFeedback({ ...feedback, success: '' })}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tab Navigation Switch */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'plans'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Dynamic Plans Manager ({plans.length})
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'subscribers'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Subscribers Directory &amp; Assign
            </button>
          </div>

          {activeTab === 'plans' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                title="Restore default plans from Excel configuration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
              <button
                onClick={handleCreateNewPlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                + Add New Plan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Assign Plan to Owner
            </button>
          )}
        </div>

        {/* TAB 1: DYNAMIC PLANS MANAGER */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Live Dynamic Plans Sync</p>
                <p className="text-amber-800 dark:text-amber-300/80 leading-relaxed">
                  Har plan ki <strong>Pricing Value (Monthly &amp; Annual)</strong>, <strong>Description &amp; Subtitle</strong>, aur <strong>Services/Features list</strong> yahan se change karne par turant Venue Owner ke subscription page aur checkout order me dynamically update ho jayegi!
                </p>
              </div>
            </div>

            {/* Plans Grid */}
            {plansLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {plans.map((p) => (
                  <div
                    key={p._id || p.planId}
                    className={`rounded-3xl p-6 bg-white dark:bg-slate-900 border flex flex-col justify-between shadow-sm relative transition-all ${
                      p.isHighlighted
                        ? 'border-2 border-primary-500 shadow-xl ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Highlight Badge */}
                    {p.badge && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow">
                        {p.badge}
                      </span>
                    )}

                    <div className="space-y-4">
                      {/* Status & Actions Header */}
                      <div className="flex items-center justify-between pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {p.isActive ? 'Active' : 'Disabled'}
                        </span>

                        <span className="text-[11px] font-mono text-slate-400">Order: #{p.displayOrder}</span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">{p.name}</h3>
                        {p.subtitle && (
                          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5">{p.subtitle}</p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                      </div>

                      {/* Pricing Values */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        {p.planId === 'custom' ? (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">₹{p.perVenueMonthlyPrice}</span>
                              <span className="text-xs text-slate-500">/ venue / month</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Min {p.minVenues || 8} Venues (Calculator Deploy)</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Monthly Offer:</span>
                              <div className="text-right">
                                {p.regularMonthlyPrice > p.price && (
                                  <span className="text-xs line-through text-slate-400 mr-1.5">₹{p.regularMonthlyPrice}</span>
                                )}
                                <span className="text-base font-black text-slate-900 dark:text-white">₹{p.price}</span>
                                <span className="text-[10px] text-slate-500">/mo</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                              <span className="text-xs text-slate-500">Annual Offer:</span>
                              <div className="text-right">
                                {p.regularAnnualPrice > p.annualPrice && (
                                  <span className="text-xs line-through text-slate-400 mr-1.5">₹{p.regularAnnualPrice}</span>
                                )}
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{p.annualPrice}</span>
                                <span className="text-[10px] text-slate-500">/yr</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Limits Summary */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Venue Listings:</span>
                          <span className="font-bold">{p.limits?.maxVenues >= 99999 ? 'Unlimited' : p.limits?.maxVenues}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Photos / Videos:</span>
                          <span className="font-bold">{p.limits?.photosPerVenue} photos • {p.limits?.videosPerVenue} vids</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Bookings Quota:</span>
                          <span className="font-bold">{p.limits?.monthlyOnlineBookings >= 99999 ? 'Unlimited' : `${p.limits?.monthlyOnlineBookings}/mo`}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Search Visibility:</span>
                          <span className="font-bold">{p.limits?.searchVisibility || 'Standard'}</span>
                        </div>
                      </div>

                      {/* Included Services Count */}
                      <div className="pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Included Services ({p.features?.length || 0}):
                        </span>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto pr-1">
                          {(p.features || []).slice(0, 5).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </li>
                          ))}
                          {(p.features?.length || 0) > 5 && (
                            <li className="text-[11px] text-slate-400 italic pl-5">
                              + {p.features.length - 5} more features...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 flex items-center gap-2">
                      <button
                        onClick={() => handleEditPlan(p)}
                        className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Plan Values
                      </button>

                      {p.planId !== 'starter' && (
                        <button
                          onClick={() => handleDeletePlan(p)}
                          className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUBSCRIBERS DIRECTORY & ASSIGN */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Subscriptions</span>
                  <Users className="w-4 h-4 text-primary-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.totalActive || 0}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pro Subscribers</span>
                  <Crown className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600">
                  {stats?.proCount || 0}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Business Premium</span>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-indigo-600">
                  {stats?.businessCount || 0}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Subscription Revenue</span>
                  <IndianRupee className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Filter Plan:</span>
                {['all', 'starter', 'pro', 'business', 'custom'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setFilterPlan(p);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      filterPlan === p
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchSubscriptions}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Owner Details</th>
                      <th className="px-4 py-3.5">Subscription Plan</th>
                      <th className="px-4 py-3.5">Cycle &amp; Amount</th>
                      <th className="px-4 py-3.5">Start Date</th>
                      <th className="px-4 py-3.5">Expiry Date</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subscribersLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          Loading subscriptions...
                        </td>
                      </tr>
                    ) : subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No subscriptions found in this category.
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">{sub.owner?.name || 'Owner'}</p>
                            <p className="text-[11px] text-slate-400">{sub.owner?.email} • {sub.owner?.phone}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            {getPlanBadge(sub.plan)}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              ₹{sub.totalAmount || sub.amount || 0}
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize">{sub.billingCycle || 'Monthly'}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            {new Date(sub.startDate || sub.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            {sub.expiryDate ? (
                              new Date(sub.expiryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            ) : (
                              <span className="text-slate-400 italic">No Expiry (Free)</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sub.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL: DYNAMIC PLAN EDITOR ==================== */}
        {showPlanModal && selectedPlan && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary-600" />
                    {selectedPlan._id ? `Edit Plan: ${selectedPlan.name}` : 'Create New Subscription Plan'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure pricing values, plan description, limits, and dynamic services list.
                  </p>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-6">

                {/* Section 1: Basic Information & Badges */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary-500" />
                    1. Basic Plan Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={selectedPlan.name}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                        placeholder="e.g. Pro Plan"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Badge Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={selectedPlan.badge || ''}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, badge: e.target.value })}
                        placeholder="e.g. Recommended, Best Value"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={selectedPlan.displayOrder ?? 0}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, displayOrder: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={selectedPlan.subtitle || ''}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, subtitle: e.target.value })}
                      placeholder="e.g. For growing venue businesses seeking max bookings"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Plan Description
                    </label>
                    <textarea
                      rows={2}
                      value={selectedPlan.description || ''}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                      placeholder="Detailed description shown to venue owners"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Highlight & Active Toggles */}
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedPlan.isActive}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, isActive: e.target.checked })}
                        className="w-4 h-4 accent-primary-600 rounded"
                      />
                      Active &amp; Available for Purchase
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedPlan.isHighlighted}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, isHighlighted: e.target.checked })}
                        className="w-4 h-4 accent-primary-600 rounded"
                      />
                      Highlight Card (Featured / Recommended)
                    </label>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section 2: Pricing & Plan Values */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                    2. Plan Pricing &amp; Value (₹ INR)
                  </h4>

                  {selectedPlan.planId === 'custom' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                          Per Venue Monthly Price (₹)
                        </label>
                        <input
                          type="number"
                          value={selectedPlan.perVenueMonthlyPrice ?? 90}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, perVenueMonthlyPrice: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Multiplied by venues count selected in slider</p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                          Minimum Venues Count Required
                        </label>
                        <input
                          type="number"
                          value={selectedPlan.minVenues ?? 8}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, minVenues: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Default minimum is 8 venues</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                          Monthly Regular Price (₹)
                        </label>
                        <input
                          type="number"
                          value={selectedPlan.regularMonthlyPrice ?? 0}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, regularMonthlyPrice: Number(e.target.value) })}
                          placeholder="e.g. 499"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-emerald-600 mb-1 block">
                          Monthly Offer Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={selectedPlan.price ?? 0}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, price: Number(e.target.value) })}
                          placeholder="e.g. 299"
                          className="w-full px-3.5 py-2 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                          Annual Regular Price (₹)
                        </label>
                        <input
                          type="number"
                          value={selectedPlan.regularAnnualPrice ?? 0}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, regularAnnualPrice: Number(e.target.value) })}
                          placeholder="e.g. 5988"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-emerald-600 mb-1 block">
                          Annual Offer Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={selectedPlan.annualPrice ?? 0}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, annualPrice: Number(e.target.value) })}
                          placeholder="e.g. 2999"
                          className="w-full px-3.5 py-2 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section 3: Quotas & Feature Limits */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    3. Quotas &amp; Limits Configuration
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Max Venues</label>
                      <input
                        type="number"
                        value={selectedPlan.limits?.maxVenues ?? 1}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, maxVenues: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Photos / Venue</label>
                      <input
                        type="number"
                        value={selectedPlan.limits?.photosPerVenue ?? 5}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, photosPerVenue: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Videos / Venue</label>
                      <input
                        type="number"
                        value={selectedPlan.limits?.videosPerVenue ?? 3}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, videosPerVenue: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Online Bookings/Mo</label>
                      <input
                        type="number"
                        value={selectedPlan.limits?.monthlyOnlineBookings ?? 3}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, monthlyOnlineBookings: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                      <span className="text-[10px] text-slate-400">999999 for Unlimited</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">CRM Level</label>
                      <select
                        value={selectedPlan.limits?.crm || 'Basic'}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, crm: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      >
                        <option value="Basic">Basic CRM</option>
                        <option value="Advanced">Advanced CRM</option>
                        <option value="Enterprise">Enterprise CRM</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Dashboard Access</label>
                      <select
                        value={selectedPlan.limits?.dashboard || 'Basic'}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, dashboard: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      >
                        <option value="Basic">Basic Dashboard</option>
                        <option value="Advanced">Advanced Dashboard</option>
                        <option value="Role-Based">Role-based Multi-user</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Search Visibility</label>
                      <select
                        value={selectedPlan.limits?.searchVisibility || 'Standard'}
                        onChange={(e) => setSelectedPlan({
                          ...selectedPlan,
                          limits: { ...selectedPlan.limits, searchVisibility: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      >
                        <option value="Standard">Standard Visibility</option>
                        <option value="Priority">Priority Ranking</option>
                        <option value="Top Tier">Top Tier / Featured</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section 4: Dynamic Services & Features List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" />
                      4. Plan Services &amp; Benefits List ({selectedPlan.features?.length || 0})
                    </h4>
                    <span className="text-[11px] text-slate-400">Owners will see these bullet points</span>
                  </div>

                  {/* Add New Feature Row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      placeholder="Add a new service or feature bullet point (e.g. Dedicated Account Manager)..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {/* List of Features */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(selectedPlan.features || []).map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => {
                              const updated = [...selectedPlan.features];
                              updated[idx] = e.target.value;
                              setSelectedPlan({ ...selectedPlan, features: updated });
                            }}
                            className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-800 dark:text-slate-200"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remove Feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={planSaving}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {planSaving ? 'Saving Changes...' : 'Save Plan Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Manually Assign Plan */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Assign Plan to Venue Owner</h3>
              <p className="text-xs text-slate-500">Upgrade or assign custom duration for a VIP or partner venue owner.</p>

              <form onSubmit={handleAssignPlan} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Venue Owner User ID (MongoDB _id) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Owner User ID"
                    value={assignForm.ownerId}
                    onChange={(e) => setAssignForm((p) => ({ ...p, ownerId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Select Plan *
                  </label>
                  <select
                    value={assignForm.plan}
                    onChange={(e) => setAssignForm((p) => ({ ...p, plan: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  >
                    {plans.map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={assignForm.durationDays}
                    onChange={(e) => setAssignForm((p) => ({ ...p, durationDays: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold"
                  >
                    {assigning ? 'Assigning...' : 'Assign Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
