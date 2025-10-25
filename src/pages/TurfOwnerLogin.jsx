import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { authService } from '../services/authService';

const TurfOwnerLogin = ({ setIsOwnerLoggedIn, setOwner }) => {
  // Prevent rendering errors
  if (!setIsOwnerLoggedIn || !setOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600">TurfOwnerLogin component is not properly configured.</p>
        </div>
      </div>
    );
  }

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const splitName = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await authService.login({ email: formData.email, password: formData.password });
        
        if (!data || !data.token) {
          setError('Login failed: Invalid response from server');
          setLoading(false);
          return;
        }
        
        const role = (data.role || '').toLowerCase();
        if (role !== 'owner') {
          setError('Access denied: not a turf owner account');
          setLoading(false);
          return;
        }
        
        setOwner(data);
        setIsOwnerLoggedIn(true);
        navigate('/turf-owner/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        const { firstName, lastName } = splitName(formData.name);
        const payload = {
          firstName,
          lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: 'OWNER'
        };
        
        // Client-side password policy for registration
        const pw = payload.password || '';
        const pwOk = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(pw);
        if (!pwOk) {
          throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
        }
        const data = await authService.register(payload);
        
        if (!data || !data.token) {
          setError('Registration failed: Invalid response from server');
          setLoading(false);
          return;
        }
        
        const role = (data.role || '').toLowerCase();
        if (role !== 'owner') {
          setError('Registration succeeded but role is not OWNER');
          setLoading(false);
          return;
        }
        
        setOwner(data);
        setIsOwnerLoggedIn(true);
        navigate('/turf-owner/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err?.response?.data) {
        setError(err.response.data);
      } else if (err?.message) {
        setError(err.message);
      } else if (err?.toString) {
        setError(err.toString());
      } else {
        setError('Authentication failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Turf Owner Portal</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back!' : 'Join as Turf Owner'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to manage your turfs and bookings' 
                : 'Register your sports facility and start earning'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter your business name"
                      required={!isLogin}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="+91 98765 43210"
                      required={!isLogin}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              )}

              {!isLogin && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Benefits of Joining</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Reach thousands of sports enthusiasts</li>
                    <li>• Easy booking management system</li>
                    <li>• Secure payment processing</li>
                    <li>• Real-time analytics and insights</li>
                    <li>• 24/7 customer support</li>
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-70"
              >
                {loading ? (isLogin ? 'Signing In…' : 'Registering…') : (isLogin ? 'Sign In' : 'Register as Turf Owner')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  {isLogin ? 'Register Now' : 'Sign In'}
                </button>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Looking for customer login? Click here
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              By {isLogin ? 'signing in' : 'registering'}, you agree to our{' '}
              <Link to="/terms" className="text-green-600 hover:text-green-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-green-600 hover:text-green-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfOwnerLogin;