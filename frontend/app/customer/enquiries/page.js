'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import EnquiryDetailModal from '@/components/enquiry/EnquiryDetailModal';
import {
  Calendar, CheckCircle2, Clock, MapPin, IndianRupee,
  Search, Building2, Send, ArrowRight, XCircle, Users, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerEnquiries() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'customer') {
      router.push('/login');
      return;
    }
    fetchEnquiries();
  }, [token, user]);

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/venue-enquiries/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries || []);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'converted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Converted to Booking</span>;
      case 'contacted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Owner Contacted</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Pending Draft</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <CustomerLayout activePage="enquiries" title="My Venue Enquiries" subtitle={`${enquiries.length} enquiry draft(s) found`}>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Informational banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <Send className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Off-Hours Booking Enquiries</h3>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              These are booking enquiry drafts submitted when online booking was closed. You can click <strong>Complete Booking</strong> whenever online booking opens to instantly auto-fill your saved dates, times, and amenities!
            </p>
          </div>
        </div>

        {/* Enquiries List */}
        {enquiries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
            <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Enquiries Found</h3>
            <p className="text-gray-500 mb-6 text-sm">
              You haven't submitted any off-hours venue enquiries yet.
            </p>
            <Link href="/venues" className="btn-primary inline-flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enquiries.map((enq) => {
              const bd = enq.bookingDetails || {};
              const venueSku = enq.venue?.sku;
              return (
                <div key={enq._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {enq.venue?.images?.[0]?.url ? (
                            <img src={enq.venue.images[0].url} alt={enq.venue?.businessName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 leading-snug">{enq.venue?.businessName || 'Venue'}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-primary-500" />
                            {enq.venue?.location?.city || 'Location unavailable'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(enq.status)}
                    </div>

                    {/* Reference and Created Date */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                      <span className="font-mono font-bold text-gray-700">#{enq.enquiryNumber}</span>
                      <span>{new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-amber-50/40 border border-amber-100 rounded-xl p-3">
                      {(bd.bookingDate || bd.date) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary-500" />
                          <span className="font-semibold text-gray-800">
                            {new Date(bd.bookingDate || bd.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {bd.startTime && <span className="text-gray-500">({bd.startTime} - {bd.endTime || `${bd.duration}h`})</span>}
                        </div>
                      )}
                      {enq.customerDetails?.guestCount && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-primary-500" />
                          <span>{enq.customerDetails.guestCount} Guests</span>
                          {enq.customerDetails.eventType && <span>• {enq.customerDetails.eventType}</span>}
                        </div>
                      )}
                      {enq.estimatedAmount > 0 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-amber-200/50">
                          <IndianRupee className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-bold text-gray-900">Estimated Total:</span>
                          <span className="font-black text-green-600">₹{enq.estimatedAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedEnquiry(enq)}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5" /> Details
                    </button>
                    {venueSku && (
                      <Link
                        href={`/venues/${venueSku}?enquiryId=${enq._id}`}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>Complete Booking</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <EnquiryDetailModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          isOwner={false}
        />
      )}
    </CustomerLayout>
  );
}
