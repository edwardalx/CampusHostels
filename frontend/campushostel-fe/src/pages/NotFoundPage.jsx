import React from "react";
import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-grow min-h-[60vh] bg-secondary-light-gray px-4 py-16 text-center">
      <div className="bg-teal-50 p-4 rounded-full mb-6">
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
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-teal text-white font-semibold rounded-full hover:bg-teal-600 transition-colors"
      >
        <Home size={18} />
        Back to Home
      </Link>
    </div>
  );
}
