import React, { useEffect, useMemo, useState } from "react";
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
import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails"; // ADD THIS IMPORT
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

/* ---------- helpers ---------- */
function safeValidateJWT(token) {
  if (!token) return false;
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return false;
    const json = JSON.parse(atob(payloadB64));
    return typeof json.exp === "number" && json.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* Guard component for private routes */
function ProtectedRoute({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

/* ---------- App with Router ---------- */
export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

/* ---------- AppContent ---------- */
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // bootstrap auth (and re-check on route change in case another tab logs out)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser && safeValidateJWT(token)) {
      setIsAuthenticated(true);
      try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
      if (location.pathname === "/login") navigate("/admin", { replace: true });
    } else {
      // clear any invalid cache
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      if (location.pathname.startsWith("/admin")) navigate("/login", { replace: true });
    }
    setLoading(false);
  }, [location.pathname, navigate]);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate("/admin", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/", { replace: true });
  };

  // Hide chrome on login if you prefer (toggle this)
  const hideChrome = location.pathname === "/login";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-xl">
        🔄 Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChrome && (
        <Navigation isAuthenticated={isAuthenticated} user={user} onLogout={logout} />
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/car/:carId" element={<CarDetails />} /> {/* ADD THIS ROUTE */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthed={isAuthenticated}>
                <AdminDashboard onLogout={logout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/admin" replace /> : <Login onLogin={handleLogin} />
            }
          />

          {/* catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideChrome && <Footer />}
    </div>
  );
}