'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertCircle,
  Eye,
  X,
  CalendarCheck,
  Coins,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function AmbassadorVenuesPage() {
  const { token } = useAuthStore();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRejection, setSelectedRejection] = useState(null);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/venues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setVenues(json.venues || []);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchVenues();
  }, [token]);

  const filteredVenues = venues.filter((v) => {
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesSearch =
      v.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalVenuesCount = venues.length;
  const approvedVenuesCount = venues.filter((v) => v.status === 'approved').length;
  const totalBookingsCount = venues.reduce((sum, v) => sum + (v.totalBookings || 0), 0);
  const totalGrossVolume = venues.reduce((sum, v) => sum + (v.grossRevenue || v.totalEarnings || 0), 0);
  const totalAmbassadorShare = venues.reduce((sum, v) => sum + (v.ambassadorProfitShare || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Listed <span className="text-primary-600">Venues</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all spaces you have acquired and submitted to RentalMeet.
          </p>
        </div>

        <Link
          href="/ambassador/add-venue"
          className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> List New Venue
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Submitted Venues</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{totalVenuesCount}</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-green-50 dark:bg-green-950/60 text-green-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Approved Live</div>
            <div className="text-lg font-black text-green-600">{approvedVenuesCount}</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Bookings</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{totalBookingsCount}</div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-primary-500/10 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 25% Profit Share
            </div>
            <div className="text-lg font-black text-amber-600">
              ₹{totalAmbassadorShare.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search venue, city, owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'approved', 'pending', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st} ({st === 'all' ? venues.length : venues.filter((v) => v.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Venues Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading your venue listings...</p>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No venues found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or add a new venue listing.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Venue Details</th>
                  <th className="p-4">Venue Owner (Linked)</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Type &amp; Capacity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Performance &amp; 25% Share</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredVenues.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {v.businessName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {v.sku || 'N/A'}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {v.owner?.name || v.ownerInfo?.fullName || 'Venue Owner'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {v.owner?.phone || v.ownerInfo?.mobile || v.owner?.email}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded font-semibold mt-0.5">
                        Role: {v.ownerInfo?.role || 'Owner'}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <div>{v.location?.city}, {v.location?.state}</div>
                      <div className="text-[11px] text-slate-400">{v.location?.area}</div>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold mr-1">
                        {Array.isArray(v.venueType) ? v.venueType[0] : v.venueType || 'Venue'}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">Cap: {v.capacity} pax</div>
                    </td>

                    <td className="p-4">
                      {v.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : v.status === 'rejected' ? (
                        <button
                          onClick={() => setSelectedRejection(v)}
                          className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[10px] inline-flex items-center gap-1 hover:bg-red-200"
                        >
                          <XCircle className="w-3 h-3" /> Rejected (View Reason)
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Under Review
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>{v.totalBookings || 0} Bookings</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Vol: ₹{(v.grossRevenue || v.totalEarnings || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        🏆 25% Share: ₹{(v.ambassadorProfitShare || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/venues/${v.sku || v._id}`}
                        target="_blank"
                        className="p-2 inline-flex items-center gap-1 text-slate-500 hover:text-primary-600 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {selectedRejection && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Rejection Details
              </h3>
              <button onClick={() => setSelectedRejection(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
              <p className="font-bold mb-1">Reason Provided by Admin:</p>
              <p>{selectedRejection.rejectionReason || 'Venue details or documentation did not meet guidelines.'}</p>
            </div>

            <p className="text-[11px] text-slate-500">
              You can contact support or resubmit with corrected photos &amp; venue details.
            </p>

            <button
              onClick={() => setSelectedRejection(null)}
              className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
