const statusStyles = {
  success: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const getStatusStyle = (status) =>
  statusStyles[status?.toLowerCase()] || "bg-slate-100 text-slate-700";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatAmount = (payment) => {
  if (payment.currency) {
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: payment.currency,
      }).format(payment.amount);
    } catch {
      // Unknown currency code: fall back to the raw figures below.
    }
  }
  return `${payment.currency ?? ""} ${payment.amount}`.trim();
};

/**
 * Payment history. Phones get a list of cards (amount first, like a banking app);
 * tablets and up get a table.
 */
export default function PaymentTable({ payments = [] }) {
  if (payments.length === 0) {
    return (
      <div className="card w-full max-w-2xl px-6 py-14 text-center text-secondary-gray">
        No payments found
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Phones */}
      <ul className="flex flex-col gap-3 md:hidden">
        {payments.map((payment) => (
          <li key={payment.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xl font-extrabold text-ink">{formatAmount(payment)}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(payment.status)}`}
              >
                {payment.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-secondary-gray">{formatDate(payment.paidAt)}</p>
            <p className="mt-2 text-xs break-all text-slate-400">Ref: {payment.reference}</p>
          </li>
        ))}
      </ul>

      {/* Tablet and up */}
      <div className="card hidden overflow-x-auto p-6 md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-secondary-gray">
            <tr>
              <th className="py-3 font-semibold">Date</th>
              <th className="py-3 font-semibold">Amount</th>
              <th className="py-3 font-semibold">Status</th>
              <th className="py-3 font-semibold">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="transition-colors hover:bg-teal-50/60">
                <td className="py-3 text-slate-700">{formatDate(payment.paidAt)}</td>
                <td className="py-3 font-semibold text-ink">{formatAmount(payment)}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(payment.status)}`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="py-3 text-slate-700">{payment.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
