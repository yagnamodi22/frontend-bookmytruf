import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Save token locally
      localStorage.setItem("token", token);
      localStorage.setItem("userType", "user"); // Mark as normal user
      authService.setAuthHeader(token);

      // Fetch user details from backend
      fetch("https://book-by-truf-backend.onrender.com/api/user/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.email) {
            localStorage.setItem("user", JSON.stringify(data));
            navigate("/dashboard", { replace: true }); // Redirect to dashboard
          } else {
            window.location.href = "/login";
          }
        })
        .catch((err) => {
          console.error("Error fetching user info:", err);
          window.location.href = "/login";
        });
    } else {
      navigate("/login");
    }
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
