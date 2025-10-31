// src/pages/OAuth2Callback.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OAuth2Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          // Backend endpoint that handles Google callback
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/auth/google/callback?code=${code}`,
            { withCredentials: true }
          );

          // Save token and user
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('userType', 'user');

          // Redirect to home or dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('OAuth2 callback failed:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-600">Signing you in with Google...</p>
    </div>
  );
};

export default OAuth2Callback;
