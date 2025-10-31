// src/pages/RedirectHandler.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RedirectHandler = ({ setUser, setIsLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Parse token and user info from URL params
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userData = params.get("user");

    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userType", "user");

        setUser(user);
        setIsLoggedIn(true);

        navigate("/dashboard");
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate, setUser, setIsLoggedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Redirecting, please wait...
    </div>
  );
};

export default RedirectHandler;
