import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { siteSettingsService } from '../services/siteSettingsService';
import { AuthContext } from '../App';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const [settings, setSettings] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const map = await siteSettingsService.getMap();
        setSettings(map || {});
      } catch {}
    };
    load();
    const handler = () => load();
    window.addEventListener('site-settings-updated', handler);
    return () => window.removeEventListener('site-settings-updated', handler);
  }, []);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">BT</span>
              </div>
            )}
            <span className="text-2xl font-bold text-gray-900">{settings.site_name || 'BookMyTurf'}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors duration-200 ${
                location.pathname === '/' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/turfs" 
              className={`font-medium transition-colors duration-200 ${
                location.pathname === '/turfs' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Turfs
            </Link>
            <Link 
              to="/about" 
              className={`font-medium transition-colors duration-200 ${
                location.pathname === '/about' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`font-medium transition-colors duration-200 ${
                location.pathname === '/contact' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.type === 'admin' && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    Admin
                  </span>
                )}
                {user.type === 'owner' && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Turf Owner
                  </span>
                )}
                <Link
                  to={
                    user.type === 'admin' 
                      ? '/admin/dashboard' 
                      : user.type === 'owner'
                      ? '/turf-owner/dashboard'
                      : '/dashboard'
                  }
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-green-600 transition-colors duration-200"
                >
                  <User className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => handleLogout(user.type)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 transition-colors duration-200"
                >
                  Customer Login
                </Link>
                <Link
                  to="/turf-owner/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Turf Owner
                </Link>
                <Link
                  to="/admin/login"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Admin
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-green-600 focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 max-h-[80vh] overflow-y-auto">
            <nav className="space-y-4" aria-label="Mobile Navigation">
              <Link 
                to="/" 
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-lg"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Home"
              >
                Home
              </Link>
              <Link 
                to="/turfs" 
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-lg"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Turfs"
              >
                Turfs
              </Link>
              <Link 
                to="/about" 
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-lg"
                onClick={() => setIsMenuOpen(false)}
                aria-label="About"
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-lg"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Contact"
              >
                Contact
              </Link>
              {user ? (
                <>
                  <Link
                    to={
                      user.type === 'admin' 
                        ? '/admin/dashboard' 
                        : user.type === 'owner'
                        ? '/turf-owner/dashboard'
                        : '/dashboard'
                    }
                    className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-lg"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Dashboard"
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleLogout(user.type)}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md text-lg"
                    aria-label="Logout"
                  >
                    <div className="flex items-center">
                      <LogOut className="w-5 h-5 mr-2" />
                      <span>Logout</span>
                    </div>
                  </button>
                </>
              ) : (
                <div className="space-y-3 mt-4">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md text-lg"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Customer Login"
                  >
                    Customer Login
                  </Link>
                  <Link
                    to="/turf-owner/login"
                    className="block px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Turf Owner Login"
                  >
                    Turf Owner
                  </Link>
                  <Link
                    to="/admin/login"
                    className="block px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 text-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Admin Login"
                  >
                    Admin
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;