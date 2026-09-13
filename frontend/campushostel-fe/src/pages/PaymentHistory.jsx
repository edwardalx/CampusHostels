import React, { useEffect, useState } from "react";
import { getPaymentHistory } from "../services/PaymentService";
import PaymentTable from "../components/PaymentTable";

export default function PaymentHistory() {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const storedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await getPaymentHistory(storedUser.tenantId);
        setPaymentHistory(response);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };

    if (storedUser) {
      fetchPaymentHistory();
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-10 sm:py-14 px-4 min-h-screen bg-secondary-light-gray">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
        Payment History
      </h2>
      <PaymentTable payments={paymentHistory} />
    </div>
  );
}
