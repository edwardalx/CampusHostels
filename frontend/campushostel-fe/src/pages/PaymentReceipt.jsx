// src/pages/PaymentReceipt.tsx
import { data, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyPayments } from "../services/PaymentService";

export default function PaymentReceipt() {
  const { reference } = useParams(); // grabs {reference} from URL
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    setLoading(true);
    if (reference) {
      verifyPayments(reference)
        .then((data) => {setPayment(data); return data;})
        .catch(() => setError("Failed to verify payment. Please try again."))
        .finally(() => {
          setLoading(false);
          setTimeout(() => setLoading(false), 500);
        }); // Simulate loading delay
    }
    localStorage.removeItem("tenancy");
  }, [reference]);

   if (!payment && !loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-6 gap-4">
        <h1 className="text-2xl font-bold">Payment Receipt</h1>
        <p className="text-lg text-gray-600">No payment data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-6 gap-6 min-h-screen">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-teal-900/70 flex items-center justify-center z-50">
          <div className="bg-teal-800 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
            <p className="text-gray-200 font-medium">Verifying payment status...</p>
          </div>
        </div>
      )}

      {/* Receipt Card */}
      {payment && (
        <div className="bg-gray-300 rounded-xl shadow-lg p-8 w-full max-w-2xl min-h-[400px] flex flex-col gap-4 justify-center  items-center">
          <h1 className="text-2xl font-bold text-teal-700 text-center">Payment Receipt</h1>

          {/* Status */}
          <div className="flex items-center gap-2 text-center justify-center">
            <span
              className={`px-3 py-1 rounded-full text-white font-semibold ${
                payment.status.toLowerCase() === "success"
                  ? "bg-green-500"
                  : payment.status.toLowerCase() === "failed"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            >
              {payment.status}
            </span>
            <p className="text-gray-600 text-sm">{payment.channel === "mobile_money" ? `Channel: Mobile Money` : `Channel: ${payment.channel}`}</p>
          </div>

          {/* Payment Details */}
          <div className="flex flex-col gap-1 text-center">
            <p>
              <span className="font-semibold">Reference:</span> {payment.reference}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              {payment.amount.toLocaleString()} {payment.currency}
            </p>
            <p>
              <span className="font-semibold">Paid At:</span>{" "}
              {new Date(payment.paidAt).toLocaleString()}
            </p>
          </div>

          {/* Customer Guidance */}
          <p className="text-gray-700 mt-4 text-sm text-center">
            {payment.status.toLowerCase() === "success"
              ? "Your payment has been successfully processed. You will receive a confirmation shortly."
              : "Payment failed. Please try again or contact support if the issue persists."}
          </p>
          <div className="text-gray-700 bg-teal-600 rounded-xl text-center w-24 font-semibold hover:bg-teal-300 cursor-pointer" onClick={() => navigate("/")} >HOME</div>
        </div>
      )}

      {/* Fallback message while verifying */}
      {!payment && loading && <p className="text-lg text-gray-700">Verifying...</p>}
    </div>
  );
}
