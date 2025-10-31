import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
          console.error("❌ No token received from backend redirect.");
          navigate("/login");
          return;
        }

        // ✅ Store the token immediately
        localStorage.setItem("token", token);
        localStorage.setItem("userType", "user");
        authService.setAuthHeader(token);

        // ✅ Verify and fetch user info
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

        if (!response.ok) {
          console.error("❌ Failed to verify token:", response.status);
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const userData = await response.json();
        console.log("✅ Logged-in user:", userData);

        // ✅ Save user info
        localStorage.setItem("user", JSON.stringify(userData));

        // ✅ Redirect to dashboard or home
        navigate("/dashboard");
      } catch (err) {
        console.error("⚠️ OAuth callback error:", err);
        localStorage.removeItem("token");
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
