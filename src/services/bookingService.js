// src/services/bookingService.js
import api from './api';

/**
 * bookingService
 * - createOfflineBooking(data) => expects an object:
 *     { turfId, date, startTime, endTime, amount }
 * - getOfflineBookings(turfId) => returns array of offline bookings for turf
 * - getBookingsByTurfPaginated(turfId, page, size) => paginated bookings
 *
 * Notes:
 * - This module uses the `api` axios instance (imported from ./api).
 * - It logs errors to console and rethrows them so calling components can handle UI messages.
 */

export const bookingService = {
  /**
   * Create offline booking
   * @param {Object} data - { turfId, date, startTime, endTime, amount }
   * @returns {Promise<Object>} created booking response
   */
  createOfflineBooking: async (data) => {
    try {
      if (!data || !data.turfId || !data.date || !data.startTime || !data.endTime) {
        throw new Error('Missing required offline booking fields: turfId, date, startTime, endTime');
      }

      const payload = {
        turfId: data.turfId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        amount: data.amount ?? 0
      };

      const response = await api.post('/bookings/offline', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating offline booking:', error);
      // Re-throw so callers (UI) can show message
      throw error;
    }
  },

  /**
   * Get offline bookings for a turf
   * @param {String|Number} turfId
   * @returns {Promise<Array>} array of offline bookings
   */
  getOfflineBookings: async (turfId) => {
    try {
      if (!turfId) {
        // return empty to let UI handle it gracefully
        return [];
      }
      // Adjust endpoint if your backend uses another path or query parameter
      const response = await api.get(`/bookings/offline`, { params: { turfId } });
      // Assume backend returns { data: [...] } or directly an array — we return response.data
      return response.data;
    } catch (error) {
      console.error('Error fetching offline bookings:', error);
      // Let caller decide what to do (UI), return empty array for safety
      return [];
    }
  },

  /**
   * Get paginated bookings for a turf (owner/admin view)
   * @param {String|Number} turfId
   * @param {Number} page
   * @param {Number} size
   * @returns {Promise<Object>} { content: [...], totalPages, totalElements, page, size }
   */
  getBookingsByTurfPaginated: async (turfId, page = 0, size = 10) => {
    try {
      if (!turfId) {
        throw new Error('turfId is required for paginated bookings');
      }
      const response = await api.get(`/bookings/turf/${turfId}/paginated`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated bookings:', error);
      throw error;
    }
  },

  /**
   * (Optional) Generic function to get bookings by turf (non-paginated)
   * Use only if needed elsewhere in code.
   */
  getBookingsByTurf: async (turfId) => {
    try {
      if (!turfId) return [];
      const response = await api.get(`/bookings/turf/${turfId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings by turf:', error);
      return [];
    }
  }
};

export default bookingService;
