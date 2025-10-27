import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import api from './services/api'; // Ensure you've configured api.js with axios and withCredentials:true

// Lazy load page components
const Home = lazy(() => import('./pages/Home'));
const Turfs = lazy(() => import('./pages/Turfs'));
const TurfDetails = lazy(() => import('./pages/TurfDetails'));
const Booking = lazy(() => import('./pages/Booking'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TurfOwnerLogin = lazy(() => import('./pages/TurfOwnerLogin'));
const TurfOwnerDashboard = lazy(() => import('./pages/TurfOwnerDashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [owner, setOwner] = useState(null);

  // On mount, check if user has a valid session via cookie by fetching profile
  useEffect(() => {
    api.get('/auth/profile')
      .then(res => {
        if (res.data && res.data.email) {
          setIsLoggedIn(true);
          setUser(res.data);
          const role = (res.data.role || '').toLowerCase();
          if (role === 'admin') {
            setIsAdminLoggedIn(true);
            setAdmin(res.data);
          } else if (role === 'owner') {
            setIsOwnerLoggedIn(true);
            setOwner(res.data);
          }
        } else {
          clearAllAuthState();
        }
      })
      .catch(() => {
        clearAllAuthState();
      });
  }, []);

  const clearAllAuthState = () => {
    setIsLoggedIn(false);
    setUser(null);
    setIsAdminLoggedIn(false);
    setAdmin(null);
    setIsOwnerLoggedIn(false);
    setOwner(null);
  };

  return (
    <Router>
      <ScrollToTop />
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
          <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>}>
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
          </Suspense>
        </ErrorBoundary>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
