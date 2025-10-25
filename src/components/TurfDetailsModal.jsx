import React, { useEffect, useState } from 'react';
import { XCircle, MapPin, Clock, Star, Users, Wifi, Car, Camera, Shield } from 'lucide-react';
import { turfService } from '../services/turfService';
import { getImageSources } from '../utils/imageUtils';

const TurfDetailsModal = ({ isOpen, onClose, turfId }) => {
  const [turf, setTurf] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && turfId) {
      loadTurfDetails();
    }
  }, [isOpen, turfId]);

  const loadTurfDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await turfService.getTurfByIdForAdmin(turfId);
      setTurf(data);
    } catch (err) {
      console.error('Error loading turf details:', err);
      setError(err?.response?.data || 'Failed to load turf details');
    } finally {
      setLoading(false);
    }
  };

  const defaultImages = [
    'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
    'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg'
  ];

  // Use the image utility to get properly formatted image sources
  const turfImages = turf?.images 
    ? getImageSources(turf.images, defaultImages[0]) 
    : defaultImages;

  const turfPrice = turf?.pricePerHour || turf?.price || 0;
  const turfName = turf?.name || 'Turf';
  const turfLocation = turf?.location || '';
  const turfRating = turf?.rating || 4.8;
  const reviews = turf?.reviews || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Turf Details</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading turf details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
              {error}
            </div>
          ) : turf ? (
            <div className="space-y-6">
              {/* Main Image and Thumbnails */}
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  {turfImages[selectedImage] ? (
                    <img 
                      src={turfImages[selectedImage]} 
                      alt={`${turfName}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Main image failed to load:', turfImages[selectedImage]);
                        e.target.src = defaultImages[0];
                      }}
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <p>No image available</p>
                    </div>
                  )}
                </div>
                {turfImages.length > 1 && (
                  <div className="p-4">
                    <div className="flex space-x-2 overflow-x-auto">
                      {turfImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-green-600' : 'border-gray-200'
                          }`}
                        >
                          <img 
                            src={image} 
                            alt={`View ${index + 1}`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = defaultImages[index % defaultImages.length];
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Turf Information */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{turfName}</h1>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-5 h-5 mr-2" />
                          <span>{turfLocation}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="ml-1 text-gray-600">{turfRating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">₹{turfPrice}</div>
                        <div className="text-gray-600">per hour</div>
                      </div>
                    </div>

                    {turf?.description && (
                      <p className="text-gray-700 leading-relaxed">{turf.description}</p>
                    )}
                  </div>

                  {/* Amenities */}
                  {(() => {
                    const amenitiesArray = Array.isArray(turf?.amenities)
                      ? turf.amenities
                      : (typeof turf?.amenities === 'string'
                        ? turf.amenities.split(',').map((s) => s.trim()).filter(Boolean)
                        : []);
                    return amenitiesArray.length > 0 ? (
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {amenitiesArray.map((amenity, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-green-600">
                                {index % 4 === 0 ? <Wifi className="w-4 h-4" /> : 
                                 index % 4 === 1 ? <Car className="w-4 h-4" /> : 
                                 index % 4 === 2 ? <Camera className="w-4 h-4" /> : 
                                 <Shield className="w-4 h-4" />}
                              </div>
                              <span className="text-gray-700 text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Reviews */}
                  {Array.isArray(reviews) && reviews.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review, index) => (
                          <div key={review.id || review.user || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 font-semibold text-sm">
                                    {(review.user || 'U').charAt(0)}
                                  </span>
                                </div>
                                <span className="font-semibold text-gray-900">{review.user || 'User'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < (review.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                                {review.date && <span className="text-gray-500 text-sm ml-2">{review.date}</span>}
                              </div>
                            </div>
                            {review.comment && <p className="text-gray-700">{review.comment}</p>}
                          </div>
                        ))}
                        {reviews.length > 3 && (
                          <p className="text-gray-500 text-sm text-center mt-4">
                            And {reviews.length - 3} more reviews...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar - Turf Stats */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Turf Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          turf.isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {turf.isActive ? 'Active' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Price</span>
                        <span className="font-semibold text-green-600">₹{turfPrice}/hr</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Rating</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 font-semibold">{turfRating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Bookings</span>
                        <span className="font-semibold">{turf.totalBookings || 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Revenue</span>
                        <span className="font-semibold">₹{(turf.revenue || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TurfDetailsModal;
