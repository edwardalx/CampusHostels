import React from "react";

const payments = [
  { id: 1, date: "2023-10-01", amount: "$100.00", status: "Paid" },
  { id: 2, date: "2023-10-02", amount: "$200.00", status: "Pending" },
];

const statusStyles = {
  Success: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function PaymentTable({payments=[]}) {
  return (
    <div className="flex justify-center w-full">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border">
            <thead className="border-b text-gray-600">
              <tr className="divide-x">
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reference</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`hover:bg-teal-50 transition divide-x ${
                      payment.id % 2 === 1 ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <td className="py-3">{new Date(payment.paidAt).toLocaleString()}</td>
                    <td className="py-3 font-medium">{payment.amount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusStyles[payment.status]}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3">{payment.reference}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
