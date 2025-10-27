// src/services/bookingService.js
import api from './api';

export const bookingService = {
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  getMyBookingStats: async () => {
    const response = await api.get('/bookings/my-bookings/stats');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  checkAvailability: async (turfId, date, startTime, endTime) => {
    const response = await api.get('/bookings/availability', {
      params: { turfId, date, startTime, endTime }
    });
    return response.data;
  },

  getDayAvailability: async (turfId, date) => {
    const response = await api.get('/bookings/availability/day', {
      params: { turfId, date }
    });
    return response.data; // array of ISO times (start times) that are booked
  },

  createMultiBooking: async (turfId, date, slots, paymentMethod = 'upi', fullName, phoneNumber, email) => {
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
  },

  getBookingsByDateRange: async (startDate, endDate) => {
    const response = await api.get('/bookings/my-bookings/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getBookingsByTurf: async (turfId) => {
    const response = await api.get(`/bookings/turf/${turfId}`);
    return response.data;
  },
  
  getBookingsByTurfPaginated: async (turfId, page = 0, size = 10) => {
    const response = await api.get(`/bookings/turf/${turfId}/paginated`, {
      params: { page, size }
    });
    return response.data;
  }
};
