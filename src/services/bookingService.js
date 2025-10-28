// src/services/bookingService.js
import api from './api';

export const bookingService = {
  // ✅ Create a single booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // ✅ Get all bookings for the logged-in user
  getMyBookings: async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  // ✅ Get user booking stats (total bookings & total spent)
  getMyBookingStats: async () => {
    try {
      const response = await api.get('/bookings/my-bookings/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw error;
    }
  },

  // ✅ Get booking details by booking ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking by ID:', error);
      throw error;
    }
  },

  // ✅ Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await api.put(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // ✅ Check time slot availability
  checkAvailability: async (turfId, date, startTime, endTime) => {
    try {
      const response = await api.get('/bookings/availability', {
        params: { turfId, date, startTime, endTime }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },

  // ✅ Get booked slots for a particular day
  getDayAvailability: async (turfId, date) => {
    try {
      const response = await api.get('/bookings/availability/day', {
        params: { turfId, date }
      });
      return response.data; // array of booked start times
    } catch (error) {
      console.error('Error fetching day availability:', error);
      throw error;
    }
  },

  // ✅ Create multiple bookings for multiple slots
  createMultiBooking: async (turfId, date, slots, paymentMethod = 'upi', fullName, phoneNumber, email) => {
    try {
      const response = await api.post('/bookings/multi', {
        turfId,
        bookingDate: date,
        slots,
        paymentMethod,
        fullName,
        phoneNumber,
        email
      });
      return response.data;
    } catch (error) {
      console.error('Error creating multiple bookings:', error);
      throw error;
    }
  },

  // ✅ Get bookings between two dates
  getBookingsByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/bookings/my-bookings/date-range', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings by date range:', error);
      throw error;
    }
  },

  // ✅ Get bookings for a specific turf (for owner/admin dashboard)
  getBookingsByTurf: async (turfId) => {
    try {
      const response = await api.get(`/bookings/turf/${turfId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings by turf:', error);
      throw error;
    }
  },

  // ✅ Paginated bookings (owner/admin)
  getBookingsByTurfPaginated: async (turfId, page = 0, size = 10) => {
    try {
      const response = await api.get(`/bookings/turf/${turfId}/paginated`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated bookings:', error);
      throw error;
    }
  }
};
