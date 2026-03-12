'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  CreditCard, Search, Filter, Eye, X, Calendar, IndianRupee,
  CheckCircle, XCircle, Clock, AlertCircle, User, Building2,
  TrendingUp, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

export default function AdminPayments() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPayments();
    }
  }, [token]);

  useEffect(() => {
    filterPayments();
  }, [payments, statusFilter, searchQuery]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPayments(data.payments);
        setFilteredPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.paymentStatus === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.paymentDetails?.paymentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paymentDetails?.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.venue?.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPayment(null);
    setModalOpen(false);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.paymentStatus === 'paid').length,
    pending: payments.filter(p => p.paymentStatus === 'pending').length,
    failed: payments.filter(p => p.paymentStatus === 'failed').length,
    totalRevenue: payments
      .filter(p => p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    ownerEarnings: payments
      .filter(p => p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + (p.ownerEarnings || 0), 0)
  };

  if (loading) {
    return (
      <AdminLayout title="Payments Management" subtitle="Loading payments...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payments Management" subtitle={`Track all ${payments.length} transactions`}>
      <PermissionGuard permission="payments">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-dark-800">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-soft border border-green-200 p-4">
          <p className="text-xs text-green-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-700">{stats.paid}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-soft border border-yellow-200 p-4">
          <p className="text-xs text-yellow-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-soft border border-red-200 p-4">
          <p className="text-xs text-red-600 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-soft border border-blue-200 p-4">
          <p className="text-xs text-blue-600 mb-1">Paid Amount</p>
          <p className="text-xl font-bold text-blue-700">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-teal-50 rounded-lg shadow-soft border border-teal-200 p-4">
          <p className="text-xs text-teal-600 mb-1">Owner Earnings</p>
          <p className="text-xl font-bold text-teal-700">₹{stats.ownerEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by payment ID, order ID, customer, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner Gets</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-dark-800">
                        {payment.paymentDetails?.paymentId?.slice(0, 20) || 'N/A'}...
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        {payment.paymentDetails?.orderId?.slice(0, 20) || 'N/A'}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-800">{payment.customer?.name}</p>
                          <p className="text-xs text-gray-500">{payment.customer?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-800">{payment.venue?.businessName}</p>
                          <p className="text-xs text-gray-500">{payment.venue?.location?.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-lg text-primary-600">₹{payment.amount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-green-600">₹{payment.ownerEarnings?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentStatusBadge(payment.paymentStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {payment.paymentDetails?.paidAt 
                          ? new Date(payment.paymentDetails.paidAt).toLocaleDateString()
                          : new Date(payment.createdAt).toLocaleDateString()
                        }
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(payment)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {modalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-800">Payment Details</h2>
                <p className="text-sm text-gray-600">Transaction ID: #{selectedPayment._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <InvoiceDownload booking={selectedPayment} userRole="admin" />
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Payment Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  {getPaymentStatusBadge(selectedPayment.paymentStatus)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-primary-600">₹{selectedPayment.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Razorpay Payment Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Razorpay Transaction Details
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-600 mb-1">Payment ID</p>
                    <p className="font-mono text-xs font-semibold text-gray-900 break-all">
                      {selectedPayment.paymentDetails?.paymentId || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-600 mb-1">Order ID</p>
                    <p className="font-mono text-xs font-semibold text-gray-900 break-all">
                      {selectedPayment.paymentDetails?.orderId || 'N/A'}
                    </p>
                  </div>
                  {selectedPayment.paymentDetails?.paidAt && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Payment Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPayment.paymentDetails.paidAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-green-900 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Financial Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-700">Total Amount Paid</span>
                    <span className="text-xl font-bold text-primary-600">
                      ₹{selectedPayment.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="text-gray-700">Platform Commission</span>
                      <span className="text-xs text-gray-500 ml-2">({selectedPayment.commissionRate}%)</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      ₹{selectedPayment.commission?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex justify-between items-center border-2 border-green-300">
                    <span className="text-lg font-semibold text-gray-900">Owner Receives</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{selectedPayment.ownerEarnings?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.customer?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.customerDetails?.phone || selectedPayment.customer?.phone}</p>
                  </div>
                  {selectedPayment.customerDetails?.eventType && (
                    <div>
                      <p className="text-gray-600">Event Type</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.customerDetails.eventType}</p>
                    </div>
                  )}
                  {selectedPayment.customerDetails?.guestCount && (
                    <div>
                      <p className="text-gray-600">Guest Count</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.customerDetails.guestCount} Guests</p>
                    </div>
                  )}
                </div>
                {selectedPayment.customerDetails?.specialRequirements && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-gray-600 text-xs mb-1">Special Requirements:</p>
                    <p className="text-sm text-gray-900">{selectedPayment.customerDetails.specialRequirements}</p>
                  </div>
                )}
              </div>

              {/* Venue Details */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-orange-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Venue Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Venue Name</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.venue?.businessName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPayment.venue?.location?.city}, {selectedPayment.venue?.location?.area}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.venue?.owner?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner Contact</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.venue?.owner?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Booking Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Booking Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPayment.bookingDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Slot</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPayment.startTime} - {selectedPayment.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Booking Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedPayment.bookingType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Booking Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedPayment.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
