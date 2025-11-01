// src/services/bookingService.js
import api from './api';

/**
 * bookingService
 * - getBookingsByTurfPaginated(turfId, page, size) => paginated bookings
 *
 * Notes:
 * - This module uses the `api` axios instance (imported from ./api).
 * - It logs errors to console and rethrows them so calling components can handle UI messages.
 */

export const bookingService = {

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
