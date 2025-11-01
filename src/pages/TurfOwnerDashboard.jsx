// src/pages/TurfOwnerDashboard.jsx
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
  // tabs
  const [activeTab, setActiveTab] = useState('overview');

  // general loading / errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // turfs & bookings
  const [myTurfs, setMyTurfs] = useState([]);
  const [selectedTurfId, setSelectedTurfId] = useState('');
  const [turfBookings, setTurfBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // offline booking state
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: '',
    date: '',
    startTime: '',
    endTime: '',
    amount: ''
  });
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loadingOfflineBookings, setLoadingOfflineBookings] = useState(false);

  // user/profile & modals
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [showPersonalDetailsModal, setShowPersonalDetailsModal] = useState(false);
  const [showTurfDetailsModal, setShowTurfDetailsModal] = useState(false);
  const [viewTurfId, setViewTurfId] = useState(null);

  // owner stats (simple)
  const [ownerStats, setOwnerStats] = useState({
    totalTurfs: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingRequests: 0
  });

  // helpers
  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    return [];
  };

  // Load user's turfs
  const loadMyTurfs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await turfService.getMyTurfs();
      setMyTurfs(normalize(data));
      // update simple owner stats if available
      try {
        const st = await turfService.getMyTurfsStats();
        setOwnerStats((prev) => ({
          ...prev,
          totalTurfs: Number(st?.totalTurfs || (Array.isArray(data) ? data.length : 0)),
          totalBookings: Number(st?.totalBookings || prev.totalBookings),
          totalRevenue: Number(st?.totalRevenue || prev.totalRevenue),
          pendingRequests: Number(st?.pendingRequests || prev.pendingRequests)
        }));
      } catch (e) {
        // ignore extra stats errors
      }
    } catch (err) {
      console.error('Error loading turfs:', err);
      setError('Failed to load your turfs.');
      setMyTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load bookings for a turf (non-paginated simplified)
  const loadBookingsForSelected = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingBookings(true);
      const data = await bookingService.getBookingsByTurf(turfId);
      setTurfBookings(normalize(data));
    } catch (err) {
      console.error('Failed to load bookings for turf:', err);
      setTurfBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load offline blocked slots for a turf
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

  // Load profile from authService
  const loadUserProfile = () => {
    const user = authService.getCurrentUser();
    if (user) {
      setUserProfile({
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  };

  // Offline booking form change
  const handleOfflineBookingChange = (e) => {
    const { name, value } = e.target;
    setOfflineBookingData((prev) => ({ ...prev, [name]: value }));
  };

  // Create offline booking — matches bookingService.createOfflineBooking({ ... })
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
      // bookingService expects an object (your file)
      await bookingService.createOfflineBooking(offlineBookingData);
      // refresh list
      await loadOfflineBookings(offlineBookingData.turfId);
      // keep selected turf but clear date/time/amount
      setOfflineBookingData((prev) => ({
        ...prev,
        date: '',
        startTime: '',
        endTime: '',
        amount: ''
      }));
      alert('Slot blocked successfully!');
    } catch (err) {
      console.error('Failed to create offline booking:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to block slot');
    } finally {
      setLoading(false);
    }
  };

  // Delete offline booking
  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to unblock this slot?')) return;
    try {
      setLoading(true);
      await bookingService.deleteOfflineBooking(bookingId);
      await loadOfflineBookings(offlineBookingData.turfId);
      alert('Slot unblocked successfully!');
    } catch (err) {
      console.error('Failed to delete offline booking:', err);
      alert('Failed to unblock slot');
    } finally {
      setLoading(false);
    }
  };

  // Profile update callback for modal
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile({
      firstName: updatedProfile.firstName || updatedProfile.fullName?.split(' ')[0] || '',
      lastName: updatedProfile.lastName || updatedProfile.fullName?.split(' ').slice(1).join(' ') || '',
      email: updatedProfile.email || '',
      phone: updatedProfile.phone || ''
    });
  };

  // Effects: initial load
  useEffect(() => {
    loadMyTurfs();
    loadUserProfile();
  }, []);

  // When selected turf changes, load bookings
  useEffect(() => {
    if (selectedTurfId) {
      loadBookingsForSelected(selectedTurfId);
      // Also load offline bookings for that turf
      loadOfflineBookings(selectedTurfId);
    }
  }, [selectedTurfId]);

  // Render: Overview tab (simple)
  const renderOverview = () => (
    <div className="rounded-lg p-6 bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total Turfs</div>
          <div className="text-2xl font-semibold">{ownerStats.totalTurfs || myTurfs.length}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total Bookings</div>
          <div className="text-2xl font-semibold">{ownerStats.totalBookings || 0}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-2xl font-semibold">₹{ownerStats.totalRevenue || 0}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Pending Requests</div>
          <div className="text-2xl font-semibold">{ownerStats.pendingRequests || 0}</div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Quick Summary</h3>
        <p className="text-gray-700">Overview tab content here</p>
      </div>
    </div>
  );

  // Render: My Turfs tab
  const renderMyTurfs = () => (
    <div>
      {loading ? (
        <p>Loading your turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p className="text-gray-500">You don't have any turfs yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTurfs.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-xl shadow">
              <h4 className="font-semibold">{t.name}</h4>
              <p className="text-sm text-gray-500">{t.location || t.address || 'Location not set'}</p>

              <div className="mt-4 flex gap-2">
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                  onClick={() => {
                    setViewTurfId(t.id);
                    setShowTurfDetailsModal(true);
                  }}
                >
                  View Details
                </button>

                <button
                  className="px-3 py-2 bg-green-600 text-white rounded"
                  onClick={() => {
                    setOfflineBookingData((prev) => ({ ...prev, turfId: t.id }));
                    setSelectedTurfId(t.id);
                    setActiveTab('offlineBookings');
                    loadOfflineBookings(t.id);
                  }}
                >
                  Manage Offline Bookings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render: Bookings tab (simple listing)
  const renderBookings = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Bookings</h3>
      {!selectedTurfId ? (
        <p className="text-gray-600">Select a turf (from My Turfs) to see bookings or open the turf details.</p>
      ) : loadingBookings ? (
        <p>Loading bookings...</p>
      ) : turfBookings.length === 0 ? (
        <p className="text-gray-600">No bookings found for selected turf.</p>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {turfBookings.map((b) => (
                <tr key={b.id || `${b.bookingDate}-${b.startTime}-${b.endTime}`}>
                  <td className="px-4 py-2 text-sm">{new Date(b.bookingDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm">{b.startTime} - {b.endTime}</td>
                  <td className="px-4 py-2 text-sm">{b.userName || b.user?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm">₹{b.totalAmount || b.amount || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render: Offline Bookings (full working version)
  const renderOfflineBookings = () => (
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
                {myTurfs.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
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
        <div className="text-gray-600">Please select a turf to view blocked slots.</div>
      ) : loadingOfflineBookings ? (
        <div className="text-center py-8">Loading...</div>
      ) : offlineBookings.length === 0 ? (
        <div className="text-gray-600">No blocked slots found for this turf.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offlineBookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {b.startTime || '-'} - {b.endTime || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Blocked
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {b.totalAmount ? `₹${b.totalAmount}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteOfflineBooking(b.id)} className="text-red-600 hover:text-red-900">
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

  // Analytics placeholder
  const renderAnalytics = () => (
    <div className="rounded-lg p-6 bg-white shadow-sm">
      <p>Analytics tab content here</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Turf Owner Dashboard</h1>

        <div className="bg-white rounded-xl shadow-md">
          <nav className="border-b flex space-x-4 px-6">
            {['overview', 'myTurfs', 'bookings', 'offlineBookings', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'myTurfs' ? 'My Turfs' : tab === 'bookings' ? 'Bookings' : tab === 'offlineBookings' ? 'Offline Bookings' : 'Analytics'}
              </button>
            ))}
          </nav>

          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'myTurfs' && renderMyTurfs()}
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'offlineBookings' && renderOfflineBookings()}
            {activeTab === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </div>

      <TurfDetailsModal isOpen={showTurfDetailsModal} onClose={() => setShowTurfDetailsModal(false)} turfId={viewTurfId} />
      <PersonalDetailsModal isOpen={showPersonalDetailsModal} onClose={() => setShowPersonalDetailsModal(false)} onProfileUpdate={handleProfileUpdate} />
    </div>
  );
};

export default TurfOwnerDashboard;
