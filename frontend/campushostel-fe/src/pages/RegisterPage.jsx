import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

// Layout constants
const LAYOUT = {
  DESKTOP_SPLIT: '2xl',
  FORM_MAX_WIDTH: 'md:max-w-2xl',
  SECTION_WIDTH: 'w-1/2',
  PADDING: {
    MOBILE: 'p-6',
    DESKTOP: '2xl:p-12',
  },
};

// Spacing constants
const SPACING = {
  HEADER_BOTTOM: 'mb-10',
  HEADING_BOTTOM: 'mb-8',
  FORM_GAP: 'gap-6',
  LABEL_PADDING: 'pb-2',
  DIVIDER_MARGIN: 'my-8',
  SOCIAL_GAP: 'gap-4',
  FORM_PADDING_TOP: 'pt-2',
};

// Input field constants
const INPUT = {
  HEIGHT: 'h-12',
  PADDING: 'px-4',
  PADDING_RIGHT: 'pr-12',
  BORDER_RADIUS: 'rounded-lg',
  BORDER_COLOR: 'border-gray-700',
  BG_COLOR: 'bg-gray-800',
  TEXT_COLOR: 'text-white',
  PLACEHOLDER_COLOR: 'placeholder:text-gray-500',
  FOCUS_RING: 'focus:ring-2 focus:ring-cyan-500/50',
};

// Button constants
const BUTTON = {
  PRIMARY: {
    BG: 'bg-cyan-500',
    TEXT: 'text-white',
    HOVER: 'hover:bg-cyan-600',
    HEIGHT: 'h-12',
    PADDING: 'px-4',
    BORDER_RADIUS: 'rounded-lg',
    FONT_WEIGHT: 'font-bold',
  },
  SECONDARY: {
    BG: 'bg-white dark:bg-gray-800',
    TEXT: 'text-gray-900 dark:text-white',
    BORDER: 'border border-gray-300 dark:border-gray-700',
    HOVER: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    HEIGHT: 'h-12',
  },
};

// Icon constants
const ICON = {
  LOGO_SIZE: 'size-6',
  PASSWORD_TOGGLE_SIZE: 20,
  SOCIAL_ICON_SIZE: 'h-6 w-6',
};

// Color constants
const COLORS = {
  PRIMARY: '#06B6D4', // Cyan
  FACEBOOK: '#1877F2',
  GOOGLE: {
    BLUE: '#4285F4',
    GREEN: '#34A853',
    YELLOW: '#FBBC05',
    RED: '#EA4335',
  },
  OVERLAY: 'from-black/50 to-transparent',
};

