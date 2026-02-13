import React, { use, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { getUnitByIdPropertyById } from "../services/HostelServices";
import Divider from "../components/Divider";

export default function Payments() {
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [email, setEmail] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedHostel, setSelectedHostel] = useState(null);
  const { hostelId, roomId } = useParams();
  const [errorMsg, setErrorMsg] = useState({
    property: "",
    unit: "",
    email: "",
    password: "",
    duration: "",
    amount: "",
    general: "",
  });
  useEffect(() => {
    try {
      const fetchSelectedHostel = async () => {
        const hostel = await getUnitByIdPropertyById(hostelId, roomId);
        setSelectedHostel(hostel || {}); // Default to an empty object if no hostel is found
      };
      fetchSelectedHostel();
    } catch (error) {
      setErrorMsg({
        general: "Please select hostel and room to proceed with payment.",
      });
    }
  }, []);
  const cost = (duration / 12) * (selectedHostel ? selectedHostel.cost : 0);
  const handlePayment = (e) => {
    e.preventDefault();
    if (!duration || duration <= 0) {
      setErrorMsg({duration:"Please enter a valid duration of stay in months."});
      return;
    }
    const payload = {
      property: property,
      unit: unit,
      email: email,
      phonenumber: phonenumber,
      amount: amount,
    };
    const tenancyPayload = {
      contractStartDate: new Date().toISOString(),
      contractDurationMonths: duration,
      propertyId: hostelId,
      unitId: roomId,
    };

    console.log("Payment initiated");
    console.log(payload);
    console.log(tenancyPayload);
  };
  const resetErrorMsg = () => {
    setErrorMsg({
      property: "",
      unit: "",
      email: "",
      password: "",
      duration: "",
      amount: "",
      general: "",
    });
  }

  return (
    <div>
      {/* Right Side - Login Form */}
      <div className=" flex min-h-screen w-full lg:w-1/2 mx-auto flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-teal-900 dark:bg-gray-900">
        <div className="w-full max-w-md flex flex-col">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center">
            <div className="flex items-center  mb-12">
              <div className="flex items-center space-x-3">
                <div className="bg-cyan-400 p-2 rounded-lg">
                  <Briefcase className="w-6 h-6 text-teal-900" />
                </div>
                <span className="text-3xl font-bold text-white">Payment</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-8">Make Payment</h1>
            <div className="text-gray-300 mb-4">
              {
                <Divider
                  text={"Please enter your payment details to proceed."}
                />
              }
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handlePayment}
            onBlur={resetErrorMsg}
            className="flex flex-col items-center md:items-stretch gap-5"
          >
            {/* Property */}
            <div>
              <label
                htmlFor="Property"
                className="block text-white font-medium mb-1"
              >
                {<Divider text={"Property"} />}
              </label>
              <div>
                {errorMsg.general && (
                  <span
                    className={`text-red-400 text-base font-normal leading-normal mt-2`}
                  >
                    {errorMsg.general}
                  </span>
                )}
              </div>
              <input
                type="text"
                id="Property"
                value={selectedHostel ? selectedHostel.propertyName : property}
                onChange={(e) => setProperty(e.target.value)}
                placeholder="select property"
                className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-center"
              />
            </div>
            {/* Unit Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-1"
              >
                {<Divider text={"Room Number"} />}
              </label>
              <div>
                {errorMsg.general && (
                  <span
                    className={`text-red-400 text-base font-normal leading-normal mt-2`}
                  >
                    {errorMsg.general}
                  </span>
                )}
              </div>
              <input
                type="text"
                id="unit"
                value={selectedHostel ? selectedHostel.roomNumber : unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Select unit"
                className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-center"
              />
            </div>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-1"
              >
                {<Divider text={"Email"} />}
              </label>
              <div>
                {errorMsg.general && (
                  <span
                    className={`text-red-400 text-base font-normal leading-normal mt-2`}
                  >
                    {errorMsg.general}
                  </span>
                )}
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youname@email.com "
                className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-center"
              />
            </div>

            {/* Phone Input */}
            <div>
              <label
                htmlFor="phone"
                className="block text-white font-medium mb-3"
              >
                {<Divider text={"Phone Number"} />}
              </label>
              <div>
                {errorMsg.password && (
                  <span
                    className={`text-red-400 text-base font-normal leading-normal mt-2`}
                  >
                    {errorMsg.password}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  value={phonenumber}
                  onChange={(e) => setPhonenumber(e.target.value)}
                  placeholder="+233 123 456 7890"
                  className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent pr-12 text-center"
                />
              </div>
              {/* Duration Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-white font-medium mb-1"
                >
                  {<Divider text={"Duration"} />}
                </label>
                <div>
                  {errorMsg.duration && (
                    <span
                      className={`text-red-400 text-base font-normal leading-normal mt-2`}
                    >
                      {errorMsg.duration}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Enter duration of stay in months"
                  className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-center"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-white font-medium mb-1"
                >
                  {<Divider text={"Amount"} />}
                </label>
                <div>
                  {errorMsg.general && (
                    <span
                      className={`text-red-400 text-base font-normal leading-normal mt-2`}
                    >
                      {errorMsg.general}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  id="amount"
                  value={selectedHostel ? cost : amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to pay in GH₵"
                  className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-center"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-90 mx-2 md:w-full md:mx-0 py-4 bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg mt-6"
            >
              Log In
            </button>
          </form>
          {<Divider text={" "} />}
        </div>
      </div>
    </div>
  );
}
