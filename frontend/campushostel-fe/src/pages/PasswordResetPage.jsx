import React from "react";

export default function PasswordResetPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-700 to-teal-800 dark:bg-gray-800 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-gradient-to-br from-teal-500 to-teal-600 dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
          Reset Your Password
        </h1>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Enter your email address and we’ll send you a link to reset your
          password.
        </p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex justify-center">
            <button className="w-xl bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100 py-3 transition">
              Send Reset Link
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <a href="/login" className="text-teal-600 hover:underline text-sm">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
