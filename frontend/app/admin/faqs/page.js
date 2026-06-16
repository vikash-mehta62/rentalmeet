'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = [
  { value: 'venue_seekers', label: 'For Venue Seekers' },
  { value: 'venue_owners',  label: 'For Venue Owners' },
  { value: 'general',       label: 'General' },
];

const EMPTY_FORM = { question: '', answer: '', category: 'venue_seekers', order: 0 };

export default function AdminFAQs() {
  const { token } = useAuthStore();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { if (token) fetchFAQs(); }, [token]);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/faqs/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFaqs(data.faqs);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (faq) => {
    setEditingId(faq._id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, order: faq.order });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return toast.error('Question and answer required');
    setSaving(true);
    try {
      const url = editingId ? `${API}/faqs/${editingId}` : `${API}/faqs`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'FAQ updated!' : 'FAQ created!');
        setShowForm(false);
        fetchFAQs();
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Error saving FAQ'); }
    setSaving(false);
  };

  const toggleActive = async (faq) => {
    try {
      const res = await fetch(`${API}/faqs/${faq._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !faq.isActive })
      });
      const data = await res.json();
      if (data.success) { toast.success(data.faq.isActive ? 'Activated' : 'Deactivated'); fetchFAQs(); }
    } catch {}
  };

  const deleteFAQ = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await fetch(`${API}/faqs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted');
      fetchFAQs();
    } catch {}
  };

  const filtered = categoryFilter === 'all' ? faqs : faqs.filter(f => f.category === categoryFilter);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filtered.filter(f => f.category === cat.value);
    return acc;
  }, {});

  return (
    <AdminLayout title="FAQ Management" subtitle="Manage frequently asked questions shown on the public FAQ page">
      <PermissionGuard permission="faqs">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATEGORIES.map(c => c.value)].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === cat ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? `All (${faqs.length})` : `${CATEGORIES.find(c => c.value === cat)?.label} (${faqs.filter(f => f.category === cat).length})`}
            </button>
          ))}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />Add FAQ
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-black text-slate-900">{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Question *</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                  placeholder="Enter the question..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Answer *</label>
                <textarea
                  rows={5}
                  value={form.answer}
                  onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                  placeholder="Enter the answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List grouped by category */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">No FAQs yet. Click "Add FAQ" to create one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const items = grouped[cat.value];
            if (!items?.length) return null;
            return (
              <div key={cat.value}>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">{cat.label}</h3>
                <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase w-8">#</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Question</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase w-16">Order</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase w-20">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((faq, i) => (
                        <tr key={faq._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{faq.question}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{faq.answer}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{faq.order}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleActive(faq)}>
                              {faq.isActive
                                ? <ToggleRight size={22} className="text-green-500" />
                                : <ToggleLeft size={22} className="text-gray-300" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(faq)} className="text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={15} /></button>
                              <button onClick={() => deleteFAQ(faq._id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
