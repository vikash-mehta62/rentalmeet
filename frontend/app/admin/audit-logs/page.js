'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuthStore } from '@/lib/store';
import {
  Shield,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Copy,
  Check,
  Building2,
  Award,
  Package,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AuditLogsPage() {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'FAILED_SUBMISSIONS'
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      let url = '';

      if (activeTab === 'FAILED_SUBMISSIONS') {
        url = `${apiBase}/admin/audit-logs/failed-submissions?page=${page}&limit=15&category=${category !== 'all' ? category : 'VENUE'}`;
      } else {
        const params = new URLSearchParams({
          page,
          limit: 15,
          category,
          status: statusFilter,
          search
        });
        url = `${apiBase}/admin/audit-logs?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, category, statusFilter, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopyPayload = (payload) => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> FAILED
          </span>
        );
      case 'ATTEMPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> ATTEMPT
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" /> {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (cat) => {
    const colors = {
      VENUE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      AMBASSADOR: 'bg-amber-50 text-amber-700 border-amber-200',
      VENDOR: 'bg-purple-50 text-purple-700 border-purple-200',
      USER: 'bg-blue-50 text-blue-700 border-blue-200',
      BOOKING: 'bg-teal-50 text-teal-700 border-teal-200',
      AUTH: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      SETTINGS: 'bg-slate-50 text-slate-700 border-slate-200',
      SUBMISSION_ATTEMPT: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${colors[cat] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {cat}
      </span>
    );
  };

  return (
    <AdminLayout title="System Audit Logs" subtitle="Track every activity, status change, and fail-safe submission payload">
      <div className="space-y-6">
        
        {/* Top Header Card & Stats */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Audit Trail & Action Logs</h1>
              <p className="text-sm text-gray-500">Real-time recording of all events, IP addresses, actor identities, and status history.</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('ALL'); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Global Logs ({total})
            </button>
            <button
              onClick={() => { setActiveTab('FAILED_SUBMISSIONS'); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'FAILED_SUBMISSIONS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:text-rose-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Failed / Attempt Submissions
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search action, name, email, IP, reason..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              <option value="VENUE">Venue</option>
              <option value="AMBASSADOR">Ambassador</option>
              <option value="VENDOR">Vendor</option>
              <option value="USER">User & Accounts</option>
              <option value="BOOKING">Booking</option>
              <option value="AUTH">Authentication</option>
              <option value="SUBMISSION_ATTEMPT">Submission Attempt</option>
            </select>

            {/* Status Filter */}
            {activeTab === 'ALL' && (
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="ATTEMPT">Attempt</option>
              </select>
            )}
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Category & Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Performed By</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No audit logs found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        <div className="font-medium text-gray-800">
                          {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Category & Action */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {getCategoryBadge(log.category)}
                          <span className="font-semibold text-gray-900 text-xs">{log.action}</span>
                          {log.reason && (
                            <span className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]" title={log.reason}>
                              💬 {log.reason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900 text-xs">{log.targetName || log.targetType || 'System'}</div>
                        {log.targetId && (
                          <div className="text-[11px] text-gray-400 font-mono">ID: {String(log.targetId).slice(-8)}</div>
                        )}
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-800 text-xs">{log.performedBy?.name || 'Anonymous'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 ml-5">
                          {log.performedBy?.role ? `[${log.performedBy.role}]` : ''} {log.performedBy?.email}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-gray-600">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          {log.ipAddress || 'unknown'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* View Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Showing page {page} of {totalPages} ({total} total entries)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Inspection Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Audit Log Inspection</h3>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                
                {/* Core Meta Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Action</span>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Category</span>
                    <p className="mt-0.5">{getCategoryBadge(selectedLog.category)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Performed By</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedLog.performedBy?.name || 'System'}</p>
                    <p className="text-[11px] text-gray-500">{selectedLog.performedBy?.email} ({selectedLog.performedBy?.role})</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Client IP & Network</span>
                    <p className="font-mono text-gray-800 mt-0.5">{selectedLog.ipAddress || 'unknown'}</p>
                    <p className="text-[11px] text-gray-500 truncate" title={selectedLog.userAgent}>{selectedLog.userAgent}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Target Entity</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedLog.targetName || selectedLog.targetType || 'N/A'}</p>
                    <p className="text-[11px] text-gray-500 font-mono">ID: {selectedLog.targetId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Exact Timestamp</span>
                    <p className="font-medium text-gray-800 mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Reason or Error message if present */}
                {(selectedLog.reason || selectedLog.errorMessage) && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                    {selectedLog.reason && (
                      <div>
                        <span className="text-amber-800 font-semibold text-[11px]">Reason: </span>
                        <span className="text-amber-900">{selectedLog.reason}</span>
                      </div>
                    )}
                    {selectedLog.errorMessage && (
                      <div>
                        <span className="text-rose-800 font-semibold text-[11px]">Error Message: </span>
                        <span className="text-rose-900">{selectedLog.errorMessage}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* State Diff (Previous vs New) */}
                {(selectedLog.previousState || selectedLog.newState) && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider">Status & State Transition</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Previous State</span>
                        <pre className="mt-1 text-[11px] font-mono text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.previousState || {}, null, 2)}
                        </pre>
                      </div>
                      <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">New State</span>
                        <pre className="mt-1 text-[11px] font-mono text-emerald-900 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.newState || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details / Preserved Payload */}
                {selectedLog.details && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider">
                        Preserved Payload / Technical Metadata
                      </span>
                      <button
                        onClick={() => handleCopyPayload(selectedLog.details)}
                        className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy Payload JSON'}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
