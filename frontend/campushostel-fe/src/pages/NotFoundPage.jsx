import React from "react";
import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-secondary-light-gray px-5 py-16 text-center">
      <div className="mb-6 rounded-full bg-teal-50 p-5">
        <SearchX className="w-10 h-10 text-primary-teal" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="btn-primary"
      >
        <Home size={18} />
        Back to Home
      </Link>
    </div>
  );
}
