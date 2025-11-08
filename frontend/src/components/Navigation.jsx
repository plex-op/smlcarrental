import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/smllogo.png"; // <- import your logo image

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Cars", path: "/cars" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo as Image */}
          <Link to="/">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive(link.path)
                    ? "text-green-600"
                    : "text-gray-700 hover:text-green-600"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Admin Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 border-l pl-4 border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {user?.username || "Admin"}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`px-5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm ${
                  isActive("/login") ? "ring-2 ring-green-500" : ""
                }`}
              >
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden text-gray-700 hover:text-green-600 transition-colors"
          >
            {isMobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden pb-6 animate-fadeIn border-t border-gray-100 mt-2 pt-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-green-600"
                      : "text-gray-700 hover:text-green-600"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full shadow-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {user?.username || "Admin"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      onLogout();
                    }}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-all shadow-sm"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
