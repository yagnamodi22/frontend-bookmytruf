import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import api from "../services/api";

function OAuth2Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log("OAuth callback initiated");
        
        // First try to get profile with existing cookie
        try {
          const profileResponse = await api.get("/auth/profile", { 
            withCredentials: true 
          });
          
          if (profileResponse && profileResponse.data) {
            console.log("Authentication successful via cookie, user data:", profileResponse.data);
            
            // Store user data with proper role formatting
            const userData = {
              ...profileResponse.data,
              role: (profileResponse.data.role || '').toLowerCase()
            };
            
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("userType", "user");
            
            // Redirect to dashboard
            setIsLoading(false);
            navigate("/dashboard");
            return;
          }
        } catch (profileError) {
          console.warn("Could not fetch profile with cookie, trying fallback:", profileError);
        }
        
        // Fallback: Try to get user info from another endpoint
        const response = await api.get("/user/me", { 
          withCredentials: true 
        });

        if (!response || !response.data) {
          console.error("Failed to verify authentication - no data returned");
          throw new Error("Authentication failed. Please try again.");
        }

        const userData = response.data;
        console.log("Authentication successful via fallback, user data:", userData);

        // Save user info to localStorage for app usage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userType", "user");
        
        // Redirect to dashboard
        setIsLoading(false);
        navigate("/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Authentication error: " + (err.message || "Unknown error"));
        setIsLoading(false);
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
        <p className="text-sm text-gray-600">Redirecting to login page...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-600">
          Signing you in securely...
        </p>
      </div>
    </div>
  );
}

export default OAuth2Callback;
