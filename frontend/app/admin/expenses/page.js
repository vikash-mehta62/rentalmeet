'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Plus, Wallet, Download, Trash2, Settings, Pencil, IndianRupee, TrendingUp } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmtRs = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function AdminExpensesPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('expenses');

  // Shared date filter
  const [dateMode, setDateMode] = useState('financial');
  const [selectedFY, setSelectedFY] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);

  // Expenses state
  const [loadingExp, setLoadingExp] = useState(true);
  const [savingExp, setSavingExp] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [expSummary, setExpSummary] = useState({ totalExpenditure: 0, totalRecords: 0 });
  const [showAddExp, setShowAddExp] = useState(false);
  const [heads, setHeads] = useState([]);
  const [showHeadsModal, setShowHeadsModal] = useState(false);
  const [newHeadName, setNewHeadName] = useState('');
  const [headSaving, setHeadSaving] = useState(false);
  const [expForm, setExpForm] = useState({ head: '', subHead: '', amount: '', remark: '', expenseDate: new Date().toISOString().slice(0, 10) });
  const [editingExp, setEditingExp] = useState(null);

  // Liabilities state
  const [loadingLib, setLoadingLib] = useState(true);
  const [savingLib, setSavingLib] = useState(false);
  const [liabilities, setLiabilities] = useState([]);
  const [libSummary, setLibSummary] = useState({ totalAmount: 0, totalPaid: 0, totalPending: 0, totalRecords: 0 });
  const [showAddLib, setShowAddLib] = useState(false);
  const [libForm, setLibForm] = useState({ title: '', totalAmount: '', paidAmount: '', payByDate: '', remark: '' });
  const [editingLib, setEditingLib] = useState(null);

  // Revenue state
  const [loadingRev, setLoadingRev] = useState(true);
  const [revStats, setRevStats] = useState({ totalRevenue: 0 });
  const [revExpSummary, setRevExpSummary] = useState({ totalExpenditure: 0, totalRecords: 0 });
  const [revLibSummary, setRevLibSummary] = useState({ totalAmount: 0, totalPaid: 0, totalPending: 0 });

  // Pagination states for revenue
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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

  useEffect(() => { if (token) fetchHeads(); }, [token]);

  useEffect(() => {
    if (token && (selectedFY || (startDate && endDate) || dateMode === 'financial')) {
      fetchExpenses();
      fetchLiabilities();
      fetchRevenue();
    }
  }, [token, selectedFY, startDate, endDate, dateMode, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFY, startDate, endDate, dateMode]);

  const getParams = () => {
    if (dateMode === 'financial' && selectedFY) {
      const fy = financialYears.find(f => f.value === selectedFY);
      if (!fy) return '';
      return `?dateFilter=fy&fyYear=${fy.fyYear}`;
    }
    if (dateMode === 'custom' && startDate && endDate)
      return `?dateFilter=custom&from=${startDate.toISOString().slice(0,10)}&to=${endDate.toISOString().slice(0,10)}`;
    return '';
  };

  const fetchExpenses = async () => {
    setLoadingExp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses${getParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setExpenses(data.expenses || []); setExpSummary(data.summary || {}); }
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoadingExp(false); }
  };

  const fetchLiabilities = async () => {
    setLoadingLib(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/liabilities${getParams()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setLiabilities(data.liabilities || []); setLibSummary(data.summary || {}); }
    } catch { toast.error('Failed to load liabilities'); }
    finally { setLoadingLib(false); }
  };

  const fetchRevenue = async () => {
    setLoadingRev(true);
    try {
      const p = getParams();
      
      const payQuery = new URLSearchParams(p);
      payQuery.append('status', 'paid');
      payQuery.append('page', currentPage);
      payQuery.append('limit', '10');

      const [payRes, expRes, libRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments?${payQuery.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses${p}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/liabilities${p}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [payData, expData, libData] = await Promise.all([payRes.json(), expRes.json(), libRes.json()]);
      if (payData.success) {
        setRevStats(payData.stats || { totalRevenue: 0 });
        setPayments(payData.payments || []);
        setTotalPages(payData.totalPages || 1);
        setTotalRecords(payData.total || 0);
      }
      if (expData.success) setRevExpSummary(expData.summary || {});
      if (libData.success) setRevLibSummary(libData.summary || {});
    } catch { toast.error('Failed to load revenue'); }
    finally { setLoadingRev(false); }
  };

  const fetchHeads = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expense-heads`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setHeads(data.heads || []);
    } catch {}
  };

  const handleAddHead = async () => {
    if (!newHeadName.trim()) return toast.error('Head name required');
    setHeadSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expense-heads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newHeadName.trim() })
      });
      const data = await res.json();
      if (data.success) { toast.success('Head added'); setNewHeadName(''); fetchHeads(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setHeadSaving(false); }
  };

  const handleDeleteHead = async (id) => {
    if (!confirm('Delete this head?')) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expense-heads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchHeads();
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expForm.head) return toast.error('Head is required');
    const amountNum = Number(expForm.amount);
    if (Number.isNaN(amountNum) || amountNum < 0) return toast.error('Valid amount required');
    setSavingExp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ head: expForm.head, subHead: expForm.subHead.trim(), amount: amountNum, remark: expForm.remark.trim(), expenseDate: expForm.expenseDate })
      });
      const data = await res.json();
      if (data.success) { toast.success('Expense added'); setExpForm({ head: '', subHead: '', amount: '', remark: '', expenseDate: new Date().toISOString().slice(0, 10) }); setShowAddExp(false); fetchExpenses(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setSavingExp(false); }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    if (!editingExp.head) return toast.error('Head is required');
    const amountNum = Number(editingExp.amount);
    if (Number.isNaN(amountNum) || amountNum < 0) return toast.error('Valid amount required');
    setSavingExp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses/${editingExp._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ head: editingExp.head, subHead: editingExp.subHead, amount: amountNum, remark: editingExp.remark, expenseDate: editingExp.expenseDate })
      });
      const data = await res.json();
      if (data.success) { toast.success('Expense updated'); setEditingExp(null); fetchExpenses(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setSavingExp(false); }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchExpenses();
  };

  const handleAddLiability = async (e) => {
    e.preventDefault();
    if (!libForm.title.trim()) return toast.error('Title is required');
    if (!libForm.totalAmount || Number(libForm.totalAmount) < 0) return toast.error('Valid total amount required');
    setSavingLib(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/liabilities`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: libForm.title.trim(), totalAmount: Number(libForm.totalAmount), paidAmount: Number(libForm.paidAmount || 0), payByDate: libForm.payByDate || null, remark: libForm.remark.trim() })
      });
      const data = await res.json();
      if (data.success) { toast.success('Liability added'); setLibForm({ title: '', totalAmount: '', paidAmount: '', payByDate: '', remark: '' }); setShowAddLib(false); fetchLiabilities(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setSavingLib(false); }
  };

  const handleEditLiability = async (e) => {
    e.preventDefault();
    if (!editingLib.title?.trim()) return toast.error('Title is required');
    if (!editingLib.totalAmount || Number(editingLib.totalAmount) < 0) return toast.error('Valid total amount required');
    const paid = Number(editingLib.paidAmount || 0);
    if (paid > Number(editingLib.totalAmount)) return toast.error('Paid amount cannot exceed total');
    setSavingLib(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/liabilities/${editingLib._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editingLib.title, totalAmount: Number(editingLib.totalAmount), paidAmount: paid, payByDate: editingLib.payByDate || null, remark: editingLib.remark })
      });
      const data = await res.json();
      if (data.success) { toast.success('Liability updated'); setEditingLib(null); fetchLiabilities(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    finally { setSavingLib(false); }
  };

  const handleDeleteLiability = async (id) => {
    if (!confirm('Delete this liability?')) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/liabilities/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchLiabilities();
  };

  const revenue = useMemo(() => {
    const payment = revStats.totalPlatformRevenue || 0;
    const expenditure = revExpSummary.totalExpenditure || 0;
    const liab = revLibSummary.totalAmount || 0;
    return { payment, expenditure, liab, grossProfit: payment - expenditure - liab };
  }, [revStats, revExpSummary, revLibSummary]);

  const handleExportCSV = async () => {
    const period = dateMode === 'financial' ? selectedFY : `${startDate?.toLocaleDateString('en-IN') || 'All'} to ${endDate?.toLocaleDateString('en-IN') || 'All'}`;
    let rows, filename;
    if (activeTab === 'expenses') {
      rows = [['#','Date','Head','Sub Head','Amount','Added By','Role','Remark'], ...expenses.map((x,i) => [i+1, new Date(x.expenseDate||x.createdAt).toLocaleDateString('en-IN'), x.head||'', x.subHead||'', x.amount||0, x.createdBy?.name||'', x.createdBy?.role||'', x.remark||''])];
      filename = `Expenses_${period.replace(/\s/g,'_')}.csv`;
    } else if (activeTab === 'liabilities') {
      rows = [['#','Title','Total','Paid','Pending','Pay By','Remark'], ...liabilities.map((l,i) => [i+1, l.title||'', l.totalAmount||0, l.paidAmount||0, (l.totalAmount||0)-(l.paidAmount||0), l.payByDate?new Date(l.payByDate).toLocaleDateString('en-IN'):'', l.remark||''])];
      filename = `Liabilities_${period.replace(/\s/g,'_')}.csv`;
    } else {
      try {
        const p = getParams();
        const payQuery = new URLSearchParams(p);
        payQuery.append('status', 'paid');
        payQuery.append('export', 'true');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments?${payQuery.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) {
          toast.error('Failed to fetch transaction details for export');
          return;
        }
        
        const allPaidPayments = data.payments || [];
        rows = [
          ['RentalMeet Revenue & Platform Fee Report'],
          ['Period:', period],
          ['Generated:', new Date().toLocaleString('en-IN')],
          [],
          ['Summary Metrics'],
          ['Total Platform Fee (Excl. GST)', revStats.totalPlatformFee || 0],
          ['Total Platform GST', revStats.totalPlatformGST || 0],
          ['Total Platform Revenue (Incl. GST)', revenue.payment],
          ['Total Expenditure', revenue.expenditure],
          ['Total Liabilities', revenue.liab],
          ['Gross Profit', revenue.grossProfit],
          [],
          ['Detailed Revenue Statement (Bookings)'],
          [
            'S.No', 
            'Booking No', 
            'Booking Date', 
            'Customer Name', 
            'Customer Email', 
            'Venue Name', 
            'Total Booking Amount (Customer Paid)', 
            'Platform Fee (Excl. GST)', 
            'Platform GST', 
            'Total Platform Fee (Incl. GST)'
          ]
        ];

        allPaidPayments.forEach((item, index) => {
          const pb = item.priceBreakdown || {};
          const pi = item.platformInvoice || {};
          
          const platformFee = pb.platformFee || pi.platformFee || 0;
          const platformGST = pb.platformFeeGST || (pi.cgst + pi.sgst) || 0;
          const platformFeeTotal = pb.platformFeeTotal || pi.total || 0;
          
          rows.push([
            index + 1,
            item.bookingNumber || 'N/A',
            item.bookingDate ? new Date(item.bookingDate).toLocaleDateString('en-IN') : 'N/A',
            item.customer?.name || 'N/A',
            item.customer?.email || 'N/A',
            item.venue?.businessName || 'N/A',
            item.amount || 0,
            platformFee,
            platformGST,
            platformFeeTotal
          ]);
        });
        
        filename = `Revenue_Statement_${period.replace(/\s/g,'_')}.csv`;
      } catch (error) {
        toast.error('Export failed');
        return;
      }
    }
    const csv = rows.map(r => r.map(c => `"${c??''}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = filename; a.click();
    toast.success('CSV downloaded');
  };

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500';

  return (
    <AdminLayout title="Finance" subtitle="Expenses, Liabilities & Revenue">
      <PermissionGuard permission="payments">

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {['financial','custom'].map(m => (
              <button key={m} onClick={() => setDateMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateMode === m ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m === 'financial' ? 'Financial Year' : 'Custom Range'}
              </button>
            ))}
          </div>
          {dateMode === 'financial' && (
            <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {financialYears.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
            </select>
          )}
          {dateMode === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker selected={startDate} onChange={setStartDate} maxDate={endDate || new Date()} dateFormat="dd/MM/yyyy" placeholderText="From" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
              <span className="text-gray-400">—</span>
              <DatePicker selected={endDate} onChange={setEndDate} minDate={startDate} maxDate={new Date()} dateFormat="dd/MM/yyyy" placeholderText="To" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
            </div>
          )}
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold">
            <Download className="w-4 h-4" /> CSV
          </button>
          <div className="ml-auto flex gap-2">
            {activeTab === 'expenses' && (
              <>
                <button onClick={() => setShowHeadsModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <Settings className="h-4 w-4" /> Manage Heads
                </button>
                <button onClick={() => setShowAddExp(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
                  <Plus className="h-4 w-4" /> Add Expense
                </button>
              </>
            )}
            {activeTab === 'liabilities' && (
              <button onClick={() => setShowAddLib(true)} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                <Plus className="h-4 w-4" /> Add Liability
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
          {[['expenses','Expenses'],['liabilities','Liabilities'],['revenue','Revenue']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          loadingExp ? <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div> : (
            <div className="space-y-5">
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Total Expenditure</p>
                  <p className="mt-1 text-3xl font-black text-rose-700">{fmtRs(expSummary.totalExpenditure)}</p>
                  <p className="mt-1 text-xs text-rose-600">Entries: {expSummary.totalRecords}</p>
                </div>
                <Wallet className="h-8 w-8 text-rose-300" />
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                    <th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Head</th><th className="px-4 py-3 text-left">Sub Head</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">Added By</th><th className="px-4 py-3 text-left">Remark</th><th className="px-4 py-3 text-left">Actions</th>
                  </tr></thead>
                  <tbody>
                    {expenses.length === 0
                      ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No expenses found</td></tr>
                      : expenses.map((item, i) => (
                        <tr key={item._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-400">{i+1}</td>
                          <td className="px-4 py-3 text-gray-700">{new Date(item.expenseDate||item.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.head}</td>
                          <td className="px-4 py-3 text-gray-600">{item.subHead||'—'}</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600">{fmtRs(item.amount)}</td>
                          <td className="px-4 py-3 text-gray-700"><div className="font-semibold">{item.createdBy?.name||'Unknown'}</div><div className="text-xs text-gray-400">{item.createdBy?.role||'-'}</div></td>
                          <td className="px-4 py-3 text-gray-600">{item.remark||'—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => setEditingExp({ ...item, expenseDate: new Date(item.expenseDate||item.createdAt).toISOString().slice(0,10) })} className="p-1 text-blue-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteExpense(item._id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* LIABILITIES TAB */}
        {activeTab === 'liabilities' && (
          loadingLib ? <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div> : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-xs font-semibold uppercase text-orange-600">Total Liabilities</p><p className="text-2xl font-black text-orange-700 mt-1">{fmtRs(libSummary.totalAmount)}</p></div>
                <div className="rounded-xl border border-green-100 bg-green-50 p-4"><p className="text-xs font-semibold uppercase text-green-600">Total Paid</p><p className="text-2xl font-black text-green-700 mt-1">{fmtRs(libSummary.totalPaid)}</p></div>
                <div className="rounded-xl border border-red-100 bg-red-50 p-4"><p className="text-xs font-semibold uppercase text-red-600">Pending</p><p className="text-2xl font-black text-red-700 mt-1">{fmtRs(libSummary.totalPending)}</p></div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                    <th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Pending</th><th className="px-4 py-3 text-left">Pay By</th><th className="px-4 py-3 text-left">Remark</th><th className="px-4 py-3 text-left">Actions</th>
                  </tr></thead>
                  <tbody>
                    {liabilities.length === 0
                      ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No liabilities found</td></tr>
                      : liabilities.map((l, i) => {
                          const pending = (l.totalAmount||0) - (l.paidAmount||0);
                          const isOverdue = l.payByDate && new Date(l.payByDate) < new Date() && pending > 0;
                          return (
                            <tr key={l._id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                              <td className="px-4 py-3 text-xs text-gray-400">{i+1}</td>
                              <td className="px-4 py-3 font-semibold text-gray-800">
                                {l.title}
                                {isOverdue && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">OVERDUE</span>}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtRs(l.totalAmount)}</td>
                              <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmtRs(l.paidAmount)}</td>
                              <td className="px-4 py-3 text-right font-bold text-red-600">{fmtRs(pending)}</td>
                              <td className="px-4 py-3 text-gray-600">{l.payByDate ? new Date(l.payByDate).toLocaleDateString('en-IN') : '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{l.remark||'—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingLib({ ...l, payByDate: l.payByDate ? new Date(l.payByDate).toISOString().slice(0,10) : '' })} className="p-1 text-blue-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteLiability(l._id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          loadingRev ? <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div> : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Expenditure</p><p className="mt-2 text-3xl font-black text-rose-700">{fmtRs(revenue.expenditure)}</p><p className="mt-1 text-xs text-rose-500">Entries: {revExpSummary.totalRecords || 0}</p></div>
                    <div className="rounded-lg bg-white/70 p-2"><Wallet className="h-5 w-5 text-rose-400" /></div>
                  </div>
                </div>
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Liabilities</p><p className="mt-2 text-3xl font-black text-orange-700">{fmtRs(revenue.liab)}</p><p className="mt-1 text-xs text-orange-500">Paid: {fmtRs(revLibSummary.totalPaid)} · Pending: {fmtRs(revLibSummary.totalPending)}</p></div>
                    <div className="rounded-lg bg-white/70 p-2"><Wallet className="h-5 w-5 text-orange-400" /></div>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Platform Revenue</p>
                      <p className="mt-2 text-3xl font-black text-blue-700">{fmtRs(revenue.payment)}</p>
                      <p className="mt-1 text-xs text-blue-500">Platform Fee: {fmtRs(revStats.totalPlatformFee || 0)} · GST: {fmtRs(revStats.totalPlatformGST || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-2"><IndianRupee className="h-5 w-5 text-blue-400" /></div>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Gross Profit</p><p className={`mt-2 text-3xl font-black ${revenue.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmtRs(revenue.grossProfit)}</p><p className="mt-1 text-xs text-emerald-500">Revenue − Expenditure − Liabilities</p></div>
                    <div className="rounded-lg bg-white/70 p-2"><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
                  </div>
                </div>
              </div>

              {/* Platform Fee & GST Statement Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-950 text-lg">Platform Fee & GST Statement</h3>
                    <p className="text-xs text-gray-500 mt-1">Detailed list of bookings with platform fee breakdown</p>
                  </div>
                  <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full">
                    {totalRecords} Bookings
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide">
                      <tr>
                        <th className="px-6 py-4">S.No</th>
                        <th className="px-6 py-4">Booking No</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Venue</th>
                        <th className="px-6 py-4 text-right">Booking Amount</th>
                        <th className="px-6 py-4 text-right">Platform Fee</th>
                        <th className="px-6 py-4 text-right">Platform GST</th>
                        <th className="px-6 py-4 text-right">Total Fee (Incl. GST)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-6 py-12 text-center text-gray-400 font-normal">
                            No paid bookings found in this period
                          </td>
                        </tr>
                      ) : (
                        payments.map((p, index) => {
                          const pb = p.priceBreakdown || {};
                          const pi = p.platformInvoice || {};
                          
                          const platformFee = pb.platformFee || pi.platformFee || 0;
                          const platformGST = pb.platformFeeGST || (pi.cgst + pi.sgst) || 0;
                          const platformFeeTotal = pb.platformFeeTotal || pi.total || 0;
                          
                          return (
                            <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-gray-400 text-xs">
                                {(currentPage - 1) * 10 + index + 1}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-gray-900">
                                {p.bookingNumber || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                {p.bookingDate ? new Date(p.bookingDate).toLocaleDateString('en-IN') : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="max-w-[150px] truncate">
                                  <p className="text-gray-900 text-xs truncate font-semibold">{p.customer?.name || 'N/A'}</p>
                                  <p className="text-gray-400 text-[10px] truncate">{p.customer?.email || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="max-w-[150px] truncate">
                                  <p className="text-gray-900 text-xs truncate font-semibold">{p.venue?.businessName || 'N/A'}</p>
                                  <p className="text-gray-400 text-[10px] truncate">{p.venue?.location?.city || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                {fmtRs(p.amount)}
                              </td>
                              <td className="px-6 py-4 text-right text-xs">
                                {fmtRs(platformFee)}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                {fmtRs(platformGST)}
                              </td>
                              <td className="px-6 py-4 text-right text-primary-600 font-bold text-xs">
                                {fmtRs(platformFeeTotal)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs text-gray-500">
                      Showing Page {currentPage} of {totalPages} ({totalRecords} total records)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ── MODALS ── */}

        {/* Add Expense */}
        {showAddExp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold text-gray-800">Add Expense</h2><button onClick={() => setShowAddExp(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button></div>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Head <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select value={expForm.head} onChange={e => setExpForm(p => ({ ...p, head: e.target.value }))} className={`flex-1 ${inp} bg-white`}>
                      <option value="">Select Head</option>
                      {heads.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setShowAddExp(false); setShowHeadsModal(true); }} className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">+ Add Head</button>
                  </div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Sub Head</label><input type="text" placeholder="Sub Head (optional)" value={expForm.subHead} onChange={e => setExpForm(p => ({ ...p, subHead: e.target.value }))} className={inp} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Amount <span className="text-red-500">*</span></label><input type="number" placeholder="0" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="date" value={expForm.expenseDate} onChange={e => setExpForm(p => ({ ...p, expenseDate: e.target.value }))} className={inp} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Remark</label><textarea placeholder="Remark (optional)" value={expForm.remark} onChange={e => setExpForm(p => ({ ...p, remark: e.target.value }))} rows={2} className={inp} /></div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingExp} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"><Plus className="h-4 w-4" />{savingExp ? 'Saving...' : 'Add Expense'}</button>
                  <button type="button" onClick={() => setShowAddExp(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Expense */}
        {editingExp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold text-gray-800">Edit Expense</h2><button onClick={() => setEditingExp(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button></div>
              <form onSubmit={handleEditExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Head <span className="text-red-500">*</span></label>
                  <select value={editingExp.head} onChange={e => setEditingExp(p => ({ ...p, head: e.target.value }))} className={`w-full ${inp} bg-white`}>
                    <option value="">Select Head</option>
                    {heads.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Sub Head</label><input type="text" value={editingExp.subHead||''} onChange={e => setEditingExp(p => ({ ...p, subHead: e.target.value }))} className={inp} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Amount <span className="text-red-500">*</span></label><input type="number" value={editingExp.amount} onChange={e => setEditingExp(p => ({ ...p, amount: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="date" value={editingExp.expenseDate} onChange={e => setEditingExp(p => ({ ...p, expenseDate: e.target.value }))} className={inp} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Remark</label><textarea value={editingExp.remark||''} onChange={e => setEditingExp(p => ({ ...p, remark: e.target.value }))} rows={2} className={inp} /></div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingExp} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-sm disabled:opacity-60">{savingExp ? 'Saving...' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditingExp(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Liability */}
        {showAddLib && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold text-gray-800">Add Liability</h2><button onClick={() => setShowAddLib(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button></div>
              <form onSubmit={handleAddLiability} className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="text-red-500">*</span></label><input type="text" placeholder="e.g. Bank Loan EMI" value={libForm.title} onChange={e => setLibForm(p => ({ ...p, title: e.target.value }))} className={inp} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Amount <span className="text-red-500">*</span></label><input type="number" placeholder="0" value={libForm.totalAmount} onChange={e => setLibForm(p => ({ ...p, totalAmount: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Paid Amount</label><input type="number" placeholder="0" value={libForm.paidAmount} onChange={e => setLibForm(p => ({ ...p, paidAmount: e.target.value }))} className={inp} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Pay By Date</label><input type="date" value={libForm.payByDate} onChange={e => setLibForm(p => ({ ...p, payByDate: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Remark</label><textarea placeholder="Remark (optional)" value={libForm.remark} onChange={e => setLibForm(p => ({ ...p, remark: e.target.value }))} rows={2} className={inp} /></div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingLib} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"><Plus className="h-4 w-4" />{savingLib ? 'Saving...' : 'Add Liability'}</button>
                  <button type="button" onClick={() => setShowAddLib(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Liability */}
        {editingLib && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold text-gray-800">Edit Liability</h2><button onClick={() => setEditingLib(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button></div>
              <form onSubmit={handleEditLiability} className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="text-red-500">*</span></label><input type="text" value={editingLib.title||''} onChange={e => setEditingLib(p => ({ ...p, title: e.target.value }))} className={inp} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Amount <span className="text-red-500">*</span></label><input type="number" value={editingLib.totalAmount||''} onChange={e => setEditingLib(p => ({ ...p, totalAmount: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Paid Amount</label><input type="number" value={editingLib.paidAmount||''} onChange={e => setEditingLib(p => ({ ...p, paidAmount: e.target.value }))} className={inp} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Pay By Date</label><input type="date" value={editingLib.payByDate||''} onChange={e => setEditingLib(p => ({ ...p, payByDate: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Remark</label><textarea value={editingLib.remark||''} onChange={e => setEditingLib(p => ({ ...p, remark: e.target.value }))} rows={2} className={inp} /></div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingLib} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm disabled:opacity-60">{savingLib ? 'Saving...' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditingLib(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Heads */}
        {showHeadsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold text-gray-800">Manage Expense Heads</h2><button onClick={() => setShowHeadsModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button></div>
              <div className="flex gap-2 mb-5">
                <input type="text" placeholder="New head name..." value={newHeadName} onChange={e => setNewHeadName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddHead()} className={`flex-1 ${inp}`} />
                <button onClick={handleAddHead} disabled={headSaving} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{headSaving ? '...' : 'Add'}</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {heads.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No heads yet</p>
                  : heads.map(h => (
                    <div key={h._id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">{h.name}</span>
                      <button onClick={() => handleDeleteHead(h._id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
              </div>
              <button onClick={() => setShowHeadsModal(false)} className="mt-5 w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50">Close</button>
            </div>
          </div>
        )}

      </PermissionGuard>
    </AdminLayout>
  );
}
