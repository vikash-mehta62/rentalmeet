'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import EnquiryDetailModal from '@/components/enquiry/EnquiryDetailModal';
import {
  Calendar, CheckCircle2, Clock, MapPin, IndianRupee,
  Search, Building2, Send, Phone, Mail, MessageSquare,
  Users, AlertCircle, XCircle, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerEnquiries() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'owner') {
      router.push('/login');
      return;
    }
    fetchEnquiries();
  }, [token, user]);

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/enquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries || []);
        setFilteredEnquiries(data.enquiries || []);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search
  useEffect(() => {
    let list = [...enquiries];
    if (filterStatus !== 'all') {
      list = list.filter(e => e.status === filterStatus);
    }
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter(e =>
        e.enquiryNumber?.toLowerCase().includes(q) ||
        e.customerDetails?.name?.toLowerCase().includes(q) ||
        e.customerDetails?.phone?.includes(q) ||
        e.venue?.businessName?.toLowerCase().includes(q)
      );
    }
    setFilteredEnquiries(list);
  }, [filterStatus, searchInput, enquiries]);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/enquiries/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Enquiry status updated to ${newStatus}`);
        setEnquiries(prev => prev.map(e => e._id === id ? { ...e, status: newStatus } : e));
        if (selectedEnquiry?._id === id) {
          setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'converted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Converted</span>;
      case 'contacted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Contacted</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <OwnerLayout title="Customer Enquiries" subtitle={`${filteredEnquiries.length} enquiry lead(s) found`}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Top Filters & Search */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, phone, enquiry no..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'contacted', 'converted', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Enquiries List */}
        {filteredEnquiries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Customer Enquiries</h3>
            <p className="text-xs text-gray-500">
              When customers visit your venues outside active booking hours and send enquiries, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEnquiries.map((enq) => {
              const bd = enq.bookingDetails || {};
              const cd = enq.customerDetails || {};
              const cleanPhone = (cd.phone || '').replace(/\D/g, '');

              return (
                <div key={enq._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          #{enq.enquiryNumber}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-1">{cd.name || 'Guest Lead'}</h3>
                        <p className="text-xs text-gray-500">{enq.venue?.businessName}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(enq.status)}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Customer Contact Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cleanPhone && (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call ({cd.phone})
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(cd.name || '')},%20thank%20you%20for%20enquiring%20about%20${encodeURIComponent(enq.venue?.businessName || 'our venue')}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </>
                      )}
                      {cd.email && (
                        <a
                          href={`mailto:${cd.email}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors truncate max-w-[200px]"
                        >
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {cd.email}
                        </a>
                      )}
                    </div>

                    {/* Booking Details Box */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs space-y-1.5 text-gray-700">
                      {(bd.bookingDate || bd.date) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary-500" />
                          <span className="font-semibold text-gray-900">
                            {new Date(bd.bookingDate || bd.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {bd.startTime && <span>({bd.startTime} - {bd.endTime || `${bd.duration}h`})</span>}
                        </div>
                      )}
                      {cd.guestCount && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-3.5 h-3.5 text-primary-500" />
                          <span>{cd.guestCount} Guests</span>
                          {cd.eventType && <span>• {cd.eventType}</span>}
                        </div>
                      )}
                      {enq.estimatedAmount > 0 && (
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-amber-200/60 font-bold">
                          <IndianRupee className="w-3.5 h-3.5 text-green-600" />
                          <span>Estimated: ₹{enq.estimatedAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                    <button
                      onClick={() => setSelectedEnquiry(enq)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      View Details
                    </button>
                    <div className="flex items-center gap-1">
                      <select
                        value={enq.status}
                        disabled={updatingId === enq._id}
                        onChange={(e) => handleStatusUpdate(enq._id, e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <EnquiryDetailModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          isOwner={true}
          onStatusUpdate={handleStatusUpdate}
          updatingStatus={updatingId === selectedEnquiry._id}
        />
      )}
    </OwnerLayout>
  );
}
