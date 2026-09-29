// src/pages/PaymentReceipt.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { verifyPayments } from "../services/PaymentService";

export default function PaymentReceipt() {
  const { reference } = useParams(); // grabs {reference} from URL
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    if (!reference) return;

    async function verify() {
      setLoading(true);
      try {
        const data = await verifyPayments(reference);
        setPayment(data);
      } catch {
        setError("Failed to verify payment. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    verify();
    localStorage.removeItem("tenancy");
  }, [reference]);

  if (!payment && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary-light-gray p-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
        <p className="text-lg text-gray-600">
          {error || "No payment data available."}
        </p>
      </div>
    );
  }

  const status = payment?.status?.toLowerCase();
  const statusMeta = {
    success: {
      badge: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
      message:
        "Your payment has been successfully processed. You will receive a confirmation shortly.",
    },
    failed: {
      badge: "bg-red-100 text-red-700",
      icon: <XCircle className="w-12 h-12 text-red-500" />,
      message:
        "Payment failed. Please try again or contact support if the issue persists.",
    },
  }[status] || {
    badge: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-12 h-12 text-yellow-500" />,
    message: "Your payment is still being processed. Please check back shortly.",
  };

  return (
    <div className="flex flex-col items-center justify-center bg-secondary-light-gray p-6 gap-6 min-h-screen">
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
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col gap-5 items-center">
          {statusMeta.icon}
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Payment Receipt
          </h1>

          {/* Status */}
          <div className="flex flex-col items-center gap-2">
            <span
              className={`px-4 py-1 rounded-full font-semibold text-sm ${statusMeta.badge}`}
            >
              {payment.status}
            </span>
            <p className="text-gray-500 text-sm">
              {payment.channel === "mobile_money"
                ? "Channel: Mobile Money"
                : `Channel: ${payment.channel}`}
            </p>
          </div>

          {/* Payment Details */}
          <div className="w-full flex flex-col gap-2 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-medium text-gray-900">{payment.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900">
                {payment.amount.toLocaleString()} {payment.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid At</span>
              <span className="font-medium text-gray-900">
                {new Date(payment.paidAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Customer Guidance */}
          <p className="text-gray-600 text-sm text-center border-t border-gray-100 pt-4">
            {statusMeta.message}
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary-teal text-white rounded-lg py-3 font-semibold hover:bg-teal-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Fallback message while verifying */}
      {!payment && loading && (
        <p className="text-lg text-gray-700">Verifying...</p>
      )}
    </div>
  );
}
