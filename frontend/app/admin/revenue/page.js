'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { IndianRupee, Wallet, TrendingUp, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmtRs = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

function StatCard({ title, value, note, icon: Icon, tone }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          {note ? <p className="mt-1 text-xs opacity-80">{note}</p> : null}
        </div>
        <div className="rounded-lg bg-white/70 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenuePage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0 });
  const [expenseSummary, setExpenseSummary] = useState({ totalExpenditure: 0, totalRecords: 0 });

  // Date filter state
  const [dateMode, setDateMode] = useState('financial');
  const [selectedFY, setSelectedFY] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    const years = [];
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < 10; i++) {
      const s = fyStart - i, e = s + 1;
      years.push({ label: `FY ${s}-${e}`, value: `${s}-${e}`, startDate: new Date(s, 3, 1), endDate: new Date(e, 2, 31, 23, 59, 59) });
    }
    setFinancialYears(years);
    setSelectedFY(years[0].value);
  }, []);

  useEffect(() => {
    if (token && (selectedFY || (startDate && endDate))) fetchRevenue();
  }, [token, selectedFY, startDate, endDate, dateMode]);

  const getRange = () => {
    if (dateMode === 'financial' && selectedFY) {
      const fy = financialYears.find(f => f.value === selectedFY);
      if (!fy) return null;
      // fyYear = start year e.g. "2025" for FY 2025-26
      const fyYear = fy.value.split('-')[0];
      return { dateFilter: 'fy', fyYear };
    }
    if (dateMode === 'custom' && startDate && endDate) {
      const pad = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
      return { dateFilter: 'custom', from: pad(startDate), to: pad(endDate) };
    }
    return null;
  };

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const range = getRange();
      const paymentParams = range ? `?${new URLSearchParams(range)}` : '';
      const [paymentRes, expenseRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments${paymentParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const data = await paymentRes.json();
      const expenseData = await expenseRes.json();
      if (data.success) {
        setStats({ totalRevenue: data.stats?.totalRevenue || 0 });
        setExpenseSummary(expenseData?.summary || { totalExpenditure: 0, totalRecords: 0 });
      } else {
        toast.error('Revenue data load failed');
      }
    } catch {
      toast.error('Revenue data load failed');
    } finally {
      setLoading(false);
    }
  };

  const revenue = useMemo(() => {
    const payment = stats.totalRevenue || 0;
    const expenditure = expenseSummary.totalExpenditure || 0;
    return { payment, expenditure, grossProfit: payment - expenditure };
  }, [stats, expenseSummary]);

  const handleExportCSV = () => {
    const period = dateMode === 'financial'
      ? selectedFY
      : `${startDate?.toLocaleDateString('en-IN')} to ${endDate?.toLocaleDateString('en-IN')}`;
    const rows = [
      ['RentalMeet Revenue Report'],
      ['Period:', period],
      ['Generated:', new Date().toLocaleString('en-IN')],
      [],
      ['Metric', 'Amount'],
      ['Total Payment Received', revenue.payment],
      ['Total Expenditure', revenue.expenditure],
      ['Gross Profit', revenue.grossProfit],
      ['Expense Records', expenseSummary.totalRecords || 0],
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `Revenue_${period.replace(/\s/g, '_')}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  return (
    <AdminLayout title="Revenue" subtitle="System revenue summary">
      <PermissionGuard permission="revenue">

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
              <DatePicker selected={startDate} onChange={setStartDate} maxDate={endDate || new Date()} dateFormat="dd/MM/yyyy" placeholderText="From" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
              <span className="text-gray-400">—</span>
              <DatePicker selected={endDate} onChange={setEndDate} minDate={startDate} maxDate={new Date()} dateFormat="dd/MM/yyyy" placeholderText="To" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
            </div>
          )}
          <button onClick={handleExportCSV} disabled={loading}
            className="ml-auto flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Expenditure"
                value={fmtRs(revenue.expenditure)}
                note={`Manual expense entries (${expenseSummary.totalRecords || 0})`}
                icon={Wallet}
                tone="bg-rose-50 border-rose-100 text-rose-700"
              />
              <StatCard
                title="Payment"
                value={fmtRs(revenue.payment)}
                note="Total paid amount received"
                icon={IndianRupee}
                tone="bg-blue-50 border-blue-100 text-blue-700"
              />
              <StatCard
                title="Gross Profit"
                value={fmtRs(revenue.grossProfit)}
                note="Payment - Expenditure"
                icon={TrendingUp}
                tone="bg-emerald-50 border-emerald-100 text-emerald-700"
              />
            </div>
          </div>
        )}
      </PermissionGuard>
    </AdminLayout>
  );
}
