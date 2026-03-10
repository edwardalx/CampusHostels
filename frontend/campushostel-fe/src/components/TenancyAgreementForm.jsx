import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import "../Css/TenancyCss.css";

export default function TenancyAgreementForm({agreement}) {
    const[user, setUser]=useState(JSON.parse(localStorage.getItem("user"))||{})
//   const agreement = {
//     tenantName: "John Doe",
//     studentId: "ST1023",
//     phone: "0551234567",
//     email: "john@example.com",
//     propertyName: "Campus Hostel A",
//     roomNumber: "B12",
//     startDate: "2025-09-01",
//     endDate: "2026-06-30",
//     rent: 1200,
//   };

  const agreementRef = useRef();

  const downloadPDF = () => {
    const element = agreementRef.current;

    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `tenancy-agreement-${agreement.tenantName.replace(/\s+/g, "-")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
        compress: true,
      },
      pagebreak: { mode: ["css", "legacy"] },
    };

    html2pdf().set(options).from(element).save();
  };

  return (
    <div className="agreement-container border">
      {/* Simplified Letterhead */}
      <div className=" bg-gradient-to-r from-cyan-200 via-teal-200 to-red-300 h-20 ">
        <div className="letterhead-content">
          <div className="brand">
            <span className="brand-name">
              <span className="text-white">Rent</span>
              <span className="text-red-500">in</span>
            </span>
            <span className="brand-tag">• STUDENT HOUSING</span>
          </div>
          <div className="tenant-name">{user.fname}</div>
        </div>
      </div>

      {/* Main Agreement Content */}
      <div ref={agreementRef} className="printable">
        {/* TITLE */}
        <h1 className="agreement-title">TENANCY AGREEMENT</h1>

        {/* INTRO */}
        <div className="intro-text">
          <p className="leading-relaxed">
            This Tenancy Agreement is made between{" "}
            <strong>Campus Hostels</strong> and the tenant listed below. By
            accepting the platform terms and conditions during registration, the
            tenant agrees to the conditions outlined in this agreement.
          </p>
        </div>

        {/* TENANT DETAILS */}
        <h2 className="section-title">Tenant Information</h2>
        <div className="details-row">
          <div className="details-group">
            <div className="details-label">Full Name</div>
            <div className="details-value">{user.fname}</div>
          </div>
          <div className="details-group">
            <div className="details-label">Tenancy ID</div>
            <div className="details-value">{agreement.id}</div>
          </div>
        </div>

        <div className="details-row">
          <div className="details-group">
            <div className="details-label">Phone Number</div>
            <div className="details-value">{agreement.phone||"024412345678"}</div>
          </div>
          <div className="details-group">
            <div className="details-label">Email Address</div>
            <div className="details-value">{agreement.email||"email@mail.com"}</div>
          </div>
        </div>

        {/* PROPERTY DETAILS */}
        <h2 className="section-title">Property Details</h2>
        <div className="details-row">
          <div className="details-group">
            <div className="details-label">Property Name</div>
            <div className="details-value">{agreement.propertyName}</div>
          </div>
          <div className="details-group">
            <div className="details-label">Room Number</div>
            <div className="details-value">{agreement.unitId}</div>
          </div>
        </div>

        <div className="details-row">
          <div className="details-group">
            <div className="details-label">Tenancy Start Date</div>
            <div className="details-value">
              {new Date(agreement.contractStartDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="details-group">
            <div className="details-label">Tenancy End Date</div>
            <div className="details-value">
              {new Date(agreement.contractEndDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* PAYMENT SECTION */}
        <div className="payment-section">
          <h2 className="section-title">Payment Terms</h2>
          <div className="payment-wrapper">
            <div className="payment-value">
              GHS {agreement.totalAmountPaid.toLocaleString()}
            </div>
            <div className="payment-note">
              * Rent must be paid upfront
            </div>
          </div>
        </div>

        {/* RESPONSIBILITIES SECTION */}
        <div className="responsibilities-section">
          <h2 className="section-title">Tenant Responsibilities</h2>
          <ul className="responsibilities-list">
            <li>Maintain cleanliness of the room and common areas</li>
            <li>
              Respect other tenants and maintain quiet hours (10:00 PM - 7:00
              AM)
            </li>
            <li>Do not damage property or make unauthorized alterations</li>
            <li>Report maintenance issues promptly to hostel management</li>
            <li>No subletting or unauthorized occupants allowed</li>
            <li>Comply with all hostel rules and regulations</li>
          </ul>
        </div>

        {/* AGREEMENT FOOTER */}
        <div className="agreement-footer">
          <p>
            By registering and accepting the platform terms and conditions, the
            tenant acknowledges that they have read, understood, and accepted
            this tenancy agreement in its entirety.
          </p>
          <p>
            Generated on:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* DOWNLOAD BUTTON */}
      <div className="download-btn-container no-print">
        <button onClick={downloadPDF} className="download-btn">
          Download Agreement as PDF
        </button>
      </div>
    </div>
  );
}
