import React from "react";

export default function AboutPage() {
  return (
    <div className=" w-full bg-gradient-to-br from-teal-600 to-teal-700 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8 ">
        <h1 className="text-3xl font-bold text-center mb-6">
          About Our Housing Platform
        </h1>

        <p className="text-center mb-10 text-gray-600">
          Our platform helps students and tenants easily find accommodation,
          make secure payments, and manage their tenancy agreements online. We
          aim to provide a safe and comfortable living environment for all
          residents.
        </p>

        {/* Tenant Do's */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            Tenant Responsibilities (Do's)
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Keep your room clean and well maintained</li>
            <li>Respect other tenants and maintain a peaceful environment</li>
            <li>Report maintenance issues promptly</li>
            <li>Pay rent on or before the due date</li>
            <li>Follow all property and hostel rules</li>
          </ul>
        </div>

        {/* Tenant Don'ts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            Tenant Restrictions (Don'ts)
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Do not damage property or furniture</li>
            <li>Do not engage in illegal activities</li>
            <li>Do not sublet the room without permission</li>
            <li>Do not create excessive noise or disturbance</li>
            <li>Do not house additional occupants without approval</li>
          </ul>
        </div>

        {/* Landlord Responsibilities */}
        <div>
          <h2 className="text-xl font-semibold mb-3">
            Landlord Responsibilities
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide a safe and habitable living environment</li>
            <li>Ensure the property is properly maintained</li>
            <li>Respond to maintenance requests in a timely manner</li>
            <li>Respect tenant privacy</li>
            <li>Maintain accurate records of tenancy and payments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
