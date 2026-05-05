'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { MessageCircle, Save, Plus, X, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  quickReplies: [],
  welcomeMessage: "Hello! I'm your RentalMeet booking assistant. How can I help you today?",
  isEnabled: true,
};

export default function AdminChatbot() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { if (token) fetchSettings(); }, [token]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Migrate old string array to new {question,answer} format if needed
        const qr = (data.settings.quickReplies || []).map(r =>
          typeof r === 'string' ? { question: r, answer: '' } : r
        );
        setSettings({ ...data.settings, quickReplies: qr });
      }
    } catch (e) { console.error(e); }
    finally { setFetching(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      data.success ? toast.success('Chatbot settings saved!') : toast.error(data.message || 'Failed');
    } catch { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const addReply = () => {
    if (!newQ.trim()) { toast.error('Question is required'); return; }
    if (!newA.trim()) { toast.error('Answer is required'); return; }
    setSettings(prev => ({
      ...prev,
      quickReplies: [...prev.quickReplies, { question: newQ.trim(), answer: newA.trim() }]
    }));
    setNewQ('');
    setNewA('');
  };

  const removeReply = (i) => {
    setSettings(prev => ({ ...prev, quickReplies: prev.quickReplies.filter((_, idx) => idx !== i) }));
    if (expanded === i) setExpanded(null);
  };

  const updateReply = (i, field, value) => {
    setSettings(prev => {
      const qr = [...prev.quickReplies];
      qr[i] = { ...qr[i], [field]: value };
      return { ...prev, quickReplies: qr };
    });
  };

  const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm";

  return (
    <AdminLayout title="Chatbot Settings" subtitle="Manage chatbot quick replies and messages">
      <PermissionGuard permission="chatbot">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Preview banner */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F59F0A] rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">RentalMeet Chatbot</h3>
              <p className="text-sm text-gray-600">
                Each quick reply has a question (shown as button) and an answer (shown when clicked).
                Both are required.
              </p>
            </div>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Enable/Disable */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Chatbot Status</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Enable or disable the chatbot widget</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.isEnabled}
                      onChange={e => setSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-500" />
                  Welcome Message
                </h3>
                <textarea
                  value={settings.welcomeMessage}
                  onChange={e => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  rows={3} className={inputCls}
                  placeholder="First message shown when user opens the chatbot..."
                />
              </div>

              {/* Quick Replies */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-500" />
                  Quick Replies
                  <span className="ml-auto text-xs font-normal text-gray-400">{settings.quickReplies.length} replies</span>
                </h3>

                {/* Existing replies */}
                <div className="space-y-2 mb-5">
                  {settings.quickReplies.map((reply, i) => (
                    <div key={i} className="border border-amber-200 rounded-xl overflow-hidden">
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50">
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === i ? null : i)}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          <span className="text-sm font-semibold text-gray-800 flex-1">{reply.question || <span className="text-gray-400 italic">No question</span>}</span>
                          {expanded === i
                            ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>
                        <button onClick={() => removeReply(i)}
                          className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Expanded edit */}
                      {expanded === i && (
                        <div className="p-3 space-y-2 bg-white border-t border-amber-100">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Question (button label)</label>
                            <input
                              type="text"
                              value={reply.question}
                              onChange={e => updateReply(i, 'question', e.target.value)}
                              className={inputCls}
                              placeholder="e.g. How to book a venue?"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Answer (bot response)</label>
                            <textarea
                              rows={4}
                              value={reply.answer}
                              onChange={e => updateReply(i, 'answer', e.target.value)}
                              className={inputCls}
                              placeholder="Type the bot's reply here..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new reply */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Add New Quick Reply</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Question *</label>
                    <input
                      type="text"
                      value={newQ}
                      onChange={e => setNewQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addReply()}
                      placeholder="e.g. How to book a venue?"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Answer *</label>
                    <textarea
                      rows={3}
                      value={newA}
                      onChange={e => setNewA(e.target.value)}
                      placeholder="Type the bot's reply here..."
                      className={inputCls}
                    />
                  </div>
                  <button
                    onClick={addReply}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Reply
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-3">Click a reply to expand and edit. Changes save when you click Save below.</p>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Chatbot Settings'}
              </button>
            </>
          )}
        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
