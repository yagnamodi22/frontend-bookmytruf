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

  // 🟩 Offline booking states
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
      const data = await turfService.getMyTurfs();
      setMyTurfs(normalize(data));
    } catch (err) {
      setMyTurfs([]);
      setError('Failed to load your turfs');
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
  // =============================
  // 📊 LOAD BOOKINGS (FOR BOOKINGS TAB)
  // =============================
  const loadBookings = async (page = 0) => {
    if (!selectedTurfId) return;
    try {
      setLoadingBookings(true);
      const data = await bookingService.getBookingsByTurfPaginated(selectedTurfId, page, bookingSize);
      setTurfBookings(data.content || []);
      setBookingTotalPages(data.totalPages || 0);
      setBookingPage(data.number || 0);
      setBookingTotalCount(data.totalElements || 0);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setTurfBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadMyTurfs();
    loadOwnerStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'offlineBookings') {
      loadOfflineBookings();
    }
  }, [activeTab, selectedTurfId]);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  // =============================
  // 🧾 OFFLINE BOOKINGS LOGIC
  // =============================
  const loadOfflineBookings = async () => {
    if (!selectedTurfId) return;
    try {
      setLoadingOfflineBookings(true);
      const data = await bookingService.getOfflineBookings(selectedTurfId);
      setOfflineBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading offline bookings:', error);
      setOfflineBookings([]);
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

  const handleOfflineBookingSubmit = async (e) => {
    e.preventDefault();
    if (!offlineBookingData.turfId || !offlineBookingData.date) {
      alert('Please select a turf and date');
      return;
    }
    try {
      await bookingService.createOfflineBooking(offlineBookingData);
      setOfflineBookingData({ turfId: '', date: '', startTime: '', endTime: '', amount: '' });
      loadOfflineBookings();
      alert('Offline booking added successfully!');
    } catch (error) {
      console.error('Error creating offline booking:', error);
      alert('Failed to add offline booking');
    }
  };

  // =============================
  // 📱 UI SECTIONS
  // =============================
  const renderOverview = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Turfs</p>
            <h3 className="text-2xl font-bold text-gray-800">{myTurfs.length}</h3>
          </div>
          <MapPin size={32} className="text-blue-500" />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <h3 className="text-2xl font-bold text-gray-800">{ownerStats.totalBookings}</h3>
          </div>
          <Calendar size={32} className="text-green-500" />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-800">
              ₹{ownerStats.totalRevenue.toLocaleString()}
            </h3>
          </div>
          <DollarSign size={32} className="text-yellow-500" />
        </div>
      </div>
    </div>
  );

  const renderMyTurfs = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Turfs</h2>
        <button
          onClick={() => setShowAddTurfForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add New Turf
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading your turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p className="text-gray-500 text-center">No turfs added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTurfs.map((turf) => (
            <div key={turf.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-4">
              <img
                src={turf.images?.[0] || '/placeholder.jpg'}
                alt={turf.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <h3 className="text-lg font-semibold mt-3">{turf.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} /> {turf.location}
              </p>
              <p className="text-sm mt-1">₹{turf.pricePerHour}/hour</p>
              <div className="flex justify-between items-center mt-4">
                <button
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  onClick={() => {
                    setViewTurfId(turf.id);
                    setShowTurfDetailsModal(true);
                  }}
                >
                  <Eye size={14} /> View
                </button>
                <button
                  className="text-green-600 hover:underline text-sm flex items-center gap-1"
                  onClick={() => {
                    setEditingTurfId(turf.id);
                    setIsEditing(true);
                    setShowAddTurfForm(true);
                  }}
                >
                  <Edit size={14} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  // =============================
  // 💾 OFFLINE BOOKINGS SECTION (Fixed)
  // =============================
  const renderOfflineBookings = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Offline Bookings</h2>
        <button
          onClick={() => setShowOfflineBookingForm(!showOfflineBookingForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> {showOfflineBookingForm ? 'Close Form' : 'Add Booking'}
        </button>
      </div>

      {showOfflineBookingForm && (
        <form
          onSubmit={handleOfflineBookingSubmit}
          className="bg-white rounded-xl shadow p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Select Turf</label>
              <select
                value={offlineBookingData.turfId}
                onChange={(e) =>
                  setOfflineBookingData({ ...offlineBookingData, turfId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">-- Select Turf --</option>
                {myTurfs.map((turf) => (
                  <option key={turf.id} value={turf.id}>
                    {turf.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Select Date</label>
              <input
                type="date"
                value={offlineBookingData.date}
                onChange={(e) =>
                  setOfflineBookingData({ ...offlineBookingData, date: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          {/* SLOT SELECTION */}
          <div>
            <label className="block text-gray-700 text-sm mb-2">Select Slot</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {[
                '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM',
                '2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM',
              ].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() =>
                    setOfflineBookingData({ ...offlineBookingData, startTime: time })
                  }
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    offlineBookingData.startTime === time
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Amount (₹)</label>
              <input
                type="number"
                value={offlineBookingData.amount}
                onChange={(e) =>
                  setOfflineBookingData({ ...offlineBookingData, amount: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg mt-4"
          >
            Save Booking
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Offline Bookings</h3>

        {loadingOfflineBookings ? (
          <p className="text-gray-500 text-center">Loading...</p>
        ) : offlineBookings.length === 0 ? (
          <p className="text-gray-500 text-center">No offline bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">Date</th>
                  <th className="py-2 px-4 border-b text-left">Turf</th>
                  <th className="py-2 px-4 border-b text-left">Slot</th>
                  <th className="py-2 px-4 border-b text-left">Amount (₹)</th>
                  <th className="py-2 px-4 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {offlineBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{b.date}</td>
                    <td className="py-2 px-4 border-b">{b.turfName || '—'}</td>
                    <td className="py-2 px-4 border-b">
                      {b.startTime ? `${b.startTime}` : '—'}
                    </td>
                    <td className="py-2 px-4 border-b">₹{b.amount}</td>
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleDeleteOfflineBooking(b.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
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
  // =============================
  // 📊 ANALYTICS SECTION
  // =============================
  const renderAnalytics = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-2">Total Bookings</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalBookings}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-2">Active Turfs</p>
          <p className="text-3xl font-bold text-green-600">{myTurfs.length}</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Weekly Booking Trends</h3>
        <div className="w-full h-64 bg-gray-50 flex items-center justify-center text-gray-400">
          [Chart Placeholder]
        </div>
      </div>
    </div>
  );

  // =============================
  // 🧭 SIDEBAR NAVIGATION
  // =============================
  const renderSidebar = () => (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-8 text-green-600">Turf Owner</h1>
      <nav className="flex-1 space-y-2">
        {[
          { name: 'Overview', key: 'overview', icon: <BarChart size={18} /> },
          { name: 'My Turfs', key: 'myturfs', icon: <Home size={18} /> },
          { name: 'Offline Bookings', key: 'offlineBookings', icon: <Calendar size={18} /> },
          { name: 'Analytics', key: 'analytics', icon: <TrendingUp size={18} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
              activeTab === tab.key
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-green-50'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg flex items-center gap-2 justify-center"
      >
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );

  // =============================
  // 🧩 MAIN DASHBOARD VIEW
  // =============================
  return (
    <div className="flex min-h-screen bg-gray-50">
      {renderSidebar()}

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'myturfs' && renderMyTurfs()}
        {activeTab === 'offlineBookings' && renderOfflineBookings()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>
    </div>
  );
};

export default TurfOwnerDashboard;
