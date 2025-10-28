import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Zap, Shield } from 'lucide-react';
import { turfService } from '../services/turfService';
import { authService } from '../services/authService';
import { getImageSrc } from '../utils/imageUtils';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizeTurfs = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    return [];
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await turfService.getAllTurfs();
        setTurfs(normalizeTurfs(data));
      } catch (err) {
        const message =
          typeof err?.response?.data === 'string'
            ? err.response.data
            : err?.response?.data?.message || err?.message || 'Failed to load turfs';
        setError(message);
        setTurfs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const data = searchQuery
        ? await turfService.searchTurfs(searchQuery)
        : await turfService.getAllTurfs();
      setTurfs(normalizeTurfs(data));
    } catch (err) {
      const message =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message || err?.message || 'Search failed';
      setError(message);
      setTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (turfId) => {
    if (authService.isAuthenticated()) {
      navigate(`/booking/${turfId}`);
    } else {
      // Instead of automatically redirecting to login, show a prompt or modal
      if (window.confirm('You need to be logged in to book a turf. Would you like to log in now?')) {
        // Removed automatic redirect to login
      }
    }
  };

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Easy Search',
      description: 'Find the perfect turf for your sport with filters.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Instant Booking',
      description: 'Book your slot in seconds with our streamlined process.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Payment',
      description: 'Safe and secure payment gateway for your transactions.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Real-time Updates',
      description: 'Get instant notifications about your bookings and availability.'
    }
  ];

  return (
    <main className="min-h-screen">
      {/* ---------------- HERO SECTION ---------------- */}
      <section
        className="relative bg-gradient-to-r from-green-600 to-blue-600 text-white"
        aria-label="Hero Section"
      >
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg)',
            backgroundBlendMode: 'overlay'
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
                Book Your <span className="text-yellow-400">Dream Turf</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-gray-100">
                Discover premium sports facilities and book instantly.
              </p>

              {/* ✅ Cross-platform optimized search bar */}
              <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-full flex items-stretch overflow-hidden border border-gray-200">
                <div className="flex items-center flex-1 px-3">
                  <Search className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by city/area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full py-3 text-gray-900 bg-transparent focus:outline-none text-base sm:text-lg appearance-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-green-600 text-white px-6 md:px-8 py-3 font-medium text-sm sm:text-base hover:bg-green-700 transition-all duration-200 rounded-r-full focus:outline-none"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="py-12 md:py-16 bg-white" aria-label="Features Section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BookMyTurf?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              We make sports booking simple, fast, and reliable
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- AVAILABLE TURFS ---------------- */}
      <section className="py-12 md:py-16 bg-gray-50" aria-label="Available Turfs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Available Turfs</h2>
            <p className="text-lg md:text-xl text-gray-600">Browse and book your favorite venue</p>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-600">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {(Array.isArray(turfs) ? turfs : []).map((turf) => {
                const defaultImage =
                  'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg';
                let firstImage = '';
                if (turf.images) {
                  if (turf.images.startsWith('data:image')) {
                    firstImage = turf.images;
                  } else {
                    firstImage = turf.images.split(',')[0].trim();
                  }
                }
                const imageSrc = getImageSrc(firstImage, defaultImage);

                return (
                  <article
                    key={turf.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="relative">
                      <img
                        src={imageSrc}
                        alt={`${turf.name} turf facility`}
                        className="w-full h-48 object-cover rounded-t-lg"
                        onError={(e) => {
                          e.target.src = defaultImage;
                        }}
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                        <span className="text-green-600 font-semibold">
                          ₹{turf.pricePerHour || turf.price}/hour
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{turf.name}</h3>
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span>{turf.location}</span>
                      </div>
                      <div className="flex items-center mb-3">
                        <Star
                          className="w-4 h-4 text-yellow-400 fill-current"
                          aria-hidden="true"
                        />
                        <span className="ml-1 text-sm text-gray-600">{turf.rating || 4.8}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/turf/${turf.id}`}
                          className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg text-center hover:bg-gray-200 transition-colors duration-200"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleBookNow(turf.id)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center hover:bg-green-700 transition-colors duration-200"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {(!turfs || !Array.isArray(turfs) || turfs.length === 0) && !loading && (
                <div className="col-span-full text-center text-gray-600">No turfs found</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- STATISTICS ---------------- */}
      <section className="py-12 md:py-16 bg-green-600 text-white" aria-label="Statistics">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">50+</div>
              <div className="text-green-100">Turfs Available</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">1000+</div>
              <div className="text-green-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">5+</div>
              <div className="text-green-100">Sports Supported</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <div className="text-green-100">Customer Support</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
