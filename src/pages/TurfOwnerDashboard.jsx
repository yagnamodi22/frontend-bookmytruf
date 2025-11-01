// src/pages/TurfOwnerDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  ClipboardList,
  BarChart2,
  Calendar,
  MapPin,
  Star,
  Users,
  Clock,
  PlusCircle,
  Check,
} from "lucide-react";
import { turfService } from "../services/turfService";
import { bookingService } from "../services/bookingService";
import api from "../services/api";

const TurfOwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [turfs, setTurfs] = useState([]);
  const [selectedTurfId, setSelectedTurfId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [offlineDate, setOfflineDate] = useState("");
  const [offlineBookedStarts, setOfflineBookedStarts] = useState([]);
  const [offlineSelectedSlots, setOfflineSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load my turfs
  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const data = await turfService.getMyTurfs();
        setTurfs(data);
        if (data.length > 0) setSelectedTurfId(data[0].id);
      } catch (err) {
        console.error(err);
        setError("Failed to load your turfs");
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  // Load normal bookings (for Bookings tab)
  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedTurfId) return;
      try {
        const data = await bookingService.getBookingsByTurf(selectedTurfId);
        setBookings(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookings();
  }, [selectedTurfId]);

  // For offline bookings: predefined time slots
  const timeSlots = [
    "06:00 - 07:00", "07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00",
    "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00",
    "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00",
    "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00",
    "22:00 - 23:00", "23:00 - 00:00", "00:00 - 01:00", "01:00 - 02:00",
  ];

  // Helper to parse slot to start/end times
  const parseTimesFromSlot = (slot) => {
    if (!slot || !slot.includes("-")) return { startTime: "", endTime: "" };
    const [start, end] = slot.split("-").map((s) => s.trim());
    return { startTime: start, endTime: end };
  };

  // Load booked slots for selected turf and date
  useEffect(() => {
    const loadOfflineBookings = async () => {
      if (!offlineDate || !selectedTurfId) return;
      try {
        const booked = await bookingService.getOfflineBookings(selectedTurfId);
        const forDate = booked.filter(
          (b) => b.date === offlineDate || b.bookingDate === offlineDate
        );
        const starts = forDate.map((b) =>
          (b.startTime || "").slice(0, 5)
        );
        setOfflineBookedStarts(starts);
      } catch (err) {
        console.error(err);
        setOfflineBookedStarts([]);
      }
    };
    loadOfflineBookings();
  }, [offlineDate, selectedTurfId]);

  // Toggle slot selection
  const toggleOfflineSlot = (slot) => {
    const { startTime } = parseTimesFromSlot(slot);
    const startHHmm = startTime.slice(0, 5);
    if (offlineBookedStarts.includes(startHHmm)) return;

    setOfflineSelectedSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  // Submit offline bookings
  const handleOfflineBookingSubmit = async () => {
    if (!offlineDate || offlineSelectedSlots.length === 0) {
      alert("Please select a date and at least one slot.");
      return;
    }
    try {
      for (const slot of offlineSelectedSlots) {
        const { startTime, endTime } = parseTimesFromSlot(slot);
        await bookingService.createOfflineBooking({
          turfId: selectedTurfId,
          date: offlineDate,
          startTime: `${startTime}:00`,
          endTime: `${endTime}:00`,
          amount: 0,
        });
      }
      alert("Offline booking(s) added successfully!");
      setOfflineSelectedSlots([]);
      const booked = await bookingService.getOfflineBookings(selectedTurfId);
      const forDate = booked.filter(
        (b) => b.date === offlineDate || b.bookingDate === offlineDate
      );
      const starts = forDate.map((b) =>
        (b.startTime || "").slice(0, 5)
      );
      setOfflineBookedStarts(starts);
    } catch (err) {
      console.error(err);
      alert("Failed to add offline booking.");
    }
  };

  const renderOfflineBookings = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-green-600" />
        Manage Offline Bookings
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Turf
        </label>
        <select
          value={selectedTurfId || ""}
          onChange={(e) => setSelectedTurfId(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          {turfs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={offlineDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setOfflineDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      {offlineDate && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time Slot(s)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {timeSlots.map((slot) => {
                const { startTime } = parseTimesFromSlot(slot);
                const start = startTime.slice(0, 5);
                const isBooked = offlineBookedStarts.includes(start);
                const isSelected = offlineSelectedSlots.includes(slot);

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleOfflineSlot(slot)}
                    disabled={isBooked}
                    className={`px-2 py-2 text-sm rounded-lg border ${
                      isBooked
                        ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleOfflineBookingSubmit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Offline Bookings
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Placeholder for your existing Overview/MyTurfs/Bookings/Analytics UI
  const renderOverview = () => (
    <div className="p-6 bg-white rounded-xl shadow-md text-center text-gray-700">
      <h2 className="text-xl font-semibold mb-2">Overview</h2>
      <p>This section remains unchanged (your original dashboard UI).</p>
    </div>
  );

  const renderBookings = () => (
    <div className="p-6 bg-white rounded-xl shadow-md text-center text-gray-700">
      <h2 className="text-xl font-semibold mb-2">Bookings</h2>
      <p>Your normal bookings display here (unchanged).</p>
    </div>
  );

  const renderAnalytics = () => (
    <div className="p-6 bg-white rounded-xl shadow-md text-center text-gray-700">
      <h2 className="text-xl font-semibold mb-2">Analytics</h2>
      <p>Your analytics view remains unchanged.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen p-4">
          <h1 className="text-2xl font-bold text-green-600 mb-8 text-center">
            Turf Owner
          </h1>
          <nav className="space-y-2">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "myTurfs", label: "My Turfs", icon: MapPin },
              { id: "bookings", label: "Bookings", icon: ClipboardList },
              { id: "offlineBookings", label: "Offline Bookings", icon: Clock },
              { id: "analytics", label: "Analytics", icon: BarChart2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "myTurfs" && (
            <div className="p-6 bg-white rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">My Turfs</h2>
              <p>This section uses your original code (unchanged).</p>
            </div>
          )}
          {activeTab === "bookings" && renderBookings()}
          {activeTab === "offlineBookings" && renderOfflineBookings()}
          {activeTab === "analytics" && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default TurfOwnerDashboard;
