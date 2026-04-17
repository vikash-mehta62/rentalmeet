'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Download, Calendar, IndianRupee, Building2, Users, BookOpen, PieChart, Package, Star, Briefcase } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmt = (n) => (n || 0).toLocaleString('en-IN');
const fmtRs = (n) => `₹${fmt(n)}`;

function StatCard({ label, value, sub, color = 'text-gray-800', bg = 'bg-white' }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-100 p-4 shadow-sm`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminReports() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
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
      ['Platform Fee', fmtRs(data.revenue?.platformFee)],
      ['Owner Earnings', fmtRs(data.revenue?.ownerEarnings)],
      ['Venue GST', fmtRs(data.revenue?.venueGST)],
      ['Discounts Given', fmtRs(data.revenue?.discountGiven)],
      ['Avg Booking', fmtRs(data.revenue?.average)], [],
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <div className="space-y-6">

            {/* Revenue */}
            <section>
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <IndianRupee className="w-4 h-4 text-green-500" /> Revenue Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Grand Total" value={fmtRs(data.revenue?.grandTotal)} color="text-green-600" bg="bg-green-50" />
                <StatCard label="Venue Revenue" value={fmtRs(data.revenue?.total)} color="text-teal-600" />
                <StatCard label="Service Revenue" value={fmtRs(data.revenue?.serviceRevenue)} color="text-blue-600" />
                <StatCard label="Platform Fee Earned" value={fmtRs(data.revenue?.platformFee)} color="text-purple-600" />
                <StatCard label="Owner Earnings" value={fmtRs(data.revenue?.ownerEarnings)} color="text-orange-600" />
                <StatCard label="Venue GST Collected" value={fmtRs(data.revenue?.venueGST)} color="text-gray-700" />
                <StatCard label="Discounts Given" value={fmtRs(data.revenue?.discountGiven)} color="text-red-500" />
                <StatCard label="Avg Booking Value" value={fmtRs(data.revenue?.average)} color="text-indigo-600" />
              </div>
            </section>

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
      </PermissionGuard>
    </AdminLayout>
  );
}
