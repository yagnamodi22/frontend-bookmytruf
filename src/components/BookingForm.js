// src/components/BookingForm.js
import React, { useState } from 'react';
import { bookingService } from '../services/bookingService';

const BookingForm = ({ turfId }) => {
  const [bookingData, setBookingData] = useState({
    turfId,
    bookingDate: '',
    startTime: '',
    endTime: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await bookingService.createBooking(bookingData);
      // Show success message and redirect
    } catch (error) {
      console.error('Booking failed:', error);
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="date" 
        value={bookingData.bookingDate}
        onChange={(e) => setBookingData({...bookingData, bookingDate: e.target.value})}
        required 
      />
      <input 
        type="time" 
        value={bookingData.startTime}
        onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}
        required 
      />
      <input 
        type="time" 
        value={bookingData.endTime}
        onChange={(e) => setBookingData({...bookingData, endTime: e.target.value})}
        required 
      />
      <button type="submit">Book Turf</button>
    </form>
  );
};
