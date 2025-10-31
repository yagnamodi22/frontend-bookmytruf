// src/pages/OAuth2Callback.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      console.log("🔍 Token received from backend redirect:", token);

      if (!token) {
        console.error("❌ No token received from backend");
        navigate("/login");
        return;
      }

      try {
        // ✅ Save token locally
        localStorage.setItem("token", token);
        localStorage.setItem("userType", "user");
        authService.setAuthHeader(token);

        // ✅ Fetch user info
        const response = await fetch(
          "https://book-by-truf-backend.onrender.com/api/user/me",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("🌐 Fetching user info:", response.status);

        if (response.status === 404) {
          // 🚨 User not found in DB — create new user using token
          console.warn("⚠️ User not found, trying to register new Google user...");
          const registerResponse = await fetch(
            "https://book-by-truf-backend.onrender.com/api/auth/google",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!registerResponse.ok) {
            console.error("❌ Google user registration failed:", registerResponse.status);
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          const newUser = await registerResponse.json();
          console.log("✅ New Google user created:", newUser);
          localStorage.setItem("user", JSON.stringify(newUser));
          window.location.href = "/dashboard";
          return;
        }

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
