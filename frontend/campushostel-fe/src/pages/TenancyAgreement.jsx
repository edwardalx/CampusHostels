// TenancyAgreement.jsx
import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import "../Css/TenancyCss.css";
import { getPaidTenancies } from "../services/OtherServices";
import TenancyAgreementForm from "../components/TenancyAgreementForm";

export default function TenancyAgreement() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const storedTenantId = JSON.parse(localStorage.getItem("user"));
  let response;
  useEffect(() => {
    const fetchData = async () => {
      try {
        response = await getPaidTenancies(storedTenantId.tenantId);
        setData(response);
      } catch (error) {
        setError(error);
      }
    };

    fetchData();
  }, []);
  console.log("state data", data);

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
