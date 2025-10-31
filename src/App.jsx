import React, { useState, useEffect, lazy, Suspense, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { authService } from './services/authService';

// Create Auth Context
export const AuthContext = createContext(null);

// ✅ OAuth callback page
import OAuth2Callback from './pages/OAuth2Callback';

// Lazy load all pages
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const verifySession = async () => {
      try {
        const userData = await authService.verifySession();
        setUser(userData);
      } catch (error) {
        console.error('Session verification failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Auth context value
  const authContextValue = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    logout: async () => {
      await authService.logout();
      setUser(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50">
          <Header />

          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex justify-center items-center min-h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/turfs" element={<Turfs />} />
                <Route path="/turf/:id" element={<TurfDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/owner/login" element={<TurfOwnerLogin />} />
                <Route path="/oauth2/callback" element={<OAuth2Callback />} />

                {/* Protected Routes */}
                <Route path="/booking/:id" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/dashboard/*" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/owner/dashboard/*" element={
                  <ProtectedRoute roles={['owner']}>
                    <TurfOwnerDashboard />
                  </ProtectedRoute>
                } />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>

          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

              {/* Normal user routes */}
              <Route path="/" element={<Home />} />
              <Route path="/turfs" element={<Turfs />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/turf/:id" element={<TurfDetails />} />
              <Route
                path="/booking/:id"
                element={
                  <ProtectedRoute roles={['user']}>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['user']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin/login"
                element={
                  <AdminLogin
                    setIsAdminLoggedIn={setIsAdminLoggedIn}
                    setAdmin={setAdmin}
                  />
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Turf Owner routes */}
              <Route
                path="/turf-owner/login"
                element={
                  <TurfOwnerLogin
                    setIsOwnerLoggedIn={setIsOwnerLoggedIn}
                    setOwner={setOwner}
                  />
                }
              />
              <Route
                path="/turf-owner/dashboard"
                element={
                  <ProtectedRoute roles={['owner']}>
                    <TurfOwnerDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
