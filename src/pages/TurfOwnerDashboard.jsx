import React, { useState, useEffect } from "react";
import {
  Home,
  Calendar,
  BarChart2,
  LogOut,
  PlusCircle,
  MapPin,
  Star,
  Trash2,
  Edit,
  Users,
} from "lucide-react";
import { turfService } from "../services/turfService";
import { bookingService } from "../services/bookingService";
import { useNavigate } from "react-router-dom";

const TurfOwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [myTurfs, setMyTurfs] = useState([]);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for Overview and My Turfs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turfsData, statsData] = await Promise.all([
          turfService.getMyTurfs(),
          turfService.getMyTurfsStats(),
        ]);
        setMyTurfs(turfsData);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch offline bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingService.getAllBookings();
        setBookings(response);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      }
    };
    fetchBookings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const renderOverview = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md rounded-xl p-5 flex flex-col items-center text-center">
            <Users className="text-green-600 w-8 h-8 mb-3" />
            <p className="text-gray-600">Total Turfs</p>
            <h3 className="text-2xl font-bold">{myTurfs.length}</h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-5 flex flex-col items-center text-center">
            <Calendar className="text-green-600 w-8 h-8 mb-3" />
            <p className="text-gray-600">Total Bookings</p>
            <h3 className="text-2xl font-bold">{stats?.totalBookings || 0}</h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-5 flex flex-col items-center text-center">
            <BarChart2 className="text-green-600 w-8 h-8 mb-3" />
            <p className="text-gray-600">Total Revenue</p>
            <h3 className="text-2xl font-bold">₹{stats?.totalRevenue || 0}</h3>
          </div>
        </div>
      )}
    </div>
  );

  const renderMyTurfs = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Turfs</h2>
        <button
          onClick={() => navigate("/add-turf")}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Add New Turf
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myTurfs.length === 0 ? (
          <p>No turfs added yet.</p>
        ) : (
          myTurfs.map((turf) => (
            <div
              key={turf.id}
              className="bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg"
            >
              <img
                src={
                  turf.images?.[0] ||
                  "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"
                }
                alt={turf.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {turf.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {turf.location}
                </div>
                <div className="flex items-center text-sm text-yellow-500 mb-3">
                  <Star className="w-4 h-4 mr-1" />
                  {turf.rating || 4.8}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-600">
                    ₹{turf.pricePerHour}/hr
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate(`/edit-turf/${turf.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Offline Bookings</h2>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow-md">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Turf</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Slot</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Payment</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{b.turfName}</td>
                  <td className="px-4 py-3">{b.bookingDate}</td>
                  <td className="px-4 py-3">
                    {b.startTime?.slice(0, 5)} - {b.endTime?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">{b.playerName}</td>
                  <td className="px-4 py-3">{b.phoneNumber}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">
                    ₹{b.totalAmount}
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Analytics</h2>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md rounded-xl p-5 text-center">
            <p className="text-gray-600">Total Revenue</p>
            <h3 className="text-2xl font-bold text-green-600">
              ₹{stats.totalRevenue || 0}
            </h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-5 text-center">
            <p className="text-gray-600">Total Bookings</p>
            <h3 className="text-2xl font-bold text-blue-600">
              {stats.totalBookings || 0}
            </h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-5 text-center">
            <p className="text-gray-600">Average Turf Rating</p>
            <h3 className="text-2xl font-bold text-yellow-500">
              {stats.averageRating || 4.8}
            </h3>
          </div>
        </div>
      ) : (
        <p>Loading analytics...</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-md fixed h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-green-600">Turf Owner</h1>
        </div>
        <nav className="mt-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-green-50 ${
              activeTab === "overview" ? "bg-green-100 text-green-700" : ""
            }`}
          >
            <Home className="w-5 h-5 mr-3" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("myTurfs")}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-green-50 ${
              activeTab === "myTurfs" ? "bg-green-100 text-green-700" : ""
            }`}
          >
            <MapPin className="w-5 h-5 mr-3" /> My Turfs
          </button>
          <button
            onClick={() => setActiveTab("offlineBookings")}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-green-50 ${
              activeTab === "offlineBookings" ? "bg-green-100 text-green-700" : ""
            }`}
          >
            <Calendar className="w-5 h-5 mr-3" /> Offline Bookings
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-green-50 ${
              activeTab === "analytics" ? "bg-green-100 text-green-700" : ""
            }`}
          >
            <BarChart2 className="w-5 h-5 mr-3" /> Analytics
          </button>
        </nav>
        <div className="absolute bottom-0 w-full border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "myTurfs" && renderMyTurfs()}
        {activeTab === "offlineBookings" && renderOfflineBookings()}
        {activeTab === "analytics" && renderAnalytics()}
      </div>
    </div>
  );
};

export default TurfOwnerDashboard;
