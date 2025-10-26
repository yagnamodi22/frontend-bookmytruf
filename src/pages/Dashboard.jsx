import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, MapPin, Star, CreditCard, User } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';

const Dashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    createdAt: null,
    favoriteSport: 'Football'
  });
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    favoriteSport: 'Football'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
      // console.log(data);

    } catch (err) {
      setError(err?.response?.data || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await bookingService.getMyBookingStats();
      if (Array.isArray(bookings) && bookings.length === 0 && stats?.totalBookings > 0) {
        // keep showing consistent stats even before bookings list finishes loading
      }
      setServerTotals({
        totalBookings: Number(stats?.totalBookings || 0),
        totalSpent: Number(stats?.totalSpent || 0)
      });
    } catch (_) {
      // ignore; fall back to list-derived totals
    }
  };

  const loadUserProfile = () => {
    const user = authService.getCurrentUser();
    if (user) {
      const profile = {
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '+91 98765 43210',
        createdAt: user.createdAt ? new Date(user.createdAt) : null,
        favoriteSport: 'Football'
      };
      setUserProfile(profile);
      setProfileForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        favoriteSport: profile.favoriteSport
      });
    }
  };

  useEffect(() => {
    loadBookings();
    loadStats();
    loadUserProfile();
  }, []);

  // Refresh data when returning from booking page
  useEffect(() => {
    if (location.state?.refreshDashboard) {
      loadBookings();
      
      // Show success message if booking was successful
      if (location.state?.bookingSuccess) {
        const bookingCount = location.state?.bookingCount || 1;
        const totalAmount = location.state?.totalAmount || 0;
        setSuccessMessage(`Successfully booked ${bookingCount} slot${bookingCount > 1 ? 's' : ''} for ₹${totalAmount.toLocaleString()}`);
        setShowSuccessMessage(true);
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      }
    }
  }, [location.state]);

  // Periodic refresh to keep data up-to-date
  useEffect(() => {
    const interval = setInterval(() => {
      loadBookings();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);


  const pastBookings = useMemo(() => {
    const now = new Date();
    return Array.isArray(bookings)
      ? bookings.filter(b => new Date(b.bookingDate) < now)
          .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)) // Sort by most recent first
      : [];
  }, [bookings]);

  const [serverTotals, setServerTotals] = useState({ totalBookings: 0, totalSpent: 0 });

  const totalSpent = useMemo(() => {
    if (!Array.isArray(bookings)) return 0;
    return bookings.reduce((sum, b) => {
      const val = b.totalAmount ?? b.amount ?? b.price ?? 0;
      return sum + Number(val);
    }, 0);
  }, [bookings]);

  // Optimistic display fallbacks right after booking navigation
  const displayTotalBookings = useMemo(() => {
    const count = Array.isArray(bookings) ? bookings.length : serverTotals.totalBookings;
    if (count === 0 && location.state?.bookingSuccess) {
      return location.state?.bookingCount || 0;
    }
    return count;
  }, [bookings, serverTotals, location.state]);

  const displayTotalSpent = useMemo(() => {
    if (totalSpent === 0 && serverTotals.totalSpent > 0) {
      return serverTotals.totalSpent;
    }
    if (totalSpent === 0 && location.state?.bookingSuccess) {
      return Number(location.state?.totalAmount || 0);
    }
    return totalSpent;
  }, [totalSpent, serverTotals, location.state]);

  const handleCancel = async (id) => {
    try {
      setCancellingId(id);
      await bookingService.cancelBooking(id);
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setUserProfile(prev => ({
          ...prev,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phone: updatedProfile.phone
        }));

        // Update localStorage user data
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          currentUser.firstName = updatedProfile.firstName;
          currentUser.lastName = updatedProfile.lastName;
          currentUser.phone = updatedProfile.phone;
          currentUser.fullName = `${updatedProfile.firstName} ${updatedProfile.lastName}`;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        alert('Profile updated successfully!');
      } else {
        const errorData = await response.text();
        setError(errorData || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const policy = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (!policy.test(passwordForm.newPassword)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }

    setChangingPassword(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: passwordForm.newPassword, // Backend expects new password in email field
          password: passwordForm.currentPassword
        })
      });

      if (response.ok) {
        alert('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        const errorData = await response.text();
        setError(errorData || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const renderBookingsTab = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Past Bookings</h3>
        {loading ? (
          <div className="text-center py-8 bg-white rounded-xl">Loading…</div>
        ) : pastBookings.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg mb-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Bookings</h4>
            </div>
            {pastBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-300 hover:border-green-500 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{booking.turf?.name || 'Turf'}</h4>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {booking.turf?.location || '—'}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(booking.bookingDate)}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {booking.startTime} - {booking.endTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-600">₹{booking.amount || booking.price || 0}</div>
                    <div className="text-sm text-gray-600">{booking.duration || ''}</div>
                    <div className="mt-2">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {booking.status || 'completed'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" /> View Receipt
                  </button>
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> Book Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No past bookings</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={userProfile.email}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                readOnly
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Sport</label>
              <select
                value={profileForm.favoriteSport}
                onChange={(e) => setProfileForm(prev => ({ ...prev, favoriteSport: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
                <option value="basketball">Basketball</option>
                <option value="tennis">Tennis</option>
                <option value="badminton">Badminton</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>

      {showPasswordForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h4>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                minLength={8}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Array.isArray(bookings) ? bookings.length : 0}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">4.8</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">₹{totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your bookings and profile</p>
          
          {showSuccessMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={() => setShowSuccessMessage(false)}
                      className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{displayTotalBookings}</p>
              </div>
              <Star className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">₹{displayTotalSpent.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-2xl font-semibold text-gray-900">{formatDate(userProfile.createdAt)}</p>
              </div>
              <User className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bookings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                My Bookings
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Profile Settings
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'bookings' && renderBookingsTab()}
            {activeTab === 'profile' && renderProfileTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;