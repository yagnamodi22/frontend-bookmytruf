import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

const OfflineBookingManager = ({ turfs }) => {
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: '',
    date: '',
    startTime: '',
    endTime: '',
    amount: ''
  });
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const safeTurfs = Array.isArray(turfs) ? turfs : [];
  
  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    return [];
  };

  const handleInputChange = (field, value) => {
    setOfflineBookingData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCreateOfflineBooking = async () => {
    if (!offlineBookingData.turfId) {
      alert('Please select a turf');
      return;
    }
    if (!offlineBookingData.date) {
      alert('Please select a date');
      return;
    }
    if (!offlineBookingData.startTime || !offlineBookingData.endTime) {
      alert('Please select start and end time');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await bookingService.createOfflineBooking(
        offlineBookingData.turfId,
        offlineBookingData.date,
        offlineBookingData.startTime,
        offlineBookingData.endTime,
        offlineBookingData.amount || null
      );
      
      // Reset form and reload bookings
      setOfflineBookingData({
        turfId: offlineBookingData.turfId,
        date: offlineBookingData.date,
        startTime: '',
        endTime: '',
        amount: ''
      });
      
      // Reload offline bookings
      loadOfflineBookings(offlineBookingData.turfId);
      alert('Offline booking created successfully');
    } catch (error) {
      setError(error.response?.data || error.message || 'Failed to create offline booking');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to unblock this slot?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await bookingService.deleteOfflineBooking(bookingId);
      
      // Reload offline bookings
      loadOfflineBookings(offlineBookingData.turfId);
      alert('Slot unblocked successfully');
    } catch (error) {
      setError(error.response?.data || error.message || 'Failed to unblock slot');
    } finally {
      setLoading(false);
    }
  };
  
  const loadOfflineBookings = async (turfId) => {
    if (!turfId) return;
    
    try {
      setLoading(true);
      setError('');
      const bookings = await bookingService.getOfflineBookings(turfId);
      setOfflineBookings(normalize(bookings));
    } catch (error) {
      console.error('Failed to load offline bookings:', error);
      setError('Failed to load offline bookings');
      setOfflineBookings([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load offline bookings when turf changes
  useEffect(() => {
    if (offlineBookingData.turfId) {
      loadOfflineBookings(offlineBookingData.turfId);
    }
  }, [offlineBookingData.turfId]);
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Offline Bookings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Turf</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.turfId}
              onChange={(e) => handleInputChange('turfId', e.target.value)}
            >
              <option value="">Select a turf</option>
              {safeTurfs.map((turf) => (
                <option key={turf.id} value={turf.id}>
                  {turf.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Optional)</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Auto-calculated if empty"
            />
          </div>
        </div>
        
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={handleCreateOfflineBooking}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Block Slot'}
        </button>
      </div>
      
      {offlineBookingData.turfId ? (
        <>
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading offline bookings...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-md font-medium text-gray-700 p-4 border-b">Currently Blocked Slots</h3>
                
                {offlineBookings.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No offline bookings found for this turf.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {offlineBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.bookingDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.startTime} - {booking.endTime}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Offline Booked
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{booking.totalAmount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteOfflineBooking(booking.id)}
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
            </>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">Please select a turf to manage offline bookings.</p>
        </div>
      )}
    </div>
  );
};

export default OfflineBookingManager;