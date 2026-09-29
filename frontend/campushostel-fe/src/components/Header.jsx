/**
 * Header Component
 *
 * Responsive navigation header with logo, nav links, and auth buttons.
 *
 * Props:
 * - onLogin: () => void - Called when LOGIN button clicked
 * - onSignUp: () => void - Called when SIGN UP button clicked
 * - activeLink: string - Currently active nav link ('HOME' | 'EXPLORE' | 'MY_TRIPS')
 * - onNavClick: (link: string) => void - Called when nav link clicked
 */

import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { showSessionExpiredAlert } from "../hooks/useIdleTimeout";
import { LogoutApi } from "../services/AuthServices";
import { AuthContext } from "../zu-store/AuthContextInstance";
import { useContext } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNavLink, setActiveNavLink] = useState("HOME");
  const [token, setToken] = useState(localStorage.getItem("token"));
  let navLinks;
  token
    ? (navLinks = ["HOME", "HISTORY", "TENANCY"])
    : (navLinks = ["HOME", "ABOUT", "CONTACT"]);
  const { setStoreUser } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    // Listen for token changes in other tabs (initial value already comes
    // from the useState initializer above).
    const handleStorageChange = (event) => {
      if (event.key === "token") {
        setToken(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  // Handle navigation
  const handleNavClick = (link) => {
    setMenuOpen(false);
    setActiveNavLink(link);
    console.log("Navigate to:", link);
    if (link === "HOME") {
      navigate(`/`);
    }
    if (link === "HISTORY") {
      navigate(`/payment-history`);
    }
    if (link === "TENANCY") {
      navigate(`/tenancy`);
    }
    if (link === "ABOUT") {
      navigate("/about");
    }
    if (link === "CONTACT") {
      navigate("/contact");
    }
    // Implement routing: navigate(`/${link.toLowerCase()}`)
  };

  // Handle auth
  const handleLogin = () => {
    console.log("Navigate to login");
    navigate("/login");
  };

  const handleSignUp = () => {
    console.log("Navigate to sign up");
    navigate("/register");
  };
  const handleLogout = () => {
    console.log("Logging out");
    LogoutApi();
    setToken(null);
    setStoreUser(null);
    showSessionExpiredAlert(
      "You have  logged out successfully, please log back in.",
      () => navigate("/"),
    );
    // navigate("/");
  };

  return (
    <header className="bg-gradient-to-r from-cyan-500 via-teal-600 to-red-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}

          <Link to="/" className="sm:pointer-events-none">
            <div className="flex-shrink-0">
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-white">Rent</span>
                <span className="text-red-500">in</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}

          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                className={`text-sm font-medium transition-colors px-4 py-2 rounded-full ${
                  activeNavLink === link
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-gray-100 hover:text-white hover:bg-white/10"
                }`}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {!token ? (
              <button
                onClick={handleLogin}
                className="px-6 py-2 text-white font-medium text-sm hover:bg-white/10 rounded-full transition-colors"
              >
                LOGIN
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="px-6 py-2 text-white font-medium text-sm hover:bg-white/10 rounded-full transition-colors"
              >
                LOGOUT
              </button>
            )}
            {!token && (
              <button
                onClick={handleSignUp}
                className="px-6 py-2 bg-white text-teal-700 font-semibold text-sm rounded-full shadow-sm hover:bg-gray-100 transition-colors"
              >
                SIGN UP
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-red-400 hover:bg-opacity-20 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={24} className="text-white" />
            ) : (
              <Menu size={24} className="text-white" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white/20 py-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => handleNavClick(link)}
                  className={`block w-full text-left px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeNavLink === link
                      ? "bg-white text-teal-700"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {link}
                </button>
              ))}
              <div className="pt-4 border-t border-white/20 space-y-2">
                {!token ? (
                  <button
                    onClick={() => {
                      handleLogin();
                      setMenuOpen(!menuOpen);
                    }}
                    className="w-full px-4 py-2 text-white font-medium text-sm hover:bg-white/10 rounded-lg transition-colors"
                  >
                    LOGIN
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(!menuOpen);
                    }}
                    className="w-full px-4 py-2 text-white font-medium text-sm hover:bg-white/10 rounded-lg transition-colors"
                  >
                    LOGOUT
                  </button>
                )}
                {!token && (
                  <button
                    onClick={() => {
                      handleSignUp();
                      setMenuOpen(!menuOpen);
                    }}
                    className="w-full px-4 py-2 bg-white text-teal-700 font-semibold text-sm rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    SIGN UP
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
