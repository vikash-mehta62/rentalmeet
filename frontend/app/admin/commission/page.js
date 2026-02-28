'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Percent, Save, History, IndianRupee, TrendingUp, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCommission() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState(15);
  const [newRate, setNewRate] = useState(15);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalCommission: 0,
    totalBookings: 0,
    averageCommission: 0
  });

  useEffect(() => {
    if (token) {
      fetchCommissionData();
    }
  }, [token]);

  const fetchCommissionData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/commission`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCurrentRate(data.settings?.commissionRate || 15);
        setNewRate(data.settings?.commissionRate || 15);
        setHistory(data.history || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to load commission settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (newRate < 0 || newRate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }

    if (newRate === currentRate) {
      toast.error('New rate is same as current rate');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/commission`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commissionRate: newRate })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Commission rate updated successfully!');
        setCurrentRate(newRate);
        fetchCommissionData();
      } else {
        toast.error(data.message || 'Failed to update commission rate');
      }
    } catch (error) {
      console.error('Error updating commission rate:', error);
      toast.error('Failed to update commission rate');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Commission Settings" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Commission Settings" subtitle="Manage platform commission rates">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-soft border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-700 font-semibold">Total Commission Earned</p>
            <IndianRupee className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">₹{(stats.totalCommission || 0).toLocaleString()}</p>
          <p className="text-xs text-purple-600 mt-1">From all bookings</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-soft border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-semibold">Total Bookings</p>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.totalBookings || 0}</p>
          <p className="text-xs text-blue-600 mt-1">Completed transactions</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-soft border border-green-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-semibold">Avg. Commission/Booking</p>
            <Percent className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">₹{(stats.averageCommission || 0).toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">Per transaction</p>
        </div>
      </div>

      {/* Current Rate & Update */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Rate */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
            <Percent className="w-6 h-6 text-primary-500" />
            Current Commission Rate
          </h2>
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-8 text-center">
            <p className="text-6xl font-bold text-primary-600">{currentRate}%</p>
            <p className="text-sm text-primary-700 mt-2">Platform Commission</p>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Example Calculation:</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Booking Amount:</span>
                <span className="font-semibold">₹10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Commission ({currentRate}%):</span>
                <span className="font-semibold text-purple-600">₹{(10000 * currentRate / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-700">Owner Receives:</span>
                <span className="font-semibold text-green-600">₹{(10000 - (10000 * currentRate / 100)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Rate */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
            <Save className="w-6 h-6 text-green-500" />
            Update Commission Rate
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newRate}
                onChange={(e) => setNewRate(parseFloat(e.target.value))}
                className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 100</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Important Note:</p>
              <p className="text-xs text-yellow-700">
                Changing the commission rate will affect all new bookings. Existing bookings will retain their original commission rate.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Preview with new rate:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Booking Amount:</span>
                  <span className="font-semibold">₹10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Commission ({newRate}%):</span>
                  <span className="font-semibold text-purple-600">₹{(10000 * newRate / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-700">Owner Receives:</span>
                  <span className="font-semibold text-green-600">₹{(10000 - (10000 * newRate / 100)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateRate}
              disabled={newRate === currentRate}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              <Save className="w-5 h-5" />
              Update Commission Rate
            </button>
          </div>
        </div>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
          <History className="w-6 h-6 text-gray-600" />
          Commission Rate History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Previous Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">New Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Change</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No history available
                  </td>
                </tr>
              ) : (
                history.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">{item.previousRate || 'N/A'}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-primary-600">{item.commissionRate}%</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.previousRate ? (
                        <span className={`font-semibold ${
                          item.commissionRate > item.previousRate ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.commissionRate > item.previousRate ? '+' : ''}
                          {(item.commissionRate - item.previousRate).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">Initial</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{item.updatedBy?.name || 'Admin'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
