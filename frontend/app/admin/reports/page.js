'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Download, Calendar, IndianRupee, Building2, Users, BookOpen, PieChart, Package, Star, Briefcase, TrendingUp, Coins, Tag, Percent, Receipt, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmt = (n) => (n || 0).toLocaleString('en-IN');
const fmtRs = (n) => `₹${fmt(n)}`;

function StatCard({ label, value, sub, color = 'text-gray-800', bg = 'bg-white', icon: Icon }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-100 p-5 shadow-sm flex justify-between items-start transition-all duration-200 hover:shadow-md`}>
      <div className="space-y-1 flex-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-normal">{sub}</p>}
      </div>
      {Icon && (
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 ml-3">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>
  );
}

export default function AdminReports() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue', 'bookings', 'settlements'
  const [dateMode, setDateMode] = useState('financial');
  const [selectedFY, setSelectedFY] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

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
    if (token && (selectedFY || (startDate && endDate))) fetchReports();
  }, [token, selectedFY, startDate, endDate, dateMode]);

  const getRange = () => {
    if (dateMode === 'financial' && selectedFY) {
      const fy = financialYears.find(f => f.value === selectedFY);
      if (!fy) return null;
      return { startDate: fy.startDate.toISOString(), endDate: fy.endDate.toISOString() };
    }
    if (dateMode === 'custom' && startDate && endDate)
      return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    return null;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const range = getRange();
      if (!range) return;
      const params = new URLSearchParams(range);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.reports);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!data) return;
    const period = dateMode === 'financial' ? selectedFY : `${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`;
    const rows = [
      ['RentalMeet Report'], ['Period:', period], ['Generated:', new Date().toLocaleString('en-IN')], [],
      ['REVENUE'],
      ['Grand Total', fmtRs(data.revenue?.grandTotal)],
      ['Venue Revenue', fmtRs(data.revenue?.total)],
      ['Service Revenue', fmtRs(data.revenue?.serviceRevenue)],
      ['Platform Fee (Combined)', fmtRs(data.revenue?.platformFee)],
      ['- Venue Platform Fee', fmtRs(data.revenue?.venuePlatformFee)],
      ['- Service Platform Fee', fmtRs(data.revenue?.servicePlatformFee)],
      ['Venue Owner Earnings', fmtRs(data.revenue?.ownerEarnings)],
      ['Vendor Earnings', fmtRs(data.revenue?.vendorEarnings)],
      ['Venue GST', fmtRs(data.revenue?.venueGST)],
      ['Service GST', fmtRs(data.revenue?.serviceGST)],
      ['Discounts Given', fmtRs(data.revenue?.discountGiven)], [],
      ['PAYOUT SETTLEMENTS'],
      ['Total Settled to Partners', fmtRs(data.settlements?.totalSettled)],
      ['Pending Settlements', fmtRs(data.settlements?.totalPending)],
      ['Venue Settled Amount', fmtRs(data.settlements?.venueSettled)],
      ['Venue Pending Settlement', fmtRs(data.settlements?.venuePending)],
      ['Service Settled Amount', fmtRs(data.settlements?.serviceSettled)],
      ['Service Pending Settlement', fmtRs(data.settlements?.servicePending)],
      ['Venue Failed Payouts', data.settlements?.venueFailedCount || 0],
      ['Service Failed Payouts', data.settlements?.serviceFailedCount || 0], [],
      ['VENUE BOOKINGS'],
      ['Total', data.bookings?.total], ['Completed', data.bookings?.completed],
      ['Confirmed', data.bookings?.confirmed], ['Pending', data.bookings?.pending],
      ['Cancelled', data.bookings?.cancelled], [],
      ['SERVICE BOOKINGS'],
      ['Total', data.svcByStatus?.total], ['Enquiry', data.svcByStatus?.enquiry],
      ['Confirmed', data.svcByStatus?.confirmed], ['Cancelled', data.svcByStatus?.cancelled],
      ['Paid', data.svcByStatus?.paid], [],
      ['USERS'],
      ['Total', data.users?.total], ['Customers', data.users?.customers],
      ['Owners', data.users?.owners], ['Vendors', data.users?.vendors],
      ['New in Period', data.users?.newInPeriod], [],
      ['VENUES'],
      ['Total', data.venues?.total], ['Approved', data.venues?.approved],
      ['Pending', data.venues?.pending], ['Rejected', data.venues?.rejected], [],
      ['VENDOR SERVICES'],
      ['Total', data.services?.total], ['Approved', data.services?.approved], [],
      ['VENUE PAYMENTS'],
      ['Paid', data.payments?.paid, fmtRs(data.payments?.paidAmount)],
      ['Pending', data.payments?.pending, fmtRs(data.payments?.pendingAmount)],
      ['Failed', data.payments?.failed, fmtRs(data.payments?.failedAmount)],
      ['Refunded', data.payments?.refunded, fmtRs(data.payments?.refundedAmount)], [],
      ['SERVICE PAYMENTS'],
      ['Paid', data.svcPayments?.paid, fmtRs(data.svcPayments?.paidAmount)],
      ['Pending', data.svcPayments?.pending, fmtRs(data.svcPayments?.pendingAmount)],
      ['Failed', data.svcPayments?.failed, fmtRs(data.svcPayments?.failedAmount)], [],
      ['TOP VENUES BY REVENUE'], ['Name', 'City', 'Revenue', 'Bookings'],
      ...(data.topVenues || []).map(v => [v.name, v.city, fmtRs(v.revenue), v.bookings]), [],
      ['TOP OWNERS BY EARNINGS'], ['Name', 'Email', 'Earnings', 'Bookings'],
      ...(data.topOwners || []).map(o => [o.name, o.email, fmtRs(o.earnings), o.bookings]), [],
      ['TOP VENDORS BY SERVICE REVENUE'], ['Name', 'Email', 'Revenue', 'Bookings'],
      ...(data.topVendors || []).map(v => [v.name, v.email, fmtRs(v.revenue), v.bookings]), [],
      ['TOP SERVICES BY REVENUE'], ['Service', 'Category', 'Vendor', 'Revenue', 'Bookings'],
      ...(data.topServices || []).map(s => [s.title, s.category, s.vendor, fmtRs(s.revenue), s.bookings]),
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `RentalMeet_Report_${period.replace(/\s/g, '_')}.csv`;
    a.click();
    toast.success('Exported!');
  };

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Comprehensive business insights">
      <PermissionGuard permission="reports">

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
          <button onClick={handleExport} disabled={!data}
            className="ml-auto flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap scrollbar-thin">
          {[
            { id: 'revenue', label: 'Revenue & Earnings', icon: TrendingUp },
            { id: 'bookings', label: 'Bookings & Stats', icon: BookOpen },
            { id: 'settlements', label: 'Payout Settlements', icon: Coins }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  activeTab === t.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50/20'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <div className="space-y-6">

            {/* TAB 1: REVENUE & EARNINGS */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                {/* Platform Financial Summary */}
                <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4 text-green-500" /> Platform Financial Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Grand Total Revenue" value={fmtRs(data.revenue?.grandTotal)} color="text-green-600" bg="bg-green-50" icon={TrendingUp} sub="Combined booking and service volume" />
                    <StatCard label="Platform Fee Earned + GST" value={fmtRs(data.revenue?.platformFee)} color="text-purple-600" sub={`Venue: ${fmtRs(data.revenue?.venuePlatformFee)} • Service: ${fmtRs(data.revenue?.servicePlatformFee)}`} icon={Coins} />
                    <StatCard label="Coupon Discounts" value={fmtRs(data.revenue?.discountGiven)} color="text-red-500" sub="Total discounts given to customers" icon={Tag} />
                  </div>
                </section>

                {/* Venue Financials */}
                <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Building2 className="w-4 h-4 text-teal-600" /> Venue Revenue & Earnings
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Venue Revenue" value={fmtRs(data.revenue?.total)} color="text-teal-600" sub="Total from venue bookings" icon={Building2} />
                    <StatCard label="Venue Owner Earnings" value={fmtRs(data.revenue?.ownerEarnings)} color="text-orange-600" sub="Amount paid to venue owners" icon={Users} />
                    <StatCard label="Venue Platform Fee" value={fmtRs(data.revenue?.venuePlatformFee)} color="text-purple-600" sub="Earnings from venue commission" icon={Percent} />
                    <StatCard label="Venue GST Collected" value={fmtRs(data.revenue?.venueGST)} color="text-gray-700" sub="GST on venue services (govt)" icon={Receipt} />
                  </div>
                </section>

                {/* Vendor & Service Financials */}
                <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Briefcase className="w-4 h-4 text-blue-600" /> Vendor & Service Revenue & Earnings
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Service Revenue" value={fmtRs(data.revenue?.serviceRevenue)} color="text-blue-600" sub="Total from vendor services" icon={Briefcase} />
                    <StatCard label="Vendor Earnings" value={fmtRs(data.revenue?.vendorEarnings)} color="text-indigo-600" sub="Amount paid to service vendors" icon={Users} />
                    <StatCard label="Service Platform Fee" value={fmtRs(data.revenue?.servicePlatformFee)} color="text-purple-600" sub="Earnings from vendor commission" icon={Percent} />
                    <StatCard label="Service GST Collected" value={fmtRs(data.revenue?.serviceGST)} color="text-gray-700" sub="GST on vendor services (govt)" icon={Receipt} />
                  </div>
                </section>

                {/* Top Tables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Top Venues by Revenue</h2>
                    {!(data.topVenues?.length) ? <p className="text-xs text-gray-400">No data</p> :
                      data.topVenues.map((v, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <div><p className="text-xs font-semibold text-gray-800">{v.name}</p><p className="text-[10px] text-gray-400">{v.city} · {v.bookings} bookings</p></div>
                          <span className="text-sm font-bold text-green-600">{fmtRs(v.revenue)}</span>
                        </div>
                      ))}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-orange-500" /> Top Owners by Earnings</h2>
                    {!(data.topOwners?.length) ? <p className="text-xs text-gray-400">No data</p> :
                      data.topOwners.map((o, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <div><p className="text-xs font-semibold text-gray-800">{o.name}</p><p className="text-[10px] text-gray-400">{o.email} · {o.bookings} bookings</p></div>
                          <span className="text-sm font-bold text-orange-600">{fmtRs(o.earnings)}</span>
                        </div>
                      ))}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Top Vendors by Revenue</h2>
                    {!(data.topVendors?.length) ? <p className="text-xs text-gray-400">No data</p> :
                      data.topVendors.map((v, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <div><p className="text-xs font-semibold text-gray-800">{v.name}</p><p className="text-[10px] text-gray-400">{v.email} · {v.bookings} bookings</p></div>
                          <span className="text-sm font-bold text-blue-600">{fmtRs(v.revenue)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Services */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-purple-500" /> Top Services by Revenue</h2>
                  {!(data.topServices?.length) ? <p className="text-xs text-gray-400">No data</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-xs font-semibold text-gray-500">Service</th>
                          <th className="text-left py-2 text-xs font-semibold text-gray-500">Category</th>
                          <th className="text-left py-2 text-xs font-semibold text-gray-500">Vendor</th>
                          <th className="text-right py-2 text-xs font-semibold text-gray-500">Bookings</th>
                          <th className="text-right py-2 text-xs font-semibold text-gray-500">Revenue</th>
                        </tr></thead>
                        <tbody>
                          {data.topServices.map((s, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 font-semibold text-gray-800">{s.title}</td>
                              <td className="py-2 text-gray-500 text-xs">{s.category}</td>
                              <td className="py-2 text-gray-500 text-xs">{s.vendor}</td>
                              <td className="py-2 text-right text-gray-700">{s.bookings}</td>
                              <td className="py-2 text-right font-bold text-purple-600">{fmtRs(s.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: BOOKINGS & STATS */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                {/* Bookings */}
                <section>
                  <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Venue Bookings
                  </h2>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Total', value: data.bookings?.total, color: 'text-blue-600' },
                      { label: 'Completed', value: data.bookings?.completed, color: 'text-green-600' },
                      { label: 'Confirmed', value: data.bookings?.confirmed, color: 'text-teal-600' },
                      { label: 'Pending', value: data.bookings?.pending, color: 'text-yellow-600' },
                      { label: 'Cancelled', value: data.bookings?.cancelled, color: 'text-red-500' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                        <p className="text-[11px] text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value || 0}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Service Bookings */}
                <section>
                  <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <Briefcase className="w-4 h-4 text-purple-500" /> Service Bookings
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Total', value: data.svcByStatus?.total, color: 'text-purple-600' },
                      { label: 'Enquiry', value: data.svcByStatus?.enquiry, color: 'text-yellow-600' },
                      { label: 'Confirmed', value: data.svcByStatus?.confirmed, color: 'text-teal-600' },
                      { label: 'Cancelled', value: data.svcByStatus?.cancelled, color: 'text-red-500' },
                      { label: 'Paid', value: data.svcByStatus?.paid, color: 'text-green-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                        <p className="text-[11px] text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value || 0}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Users + Venues + Services + Payments */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> Users</h2>
                    {[
                      { label: 'Total Users', value: data.users?.total, color: 'text-purple-600' },
                      { label: 'Customers', value: data.users?.customers, color: 'text-green-600' },
                      { label: 'Venue Owners', value: data.users?.owners, color: 'text-orange-600' },
                      { label: 'Vendors', value: data.users?.vendors, color: 'text-blue-600' },
                      { label: 'New in Period', value: data.users?.newInPeriod, color: 'text-teal-600' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{r.label}</span>
                        <span className={`text-sm font-bold ${r.color}`}>{r.value || 0}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-orange-500" /> Venues</h2>
                    {[
                      { label: 'Total', value: data.venues?.total, color: 'text-orange-600' },
                      { label: 'Approved', value: data.venues?.approved, color: 'text-green-600' },
                      { label: 'Pending', value: data.venues?.pending, color: 'text-yellow-600' },
                      { label: 'Rejected', value: data.venues?.rejected, color: 'text-red-500' },
                      { label: 'Avg Bookings/Venue', value: data.venues?.avgBookings, color: 'text-blue-600' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{r.label}</span>
                        <span className={`text-sm font-bold ${r.color}`}>{r.value || 0}</span>
                      </div>
                    ))}
                    <h2 className="text-sm font-bold text-gray-700 mt-4 mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-blue-500" /> Services</h2>
                    {[
                      { label: 'Total Services', value: data.services?.total, color: 'text-blue-600' },
                      { label: 'Approved', value: data.services?.approved, color: 'text-green-600' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{r.label}</span>
                        <span className={`text-sm font-bold ${r.color}`}>{r.value || 0}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><PieChart className="w-4 h-4 text-indigo-500" /> Venue Payments</h2>
                    {[
                      { label: 'Paid', count: data.payments?.paid, amt: data.payments?.paidAmount, color: 'text-green-600' },
                      { label: 'Pending', count: data.payments?.pending, amt: data.payments?.pendingAmount, color: 'text-yellow-600' },
                      { label: 'Failed', count: data.payments?.failed, amt: data.payments?.failedAmount, color: 'text-red-500' },
                      { label: 'Refunded', count: data.payments?.refunded, amt: data.payments?.refundedAmount, color: 'text-gray-500' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{r.label} <span className="text-gray-400">({r.count || 0})</span></span>
                        <span className={`text-sm font-bold ${r.color}`}>{fmtRs(r.amt)}</span>
                      </div>
                    ))}
                    <h2 className="text-sm font-bold text-gray-700 mt-4 mb-2 flex items-center gap-2"><PieChart className="w-4 h-4 text-purple-500" /> Service Payments</h2>
                    {[
                      { label: 'Paid', count: data.svcPayments?.paid, amt: data.svcPayments?.paidAmount, color: 'text-green-600' },
                      { label: 'Pending', count: data.svcPayments?.pending, amt: data.svcPayments?.pendingAmount, color: 'text-yellow-600' },
                      { label: 'Failed', count: data.svcPayments?.failed, amt: data.svcPayments?.failedAmount, color: 'text-red-500' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{r.label} <span className="text-gray-400">({r.count || 0})</span></span>
                        <span className={`text-sm font-bold ${r.color}`}>{fmtRs(r.amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAYOUT SETTLEMENTS */}
            {activeTab === 'settlements' && (
              <div className="space-y-6">
                {/* Platform Settlements Overview */}
                <section className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Coins className="w-4 h-4 text-purple-600" /> Settlements Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Total Settled (Released)" value={fmtRs(data.settlements?.totalSettled)} color="text-green-600" bg="bg-green-50" icon={CheckCircle} sub="Amount disbursed to venue owners & vendors" />
                    <StatCard label="Pending Settlements" value={fmtRs(data.settlements?.totalPending)} color="text-yellow-600" bg="bg-yellow-50" icon={Clock} sub="Completed bookings amount held on platform" />
                    <StatCard label="Failed Settlements" value={`${data.settlements?.venueFailedCount + data.settlements?.serviceFailedCount}`} color="text-red-600" bg="bg-red-50" icon={AlertCircle} sub="Payouts failed due to bank details or API issues" />
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Venue Owner Payouts */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Building2 className="w-4 h-4 text-teal-600" /> Venue Owner Settlements
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Venue Settled Amount</span>
                        <span className="text-sm font-bold text-green-600">{fmtRs(data.settlements?.venueSettled)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Venue Pending Settlement</span>
                        <span className="text-sm font-bold text-yellow-600">{fmtRs(data.settlements?.venuePending)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-sm text-gray-500">Failed Settlements Count</span>
                        <span className={`text-sm font-bold ${data.settlements?.venueFailedCount > 0 ? 'text-red-600 font-extrabold' : 'text-gray-500'}`}>
                          {data.settlements?.venueFailedCount || 0} failed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Service Payouts */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Briefcase className="w-4 h-4 text-blue-600" /> Vendor Service Settlements
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Vendor Settled Amount</span>
                        <span className="text-sm font-bold text-green-600">{fmtRs(data.settlements?.serviceSettled)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Vendor Pending Settlement</span>
                        <span className="text-sm font-bold text-yellow-600">{fmtRs(data.settlements?.servicePending)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-sm text-gray-500">Failed Settlements Count</span>
                        <span className={`text-sm font-bold ${data.settlements?.serviceFailedCount > 0 ? 'text-red-600 font-extrabold' : 'text-gray-500'}`}>
                          {data.settlements?.serviceFailedCount || 0} failed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Payout Records */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Receipt className="w-4 h-4 text-purple-600" /> Individual Settlement Payout Records
                  </h4>
                  {!(data.settlements?.records?.length) ? (
                    <p className="text-xs text-gray-400 py-4 text-center">No completed payout records found in this period.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 text-xs font-semibold text-gray-500">Booking #</th>
                            <th className="text-left py-2 text-xs font-semibold text-gray-500">Partner (Beneficiary)</th>
                            <th className="text-left py-2 text-xs font-semibold text-gray-500">Type</th>
                            <th className="text-right py-2 text-xs font-semibold text-gray-500">Booking Amount</th>
                            <th className="text-right py-2 text-xs font-semibold text-gray-500">Payout Amount</th>
                            <th className="text-center py-2 text-xs font-semibold text-gray-500">Settlement Status</th>
                            <th className="text-left py-2 text-xs font-semibold text-gray-500 pl-4">Transaction ID / Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.settlements.records.map((r, idx) => (
                            <tr 
                              key={r.id || idx} 
                              onClick={() => setSelectedRecord(r)}
                              className="border-b border-gray-50 last:border-0 hover:bg-primary-50/40 cursor-pointer transition-colors"
                              title="Click to view full settlement details"
                            >
                              <td className="py-3 font-semibold text-gray-800">
                                <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                  {r.bookingNumber}
                                </code>
                              </td>
                              <td className="py-3">
                                <p className="font-semibold text-gray-800 text-xs">{r.businessName}</p>
                                <p className="text-[10px] text-gray-400">{r.partnerName} ({r.partnerEmail})</p>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  r.type === 'venue' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {r.type}
                                </span>
                              </td>
                              <td className="py-3 text-right text-gray-500 text-xs">{fmtRs(r.totalAmount)}</td>
                              <td className="py-3 text-right font-bold text-green-600">{fmtRs(r.payoutAmount)}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  r.settlementStatus === 'settled' ? 'bg-green-100 text-green-700' :
                                  r.settlementStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {r.settlementStatus || 'unsettled'}
                                </span>
                              </td>
                              <td className="py-3 pl-4">
                                {r.settlementDetails?.transactionId ? (
                                  <div>
                                    <code className="text-[10px] font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded select-all block max-w-[150px] truncate" title={r.settlementDetails.transactionId}>
                                      {r.settlementDetails.transactionId}
                                    </code>
                                    {r.settlementDetails?.settledAt && (
                                      <span className="text-[9px] text-gray-400 block mt-0.5">
                                        {new Date(r.settlementDetails.settledAt).toLocaleDateString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">
                                    {r.settlementDetails?.remarks || 'Pending settlement trigger'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Info Tip */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">About Payout Settlements</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Settle amount of bookings is processed automatically once bookings are marked as <strong>Completed</strong>. Platform commissions/fees are retained, and beneficiary shares are settled based on their registered bank account details. If any payout fails, details can be checked and manually settled inside the <strong>Payments Management</strong> and <strong>Vendor Payments</strong> panels.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Payout Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in duration-200">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedRecord(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="space-y-1 pb-4 border-b border-gray-100">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedRecord.type === 'venue' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {selectedRecord.type} Settlement
                </span>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-1">
                  <Receipt className="w-5 h-5 text-purple-600" /> Booking #{selectedRecord.bookingNumber}
                </h3>
                <p className="text-xs text-gray-400">Completed on {new Date(selectedRecord.completedAt).toLocaleString('en-IN')}</p>
              </div>

              {/* Content */}
              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Business and Beneficiary Information */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Beneficiary Partner</h4>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{selectedRecord.businessName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Name: {selectedRecord.partnerName}</p>
                    <p className="text-xs text-gray-500">Email: {selectedRecord.partnerEmail}</p>
                  </div>
                </div>

                {/* Payment & Payout breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Paid by Customer</span>
                    <p className="text-base font-bold text-gray-800">{fmtRs(selectedRecord.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/50 space-y-1">
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Beneficiary Share</span>
                    <p className="text-base font-bold text-green-600">{fmtRs(selectedRecord.payoutAmount)}</p>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-1.5">
                    <Building2 className="w-4 h-4 text-gray-400" /> Receiving Bank Account
                  </h4>
                  {selectedRecord.bankDetails ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                      <div>
                        <p className="text-gray-400 font-normal">Holder Name</p>
                        <p className="text-gray-800 font-semibold mt-0.5">{selectedRecord.bankDetails.accountHolderName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-normal">Account Number</p>
                        <p className="text-gray-800 font-mono font-semibold mt-0.5 select-all">{selectedRecord.bankDetails.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-normal">Bank Name</p>
                        <p className="text-gray-800 font-semibold mt-0.5">
                          {selectedRecord.bankDetails.bankName || 'N/A'} {selectedRecord.bankDetails.branchName ? `(${selectedRecord.bankDetails.branchName})` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-normal">IFSC Code</p>
                        <p className="text-gray-800 font-mono font-semibold mt-0.5 select-all">{selectedRecord.bankDetails.ifscCode || 'N/A'}</p>
                      </div>
                      {selectedRecord.bankDetails.accountType && (
                        <div className="col-span-2 border-t border-gray-50 pt-2 flex justify-between items-center">
                          <span className="text-gray-400 font-normal">Account Type</span>
                          <span className="text-gray-800 font-semibold uppercase">{selectedRecord.bankDetails.accountType}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 font-semibold italic">Bank account details not linked or unavailable.</p>
                  )}
                </div>

                {/* Settlement Transaction Status */}
                <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-1.5">
                    <Coins className="w-4 h-4 text-gray-400" /> Payout Status & Details
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                      <span className="text-gray-500">Settlement Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        selectedRecord.settlementStatus === 'settled' ? 'bg-green-100 text-green-700' :
                        selectedRecord.settlementStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedRecord.settlementStatus || 'unsettled'}
                      </span>
                    </div>

                    {selectedRecord.settlementDetails?.transactionId && (
                      <div className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-gray-500">Transaction Reference</span>
                        <code className="font-mono text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded select-all font-semibold">
                          {selectedRecord.settlementDetails.transactionId}
                        </code>
                      </div>
                    )}

                    {selectedRecord.settlementDetails?.settledAt && (
                      <div className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-gray-500">Disbursed Date</span>
                        <span className="text-gray-800 font-semibold">
                          {new Date(selectedRecord.settlementDetails.settledAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500">Settlement Method</span>
                      <span className="text-gray-800 font-semibold uppercase">
                        {selectedRecord.settlementDetails?.settlementMethod || 'automatic'}
                      </span>
                    </div>

                    {selectedRecord.settlementDetails?.remarks && (
                      <div className="space-y-1 pt-1.5">
                        <p className="text-gray-500">Remarks / Transaction Log:</p>
                        <div className="p-3 bg-gray-50 rounded-lg text-[11px] font-medium text-gray-700 border border-gray-100 leading-relaxed font-sans select-text">
                          {selectedRecord.settlementDetails.remarks}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer / Done Button */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </AdminLayout>
  );
}
