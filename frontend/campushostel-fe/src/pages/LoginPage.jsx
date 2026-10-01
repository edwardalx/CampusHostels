import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Facebook } from "lucide-react";
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
    } catch (error) {
      if (error?.error?.includes("password")) {
        setErrorMsg((prev) => ({
          ...prev,
          password: error.error,
        }));
      } else {
        setErrorMsg((prev) => ({
          ...prev,
          general:
            error?.error ||
            "Login failed. Please check your credentials and try again.",
        }));
      }
    } finally {
      setLoading(false);
      if (response && response.token) {
        setEmail("");
        setPassword("");
        navigate("/");
      }
    }
  };

  const handleGoogleSuccess = async (response) => {
    const accessToken = response.access_token;

    try {
      const data = await GoogleAuthWithToken(accessToken);
      data.token
        ? navigate("/")
        : setErrorMsg({ general: "Google login failed. Please try again." });
    } catch {
      setErrorMsg({ general: "Google login failed. Please try again." });
    }
  };
  const handleFacebookLogin = () => {
    setErrorMsg({ general: "Facebook login failed. Please try a different method." });
  };
  if (loading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh]">
      {/* Image panel (large screens only) */}
      <div className="relative hidden lg:block lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=1200&h=1400&fit=crop"
          alt="Cozy hostel common area"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent"></div>
        <p className="absolute right-12 bottom-12 left-12 text-3xl font-extrabold text-white">
          Your next home, a few taps away.
        </p>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col bg-gradient-to-b from-ink via-slate-900 to-teal-950 px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] lg:w-1/2 lg:items-center lg:justify-center lg:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none">
          <div className="mb-10 flex items-center justify-between">
            <Link to="/" aria-label="Rentin home" className="text-2xl font-extrabold tracking-tight text-white">
              Rent<span className="text-primary-orange">in</span>
            </Link>
            <Link to="/register" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
              Sign up
            </Link>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 mb-8 text-base text-slate-300">Log in to manage your stay.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
            {errorMsg.general && (
              <p role="alert" className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">
                {errorMsg.general}
              </p>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-200">
                Email or phone number
              </label>
              <input
                type="text"
                id="email"
                autoComplete="username"
                inputMode="email"
                value={email_phoneNumber}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com or +233 12 345 6789"
                className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 pr-14 pl-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-slate-300 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errorMsg.password && (
                <p role="alert" className="mt-2 text-sm text-red-300">{errorMsg.password}</p>
              )}
              <div className="mt-3 text-right">
                <Link to="/request/password-reset" className="text-sm font-semibold text-teal-300 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 h-14 w-full rounded-full bg-white text-base font-bold text-ink transition-transform hover:bg-slate-100 active:scale-[0.98]"
            >
              Log in
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/15"></div>
            <span className="text-xs font-semibold tracking-widest text-slate-400">OR</span>
            <div className="h-px flex-1 bg-white/15"></div>
          </div>

          <div className="flex flex-col gap-3">
            <ErrorBoundary
              fallback={
                <div
                  title="Google sign-in is unavailable right now"
                  className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 font-semibold text-slate-500"
                >
                  <FcGoogle className="h-5 w-5 opacity-50" />
                  <span>Google sign-in unavailable</span>
                </div>
              }
            >
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
              >
                <FcGoogle className="h-5 w-5" />
                <span>Continue with Google</span>
              </GoogleLoginButton>
            </ErrorBoundary>

            <button
              type="button"
              onClick={handleFacebookLogin}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
            >
              <Facebook className="h-5 w-5 text-[#6aa5ff]" />
              <span>Continue with Facebook</span>
            </button>
          </div>

          <p className="mt-auto pt-10 text-center text-sm text-slate-400">
            New here?{" "}
            <Link to="/register" className="font-semibold text-teal-300 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
