'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import toast from 'react-hot-toast';
import {
  Search, Eye, X, CheckCircle, XCircle, Package,
  ChevronDown, ChevronUp, ExternalLink, CreditCard, MapPin, Calendar, Download,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_STYLE = {
  draft:        'bg-gray-100 text-gray-500',
  pending:      'bg-yellow-100 text-yellow-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  suspended:    'bg-orange-100 text-orange-700',
  resubmitted:  'bg-blue-100 text-blue-700',
};

function DocLink({ label, url }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium">
      <ExternalLink className="w-3 h-3" /> {label}
    </a>
  );
}

function DocImage({ label, url }) {
  if (!url) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={label} className="w-full h-24 object-contain bg-white rounded border border-gray-200 p-1 hover:opacity-80 transition-opacity" />
      </a>
    </div>
  );
}

export default function AdminVendorServices() {
  const LIMIT = 10;
  const { token } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [rejectModal, setRejectModal] = useState({ open: false, id: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, resubmitted: 0, approved: 0, rejected: 0 });

  const fetchServices = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        setTotalPages(data.totalPages || 1);
        setTotalServices(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (token) {
      setCurrentPage(1);
      fetchServices(1);
    }
  }, [token, statusFilter, searchQuery]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchServices(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAction = async (id, action, reason = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchServices(currentPage);
        if (selected?._id === id) setSelected(prev => ({ ...prev, status: data.service.status, rejectionReason: data.service.rejectionReason }));
        setRejectModal({ open: false, id: '', reason: '' });
      } else toast.error(data.message);
    } catch { toast.error('Something went wrong'); }
    finally { setActionLoading(false); }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ export: 'true' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        toast.error('Export failed');
        return;
      }

      const allServices = data.services;
      const rows = [
        ['#', 'Title', 'Company', 'Category', 'Vendor', 'Vendor Email', 'City', 'State', 'Starting Price', 'Status', 'Submitted'],
        ...allServices.map((s, i) => [
          i + 1,
          s.title || '',
          s.companyName || '',
          s.category || '',
          s.vendor?.name || '',
          s.vendor?.email || '',
          s.city || '',
          s.state || '',
          s.startingPrice || 0,
          s.status || '',
          new Date(s.createdAt).toLocaleDateString('en-IN'),
        ])
      ];
      const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      link.download = `Vendor_Services_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      toast.success(`Exported ${allServices.length} services!`);
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout title="Vendor Services" subtitle="All submitted vendor services">
      <PermissionGuard permission="vendorServices">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total',       value: stats.total,       cls: 'bg-white border-gray-100' },
            { label: 'Pending',     value: stats.pending,     cls: 'bg-yellow-50 border-yellow-200' },
            { label: 'Resubmitted', value: stats.resubmitted, cls: 'bg-blue-50 border-blue-200' },
            { label: 'Approved',    value: stats.approved,    cls: 'bg-green-50 border-green-200' },
            { label: 'Rejected',    value: stats.rejected,    cls: 'bg-red-50 border-red-200' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`rounded-xl border shadow-sm p-4 ${cls}`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by title, vendor, category, city..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="resubmitted">Resubmitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={handleExportCSV} disabled={exporting || totalServices === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : `CSV (${totalServices})`}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : services.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No services found</td></tr>
                ) : services.map((svc, i) => (
                  <tr key={svc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">{(currentPage - 1) * LIMIT + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {svc.featuredImage
                          ? <img src={svc.featuredImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-gray-400" /></div>
                        }
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{svc.title}</p>
                          {svc.companyName && <p className="text-xs text-gray-400">{svc.companyName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700">{svc.vendor?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{svc.vendor?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{svc.category || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{[svc.city, svc.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-green-700">{svc.startingPrice ? `₹${svc.startingPrice.toLocaleString()}+` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[svc.status] || STATUS_STYLE.draft}`}>
                        {svc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(svc.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(svc)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {(svc.status === 'pending' || svc.status === 'resubmitted') && (
                          <>
                            <button onClick={() => handleAction(svc._id, 'approve')} disabled={actionLoading}
                              className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">✓</button>
                            <button onClick={() => setRejectModal({ open: true, id: svc._id, reason: '' })}
                              className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors">✗</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, totalServices)} of {totalServices} services
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button key={page} onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Service Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {selected.featuredImage && <img src={selected.featuredImage} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />}
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{selected.title}</h2>
                    <p className="text-xs text-gray-400">{selected.vendor?.name} · {selected.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[selected.status] || STATUS_STYLE.draft}`}>{selected.status}</span>
                  <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    ['Company', selected.companyName],
                    ['Brand', selected.brandName],
                    ['Experience', selected.experienceYears ? `${selected.experienceYears} yrs` : null],
                    ['Starting Price', selected.startingPrice ? `₹${selected.startingPrice.toLocaleString()}` : null],
                    ['Min Order', selected.minimumOrderPrice ? `₹${selected.minimumOrderPrice.toLocaleString()}` : null],
                    ['Pincode', selected.pincode],
                    ['Address', selected.officeAddress],
                    ['Area', selected.area],
                    ['Serviceable Areas', selected.serviceableAreas?.join(', ')],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="font-semibold text-gray-800 text-xs">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-500 mb-1">Description</p>
                    <p className="text-xs text-gray-700">{selected.description}</p>
                  </div>
                )}

                {/* Contact Info */}
                {selected.contactInfo && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-2">Contact Info</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-gray-500">Name:</span> <span className="font-semibold">{selected.contactInfo.fullName}</span></p>
                      <p><span className="text-gray-500">Mobile:</span> <span className="font-semibold">{selected.contactInfo.primaryMobile}</span></p>
                      <p><span className="text-gray-500">Role:</span> <span className="font-semibold capitalize">{selected.contactInfo.role}</span></p>
                      {selected.contactInfo.secondaryMobile && <p><span className="text-gray-500">Alt:</span> <span className="font-semibold">{selected.contactInfo.secondaryMobile}</span></p>}
                    </div>
                  </div>
                )}

                {/* Portfolio */}
                {selected.images?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Portfolio Photos</p>
                    <div className="flex gap-2 flex-wrap">
                      {selected.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                          <img src={img} alt="" className="w-20 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rate List */}
                {selected.packages?.filter(p => p.name).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Rate List / Packages</p>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-500">Service</th>
                            <th className="px-3 py-2 text-left text-gray-500">Rate</th>
                            <th className="px-3 py-2 text-left text-gray-500">Unit</th>
                            <th className="px-3 py-2 text-left text-gray-500">Min</th>
                            <th className="px-3 py-2 text-left text-gray-500">Max</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selected.packages.filter(p => p.name).map((pkg, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">{pkg.name}</td>
                              <td className="px-3 py-2 text-green-700 font-semibold">₹{pkg.price?.toLocaleString()}</td>
                              <td className="px-3 py-2">{pkg.unit}</td>
                              <td className="px-3 py-2">{pkg.minQty || '—'}</td>
                              <td className="px-3 py-2">{pkg.maxQty || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Business Docs */}
                {selected.businessDocs && Object.values(selected.businessDocs).some(Boolean) && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-800 mb-3">Business Documents</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <DocLink label="Registration Certificate" url={selected.businessDocs.registrationCertificate} />
                      <DocLink label="MSME" url={selected.businessDocs.msme} />
                      <DocLink label="GST Certificate" url={selected.businessDocs.gst} />
                      <DocLink label="PAN (Business)" url={selected.businessDocs.pan} />
                      <DocLink label="Trade License" url={selected.businessDocs.tradeLicense} />
                      <DocLink label="FSSAI" url={selected.businessDocs.fssai} />
                    </div>
                  </div>
                )}

                {/* Owner / KYC Docs */}
                {selected.ownerDocs && Object.values(selected.ownerDocs).some(Boolean) && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-bold text-green-800 mb-3">Owner / KYC Documents</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DocImage label="Aadhaar Front" url={selected.ownerDocs.aadhaarFront} />
                      <DocImage label="Aadhaar Back" url={selected.ownerDocs.aadhaarBack} />
                      <DocImage label="PAN Card" url={selected.ownerDocs.pan} />
                      <DocImage label="Selfie" url={selected.ownerDocs.selfie} />
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {selected.bankDetails?.accountNumber && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Bank Details</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-gray-500">Name:</span> <span className="font-semibold">{selected.bankDetails.accountHolderName}</span></p>
                      <p><span className="text-gray-500">Bank:</span> <span className="font-semibold">{selected.bankDetails.bankName}</span></p>
                      <p><span className="text-gray-500">A/C No:</span> <span className="font-semibold">{selected.bankDetails.accountNumber}</span></p>
                      <p><span className="text-gray-500">IFSC:</span> <span className="font-semibold">{selected.bankDetails.ifsc}</span></p>
                      <p><span className="text-gray-500">Type:</span> <span className="font-semibold capitalize">{selected.bankDetails.accountType}</span></p>
                      {selected.bankDetails.upiId && <p><span className="text-gray-500">UPI:</span> <span className="font-semibold">{selected.bankDetails.upiId}</span></p>}
                    </div>
                    {selected.bankDetails.proof && <DocLink label="View Bank Proof" url={selected.bankDetails.proof} />}
                  </div>
                )}

                {/* Rejection History */}
                {selected.rejectionHistory?.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs font-bold text-red-800 mb-3 flex items-center gap-1">
                      🕐 Rejection History ({selected.rejectionHistory.length})
                    </p>
                    <div className="space-y-2">
                      {[...selected.rejectionHistory].reverse().map((h, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-red-700">Rejection #{selected.rejectionHistory.length - i}</span>
                            <span className="text-xs text-gray-400">{new Date(h.rejectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <p className="text-xs text-gray-700">{h.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resubmission info */}
                {selected.status === 'resubmitted' && selected.resubmittedAt && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-xs font-bold text-blue-700">Resubmitted by vendor on {new Date(selected.resubmittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}

                {/* Actions */}
                {(selected.status === 'pending' || selected.status === 'resubmitted') && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleAction(selected._id, 'approve')} disabled={actionLoading}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                      <CheckCircle className="w-4 h-4" /> Approve Service
                    </button>
                    <button onClick={() => setRejectModal({ open: true, id: selected._id, reason: '' })}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Reject Service</h3>
              <textarea
                value={rejectModal.reason}
                onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))}
                placeholder="Rejection reason (required)..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 mb-4"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!rejectModal.reason.trim()) { toast.error('Reason required'); return; }
                    handleAction(rejectModal.id, 'reject', rejectModal.reason);
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
                <button onClick={() => setRejectModal({ open: false, id: '', reason: '' })}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </PermissionGuard>
    </AdminLayout>
  );
}
