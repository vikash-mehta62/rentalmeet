'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  BarChart3, Users, Eye, Clock, Globe, MapPin, Smartphone,
  Monitor, Activity, RefreshCw, Filter, ShieldAlert,
  ArrowUpRight, ChevronRight, TrendingUp, Compass, Target, Layers
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const fmtNumber = (n) => (n || 0).toLocaleString('en-IN');
const fmtDuration = (sec) => {
  if (!sec || sec <= 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

function StatCard({ label, value, sub, icon: Icon, color = 'amber' }) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };
  const cls = colorMap[color] || colorMap.amber;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-start">
      <div className="space-y-1.5 flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight truncate">{value}</p>
        {sub && <p className="text-xs font-medium text-gray-500">{sub}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl border ${cls} ml-3 flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Filters State
  const [range, setRange] = useState('30days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [includeBot, setIncludeBot] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, location, pages, funnel, utm, users, logs

  useEffect(() => {
    if (token) fetchAnalyticsData();
  }, [token, range, startDate, endDate, stateFilter, cityFilter, userRoleFilter, pathFilter, includeBot]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('range', range);
      if (range === 'custom' && startDate && endDate) {
        query.set('startDate', startDate.toISOString());
        query.set('endDate', endDate.toISOString());
      }
      if (stateFilter) query.set('state', stateFilter);
      if (cityFilter) query.set('city', cityFilter);
      if (userRoleFilter) query.set('userRole', userRoleFilter);
      if (pathFilter) query.set('path', pathFilter);
      query.set('isBot', includeBot ? 'true' : 'false');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/admin/stats?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching analytics telemetry');
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};
  const locations = data?.locations || {};
  const pages = data?.pages || {};
  const tech = data?.tech || {};
  const funnel = data?.funnel || [];
  const events = data?.events || [];
  const utm = data?.utm || [];
  const users = data?.users || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <PermissionGuard permission="analytics">
      <AdminLayout
        title="Visits & Web Analytics"
        subtitle="Real-time visitor tracking, state/city location report, dwell time, and conversion funnels"
      >
        <div className="space-y-6">

          {/* Header Controls & Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/60">
                {[
                  { label: 'Today', val: 'today' },
                  { label: 'Yesterday', val: 'yesterday' },
                  { label: '1 Week', val: '1week' },
                  { label: '1 Month', val: '30days' },
                  { label: 'All Time', val: 'alltime' },
                  { label: 'Custom Date', val: 'custom' },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setRange(item.val)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      range === item.val
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Action & Toggle Controls */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={includeBot}
                    onChange={(e) => setIncludeBot(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Include Bot Traffic</span>
                </label>

                <button
                  onClick={fetchAnalyticsData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

            </div>

            {/* Custom Date Pickers & Extra Filters */}
            {range === 'custom' && (
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">From:</span>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">To:</span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="End Date"
                    className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Sub-Filters Bar (State, City, User Role, Path) */}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Filter by State (e.g. Maharashtra)..."
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Filter by City (e.g. Mumbai)..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-gray-700 font-medium"
              >
                <option value="">All Users (Guests + Logged-in)</option>
                <option value="guest">Guests Only</option>
                <option value="customer">Customers Only</option>
                <option value="vendor">Vendors Only</option>
                <option value="owner">Venue Owners Only</option>
                <option value="admin">Admins Only</option>
              </select>
              <input
                type="text"
                placeholder="Filter by Page Path (e.g. /venues)..."
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Top Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              label="Total Visits / Views"
              value={fmtNumber(summary.totalPageviews)}
              sub="Pageview events"
              icon={Eye}
              color="amber"
            />
            <StatCard
              label="Unique Devices"
              value={fmtNumber(summary.uniqueVisitors)}
              sub="Unique Visitor IDs"
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Total Sessions"
              value={fmtNumber(summary.totalSessions)}
              sub="Active sessions"
              icon={BarChart3}
              color="purple"
            />
            <StatCard
              label="Avg Session Stay"
              value={fmtDuration(summary.avgSessionDurationSeconds)}
              sub="Active dwell time"
              icon={Clock}
              color="indigo"
            />
            <StatCard
              label="Bounce Rate"
              value={`${summary.bounceRatePercent || 0}%`}
              sub="Single-page exits"
              icon={TrendingUp}
              color="rose"
            />
            {/* Real-time Live Active Visitor Pill */}
            <div className="bg-emerald-900 text-white rounded-xl border border-emerald-800 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Live Active</span>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-3xl font-black text-white mt-1">{summary.liveVisitors || 0}</p>
              <p className="text-[10px] text-emerald-300 mt-1">Active in last 90s</p>
            </div>
          </div>

          {/* Tabs Bar */}
          <div className="border-b border-gray-200 overflow-x-auto custom-scrollbar">
            <nav className="flex space-x-6 min-w-max">
              {[
                { id: 'overview', label: 'Overview & Trends', icon: BarChart3 },
                { id: 'location', label: 'State & City Location', icon: MapPin },
                { id: 'pages', label: 'Pages & Dwell Time', icon: Eye },
                { id: 'funnel', label: 'Conversion Funnel', icon: Target },
                { id: 'utm', label: 'Traffic Sources (UTM)', icon: Compass },
                { id: 'users', label: 'Registered User Journeys', icon: Users },
                { id: 'logs', label: 'Live Visitor Logs', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 border-b-2 text-xs font-bold transition-all ${
                      active
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* TAB 1: Overview & Trends */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Daily Traffic Bar Graph (Simple Visual Bars) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Daily Visit Trend</h3>
                    <p className="text-xs text-gray-500">Pageviews and unique visitors over selected date range</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span> Total Pageviews
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span> Unique Visitors
                    </span>
                  </div>
                </div>

                {data?.timeline && data.timeline.length > 0 ? (
                  <div className="h-48 flex items-end gap-2 pt-6 border-b border-gray-100 overflow-x-auto custom-scrollbar">
                    {(() => {
                      const maxVal = Math.max(...data.timeline.map((t) => t.visits || 1));
                      return data.timeline.map((t, idx) => {
                        const hVisit = Math.max(10, Math.round((t.visits / maxVal) * 100));
                        const hUnique = Math.max(8, Math.round((t.uniques / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group">
                            <div className="w-full flex items-end justify-center gap-1 h-36">
                              <div
                                style={{ height: `${hVisit}%` }}
                                className="w-2.5 bg-amber-500 rounded-t transition-all group-hover:bg-amber-600"
                                title={`${t.date}: ${t.visits} pageviews`}
                              />
                              <div
                                style={{ height: `${hUnique}%` }}
                                className="w-2.5 bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                                title={`${t.date}: ${t.uniques} unique visitors`}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 truncate w-full text-center">
                              {t.date.slice(5)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs font-bold text-gray-400">
                    No visit timeline data recorded for this filter selection.
                  </div>
                )}
              </div>

              {/* Tech Breakdown: Device, Browser, OS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Devices */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-500" /> Device Distribution
                  </h4>
                  <div className="space-y-3">
                    {tech.devices && tech.devices.length > 0 ? (
                      tech.devices.map((d, i) => {
                        const pct = summary.totalPageviews > 0 ? Math.round((d.count / summary.totalPageviews) * 100) : 0;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="capitalize text-gray-700">{d.name}</span>
                              <span className="text-gray-500">{fmtNumber(d.count)} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-amber-500 rounded-full" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400">No device data</p>
                    )}
                  </div>
                </div>

                {/* Top Browsers */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-500" /> Top Browsers
                  </h4>
                  <div className="space-y-2">
                    {tech.browsers && tech.browsers.length > 0 ? (
                      tech.browsers.map((b, i) => (
                        <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                          <span className="font-semibold text-gray-800">{b.name}</span>
                          <span className="font-bold text-gray-600">{fmtNumber(b.count)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No browser data</p>
                    )}
                  </div>
                </div>

                {/* Operating Systems */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" /> Operating Systems
                  </h4>
                  <div className="space-y-2">
                    {tech.os && tech.os.length > 0 ? (
                      tech.os.map((o, i) => (
                        <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                          <span className="font-semibold text-gray-800">{o.name}</span>
                          <span className="font-bold text-gray-600">{fmtNumber(o.count)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No OS data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: State & City Location Breakdown */}
          {activeTab === 'location' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {/* State-wise Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" /> State-Wise Traffic Report
                  </h3>
                  <span className="text-xs font-bold text-gray-400">{locations.states?.length || 0} States</span>
                </div>
                <div className="space-y-3">
                  {locations.states && locations.states.length > 0 ? (
                    locations.states.map((st, i) => {
                      const total = summary.totalPageviews || 1;
                      const pct = Math.round((st.count / total) * 100);
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-800">{i + 1}. {st.name}</span>
                            <span className="text-amber-600">{fmtNumber(st.count)} visits ({pct}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div style={{ width: `${Math.max(4, pct)}%` }} className="h-full bg-amber-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 py-6 text-center">No state location data recorded yet.</p>
                  )}
                </div>
              </div>

              {/* City-wise Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" /> City-Wise Traffic Report
                  </h3>
                  <span className="text-xs font-bold text-gray-400">{locations.cities?.length || 0} Cities</span>
                </div>
                <div className="space-y-3">
                  {locations.cities && locations.cities.length > 0 ? (
                    locations.cities.map((ct, i) => {
                      const total = summary.totalPageviews || 1;
                      const pct = Math.round((ct.count / total) * 100);
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-800">{i + 1}. {ct.name} <span className="text-[10px] text-gray-400 font-semibold">({ct.state})</span></span>
                            <span className="text-blue-600">{fmtNumber(ct.count)} visits ({pct}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div style={{ width: `${Math.max(4, pct)}%` }} className="h-full bg-blue-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 py-6 text-center">No city location data recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pages & Dwell Time */}
          {activeTab === 'pages' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Pages Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Most Visited Pages & Dwell Duration</h3>
                    <p className="text-xs text-gray-500">Pageviews, unique visitors, and active stay duration per page</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Page Path</th>
                        <th className="py-3 px-4">Pageviews</th>
                        <th className="py-3 px-4">Unique Visitors</th>
                        <th className="py-3 px-4">Avg Dwell Time</th>
                        <th className="py-3 px-4">Total Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pages.topPages && pages.topPages.length > 0 ? (
                        pages.topPages.map((pg, i) => (
                          <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900 max-w-[260px] truncate">{pg.path}</td>
                            <td className="py-3 px-4 font-bold text-amber-600">{fmtNumber(pg.pageviews)}</td>
                            <td className="py-3 px-4 font-semibold text-gray-700">{fmtNumber(pg.uniques)}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">{fmtDuration(pg.avgTimeSeconds)}</td>
                            <td className="py-3 px-4 font-medium text-gray-500">{fmtDuration(pg.totalTimeSeconds)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-400">No page metrics recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Landing vs Exit Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Landing Pages */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">Top Landing Pages (Entry)</h4>
                  <div className="space-y-2">
                    {pages.landingPages && pages.landingPages.length > 0 ? (
                      pages.landingPages.map((l, i) => (
                        <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 last:border-0">
                          <span className="font-bold text-gray-800 truncate max-w-[200px]">{l.path}</span>
                          <span className="font-bold text-amber-600">{fmtNumber(l.count)} entries</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No landing page data</p>
                    )}
                  </div>
                </div>

                {/* Exit Pages */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">Top Exit Pages (Drop-off)</h4>
                  <div className="space-y-2">
                    {pages.exitPages && pages.exitPages.length > 0 ? (
                      pages.exitPages.map((e, i) => (
                        <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-50 last:border-0">
                          <span className="font-bold text-gray-800 truncate max-w-[200px]">{e.path}</span>
                          <span className="font-bold text-rose-600">{fmtNumber(e.count)} exits</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No exit page data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Conversion Funnel */}
          {activeTab === 'funnel' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">5-Step Business Conversion Funnel</h3>
                <p className="text-xs text-gray-500">Track user progress from session landing to completed payment</p>
              </div>

              <div className="space-y-4">
                {funnel.map((step, i) => {
                  const firstCount = funnel[0]?.count || 1;
                  const pctOfStart = Math.round((step.count / firstCount) * 100);
                  const prevCount = i > 0 ? (funnel[i - 1]?.count || 1) : firstCount;
                  const dropoff = i > 0 ? Math.round(((prevCount - step.count) / prevCount) * 100) : 0;

                  return (
                    <div key={step.step} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                            {step.step}
                          </span>
                          <span className="text-xs font-bold text-gray-900">{step.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="text-amber-600">{fmtNumber(step.count)} Users ({pctOfStart}%)</span>
                          {i > 0 && <span className="text-rose-500 font-semibold">Dropoff: -{dropoff}%</span>}
                        </div>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div style={{ width: `${Math.max(3, pctOfStart)}%` }} className="h-full bg-amber-500 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Events */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3">Custom Interaction Events</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {events && events.length > 0 ? (
                    events.map((evt, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{evt.category || 'Event'}</p>
                        <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{evt.name}</p>
                        <p className="text-lg font-black text-amber-600 mt-1">{fmtNumber(evt.count)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 col-span-4">No custom interaction events logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Traffic Sources (UTM) */}
          {activeTab === 'utm' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">UTM Marketing Attribution</h3>
                  <p className="text-xs text-gray-500">Traffic origin breakdown by Campaign, Source, and Medium</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">UTM Source</th>
                      <th className="py-3 px-4">UTM Medium</th>
                      <th className="py-3 px-4">UTM Campaign</th>
                      <th className="py-3 px-4">Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {utm && utm.length > 0 ? (
                      utm.map((u, i) => (
                        <tr key={i} className="hover:bg-gray-50/80">
                          <td className="py-3 px-4 font-bold text-amber-600">{u.source}</td>
                          <td className="py-3 px-4 font-semibold text-gray-700">{u.medium}</td>
                          <td className="py-3 px-4 font-semibold text-gray-700">{u.campaign}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{fmtNumber(u.count)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-400">No UTM campaign parameters detected yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Registered User Journeys */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Registered User Activity</h3>
                <p className="text-xs text-gray-500">Most active logged-in customers, vendors, and owners</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">User Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Pageviews</th>
                      <th className="py-3 px-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users && users.length > 0 ? (
                      users.map((u, i) => (
                        <tr key={i} className="hover:bg-gray-50/80">
                          <td className="py-3 px-4 font-bold text-gray-900">{u.name || 'User'}</td>
                          <td className="py-3 px-4 font-semibold text-gray-600">{u._id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-600">{fmtNumber(u.pageviews)}</td>
                          <td className="py-3 px-4 text-gray-500">{new Date(u.lastSeen).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-400">No registered user activity logs recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: Live Visitor Activity Log Table */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Live Visitor Activity Stream</h3>
                  <p className="text-xs text-gray-500">Real-time log of recent 50 page visits with masked IPs & stay duration</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Location (City, State)</th>
                      <th className="py-3 px-4">Page Visited</th>
                      <th className="py-3 px-4">Stay Duration</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Device/Browser</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentLogs && recentLogs.length > 0 ? (
                      recentLogs.map((log) => (
                        <tr key={log._id || log.visitId} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {log.userEmail ? (
                              <div>
                                <p className="font-bold text-gray-900">{log.userName || 'User'}</p>
                                <p className="text-[10px] text-gray-400">{log.userEmail}</p>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-gray-100 text-gray-600">
                                Guest
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-gray-800">{log.city}</span>, <span className="text-gray-500">{log.state}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-600 max-w-[200px] truncate" title={log.path}>
                            {log.path}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600 whitespace-nowrap">
                            {fmtDuration(log.durationSeconds)}
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                            {log.ipMasked}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-100">
                              {log.deviceType} / {log.browser}
                            </span>
                            {log.isBot && (
                              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">
                                Bot
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400">No recent visitor activity recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </AdminLayout>
    </PermissionGuard>
  );
}
