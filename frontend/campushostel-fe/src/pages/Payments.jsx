import React, { useEffect } from "react";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { getUnitByIdPropertyById } from "../services/HostelServices";
import { createTenancy } from "../services/OtherServices";
import { initailizePayments } from "../services/PaymentService";
import { LoadingSpinner } from "../components/SkeletonCard";
import Divider from "../components/Divider";

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

  const buildPaymentPayload = (tenancyId) => ({
    tenancyId,
    amount: amount || cost,
    email: email,
    callbackUrl: "",
    phone: phonenumber,
    provider: 0,
    property: property,
    unitId: roomId,
    currency: "GHS",
  });

  const tenancyPayload = {
    contractStartDate: new Date().toISOString(),
    contractDurationMonths: duration,
    propertyId: hostelId,
    unitId: roomId,
  };

  useEffect(() => {
    async function fetchSelectedHostel() {
      setPageLoading(true);
      try {
        const hostel = await getUnitByIdPropertyById(hostelId, roomId);
        setSelectedHostel(hostel || {}); // Default to an empty object if no hostel is found
      } catch {
        setErrorMsg({
          general: "Please select hostel and room to proceed with payment.",
        });
      } finally {
        setPageLoading(false);
      }
    }
    fetchSelectedHostel();
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
      setErrorMsg({ general: error.details || error.message });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleInitializePayment = async () => {
    let tenancyId;
    try {
      setPaymentLoading(true);
      resetErrorMsg();
      if (!localStorage.getItem("tenancy")) {
        tenancyId = await handleCreateTenancy();
      } else {
        tenancyId = localStorage.getItem("tenancy");
      }

      if (!tenancyId) {
        return;
      }
      const response = await initailizePayments(buildPaymentPayload(tenancyId));
      console.log("Payment initialized successfully:", response);
      window.location.assign(response.authorizationUrl); // Redirect to the payment gateway
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-slate-800 p-6 shadow-float">
            <div className="animate-spin h-10 w-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
            <p className="text-gray-200 font-medium">Processing payment...</p>
          </div>
        </div>
      )}
      {/* Right Side - Login Form */}
      <div className="flex min-h-[100svh] w-full flex-col items-center justify-center bg-gradient-to-b from-ink via-slate-900 to-teal-950 px-5 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
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

            <p className="text-4xl sm:text-5xl font-bold text-white mb-3 text-center">
              Make Payment
            </p>
            <p className="text-teal-100 text-center text-sm sm:text-base">
              Please enter your payment details to proceed.
            </p>
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
                Property
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
                className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none text-center"
              />
            </div>
            {/* Unit Input */}
            <div>
              <label
                htmlFor="unit"
                className="block text-white font-medium mb-1"
              >
                Room Number
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
                className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none text-center"
              />
            </div>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-1"
              >
                Email
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
                className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none text-center"
              />
            </div>

            {/* Phone Input */}
            <div>
              <label
                htmlFor="phone"
                className="block text-white font-medium mb-1"
              >
                Phone Number
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
                  className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none pr-12 text-center"
                />
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label
                htmlFor="duration"
                className="block text-white font-medium mb-1"
              >
                Duration
              </label>
              <div>
                {errorMsg.duration && (
                  <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                    {errorMsg.duration}
                  </p>
                )}
              </div>
              <div className="relative">
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-14 w-full appearance-none rounded-2xl border border-white/15 bg-white/10 px-4 pr-10 text-center text-white [text-align-last:center] focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none"
                >
                  <option value="" className="text-ink">Select Duration</option>
                  <option value="6" className="text-ink">6 Months</option>
                  <option value="12" className="text-ink">12 Months</option>
                  <option value="24" className="text-ink">24 Months</option>
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
                Amount
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
                className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-400/20 focus:outline-none text-center"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="mt-6 h-14 w-full rounded-full bg-white font-bold text-ink transition-transform hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={paymentloading}
            >
              {paymentloading ? "Processing..." : "Pay Now"}
            </button>
          </form>
          {errorMsg.general && (
            <>
              <Divider text="" />
              <p className="w-full text-red-400 text-base text-center font-normal mt-2">
                {errorMsg.general}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
