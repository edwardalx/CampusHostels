import React from "react";
import PaymentTable from "../components/PaymentTable";

export default function PaymentHistory() {
  return (
    <div className="flex flex-col justify-center items-center gap-4 py-8 text-lg font-semibold mb-4 text-gray-700">
      <h2>Payment History</h2>
      <PaymentTable />
    </div>
  );
}
