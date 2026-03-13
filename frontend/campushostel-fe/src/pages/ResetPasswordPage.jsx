import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
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
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/; // regex for aspecial characters, numbers, etc
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/; //only special characters
  const isPhone = /^[0-9]+$/.test(email);
  const navigate = useNavigate();
  const payload = {
    phoneNumber,
    email,
    token,
    newPassword: password,
  };

  useEffect(() => {
    validatePassword();
  }, [password, confirmPassword]);

  const validatePassword = () => {
    if (password.length !== confirmPassword) {
      setError("");
    }
    if (
      password.length === confirmPassword.length &&
      password !== confirmPassword
    ) {
      setError("Passwords do not match");
    }

    console.log(error);
  };

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
      const response = await ResetPassword(payload);
      // setVerifyRes(response.message);
      setMessage(
        <>
          Password reset successful. Click{" "}
          <a href="/login" className="text-green-500">
            here
          </a>{" "}
          to login.
        </>,
      );
      setConfirmPassword("");
      setPassword("");
      console.log(response.message);
      // navigate("/login");
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
    // const verificaionResult = await verifyPasswordApi();
    // const isValid = verificaionResult === "Token is valid";
    // if (verificaionResult === "Token is valid") {
    //   await updatePassword();
    // }

    console.log(payload);
    console.log(error);
    console.log(verifyRes);

    // send to API
    // fetch("/api/reset-password", { method:"POST", body: JSON.stringify(payload) })
  };

  return (
    <div className="w-full min-h-screen  bg-gradient-to-br from-teal-700 to-teal-800 dark:bg-gray-800 flex  justify-center">
      <div className=" text-white max-w-2xl w-full max-h-96 mt-28 bg-gradient-to-br from-teal-500 to-teal-600 dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex justify-center m-12">
          <h1 className="text-2xl font-bold text-center mb-6">
            Create New Password
          </h1>
        </div>
        <div className="flex justify-center ">
          <p
            className={`text-md font-bold text-center font-thin ${verifyRes ? "text-purple-700" : "text-red-500"}`}
            style={{ fontFamily: "Playfair Display" }}
          >
            {message || verifyRes || error}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          onBlur={() => {
            setError("");
            setVerifyRes("");
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300">
              Enter New Password
            </label>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-5 h-7 border border-black rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-5 h-7 border border-black rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex justify-center m-4">
            <button className="w-xl bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100 py-3 transition">
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
