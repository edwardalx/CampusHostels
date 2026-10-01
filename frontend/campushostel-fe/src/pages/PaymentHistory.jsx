import { useEffect, useState } from "react";
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
      } catch {
        setPaymentHistory([]);
      }
    };

    if (storedUser) {
      fetchPaymentHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center gap-5 bg-secondary-light-gray px-4 py-8 sm:py-12">
      <h1 className="w-full max-w-2xl text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Payment history
      </h1>
      <PaymentTable payments={paymentHistory} />
    </div>
  );
}
