import React, { use, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { getUnitByIdPropertyById } from "../services/HostelServices";
import { createTenancy } from "../services/OtherServices";
import { initailizePayments } from "../services/PaymentService";
import { LoadingSpinner } from "../components/SkeletonCard";
import Divider from "../components/Divider";
import DurationSelect from "../components/SelectDuration";

export default function Payments() {
  const [pageloading, setPageLoading] = useState(false);
  const [paymentloading, setPaymentLoading] = useState(false);
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
    phone: "",
    email: "",
    password: "",
    duration: "",
    amount: "",
    general: "",
  });
  const cost = (duration / 12) * (selectedHostel ? selectedHostel.cost : 0);
  const payload = {
    tenancyId: 0, // Placeholder, will be set after tenancy creation
    amount: amount || cost,
    email: email,
    callbackUrl: "",
    phone: phonenumber,
    provider: 0,
    property: property,
    unitId: roomId,
    currency: "GHS",
  };

  const tenancyPayload = {
    contractStartDate: new Date().toISOString(),
    contractDurationMonths: duration,
    propertyId: hostelId,
    unitId: roomId,
  };

  useEffect(() => {
    try {
      setPageLoading(true);
      const fetchSelectedHostel = async () => {
        const hostel = await getUnitByIdPropertyById(hostelId, roomId);
        setSelectedHostel(hostel || {}); // Default to an empty object if no hostel is found
      };
      fetchSelectedHostel();
    } catch (error) {
      setErrorMsg({
        general: "Please select hostel and room to proceed with payment.",
      });
    } finally {
      setTimeout(() => {
        setPageLoading(false);
      }, 1000);
    }
  }, []);

  const handleCreateTenancy = async () => {
    try {
      setPaymentLoading(true);
      console.info("Creating tenancy with payload:");
      const response = await createTenancy(tenancyPayload);
      const tenancyId = response.id;
      localStorage.setItem("tenancy", tenancyId);
      return tenancyId;
    } catch (error) {
      console.error("Error creating tenancy:", error);
      setErrorMsg(error.details||error.messsage )
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleInitializePayment = async () => {
    let tenancyId;
    try {
      setPaymentLoading(true);
      setErrorMsg("");
      if (!localStorage.getItem("tenancy")) {
        tenancyId = await handleCreateTenancy();
      } else {
        tenancyId = localStorage.getItem("tenancy");
      }

      // const paymentPayload = {
      //   ...payload,
      //   tenancyId: tenancyId,
      // };
      payload.tenancyId = tenancyId;
      if (!tenancyId) {
        return;
      }
      const response = await initailizePayments(payload);
      console.log("Payment initialized successfully:", response);
      window.location.href = response.authorizationUrl; // Redirect to the payment gateway
      localStorage.removeItem("tenancy");
      localStorage.setItem("Reference", JSON.stringify(response.reference));
      setAmount("");
      setEmail("");
      setPhonenumber("");
      setDuration("");
      setProperty("");
      setUnit("");
    } catch (error) {
      console.error("Error initializing payment:", error);
      const backendErrors = error?.errors;
      backendErrors
        ? setErrorMsg({
            // general: error.details || "An error occurred while initializing payment. Please try again.",
            email: backendErrors?.Email?.[0] || "",
            phone: backendErrors?.Phone?.[0] || "",
            amount: backendErrors?.Amount?.[0] || "",
          })
        : setErrorMsg({
            general:
              error.details ||
              "An error occurred while initializing payment. Please try again.",
          });
    } finally {
      setPaymentLoading(false);
    }
  };
  const handlePayment = async (e) => {
    e.preventDefault();
    resetErrorMsg();
    if (!duration || duration <= 0) {
      setErrorMsg({
        duration: "Please enter a valid duration of stay in months.",
      });
      return;
    }
    await handleInitializePayment();
    setTimeout(() => {
      setPaymentLoading(false);
    }, 1000);
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
  };

  return (
    <div>
      {pageloading && <LoadingSpinner />}

      {paymentloading && (
        <div className="fixed inset-0 bg-teal-900/70  flex items-center justify-center z-50">
          <div className="bg-teal-800 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
            <p className="text-gray-200 font-medium">Processing payment...</p>
          </div>
        </div>
      )}
      {/* Right Side - Login Form */}
      <div className=" flex min-h-screen w-full  mx-auto flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-teal-900 dark:bg-gray-900">
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

            <p className="text-5xl font-bold text-white mb-8">Make Payment</p>
            <div className="text-gray-300 mb-4 text-center">
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
                {errorMsg.property && (
                  <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                    {errorMsg.property}
                  </p>
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
                {errorMsg.unit && (
                  <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                    {errorMsg.unit}
                  </p>
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
                {errorMsg.email && (
                  <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                    {errorMsg.email}
                  </p>
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
                {errorMsg.phone && (
                  <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                    {errorMsg.phone}
                  </p>
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
                    <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                      {errorMsg.duration}
                    </p>
                  )}
                </div>
                <div className="relative mx-2">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-10 px-4 pr-10 
               bg-teal-700/50 border border-teal-600 
               rounded-lg text-white text-center 
               appearance-none 
               [text-align-last:center]
               focus:outline-none focus:ring-2 
               focus:ring-cyan-400 focus:border-transparent"
                  >
                    <option value="">Select Duration</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                  </select>

                  {/* Custom Arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white">
                    ▼
                  </div>
                </div>
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
                  {errorMsg.amount && (
                    <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                      {errorMsg.amount}
                    </p>
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
              disabled={paymentloading}
            >
              Pay Now
            </button>
          </form>
          {<Divider text={""} />}
          <div>
            {errorMsg.general && (
              <>
                <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                  {errorMsg.general}
                </p>
                <Divider text={""} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
