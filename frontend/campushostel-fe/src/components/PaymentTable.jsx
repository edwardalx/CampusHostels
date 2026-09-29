import React from "react";

const statusStyles = {
  success: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

const getStatusStyle = (status) =>
  statusStyles[status?.toLowerCase()] || "bg-gray-100 text-gray-700";

export default function PaymentTable({ payments = [] }) {
  return (
    <div className="flex justify-center w-full">
      <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="py-3 font-semibold">Date</th>
                <th className="py-3 font-semibold">Amount</th>
                <th className="py-3 font-semibold">Status</th>
                <th className="py-3 font-semibold">Reference</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-teal-50/60 transition-colors"
                  >
                    <td className="py-3 text-gray-700">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-3 font-medium text-gray-900">
                      {payment.amount}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700">{payment.reference}</td>
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
