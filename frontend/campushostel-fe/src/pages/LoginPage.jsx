import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Home, Facebook } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { LoadingSpinner } from "../components/SkeletonCard";
import { LoginApi } from "../services/AuthServices";
import { GoogleAuthWithToken } from "../services/GoogleAuthService";
import ErrorBoundary from "../components/ErrorBoundary";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email_phoneNumber, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  let response;
  const handleLogin = async (e) => {
    const email = email_phoneNumber.includes("@") ? email_phoneNumber : "";
    const phoneNumber = !email_phoneNumber.includes("@") ? email_phoneNumber : "";
    e.preventDefault();
    const loginData = {
      email: email,
      phoneNumber: phoneNumber,
      password: password,
    };
    try {
      setLoading(true);
      setErrorMsg({ email: "", password: "", general: "" });
      response = await LoginApi({ loginData });

      console.log("Response:", response);
    } catch (error) {
      console.error("Login error:", error);
      // setErrorMsg({ email: "", password: "", general: "" });
      if (error.error.includes("password")) {
        setErrorMsg((prev) => ({
          ...prev,
          password: error.error,
        }));
      } else {
        setErrorMsg((prev) => ({
          ...prev,
          general:
            error.error ||
            "Login failed. Please check your credentials and try again.",
        }));
      }
    } finally {
      setLoading(false);
      if (response && response.token) {
        setEmail("");
        setPassword("");
        // localStorage.setItem("token", response.token);
        // localStorage.setItem("user", JSON.stringify(response.phoneNumber));
        navigate("/");
      }
    }
    console.log("Login attempted", errorMsg);
    // TODO: Handle login logic
  };

  const handleGoogleSuccess = async (response) => {
    const accessToken = response.access_token;

    try {
      const data = await GoogleAuthWithToken(accessToken);
      data.token
        ? navigate("/")
        : setErrorMsg({ general: "Google login failed. Please try again." });
    } catch (err) {
      console.error("Google login error:", err);
    }
  };
  const handleFacebookLogin = () => {
    setErrorMsg({ general: "Facebook login failed. Please try a different method." });
    console.log("Continue with Facebook");
  };
  // const handleForgotPass = ()=>{
  //   navigate("/password-reset")
  // }
  if (loading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex">
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
      <div className=" flex min-h-[100svh]  w-full lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-teal-900 dark:bg-gray-900">
        <div className="w-full max-w-md flex flex-col">
          {/* Header */}
          <div className="mb-12 mx-2 md:mx-0">
            <div className="flex items-center justify-between mb-12 mt-2">
              <Link to="/">
                <div className="flex items-center space-x-3">
                  <div className="bg-cyan-400 p-2 rounded-lg">
                    <Home className="w-6 h-6 text-teal-900" />
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
            <p className="text-gray-300 text-lg mb-4">
              Log in to continue your adventure.
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col  md:items-stretch gap-10 m-2 md:mx-0"
          >
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-3 mx-auto"
              >
                Email or Phone Number
              </label>
              <div>
                {errorMsg.general && (
                  <span
                    className={`text-red-400 text-base font-normal leading-normal mt-2`}
                  >
                    {errorMsg.general}
                  </span>
                )}
              </div>
              <input
                type="text"
                id="email"
                value={email_phoneNumber}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youname@email.com   or +233 123 456 7890"
                className="w-full h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-white font-medium mb-3 mx-auto"
              >
                Password
              </label>
              <div>
                {errorMsg.password && (
                  <span
                    className={`text-red-400 text-base font-normal leading-normal mt-2`}
                  >
                    {errorMsg.password}
                  </span>
                )}
              </div>
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
                <Link
                  to="/request/password-reset"
                  className="text-cyan-400 text-sm hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full  px-4 py-3 bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg mt-6 mx-auto"
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
            <ErrorBoundary
              fallback={
                <div
                  title="Google sign-in is unavailable right now"
                  className="w-full py-4 gap-2 bg-gray-800/50 text-gray-500 rounded-lg font-medium flex items-center justify-center space-x-3 shadow-md cursor-not-allowed"
                >
                  <FcGoogle className="w-5 h-5 opacity-50" />
                  <span>Google sign-in unavailable</span>
                </div>
              }
            >
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                className="w-full py-4 gap-2 bg-gray-800 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-md"
              >
                <FcGoogle className="w-5 h-5" />
                <span>Continue with Google</span>
              </GoogleLoginButton>
            </ErrorBoundary>

            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full py-4 gap-2 bg-gray-800 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-md"
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
