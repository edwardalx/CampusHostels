import React, { useState } from "react";
import { Eye, EyeOff, Briefcase } from "lucide-react";
import { Chrome, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login:", { email, password });
    // TODO: Handle login logic
  };

  const handleGoogleLogin = () => {
    console.log("Continue with Google");
  };

  const handleFacebookLogin = () => {
    console.log("Continue with Facebook");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=1200&h=1400&fit=crop"
          alt="Cozy hostel common area"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-teal-900/20"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-teal-800 to-teal-900 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-12">
              <Link to='/'>
                <div className="flex items-center space-x-3">
                  <div className="bg-cyan-400 p-2 rounded-lg">
                    <Briefcase className="w-6 h-6 text-teal-900" />
                  </div>
                  <span className="text-3xl font-bold text-white">RentIn</span>
                </div>
              </Link>
              <div className="text-sm text-gray-300">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  SignUp
                </Link>
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome Back!
            </h1>
            <p className="text-gray-300 text-lg">
              Log in to continue your adventure.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-10">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-3"
              >
                Email or Username
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youname@email.com"
                className="w-full h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-white font-medium mb-3"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent pr-12"
                />
                <div
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors  p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div className="text-right mt-3">
                <a href="#" className="text-cyan-400 text-sm hover:underline">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-4 bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg mt-6"
            >
              Log In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-10">
            <div className="flex-1 border-t border-teal-600"></div>
            <span className="px-4 text-gray-300 text-sm">OR</span>
            <div className="flex-1 border-t border-teal-600"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 gap-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-md"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full py-4 gap-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-md"
            >
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              <span>Continue with Facebook</span>
            </button>
          </div>

          {/* Bottom Link */}
          <div className="text-center mt-10">
            <span className="text-gray-300">Don't have an account? </span>
            <Link
              to="/register"
              className="text-cyan-400 font-semibold hover:underline"
            >
              SignUp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
