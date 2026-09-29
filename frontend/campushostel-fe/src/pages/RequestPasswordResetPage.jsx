import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { RequestReset } from "../services/PasswordResetService";

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resData, setResData] = useState("");

  const isPhone = /^[0-9]+$/.test(email);

  const requestResetCall = async () => {
    const payload = {
      email: isPhone ? "" : email,
      phoneNumber: isPhone ? email : "",
    };
    try {
      const response = await RequestReset(payload);
      setResData(response.message);
      setEmail("");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPhone && !email.includes("@")) {
      setError("Please provide a valid email");
      return;
    }
    await requestResetCall();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-700 to-teal-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="bg-teal-50 p-3 rounded-full">
            <KeyRound className="w-6 h-6 text-primary-teal" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Reset Your Password
          </h1>
          <p className="text-center text-gray-600 text-sm">
            Enter your email address and we’ll send you a link to reset your
            password.
          </p>
        </div>

        {(resData || error) && (
          <p
            className={`text-center text-sm font-medium mb-4 ${
              resData ? "text-teal-700" : "text-red-500"
            }`}
          >
            {resData || error}
          </p>
        )}

        <form
          className="space-y-5"
          onSubmit={handleSubmit}
          noValidate
          onBlur={() => {
            setError("");
            setResData("");
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-teal text-white rounded-lg font-semibold hover:bg-teal-600 py-3 transition-colors"
          >
            Send Reset Link
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-primary-teal hover:underline text-sm font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
