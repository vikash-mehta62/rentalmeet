'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart3, TrendingUp, Download, Calendar, IndianRupee,
  Building2, Users, BookOpen, PieChart
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    revenue: {},
    bookings: {},
    venues: {},
    users: {}
  });
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token, dateRange]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  if (loading) {
    return (
      <AdminLayout title="Reports & Analytics" subtitle="Loading reports...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Comprehensive business insights">
      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Select Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg shadow-soft border border-green-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
          <IndianRupee className="w-6 h-6" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₹{(reportData.revenue?.total || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">From all bookings</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Platform Fee Earned</p>
            <p className="text-2xl font-bold text-purple-600">₹{(reportData.revenue?.platformFee || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Owner Earnings</p>
            <p className="text-2xl font-bold text-teal-600">₹{(reportData.revenue?.ownerEarnings || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Paid to owners</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Booking</p>
            <p className="text-2xl font-bold text-blue-600">₹{(reportData.revenue?.average || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Per transaction</p>
          </div>
        </div>
      </div>

      {/* Bookings Analytics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-soft border border-blue-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Bookings Analytics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.bookings?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{reportData.bookings?.completed || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.bookings?.confirmed || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{reportData.bookings?.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{reportData.bookings?.cancelled || 0}</p>
          </div>
        </div>
      </div>

      {/* Venues Performance */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg shadow-soft border border-orange-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Venues Performance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Venues</p>
            <p className="text-2xl font-bold text-orange-600">{reportData.venues?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{reportData.venues?.approved || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{reportData.venues?.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg. Bookings/Venue</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.venues?.avgBookings || 0}</p>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-soft border border-purple-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          User Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-purple-600">{reportData.users?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Customers</p>
            <p className="text-2xl font-bold text-green-600">{reportData.users?.customers || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Venue Owners</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.users?.owners || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Active Users</p>
            <p className="text-2xl font-bold text-teal-600">{reportData.users?.active || 0}</p>
          </div>
        </div>
      </div>

      {/* Payment Status Breakdown */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
          <PieChart className="w-6 h-6" />
          Payment Status Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 mb-1">Paid</p>
            <p className="text-3xl font-bold text-green-700">{reportData.payments?.paid || 0}</p>
            <p className="text-xs text-green-600 mt-1">
              ₹{(reportData.payments?.paidAmount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-700">{reportData.payments?.pending || 0}</p>
            <p className="text-xs text-yellow-600 mt-1">
              ₹{(reportData.payments?.pendingAmount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600 mb-1">Failed</p>
            <p className="text-3xl font-bold text-red-700">{reportData.payments?.failed || 0}</p>
            <p className="text-xs text-red-600 mt-1">
              ₹{(reportData.payments?.failedAmount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Refunded</p>
            <p className="text-3xl font-bold text-gray-700">{reportData.payments?.refunded || 0}</p>
            <p className="text-xs text-gray-600 mt-1">
              ₹{(reportData.payments?.refundedAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
