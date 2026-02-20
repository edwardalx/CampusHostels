// src/pages/PaymentReceipt.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PaymentReceipt() {
  const { reference } = useParams(); // grabs {reference} from URL
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (reference) {
      fetch(`http://localhost:5000/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
        .then((res) => res.json())
        .then((data) => setStatus(data.status || "success"))
        .catch(() => setStatus("failed"))
        .finally(() => {
          setLoading(false);
          setTimeout(() => setLoading(false), 500);
        }); // Simulate loading delay
    }
    localStorage.removeItem("tenancy");
  }, [reference]);

  return (
    <div className=" flex flex-col items-center justify-center bg-gray-100 p-4 gap-8">
      {loading && (
        <div className="fixed inset-0 bg-teal-900/70  flex items-center justify-center z-50">
          <div className="bg-teal-800 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
            <p className="text-gray-200 font-medium">
              Verifying payment status...
            </p>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Payment Receipt</h1>
      {status ? (
        <p className="text-lg">Payment Status: {status}</p>
      ) : (
        <p className="text-lg">Verifying...</p>
      )}
    </div>
  );
}
