import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { VerifyReset, ResetPassword } from "../services/PasswordResetService";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("Email") || "";
  const phoneNumber = searchParams.get("PhoneNumber") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verifyRes, setVerifyRes] = useState("");
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/; //only special characters
  const payload = {
    phoneNumber,
    email,
    token,
    newPassword: password,
  };
  // Derived at render time rather than via an effect — it's just a function
  // of the two password fields, not something that needs to synchronize with
  // an external system.
  const passwordsMismatch =
    confirmPassword.length > 0 &&
    password.length === confirmPassword.length &&
    password !== confirmPassword;

  const verifyPasswordApi = async () => {
    try {
      const response = await VerifyReset(payload);
      setVerifyRes(response.message);
      return response.message;
    } catch (error) {
      setError(error.details || error.message);
      if (error.errors) {
        setError("Invalid token, please try again");
      }
    }
  };

  const updatePassword = async () => {
    const verificaionResult = await verifyPasswordApi();
    const isValid = verificaionResult === "Token is valid";
    if (!isValid) {
      return;
    }
    try {
      await ResetPassword(payload);
      setMessage(
        <>
          Password reset successful. Click{" "}
          <a href="/login" className="underline font-semibold">
            here
          </a>{" "}
          to login.
        </>,
      );
      setConfirmPassword("");
      setPassword("");
    } catch (error) {
      setError(error.details || error.message);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters ");
      return;
    }
    if (!specialCharRegex.test(password)) {
      setError("Password must include atleast 1  special character(s).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    await updatePassword();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-700 to-teal-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="bg-teal-50 p-3 rounded-full">
            <KeyRound className="w-6 h-6 text-primary-teal" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Create New Password
          </h1>
        </div>

        {(message || verifyRes || error || passwordsMismatch) && (
          <p
            className={`text-center text-sm font-medium mb-4 ${
              message || verifyRes ? "text-teal-700" : "text-red-500"
            }`}
          >
            {message || verifyRes || error || "Passwords do not match"}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          onBlur={() => {
            setError("");
            setVerifyRes("");
          }}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter New Password
            </label>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-teal text-white rounded-lg font-semibold hover:bg-teal-600 py-3 transition-colors"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
