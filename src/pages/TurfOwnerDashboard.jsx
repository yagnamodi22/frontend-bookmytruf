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
      setLoadingOfflineBookings(true);
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
    } catch (err) {
      setError(err?.response?.data || 'Failed to create offline booking');
    } finally {
      setLoadingOfflineBookings(false);
    }
  };
  
  // Handle offline booking deletion
  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to unblock this slot?')) {
      return;
    }
    
    try {
      setLoadingOfflineBookings(true);
      setError('');
      await bookingService.deleteOfflineBooking(bookingId);
      
      // Reload offline bookings
      loadOfflineBookings(offlineBookingData.turfId);
      alert('Slot unblocked successfully');
    } catch (err) {
      setError(err?.response?.data || 'Failed to unblock slot');
    } finally {
      setLoadingOfflineBookings(false);
    }
  };
  
  // Load offline bookings for a turf
  const loadOfflineBookings = async (turfId) => {
    if (!turfId) return;
    
    try {
      setLoadingOfflineBookings(true);
      setError('');
      const bookings = await bookingService.getOfflineBookings(turfId);
      setOfflineBookings(normalize(bookings));
    } catch (err) {
      console.error('Failed to load offline bookings:', err);
      setError('Failed to load offline bookings');
      setOfflineBookings([]);
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

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
      setError('');
      const data = await bookingService.getBookingsByTurfPaginated(turfId, bookingPage, bookingSize);
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data.content)) {
          // Paginated response
          setTurfBookings(normalize(data.content));
          setBookingTotalPages(data.totalPages || 0);
          setBookingTotalCount(data.totalElements || 0);
        } else if (Array.isArray(data)) {
          // Direct array response (fallback)
          setTurfBookings(normalize(data));
          setBookingTotalPages(1);
          setBookingTotalCount(data.length || 0);
        } else {
          // Fallback
          setTurfBookings([]);
          setBookingTotalPages(0);
          setBookingTotalCount(0);
        }
      } else {
        setTurfBookings([]);
        setBookingTotalPages(0);
        setBookingTotalCount(0);
      }
    } catch (err) {
      setError(err?.response?.data || 'Failed to load bookings');
      setTurfBookings([]);
      setBookingTotalPages(0);
      setBookingTotalCount(0);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadUserProfile = () => {
    const user = authService.getCurrentUser();
    if (user) {
      const profile = {
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '+91 98765 43210'
      };
      setUserProfile(profile);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    // Update the local user profile state
    setUserProfile({
      firstName: updatedProfile.firstName || updatedProfile.fullName?.split(' ')[0] || '',
      lastName: updatedProfile.lastName || updatedProfile.fullName?.split(' ').slice(1).join(' ') || '',
      email: updatedProfile.email || '',
      phone: updatedProfile.phone || ''
    });
  };

  useEffect(() => {
    loadMyTurfs();
    loadOwnerStats();
    loadUserProfile();
  }, []);
  
  // Load offline bookings when turf changes
  useEffect(() => {
    if (offlineBookingData.turfId) {
      loadOfflineBookings(offlineBookingData.turfId);
    }
  }, [offlineBookingData.turfId]);

  useEffect(() => {
    if (selectedTurfId) {
      loadBookingsForSelected(selectedTurfId);
    }
  }, [selectedTurfId, bookingPage, bookingSize]);

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

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check if adding these files would exceed the 5 image limit
      const totalImages = selectedImages.length + files.length;
      const canAddCount = Math.min(files.length, 5 - selectedImages.length);
      
      if (canAddCount <= 0) {
        setError('Maximum 5 images allowed');
        return;
      }
      
      // Add new files to existing selection (up to 5 total)
      const newFiles = files.slice(0, canAddCount);
      const updatedImages = [...selectedImages, ...newFiles];
      setSelectedImages(updatedImages);
      
      // Create preview URLs for new files and add to existing previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        images: updatedImages
      }));
      
      // Clear any previous errors
      setError('');
    }
  };

  const handleOpenViewTurf = (turfId) => {
    setViewTurfId(turfId);
    setShowTurfDetailsModal(true);
  };

  const handleOpenEditTurf = (turf) => {
    setIsEditing(true);
    setEditingTurfId(turf.id);
    // Prefill form fields from turf
    const priceValue = turf.pricePerHour || turf.price || '';
    const amenitiesArray = Array.isArray(turf.amenities)
      ? turf.amenities
      : (typeof turf.amenities === 'string'
        ? turf.amenities.split(',').map((s) => s.trim()).filter(Boolean)
        : []);

    setFormData({
      turfName: turf.name || '',
      location: turf.location || '',
      description: turf.description || '',
      price: priceValue,
      sports: [],
      amenities: amenitiesArray,
      images: [] // keep empty until user selects new files
    });

    // Prepare previews from existing images string, if any
    const imagesStr = typeof turf.images === 'string' ? turf.images : '';
    setExistingImagesString(imagesStr);
    const previews = imagesStr
      ? imagesStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    setSelectedImages([]);
    setImagePreviews(previews);

    setShowAddTurfForm(true);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.turfName || !formData.location || !formData.description || !formData.price) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }

      let payloadBase = {
        name: formData.turfName,
        description: formData.description,
        location: formData.location,
        pricePerHour: Number(formData.price),
        amenities: formData.amenities.join(',')
      };

      // If user selected new images, convert and send as imageArray; otherwise keep previous images when editing
      if (formData.images && formData.images.length > 0) {
        const imageStrings = await Promise.all(
          formData.images.map(file => {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            });
          })
        );
        payloadBase = { ...payloadBase, imageArray: imageStrings };
      } else if (isEditing && existingImagesString) {
        payloadBase = { ...payloadBase, images: existingImagesString };
      }

      console.log('Submitting turf with payload:', payloadBase, 'isEditing:', isEditing);

      let result;
      if (isEditing && editingTurfId) {
        result = await turfService.updateTurf(editingTurfId, payloadBase);
      } else {
        result = await turfService.createTurf(payloadBase);
      }
      
      console.log('Turf creation result:', result);
      
      // Show success message
      alert(isEditing ? 'Turf updated successfully!' : 'Turf submitted for approval successfully!');
      
      setShowAddTurfForm(false);
      setIsEditing(false);
      setEditingTurfId(null);
      setExistingImagesString('');
      setFormData({ turfName: '', location: '', description: '', price: '', sports: [], amenities: [], images: [] });
      setSelectedImages([]);
      setImagePreviews([]);
      await loadMyTurfs();
      
    } catch (err) {
      console.error('Turf creation error:', err);
      
      let errorMessage = 'Failed to submit turf';
      
      if (err?.response?.data) {
        errorMessage = err.response.data;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.toString) {
        errorMessage = err.toString();
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const safeTurfs = Array.isArray(myTurfs) ? myTurfs : [];
  const pendingTurfs = safeTurfs.filter(turf => !turf.isActive);
  const activeTurfs = safeTurfs.filter(turf => turf.isActive);
  
  const stats = {
    totalTurfs: safeTurfs.length,
    pendingRequests: pendingTurfs.length,
    totalBookings: ownerStats.totalBookings || safeTurfs.reduce((sum, turf) => sum + (turf.totalBookings || 0), 0),
    totalRevenue: ownerStats.totalRevenue || safeTurfs.reduce((sum, turf) => sum + (turf.revenue || 0), 0)
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <p className="text-lg font-medium text-gray-900">{userProfile.firstName} {userProfile.lastName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <p className="text-lg font-medium text-gray-900">{userProfile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Phone</label>
            <p className="text-lg font-medium text-gray-900">{userProfile.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Role</label>
            <p className="text-lg font-medium text-gray-900">Turf Owner</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Turfs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTurfs}</p>
            </div>
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={() => setShowAddTurfForm(true)}
            className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 p-3 md:p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 text-green-600 mb-1 sm:mb-0" />
            <span className="text-green-600 font-medium text-sm md:text-base text-center sm:text-left">Add New Turf</span>
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 p-3 md:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mb-1 sm:mb-0" />
            <span className="text-blue-600 font-medium text-sm md:text-base text-center sm:text-left">Manage Bookings</span>
          </button>
          <button 
            onClick={() => setShowPersonalDetailsModal(true)}
            className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 p-3 md:p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <User className="w-5 h-5 md:w-6 md:h-6 text-orange-600 mb-1 sm:mb-0" />
            <span className="text-orange-600 font-medium text-sm md:text-base text-center sm:text-left">Personal Details</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 p-3 md:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mb-1 sm:mb-0" />
            <span className="text-purple-600 font-medium text-sm md:text-base text-center sm:text-left">View Revenue</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">Recent Bookings</h3>
        {safeTurfs.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {safeTurfs.slice(0, 3).map((turf) => (
              <div key={turf.id} className="flex items-center justify-between p-2 md:p-3 bg-green-50 rounded-lg">
                <div className="overflow-hidden">
                  <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">{turf.name}</h4>
                  <p className="text-xs md:text-sm text-gray-600">Example booking</p>
                </div>
                <div className="text-right ml-2">
                  <div className="text-base md:text-lg font-semibold text-green-600">₹800</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8 text-gray-500">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <p>No turfs yet. Add your first turf to get started!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMyTurfs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">My Turfs</h3>
        <button
          onClick={() => setShowAddTurfForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Turf</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl">Loading…</div>
      ) : safeTurfs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeTurfs.map((turf) => (
            <div key={turf.id} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${turf.isActive ? 'border-green-500' : 'border-orange-500'}`}>
              {/* Turf Images */}
              {turf.images && turf.images.split(',').length > 0 && turf.images.split(',')[0] !== '' && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {turf.images.split(',').slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image.trim()}
                        alt={`${turf.name} ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900">{turf.name}</h5>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {turf.location}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${turf.isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {turf.isActive ? 'Active' : 'Pending Approval'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                <div>
                  <span className="text-xs md:text-sm text-gray-600">Price:</span>
                  <p className="font-semibold text-green-600 text-sm md:text-base">₹{turf.pricePerHour || turf.price}/hr</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm text-gray-600">Rating:</span>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 font-semibold text-sm md:text-base">{turf.rating || '—'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs md:text-sm text-gray-600">Bookings:</span>
                  <p className="font-semibold text-sm md:text-base">{turf.totalBookings || 0}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm text-gray-600">Revenue:</span>
                  <p className="font-semibold text-sm md:text-base">₹{(turf.revenue || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex space-x-2 md:space-x-3">
                <button onClick={() => handleOpenViewTurf(turf.id)} className="flex items-center space-x-1 px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm">
                  <Eye className="w-3 h-3 md:w-4 md:h-4" />
                  <span>View</span>
                </button>
                <button onClick={() => handleOpenEditTurf(turf)} className="flex items-center space-x-1 px-2 md:px-3 py-1.5 md:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm">
                  <Edit className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No turfs added yet</p>
          <button
            onClick={() => setShowAddTurfForm(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Your First Turf
          </button>
        </div>
      )}
    </div>
  );

  const renderBookingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Manage Bookings</h3>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Turf</label>
            <select
              value={selectedTurfId}
              onChange={(e) => setSelectedTurfId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">— Choose —</option>
              {safeTurfs.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          {loadingBookings ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">Loading…</div>
          ) : selectedTurfId && turfBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {turfBookings.map(b => (
                    <tr key={b.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{b.bookingDate}</div>
                        <div className="text-sm text-gray-500">{b.startTime} - {b.endTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {b.fullName || b.userName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{b.phoneNumber || b.userPhone || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{b.email || b.userEmail || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {b.paymentMode ? b.paymentMode : (b.status === 'PENDING' ? 'Pending' : 'Not Paid')}
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{b.totalAmount || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                            b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            b.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                            b.status === 'OFFLINE' ? 'bg-gray-100 text-gray-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {b.status || 'CONFIRMED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              <div className="p-4 flex items-center justify-between border-t">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { if (bookingPage > 0) { setBookingPage(bookingPage - 1); } }}
                    disabled={bookingPage === 0}
                    className={`px-3 py-2 rounded-md text-sm ${bookingPage === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => { if (bookingPage + 1 < bookingTotalPages) { setBookingPage(bookingPage + 1); } }}
                    disabled={bookingPage + 1 >= bookingTotalPages}
                    className={`px-3 py-2 rounded-md text-sm ${bookingPage + 1 >= bookingTotalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                  >
                    Next
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Page {bookingPage + 1} of {Math.max(1, bookingTotalPages)}
                  </span>
                  
                  {bookingTotalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Go to:</label>
                      <select
                        value={bookingPage}
                        onChange={(e) => setBookingPage(parseInt(e.target.value, 10))}
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        {Array.from({ length: bookingTotalPages }, (_, i) => (
                          <option key={i} value={i}>Page {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Show:</label>
                    <select
                      value={bookingSize}
                      onChange={(e) => {
                        setBookingSize(parseInt(e.target.value, 10));
                        setBookingPage(0); // Reset to first page when changing page size
                      }}
                      className="border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="20">20 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 flex items-center justify-end border-t">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Page Size:</label>
                  <select
                    value={bookingSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value, 10);
                      setBookingSize(size);
                      setBookingPage(0); // Reset to first page when changing page size
                    }}
                    className="border rounded-md px-2 py-1"
                  >
                    {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ) : selectedTurfId ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-600">No bookings for this turf</div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-600">Select a turf to view bookings</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAddTurfForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">Add New Turf</h3>
            <button
              onClick={() => setShowAddTurfForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Turf Name *
              </label>
              <input
                type="text"
                value={formData.turfName}
                onChange={(e) => handleInputChange('turfName', e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter turf name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter complete address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe your turf facilities and features"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Hour (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter hourly rate"
                min="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sports Available
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sportsOptions.map((sport) => (
                  <label key={sport} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sports.includes(sport)}
                      onChange={() => handleSportToggle(sport)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{sport}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Turf Images (Max 5 images)
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.5 0 5.5 5.5 0 0 0 0 6.5a5.56 5.56 0 0 0 2.975 4.5H0v3h13Z"/>
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 13h3l-3-3-3 3h3Z"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> turf images
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5 images)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Selected Images ({imagePreviews.length}/5)</h4>
                      {imagePreviews.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImages([]);
                            setImagePreviews([]);
                            setFormData(prev => ({ ...prev, images: [] }));
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <svg className="w-6 h-6 mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span className="text-xs text-gray-500">Add more</span>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            multiple 
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowAddTurfForm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
              >
                {loading ? 'Submitting…' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showPersonalDetailsModal && (
          <PersonalDetailsModal
            isOpen={showPersonalDetailsModal}
            onClose={() => setShowPersonalDetailsModal(false)}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Turf Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your turfs and track performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="relative">
              {/* Mobile dropdown selector */}
              <div className="md:hidden p-2">
                <select 
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="overview">Overview</option>
                  <option value="turfs">My Turfs</option>
                  <option value="bookings">Bookings</option>
                  <option value="offlineBookings">Offline Bookings</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
              
              {/* Desktop tabs */}
              <nav className="hidden md:flex -mb-px overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('turfs')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'turfs'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Turfs
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'bookings'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Bookings
                </button>
                <button
                  onClick={() => setActiveTab('offlineBookings')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'offlineBookings'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Offline Bookings
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'turfs' && renderMyTurfs()}
            {activeTab === 'bookings' && renderBookingsTab()}
            {activeTab === 'offlineBookings' && renderOfflineBookingsTab()}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-semibold text-gray-900">{ownerStats.totalBookings}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-semibold text-gray-900">₹{ownerStats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Turfs</p>
                        <p className="text-2xl font-semibold text-gray-900">{safeTurfs.filter(t => t.isActive).length}</p>
                      </div>
                      <MapPin className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">By Turf</h3>
                  {safeTurfs.length === 0 ? (
                    <div className="text-gray-600">No turfs yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safeTurfs.map((turf) => (
                        <div key={turf.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{turf.name}</div>
                            <div className="text-sm text-gray-600">₹{(turf.pricePerHour || turf.price || 0)}/hr</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Status</div>
                              <div className="text-sm font-semibold">{turf.isActive ? 'Active' : 'Pending'}</div>
                            </div>
                            <button
                              onClick={() => { setSelectedTurfId(String(turf.id)); setActiveTab('bookings'); }}
                              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              View bookings
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render Offline Bookings Tab */}
    </div>
  );

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
              {safeTurfs.map((turf) => (
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

  // Component already has a return statement above
};

export default TurfOwnerDashboard;