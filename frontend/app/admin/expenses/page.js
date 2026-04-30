'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Plus, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AdminExpensesPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpenditure: 0, totalRecords: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    amount: '',
    note: '',
    expenseDate: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (token) fetchExpenses();
  }, [token]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
        setSummary(data.summary || { totalExpenditure: 0, totalRecords: 0 });
      } else {
        toast.error(data.message || 'Failed to load expenses');
      }
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(form.amount);
    if (!form.title.trim()) return toast.error('Title is required');
    if (Number.isNaN(amountNum) || amountNum < 0) return toast.error('Valid amount required');

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category.trim() || 'General',
          amount: amountNum,
          note: form.note.trim(),
          expenseDate: form.expenseDate
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Expense added');
        setForm((prev) => ({ ...prev, title: '', amount: '', note: '' }));
        setShowAddModal(false);
        fetchExpenses();
      } else {
        toast.error(data.message || 'Failed to add expense');
      }
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Expense Management" subtitle="Add expense and track full history">
      <PermissionGuard permission="payments">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Total Expenditure</p>
                  <p className="mt-1 text-3xl font-black text-rose-700">{fmtRs(summary.totalExpenditure)}</p>
                  <p className="mt-1 text-xs text-rose-600">Entries: {summary.totalRecords}</p>
                </div>
                <div className="rounded-lg bg-white/80 p-2">
                  <Wallet className="h-5 w-5 text-rose-600" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Added By</th>
                    <th className="px-4 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-gray-400" colSpan={6}>No expenses added yet</td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item._id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(item.expenseDate || item.createdAt).toLocaleDateString('en-IN')}
                          <div className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{item.title}</td>
                        <td className="px-4 py-3 text-gray-600">{item.category || 'General'}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">{fmtRs(item.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-semibold">{item.createdBy?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{item.createdBy?.role || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Add Expense</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="rounded-md px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={form.category}
                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="date"
                        value={form.expenseDate}
                        onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <textarea
                      placeholder="Note"
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      rows={3}
                      className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Add Expense'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </PermissionGuard>
    </AdminLayout>
  );
}
