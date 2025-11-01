// src/pages/TurfOwnerDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, MapPin, Clock, XCircle, Eye, Edit, Calendar, DollarSign, Users, Star, User } from 'lucide-react';
import { turfService } from '../services/turfService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import api from '../services/api';
import PersonalDetailsModal from '../components/PersonalDetailsModal';
import TurfDetailsModal from '../components/TurfDetailsModal';
import { getImageSrc } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';

const TurfOwnerDashboard = () => {
  const navigate = useNavigate();

  // tab state
  const [activeTab, setActiveTab] = useState('overview');

  // user & profile
  const [userProfile, setUserProfile] = useState(null);

  // turfs
  const [myTurfs, setMyTurfs] = useState([]);
  const [loadingTurfs, setLoadingTurfs] = useState(false);

  // selected turf (for bookings/offline)
  const [selectedTurfId, setSelectedTurfId] = useState(null);

  // bookings (owner view)
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // offline bookings (blocked slots)
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loadingOffline, setLoadingOffline] = useState(false);

  // offline slot block form state (uses same slot UI as Booking.jsx)
  const timeSlots = useMemo(() => [
    '06:00 - 07:00','07:00 - 08:00','08:00 - 09:00','09:00 - 10:00',
    '10:00 - 11:00','11:00 - 12:00','12:00 - 13:00','13:00 - 14:00',
    '14:00 - 15:00','15:00 - 16:00','16:00 - 17:00','17:00 - 18:00',
    '18:00 - 19:00','19:00 - 20:00','20:00 - 21:00','21:00 - 22:00',
    '22:00 - 23:00','23:00 - 00:00','00:00 - 01:00','01:00 - 02:00','02:00 - 03:00'
  ], []);

  const [offlineForm, setOfflineForm] = useState({
    turfId: '',
    date: '',
    selectedSlots: [], // like ['06:00 - 07:00', ...]
    amount: ''
  });
  const [bookedStartsForForm, setBookedStartsForForm] = useState([]); // booked start HH:mm for chosen turf/date
  const [blocking, setBlocking] = useState(false);

  // modal & details
  const [showTurfModal, setShowTurfModal] = useState(false);
  const [viewTurfId, setViewTurfId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // errors / loading
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // owner stats (optional)
  const [ownerStats, setOwnerStats] = useState({ totalTurfs: 0, totalBookings: 0, totalRevenue: 0 });

  // --------- helpers ----------
  const normalizeRespArray = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.content)) return resp.content;
    return [];
  };

  // parse slot to times
  const parseTimesFromSlot = (slot) => {
    if (!slot || !slot.includes('-')) return { startTime: '', endTime: '' };
    const [start, end] = slot.split('-').map(s => s.trim());
    return { startTime: start, endTime: end };
  };

  // get current user profile
  const loadUserProfile = () => {
    try {
      const u = authService.getCurrentUser();
      if (u) {
        setUserProfile(u);
      }
    } catch (e) {
      console.warn('Could not load profile', e);
      setUserProfile(null);
    }
  };

  // load turfs for owner
  const loadMyTurfs = async () => {
    try {
      setLoadingTurfs(true);
      const resp = await turfService.getMyTurfs();
      const list = normalizeRespArray(resp);
      setMyTurfs(list);
      setOwnerStats(prev => ({ ...prev, totalTurfs: list.length }));
      // if user has at least one turf, auto-select first if none selected
      if (!selectedTurfId && list.length > 0) {
        const first = list[0].id ?? list[0].turfId ?? list[0].id;
        setSelectedTurfId(first);
        setOfflineForm(prev => ({ ...prev, turfId: first }));
      }
    } catch (err) {
      console.error('Failed to load my turfs', err);
      setMyTurfs([]);
    } finally {
      setLoadingTurfs(false);
    }
  };

  // load bookings by turf (owner)
  const loadBookingsByTurf = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingBookings(true);
      const resp = await api.get(`/bookings/turf/${turfId}`); // returns booking details DTO
      setBookings(normalizeRespArray(resp.data ?? resp));
    } catch (err) {
      console.error('Failed to load bookings', err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // load offline blocked slots for turf
  const loadOfflineBookingsForTurf = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingOffline(true);
      const resp = await api.get(`/bookings/offline/turf/${turfId}`);
      const arr = normalizeRespArray(resp.data ?? resp);
      setOfflineBookings(arr);
    } catch (err) {
      console.error('Failed to load offline bookings', err);
      setOfflineBookings([]);
    } finally {
      setLoadingOffline(false);
    }
  };

  // get day availability for the owner form (fetch booked starts) — reuse bookingService.getDayAvailability if exists
  const loadBookedStartsForForm = async (turfId, date) => {
    if (!turfId || !date) {
      setBookedStartsForForm([]);
      return;
    }
    try {
      // backend availability endpoint: GET /bookings/availability/day?turfId=&date=
      const resp = await api.get('/bookings/availability/day', { params: { turfId, date } });
      // resp is an array of LocalTime strings like '09:00:00' — convert to 'HH:mm'
      const mapped = (resp.data ?? resp).map(t => (t || '').slice(0,5));
      setBookedStartsForForm(mapped);
    } catch (err) {
      console.error('Failed to load day availability', err);
      setBookedStartsForForm([]);
    }
  };

  // toggle a slot in offline form
  const toggleOfflineSlot = (slot) => {
    const { startTime } = parseTimesFromSlot(slot);
    const startHHmm = startTime.slice(0,5);
    // cannot select if already booked (from backend)
    if (bookedStartsForForm.includes(startHHmm)) return;
    // cannot select past slots for today (basic check)
    let isPastSlot = false;
    if (offlineForm.date === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      const slotStartTime = new Date(`${offlineForm.date}T${startTime}:00`);
      const hourNum = parseInt(startTime.split(':')[0], 10);
      if (hourNum >= 0 && hourNum < 3) {
        isPastSlot = false;
      } else {
        isPastSlot = slotStartTime < now;
      }
    }
    if (isPastSlot) return;

    setOfflineForm(prev => {
      const exists = prev.selectedSlots.includes(slot);
      const next = exists ? prev.selectedSlots.filter(s => s !== slot) : [...prev.selectedSlots, slot];
      return { ...prev, selectedSlots: next };
    });
  };

  // block selected slots (owner action)
  const handleBlockSlots = async (e) => {
    e && e.preventDefault();
    if (!offlineForm.turfId || !offlineForm.date || offlineForm.selectedSlots.length === 0) {
      alert('Please select turf, date and at least one time slot to block.');
      return;
    }
    setBlocking(true);
    try {
      // create one offline booking per slot (backend expects date, startTime, endTime)
      for (const slot of offlineForm.selectedSlots) {
        const { startTime, endTime } = parseTimesFromSlot(slot);
        const payload = {
          turfId: offlineForm.turfId,
          date: offlineForm.date,
          startTime: `${startTime}:00`,
          endTime: `${endTime}:00`,
          amount: offlineForm.amount ? Number(offlineForm.amount) : null
        };
        // use bookingService.createOfflineBooking if present
        if (bookingService && typeof bookingService.createOfflineBooking === 'function') {
          await bookingService.createOfflineBooking(payload);
        } else {
          // fallback: direct API call
          await api.post('/bookings/offline', payload);
        }
      }
      // refresh list
      await loadOfflineBookingsForTurf(offlineForm.turfId);
      // clear selected slots
      setOfflineForm(prev => ({ ...prev, selectedSlots: [], amount: '' }));
      alert('Selected slots blocked successfully.');
    } catch (err) {
      console.error('Failed to block slots', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to block slots');
    } finally {
      setBlocking(false);
    }
  };

  // delete offline booking
  const handleUnblock = async (id) => {
    if (!window.confirm('Unblock this slot?')) return;
    try {
      setLoading(true);
      await api.delete(`/bookings/offline/${id}`);
      // refresh
      await loadOfflineBookingsForTurf(offlineForm.turfId || selectedTurfId);
    } catch (err) {
      console.error('Failed to unblock', err);
      alert('Failed to unblock slot');
    } finally {
      setLoading(false);
    }
  };

  // handle selecting turf from MyTurfs -> Manage Offline Bookings
  const openManageForTurf = (turfId) => {
    setSelectedTurfId(turfId);
    setOfflineForm(prev => ({ ...prev, turfId }));
    setActiveTab('offlineBookings');
    // load offline bookings
    loadOfflineBookingsForTurf(turfId);
  };

  // initial load
  useEffect(() => {
    loadUserProfile();
    loadMyTurfs();
  }, []);

  // when selected turf changes, load bookings & offline
  useEffect(() => {
    if (selectedTurfId) {
      loadBookingsByTurf(selectedTurfId);
      loadOfflineBookingsForTurf(selectedTurfId);
    }
  }, [selectedTurfId]);

  // when offline form date or turf changes, load booked starts
  useEffect(() => {
    if (offlineForm.turfId && offlineForm.date) {
      loadBookedStartsForForm(offlineForm.turfId, offlineForm.date);
    } else {
      setBookedStartsForForm([]);
    }
  }, [offlineForm.turfId, offlineForm.date]);

  // UI renderers (keep them minimal and in your style)
  const renderOverview = () => (
    <div className="rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Overview</h3>
      <p className="text-gray-700">Overview tab content here</p>
    </div>
  );

  const renderMyTurfs = () => (
    <div className="space-y-6">
      {loadingTurfs ? (
        <p>Loading turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p>No turfs yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTurfs.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-xl shadow">
              <h4 className="font-semibold">{t.name}</h4>
              <p className="text-sm text-gray-500">{t.location || t.address || 'Location not set'}</p>
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => { setViewTurfId(t.id); setShowTurfModal(true); }}>
                  View Details
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={() => openManageForTurf(t.id)}>
                  Manage Offline Bookings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Bookings</h3>
      {!selectedTurfId ? (
        <p className="text-gray-600">Select a turf in My Turfs to view bookings.</p>
      ) : loadingBookings ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-600">No bookings found for this turf.</p>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id ?? `${b.bookingDate}-${b.startTime}`}>
                  <td className="px-4 py-2 text-sm">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 text-sm">{b.startTime ? b.startTime.slice(0,5) : '-'} - {b.endTime ? b.endTime.slice(0,5) : '-'}</td>
                  <td className="px-4 py-2 text-sm">{b.fullName || b.userName || '-'}</td>
                  <td className="px-4 py-2 text-sm">₹{b.totalAmount || b.amount || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderOfflineBookings = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold mb-6">Offline Bookings</h3>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <form onSubmit={handleBlockSlots} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Turf *</label>
              <select
                name="turfId"
                value={offlineForm.turfId}
                onChange={(e) => { setOfflineForm(prev => ({ ...prev, turfId: e.target.value })); setSelectedTurfId(e.target.value); }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a turf</option>
                {myTurfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={offlineForm.date}
                onChange={(e) => setOfflineForm(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot(s)</label>
            <div className="overflow-x-auto pb-2 -mx-2 px-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 min-w-max sm:min-w-0">
                {timeSlots.map(slot => {
                  const { startTime } = parseTimesFromSlot(slot);
                  const start = startTime.slice(0,5);
                  const isBooked = bookedStartsForForm.includes(start);
                  const isSelected = offlineForm.selectedSlots.includes(slot);

                  // past slot detection similar to booking
                  let isPastSlot = false;
                  if (offlineForm.date === new Date().toISOString().split('T')[0]) {
                    const now = new Date();
                    const dt = new Date(`${offlineForm.date}T${startTime}:00`);
                    const hourNum = parseInt(startTime.split(':')[0], 10);
                    if (hourNum >=0 && hourNum < 3) {
                      isPastSlot = false;
                    } else {
                      isPastSlot = dt < now;
                    }
                  }

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleOfflineSlot(slot)}
                      disabled={isBooked || isPastSlot}
                      className={`px-2 py-2 rounded-lg text-xs sm:text-sm border whitespace-nowrap transition-colors w-full text-center ${
                        isBooked || isPastSlot
                          ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-green-600 rounded-sm mr-2"></span>Available</div>
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-gray-300 rounded-sm mr-2"></span>Booked</div>
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-green-200 rounded-sm mr-2"></span>Selected</div>
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-gray-200 rounded-sm mr-2"></span>Past</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (optional)</label>
              <input
                type="number"
                value={offlineForm.amount}
                onChange={(e) => setOfflineForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Optional"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={blocking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {blocking ? 'Blocking...' : 'Block Slots'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <h4 className="text-lg font-semibold mb-3">Currently Blocked Slots</h4>
      {!offlineForm.turfId ? (
        <div className="text-gray-600">Please select a turf to view blocked slots.</div>
      ) : loadingOffline ? (
        <div className="py-6 text-center">Loading...</div>
      ) : offlineBookings.length === 0 ? (
        <div className="text-gray-600">No blocked slots found for this turf.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
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
              {offlineBookings.map(b => (
                <tr key={b.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.startTime ? b.startTime.slice(0,5) : '-'} - {b.endTime ? b.endTime.slice(0,5) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.totalAmount ? `₹${b.totalAmount}` : (b.amount ? `₹${b.amount}` : '-')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleUnblock(b.id)} className="text-red-600 hover:text-red-900">Unblock</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Analytics</h3>
      <p>Analytics tab content here</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Turf Owner Dashboard</h1>

        <div className="bg-white rounded-xl shadow-md">
          <nav className="border-b flex space-x-4 px-6">
            {['overview','myTurfs','bookings','offlineBookings','analytics'].map(tab => (
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

      <TurfDetailsModal isOpen={showTurfModal} onClose={() => setShowTurfModal(false)} turfId={viewTurfId} />
      <PersonalDetailsModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} onProfileUpdate={(p) => setUserProfile(p)} />
    </div>
  );
};

export default TurfOwnerDashboard;
