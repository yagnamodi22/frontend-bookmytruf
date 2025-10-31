import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import api from "../services/api";

function OAuth2Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log("OAuth callback initiated");
        
        // Fetch user info using the JWT cookie that was set
        const response = await api.get("user/me", { 
          withCredentials: true 
        });

        if (!response || !response.data) {
          console.error("Failed to verify authentication - no data returned");
          setError("Authentication failed. Please try again.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const userData = response.data;
        console.log("Authentication successful, user data:", userData);

        // Save user info to localStorage for app usage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userType", "user");
        
        // Remove any token from localStorage to ensure we're using cookies only
        localStorage.removeItem("token");

        // Redirect to dashboard
        navigate("/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Authentication error: " + (err.message || "Unknown error"));
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
      <p className="text-lg font-medium text-gray-600">
        Signing you in securely...
      </p>
    </div>
  );
}

export default OAuth2Callback;
