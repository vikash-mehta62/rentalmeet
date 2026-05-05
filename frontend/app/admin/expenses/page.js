'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Plus, Wallet, Download, Trash2, Settings } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmtRs = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AdminExpensesPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [heads, setHeads] = useState([]);
  const [summary, setSummary] = useState({ totalExpenditure: 0, totalRecords: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHeadsModal, setShowHeadsModal] = useState(false);
  const [newHeadName, setNewHeadName] = useState('');
  const [headSaving, setHeadSaving] = useState(false);

  // Date filter
  const [dateMode, setDateMode] = useState('financial');
  const [selectedFY, setSelectedFY] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);

  const [form, setForm] = useState({
    head: '', subHead: '', amount: '', remark: '',
    expenseDate: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    const years = [];
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < 10; i++) {
      const s = fyStart - i, e = s + 1;
      years.push({ label: `FY ${s}-${e}`, value: `${s}-${e}`, fyYear: s });
    }
    setFinancialYears(years);
    setSelectedFY(years[0].value);
  }, []);

  useEffect(() => {
    if (token) fetchHeads();
  }, [token]);

  useEffect(() => {
    if (token && (selectedFY || (startDate && endDate))) fetchExpenses();
  }, [token, selectedFY, startDate, endDate, dateMode]);

  const getParams = () => {
    if (dateMode === 'financial' && selectedFY) {
      const fy = financialYears.find(f => f.value === selectedFY);
      if (!fy) return '';
      return `?dateFilter=fy&fyYear=${fy.fyYear}`;
    }
    if (dateMode === 'custom' && startDate && endDate) {
      return `?dateFilter=custom&from=${startDate.toISOString().slice(0,10)}&to=${endDate.toISOString().slice(0,10)}`;
    }
    return '';
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses${getParams()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
        setSummary(data.summary || { totalExpenditure: 0, totalRecords: 0 });
      } else toast.error(data.message || 'Failed to load expenses');
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  const fetchHeads = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expense-heads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setHeads(data.heads || []);
    } catch {}
  };

  const handleAddHead = async () => {
    if (!newHeadName.trim()) return toast.error('Head name required');
    setHeadSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expense-heads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newHeadName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Head added');
        setNewHeadName('');
        fetchHeads();
      } else toast.error(data.message);
    } catch { toast.error('Failed to add head'); }
    finally { setHeadSaving(false); }
  };

  const handleDeleteHead = async (id) => {
    if (!confirm('Delete this head?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expense-heads/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Head deleted');
      fetchHeads();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.head) return toast.error('Head is required');
    const amountNum = Number(form.amount);
    if (Number.isNaN(amountNum) || amountNum < 0) return toast.error('Valid amount required');
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          head: form.head, subHead: form.subHead.trim(),
          amount: amountNum, remark: form.remark.trim(),
          expenseDate: form.expenseDate
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Expense added');
        setForm({ head: '', subHead: '', amount: '', remark: '', expenseDate: new Date().toISOString().slice(0, 10) });
        setShowAddModal(false);
        fetchExpenses();
      } else toast.error(data.message || 'Failed to add expense');
    } catch { toast.error('Failed to add expense'); }
    finally { setSaving(false); }
  };

  const handleExportCSV = () => {
    const period = dateMode === 'financial'
      ? selectedFY
      : `${startDate?.toLocaleDateString('en-IN')} to ${endDate?.toLocaleDateString('en-IN')}`;
    const rows = [
      ['#', 'Date', 'Head', 'Sub Head', 'Amount', 'Added By', 'Role', 'Remark'],
      ...expenses.map((item, i) => [
        i + 1,
        new Date(item.expenseDate || item.createdAt).toLocaleDateString('en-IN'),
        item.head || '',
        item.subHead || '',
        item.amount || 0,
        item.createdBy?.name || '',
        item.createdBy?.role || '',
        item.remark || '',
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `Expenses_${period.replace(/\s/g, '_')}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  return (
    <AdminLayout title="Expense Management" subtitle="Track and filter expenses by period">
      <PermissionGuard permission="expenses">

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {['financial', 'custom'].map(m => (
              <button key={m} onClick={() => setDateMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateMode === m ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m === 'financial' ? 'Financial Year' : 'Custom Range'}
              </button>
            ))}
          </div>
          {dateMode === 'financial' && (
            <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white">
              {financialYears.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
            </select>
          )}
          {dateMode === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker selected={startDate} onChange={setStartDate} maxDate={endDate || new Date()} dateFormat="dd/MM/yyyy" placeholderText="From"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
              <span className="text-gray-400">—</span>
              <DatePicker selected={endDate} onChange={setEndDate} minDate={startDate} maxDate={new Date()} dateFormat="dd/MM/yyyy" placeholderText="To"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
            </div>
          )}
          <button onClick={handleExportCSV} disabled={expenses.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            <Download className="w-4 h-4" /> CSV
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowHeadsModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Settings className="h-4 w-4" /> Manage Heads
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
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

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Head</th>
                    <th className="px-4 py-3 text-left">Sub Head</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Added By</th>
                    <th className="px-4 py-3 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td className="px-4 py-8 text-center text-gray-400" colSpan={7}>No expenses found for this period</td></tr>
                  ) : (
                    expenses.map((item, i) => (
                      <tr key={item._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(item.expenseDate || item.createdAt).toLocaleDateString('en-IN')}
                          <div className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{item.head}</td>
                        <td className="px-4 py-3 text-gray-600">{item.subHead || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">{fmtRs(item.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-semibold">{item.createdBy?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{item.createdBy?.role || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.remark || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-800">Add Expense</h2>
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Head dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Head <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select value={form.head} onChange={e => setForm(p => ({ ...p, head: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 bg-white">
                      <option value="">Select Head</option>
                      {heads.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setShowAddModal(false); setShowHeadsModal(true); }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                      + Add Head
                    </button>
                  </div>
                </div>

                {/* Sub Head */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sub Head</label>
                  <input type="text" placeholder="Sub Head (optional)" value={form.subHead}
                    onChange={e => setForm(p => ({ ...p, subHead: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Amount <span className="text-red-500">*</span></label>
                    <input type="number" placeholder="0" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                    <input type="date" value={form.expenseDate}
                      onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                {/* Remark */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Remark</label>
                  <textarea placeholder="Remark (optional)" value={form.remark}
                    onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
                    rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
                    <Plus className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Add Expense'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Heads Modal */}
        {showHeadsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-800">Manage Expense Heads</h2>
                <button type="button" onClick={() => setShowHeadsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>

              {/* Add new head */}
              <div className="flex gap-2 mb-5">
                <input type="text" placeholder="New head name..." value={newHeadName}
                  onChange={e => setNewHeadName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddHead()}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                <button onClick={handleAddHead} disabled={headSaving}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {headSaving ? '...' : 'Add'}
                </button>
              </div>

              {/* Heads list */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {heads.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No heads added yet</p>
                ) : heads.map(h => (
                  <div key={h._id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm font-semibold text-gray-800">{h.name}</span>
                    <button onClick={() => handleDeleteHead(h._id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowHeadsModal(false)}
                className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Done
              </button>
            </div>
          </div>
        )}

      </PermissionGuard>
    </AdminLayout>
  );
}
