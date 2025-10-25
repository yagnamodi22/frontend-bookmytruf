import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-gray-700 leading-8">
            BookMyTurf helps players discover and book quality sports turfs with ease.
            We collaborate with trusted turf owners to provide reliable availability,
            transparent pricing, and a smooth booking experience.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Mission</h3>
              <p className="text-gray-600">Make sports more accessible through simple, fast, and reliable bookings.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality</h3>
              <p className="text-gray-600">Curated facilities, verified listings, and consistent user experience.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-gray-600">We’re here to help with your bookings and queries 24/7.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


