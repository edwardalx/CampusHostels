// src/pages/PaymentReceipt.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PaymentReceipt() {
  const { reference } = useParams(); // grabs {reference} from URL
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (reference) {
      fetch(`http://localhost:5000/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference })
      })
        .then(res => res.json())
        .then(data => setStatus(data.status || "success"))
        .catch(() => setStatus("failed"));
    }
  }, [reference]);

  return (
    <div>
      <h1>Payment Receipt</h1>
      {status ? <p>Payment Status: {status}</p> : <p>Verifying...</p>}
    </div>
  );
}
