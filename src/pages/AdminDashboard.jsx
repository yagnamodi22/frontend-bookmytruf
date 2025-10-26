import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  UserPlus,
  Trash2,
  Edit
} from 'lucide-react';
import { turfService } from '../services/turfService';
import { userService } from '../services/userService';
import { siteSettingsService } from '../services/siteSettingsService';
import { getImageSources } from '../utils/imageUtils';
import TurfDetailsModal from '../components/TurfDetailsModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedTurfs, setApprovedTurfs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTurfDetailsModal, setShowTurfDetailsModal] = useState(false);
  const [selectedTurfId, setSelectedTurfId] = useState(null);
  const [showAdminDeleteWarning, setShowAdminDeleteWarning] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const [userSize, setUserSize] = useState(10);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [settingsMap, setSettingsMap] = useState({});
  const [settingsDraft, setSettingsDraft] = useState({});
  const [settingsSaveStatus, setSettingsSaveStatus] = useState(''); // '', 'saving', 'success', 'error'
  const [settingsSaveMessage, setSettingsSaveMessage] = useState('');
  const settingKeys = ['site_name','logo_url','contact_phone','contact_email','contact_address'];

  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    return [];
  };


  const loadPending = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading pending turfs...');
      const data = await turfService.getPendingTurfs();
      console.log('Pending turfs response:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      console.log('Data length:', data ? data.length : 'null/undefined');
      
      // Debug individual turf data
      if (Array.isArray(data)) {
        data.forEach((turf, index) => {
          console.log(`Turf ${index + 1}:`, {
            id: turf.id,
            name: turf.name,
            images: turf.images,
            imageType: typeof turf.images,
            imageLength: turf.images ? turf.images.length : 0,
            firstImagePreview: turf.images ? turf.images.substring(0, 100) + '...' : 'No images'
          });
        });
      }
      
      setPendingRequests(normalize(data));
    } catch (err) {
      console.error('Error loading pending turfs:', err);
      const message = typeof err?.response?.data === 'string'
        ? err.response.data
        : (err?.response?.data?.message || err?.message || 'Failed to load pending turfs');
      setError(message);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadApproved = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await turfService.getAllTurfs();
      setApprovedTurfs(normalize(data));
    } catch (err) {
      const message = typeof err?.response?.data === 'string'
        ? err.response.data
        : (err?.response?.data?.message || err?.message || 'Failed to load turfs');
      setError(message);
      setApprovedTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log(`Loading users - Page: ${userPage}, Size: ${userSize}`);
      const data = await userService.getUsersPaginated(userPage, userSize);
      console.log('Users API response:', data);
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data.content)) {
          // Paginated response
          setAllUsers(data.content);
          setUserTotalPages(data.totalPages || 0);
          // Prefer Spring Page totalElements; fall back to other common props
          const total =
            (typeof data.totalElements === 'number' && data.totalElements) ||
            (typeof data.total === 'number' && data.total) ||
            (typeof data.totalItems === 'number' && data.totalItems) ||
            0;
          setUserTotalCount(total);
          console.log(`Loaded ${data.content.length} users, total pages: ${data.totalPages}`);
        } else if (Array.isArray(data)) {
          // Direct array response
          setAllUsers(data);
          setUserTotalPages(1);
          setUserTotalCount(data.length || 0);
          console.log(`Loaded ${data.length} users (non-paginated)`);
        } else {
          // Fallback
          setAllUsers([]);
          setUserTotalPages(0);
          setUserTotalCount(0);
          console.log('No users found or unexpected response format');
        }
      } else {
        setAllUsers([]);
        setUserTotalPages(0);
        setUserTotalCount(0);
      }
      
      // Clear selected users when loading new page
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Error loading users:', err);
      const message = typeof err?.response?.data === 'string'
        ? err.response.data
        : (err?.response?.data?.message || err?.message || 'Failed to load users');
      setError(message);
      setAllUsers([]);
      setUserTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const map = await siteSettingsService.getMap();
      setSettingsMap(map || {});
      setSettingsDraft(map || {});
    } catch {}
  };

  useEffect(() => {
    console.log('AdminDashboard: Component mounted');
    console.log('AdminDashboard: localStorage token:', localStorage.getItem('token'));
    console.log('AdminDashboard: localStorage user:', localStorage.getItem('user'));
    
    // Check if admin is properly authenticated
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('AdminDashboard: Current user:', user);
      console.log('AdminDashboard: User role:', user.role);
    } catch (error) {
      console.error('AdminDashboard: Error parsing user data:', error);
    }
    
    // Load both pending and approved turfs
    loadPending();
    loadApproved();
    loadSettings();
  }, []);

  // Separate useEffect for user pagination
  useEffect(() => {
    loadAllUsers();
  }, [userPage, userSize]);

  const handleApproveRequest = async (requestId) => {
    try {
      const approved = await turfService.approveTurf(requestId);
      setPendingRequests(prev => prev.filter(t => t.id !== requestId));
      setApprovedTurfs(prev => Array.isArray(prev) ? [...prev, approved] : [approved]);
    } catch (err) {
      setError(err?.response?.data || 'Failed to approve turf');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await turfService.rejectTurf(requestId);
      await Promise.all([loadPending(), loadApproved()]);
    } catch (err) {
      setError(err?.response?.data || 'Failed to reject turf');
    }
  };

  const handleViewDetails = (requestId) => {
    setSelectedTurfId(requestId);
    setShowTurfDetailsModal(true);
  };

  const handleDeleteTurf = async (turfId) => {
    try {
      await turfService.deleteTurf(turfId);
      await loadApproved();
    } catch (err) {
      setError(err?.response?.data || 'Failed to delete turf');
    }
  };


  const handleDeleteUser = async (userId) => {
    // Find the user to check their role
    if (!Array.isArray(allUsers)) return;
    const userToDelete = allUsers.find(user => user.id === userId);
    
    if (userToDelete && userToDelete.role === 'ADMIN') {
      setShowAdminDeleteWarning(true);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        // Reload current page
        await loadAllUsers();
      } catch (err) {
        setError(err?.response?.data || 'Failed to delete user');
      }
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getSelectedAdminCount = () => {
    if (!Array.isArray(allUsers) || !Array.isArray(selectedUserIds)) return 0;
    const selectedUsers = allUsers.filter(user => selectedUserIds.includes(user.id));
    return selectedUsers.filter(user => user.role === 'ADMIN').length;
  };

  const hasSelectedAdmins = () => {
    return getSelectedAdminCount() > 0;
  };

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.length === allUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUsers.map(u => u.id));
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (!Array.isArray(selectedUserIds) || selectedUserIds.length === 0) return;
    
    // Check if any selected users are Admins
    if (!Array.isArray(allUsers)) return;
    const selectedUsers = allUsers.filter(user => selectedUserIds.includes(user.id));
    const adminUsers = selectedUsers.filter(user => user.role === 'ADMIN');
    
    if (adminUsers.length > 0) {
      setShowAdminDeleteWarning(true);
      return;
    }
    
    if (!window.confirm(`Delete ${selectedUserIds.length} selected users?`)) return;
    try {
      await userService.bulkDeleteUsers(selectedUserIds);
      setSelectedUserIds([]);
      // Reload current page
      await loadAllUsers();
    } catch (err) {
      setError(err?.response?.data || 'Failed to bulk delete users');
    }
  };

  const handleChangeSettingDraft = (key, value) => {
    setSettingsDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSettingsSaveStatus('saving');
    setSettingsSaveMessage('');
    try {
      // Collect only changed keys
      const changed = {};
      for (const key of settingKeys) {
        const newVal = settingsDraft[key] || '';
        const oldVal = settingsMap[key] || '';
        if (newVal !== oldVal) changed[key] = newVal;
      }

      if (Object.keys(changed).length === 0) {
        setSettingsSaveStatus('success');
        setSettingsSaveMessage('No changes to save.');
        return;
      }

      // Use bulk endpoint to persist in a single request
      await siteSettingsService.upsertBulk(changed);

      await loadSettings();
      setSettingsSaveStatus('success');
      setSettingsSaveMessage('Settings saved successfully.');
      try { window.dispatchEvent(new CustomEvent('site-settings-updated')); } catch {}
    } catch (err) {
      const message = typeof err?.response?.data === 'string'
        ? err.response.data
        : (err?.response?.data?.message || err?.message || 'Failed to save settings');
      setSettingsSaveStatus('error');
      setSettingsSaveMessage(message);
    }
  };

  const handleResetSettings = () => {
    setSettingsDraft(settingsMap || {});
  };


  const safePending = Array.isArray(pendingRequests) ? pendingRequests : [];
  const safeApproved = Array.isArray(approvedTurfs) ? approvedTurfs : [];
  const safeUsers = Array.isArray(allUsers) ? allUsers : [];

  const stats = {
    totalTurfs: safeApproved.length,
    pendingRequests: safePending.length,
    totalUsers: userTotalCount,
    totalBookings: safeApproved.reduce((sum, turf) => sum + (turf.totalBookings || 0), 0),
    totalRevenue: safeApproved.reduce((sum, turf) => sum + (turf.revenue || 0), 0)
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Turfs</p>
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
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Moderation activity will appear here</span>
            <span className="text-sm text-gray-500 ml-auto">—</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPendingRequests = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Pending Turf Requests</h3>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl">Loading…</div>
      ) : safePending.length > 0 ? (
        <div className="space-y-6">
          {safePending.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{request.name}</h4>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {request.location}
                      </div>
                    </div>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                      Pending
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{request.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Price per hour:</span>
                      <p className="font-medium text-green-600">₹{request.pricePerHour || request.price}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-600 block mb-2">Images:</span>
                  <div className="space-y-2">
                    {(() => {
                      // Get image sources using the utility function
                      const imageSources = getImageSources(request.images, 'https://via.placeholder.com/300x200?text=No+Image');
                      
                      if (imageSources.length === 0 || (imageSources.length === 1 && imageSources[0].includes('placeholder'))) {
                        return (
                          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-gray-500 text-sm block">No images available</span>
                              <span className="text-gray-400 text-xs block mt-1">Images: {request.images || 'null'}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return imageSources.slice(0, 2).map((imageSrc, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageSrc}
                            alt={`${request.name} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.error(`Admin Dashboard - Image failed to load:`, imageSrc);
                              e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                            }}
                          />
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApproveRequest(request.id)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Reject</span>
                </button>
                <button 
                  onClick={() => handleViewDetails(request.id)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pending requests</p>
        </div>
      )}
    </div>
  );

  const renderApprovedTurfs = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Approved Turfs</h3>
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl">Loading…</div>
      ) : safeApproved.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeApproved.map((turf) => (
            <div key={turf.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{turf.name}</h4>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {turf.location}
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Active</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Price per hour:</span>
                  <p className="font-medium text-green-600">₹{turf.pricePerHour || turf.price}</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/turf/${turf.id}`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDeleteTurf(turf.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl text-gray-500">No approved turfs</div>
      )}
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{userTotalCount} total users</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl">Loading…</div>
      ) : safeUsers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkDeleteUsers}
                disabled={selectedUserIds.length === 0}
                className={`px-3 py-2 rounded-md text-white ${
                  selectedUserIds.length === 0 
                    ? 'bg-gray-300' 
                    : hasSelectedAdmins() 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-red-600 hover:bg-red-700'
                }`}
                title={hasSelectedAdmins() ? 'Cannot delete Admin accounts' : 'Delete selected users'}
              >
                {hasSelectedAdmins() 
                  ? `⚠️ Delete Selected (${selectedUserIds.length})` 
                  : `Delete Selected (${selectedUserIds.length})`
                }
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Page Size:</label>
              <select
                value={userSize}
                onChange={(e) => {
                  const size = parseInt(e.target.value, 10);
                  setUserSize(size);
                  setUserPage(0); // Reset to first page when changing page size
                }}
                className="border rounded-md px-2 py-1"
              >
                {[5,10,20,50].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3"><input type="checkbox" onChange={toggleSelectAllUsers} checked={selectedUserIds.length === allUsers.length && allUsers.length > 0} /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleSelectUser(user.id)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'OWNER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'ADMIN'}
                        className={`flex items-center space-x-1 ${
                          user.role === 'ADMIN' 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        title={user.role === 'ADMIN' ? 'Cannot delete Admin account' : 'Delete user'}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex items-center justify-between border-t">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { if (userPage > 0) { setUserPage(userPage - 1); } }}
                disabled={userPage === 0}
                className={`px-3 py-2 rounded-md text-sm ${userPage === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              >
                Previous
              </button>
              <button
                onClick={() => { if (userPage + 1 < userTotalPages) { setUserPage(userPage + 1); } }}
                disabled={userPage + 1 >= userTotalPages}
                className={`px-3 py-2 rounded-md text-sm ${userPage + 1 >= userTotalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              >
                Next
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Page {userPage + 1} of {Math.max(1, userTotalPages)}
              </span>
              
              {userTotalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Go to:</label>
                  <select
                    value={userPage}
                    onChange={(e) => setUserPage(parseInt(e.target.value, 10))}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    {Array.from({ length: userTotalPages }, (_, i) => (
                      <option key={i} value={i}>Page {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Site Settings</h3>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        {settingsSaveStatus === 'error' && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{settingsSaveMessage || 'Failed to save settings'}</div>
        )}
        {settingsSaveStatus === 'success' && settingsSaveMessage && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{settingsSaveMessage}</div>
        )}
        {[
          { key: 'site_name', label: 'Site Name', type: 'text' },
          { key: 'logo_url', label: 'Logo URL', type: 'text' },
          { key: 'contact_phone', label: 'Contact Phone', type: 'text' },
          { key: 'contact_email', label: 'Contact Email', type: 'text' },
          { key: 'contact_address', label: 'Contact Address', type: 'text' },
        ].map(item => (
          <div key={item.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <label className="text-sm text-gray-700">{item.label}</label>
            <input
              type="text"
              value={settingsDraft[item.key] || ''}
              onChange={(e) => handleChangeSettingDraft(item.key, e.target.value)}
              placeholder={`Enter ${item.label.toLowerCase()}`}
              className="md:col-span-2 border rounded-md px-3 py-2"
            />
          </div>
        ))}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleResetSettings}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={settingsSaveStatus === 'saving'}
            className={`px-4 py-2 text-white rounded-md ${settingsSaveStatus === 'saving' ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {settingsSaveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage turf requests and platform operations</p>
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
                  <option value="settings">Settings</option>
                  <option value="overview">Overview</option>
                  <option value="pending">
                    Pending Requests {safePending.length > 0 ? `(${safePending.length})` : ''}
                  </option>
                  <option value="approved">Approved Turfs</option>
                  <option value="users">User Management</option>
                </select>
              </div>
              
              {/* Desktop tabs */}
              <nav className="hidden md:flex -mb-px overflow-x-auto">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Settings
                </button>
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
                  onClick={() => setActiveTab('pending')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors relative ${
                    activeTab === 'pending'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Requests
                  {safePending.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {safePending.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'approved'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Approved Turfs
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'users'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  User Management
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'pending' && renderPendingRequests()}
            {activeTab === 'approved' && renderApprovedTurfs()}
            {activeTab === 'users' && renderUserManagement()}
          </div>
        </div>
      </div>

      
      <TurfDetailsModal
        isOpen={showTurfDetailsModal}
        onClose={() => {
          setShowTurfDetailsModal(false);
          setSelectedTurfId(null);
        }}
        turfId={selectedTurfId}
      />
      
      {/* Admin Delete Warning Modal */}
      {showAdminDeleteWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">⚠️</span>
                  Admin Account Protection
                </h3>
                <button
                  onClick={() => setShowAdminDeleteWarning(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium text-center">
                    ⚠️ You cannot delete the Admin account!
                  </p>
                </div>
                <p className="text-gray-600 text-sm mt-3 text-center">
                  Admin accounts are protected to maintain system security and access control.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowAdminDeleteWarning(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;