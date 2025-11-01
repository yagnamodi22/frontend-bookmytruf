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

  // 🟢 Offline Booking Tab UI (enhanced: slot UI + fallback to manual)
  const renderOfflineBookingsTab = () => {
    // Slots state for interactive slot selection (fallback to manual time inputs)
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState(null);

    // Helper to try multiple bookingService functions for fetching slots
    const fetchAvailableSlots = async (turfId, date) => {
      if (!turfId || !date) return [];
      const tryFns = [
        'getAvailableSlots',
        'getSlots',
        'getSlotsByTurf',
        'getSlotsByTurfAndDate',
        'getTurfSlots',
        'fetchAvailableSlots'
      ];
      for (const name of tryFns) {
        const fn = bookingService[name];
        if (typeof fn === 'function') {
          try {
            // Some implementations expect (turfId, date), others (turfId, { date })
            const res = await fn(turfId, date);
            // normalize array
            if (Array.isArray(res)) return res;
            if (Array.isArray(res?.content)) return res.content;
            if (Array.isArray(res?.data)) return res.data;
            return res || [];
          } catch (err) {
            console.warn('fetchAvailableSlots: function', name, 'failed', err);
            continue;
          }
        }
      }

      // Last resort: try a generic booking fetch and derive slots (non-exhaustive)
      if (typeof bookingService.getBookingsByTurf === 'function') {
        try {
          const b = await bookingService.getBookingsByTurf(offlineBookingData.turfId, date);
          return Array.isArray(b) ? b : (b?.content || []);
        } catch (err) { /* ignore */ }
      }

      return [];
    };

    // Load slots whenever turfId or date changes
    useEffect(() => {
      const turfId = offlineBookingData.turfId;
      const date = offlineBookingData.date;
      if (!turfId || !date) {
        setAvailableSlots([]);
        setSelectedSlotId(null);
        return;
      }
      let mounted = true;
      (async () => {
        setSlotsLoading(true);
        try {
          const slots = await fetchAvailableSlots(turfId, date);
          if (!mounted) return;
          setAvailableSlots(Array.isArray(slots) ? slots : []);
        } catch (err) {
          console.error('Failed to fetch slots', err);
          if (!mounted) return;
          setAvailableSlots([]);
        } finally {
          if (mounted) setSlotsLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, [offlineBookingData.turfId, offlineBookingData.date]);

    // When a slot is selected, auto-fill start/end time and amount
    useEffect(() => {
      if (!selectedSlotId) return;
      const slot = availableSlots.find(s => s.id === selectedSlotId || s.slotId === selectedSlotId);
      if (slot) {
        setOfflineBookingData(prev => ({
          ...prev,
          startTime: slot.startTime || slot.from || slot.start || prev.startTime,
          endTime: slot.endTime || slot.to || slot.end || prev.endTime,
          amount: slot.price || slot.amount || prev.amount
        }));
      }
    }, [selectedSlotId, availableSlots]);

    // Load offline bookings when turf is selected
    useEffect(() => {
      if (offlineBookingData.turfId) {
        loadOfflineBookings(offlineBookingData.turfId);
      }
    }, [offlineBookingData.turfId]);

    const handleSelectSlot = (slot) => {
      const id = slot.id || slot.slotId || `${slot.startTime}-${slot.endTime}-${slot.price || ''}`;
      if (selectedSlotId === id) {
        setSelectedSlotId(null);
      } else {
        setSelectedSlotId(id);
      }
    };

    const submitHandler = async (e) => {
      // reuse existing handler but ensure selected slot data present
      e.preventDefault();
      // if slot selected, ensure offlineBookingData has slot times
      try {
        setLoading(true);
        await handleCreateOfflineBooking(e); // existing function uses offlineBookingData
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Offline Bookings</h2>

        {/* Form to add offline booking */}
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Block Slot for Offline Booking</h3>
          <form onSubmit={submitHandler} className="space-y-4">
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

              {/* If availableSlots exist, render them; otherwise show manual time inputs */}
              {availableSlots && availableSlots.length > 0 ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
                  {slotsLoading ? (
                    <div>Loading slots...</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSlots.map(slot => {
                        const id = slot.id || slot.slotId || `${slot.startTime}-${slot.endTime}-${slot.price || ''}`;
                        const start = slot.startTime || slot.from || slot.start || slot.time || slot.slotStart;
                        const end = slot.endTime || slot.to || slot.end || slot.slotEnd;
                        const price = slot.price || slot.amount || slot.rate;
                        const selected = selectedSlotId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => { handleSelectSlot(slot); }}
                            className={`p-3 border rounded text-left ${selected ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:shadow-sm'}`}
                          >
                            <div className="text-sm font-medium">{start} - {end}</div>
                            <div className="text-xs text-gray-500">{price ? `₹${price}` : 'Free'}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}

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
