import React, { use, useEffect, useState } from "react";
import { getPaymentHistory } from "../services/PaymentService";
import PaymentTable from "../components/PaymentTable";

export default function PaymentHistory() {
  const [paymentHistory, setPaymentHistory] = useState([])||response;
  const storedUser = JSON.parse(localStorage.getItem("user2"));
  let response

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        response = await getPaymentHistory(storedUser.tenantId);
        setPaymentHistory(response);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };

    if (storedUser) {
      fetchPaymentHistory();
    }
    // console.log("Tenant ID:", storedUser.tenantId);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center gap-4 py-8 text-lg font-semibold mb-4 text-gray-700">
      <h2>Payment History</h2>
      <PaymentTable payments={paymentHistory} />
    </div>
  );
}
