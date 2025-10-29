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
  const [ownerStats, setOwnerStats] = useState({
    totalBookings: 0,
    totalRevenue: 0
  });
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

  // Load user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await authService.getUserProfile();
        if (userData) {
          setUserProfile({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || ''
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Load owner's turfs
  useEffect(() => {
    loadMyTurfs();
  }, []);

  // Load owner stats
  useEffect(() => {
    const fetchOwnerStats = async () => {
      try {
        const stats = await turfService.getOwnerStats();
        if (stats) {
          setOwnerStats({
            totalBookings: stats.totalBookings || 0,
            totalRevenue: stats.totalRevenue || 0
          });
        }
      } catch (err) {
        console.error('Error fetching owner stats:', err);
      }
    };

    fetchOwnerStats();
  }, []);

  // Load bookings when turf is selected
  useEffect(() => {
    if (selectedTurfId && activeTab === 'bookings') {
      loadTurfBookings();
    }
  }, [selectedTurfId, bookingPage, bookingSize, activeTab]);

  // Load offline bookings when turf is selected
  useEffect(() => {
    if (selectedTurfId && activeTab === 'offlineBookings') {
      loadOfflineBookings();
    }
  }, [selectedTurfId, activeTab]);

  const loadMyTurfs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const turfs = await turfService.getMyTurfs();
      setMyTurfs(turfs);
      
      // If we have turfs, select the first one by default
      if (turfs && turfs.length > 0 && !selectedTurfId) {
        setSelectedTurfId(turfs[0].id);
      }
    } catch (err) {
      console.error('Error loading turfs:', err);
      setError('Failed to load your turfs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTurfBookings = async () => {
    if (!selectedTurfId) return;
    
    setLoadingBookings(true);
    
    try {
      const response = await bookingService.getTurfBookings(
        selectedTurfId, 
        bookingPage, 
        bookingSize
      );
      
      setTurfBookings(response.content || []);
      setBookingTotalPages(response.totalPages || 0);
      setBookingTotalCount(response.totalElements || 0);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadOfflineBookings = async () => {
    if (!selectedTurfId) return;
    
    setLoadingOfflineBookings(true);
    
    try {
      const bookings = await bookingService.getOfflineBookings(selectedTurfId);
      setOfflineBookings(bookings || []);
    } catch (err) {
      console.error('Error loading offline bookings:', err);
    } finally {
      setLoadingOfflineBookings(false);
    }
  };

  const handleOpenViewTurf = (turfId) => {
    setViewTurfId(turfId);
    setShowTurfDetailsModal(true);
  };

  const handleOpenEditTurf = (turf) => {
    setIsEditing(true);
    setEditingTurfId(turf.id);
    setExistingImagesString(turf.images || '');
    
    // Set form data from turf
    setFormData({
      turfName: turf.name || '',
      location: turf.location || '',
      description: turf.description || '',
      price: turf.pricePerHour || turf.price || '',
      sports: turf.sports ? turf.sports.split(',').map(s => s.trim()) : [],
      amenities: turf.amenities ? turf.amenities.split(',').map(a => a.trim()) : [],
      images: []
    });
    
    // Set image previews if available
    if (turf.images) {
      const imageUrls = turf.images.split(',').map(img => img.trim()).filter(img => img);
      setImagePreviews(imageUrls);
    } else {
      setImagePreviews([]);
    }
    
    setShowAddTurfForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (type, value) => {
    setFormData(prev => {
      const currentValues = [...prev[type]];
      
      if (currentValues.includes(value)) {
        return { ...prev, [type]: currentValues.filter(item => item !== value) };
      } else {
        return { ...prev, [type]: [...currentValues, value] };
      }
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url) => {
    const updatedPreviews = imagePreviews.filter(preview => preview !== url);
    setImagePreviews(updatedPreviews);
    
    // Update the existing images string
    if (existingImagesString) {
      const images = existingImagesString.split(',').map(img => img.trim());
      const updatedImages = images.filter(img => img !== url);
      setExistingImagesString(updatedImages.join(','));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate form
      if (!formData.turfName || !formData.location || !formData.price) {
        throw new Error('Please fill in all required fields');
      }
      
      // Create FormData for file upload
      const formDataObj = new FormData();
      
      // Add text fields
      formDataObj.append('name', formData.turfName);
      formDataObj.append('location', formData.location);
      formDataObj.append('description', formData.description);
      formDataObj.append('pricePerHour', formData.price);
      formDataObj.append('sports', formData.sports.join(','));
      formDataObj.append('amenities', formData.amenities.join(','));
      
      // Add existing images if editing
      if (isEditing && existingImagesString) {
        formDataObj.append('existingImages', existingImagesString);
      }
      
      // Add new images
      selectedImages.forEach(image => {
        formDataObj.append('images', image);
      });
      
      // Create payload for non-file data
      const payloadBase = {
        name: formData.turfName,
        location: formData.location,
        description: formData.description,
        pricePerHour: formData.price,
        sports: formData.sports.join(','),
        amenities: formData.amenities.join(','),
        existingImages: existingImagesString
      };
      
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Turfs</h3>
          <button 
            onClick={() => setActiveTab('turfs')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading…</div>
        ) : safeTurfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeTurfs.slice(0, 2).map((turf) => (
              <div key={turf.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{turf.name}</h5>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${turf.isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {turf.isActive ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {turf.location}
                </div>
                <div className="flex justify-between text-sm">
                  <span>₹{turf.pricePerHour || turf.price}/hr</span>
                  <span>{turf.totalBookings || 0} bookings</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No turfs added yet. Add your first turf to get started!
          </div>
        )}
      </div>
    </div>
  );

  const renderMyTurfs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Turfs</h2>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Turfs Yet</h3>
          <p className="text-gray-600 mb-6">You haven't added any turfs yet. Add your first turf to get started!</p>
          <button
            onClick={() => setShowAddTurfForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add New Turf
          </button>
        </div>
      )}
    </div>
  );

  const renderBookingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Manage Bookings</h2>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Turf</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedTurfId}
            onChange={(e) => setSelectedTurfId(e.target.value)}
          >
            <option value="">Select a turf</option>
            {safeTurfs.filter(t => t.isActive).map(turf => (
              <option key={turf.id} value={turf.id}>{turf.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedTurfId ? (
        <>
          {loadingBookings ? (
            <div className="text-center py-12 bg-white rounded-xl">Loading bookings...</div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {b.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          View
                        </button>
                        {b.status === 'PENDING' && (
                          <>
                            <button className="text-green-600 hover:text-green-900 mr-3">
                              Confirm
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              
              {turfBookings.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found for this turf.</p>
                </div>
              )}
              
              {bookingTotalPages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{turfBookings.length}</span> of{' '}
                    <span className="font-medium">{bookingTotalCount}</span> bookings
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBookingPage(prev => Math.max(0, prev - 1))}
                      disabled={bookingPage === 0}
                      className={`px-3 py-1 border rounded ${
                        bookingPage === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setBookingPage(prev => Math.min(bookingTotalPages - 1, prev + 1))}
                      disabled={bookingPage >= bookingTotalPages - 1}
                      className={`px-3 py-1 border rounded ${
                        bookingPage >= bookingTotalPages - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600">Please select a turf to view bookings.</p>
        </div>
      )}
    </div>
  );

  const handleAddOfflineBooking = async (e) => {
    e.preventDefault();
    
    if (!offlineBookingData.date || !offlineBookingData.startTime || !offlineBookingData.endTime || !offlineBookingData.amount) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      await bookingService.createOfflineBooking({
        turfId: selectedTurfId,
        bookingDate: offlineBookingData.date,
        startTime: offlineBookingData.startTime,
        endTime: offlineBookingData.endTime,
        totalAmount: offlineBookingData.amount
      });
      
      // Reset form and reload bookings
      setOfflineBookingData({
        turfId: selectedTurfId,
        date: '',
        startTime: '',
        endTime: '',
        amount: ''
      });
      
      await loadOfflineBookings();
      alert('Offline booking added successfully!');
    } catch (err) {
      console.error('Error adding offline booking:', err);
      alert('Failed to add offline booking. Please try again.');
    }
  };

  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to remove this blocked slot?')) {
      return;
    }
    
    try {
      await bookingService.deleteOfflineBooking(bookingId);
      await loadOfflineBookings();
      alert('Booking slot unblocked successfully!');
    } catch (err) {
      console.error('Error deleting offline booking:', err);
      alert('Failed to unblock slot. Please try again.');
    }
  };

  const renderOfflineBookingsTab = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Offline Bookings</h2>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Turf</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedTurfId}
            onChange={(e) => setSelectedTurfId(e.target.value)}
          >
            <option value="">Select a turf</option>
            {safeTurfs.filter(t => t.isActive).map(turf => (
              <option key={turf.id} value={turf.id}>{turf.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedTurfId ? (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Block Time Slot</h3>
            <form onSubmit={handleAddOfflineBooking}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={offlineBookingData.date}
                    onChange={(e) => setOfflineBookingData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={offlineBookingData.startTime}
                    onChange={(e) => setOfflineBookingData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={offlineBookingData.endTime}
                    onChange={(e) => setOfflineBookingData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={offlineBookingData.amount}
                    onChange={(e) => setOfflineBookingData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Block Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {loadingOfflineBookings ? (
            <div className="text-center py-12 bg-white rounded-xl">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 p-6 border-b">Blocked Time Slots</h3>
              
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offlineBookings.map(booking => (
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
    </>
  );
  
  const renderOverviewTab = () => (
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
                        <div className="text-sm text-gray-600">Bookings</div>
                        <div className="font-medium">{turf.totalBookings || 0}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Revenue</div>
                        <div className="font-medium text-green-600">₹{(turf.revenue || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  // Main component return
  return (
    <div className="p-6">
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "bookings" && renderBookingsTab()}
      {activeTab === "offlineBookings" && renderOfflineBookingsTab()}
    </div>
  );
};

export default TurfOwnerDashboard;