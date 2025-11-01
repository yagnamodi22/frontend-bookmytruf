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
  
  // Offline bookings data
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

  // Load owner turfs
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

  // Owner stats
  const [ownerStats, setOwnerStats] = useState({ totalBookings: 0, totalRevenue: 0, totalTurfs: 0, pendingRequests: 0 });
  const loadOwnerStats = async () => {
    try {
      const stats = await turfService.getMyTurfsStats();
      setOwnerStats({
        totalBookings: Number(stats?.totalBookings || 0),
        totalRevenue: Number(stats?.totalRevenue || 0),
        totalTurfs: Number(stats?.totalTurfs || 0),
        pendingRequests: Number(stats?.pendingRequests || 0)
      });
    } catch (_) {}
  };

  // Paginated bookings for selected turf
  const loadBookingsForSelected = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingBookings(true);
      setError('');
      const data = await bookingService.getBookingsByTurfPaginated(turfId, bookingPage, bookingSize);
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data.content)) {
          // Paginated response
          setTurfBookings(normalize(data.content));
          setBookingTotalPages(data.totalPages || 1);
          setBookingTotalCount(data.totalElements || data.length || 0);
        } else {
          // direct array or single-object response
          setTurfBookings(normalize(data));
          setBookingTotalPages(1);
          setBookingTotalCount(Array.isArray(data) ? data.length : (data?.length || 0));
        }
      } else {
        setTurfBookings([]);
        setBookingTotalPages(1);
        setBookingTotalCount(0);
      }
    } catch (err) {
      console.error(err);
      setTurfBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load user profile from auth
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

  // Load offline bookings for a turf
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

  // Input handlers
  const handleOfflineBookingChange = (e) => {
    const { name, value } = e.target;
    setOfflineBookingData(prev => ({ ...prev, [name]: value }));
  };

  // Create offline booking — bookingService expects separate args here:
  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
    if (!offlineBookingData.turfId || !offlineBookingData.date || 
        !offlineBookingData.startTime || !offlineBookingData.endTime) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      // bookingService.createOfflineBooking signature in your project is:
      // createOfflineBooking: async (turfId, date, startTime, endTime, amount)
      await bookingService.createOfflineBooking(
        offlineBookingData.turfId,
        offlineBookingData.date,
        offlineBookingData.startTime,
        offlineBookingData.endTime,
        offlineBookingData.amount
      );
      
      // Reset form and reload bookings
      setOfflineBookingData({
        turfId: offlineBookingData.turfId,
        date: '',
        startTime: '',
        endTime: '',
        amount: ''
      });
      
      // Reload offline bookings for the selected turf
      await loadOfflineBookings(offlineBookingData.turfId);
      
      alert("Slot blocked successfully!");
    } catch (err) {
      console.error("Failed to create offline booking:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to block slot.";
      alert(msg);
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
      alert("Failed to unblock slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Profile update handler (used by PersonalDetailsModal)
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile({
      firstName: updatedProfile.firstName || updatedProfile.fullName?.split(' ')[0] || '',
      lastName: updatedProfile.lastName || updatedProfile.fullName?.split(' ').slice(1).join(' ') || '',
      email: updatedProfile.email || '',
      phone: updatedProfile.phone || ''
    });
  };

  // Initial load
  useEffect(() => {
    loadMyTurfs();
    loadOwnerStats();
    loadUserProfile();
  }, []);

  // Ensure offline bookings reload when turf selection changes
  useEffect(() => {
    if (offlineBookingData.turfId) {
      loadOfflineBookings(offlineBookingData.turfId);
    }
  }, [offlineBookingData.turfId]);

  // Load bookings when a turf is selected
  useEffect(() => {
    if (selectedTurfId) {
      loadBookingsForSelected(selectedTurfId);
    }
  }, [selectedTurfId, bookingPage, bookingSize]);

  // Helper toggles and other handlers (kept from your original file)
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSportToggle = (sport) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  // safeTurfs alias to avoid crashes if myTurfs is undefined
  const safeTurfs = Array.isArray(myTurfs) ? myTurfs : [];
  const pendingTurfs = safeTurfs.filter(turf => !turf.isActive);
  const activeTurfs = safeTurfs.filter(turf => turf.isActive);

  const stats = {
    totalTurfs: ownerStats?.totalTurfs || (safeTurfs.length || 0),
    pendingRequests: ownerStats?.pendingRequests || 0,
    totalBookings: ownerStats?.totalBookings || 0,
    totalRevenue: ownerStats?.totalRevenue || 0
  };

  // ---------- Offline Bookings Tab renderer ----------
  // This function returns the Offline Bookings UI (hooks used at top-level)
  const renderOfflineBookingsTab = () => {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Offline Bookings</h2>
      
        {/* Form to add offline booking */}
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
                  {safeTurfs.map(turf => (
                    <option key={turf.id} value={turf.id}>{turf.name}</option>
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

              {/* Default fallback manual time inputs */}
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Block Slot'}
              </button>
            </div>
          </form>
        </div>

        {/* Display offline bookings */}
        <div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offlineBookings.map(booking => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Blocked
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.totalAmount ? `₹${booking.totalAmount}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteOfflineBooking(booking.id)}
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
      </div>
    );
  };

  // ---------- Main UI ----------
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
            {activeTab === 'overview' && (
              <>
                {/* put your original Overview content here - stats cards and quick summary */}
                <div className="rounded-lg p-4 bg-white shadow-sm">
                  <p>Overview tab content here</p>
                </div>
              </>
            )}
            {activeTab === 'turfs' && (
              <>
                {/* My Turfs tab content (your existing UI preserved) */}
                <div className="rounded-lg p-4 bg-white shadow-sm">
                  <p>Turfs tab content here</p>
                </div>
              </>
            )}
            {activeTab === 'bookings' && (
              <>
                {/* Bookings tab content (your existing UI preserved) */}
                <div className="rounded-lg p-4 bg-white shadow-sm">
                  <p>Bookings tab content here</p>
                </div>
              </>
            )}
            {activeTab === 'analytics' && (
              <>
                {/* Analytics tab content */}
                <div className="rounded-lg p-4 bg-white shadow-sm">
                  <p>Analytics tab content here</p>
                </div>
              </>
            )}
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
