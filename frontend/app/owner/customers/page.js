'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import {
  Users,
  Search,
  Download,
  IndianRupee,
  Calendar,
  Building2,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  UserCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerCustomersPage() {
  const { token } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [stats, setStats] = useState({ totalCustomers: 0, repeatCustomers: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setFilteredCustomers(data.customers || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCustomers();
  }, [token]);

  // Filter effect
  useEffect(() => {
    let result = [...customers];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.customerId?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
      );
    }
    if (cityFilter !== 'all') {
      result = result.filter((c) => c.city?.toLowerCase() === cityFilter.toLowerCase());
    }
    setFilteredCustomers(result);
  }, [searchQuery, cityFilter, customers]);

  // Unique cities for filter
  const uniqueCities = Array.from(
    new Set(customers.map((c) => c.city).filter((c) => c && c !== 'N/A'))
  );

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    const headers = [
      'S.No',
      'Customer ID',
      'Customer Name',
      'Contact Phone',
      'Email',
      'City',
      'State',
      'Total Bookings',
      'Total Amount (INR)',
      'Last Booking Date',
      'Venues Booked'
    ];

    const rows = filteredCustomers.map((c, i) => [
      i + 1,
      `"${c.customerId || ''}"`,
      `"${c.name || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.city || ''}"`,
      `"${c.state || ''}"`,
      c.totalBookings,
      c.totalAmount,
      c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString('en-IN') : 'N/A',
      `"${(c.venues || []).join(', ')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RentalMeet_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customers exported to CSV successfully!');
  };

  return (
    <OwnerLayout title="Customer Directory" subtitle="Manage and track all customers who booked your venues">
      <div className="space-y-6 pb-12">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customers</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.totalCustomers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat Customers</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {stats.repeatCustomers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customer Revenue</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ₹{stats.totalSpent.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, email, customer ID, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {uniqueCities.length > 0 && (
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchCustomers}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredCustomers.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV ({filteredCustomers.length})</span>
            </button>
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading customer directory...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No customers found</p>
              <p className="text-[11px]">Customers who complete online or offline bookings will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">S.No.</th>
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4 text-center">Total Bookings</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4">Last Booking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredCustomers.map((c, i) => (
                    <tr key={c.customerId || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
                          {c.customerId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                        {c.venues?.length > 0 && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{c.venues.join(', ')}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {c.phone !== 'N/A' ? (
                          <a href={`tel:${c.phone}`} className="hover:text-primary-600 hover:underline">
                            {c.phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {c.email !== 'N/A' ? (
                          <a href={`mailto:${c.email}`} className="hover:text-primary-600 hover:underline">
                            {c.email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{c.city}</td>
                      <td className="py-3 px-4 text-slate-500">{c.state}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          c.totalBookings > 1
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {c.totalBookings}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{(c.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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
