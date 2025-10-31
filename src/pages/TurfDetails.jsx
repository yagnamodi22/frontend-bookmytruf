import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, Users, Wifi, Car, Camera, Shield } from 'lucide-react';
import { turfService } from '../services/turfService';
import { authService } from '../services/authService';
import { getImageSrc, getImageSources } from '../utils/imageUtils';

const TurfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await turfService.getTurfById(id);
        setTurf(data);
      } catch (err) {
        setError(err?.response?.data || 'Failed to load turf');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const defaultImages = [
    'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
    'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg'
  ];

  // Use the image utility to get properly formatted image sources
  const turfImages = turf?.images 
    ? getImageSources(turf.images, defaultImages[0]) 
    : defaultImages;
  console.log('TurfDetails - Final turf images to display:', turfImages);
  const turfPrice = turf?.pricePerHour || turf?.price || 0;
  const turfName = turf?.name || 'Turf';
  const turfLocation = turf?.location || '';
  const turfRating = turf?.rating || 4.8;
  const reviews = turf?.reviews || [];

  const handleBookNow = () => {
    if (authService.isAuthenticated()) {
      navigate(`/booking/${id}`);
    } else {
      // Direct redirect to login page without showing popup
      navigate('/login');
      return;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto p-4 bg-red-50 text-red-700 rounded-lg text-center">{error}</div>
        </div>
      </div>
    );
  }

  if (!turf) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/" className="text-gray-500 hover:text-green-600">Home</Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li className="text-green-600">{turfName}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
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
              <div className="p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {turfImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
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
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{turfName}</h1>
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
                  <div className="text-2xl font-bold text-green-600">₹{turfPrice}</div>
                  <div className="text-gray-600">per hour</div>
                </div>
              </div>

              {turf?.description && (
                <p className="text-gray-700 leading-relaxed">{turf.description}</p>
              )}
            </div>

            {(() => {
              const amenitiesArray = Array.isArray(turf?.amenities)
                ? turf.amenities
                : (typeof turf?.amenities === 'string'
                  ? turf.amenities.split(',').map((s) => s.trim()).filter(Boolean)
                  : []);
              return amenitiesArray.length > 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenitiesArray.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-green-600">
                        {/* simple placeholder icons */}
                        {index % 4 === 0 ? <Wifi className="w-5 h-5" /> : index % 4 === 1 ? <Car className="w-5 h-5" /> : index % 4 === 2 ? <Camera className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
              ) : null;
            })()}

            {Array.isArray(reviews) && reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id || review.user} className="border-b border-gray-200 pb-4 last:border-b-0">
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
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book This Turf</h3>
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">₹{turfPrice}</span>
                </div>
              </div>
              <button
                onClick={handleBookNow}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-center block"
              >
                Book Now
              </button>
              <p className="text-sm text-gray-600 text-center mt-3">
                Free cancellation up to 24 hours before booking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetails;