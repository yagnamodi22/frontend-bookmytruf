import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Turfs from './pages/Turfs';
import TurfDetails from './pages/TurfDetails';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TurfOwnerLogin from './pages/TurfOwnerLogin';
import TurfOwnerDashboard from './pages/TurfOwnerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [owner, setOwner] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header 
          isLoggedIn={isLoggedIn} 
          user={user} 
          setIsLoggedIn={setIsLoggedIn}
          isAdminLoggedIn={isAdminLoggedIn}
          admin={admin}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
          isOwnerLoggedIn={isOwnerLoggedIn}
          owner={owner}
          setIsOwnerLoggedIn={setIsOwnerLoggedIn}
        />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/turfs" element={<Turfs />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/turf/:id" element={<TurfDetails />} />
            <Route path="/booking/:id" element={<ProtectedRoute roles={["user"]}><Booking /></ProtectedRoute>} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
            <Route path="/dashboard" element={<ProtectedRoute roles={["user"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLogin setIsAdminLoggedIn={setIsAdminLoggedIn} setAdmin={setAdmin} />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/turf-owner/login" element={<TurfOwnerLogin setIsOwnerLoggedIn={setIsOwnerLoggedIn} setOwner={setOwner} />} />
            <Route path="/turf-owner/dashboard" element={<ProtectedRoute roles={["owner"]}><TurfOwnerDashboard /></ProtectedRoute>} />
          </Routes>
        </ErrorBoundary>
        <Footer />
      </div>
    </Router>
  );
}

export default App;