import React from 'react';
import TurfList from '../components/TurfList.jsx';

const Turfs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">All Turfs</h1>
          <p className="text-gray-600 mt-2">Browse available turfs and book instantly</p>
        </div>
        <TurfList />
      </div>
    </div>
  );
};

export default Turfs;


