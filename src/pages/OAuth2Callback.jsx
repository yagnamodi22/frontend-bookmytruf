import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        console.error("❌ No token received from backend");
        navigate("/login");
        return;
      }

      try {
        // ✅ Save token and mark as 'user'
        localStorage.setItem("token", token);
        localStorage.setItem("userType", "user");
        authService.setAuthHeader(token);

        // ✅ Fetch user info from backend
        const response = await fetch(
          "https://book-by-truf-backend.onrender.com/api/user/me",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          console.error("❌ Failed to fetch user info:", response.status);
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const userData = await response.json();
        console.log("✅ User data received:", userData);

        if (userData && userData.email) {
          // ✅ Store user info locally
          localStorage.setItem("user", JSON.stringify(userData));

          // ✅ Set auth header for axios globally
          authService.setAuthHeader(token);

          // ✅ Redirect to dashboard or home
          window.location.href = "/dashboard";
        } else {
          console.error("❌ Invalid user data:", userData);
          navigate("/login");
        }
      } catch (error) {
        console.error("⚠️ Error during OAuth callback:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg font-medium text-gray-600">
        Signing you in securely...
      </div>
    </div>
  );
}

export default OAuth2Callback;
