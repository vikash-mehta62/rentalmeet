'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  BarChart3, TrendingUp, Download, Calendar, IndianRupee,
  Building2, Users, BookOpen, PieChart, FileText
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

export default function AdminReports() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    revenue: {},
    bookings: {},
    venues: {},
    users: {},
    payments: {}
  });
  
  // Date selection states
  const [dateMode, setDateMode] = useState('financial'); // 'financial' or 'custom'
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    // Generate financial years (last 10 years)
    const years = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    
    // If current month is April or later, current FY is currentYear-currentYear+1
    // If before April, current FY is currentYear-1 to currentYear
    const currentFYStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    for (let i = 0; i < 10; i++) {
      const startYear = currentFYStart - i;
      const endYear = startYear + 1;
      years.push({
        label: `FY ${startYear}-${endYear}`,
        value: `${startYear}-${endYear}`,
        startDate: new Date(startYear, 3, 1), // April 1
        endDate: new Date(endYear, 2, 31, 23, 59, 59) // March 31
      });
    }
    
    setFinancialYears(years);
    setSelectedFinancialYear(years[0].value); // Set current FY as default
  }, []);

  useEffect(() => {
    if (token && (selectedFinancialYear || (customStartDate && customEndDate))) {
      fetchReports();
    }
  }, [token, selectedFinancialYear, customStartDate, customEndDate, dateMode]);

  const getDateRange = () => {
    if (dateMode === 'financial' && selectedFinancialYear) {
      const fy = financialYears.find(f => f.value === selectedFinancialYear);
      return {
        startDate: fy.startDate.toISOString(),
        endDate: fy.endDate.toISOString()
      };
    } else if (dateMode === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate.toISOString(),
        endDate: customEndDate.toISOString()
      };
    }
    return null;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const dateRange = getDateRange();
      if (!dateRange) return;

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports?${params}`, {
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
    try {
      const dateRange = getDateRange();
      if (!dateRange) {
        toast.error('Please select a date range');
        return;
      }

      // Prepare CSV data
      const csvData = [];
      
      // Header
      csvData.push(['RentalMeet - Business Report']);
      csvData.push(['Generated on:', new Date().toLocaleString('en-IN')]);
      csvData.push(['Period:', dateMode === 'financial' ? selectedFinancialYear : `${customStartDate.toLocaleDateString()} to ${customEndDate.toLocaleDateString()}`]);
      csvData.push([]);
      
      // Revenue Overview
      csvData.push(['REVENUE OVERVIEW']);
      csvData.push(['Metric', 'Value']);
      csvData.push(['Total Revenue', `₹${(reportData.revenue?.total || 0).toLocaleString()}`]);
      csvData.push(['Platform Fee Earned', `₹${(reportData.revenue?.platformFee || 0).toLocaleString()}`]);
      csvData.push(['Owner Earnings', `₹${(reportData.revenue?.ownerEarnings || 0).toLocaleString()}`]);
      csvData.push(['Average Booking Value', `₹${(reportData.revenue?.average || 0).toLocaleString()}`]);
      csvData.push([]);
      
      // Bookings Analytics
      csvData.push(['BOOKINGS ANALYTICS']);
      csvData.push(['Status', 'Count']);
      csvData.push(['Total Bookings', reportData.bookings?.total || 0]);
      csvData.push(['Completed', reportData.bookings?.completed || 0]);
      csvData.push(['Confirmed', reportData.bookings?.confirmed || 0]);
      csvData.push(['Pending', reportData.bookings?.pending || 0]);
      csvData.push(['Cancelled', reportData.bookings?.cancelled || 0]);
      csvData.push([]);
      
      // Venues Performance
      csvData.push(['VENUES PERFORMANCE']);
      csvData.push(['Metric', 'Value']);
      csvData.push(['Total Venues', reportData.venues?.total || 0]);
      csvData.push(['Active Venues', reportData.venues?.approved || 0]);
      csvData.push(['Pending Approval', reportData.venues?.pending || 0]);
      csvData.push(['Avg Bookings per Venue', reportData.venues?.avgBookings || 0]);
      csvData.push([]);
      
      // User Statistics
      csvData.push(['USER STATISTICS']);
      csvData.push(['Category', 'Count']);
      csvData.push(['Total Users', reportData.users?.total || 0]);
      csvData.push(['Customers', reportData.users?.customers || 0]);
      csvData.push(['Venue Owners', reportData.users?.owners || 0]);
      csvData.push(['Active Users', reportData.users?.active || 0]);
      csvData.push([]);
      
      // Payment Status
      csvData.push(['PAYMENT STATUS']);
      csvData.push(['Status', 'Count', 'Amount']);
      csvData.push(['Paid', reportData.payments?.paid || 0, `₹${(reportData.payments?.paidAmount || 0).toLocaleString()}`]);
      csvData.push(['Pending', reportData.payments?.pending || 0, `₹${(reportData.payments?.pendingAmount || 0).toLocaleString()}`]);
      csvData.push(['Failed', reportData.payments?.failed || 0, `₹${(reportData.payments?.failedAmount || 0).toLocaleString()}`]);
      csvData.push(['Refunded', reportData.payments?.refunded || 0, `₹${(reportData.payments?.refundedAmount || 0).toLocaleString()}`]);
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `RentalMeet_Report_${dateMode === 'financial' ? selectedFinancialYear : new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  if (loading && !reportData.revenue?.total) {
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
      <PermissionGuard permission="reports">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6 mb-6">
        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Select Period:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setDateMode('financial')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateMode === 'financial'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Financial Year
              </button>
              <button
                onClick={() => setDateMode('custom')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateMode === 'custom'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Date Range
              </button>
            </div>
          </div>

          {/* Financial Year Selection */}
          {dateMode === 'financial' && (
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">Financial Year:</label>
              <select
                value={selectedFinancialYear}
                onChange={(e) => setSelectedFinancialYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white min-w-[200px]"
              >
                {financialYears.map(fy => (
                  <option key={fy.value} value={fy.value}>{fy.label}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                (April 1 - March 31)
              </span>
            </div>
          )}

          {/* Custom Date Range Selection */}
          {dateMode === 'custom' && (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="font-medium text-gray-700">From:</label>
                <DatePicker
                  selected={customStartDate}
                  onChange={(date) => setCustomStartDate(date)}
                  maxDate={customEndDate || new Date()}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select start date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium text-gray-700">To:</label>
                <DatePicker
                  selected={customEndDate}
                  onChange={(date) => setCustomEndDate(date)}
                  minDate={customStartDate}
                  maxDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select end date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={handleExport}
              disabled={loading || (!selectedFinancialYear && (!customStartDate || !customEndDate))}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export Report (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg shadow-soft border border-green-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
          <IndianRupee className="w-6 h-6" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₹{(reportData.revenue?.total || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">From all bookings</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Platform Fee Earned</p>
            <p className="text-2xl font-bold text-purple-600">₹{(reportData.revenue?.platformFee || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Owner Earnings</p>
            <p className="text-2xl font-bold text-teal-600">₹{(reportData.revenue?.ownerEarnings || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Paid to owners</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Average Booking</p>
            <p className="text-2xl font-bold text-blue-600">₹{(reportData.revenue?.average || 0).toLocaleString('en-IN')}</p>
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
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-blue-600">{reportData.bookings?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{reportData.bookings?.completed || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-blue-600">{reportData.bookings?.confirmed || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{reportData.bookings?.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">{reportData.bookings?.cancelled || 0}</p>
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
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Total Venues</p>
            <p className="text-3xl font-bold text-orange-600">{reportData.venues?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{reportData.venues?.approved || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-600">{reportData.venues?.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Avg. Bookings/Venue</p>
            <p className="text-3xl font-bold text-blue-600">{reportData.venues?.avgBookings || 0}</p>
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
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-purple-600">{reportData.users?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Customers</p>
            <p className="text-3xl font-bold text-green-600">{reportData.users?.customers || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Venue Owners</p>
            <p className="text-3xl font-bold text-blue-600">{reportData.users?.owners || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-teal-600">{reportData.users?.active || 0}</p>
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
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <p className="text-sm text-green-600 mb-1 font-medium">Paid</p>
            <p className="text-3xl font-bold text-green-700">{reportData.payments?.paid || 0}</p>
            <p className="text-sm text-green-600 mt-2 font-semibold">
              ₹{(reportData.payments?.paidAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
            <p className="text-sm text-yellow-600 mb-1 font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-700">{reportData.payments?.pending || 0}</p>
            <p className="text-sm text-yellow-600 mt-2 font-semibold">
              ₹{(reportData.payments?.pendingAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <p className="text-sm text-red-600 mb-1 font-medium">Failed</p>
            <p className="text-3xl font-bold text-red-700">{reportData.payments?.failed || 0}</p>
            <p className="text-sm text-red-600 mt-2 font-semibold">
              ₹{(reportData.payments?.failedAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <p className="text-sm text-gray-600 mb-1 font-medium">Refunded</p>
            <p className="text-3xl font-bold text-gray-700">{reportData.payments?.refunded || 0}</p>
            <p className="text-sm text-gray-600 mt-2 font-semibold">
              ₹{(reportData.payments?.refundedAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Date Picker Styles */}
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .react-datepicker__header {
          background-color: #F59F0A;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          padding: 12px 0;
        }
        
        .react-datepicker__current-month {
          color: white;
          font-weight: 600;
        }
        
        .react-datepicker__day-name {
          color: white;
          font-weight: 500;
        }
        
        .react-datepicker__day--selected {
          background-color: #F59F0A;
          color: white;
        }
        
        .react-datepicker__day:hover {
          background-color: #FEF3C7;
        }
      `}</style>
      </PermissionGuard>
    </AdminLayout>
  );
}
