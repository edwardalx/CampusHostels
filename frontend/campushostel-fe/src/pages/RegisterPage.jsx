import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { RegisterApi, RegisterAjax } from "../services/AuthServices";
import RegSuccessModel from "../components/RegSuccessModel";
import ErrorBoundary from "../components/ErrorBoundary";
import GoogleLoginButton from "../components/GoogleLoginButton";
import SocialButton, { FacebookIcon } from "../components/SocialButton";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthWithIdToken } from "../services/GoogleAuthService";

// Layout constants
const LAYOUT = {
  DESKTOP_SPLIT: "2xl",
  FORM_MAX_WIDTH: "md:max-w-2xl",
  SECTION_WIDTH: "w-1/2",
  PADDING: {
    MOBILE: "p-6",
    DESKTOP: "2xl:p-12",
  },
};

// Spacing constants
const SPACING = {
  HEADER_BOTTOM: "mb-10",
  HEADING_BOTTOM: "mb-8",
  FORM_GAP: "gap-6",
  LABEL_PADDING: "pb-2",
  DIVIDER_MARGIN: "my-8",
  SOCIAL_GAP: "gap-4",
  FORM_PADDING_TOP: "pt-2",
};

// Input field constants
const INPUT = {
  HEIGHT: "h-14",
  PADDING: "px-4",
  PADDING_RIGHT: "pr-14",
  BORDER_RADIUS: "rounded-2xl",
  BORDER_COLOR: "border-white/15",
  BG_COLOR: "bg-white/10",
  TEXT_COLOR: "text-white",
  PLACEHOLDER_COLOR: "placeholder:text-slate-400",
  FOCUS_RING: "focus:ring-4 focus:ring-teal-400/20",
};

// Button constants
const BUTTON = {
  PRIMARY: {
    BG: "bg-white",
    TEXT: "text-ink",
    HOVER: "hover:bg-slate-100",
    HEIGHT: "h-14",
    PADDING: "px-6",
    BORDER_RADIUS: "rounded-full",
    FONT_WEIGHT: "font-bold",
  },
  SECONDARY: {
    BG: "bg-white dark:bg-gray-800",
    TEXT: "text-gray-900 dark:text-white",
    BORDER: "border border-gray-300 dark:border-gray-700",
    HOVER: "hover:bg-gray-50 dark:hover:bg-gray-700",
    HEIGHT: "h-14",
  },
};

// Icon constants
const ICON = {
  PASSWORD_TOGGLE_SIZE: 20,
  SOCIAL_ICON_SIZE: "h-6 w-6",
};

// Color constants
const COLORS = {
  PRIMARY: "#06B6D4", // Cyan
  FACEBOOK: "#1877F2",
  GOOGLE: {
    BLUE: "#4285F4",
    GREEN: "#34A853",
    YELLOW: "#FBBC05",
    RED: "#EA4335",
  },
  OVERLAY: "from-black/50 to-transparent",
};

