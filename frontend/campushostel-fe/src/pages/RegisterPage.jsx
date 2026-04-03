import React, { use, useEffect, useState } from "react";
import { Eye, EyeOff, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterApi, RegisterAjax } from "../services/AuthServices";
import RegSuccessModel from "../components/RegSuccessModel";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleAuthWithToken } from "../services/GoogleAuthService";

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
  HEIGHT: "h-12",
  PADDING: "px-4",
  PADDING_RIGHT: "pr-12",
  BORDER_RADIUS: "rounded-lg",
  BORDER_COLOR: "border-gray-700",
  BG_COLOR: "bg-teal-700/50",
  TEXT_COLOR: "text-white",
  PLACEHOLDER_COLOR: "placeholder:text-gray-500",
  FOCUS_RING: "focus:ring-2 focus:ring-cyan-500/50",
};

// Button constants
const BUTTON = {
  PRIMARY: {
    BG: "bg-white",
    TEXT: "text-teal-900",
    HOVER: "hover:bg-cyan-600",
    HEIGHT: "h-12",
    PADDING: "px-4",
    BORDER_RADIUS: "rounded-lg",
    FONT_WEIGHT: "font-bold",
  },
  SECONDARY: {
    BG: "bg-white dark:bg-gray-800",
    TEXT: "text-gray-900 dark:text-white",
    BORDER: "border border-gray-300 dark:border-gray-700",
    HOVER: "hover:bg-gray-50 dark:hover:bg-gray-700",
    HEIGHT: "h-12",
  },
};

// Icon constants
const ICON = {
  LOGO_SIZE: "bg-cyan-400 p-2 rounded-lg",
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
  const [resData, setResData] = useState(null);
  const [storedToken, setStoredToken] = useState(null);
  let response;
  const navigate = useNavigate();
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
    setResData(null);
    try {
      response = await RegisterApi(mapppedData);
      setResData(response);
      console.log("Registration data:", response);
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
    console.log("Form submitted:", mapppedData);
    console.log("Response:", resData?.email);
    // TODO: Handle registration logic
  };
  const handleGoogleRegister = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",

    onSuccess: async (response) => {
      const accessToken = response.access_token;

      console.log("Google Access Token:", accessToken);
      console.log("response", response);
      try {
        const data = await GoogleAuthWithToken(accessToken);
        data.token
          ? setStoredToken(data.token)
          : setErrorMsg({ general: "Google login failed. Please try again." });
      } catch (err) {
        console.error("Google login error:", err);
      }
    },
  });
  const handleFacebookLogin = () => {
    setErrorMessage({
      general: "Facebook login failed. Please try a different method.",
    });
    console.log("Continue with Facebook");
  };
  const handleBlur = async (e) => {
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
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-teal-800 to-teal-900 dark:bg-gray-900">
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
                <Link to="/">
                  <div className="flex items-center gap-3">
                    <div className={`${ICON.LOGO_SIZE}`}>
                      <Briefcase className="w-6 h-6 text-teal-900" />
                    </div>
                    <h2 className="text-xl font-bold text-white">RentIn</h2>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <p className={`${TYPOGRAPHY.CAPTION} text-gray-400`}>
                    Already a member?
                  </p>
                  <Link
                    to="/login"
                    className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden ${BUTTON.PRIMARY.BORDER_RADIUS} ${BUTTON.PRIMARY.HEIGHT} ${BUTTON.PRIMARY.PADDING} ${BUTTON.PRIMARY.TEXT} ${TYPOGRAPHY.CAPTION} ${BUTTON.PRIMARY.FONT_WEIGHT} transition-colors`}
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
                      className="absolute right-4 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <Eye size={ICON.PASSWORD_TOGGLE_SIZE} />
                      ) : (
                        <EyeOff size={ICON.PASSWORD_TOGGLE_SIZE} />
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
                        <Eye size={ICON.PASSWORD_TOGGLE_SIZE} />
                      ) : (
                        <EyeOff size={ICON.PASSWORD_TOGGLE_SIZE} />
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
              <div className={`flex w-full ${SPACING.SOCIAL_GAP}`}>
                {/* Google Button */}
                <button
                  type="button"
                  className={`flex ${BUTTON.SECONDARY.HEIGHT} flex-1 items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700`}
                  onClick={handleGoogleRegister}
                >
                  <svg
                    className={ICON.SOCIAL_ICON_SIZE}
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.9999 12.2273C21.9999 11.3977 21.9272 10.5864 21.7863 9.80682H12.2272V14.3318H17.8067C17.5726 15.6364 16.8908 16.75 15.8681 17.4659V20.125H19.5567C21.1681 18.6705 21.9999 16.2045 21.9999 12.2273Z"
                      fill={COLORS.GOOGLE.BLUE}
                    ></path>
                    <path
                      d="M12.2272 22C15.0226 22 17.3635 21.0568 19.0181 19.5568L15.8681 17.4659C14.9317 18.0682 13.7135 18.4432 12.2272 18.4432C9.44761 18.4432 7.0908 16.5909 6.22716 14.1H2.98171V16.2045C4.63625 19.6477 8.13625 22 12.2272 22Z"
                      fill={COLORS.GOOGLE.GREEN}
                    ></path>
                    <path
                      d="M6.22727 14.1C5.97727 13.3977 5.84091 12.6477 5.84091 11.875C5.84091 11.1023 5.97727 10.3523 6.22727 9.64773V6.98864H2.98182C2.37045 8.21591 2 9.97727 2 11.875C2 13.7727 2.37045 15.5341 2.98182 16.7614L6.22727 14.1Z"
                      fill={COLORS.GOOGLE.YELLOW}
                    ></path>
                    <path
                      d="M12.2272 5.30682C13.8226 5.30682 15.1135 5.89773 16.2272 6.96591L19.0908 4.1C17.3635 2.53409 15.0226 1.75 12.2272 1.75C8.13625 1.75 4.63625 4.10227 2.98171 7.54545L6.22716 9.64773C7.0908 7.15909 9.44761 5.30682 12.2272 5.30682Z"
                      fill={COLORS.GOOGLE.RED}
                    ></path>
                  </svg>
                  <span>Google</span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  className={`flex ${BUTTON.SECONDARY.HEIGHT} flex-1 items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700`}
                  onClick={handleFacebookLogin}
                >
                  <svg
                    className={ICON.SOCIAL_ICON_SIZE}
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 13.5H16.5L17.5 9.5H14V7.5C14 6.47 14 5.5 16 5.5H17.5V2.14C17.174 2.097 15.943 2 14.643 2C11.928 2 10 3.657 10 6.7V9.5H7V13.5H10V22H14V13.5Z"
                      fill={COLORS.FACEBOOK}
                    ></path>
                  </svg>
                  <span>Facebook</span>
                </button>
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
      <footer className="w-full bg-gray-950 p-4 text-center ${TYPOGRAPHY.CAPTION} text-gray-400">
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
