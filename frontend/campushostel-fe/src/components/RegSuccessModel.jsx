import React from "react";
import { useNavigate } from "react-router-dom";

export default function RegSuccessModal({ response }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (response?.token) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.phoneNumber));
    }
    navigate("/");
  };

  const handleCancel = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl min-h-[500px]  w-full p-6 text-center space-y-4 animate-fadeIn">
          <h1 className="text-2xl font-semibold text-teal-700">
            🎉 Registration Successful!
          </h1>

          <p className="text-gray-600">
            Your account has been created successfully.
          </p>

          <p className="text-sm text-gray-500">
            Click <strong>Continue</strong> to log in or <strong>Cancel</strong>{" "}
            to return to the homepage.
          </p>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleContinue}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700 transition focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              Continue
            </button>

            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 font-medium hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
