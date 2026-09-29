// TenancyAgreement.jsx
import { useEffect, useState } from "react";
import "../Css/TenancyCss.css";
import { getPaidTenancies } from "../services/OtherServices";
import TenancyAgreementForm from "../components/TenancyAgreementForm";

export default function TenancyAgreement() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const storedTenantId = JSON.parse(localStorage.getItem("user"));
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPaidTenancies(storedTenantId.tenantId);
        setData(response);
      } catch (error) {
        setError(error?.message || "Failed to load your tenancy agreements.");
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  return (
    <>
     {data.map((tenancy,index)=>(
        <>
         <div className="text-right" style={{fontFamily:'"font-playfair",serif'}}>{`Page ${index+1} of ${data.length}`}</div>
        <TenancyAgreementForm key={tenancy.id} agreement={tenancy} />
        </>

     )) }
    </>
  );
}
