'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { IndianRupee, Wallet, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    if (token) fetchRevenue();
  }, [token]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const [paymentRes, expenseRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const data = await paymentRes.json();
      const expenseData = await expenseRes.json();
      if (data.success && data.stats) {
        setStats({
          totalRevenue: data.stats.totalRevenue || 0
        });
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
    return {
      payment,
      expenditure,
      grossProfit: payment - expenditure
    };
  }, [stats, expenseSummary]);

  return (
    <AdminLayout title="Revenue" subtitle="System revenue summary">
      <PermissionGuard permission="payments">
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
