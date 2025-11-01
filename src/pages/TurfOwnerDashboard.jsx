import React, { useEffect, useState } from "react";
import { bookingService } from "../services/bookingService";
import { authService } from "../services/authService";
import TurfDetailsModal from "../components/TurfDetailsModal";
import PersonalDetailsModal from "../components/PersonalDetailsModal";

const TurfOwnerDashboard = () => {
  const [safeTurfs, setSafeTurfs] = useState([]);
  const [offlineBookings, setOfflineBookings] = useState([]);
  const [offlineBookingData, setOfflineBookingData] = useState({
    turfId: "",
    date: "",
    startTime: "",
    endTime: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingOfflineBookings, setLoadingOfflineBookings] = useState(false);
  const [showAddTurfForm, setShowAddTurfForm] = useState(false);
  const [showTurfDetailsModal, setShowTurfDetailsModal] = useState(false);
  const [showPersonalDetailsModal, setShowPersonalDetailsModal] = useState(false);
  const [viewTurfId, setViewTurfId] = useState(null);
  const [userProfile, setUserProfile] = useState({});

  // --- Helper Functions ---
  const loadOfflineBookings = async (turfId) => {
    if (!turfId) return;
    try {
      setLoadingOfflineBookings(true);
      const data = await bookingService.getOfflineBookings(turfId);
      setOfflineBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load offline bookings:", err);
      setOfflineBookings([]);
    } finally {
      setLoadingOfflineBookings(false);
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

      setOfflineBookingData({
        turfId: offlineBookingData.turfId,
        date: "",
        startTime: "",
        endTime: "",
        amount: "",
      });

      await loadOfflineBookings(offlineBookingData.turfId);
      alert("Slot blocked successfully!");
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
      alert(
        err?.response?.data?.message ||
          "Failed to unblock slot. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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

  // --- Offline Booking Section ---
  const renderOfflineBookingsTab = () => {
    useEffect(() => {
      if (offlineBookingData.turfId) {
        loadOfflineBookings(offlineBookingData.turfId);
      }
    }, [offlineBookingData.turfId]);

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Offline Bookings
        </h2>

        {/* Form to add offline booking */}
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Block Slot for Offline Booking
          </h3>
          <form onSubmit={handleCreateOfflineBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Turf *
                </label>
                <select
                  name="turfId"
                  value={offlineBookingData.turfId}
                  onChange={handleOfflineBookingChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={offlineBookingData.date}
                  onChange={handleOfflineBookingChange}
                  min={new Date().toISOString().split("T")[0]}
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

            <div className="mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? "Processing..." : "Block Slot"}
              </button>
            </div>
          </form>
        </div>

        {/* Display offline bookings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Currently Blocked Slots
          </h3>

          {!offlineBookingData.turfId ? (
            <div className="text-gray-600">
              Please select a turf to view blocked slots.
            </div>
          ) : loadingOfflineBookings ? (
            <div className="text-center py-8">Loading...</div>
          ) : offlineBookings.length === 0 ? (
            <div className="text-gray-600">
              No blocked slots found for this turf.
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        {new Date(
                          booking.bookingDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Blocked
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.totalAmount
                          ? `₹${booking.totalAmount}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            handleDeleteOfflineBooking(booking.id)
                          }
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* your existing dashboard content here */}
        {renderOfflineBookingsTab()}
      </div>

      {showAddTurfForm && renderAddTurfForm && renderAddTurfForm()}
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
