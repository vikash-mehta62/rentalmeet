'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus, Edit, Trash2, CheckCircle2, Clock, XCircle,
  AlertCircle, Briefcase, MapPin, IndianRupee, Search,
  Power, PowerOff, CalendarX, X, ChevronDown, ChevronUp
} from 'lucide-react';

const STATUS = {
  approved:     { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle2, label: 'Approved' },
  pending:      { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock,        label: 'Pending Review' },
  resubmitted:  { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Clock,        label: 'Resubmitted' },
  rejected:     { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle,      label: 'Rejected' },
  draft:        { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: AlertCircle,  label: 'Draft' },
};

// ── Block Dates Modal ─────────────────────────────────────────────────────
function BlockDatesModal({ svc, token, onClose, onSaved }) {
  const [blockedDates, setBlockedDates] = useState(
    (svc.blockedDates || []).map(b => ({ date: new Date(b.date).toISOString().slice(0,10), reason: b.reason || '' }))
  );
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [saving, setSaving] = useState(false);

  const addDate = () => {
    if (!newDate) return;
    if (blockedDates.find(b => b.date === newDate)) { toast.error('Date already added'); return; }
    setBlockedDates(p => [...p, { date: newDate, reason: newReason || 'Blocked by vendor' }]);
    setNewDate(''); setNewReason('');
  };

  const removeDate = (date) => setBlockedDates(p => p.filter(b => b.date !== date));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${svc._id}/blocked-dates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blockedDates })
      });
      const data = await res.json();
      if (data.success) { toast.success('Blocked dates saved'); onSaved(data.service); onClose(); }
      else toast.error(data.message);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Block Dates — {svc.title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Add new date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Add Date to Block</label>
            <div className="flex gap-2">
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0,10)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              <button onClick={addDate} className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors">Add</button>
            </div>
            <input type="text" placeholder="Reason (optional)" value={newReason} onChange={e => setNewReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>

          {/* Blocked list */}
          <div className="max-h-52 overflow-y-auto space-y-1.5">
            {blockedDates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No dates blocked</p>
            ) : blockedDates.sort((a,b) => a.date.localeCompare(b.date)).map(b => (
              <div key={b.date} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    {new Date(b.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {b.reason && <p className="text-[10px] text-gray-500">{b.reason}</p>}
                </div>
                <button onClick={() => removeDate(b.date)} className="text-red-400 hover:text-red-600 p-1"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorServices() {
  const { token } = useAuthStore();
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedHistory, setExpandedHistory] = useState({});
  const [blockModal, setBlockModal] = useState(null); // svc object

  const fetchServices = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { setServices(data.services); setFiltered(data.services); }
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchServices(); }, [token]);

  useEffect(() => {
    let f = [...services];
    if (statusFilter !== 'all') f = f.filter(s => s.status === statusFilter);
    if (search) f = f.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(f);
  }, [services, statusFilter, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) { toast.success('Deleted'); setServices(p => p.filter(s => s._id !== id)); }
    else toast.error(data.message);
  };

  const handleSubmit = async (id) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${id}/submit`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) { toast.success('Submitted for review!'); fetchServices(); }
    else toast.error(data.message);
  };

  const handleResubmit = async (id) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${id}/resubmit`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) { toast.success('Resubmitted for review!'); fetchServices(); }
    else toast.error(data.message);
  };

  const handleToggleActive = async (id) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${id}/toggle-active`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data.message);
      setServices(p => p.map(s => s._id === id ? { ...s, isActive: data.service.isActive } : s));
    } else toast.error(data.message);
  };

  const stats = {
    total:        services.length,
    approved:     services.filter(s => s.status === 'approved').length,
    pending:      services.filter(s => s.status === 'pending' || s.status === 'resubmitted').length,
    rejected:     services.filter(s => s.status === 'rejected').length,
  };

  if (loading) return (
    <VendorLayout title="My Services" subtitle="Loading...">
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </VendorLayout>
  );

  return (
    <>
    <VendorLayout title="My Services" subtitle={`${filtered.length} service(s)`}>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'All',      value: stats.total,    filter: 'all',      active: statusFilter === 'all' },
          { label: 'Approved', value: stats.approved, filter: 'approved', active: statusFilter === 'approved' },
          { label: 'Pending',  value: stats.pending,  filter: 'pending',  active: statusFilter === 'pending' },
          { label: 'Rejected', value: stats.rejected, filter: 'rejected', active: statusFilter === 'rejected' },
        ].map(({ label, value, filter, active }) => (
          <button key={filter} onClick={() => setStatusFilter(filter)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search services..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
        </div>
        {services.length >= 1 ? (
          <button
            onClick={() => toast.error('You can only list a maximum of one service on this platform.')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 cursor-not-allowed text-gray-400 rounded-xl text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        ) : (
          <Link href="/vendor/services/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" /> Add Service
          </Link>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Briefcase className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {services.length > 0 ? 'No matching services' : 'No services found'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {services.length > 0 
              ? 'Try adjusting your search query or filters.' 
              : 'Add your first service to start receiving enquiries.'}
          </p>
          {services.length === 0 && (
            <Link href="/vendor/services/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Add Service
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(svc => {
            const st = STATUS[svc.status] || STATUS.draft;
            const Icon = st.icon;
            return (
              <div key={svc._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
                    {svc.featuredImage
                      ? <img src={svc.featuredImage} alt={svc.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Briefcase className="w-8 h-8 text-gray-300" /></div>}
                    {svc.status === 'approved' && !svc.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <PowerOff className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-gray-900">{svc.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{svc.category}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${st.bg} ${st.text}`}>
                        <Icon className="w-3 h-3" /> {st.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {svc.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{svc.city}</span>}
                      {svc.startingPrice && <span className="flex items-center gap-1 text-primary-600 font-semibold"><IndianRupee className="w-3 h-3" />₹{svc.startingPrice.toLocaleString()}+</span>}
                    </div>

                    {svc.status === 'rejected' && svc.rejectionReason && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Rejected by Admin
                        </p>
                        <p className="text-xs text-red-600 bg-white border border-red-200 rounded-lg px-2 py-1.5">
                          <strong>Reason:</strong> {svc.rejectionReason}
                        </p>
                        {/* Rejection History */}
                        {svc.rejectionHistory?.length > 1 && (
                          <div>
                            <button
                              onClick={() => setExpandedHistory(p => ({ ...p, [svc._id]: !p[svc._id] }))}
                              className="text-xs text-red-500 hover:underline flex items-center gap-1">
                              {expandedHistory[svc._id] ? '▲ Hide' : '▼ Show'} rejection history ({svc.rejectionHistory.length} times)
                            </button>
                            {expandedHistory[svc._id] && (
                              <div className="mt-2 space-y-1.5">
                                {[...svc.rejectionHistory].reverse().map((h, i) => (
                                  <div key={i} className="bg-white border border-red-100 rounded-lg px-2 py-1.5 text-xs">
                                    <span className="text-gray-400">{new Date(h.rejectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — </span>
                                    <span className="text-gray-700">{h.reason}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {svc.status === 'resubmitted' && (
                      <p className="text-xs text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded-lg">
                        ↻ Resubmitted — awaiting admin review
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Link href={`/vendor/services/${svc._id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                      {svc.status === 'draft' && (
                        <button onClick={() => handleSubmit(svc._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Submit for Review
                        </button>
                      )}
                      {svc.status === 'rejected' && (
                        <button onClick={() => handleResubmit(svc._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resubmit for Review
                        </button>
                      )}
                      {/* Toggle active — only for approved services */}
                      {svc.status === 'approved' && (
                        <>
                          <button onClick={() => handleToggleActive(svc._id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              svc.isActive
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                                : 'bg-green-50 hover:bg-green-100 text-green-700'
                            }`}>
                            {svc.isActive ? <><PowerOff className="w-3.5 h-3.5" /> Deactivate</> : <><Power className="w-3.5 h-3.5" /> Activate</>}
                          </button>
                          <button onClick={() => setBlockModal(svc)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">
                            <CalendarX className="w-3.5 h-3.5" /> Block Dates
                            {svc.blockedDates?.length > 0 && (
                              <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{svc.blockedDates.length}</span>
                            )}
                          </button>
                        </>
                      )}
                      {svc.status !== 'approved' && svc.status !== 'resubmitted' && (
                        <button onClick={() => handleDelete(svc._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VendorLayout>

    {blockModal && (
      <BlockDatesModal
        svc={blockModal}
        token={token}
        onClose={() => setBlockModal(null)}
        onSaved={(updated) => setServices(p => p.map(s => s._id === updated._id ? updated : s))}
      />
    )}
    </>
  );
}