// Typography constants
const TYPOGRAPHY = {
  LOGO: 'text-xl font-bold text-gray-900 dark:text-white',
  HEADING: 'text-4xl font-black leading-tight tracking-tight',
  SUBHEADING: 'text-base font-normal leading-normal mt-2',
  LABEL: 'text-sm font-medium',
  BODY: 'text-base font-normal',
  CAPTION: 'text-sm',
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Handle registration logic
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-900 dark:bg-gray-900">
      <div className="flex flex-1">
        <div className={`flex w-full flex-col ${LAYOUT.DESKTOP_SPLIT}:flex-row`}>
          {/* Left Column: Form */}
          <div className={`flex w-full flex-col items-center justify-center ${LAYOUT.PADDING.MOBILE} ${LAYOUT.DESKTOP_SPLIT}:w-1/2 ${LAYOUT.PADDING.DESKTOP}`}>
            <div className={`w-full ${LAYOUT.FORM_MAX_WIDTH}`}>
              {/* Header */}
              <header className={`${SPACING.HEADER_BOTTOM} flex w-full items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`${ICON.LOGO_SIZE} text-cyan-500`}>
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z"
                        fill="currentColor"
                      ></path>
                      <path
                        clipRule="evenodd"
                        d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z"
                        fill="currentColor"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">RentIn</h2>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`${TYPOGRAPHY.CAPTION} text-gray-400`}>Already a member?</p>
                  <Link to="/" className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden ${BUTTON.PRIMARY.BORDER_RADIUS} ${BUTTON.PRIMARY.HEIGHT} ${BUTTON.PRIMARY.PADDING} ${BUTTON.PRIMARY.BG} ${BUTTON.PRIMARY.TEXT} ${TYPOGRAPHY.CAPTION} ${BUTTON.PRIMARY.FONT_WEIGHT} ${BUTTON.PRIMARY.HOVER} transition-colors`}>
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
                  Sign up to discover and book the best hostels around the world.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className={`flex flex-col ${SPACING.FORM_GAP}`}>
                {/* Full Name */}
                <label className="flex flex-col">
                  <p className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}>Full Name</p>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${TYPOGRAPHY.BODY}`}
                  />
                </label>

                {/* Email Address */}
                <label className="flex flex-col">
                  <p className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}>Email Address</p>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${TYPOGRAPHY.BODY}`}
                  />
                </label>

                {/* Password */}
                <label className="flex flex-col">
                  <p className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}>Password</p>
                  <div className="relative flex w-full items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${INPUT.PADDING_RIGHT} ${TYPOGRAPHY.BODY}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? <Eye size={ICON.PASSWORD_TOGGLE_SIZE} /> : <EyeOff size={ICON.PASSWORD_TOGGLE_SIZE} />}
                    </button>
                  </div>
                </label>

                {/* Confirm Password */}
                <label className="flex flex-col">
                  <p className={`text-white ${TYPOGRAPHY.LABEL} ${SPACING.LABEL_PADDING}`}>Confirm Password</p>
                  <div className="relative flex w-full items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`flex w-full resize-none overflow-hidden ${INPUT.BORDER_RADIUS} ${INPUT.TEXT_COLOR} focus:outline-0 ${INPUT.FOCUS_RING} border ${INPUT.BORDER_COLOR} ${INPUT.BG_COLOR} ${INPUT.HEIGHT} ${INPUT.PLACEHOLDER_COLOR} ${INPUT.PADDING} ${INPUT.PADDING_RIGHT} ${TYPOGRAPHY.BODY}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <Eye size={ICON.PASSWORD_TOGGLE_SIZE} /> : <EyeOff size={ICON.PASSWORD_TOGGLE_SIZE} />}
                    </button>
                  </div>
                </label>

                {/* Terms & Conditions */}
                <div className={`flex items-center gap-3 ${SPACING.FORM_PADDING_TOP}`}>
                  <input
                    id="terms"
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                  />
                  <label htmlFor="terms" className={`${TYPOGRAPHY.CAPTION} text-gray-400`}>
                    I agree to the{' '}
                    <a href="#" className="text-cyan-500 hover:underline">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-cyan-500 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
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
                <p className={`${TYPOGRAPHY.CAPTION} text-gray-400 px-4`}>Or sign up with</p>
                <hr className="flex-1 border-t border-gray-700" />
              </div>

              {/* Social Sign-Up */}
              <div className={`flex w-full ${SPACING.SOCIAL_GAP}`}>
                {/* Google Button */}
                <button
                  type="button"
                  className={`flex ${BUTTON.SECONDARY.HEIGHT} flex-1 items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700`}
                >
                  <svg className={ICON.SOCIAL_ICON_SIZE} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                >
                  <svg className={ICON.SOCIAL_ICON_SIZE} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          <div className={`relative hidden ${LAYOUT.SECTION_WIDTH} flex-1 items-center justify-center ${LAYOUT.DESKTOP_SPLIT}:flex`}>
            <div className={`absolute inset-0 h-full w-full bg-gradient-to-t ${COLORS.OVERLAY} z-10`}></div>
            <img
              className="h-full w-full object-cover"
              alt="A group of young friends laughing and socializing in a vibrant, colorful common area of a hostel"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZy2cIf9B304n6jMhek1BCPSTyFoBesrT6Gni5bR3nZO2KFFfmYjwGB1GwWQvI8gYHp4wFEWR3uACihLgQkS27edXyC36ZV-DelUfqeR0_B7Ub-PLI6lUlK-CUvNMFRGN-puuOXIb_MkxdHybS1ENOHbSuh3QZnztpobngpy0QLww_n07D4aJnV540bFhWeEOKVHgFTIK2ymwzb6SZLvOI5PH7wJXL9Y5XF_CFNEozoHDR8ciUpbyCPNC_nTUcSkq40LbuW_dY054U"
            />
            <div className="absolute bottom-12 left-12 right-12 text-white z-20">
              <h3 className="mb-2 text-3xl font-bold">Find Your Vibe, Find Your Hostel.</h3>
              <p className="text-lg text-gray-200">
                Connect with fellow travelers and create unforgettable memories in the world's best hostels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-950 p-4 text-center ${TYPOGRAPHY.CAPTION} text-gray-400">
        © 2025 RentIn. All rights reserved. |{' '}
        <a href="#" className="hover:text-cyan-500">
          About Us
        </a>
        {' '}|{' '}
        <a href="#" className="hover:text-cyan-500">
          Help
        </a>
      </footer>
    </div>
  );
}
