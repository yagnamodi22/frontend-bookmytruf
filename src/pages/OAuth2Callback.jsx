import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import api from "../services/api";

function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // With our new cookie-based approach, the JWT is already set as a cookie
        // We just need to verify the user is authenticated and fetch user info
        
        // ✅ Verify and fetch user info using the cookie that was set
        const response = await api.get("/user/me", { 
          withCredentials: true 
        });

        if (!response.data) {
          console.error("❌ Failed to verify authentication");
          navigate("/login");
          return;
        }

        const userData = response.data;
        console.log("✅ Logged-in user:", userData);

        // ✅ Save user info to localStorage for app usage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userType", "user");

        // ✅ Redirect to dashboard
        navigate("/dashboard");
      } catch (err) {
        console.error("⚠️ OAuth callback error:", err);
        navigate("/login");
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg font-medium text-gray-600">
        Signing you in securely...
      </p>
    </div>
  );
}

export default OAuth2Callback;
