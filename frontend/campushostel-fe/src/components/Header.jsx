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

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header({ 
  onLogin = () => {}, 
  onSignUp = () => {}, 
  activeLink = 'HOME',
  onNavClick = () => {}
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = ['HOME', 'EXPLORE', 'MY TRIPS'];

  const handleNavClick = (link) => {
    onNavClick(link);
    setMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-cyan-500 via-teal-600 to-red-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="text-white">Rent</span><span className="text-red-500">in</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                className={`text-sm font-medium transition-colors pb-2 ${
                  activeLink === link
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-100 hover:text-white'
                }`}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onLogin}
              className="px-6 py-2 text-white font-medium text-sm hover:bg-white hover:text-cyan-500 rounded transition-colors"
            >
              LOGIN
            </button>
            <button
              onClick={onSignUp}
              className="px-6 py-2 bg-red-500 text-white font-medium text-sm rounded hover:bg-orange-600 transition-colors"
            >
              SIGN UP
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white border-opacity-20 py-4">
            <div className="space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => handleNavClick(link)}
                  className={`block w-full text-left px-4 py-2 rounded font-medium text-sm transition-colors ${
                    activeLink === link
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  {link}
                </button>
              ))}
              <div className="pt-4 border-t border-white border-opacity-20 space-y-2">
                <button
                  onClick={() => {
                    onLogin();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-white font-medium text-sm hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => {
                    onSignUp();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white font-medium text-sm rounded hover:bg-orange-600 transition-colors"
                >
                  SIGN UP
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}