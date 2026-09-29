import React from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

const tenantDos = [
  "Keep your room clean and well maintained",
  "Respect other tenants and maintain a peaceful environment",
  "Report maintenance issues promptly",
  "Pay rent on or before the due date",
  "Follow all property and hostel rules",
];

const tenantDonts = [
  "Do not damage property or furniture",
  "Do not engage in illegal activities",
  "Do not sublet the room without permission",
  "Do not create excessive noise or disturbance",
  "Do not house additional occupants without approval",
];

const landlordResponsibilities = [
  "Provide a safe and habitable living environment",
  "Ensure the property is properly maintained",
  "Respond to maintenance requests in a timely manner",
  "Respect tenant privacy",
  "Maintain accurate records of tenancy and payments",
];

function InfoCard({ icon, iconClass, title, items }) {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-full ${iconClass}`}>
          <Icon size={20} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-gray-700 text-sm sm:text-base">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-teal flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 py-12 sm:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
          About Our Housing Platform
        </h1>

        <p className="text-center mb-10 sm:mb-12 text-teal-50 max-w-2xl mx-auto">
          Our platform helps students and tenants easily find accommodation,
          make secure payments, and manage their tenancy agreements online. We
          aim to provide a safe and comfortable living environment for all
          residents.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          <InfoCard
            icon={CheckCircle2}
            iconClass="bg-teal-50 text-primary-teal"
            title="Tenant Responsibilities (Do's)"
            items={tenantDos}
          />
          <InfoCard
            icon={XCircle}
            iconClass="bg-red-50 text-red-500"
            title="Tenant Restrictions (Don'ts)"
            items={tenantDonts}
          />
        </div>

        <div className="mt-6">
          <InfoCard
            icon={ShieldCheck}
            iconClass="bg-cyan-50 text-cyan-600"
            title="Landlord Responsibilities"
            items={landlordResponsibilities}
          />
        </div>
      </div>
    </div>
  );
}