// Typography constants
const TYPOGRAPHY = {
  LOGO: "text-xl font-bold text-gray-900 dark:text-white",
  HEADING: "text-4xl font-black leading-tight tracking-tight",
  SUBHEADING: "text-base font-normal leading-normal mt-2",
  LABEL: "font-medium",
  BODY: "text-base font-normal",
  CAPTION: "text-sm",
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkToken, setCheckToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    general: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    passwordConfirm: "",
  });
  const [storedToken, setStoredToken] = useState(null);
  let response;
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setStoredToken(token);
    }
  }, [checkToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mapppedData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      password: formData.password,
      isActive: formData.agreeToTerms,
    };
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage((prev) => ({
        ...prev,
        passwordConfirm: "Passwords do not match",
      }));
      return;
    }
    if (!formData.agreeToTerms) {
      setErrorMessage((prev) => ({
        ...prev,
        general: "You must agree to the terms to proceed",
      }));
      return;
    }

    setErrorMessage({
      general: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirm: "",
    });
    try {
      response = await RegisterApi(mapppedData);
    } catch (error) {
      console.warn("Registration error:", error);

      // backend validation errors
      if (error.errors) {
        setErrorMessage({
          general: "",
          firstName: error.errors.FirstName?.join(" ") || "",
          lastName: error.errors.LastName?.[0] || "",
          email: error.errors.Email?.join(" ") || "",
          phoneNumber: error.errors.PhoneNumber?.[0] || "",
          password: error.errors.Password?.[0] || "",
        });
      } else {
        // fallback error
        setErrorMessage((prev) => ({
          ...prev,
          general: error.error || "Registration failed",
        }));
      }
    } finally {
      console.log("errorMessage:", errorMessage);
      if (response?.token) {
        setFormData({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
        });
      }
    }
    setCheckToken(!storedToken);
  };
  const handleGoogleRegisterSuccess = async (idToken) => {
    try {
      const data = await GoogleAuthWithIdToken(idToken);
      setStoredToken(data.token);
    } catch (error) {
      setErrorMessage({ general: error.message });
    }
  };
  const handleGoogleRegisterError = () => {
    setErrorMessage({ general: "Google sign-up failed. Please try again." });
  };
  const handleFacebookLogin = () => {
    setErrorMessage({
      general: "Facebook login failed. Please try a different method.",
    });
  };
  const handleBlur = async () => {
    const ajaxData = {
      email: formData.email,
      phoneNumber: formData.phoneNumber,
    };
    if (!formData.email && !formData.phoneNumber) {
      return setErrorMessage({ general: "" });
    }
    const checkUnique = await RegisterAjax(ajaxData);
    if (checkUnique.emailExists) {
      setErrorMessage({ email: "Email already exists" });
    } else {
      setErrorMessage({ email: "" });
    }
    // setErrorMessage({email:""});
    if (checkUnique.phoneExists) {
      setErrorMessage({ phoneNumber: "Phone number already exists" });
    } else {
      setErrorMessage({ phoneNumber: "" });
    }
    setErrorMessage({ general: "" });
    // setErrorMessage({ phoneNumber: "" });
  };

  return storedToken ? (
    <RegSuccessModel />
  ) : (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-ink via-slate-900 to-teal-950">
      <div className="flex flex-1">
        <div
          className={`flex w-full flex-col ${LAYOUT.DESKTOP_SPLIT}:flex-row`}
        >
          {/* Left Column: Form */}
          <div
            className={`flex w-full flex-col items-center justify-center ${LAYOUT.PADDING.MOBILE} ${LAYOUT.DESKTOP_SPLIT}:w-1/2 ${LAYOUT.PADDING.DESKTOP}`}
          >
            <div className={`w-full ${LAYOUT.FORM_MAX_WIDTH}`}>
              {/* Header */}
              <header
                className={`${SPACING.HEADER_BOTTOM} flex w-full items-center justify-between`}
              >
                <Link to="/" aria-label="Rentin home" className="text-2xl font-extrabold tracking-tight text-white">
                  Rent<span className="text-primary-orange">in</span>
                </Link>
                <div className="flex items-center gap-2">
                  <p className={`hidden sm:block ${TYPOGRAPHY.CAPTION} text-gray-400`}>
                    Already a member?
                  </p>
                  <Link
                    to="/login"
                    className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden h-11 px-5 rounded-full bg-white ${BUTTON.PRIMARY.TEXT} ${TYPOGRAPHY.CAPTION} ${BUTTON.PRIMARY.FONT_WEIGHT} transition-colors`}
                  >
                    <span className="truncate">Log In</span>
                  </Link>
                </div>
              </header>

              {/* Heading */}
              <div className={SPACING.HEADING_BOTTOM}>
                <p className={`text-white ${TYPOGRAPHY.HEADING}`}>
                  Join Our Adventure
                </p>
                <p className={`text-gray-400 ${TYPOGRAPHY.SUBHEADING}`}>
                  Sign up to discover and book the best hostels around the
                  world.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                onBlur={handleBlur}
                noValidate
                className={`flex flex-col ${SPACING.FORM_GAP}`}
              >
                {/* Full Name */}

                <label className="flex flex-col">
                  {errorMessage.firstName && (
                    <span className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}>
                      {errorMessage.firstName}
                    </span>
                  )}
                  <p
                    className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}
                  >
                    First Name
                  </p>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${TYPOGRAPHY.BODY}`}
                  />
                </label>
                <label className="flex flex-col">
                  {errorMessage.lastName && (
                    <span className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}>
                      {errorMessage.lastName}
                    </span>
                  )}
                  <p
                    className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}
                  >
                    Last Name
                  </p>
                  <input
                    type="text"
                    // inputMode="tel" // still shows numeric keypad on mobile
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${TYPOGRAPHY.BODY}`}
                  />
                </label>
                <label className="flex flex-col">
                  {errorMessage.phoneNumber && (
                    <span className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}>
                      {errorMessage.phoneNumber}
                    </span>
                  )}
                  <p
                    className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}
                  >
                    Phone Number
                  </p>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+233 123 456 7890"
                    className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${TYPOGRAPHY.BODY}`}
                  />
                </label>

                {/* Email Address */}
                <label className="flex flex-col">
                  {errorMessage.email && (
                    <span className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}>
                      {errorMessage.email}
                    </span>
                  )}
                  <p
                    className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}
                  >
                    Email Address
                  </p>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={"Enter your email"}
                    className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${TYPOGRAPHY.BODY}`}
                  />
                </label>

                {/* Password */}
                <label className="flex flex-col">
                  {errorMessage.password && (
                    <span className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}>
                      {errorMessage.password}
                    </span>
                  )}
                  <p
                    className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}
                  >
                    Password
                  </p>
                  <div className="relative flex w-full items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${INPUT.PADDING_RIGHT} ${TYPOGRAPHY.BODY}`}
                    />
                    <div
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-white transition-colors p-2"
                    >
                      {showPassword ? (
                        <EyeOff size={ICON.PASSWORD_TOGGLE_SIZE} />
                      ) : (
                        <Eye size={ICON.PASSWORD_TOGGLE_SIZE} />
                      )}
                    </div>
                  </div>
                </label>

                {/* Confirm Password */}
                <label className="flex flex-col">
                  {errorMessage.passwordConfirm && (
                    <span className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}>
                      {errorMessage.passwordConfirm}
                    </span>
                  )}
                  <p
                    className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}
                  >
                    Confirm Password
                  </p>
                  <div className="relative flex w-full items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${INPUT.PADDING_RIGHT} ${TYPOGRAPHY.BODY}`}
                    />
                    <div
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-white transition-colors p-1"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={ICON.PASSWORD_TOGGLE_SIZE} />
                      ) : (
                        <Eye size={ICON.PASSWORD_TOGGLE_SIZE} />
                      )}
                    </div>
                  </div>
                </label>

                {/* Terms & Conditions */}
                <div
                  className={`flex items-center gap-3 ${SPACING.FORM_PADDING_TOP}`}
                >
                  <div>
                    <div>
                      <input
                        id="terms"
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        required
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                      />

                      <label
                        htmlFor="terms"
                        className={`${TYPOGRAPHY.CAPTION} text-gray-400`}
                      >
                        I agree to the{" "}
                        <a href="#" className="text-cyan-500 hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-cyan-500 hover:underline">
                          Privacy Policy
                        </a>
                        .
                      </label>
                    </div>
                    <div>
                      {errorMessage.general && (
                        <span
                          className={`text-red-400 ${TYPOGRAPHY.SUBHEADING}`}
                        >
                          {errorMessage.general}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`flex w-full cursor-pointer items-center justify-center overflow-hidden ${BUTTON.PRIMARY.BORDER_RADIUS} ${BUTTON.PRIMARY.HEIGHT} ${BUTTON.PRIMARY.PADDING} ${BUTTON.PRIMARY.BG} ${BUTTON.PRIMARY.TEXT} ${TYPOGRAPHY.BODY} ${BUTTON.PRIMARY.FONT_WEIGHT} transition-all ${BUTTON.PRIMARY.HOVER} active:scale-95`}
                >
                  <span className="truncate">Create Account</span>
                </button>
              </form>

              {/* Divider */}
              <div className={`flex items-center ${SPACING.DIVIDER_MARGIN}`}>
                <hr className="flex-1 border-t border-gray-700" />
                <p className={`${TYPOGRAPHY.CAPTION} text-gray-400 px-4`}>
                  Or sign up with
                </p>
                <hr className="flex-1 border-t border-gray-700" />
              </div>

              {/* Social Sign-Up */}
              <div className="flex w-full flex-col gap-3">
                <ErrorBoundary
                  fallback={
                    <SocialButton disabled title="Google sign-up is unavailable right now" icon={<FcGoogle className="h-5 w-5" />}>
                      Google unavailable
                    </SocialButton>
                  }
                >
                  <GoogleLoginButton
                    onSuccess={handleGoogleRegisterSuccess}
                    onError={handleGoogleRegisterError}
                    text="signup_with"
                  />
                </ErrorBoundary>

                <SocialButton onClick={handleFacebookLogin} icon={<FacebookIcon />}>
                  Sign up with Facebook
                </SocialButton>
              </div>
            </div>
          </div>

          {/* Right Column: Image */}
          <div
            className={`relative hidden ${LAYOUT.SECTION_WIDTH} flex-1 items-center justify-center ${LAYOUT.DESKTOP_SPLIT}:flex`}
          >
            <div
              className={`absolute inset-0 h-full w-full bg-gradient-to-t ${COLORS.OVERLAY} z-10`}
            ></div>
            <img
              className="h-full w-full object-cover"
              alt="A group of young friends laughing and socializing in a vibrant, colorful common area of a hostel"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZy2cIf9B304n6jMhek1BCPSTyFoBesrT6Gni5bR3nZO2KFFfmYjwGB1GwWQvI8gYHp4wFEWR3uACihLgQkS27edXyC36ZV-DelUfqeR0_B7Ub-PLI6lUlK-CUvNMFRGN-puuOXIb_MkxdHybS1ENOHbSuh3QZnztpobngpy0QLww_n07D4aJnV540bFhWeEOKVHgFTIK2ymwzb6SZLvOI5PH7wJXL9Y5XF_CFNEozoHDR8ciUpbyCPNC_nTUcSkq40LbuW_dY054U"
            />
            <div className="absolute bottom-12 left-12 right-12 text-white z-20">
              <h3 className="mb-2 text-3xl font-bold">
                Find Your Vibe, Find Your Hostel.
              </h3>
              <p className="text-lg text-gray-200">
                Connect with fellow travelers and create unforgettable memories
                in the world's best hostels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-black/30 p-4 text-center text-sm text-gray-400">
        © 2025 RentIn. All rights reserved. |{" "}
        <a href="#" className="hover:text-cyan-500">
          About Us
        </a>{" "}
        |{" "}
        <a href="#" className="hover:text-cyan-500">
          Help
        </a>
      </footer>
    </div>
  );
}
