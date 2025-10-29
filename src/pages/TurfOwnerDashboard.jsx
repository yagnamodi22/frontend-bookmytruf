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
  
  // Offline booking state
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: '',
    date: '',
    startTime: '',
    endTime: '',
    amount: ''
  });
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [loadingOfflineBookings, setLoadingOfflineBookings] = useState(false);
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
  
  // Handle offline booking creation
  const handleCreateOfflineBooking = async () => {
    if (!offlineBookingData.turfId || !offlineBookingData.date || !offlineBookingData.startTime || !offlineBookingData.endTime) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoadingOfflineBookings(true);
      await bookingService.createOfflineBooking(offlineBookingData);
      
      // Reset form except turfId
      setOfflineBookingData(prev => ({
        ...prev,
        date: '',
        startTime: '',
        endTime: '',
        amount: ''
      }));
      
      // Reload offline bookings
      loadOfflineBookings(offlineBookingData.turfId);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to create offline booking');
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

  // Load offline bookings for a specific turf
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

  // Handle delete offline booking
  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to unblock this slot?')) return;
    
    try {
      setLoadingOfflineBookings(true);
      await bookingService.deleteOfflineBooking(bookingId);
      
      // Reload offline bookings
      loadOfflineBookings(offlineBookingData.turfId);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete offline booking');
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

  // Effect to load offline bookings when turfId changes
  useEffect(() => {
    if (offlineBookingData.turfId) {
      loadOfflineBookings(offlineBookingData.turfId);
    }
  }, [offlineBookingData.turfId]);

  const loadTurfBookings = async (turfId, page = 0, size = 10) => {
    if (!turfId) return;
    
    try {
      setLoadingBookings(true);
      const data = await bookingService.getTurfBookings(turfId, page, size);
      setTurfBookings(normalize(data.content));
      setBookingTotalPages(data.totalPages);
      setBookingTotalCount(data.totalElements);
    } catch (err) {
      console.error('Failed to load turf bookings:', err);
      setTurfBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadOwnerStats = async () => {
    try {
      const data = await bookingService.getOwnerStats();
      setOwnerStats(data);
    } catch (err) {
      console.error('Failed to load owner stats:', err);
    }
  };

  const loadUserProfile = async () => {
    try {
      const data = await authService.getUserProfile();
      setUserProfile(data);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  useEffect(() => {
    loadMyTurfs();
    loadOwnerStats();
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (selectedTurfId) {
      loadTurfBookings(selectedTurfId, bookingPage, bookingSize);
    }
  }, [selectedTurfId, bookingPage, bookingSize]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e, category) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return { ...prev, [category]: [...prev[category], value] };
      } else {
        return { ...prev, [category]: prev[category].filter(item => item !== value) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.turfName);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      
      // Append sports and amenities as JSON strings
      formDataToSend.append('sports', JSON.stringify(formData.sports));
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));
      
      // Append images
      selectedImages.forEach(image => {
        formDataToSend.append('images', image);
      });
      
      if (isEditing && editingTurfId) {
        // If editing, append existing images
        formDataToSend.append('existingImages', existingImagesString);
        await turfService.updateTurf(editingTurfId, formDataToSend);
      } else {
        // If creating new
        await turfService.createTurf(formDataToSend);
      }
      
      // Reset form and state
      setFormData({
        turfName: '',
        location: '',
        description: '',
        price: '',
        sports: [],
        amenities: [],
        images: []
      });
      setSelectedImages([]);
      setImagePreviews([]);
      setShowAddTurfForm(false);
      setIsEditing(false);
      setEditingTurfId(null);
      
      // Reload turfs
      loadMyTurfs();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save turf');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTurf = (turf) => {
    setFormData({
      turfName: turf.name,
      location: turf.location,
      description: turf.description,
      price: turf.price.toString(),
      sports: turf.sports || [],
      amenities: turf.amenities || [],
      images: []
    });
    
    // Set existing images
    if (turf.images && turf.images.length > 0) {
      setExistingImagesString(turf.images.join(','));
      setImagePreviews(turf.images.map(img => img));
    } else {
      setExistingImagesString('');
      setImagePreviews([]);
    }
    
    setIsEditing(true);
    setEditingTurfId(turf.id);
    setShowAddTurfForm(true);
  };

  const handleDeleteTurf = async (turfId) => {
    if (!confirm('Are you sure you want to delete this turf? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await turfService.deleteTurf(turfId);
      loadMyTurfs();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete turf');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTurfDetails = (turfId) => {
    setViewTurfId(turfId);
    setShowTurfDetailsModal(true);
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      await authService.updateProfile(profileData);
      setUserProfile(profileData);
      setShowPersonalDetailsModal(false);
      alert('Profile updated successfully');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update profile');
    }
  };

  const renderOverviewTab = () => {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <MapPin size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Turfs</p>
                <p className="text-xl font-semibold">{myTurfs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Calendar size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-xl font-semibold">{ownerStats.totalBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <DollarSign size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-semibold">₹{ownerStats.totalRevenue}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Star size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg. Rating</p>
                <p className="text-xl font-semibold">4.5</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Personal Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
            <button 
              onClick={() => setShowPersonalDetailsModal(true)}
              className="text-sm text-green-600 hover:text-green-800"
            >
              Edit
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{userProfile.firstName} {userProfile.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userProfile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turf
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {turfBookings.length > 0 ? (
                  turfBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.turfName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{booking.bookingDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.userName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{booking.totalAmount}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMyTurfsTab = () => {
    return (
      <div className="space-y-6">
        {/* Add Turf Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingTurfId(null);
              setFormData({
                turfName: '',
                location: '',
                description: '',
                price: '',
                sports: [],
                amenities: [],
                images: []
              });
              setSelectedImages([]);
              setImagePreviews([]);
              setShowAddTurfForm(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus size={16} className="mr-2" />
            Add New Turf
          </button>
        </div>
        
        {/* Add/Edit Turf Form */}
        {showAddTurfForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Turf' : 'Add New Turf'}
              </h2>
              <button
                onClick={() => setShowAddTurfForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Turf Name
                  </label>
                  <input
                    type="text"
                    name="turfName"
                    value={formData.turfName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Hour (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    accept="image/*"
                  />
                </div>
              </div>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Image Previews:</p>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sports Available
                  </label>
                  <div className="space-y-2">
                    {sportsOptions.map((sport) => (
                      <div key={sport} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`sport-${sport}`}
                          value={sport}
                          checked={formData.sports.includes(sport)}
                          onChange={(e) => handleCheckboxChange(e, 'sports')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`sport-${sport}`} className="ml-2 text-sm text-gray-700">
                          {sport}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {amenitiesOptions.map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          value={amenity}
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => handleCheckboxChange(e, 'amenities')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-gray-700">
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Turf' : 'Add Turf'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Turfs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading your turfs...</p>
            </div>
          ) : myTurfs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">You haven't added any turfs yet.</p>
              <button
                onClick={() => setShowAddTurfForm(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Your First Turf
              </button>
            </div>
          ) : (
            myTurfs.map((turf) => (
              <div key={turf.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="md:flex">
                  <div className="md:flex-shrink-0 h-48 md:h-auto md:w-48">
                    <img
                      className="h-full w-full object-cover"
                      src={turf.images && turf.images.length > 0 ? turf.images[0] : 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={turf.name}
                    />
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{turf.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 flex items-center">
                          <MapPin size={16} className="mr-1" /> {turf.location}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green-600">₹{turf.price}/hr</p>
                    </div>
                    
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {turf.description}
                    </p>
                    
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Sports:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {turf.sports && turf.sports.map((sport) => (
                          <span
                            key={sport}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewTurfDetails(turf.id)}
                          className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          <Eye size={14} className="mr-1" /> View
                        </button>
                        <button
                          onClick={() => handleEditTurf(turf)}
                          className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                        >
                          <Edit size={14} className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTurf(turf.id)}
                          className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          <XCircle size={14} className="mr-1" /> Delete
                        </button>
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setSelectedTurfId(turf.id);
                            setActiveTab('bookings');
                          }}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          View Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderBookingsTab = () => {
    return (
      <div className="space-y-6">
        {/* Turf Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Turf to View Bookings
          </label>
          <select
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            value={selectedTurfId}
            onChange={(e) => setSelectedTurfId(e.target.value)}
          >
            <option value="">Select a turf</option>
            {myTurfs.map((turf) => (
              <option key={turf.id} value={turf.id}>
                {turf.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Bookings Table */}
        {selectedTurfId ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Bookings for {myTurfs.find(t => t.id === selectedTurfId)?.name || 'Selected Turf'}
              </h2>
            </div>
            
            {loadingBookings ? (
              <div className="text-center py-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading bookings...</p>
              </div>
            ) : turfBookings.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No bookings found for this turf.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {turfBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #{booking.id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.bookingDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.startTime} - {booking.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.userName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.userEmail || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'CONFIRMED' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'CANCELLED' 
                                ? 'bg-red-100 text-red-800'
                                : booking.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{booking.totalAmount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {bookingTotalPages > 1 && (
                  <div className="px-6 py-3 flex items-center justify-between border-t">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setBookingPage(Math.max(0, bookingPage - 1))}
                        disabled={bookingPage === 0}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          bookingPage === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setBookingPage(Math.min(bookingTotalPages - 1, bookingPage + 1))}
                        disabled={bookingPage === bookingTotalPages - 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          bookingPage === bookingTotalPages - 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{bookingPage * bookingSize + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min((bookingPage + 1) * bookingSize, bookingTotalCount)}
                          </span>{' '}
                          of <span className="font-medium">{bookingTotalCount}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setBookingPage(Math.max(0, bookingPage - 1))}
                            disabled={bookingPage === 0}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              bookingPage === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>
                          
                          {[...Array(bookingTotalPages).keys()].map((page) => (
                            <button
                              key={page}
                              onClick={() => setBookingPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                bookingPage === page
                                  ? 'bg-green-50 border-green-500 text-green-600 z-10'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              } text-sm font-medium`}
                            >
                              {page + 1}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setBookingPage(Math.min(bookingTotalPages - 1, bookingPage + 1))}
                            disabled={bookingPage === bookingTotalPages - 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              bookingPage === bookingTotalPages - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">
              Please select a turf to view its bookings.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderOfflineBookingsTab = () => {
    return (
      <div className="space-y-6">
        {/* Form to Add Offline Booking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Manage Offline Bookings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Turf Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Turf
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.turfId}
              onChange={(e) =>
                setOfflineBookingData((prev) => ({
                  ...prev,
                  turfId: e.target.value,
                }))
              }
            >
              <option value="">Select a turf</option>
              {myTurfs.map((turf) => (
                <option key={turf.id} value={turf.id}>
                  {turf.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.date}
              onChange={(e) =>
                setOfflineBookingData((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.startTime}
              onChange={(e) =>
                setOfflineBookingData((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.endTime}
              onChange={(e) =>
                setOfflineBookingData((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Optional)
            </label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={offlineBookingData.amount}
              onChange={(e) =>
                setOfflineBookingData((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              placeholder="Auto-calculated if empty"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={handleCreateOfflineBooking}
          disabled={loadingOfflineBookings}
        >
          {loadingOfflineBookings ? "Processing..." : "Block Slot"}
        </button>
      </div>

     {/* Display Offline Bookings */}
      
      {offlineBookingData.turfId ? (
        <>
          {loadingOfflineBookings ? (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading offline bookings...</p>
            </div>
          ) : offlineBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No offline bookings found for this turf.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <h3 className="text-md font-medium text-gray-700 p-4 border-b">
                Currently Blocked Slots
              </h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">
            Please select a turf to manage offline bookings.
          </p>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Turf Owner Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPersonalDetailsModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <User size={16} className="mr-2" />
            My Profile
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('myTurfs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'myTurfs'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Turfs
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('offlineBookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'offlineBookings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Offline Bookings
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'myTurfs' && renderMyTurfsTab()}
        {activeTab === 'bookings' && renderBookingsTab()}
        {activeTab === 'offlineBookings' && renderOfflineBookingsTab()}
      </div>
      
      {/* Personal Details Modal */}
      {showPersonalDetailsModal && (
        <PersonalDetailsModal
          userProfile={userProfile}
          onClose={() => setShowPersonalDetailsModal(false)}
          onSave={handleUpdateProfile}
        />
      )}
      
      {/* Turf Details Modal */}
      {showTurfDetailsModal && viewTurfId && (
        <TurfDetailsModal
          turfId={viewTurfId}
          onClose={() => {
            setShowTurfDetailsModal(false);
            setViewTurfId(null);
          }}
        />
      )}
    </div>
  );
};

export default TurfOwnerDashboard;