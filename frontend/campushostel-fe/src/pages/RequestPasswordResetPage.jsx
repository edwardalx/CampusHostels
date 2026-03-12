import React, { useState } from "react";
import { RequestReset } from "../services/PasswordResetService";

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resData, setResData] = useState("");

  // const isPhone = isNaN(email);
  const isPhone = /^[0-9]+$/.test(email);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const requestResetCall = async () => {
    //  const isPhone = /^\d+$/.test(email);
    const payload = {
      email: isPhone ? "" : email,
      phoneNumber: isPhone ? email : "",
    };
    try {
      const response = await RequestReset(payload);
      setResData(response.message);
      setEmail("")
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
    console.log(email);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-700 to-teal-800 dark:bg-gray-800 flex justify-center">
      <div className="max-w-2xl w-full max-h-96 mt-28 bg-gradient-to-br from-teal-500 to-teal-600 dark:bg-gray-800 rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col m-8 gap-10">
          <h1 className="text-2xl font-bold text-center dark:text-white mb-4">
            Reset Your Password
          </h1>

          <p className="text-center dark:text-gray-300 ">
            Enter your email address and we’ll send you a link to reset your
            password.
          </p>
          <p
            className={`text-center  dark:text-gray-300 ${resData ? "text-purple-700" : "text-red-500"}  font-thin`}
            style={{ fontFamily: "Playfair Display" }}
          >
            {resData ? resData : error}
          </p>

          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            noValidate
            onBlur={() => {
              setError("");
              setResData("")
            }}
          >
            <div>
              <label className="block text-sm font-medium  dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Enter your email"
                className="w-full mt-1 p-4 h-7 border border-black rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex justify-center">
              <button className="w-xl bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100 py-3 transition ">
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
    </div>
  );
}
