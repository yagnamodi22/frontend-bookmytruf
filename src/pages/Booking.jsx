import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, CreditCard, Check, ArrowLeft, MapPin, Star } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { turfService } from '../services/turfService';
import { getImageSrc } from '../utils/imageUtils';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const turfId = id ? parseInt(id, 10) : null;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    date: '',
    selectedSlots: [], // array of strings 'HH:mm - HH:mm'
    playerName: '',
    phoneNumber: '',
    email: '',
    paymentMethod: 'upi',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolder: ''
  });
  const [bookedStarts, setBookedStarts] = useState([]); // array of 'HH:mm' that are booked

  const calculateTotal = () => {
    if (!turf || typeof turf.pricePerHour !== 'number') return 0;
    return (bookingData.selectedSlots?.length || 0) * turf.pricePerHour;
  };

  useEffect(() => {
    if (!turfId) {
      setError('Invalid turf id');
      setLoading(false);
      return;
    }

    const fetchTurfData = async () => {
      try {
        setLoading(true);
        setError('');
        const resp = await turfService.getTurfById(turfId);
        const data = resp?.data ?? resp;
        console.log('Fetched turf data:', data);
        setTurf(data);
      } catch (err) {
        console.error('Error fetching turf data:', err);
        setError('Failed to load turf details');
      } finally {
        setLoading(false);
      }
    };

    fetchTurfData();
  }, [turfId]);

  const images = useMemo(() => {
    if (!turf?.images) return [];
    if (Array.isArray(turf.images)) return turf.images;
    
    console.log('Raw turf.images:', turf.images);
    
    // Check if it's a single base64 image
    if (turf.images.startsWith('data:image')) {
      console.log('Single base64 image detected');
      return [turf.images];
    }
    
    // For comma-separated images, we need to be more careful with base64 data
    // Base64 data URLs contain commas, so we can't just split by comma
    // Instead, we'll look for the pattern that separates multiple base64 images
    const imagePattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
    const matches = turf.images.match(imagePattern);
    
    if (matches && matches.length > 0) {
      console.log('Parsed base64 images:', matches);
      return matches;
    }
    
    // If no base64 images found, try to split by comma for regular image paths
    // But first check if the string contains any base64 data
    if (turf.images.includes('data:image')) {
      // This might be a case where base64 images are separated by commas
      // but our regex didn't catch them properly
      console.log('Contains base64 data but regex failed, trying manual parsing');
      
      // Try to find base64 images by looking for data:image patterns
      const parts = turf.images.split(',');
      const base64Images = [];
      
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        
        // If this part starts with data:image, it's a complete base64 image
        if (part.startsWith('data:image')) {
          base64Images.push(part);
        } else if (i > 0 && parts[i-1].includes('data:image')) {
          // This might be a continuation of a base64 string that was split
          // Reconstruct it by joining with the previous part
          const prevPart = parts[i-1].trim();
          if (prevPart.includes('data:image') && !prevPart.endsWith('=')) {
            // The previous part was incomplete, join them
            const reconstructed = prevPart + ',' + part;
            base64Images[base64Images.length - 1] = reconstructed;
          }
        }
      }
      
      if (base64Images.length > 0) {
        console.log('Manually parsed base64 images:', base64Images);
        return base64Images;
      }
    }
    
    // Fallback to comma splitting for non-base64 images
    const parsedImages = turf.images.split(',').map(s => s.trim()).filter(Boolean);
    console.log('Fallback parsed images:', parsedImages);
    return parsedImages;
  }, [turf?.images]);

  const defaultImage = 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg';
  const mainImageSrc = getImageSrc(images[0] || '', defaultImage);
  console.log('Main image src:', mainImageSrc, 'from images[0]:', images[0]);

  const timeSlots = [
    '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
    '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00',
    '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00',
    '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
    '22:00 - 23:00', '23:00 - 00:00', '00:00 - 01:00', '01:00 - 02:00',
    '02:00 - 03:00'
  ];

  const handleInputChange = (field, value) => {
    // When switching payment method, ensure card fields are cleared by default
    if (field === 'paymentMethod') {
      if (value === 'card' || value === 'upi') {
        setBookingData(prev => ({
          ...prev,
          paymentMethod: value,
          cardNumber: '',
          cardExpiry: '',
          cardCvv: '',
          cardHolder: ''
        }));
        return;
      }
    }
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const parseTimesFromSlot = (slot) => {
    if (!slot || !slot.includes('-')) return { startTime: '', endTime: '' };
    const [start, end] = slot.split('-').map(s => s.trim());
    return { startTime: start, endTime: end };
  };

  // Load day availability whenever date changes
  useEffect(() => {
    const loadAvailability = async () => {
      if (!bookingData.date || !turfId) return;
      try {
        const booked = await bookingService.getDayAvailability(turfId, bookingData.date);
        // API returns array of times like '09:00:00'. Normalize to 'HH:mm'
        const mapped = (booked || []).map(t => (t || '').slice(0,5));
        setBookedStarts(mapped);
      } catch (err) {
        console.error('Failed to load availability', err);
        setBookedStarts([]);
      }
    };
    loadAvailability();
  }, [bookingData.date, turfId]);

  const toggleSlot = (slot) => {
    const { startTime } = parseTimesFromSlot(slot);
    const startHHmm = startTime.slice(0,5);
    
    // Check if slot is booked
    if (bookedStarts.includes(startHHmm)) return; // cannot select booked
    
    // Check if slot is in the past (for today's date only)
    let isPastSlot = false;
    if (bookingData.date === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      const slotStartTime = new Date(`${bookingData.date}T${startTime}:00`);
      
      // For slots between 00:00 and 03:00, they belong to the next day logically
      const hourNum = parseInt(startTime.split(':')[0], 10);
      if (hourNum >= 0 && hourNum < 3) {
        // These are late night slots (after midnight)
        // They should only be considered past if we're already in the next day and past their time
        isPastSlot = false; // These slots are for tomorrow, so they're not past
      } else {
        // Regular slots - check if current time is past the slot start time
        isPastSlot = slotStartTime < now;
      }
    }
    if (isPastSlot) return; // cannot select past slots
    
    setBookingData(prev => {
      const exists = prev.selectedSlots.includes(slot);
      const next = exists ? prev.selectedSlots.filter(s => s !== slot) : [...prev.selectedSlots, slot];
      return { ...prev, selectedSlots: next };
    });
  };

  const simulatePayment = async (paymentMethod, amount) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate payment success/failure based on payment method
    if (paymentMethod === 'card') {
      // Simulate card validation
      const cardNumber = bookingData.cardNumber;
      if (!cardNumber || cardNumber.length < 16) {
        throw new Error('Invalid card number');
      }
      if (!bookingData.cardExpiry || bookingData.cardExpiry.length !== 4) {
        throw new Error('Invalid card expiry');
      }
      if (!bookingData.cardCvv || bookingData.cardCvv.length < 3) {
        throw new Error('Invalid CVV');
      }
      if (!bookingData.cardHolder) {
        throw new Error('Card holder name is required');
      }
    }
    
    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Payment failed. Please try again.');
    }
    
    return {
      transactionId: `TXN_${Date.now()}`,
      status: 'success'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!bookingData.date || (bookingData.selectedSlots?.length || 0) === 0) {
      setError('Please select a date and at least one time slot.');
      return;
    }

    const slots = bookingData.selectedSlots.map(s => {
      const { startTime, endTime } = parseTimesFromSlot(s);
      
      // Handle slots that cross midnight (00:00-03:00)
      // These slots belong to the next day logically
      let slotDate = bookingData.date;
      const hour = parseInt(startTime.split(':')[0], 10);
      
      // If the slot is between 00:00 and 03:00, it belongs to the next day
      if (hour >= 0 && hour < 3) {
        // Calculate next day's date
        const nextDay = new Date(bookingData.date);
        nextDay.setDate(nextDay.getDate() + 1);
        slotDate = nextDay.toISOString().split('T')[0];
      }
      
      return { 
        startTime: `${startTime}:00`, 
        endTime: `${endTime}:00`,
        bookingDate: slotDate 
      };
    });

    try {
      setSubmitting(true);
      
      // Step 1: Process payment
      const totalAmount = calculateTotal();
      const paymentResult = await simulatePayment(bookingData.paymentMethod, totalAmount);
      
      // Step 2: Create booking only after successful payment
      // Group slots by date to handle slots after midnight
      const slotsByDate = {};
      slots.forEach(slot => {
        const date = slot.bookingDate || bookingData.date;
        if (!slotsByDate[date]) {
          slotsByDate[date] = [];
        }
        slotsByDate[date].push({
          startTime: slot.startTime,
          endTime: slot.endTime
        });
      });
      
      // Create bookings for each date
      const bookingResults = [];
      for (const [date, dateSlots] of Object.entries(slotsByDate)) {
        const result = await bookingService.createMultiBooking(
          turfId, 
          date, 
          dateSlots, 
          bookingData.paymentMethod,
          bookingData.playerName,
          bookingData.phoneNumber,
          bookingData.email
        );
        bookingResults.push(...result);
      }
      
      const bookingResult = bookingResults;
      
      // Step 3: Navigate to dashboard with success message
      navigate('/dashboard', { 
        state: { 
          refreshDashboard: true,
          bookingSuccess: true,
          bookingCount: bookingResult.length,
          totalAmount: totalAmount
        } 
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.response?.data?.message || 'Failed to process booking');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={bookingData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot(s)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {timeSlots.map((slot) => {
                const { startTime } = parseTimesFromSlot(slot);
                const start = startTime.slice(0,5);
                const isBooked = bookedStarts.includes(start);
                const isSelected = bookingData.selectedSlots.includes(slot);
                
                // Check if slot is in the past (for today's date only)
                let isPastSlot = false;
                if (bookingData.date === new Date().toISOString().split('T')[0]) {
                  const now = new Date();
                  const slotStartTime = new Date(`${bookingData.date}T${startTime}:00`);
                  
                  // For slots between 00:00 and 03:00, they belong to the next day logically
                  const hourNum = parseInt(startTime.split(':')[0], 10);
                  if (hourNum >= 0 && hourNum < 3) {
                    // These are late night slots (after midnight)
                    isPastSlot = false; // These slots are for tomorrow, so they're not past
                  } else {
                    // Regular slots - check if current time is past the slot start time
                    isPastSlot = slotStartTime < now;
                  }
                }
                
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    disabled={isBooked || isPastSlot}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      isBooked || isPastSlot
                        ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                        : isSelected
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-green-600 rounded-sm mr-2"></span>Available</div>
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-gray-300 rounded-sm mr-2"></span>Booked</div>
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-green-200 rounded-sm mr-2"></span>Selected</div>
              <div className="flex items-center"><span className="inline-block w-3 h-3 bg-gray-200 rounded-sm mr-2"></span>Past</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={bookingData.playerName}
              onChange={(e) => handleInputChange('playerName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={bookingData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={bookingData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="upi"
              checked={bookingData.paymentMethod === 'upi'}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className="mr-3"
            />
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              <span>UPI Payment</span>
            </div>
          </label>
          <label className="flex flex-col p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={bookingData.paymentMethod === 'card'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                <span>Credit/Debit Card</span>
              </div>
            </div>
            {bookingData.paymentMethod === 'card' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">CARD NUMBER</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    name="card_number"
                    value={bookingData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">EXPIRY (MMYY)</label>
                  <input
                    type="text"
                    autoComplete="off"
                    name="card_expiry"
                    maxLength={4}
                    value={bookingData.cardExpiry}
                    onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                    name="card_cvv"
                    value={bookingData.cardCvv}
                    onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">CARD HOLDER NAME</label>
                  <input
                    type="text"
                    autoComplete="off"
                    name="card_holder"
                    value={bookingData.cardHolder}
                    onChange={(e) => handleInputChange('cardHolder', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Booking Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{bookingData.date}</span>
          </div>
          <div className="flex justify-between">
            <span>Selected Slots:</span>
            <span>{bookingData.selectedSlots.join(', ') || '—'}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>₹{calculateTotal()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading turf details...</p>
        </div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error || 'Turf not found'}</div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book Your Turf</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Step {step} of 3</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((stepNum) => (
                      <div
                        key={stepNum}
                        className={`w-2 h-2 rounded-full ${
                          stepNum <= step ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
                  >
                    {submitting ? (step === 3 ? 'Processing Payment...' : 'Processing...') : step === 3 ? 'Confirm Booking' : 'Pay Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <div className="mb-4">
                <img
                  src={mainImageSrc}
                  alt={turf.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = defaultImage;
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{turf.name}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{turf.location}</span>
              </div>
              <div className="flex items-center mb-4">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm text-gray-600">{turf.rating || 4.8}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per hour:</span>
                  <span className="font-semibold">₹{turf.pricePerHour || turf.price}</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Selected Slots:</span>
                    <span className="text-right text-sm ml-2">{bookingData.selectedSlots.join(', ') || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
              {/* <button
                onClick={async () => {
                  // Quick book from summary when on step 1
                  if (step !== 3) {
                    setStep(3);
                    return;
                  }
                }}
                className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
              >
                Pay ₹{calculateTotal()} & Book Now
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;