import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState("unknown"); // unknown, connected, disconnected
  const navigate = useNavigate();

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const checkBackendConnection = async () => {
    try {
      setBackendStatus("checking");
      const response = await fetch("http://localhost:5001/api/health");
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBackendStatus("connected");
        console.log("✅ Backend connection successful:", data);
      } else {
        setBackendStatus("disconnected");
        console.error("❌ Backend health check failed:", data);
      }
    } catch (err) {
      setBackendStatus("disconnected");
      console.error("❌ Backend connection failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting login...");
      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Login response status:", response.status);
      
      const data = await response.json().catch(() => ({ 
        error: "Invalid response from server" 
      }));

      console.log("📄 Login response data:", data);

      if (response.ok && data.token) {
        console.log("✅ Login successful, token received");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || { username: formData.username }));
        
        // Call the onLogin callback with user data and token
        onLogin(data.user || { username: formData.username }, data.token);
        
        // Navigate to admin dashboard
        navigate("/admin", { replace: true });
      } else {
        const errorMessage = data.error || data.message || "Login failed";
        console.error("❌ Login failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      setError(
        backendStatus === "disconnected" 
          ? "Cannot connect to backend server. Make sure it's running on port 5001."
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = (username, password) => {
    setFormData({ username, password });
    setError(""); // Clear any previous errors
  };

  const getBackendStatusColor = () => {
    switch (backendStatus) {
      case "connected": return "text-green-400";
      case "disconnected": return "text-red-400";
      case "checking": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const getBackendStatusText = () => {
    switch (backendStatus) {
      case "connected": return "✅ Backend Connected";
      case "disconnected": return "❌ Backend Disconnected";
      case "checking": return "🔄 Checking Connection...";
      default: return "🌐 Backend Status Unknown";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
      <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/30">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚗</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-white/80 text-sm">SML Car Rental Management</p>
        </div>

        {/* Backend Status */}
        <div className={`text-center mb-4 text-sm font-medium ${getBackendStatusColor()}`}>
          {getBackendStatusText()}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Admin Username"
                required
                disabled={loading}
                className="w-full bg-white/30 placeholder-white/60 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
              />
            </div>

            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                disabled={loading}
                className="w-full bg-white/30 placeholder-white/60 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-100 p-3 rounded-xl text-center text-sm font-medium">
              ❌ {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || backendStatus === "disconnected"}
            className={`w-full py-3 rounded-xl text-white font-bold text-lg transition ${
              loading || backendStatus === "disconnected"
                ? "bg-gray-500 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "🚀 Admin Login"
            )}
          </button>
        </form>

        {/* Quick Test Buttons */}
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              onClick={checkBackendConnection}
              disabled={loading}
              className="text-white/80 text-sm hover:text-white transition disabled:opacity-50"
            >
              🔄 Check Backend Connection
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => testCredentials("admin", "admin123")}
              disabled={loading}
              className="flex-1 bg-green-500/20 text-green-300 py-2 rounded-lg text-sm hover:bg-green-500/30 transition disabled:opacity-50"
            >
              Use Test Credentials
            </button>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-3 bg-black/20 rounded-lg">
          <p className="text-white/60 text-xs text-center">
            <strong>Demo Credentials:</strong><br />
            Username: <code className="bg-black/30 px-1 rounded">admin</code><br />
            Password: <code className="bg-black/30 px-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;