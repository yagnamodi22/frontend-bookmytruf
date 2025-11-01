import React, { useEffect, useState } from "react";
import { bookingService } from "../services/bookingService";
import { authService } from "../services/authService";
import TurfDetailsModal from "../components/TurfDetailsModal";
import PersonalDetailsModal from "../components/PersonalDetailsModal";

const TurfOwnerDashboard = () => {
  const [turfs, setTurfs] = useState([]);
  const [showAddTurfForm, setShowAddTurfForm] = useState(false);
  const [showTurfDetailsModal, setShowTurfDetailsModal] = useState(false);
  const [showPersonalDetailsModal, setShowPersonalDetailsModal] = useState(false);
  const [viewTurfId, setViewTurfId] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [loading, setLoading] = useState(false);

  // offline booking states
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: "",
    date: "",
    startTime: "",
    endTime: "",
    amount: "",
  });
  const [showOfflineBookingSection, setShowOfflineBookingSection] = useState(false);

  // Load owner's turfs
  const loadTurfs = async () => {
    try {
      const data = await bookingService.getOwnerTurfs();
      setTurfs(data || []);
    } catch (err) {
      console.error("Failed to load turfs:", err);
    }
  };

  useEffect(() => {
    loadTurfs();
  }, []);

  // Fix: handleProfileUpdate defined
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile({
      firstName:
        updatedProfile.firstName ||
        updatedProfile.fullName?.split(" ")[0] ||
        "",
      lastName:
        updatedProfile.lastName ||
        updatedProfile.fullName?.split(" ").slice(1).join(" ") ||
        "",
      email: updatedProfile.email || "",
      phone: updatedProfile.phone || "",
    });
  };

  // ===== Offline Bookings Logic =====
  const loadOfflineBookings = async (turfId) => {
    if (!turfId) return;
    try {
      setLoading(true);
      const data = await bookingService.getOfflineBookings(turfId);
      setOfflineBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load offline bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineBookingChange = (e) => {
    const { name, value } = e.target;
    setOfflineBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
    if (
      !offlineBookingData.turfId ||
      !offlineBookingData.date ||
      !offlineBookingData.startTime ||
      !offlineBookingData.endTime
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      await bookingService.createOfflineBooking(offlineBookingData);
      await loadOfflineBookings(offlineBookingData.turfId);
      alert("Slot blocked successfully!");

      setOfflineBookingData({
        turfId: offlineBookingData.turfId,
        date: "",
        startTime: "",
        endTime: "",
        amount: "",
      });
    } catch (err) {
      console.error("Failed to create offline booking:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to block slot. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfflineBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to unblock this slot?")) return;
    try {
      setLoading(true);
      await bookingService.deleteOfflineBooking(bookingId);
      await loadOfflineBookings(offlineBookingData.turfId);
      alert("Slot unblocked successfully!");
    } catch (err) {
      console.error("Failed to delete offline booking:", err);
      alert("Failed to unblock slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===== Offline Booking Section =====
  const renderOfflineBookingSection = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Offline Bookings for {turfs.find(t => t.id === offlineBookingData.turfId)?.name || "Selected Turf"}
      </h2>

      {/* Add offline booking form */}
      <form onSubmit={handleCreateOfflineBooking} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={offlineBookingData.date}
              onChange={handleOfflineBookingChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={offlineBookingData.startTime}
              onChange={handleOfflineBookingChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={offlineBookingData.endTime}
              onChange={handleOfflineBookingChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={offlineBookingData.amount}
              onChange={handleOfflineBookingChange}
              placeholder="Optional"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {loading ? "Processing..." : "Block Slot"}
        </button>
      </form>

      {/* Display blocked slots */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Blocked Slots
        </h3>
        {loading ? (
          <div>Loading...</div>
        ) : offlineBookings.length === 0 ? (
          <div className="text-gray-500">No blocked slots found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offlineBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(b.bookingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {b.startTime} - {b.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {b.totalAmount ? `₹${b.totalAmount}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteOfflineBooking(b.id)}
                        className="text-red-600 hover:text-red-900"
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
    </div>
  );

  // ===== Dashboard UI =====
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Turf Owner Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf) => (
            <div
              key={turf.id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold">{turf.name}</h3>
              <p className="text-gray-600">{turf.location}</p>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setViewTurfId(turf.id);
                    setShowTurfDetailsModal(true);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Details
                </button>

                <button
                  onClick={() => {
                    setOfflineBookingData((prev) => ({
                      ...prev,
                      turfId: turf.id,
                    }));
                    setShowOfflineBookingSection(true);
                    loadOfflineBookings(turf.id);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Manage Offline Bookings
                </button>
              </div>
            </div>
          ))}
        </div>

        {showOfflineBookingSection && renderOfflineBookingSection()}
      </div>

      <TurfDetailsModal
        isOpen={showTurfDetailsModal}
        onClose={() => setShowTurfDetailsModal(false)}
        turfId={viewTurfId}
      />
      <PersonalDetailsModal
        isOpen={showPersonalDetailsModal}
        onClose={() => setShowPersonalDetailsModal(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default TurfOwnerDashboard;
