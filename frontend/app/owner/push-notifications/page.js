'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import {
  Bell,
  Send,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Sparkles,
  History,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerPushNotificationsPage() {
  const { token } = useAuthStore();
  const [venues, setVenues] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: '',
    body: '',
    targetAudience: 'all_customers',
    venueId: '',
    actionLink: '',
    imageUrl: ''
  });

  const fetchVenuesAndHistory = async () => {
    try {
      setLoading(true);
      const [resVenues, resHistory] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/push-notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const dataVenues = await resVenues.json();
      const dataHistory = await resHistory.json();

      if (dataVenues.success) setVenues(dataVenues.venues || []);
      if (dataHistory.success) setHistory(dataHistory.history || []);
    } catch (err) {
      console.error('Error loading push notification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchVenuesAndHistory();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and message are required');
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/push-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Notification broadcasted successfully!');
        setForm({
          title: '',
          body: '',
          targetAudience: 'all_customers',
          venueId: '',
          actionLink: '',
          imageUrl: ''
        });
        fetchVenuesAndHistory();
      } else {
        toast.error(data.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Send notification error:', err);
      toast.error('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <OwnerLayout
      title="Push Notifications"
      subtitle="Broadcast announcements, special festival offers, and discounts directly to your customers"
    >
      <div className="space-y-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form: Compose Notification (2 Cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Compose Customer Notification
                </h3>
                <p className="text-xs text-slate-400">Target your past booking clients or followers</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Audience & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all_customers">All Past Customers (Online + Offline)</option>
                    <option value="active_bookings">Customers with Upcoming Bookings</option>
                    <option value="followers">Venue Followers & Social Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Venue (Optional)
                  </label>
                  <select
                    value={form.venueId}
                    onChange={(e) => setForm({ ...form, venueId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All My Venues</option>
                    {venues.map((v) => (
                      <option key={v._id} value={v._id}>{v.businessName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notification Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🎉 Special 20% Off Weekend Booking Offer!"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={65}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-[10px] text-slate-400 text-right mt-0.5">{form.title.length}/65 chars</p>
              </div>

              {/* Notification Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Message Body *
                </label>
                <textarea
                  placeholder="e.g. Book your corporate meeting or wedding celebration with us this month and enjoy complimentary AV equipment and free parking!"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={3}
                  maxLength={180}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-[10px] text-slate-400 text-right mt-0.5">{form.body.length}/180 chars</p>
              </div>

              {/* Action Link & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Click Action URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /venues/your-venue-sku"
                    value={form.actionLink}
                    onChange={(e) => setForm({ ...form, actionLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !form.title.trim() || !form.body.trim()}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Push Notification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile Device Preview (1 Col) */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between border border-slate-800 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                  <Smartphone className="w-4 h-4 text-primary-400" />
                  Mobile Live Preview
                </span>
                <span className="text-[10px]">RentalMeet</span>
              </div>

              {/* Mock Notification Popup */}
              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-lg space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary-500 flex items-center justify-center font-bold text-[10px]">
                      R
                    </div>
                    <span className="text-[11px] font-bold text-slate-200">RentalMeet</span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white leading-snug">
                    {form.title || 'Notification Title Preview'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {form.body || 'Your notification message body will be displayed here on the customer mobile screen...'}
                  </p>
                </div>

                {form.imageUrl && (
                  <div className="h-28 rounded-lg overflow-hidden bg-slate-950 mt-2">
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">ℹ️ How it works:</p>
              <p>Sent notifications appear instantly in customer in-app notifications and browser push alerts.</p>
            </div>
          </div>
        </div>

        {/* Sent Notifications History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Broadcast History
              </h4>
            </div>
            <span className="text-xs text-slate-400">{history.length} sent</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications broadcasted yet. Create your first announcement above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Target Audience</th>
                    <th className="py-3 px-4 text-center">Delivered</th>
                    <th className="py-3 px-4">Sent At</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {h.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[300px] truncate">
                        {h.body}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-500">
                        {h.data?.targetAudience?.replace('_', ' ') || 'All Customers'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        {h.data?.deliveredCount || 0}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(h.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                          Delivered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
