// src/components/TurfList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { turfService } from '../services/turfService';
import { authService } from '../services/authService';
import { getImageSrc } from '../utils/imageUtils';

const TurfList = () => {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const data = await turfService.getAllTurfs();
        setTurfs(data);
      } catch (error) {
        console.error('Error fetching turfs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurfs();
  }, []);

  if (loading) return <div>Loading...</div>;

  const handleBooking = (turfId) => {
    if (authService.isAuthenticated()) {
      navigate(`/booking/${turfId}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {turfs.map(turf => (
        <div key={turf.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          {/* Turf Images */}
          <div className="h-48 overflow-hidden">
            <img
              src={getImageSrc(turf.images ? (turf.images.startsWith('data:image') ? turf.images : turf.images.split(',')[0].trim()) : '', '/default-image.jpg')}
              alt={turf.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{turf.name}</h3>
            <p className="text-gray-600 mb-2">{turf.location}</p>
            <p className="text-green-600 font-semibold text-lg mb-4">₹{turf.pricePerHour}/hour</p>
            
            {/* Additional Images Preview */}
            {turf.images && !turf.images.startsWith('data:image') && turf.images.split(',').length > 1 && (
              <div className="flex space-x-2 mb-4">
                {turf.images.split(',').slice(1, 4).map((image, index) => (
                  <img
                    key={index}
                    src={getImageSrc(image.trim(), '/default-image.jpg')}
                    alt={`${turf.name} ${index + 2}`}
                    className="w-12 h-12 object-cover rounded border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            )}
            
            <button 
              onClick={() => handleBooking(turf.id)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TurfList;


