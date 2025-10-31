import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const AuthCallback = ({ setIsLoggedIn, setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // store token and optionally fetch profile
      localStorage.setItem('token', token);
      authService.setAuthHeader(token);

      // Optionally fetch profile from backend
      authService.getProfile()
        .then((profile) => {
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
          setIsLoggedIn(true);
          navigate('/dashboard');
        })
        .catch(() => {
          // If profile fetch fails, still redirect to dashboard
          setIsLoggedIn(true);
          navigate('/dashboard');
        });

    } else {
      // No token in query - redirect to login
      navigate('/login');
    }
  }, [navigate, setIsLoggedIn, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Logging you in…</div>
    </div>
  );
};

export default AuthCallback;
