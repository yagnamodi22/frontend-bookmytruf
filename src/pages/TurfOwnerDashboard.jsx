import React, { useEffect, useState } from 'react';
import {
  Plus,
  MapPin,
  Clock,
  XCircle,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Users,
  Star,
  User
} from 'lucide-react';
import { turfService } from '../services/turfService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import PersonalDetailsModal from '../components/PersonalDetailsModal';
import TurfDetailsModal from '../components/TurfDetailsModal';

const TurfOwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [myTurfs, setMyTurfs] = useState([]);
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: '',
    date: '',
    startTime: '',
    endTime: '',
    amount: ''
  });
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loadingOfflineBookings, setLoadingOfflineBookings] = useState(false);
  const [showTurfDetailsModal, setShowTurfDetailsModal] = useState(false);
  const [viewTurfId, setViewTurfId] = useState(null);
  const [showPersonalDetailsModal, setShowPersonalDetailsModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    return [];
  };

  const loadMyTurfs = async () => {
    try {
      setLoading(true);
      const data = await turfService.getMyTurfs();
      setMyTurfs(normalize(data));
    } catch (err) {
      console.error('Failed to load your turfs', err);
      setMyTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineBookings = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingOfflineBookings(true);
      const data = await bookingService.getOfflineBookings(turfId);
      setOfflineBookings(normalize(data));
    } catch (err) {
      console.error('Failed to load offline bookings:', err);
      setOfflineBookings([]);
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

  const handleOfflineBookingChange = (e) => {
    const { name, value } = e.target;
    setOfflineBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
    if (
      !offlineBookingData.turfId ||
      !offlineBookingData.date ||
      !offlineBookingData.startTime ||
      !offlineBookingData.endTime
    ) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      await bookingService.createOfflineBooking(offlineBookingData);
      await loadOfflineBookings(offlineBookingData.turfId);
      setOfflineBookingData({
        ...offlineBookingData,
        date: '',
        startTime: '',
        endTime: '',
        amount: ''
      });
      alert('Slot blocked successfully!');
    } catch (err) {
      console.error('Failed to create offline booking:', err);
      alert(err?.response?.data?.message || 'Failed to block slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to unblock this slot?')) return;
    try {
      setLoading(true);
      await bookingService.deleteOfflineBooking(bookingId);
      await loadOfflineBookings(offlineBookingData.turfId);
      alert('Slot unblocked successfully!');
    } catch (err) {
      console.error('Failed to delete offline booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = () => {
    const user = authService.getCurrentUser();
    if (user) {
      setUserProfile({
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '+91 98765 43210'
      });
    }
  };

  useEffect(() => {
    loadMyTurfs();
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (offlineBookingData.turfId) loadOfflineBookings(offlineBookingData.turfId);
  }, [offlineBookingData.turfId]);

  const renderOfflineBookingsTab = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Offline Bookings</h2>

      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Block Slot for Offline Booking</h3>
        <form onSubmit={handleCreateOfflineBooking} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Turf *</label>
              <select
                name="turfId"
                value={offlineBookingData.turfId}
                onChange={handleOfflineBookingChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a turf</option>
                {myTurfs.map((turf) => (
                  <option key={turf.id} value={turf.id}>
                    {turf.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={offlineBookingData.date}
                onChange={handleOfflineBookingChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={offlineBookingData.startTime}
                onChange={handleOfflineBookingChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                name="endTime"
                value={offlineBookingData.endTime}
                onChange={handleOfflineBookingChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={offlineBookingData.amount}
                onChange={handleOfflineBookingChange}
                placeholder="Optional"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Block Slot'}
            </button>
          </div>
        </form>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Blocked Slots</h3>
      {!offlineBookingData.turfId ? (
        <p className="text-gray-600">Select a turf to view blocked slots.</p>
      ) : loadingOfflineBookings ? (
        <p className="text-gray-600">Loading...</p>
      ) : offlineBookings.length === 0 ? (
        <p className="text-gray-600">No blocked slots found for this turf.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offlineBookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(b.bookingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {b.startTime} - {b.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {b.totalAmount ? `₹${b.totalAmount}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteOfflineBooking(b.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Turf Owner Dashboard</h1>

        {loading ? (
          <p>Loading your turfs...</p>
        ) : myTurfs.length === 0 ? (
          <p className="text-gray-500">No turfs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTurfs.map((turf) => (
              <div
                key={turf.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{turf.name}</h3>
                <p className="text-gray-600">{turf.location}</p>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setViewTurfId(turf.id);
                      setShowTurfDetailsModal(true);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      setOfflineBookingData((prev) => ({
                        ...prev,
                        turfId: turf.id
                      }));
                      setActiveTab('offlineBookings');
                      loadOfflineBookings(turf.id);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Manage Offline Bookings
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {renderOfflineBookingsTab()}
      </div>

      <TurfDetailsModal
        isOpen={showTurfDetailsModal}
        onClose={() => setShowTurfDetailsModal(false)}
        turfId={viewTurfId}
      />
      <PersonalDetailsModal
        isOpen={showPersonalDetailsModal}
        onClose={() => setShowPersonalDetailsModal(false)}
      />
    </div>
  );
};

export default TurfOwnerDashboard;
