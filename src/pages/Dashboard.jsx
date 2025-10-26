import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const current = await bookingService.getMyBookings();
        const past = await bookingService.getPastBookings();
        setBookings(current || []);
        setPastBookings(past || []);
      } catch (err) {
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const renderPastBookings = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl p-8 text-center text-gray-600">
          Loading your past bookings…
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 text-center">
          {error}
        </div>
      );
    }

    if (pastBookings.length === 0) {
      return (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No past bookings yet</p>
          <p className="text-gray-400 mt-2">Your completed bookings will appear here</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pastBookings.map((b) => (
          <div
            key={b.id}
            className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all"
          >
            <img
              src={b.imageUrl || 'https://via.placeholder.com/400x200?text=Turf'}
              alt="Turf"
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{b.turf?.name || 'Turf'}</h3>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {b.turf?.location || 'Unknown'}
              </div>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <Calendar className="w-4 h-4 mr-1" />
                {b.bookingDate || 'N/A'}
              </div>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <Clock className="w-4 h-4 mr-1" />
                {b.startTime} - {b.endTime}
              </div>
              <div className="flex items-center mt-3 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                {b.status || 'Completed'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProfile = () => {
    const user = authService.getCurrentUser();
    if (!user) return <div className="text-center text-gray-600">No user data</div>;
    return (
      <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex space-x-4 border-b mb-8">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-2 font-medium ${
            activeTab === 'bookings'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500'
          }`}
        >
          Past Bookings
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2 font-medium ${
            activeTab === 'profile'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500'
          }`}
        >
          Profile
        </button>
      </div>

      {activeTab === 'bookings' ? renderPastBookings() : renderProfile()}
    </div>
  );
};

export default Dashboard;
