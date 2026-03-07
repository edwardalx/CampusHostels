import React from "react";

export default function PaymentTable() {
  return (
    <div className="flex justify-center w-full">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b text-gray-600">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              <tr className="hover:bg-gray-50 transition">
                <td className="py-3">2023-10-01</td>
                <td className="py-3 font-medium">$100.00</td>
                <td className="py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Paid
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition">
                <td className="py-3">2023-10-02</td>
                <td className="py-3 font-medium">$200.00</td>
                <td className="py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}