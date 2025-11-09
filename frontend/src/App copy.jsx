import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AdminDashboard from "./admin/Admindashboard";
import Login from "./admin/Login";

// Main App component with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// AppContent component that uses router hooks
function AppContent() {
  const [currentView, setCurrentView] = useState("customer");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Sync currentView with route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path === "/customer") {
      setCurrentView("customer");
    } else if (path === "/admin") {
      setCurrentView("admin");
    } else if (path === "/login") {
      setCurrentView("login");
    }
  }, [location]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      if (validateToken(token)) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        // If user is authenticated and on login page, redirect to admin
        if (location.pathname === "/login") {
          navigate("/admin");
        }
      } else {
        logout();
      }
    }
    setLoading(false);
  }, [location, navigate]);

  const validateToken = (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate("/admin");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    if (view === "customer") {
      navigate("/");
    } else if (view === "admin" && isAuthenticated) {
      navigate("/admin");
    } else if (view === "login" && !isAuthenticated) {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-xl">
        🔄 Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-black">🚗 SML Cars</span>
          <button
            className={`px-3 py-1 rounded hover:bg-gray-200 ${
              currentView === "customer" ? "bg-gray-200" : ""
            }`}
            onClick={() => handleNavClick("customer")}
          >
            Customer View
          </button>
          {isAuthenticated && (
            <button
              className={`px-3 py-1 rounded hover:bg-gray-200 ${
                currentView === "admin" ? "bg-gray-200" : ""
              }`}
              onClick={() => handleNavClick("admin")}
            >
              Admin Dashboard
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-700">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className={`px-3 py-1 rounded hover:bg-gray-200 ${
                currentView === "login" ? "bg-gray-200" : ""
              }`}
              onClick={() => handleNavClick("login")}
            >
              Admin Login
            </button>
          )}
        </div>
      </nav>

      {/* Main Content with Routes */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/customer" element={<CustomerApp />} />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminDashboard onLogout={logout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/admin" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-auto">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">SML Cars</h3>
            <p className="text-gray-600">
              Your trusted partner in luxury automotive excellence
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="text-gray-600 space-y-1">
              <li>
                <button
                  onClick={() => handleNavClick("customer")}
                  className="hover:text-black"
                >
                  Home
                </button>
              </li>
              <li>
                <a href="#about" className="hover:text-black">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-black">
                  Contact
                </a>
              </li>
              <li>
                <a href="#financing" className="hover:text-black">
                  Financing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <ul className="text-gray-600 space-y-1">
              <li>123 Luxury Drive</li>
              <li>Premium City, PC 12345</li>
              <li>contact@premiumauto.com</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-500 mt-6">
          &copy; 2024 SML Cars Dealership. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Updated Customer App Component - Now fetches real data
function CustomerApp() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5001/api/cars");

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError("Failed to load vehicles. Please try again later.");
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-700 animate-pulse">
          🔄 Loading vehicles...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-lg mb-4">❌ {error}</p>
          <button
            onClick={fetchVehicles}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Experience Automotive Excellence
        </h1>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Discover our curated collection of premium luxury vehicles designed
          for those who demand perfection.
        </p>
        <button
          onClick={fetchVehicles}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Browse Collection →
        </button>
      </section>

      {/* Featured Inventory */}
      <section className="py-16 px-4">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Featured Inventory
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          Handpicked vehicles for discerning drivers
        </p>

        {vehicles.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-4">No vehicles available at the moment.</p>
            <p>Please check back later or contact us for more information.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id || vehicle.$id}
                className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition"
              >
                <img
                  src={
                    vehicle.imageUrl
                      ? `http://localhost:5001${vehicle.imageUrl}`
                      : "/api/placeholder/400/300"
                  }
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = "/api/placeholder/400/300";
                  }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {vehicle.year} {vehicle.brand} {vehicle.model}
                  </h3>
                  <div className="text-gray-600 text-sm mb-2 space-y-1">
                    <div>Year: {vehicle.year}</div>
                    <div>Mileage: {vehicle.mileage?.toLocaleString()} mi</div>
                    <div>Fuel Type: {vehicle.fuelType}</div>
                    {vehicle.color && <div>Color: {vehicle.color}</div>}
                    <div>Transmission: {vehicle.transmission}</div>
                  </div>
                  <div className="text-black font-bold text-lg mb-2">
                    ${vehicle.price?.toLocaleString()}
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    Make Inquiry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
