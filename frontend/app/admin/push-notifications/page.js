'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Bell, Send, Plus, Trash2, Users, FileText, Image as ImageIcon, Link as LinkIcon, RefreshCw, X, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PushNotificationsAdmin() {
  const { token } = useAuthStore();
  const formRef = useRef(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'topics'

  // Loading states
  const [countsLoading, setCountsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Data states
  const [counts, setCounts] = useState({ totalDevices: 0, vendors: 0, owners: 0, customers: 0, guests: 0, topicsCount: 0 });
  const [manualHistory, setManualHistory] = useState([]);
  const [topics, setTopics] = useState([]);
  
  // Send Form State
  const [targetType, setTargetType] = useState('all'); // 'all', 'vendor', 'owner', 'customer', 'topic'
  const [selectedTopicSlug, setSelectedTopicSlug] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Topic Creation Form State
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  // Topic Subscriber Management Modal State
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  // Fetch initial counts and topics
  useEffect(() => {
    if (token) {
      fetchCounts();
      fetchHistory();
      fetchTopics();
    }
  }, [token]);

  const fetchCounts = async () => {
    setCountsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/admin/counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCounts(data.counts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCountsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/manual-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setManualHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/topics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTopics(data.topics);
        if (data.topics.length > 0 && !selectedTopicSlug) {
          setSelectedTopicSlug(data.topics[0].slug);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTopicsLoading(false);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'notifications');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(data.message || 'Image upload failed');
      }
    } catch (err) {
      toast.error('Image upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Send Manual Push Notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }
    if (targetType === 'topic' && !selectedTopicSlug) {
      toast.error('Please select a target topic');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/send-manual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetType,
          targetTopic: targetType === 'topic' ? selectedTopicSlug : undefined,
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || undefined,
          imageUrl: imageUrl || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notification broadcasted successfully!');
        // Reset form
        setTitle('');
        setBody('');
        setLink('');
        setImageUrl('');
        // Refresh history & counts
        fetchHistory();
      } else {
        toast.error(data.message || 'Failed to send notification');
      }
    } catch (err) {
      toast.error('Failed to send notification');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Create Topic handler
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) {
      toast.error('Topic name is required');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/topics`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: newTopicDesc.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Topic created successfully!');
        setNewTopicName('');
        setNewTopicDesc('');
        fetchTopics();
      } else {
        toast.error(data.message || 'Failed to create topic');
      }
    } catch (err) {
      toast.error('Failed to create topic');
      console.error(err);
    }
  };

  // Delete Topic handler
  const handleDeleteTopic = async (topicId) => {
    if (!confirm('Are you sure you want to delete this topic? All subscribers will be unsubscribed.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/topics/${topicId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Topic deleted successfully');
        fetchTopics();
      } else {
        toast.error(data.message || 'Failed to delete topic');
      }
    } catch (err) {
      toast.error('Failed to delete topic');
      console.error(err);
    }
  };

  // Autofill form for resend
  const handleResend = (historyItem) => {
    setTargetType(historyItem.data?.targetType || 'all');
    if (historyItem.data?.targetType === 'topic') {
      setSelectedTopicSlug(historyItem.data?.targetTopic || '');
    }
    setTitle(historyItem.title || '');
    setBody(historyItem.body || '');
    setLink(historyItem.data?.link || '');
    setImageUrl(historyItem.imageUrl || '');
    
    // Smooth scroll to top form
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast.success('Form autofilled with notification details.');
  };

  // Fetch Topic Subscribers
  const fetchTopicSubscribers = async (topic) => {
    setSelectedTopic(topic);
    setSubscribersLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/topics/${topic.slug}/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers);
        setAvailableUsers(data.availableUsers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubscribersLoading(false);
    }
  };

  // Subscribe user to topic
  const handleSubscribe = async (userId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/topics/${selectedTopic.slug}/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User subscribed successfully!');
        // Refresh subscribers
        fetchTopicSubscribers(selectedTopic);
        // Refresh topics counts
        fetchTopics();
      } else {
        toast.error(data.message || 'Subscription failed');
      }
    } catch (err) {
      toast.error('Subscription failed');
      console.error(err);
    }
  };

  // Unsubscribe user from topic
  const handleUnsubscribe = async (userId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/topics/${selectedTopic.slug}/unsubscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User unsubscribed successfully!');
        // Refresh subscribers
        fetchTopicSubscribers(selectedTopic);
        // Refresh topics counts
        fetchTopics();
      } else {
        toast.error(data.message || 'Unsubscription failed');
      }
    } catch (err) {
      toast.error('Unsubscription failed');
      console.error(err);
    }
  };

  // Filter available users by search query
  const filteredAvailableUsers = availableUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <AdminLayout title="Push Notifications" subtitle="Send manual push alerts, manage notification history & topic subscriptions">
      <PermissionGuard permission="notifications">
        <div className="w-full space-y-6">

          {/* Tab Selector */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'send'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Push Notification
              </div>
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'topics'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Notification Topics
              </div>
            </button>
          </div>

          {/* Tab Content 1: Send Push Notification */}
          {activeTab === 'send' && (
            <div className="space-y-6" ref={formRef}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form Column */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Compose Push Notification</h3>
                  
                  <form onSubmit={handleSendNotification} className="space-y-5">
                    
                    {/* Target Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Target Audience</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setTargetType('all')}
                          className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                            targetType === 'all'
                              ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold">All Devices</span>
                          <span className="text-xs text-amber-600 font-bold mt-1">
                            {countsLoading ? '...' : `${counts.totalDevices} active`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetType('customer')}
                          className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                            targetType === 'customer'
                              ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold">Customers</span>
                          <span className="text-xs text-amber-600 font-bold mt-1">
                            {countsLoading ? '...' : `${counts.customers} active`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetType('vendor')}
                          className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                            targetType === 'vendor'
                              ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold">Vendors</span>
                          <span className="text-xs text-amber-600 font-bold mt-1">
                            {countsLoading ? '...' : `${counts.vendors} active`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetType('owner')}
                          className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                            targetType === 'owner'
                              ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold">Venue Owners</span>
                          <span className="text-xs text-amber-600 font-bold mt-1">
                            {countsLoading ? '...' : `${counts.owners} active`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetType('topic')}
                          className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col justify-between ${
                            targetType === 'topic'
                              ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold">By Topic</span>
                          <span className="text-xs text-amber-600 font-bold mt-1">
                            {countsLoading ? '...' : `${counts.topicsCount} topics`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Topic Dropdown if targetType is topic */}
                    {targetType === 'topic' && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Select Topic</label>
                        <select
                          value={selectedTopicSlug}
                          onChange={(e) => setSelectedTopicSlug(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                        >
                          <option value="">-- Choose a Topic --</option>
                          {topics.map(t => (
                            <option key={t.slug} value={t.slug}>{t.name} ({t.subscriberCount} subscribers)</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Notification Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Special Festive Offer! 🎁"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                      />
                    </div>

                    {/* Message Body */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Message Body</label>
                      <textarea
                        required
                        rows="4"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Type your push notification message body here..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm resize-none"
                      />
                    </div>

                    {/* Action / Redirection Link */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Redirection Link (Optional)</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          placeholder="e.g. /venues or https://rentalmeet.com/offers"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Image URL / Upload */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Notification Image (Optional)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="Enter image URL..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm mb-2"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="notification-image-file"
                            />
                            <label
                              htmlFor="notification-image-file"
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all"
                            >
                              <ImageIcon className="w-4 h-4" />
                              {uploading ? 'Uploading...' : 'Or Upload File'}
                            </label>
                          </div>
                        </div>

                        {/* Image Preview */}
                        <div className="border border-gray-100 rounded-xl p-3 flex items-center justify-center bg-gray-50 min-h-[100px]">
                          {imageUrl ? (
                            <div className="relative group w-full h-full max-h-[100px] flex items-center justify-center">
                              <img src={imageUrl} alt="Preview" className="max-h-[80px] rounded-lg object-contain" />
                              <button
                                type="button"
                                onClick={() => setImageUrl('')}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No Image Preview</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Send Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sending || uploading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl shadow-sm transition-all"
                      >
                        <Send className="w-4 h-4" />
                        {sending ? 'Broadcasting Push...' : 'Send Push Notification'}
                      </button>
                    </div>

                  </form>
                </div>

                {/* Preview Column */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Device Preview</h3>
                    <p className="text-xs text-gray-400 mb-6">Mockup of how this push notification will look on client mobile device</p>
                    
                    {/* Mock phone */}
                    <div className="border-[6px] border-slate-800 rounded-[36px] bg-slate-900 p-3 shadow-md aspect-[9/16] w-full max-w-[260px] mx-auto relative overflow-hidden flex flex-col justify-start pt-16">
                      
                      {/* Speaker / Camera Notch */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-10"></div>

                      {/* Mock Notification Card */}
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/20 animate-pulse space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center text-[10px] text-white font-black">RM</div>
                            <span className="text-[10px] font-bold text-slate-800">RENTALMEET</span>
                          </div>
                          <span className="text-[8px] text-gray-400">now</span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900 truncate">{title || 'Notification Title'}</h4>
                          <p className="text-[10px] text-slate-600 line-clamp-3 leading-normal">{body || 'This is where your notification content details will appear to your target audience.'}</p>
                        </div>

                        {imageUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center max-h-[80px]">
                            <img src={imageUrl} alt="Notification Image" className="max-h-[80px] object-cover w-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-4 bg-amber-50/40 rounded-xl p-4 border border-amber-100">
                    <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                      🔔 <strong>Note:</strong> Redirection link will open the target page directly when the user clicks the notification card.
                    </p>
                  </div>
                </div>

              </div>

              {/* History Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Broadcast History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Logs of manually sent notifications</p>
                  </div>
                  <button onClick={fetchHistory} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                    <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-semibold text-xs bg-gray-50/60 uppercase">
                        <th className="py-3.5 px-4 rounded-l-xl">Target</th>
                        <th className="py-3.5 px-4">Title</th>
                        <th className="py-3.5 px-4">Message</th>
                        <th className="py-3.5 px-4">Image</th>
                        <th className="py-3.5 px-4">FCM Results</th>
                        <th className="py-3.5 px-4">Sent Date</th>
                        <th className="py-3.5 px-4 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {manualHistory.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-400 text-xs">No notification history found</td>
                        </tr>
                      ) : (
                        manualHistory.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50/40 transition-all text-xs text-gray-600">
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg uppercase tracking-wider text-[10px]">
                                {item.data?.targetType === 'topic' ? `Topic: ${item.data?.targetTopic}` : item.data?.targetType || 'all'}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-gray-900 max-w-[180px] truncate">{item.title}</td>
                            <td className="py-4 px-4 max-w-[240px] truncate" title={item.body}>{item.body}</td>
                            <td className="py-4 px-4">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="FCM" className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-green-600 font-bold">✓ {item.data?.successCount || 0} Successful</span>
                                {item.data?.failureCount > 0 && <span className="text-red-500">✗ {item.data?.failureCount} Failed</span>}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => handleResend(item)}
                                className="px-3 py-1.5 border border-amber-200 text-amber-600 font-bold hover:bg-amber-50 rounded-lg transition-all"
                              >
                                Resend
                              </button>
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

          {/* Tab Content 2: Topics Management */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Create Topic Form */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Create Notification Topic</h3>
                  
                  <form onSubmit={handleCreateTopic} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Topic Name</label>
                      <input
                        type="text"
                        required
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="e.g. New Offers & Promotions"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Description (Optional)</label>
                      <textarea
                        rows="3"
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        placeholder="Describe who this topic is intended for..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create Topic
                    </button>
                  </form>
                </div>

                {/* Topics Table List */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Notification Topics List</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Sync subscriptions to devices automatically</p>
                    </div>
                    <button onClick={fetchTopics} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                      <RefreshCw className={`w-4 h-4 ${topicsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold text-xs bg-gray-50/60 uppercase">
                          <th className="py-3 px-4 rounded-l-xl">Topic Name</th>
                          <th className="py-3 px-4">Topic Slug (FCM)</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Subscribers</th>
                          <th className="py-3 px-4 rounded-r-xl text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topics.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-gray-400 text-xs">No topics created yet</td>
                          </tr>
                        ) : (
                          topics.map((topic) => (
                            <tr key={topic._id} className="hover:bg-gray-50/40 transition-all text-xs text-gray-600">
                              <td className="py-4 px-4 font-bold text-gray-900">{topic.name}</td>
                              <td className="py-4 px-4">
                                <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px]">{topic.slug}</span>
                              </td>
                              <td className="py-4 px-4 max-w-[200px] truncate" title={topic.description}>{topic.description || '-'}</td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-amber-600">{topic.subscriberCount} devices</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => fetchTopicSubscribers(topic)}
                                    className="px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold rounded-lg transition-all"
                                  >
                                    Manage Users
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTopic(topic._id)}
                                    className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                                    title="Delete Topic"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Topic Subscriber Management Modal */}
              {selectedTopic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                    
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-500 text-white">
                      <div>
                        <h3 className="font-extrabold text-lg">Manage Subscribers</h3>
                        <p className="text-xs text-amber-100">Topic: {selectedTopic.name} ({selectedTopic.slug})</p>
                      </div>
                      <button
                        onClick={() => setSelectedTopic(null)}
                        className="p-1 hover:bg-amber-600 rounded-full transition-all text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content Panel */}
                    <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
                      
                      {/* Left side: Subscribed Users */}
                      <div className="border border-gray-100 rounded-xl p-4 flex flex-col">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
                          <span>Subscribed Users</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{subscribers.length}</span>
                        </h4>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-2 custom-scrollbar">
                          {subscribersLoading ? (
                            <div className="text-center text-xs text-gray-400 py-6">Loading...</div>
                          ) : subscribers.length === 0 ? (
                            <div className="text-center text-xs text-gray-400 py-8">No users subscribed to this topic.</div>
                          ) : (
                            subscribers.map((u) => (
                              <div key={u._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-all">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{u.email} | {u.role}</p>
                                </div>
                                <button
                                  onClick={() => handleUnsubscribe(u._id)}
                                  className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg"
                                >
                                  Unsubscribe
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right side: Available Users to Add */}
                      <div className="border border-gray-100 rounded-xl p-4 flex flex-col">
                        <h4 className="font-bold text-slate-800 mb-3">Add Subscribers</h4>
                        
                        {/* Search Box */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, role..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] pr-2 custom-scrollbar">
                          {subscribersLoading ? (
                            <div className="text-center text-xs text-gray-400 py-6">Loading...</div>
                          ) : filteredAvailableUsers.length === 0 ? (
                            <div className="text-center text-xs text-gray-400 py-8">No available users found.</div>
                          ) : (
                            filteredAvailableUsers.map((u) => (
                              <div key={u._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-amber-50/30 hover:border-amber-100 transition-all">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{u.email} | <span className="font-semibold text-amber-600">{u.role}</span></p>
                                </div>
                                <button
                                  onClick={() => handleSubscribe(u._id)}
                                  className="text-[10px] font-bold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button
                        onClick={() => setSelectedTopic(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition-all"
                      >
                        Close
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
