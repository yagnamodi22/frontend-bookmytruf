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
  const [showAddTurfForm, setShowAddTurfForm] = useState(false);
  const [showPersonalDetailsModal, setShowPersonalDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    turfName: '',
    location: '',
    description: '',
    price: '',
    sports: [],
    amenities: [],
    images: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [myTurfs, setMyTurfs] = useState([]);
  const [selectedTurfId, setSelectedTurfId] = useState('');
  const [viewTurfId, setViewTurfId] = useState(null);
  const [showTurfDetailsModal, setShowTurfDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTurfId, setEditingTurfId] = useState(null);
  const [existingImagesString, setExistingImagesString] = useState('');
  const [turfBookings, setTurfBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingPage, setBookingPage] = useState(0);
  const [bookingSize, setBookingSize] = useState(10);
  const [bookingTotalPages, setBookingTotalPages] = useState(0);
  const [bookingTotalCount, setBookingTotalCount] = useState(0);
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Offline bookings
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: '',
    date: '',
    startTime: '',
    endTime: '',
    amount: ''
  });
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loadingOfflineBookings, setLoadingOfflineBookings] = useState(false);

  const sportsOptions = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];
  const amenitiesOptions = [
    'Parking', 'Restrooms', 'Floodlights', 'Changing Rooms', 
    'AC Indoor', 'Scoreboard', 'Locker Rooms', 'Cafeteria', 
    'First Aid', 'Security', 'WiFi'
  ];

  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    return [];
  };

  const loadMyTurfs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await turfService.getMyTurfs();
      setMyTurfs(normalize(data));
    } catch (err) {
      setError(err?.response?.data || 'Failed to load your turfs');
      setMyTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  const [ownerStats, setOwnerStats] = useState({ totalBookings: 0, totalRevenue: 0 });
  const loadOwnerStats = async () => {
    try {
      const stats = await turfService.getMyTurfsStats();
      setOwnerStats({
        totalBookings: Number(stats?.totalBookings || 0),
        totalRevenue: Number(stats?.totalRevenue || 0)
      });
    } catch (_) {}
  };

  const loadBookingsForSelected = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingBookings(true);
      const data = await bookingService.getBookingsByTurfPaginated(turfId, bookingPage, bookingSize);
      setTurfBookings(normalize(data.content || data));
      setBookingTotalPages(data.totalPages || 1);
      setBookingTotalCount(data.totalElements || data.length || 0);
    } catch (err) {
      console.error(err);
      setTurfBookings([]);
    } finally {
      setLoadingBookings(false);
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

  const loadOfflineBookings = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingOfflineBookings(true);
      const data = await bookingService.getOfflineBookings(turfId);
      setOfflineBookings(normalize(data));
    } catch (err) {
      console.error("Failed to load offline bookings:", err);
      setOfflineBookings([]);
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

  const handleOfflineBookingChange = (e) => {
    const { name, value } = e.target;
    setOfflineBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
    if (!offlineBookingData.turfId || !offlineBookingData.date || !offlineBookingData.startTime || !offlineBookingData.endTime) {
      alert("Please fill all required fields");
      return;
    }
    try {
      setLoading(true);
      await bookingService.createOfflineBooking(offlineBookingData);
      await loadOfflineBookings(offlineBookingData.turfId);
      setOfflineBookingData({ ...offlineBookingData, date: '', startTime: '', endTime: '', amount: '' });
      alert("Slot blocked successfully!");
    } catch (err) {
      console.error("Failed to create offline booking:", err);
      alert(err?.response?.data?.message || "Failed to block slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to unblock this slot?")) return;
    try {
      setLoading(true);
      await bookingService.deleteOfflineBooking(bookingId);
      await loadOfflineBookings(offlineBookingData.turfId);
      alert("Slot unblocked successfully!");
    } catch (err) {
      console.error("Failed to delete offline booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile({
      firstName: updatedProfile.firstName || '',
      lastName: updatedProfile.lastName || '',
      email: updatedProfile.email || '',
      phone: updatedProfile.phone || ''
    });
  };

  useEffect(() => {
    loadMyTurfs();
    loadOwnerStats();
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (selectedTurfId) loadBookingsForSelected(selectedTurfId);
  }, [selectedTurfId, bookingPage, bookingSize]);

  useEffect(() => {
    if (offlineBookingData.turfId) loadOfflineBookings(offlineBookingData.turfId);
  }, [offlineBookingData.turfId]);

  // 🟢 Offline Booking Tab UI
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
                {myTurfs.map(turf => (
                  <option key={turf.id} value={turf.id}>{turf.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" name="date" value={offlineBookingData.date} onChange={handleOfflineBookingChange} min={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input type="time" name="startTime" value={offlineBookingData.startTime} onChange={handleOfflineBookingChange} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input type="time" name="endTime" value={offlineBookingData.endTime} onChange={handleOfflineBookingChange} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" name="amount" value={offlineBookingData.amount} onChange={handleOfflineBookingChange} placeholder="Optional" className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" disabled={loading}>
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
              {offlineBookings.map(booking => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.startTime} - {booking.endTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{booking.totalAmount || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleDeleteOfflineBooking(booking.id)} className="text-red-600 hover:text-red-900">
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

  // 🧠 Main UI return
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Turf Owner Dashboard</h1>
        <div className="bg-white rounded-xl shadow-md">
          <nav className="border-b flex space-x-4 px-6">
            {['overview', 'turfs', 'bookings', 'offlineBookings', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview'
                  ? 'Overview'
                  : tab === 'turfs'
                  ? 'My Turfs'
                  : tab === 'bookings'
                  ? 'Bookings'
                  : tab === 'offlineBookings'
                  ? 'Offline Bookings'
                  : 'Analytics'}
              </button>
            ))}
          </nav>

          <div className="p-6">
            {activeTab === 'offlineBookings' && renderOfflineBookingsTab()}
            {activeTab === 'overview' && <p>Overview tab content here</p>}
            {activeTab === 'turfs' && <p>Turfs tab content here</p>}
            {activeTab === 'bookings' && <p>Bookings tab content here</p>}
            {activeTab === 'analytics' && <p>Analytics tab content here</p>}
          </div>
        </div>
      </div>

      <PersonalDetailsModal
        isOpen={showPersonalDetailsModal}
        onClose={() => setShowPersonalDetailsModal(false)}
        onProfileUpdate={handleProfileUpdate}
      />
      <TurfDetailsModal
        isOpen={showTurfDetailsModal}
        onClose={() => setShowTurfDetailsModal(false)}
        turfId={viewTurfId}
      />
    </div>
  );
};

export default TurfOwnerDashboard;
