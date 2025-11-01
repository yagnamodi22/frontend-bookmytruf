import React, { useEffect, useState } from 'react';
import {
  Plus, MapPin, Clock, XCircle, Eye, Edit, Calendar,
  DollarSign, Users, Star, User
} from 'lucide-react';
import { turfService } from '../services/turfService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';

const TurfOwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [turfs, setTurfs] = useState([]);
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [newBooking, setNewBooking] = useState({
    date: '',
    startTime: '',
    endTime: '',
    playerName: '',
    phoneNumber: '',
  });

  // Fetch turfs owned by current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const turfsData = await turfService.getMyTurfs();
        setTurfs(turfsData || []);
        if (turfsData?.length > 0) setSelectedTurf(turfsData[0]);
      } catch (err) {
        setError('Failed to load your turfs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch offline bookings for selected turf
  useEffect(() => {
    const fetchOffline = async () => {
      if (!selectedTurf) return;
      try {
        const response = await bookingService.getOfflineBookingsByTurf(selectedTurf.id);
        setOfflineBookings(response || []);
      } catch (err) {
        console.error(err);
        setOfflineBookings([]);
      }
    };
    fetchOffline();
  }, [selectedTurf]);

  // Handle new offline booking form
  const handleOfflineBooking = async (e) => {
    e.preventDefault();
    try {
      await bookingService.createOfflineBooking({
        turfId: selectedTurf.id,
        date: newBooking.date,
        startTime: `${newBooking.startTime}:00`,
        endTime: `${newBooking.endTime}:00`,
        playerName: newBooking.playerName,
        phoneNumber: newBooking.phoneNumber,
      });
      setNewBooking({ date: '', startTime: '', endTime: '', playerName: '', phoneNumber: '' });
      const refreshed = await bookingService.getOfflineBookingsByTurf(selectedTurf.id);
      setOfflineBookings(refreshed);
      alert('Offline booking added successfully');
    } catch (err) {
      alert('Failed to add offline booking');
    }
  };

  // Handle deleting an offline booking
  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Delete this offline booking?')) return;
    try {
      await bookingService.deleteOfflineBooking(id);
      setOfflineBookings(offlineBookings.filter(b => b.id !== id));
    } catch {
      alert('Failed to delete booking');
    }
  };

  const renderOverview = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dashboard Overview</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-green-100 rounded-xl shadow-sm border border-green-200">
          <h3 className="text-gray-700 font-medium mb-2">Total Turfs</h3>
          <p className="text-3xl font-bold text-green-700">{turfs.length}</p>
        </div>
        <div className="p-6 bg-blue-100 rounded-xl shadow-sm border border-blue-200">
          <h3 className="text-gray-700 font-medium mb-2">Active Bookings</h3>
          <p className="text-3xl font-bold text-blue-700">{offlineBookings.length}</p>
        </div>
        <div className="p-6 bg-yellow-100 rounded-xl shadow-sm border border-yellow-200">
          <h3 className="text-gray-700 font-medium mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-yellow-700">₹{offlineBookings.length * 500}</p>
        </div>
      </div>
    </div>
  );

  const renderMyTurfs = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">My Turfs</h2>
        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus className="w-4 h-4 mr-2" /> Add Turf
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {turfs.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center">No turfs added yet.</p>
        ) : (
          turfs.map((turf) => (
            <div key={turf.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
              <img
                src={turf.images?.[0] || 'https://via.placeholder.com/400x200?text=Turf'}
                alt={turf.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800">{turf.name}</h3>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <MapPin className="w-4 h-4 mr-1" /> {turf.location}
                </div>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <DollarSign className="w-4 h-4 mr-1" /> ₹{turf.pricePerHour}/hr
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderOfflineBookings = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Offline Bookings</h2>

      <form onSubmit={handleOfflineBooking} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-white p-6 rounded-xl shadow-md">
        <input
          type="date"
          value={newBooking.date}
          onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
          className="border rounded-lg px-4 py-2"
          required
        />
        <input
          type="time"
          value={newBooking.startTime}
          onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
          className="border rounded-lg px-4 py-2"
          required
        />
        <input
          type="time"
          value={newBooking.endTime}
          onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
          className="border rounded-lg px-4 py-2"
          required
        />
        <input
          type="text"
          placeholder="Player Name"
          value={newBooking.playerName}
          onChange={(e) => setNewBooking({ ...newBooking, playerName: e.target.value })}
          className="border rounded-lg px-4 py-2"
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={newBooking.phoneNumber}
          onChange={(e) => setNewBooking({ ...newBooking, phoneNumber: e.target.value })}
          className="border rounded-lg px-4 py-2"
          required
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Add Booking
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-green-50 text-gray-800">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {offlineBookings.length === 0 ? (
              <tr><td colSpan="5" className="py-4 text-center text-gray-500">No offline bookings yet.</td></tr>
            ) : (
              offlineBookings.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{b.bookingDate}</td>
                  <td className="py-3 px-4">{b.startTime} - {b.endTime}</td>
                  <td className="py-3 px-4">{b.playerName}</td>
                  <td className="py-3 px-4">{b.phoneNumber}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteBooking(b.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircle className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Turf Owner Dashboard</h1>
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {['overview', 'myTurfs', 'offlineBookings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-green-50'
              }`}
            >
              {tab === 'overview' ? 'Overview' :
               tab === 'myTurfs' ? 'My Turfs' :
               'Offline Bookings'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'myTurfs' && renderMyTurfs()}
        {activeTab === 'offlineBookings' && renderOfflineBookings()}
      </div>
    </div>
  );
};

export default TurfOwnerDashboard;
