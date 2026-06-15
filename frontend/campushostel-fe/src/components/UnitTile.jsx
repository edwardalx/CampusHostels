import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function Tile({ hostel = {}, unit = {} }) {
  const { hostelId, roomId } = useParams();
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (unit.availability) {
      navigate(`/payments/hostel/${hostel.id}/room/${unit.id}`);
    }
  };

  // Determine status based on availability and beds left
  const getStatusBadge = () => {
    if (!unit.availability) {
      return { label: "Taken", color: "bg-gray-200 text-gray-700" };
    }
    if (unit.bedsLeft === 1) {
      return { label: "Almost sold out", color: "bg-amber-100 text-amber-700" };
    }
    return { label: "Available", color: "bg-teal-100 text-teal-700" };
  };

  const status = getStatusBadge();

  return (
    <div>
      <div
        onClick={unit.availability ? handleClick : undefined}
        className={`block bg-white rounded-2xl overflow-hidden shadow-md h-full ${
          unit.availability
            ? "cursor-pointer hover:shadow-lg transition-shadow"
            : ""
        }`}
      >
        {/* Image Container */}
        <div className="relative transition-all duration-500 rounded-lg overflow-hidden aspect-video sm:aspect-square">
          <img
            src={unit.imageUrl}
            alt={`Room ${unit.id}`}
            className={`w-full h-full object-cover transition-all duration-500 ${
              !unit.availability ? "opacity-50 grayscale" : ""
            }`}
          />

          {/* Status Badge - Top Right */}
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold ${status.color}`}
          >
            {status.label}
          </div>

          {!unit.availability && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle size={32} className="text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1">
          {/* Room Type/Number */}
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Room {unit.roomNumber || unit.id} —{" "}
              {unit.roomType || "Single ensuite"}
            </p>
          </div>

          {/* Price Section */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
              GH₵{unit.cost}
            </span>
            <span className="text-sm text-gray-600 font-medium">/year</span>
          </div>

          {/* Bottom Section */}
          <div className="mt-auto flex items-center justify-between pt-5">
            {/* Status Pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                !unit.availability
                  ? "bg-gray-100 text-gray-700"
                  : unit.bedsLeft === 1
                    ? "bg-amber-100 text-amber-700"
                    : "bg-teal-100 text-teal-700"
              }`}
            >
              {!unit.availability
                ? "Taken"
                : unit.bedsLeft === 1
                  ? "Almost sold out"
                  : "Available"}
            </span>

            {/* CTA Button */}
            <button
              onClick={handleClick}
              disabled={!unit.availability}
              className={`px-6 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                unit.availability
                  ? "border-gray-300 bg-gray-300 text-gray-900 hover:border-teal-500 hover:text-teal-600 hover:shadow-sm"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Book room ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
