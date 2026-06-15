import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function Tile2({ hostel = {}, unit = {} }) {
  const navigate = useNavigate();

  const goToPayment = () => {
    if (unit.availability) {
      localStorage.setItem("selectedRoom", JSON.stringify(unit));
      navigate(`/payments/hostel/${hostel.id}/room/${unit.id}`);
    }
  };

  const handlePayClick = (e) => {
    e.stopPropagation();
    goToPayment();
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
    <div
      onClick={unit.availability ? goToPayment : undefined}
      className={`bg-white rounded-2xl overflow-hidden shadow-md flex flex-col h-full ${
        unit.availability ? "cursor-pointer transition-all duration-500 hover:translate-x-1 hover:shadow-lg" : ""
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-video sm:aspect-square overflow-hidden">
        {unit.imageUrl && (
          <img
            src={unit.imageUrl}
            alt={`Room ${unit.id}`}
            className={`absolute inset-0 w-full h-full object-cover ${
              !unit.availability ? "opacity-50 grayscale" : ""
            }`}
          />
        )}

        {/* Status Badge - Top Right */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold ${status.color}`}>
          {status.label}
        </div>

        {!unit.availability && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AlertCircle size={32} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 sm:p-6 space-y-4 flex flex-col flex-grow">
        {/* Room Info */}
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Room {unit.id || unit.roomNumber} — {unit.roomType || "Single ensuite"}
          </p>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">
            GH₵{unit.cost}
          </span>
          <span className="text-sm text-gray-600 font-medium">/year</span>
        </div>

        {/* Button */}
        <div className="mt-auto">
          {unit.availability ? (
            <button
              onClick={handlePayClick}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors duration-200 bg-primary-teal text-white hover:bg-teal-600 active:bg-teal-700"
            >
              Book room
            </button>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-center bg-gray-100 text-gray-500">
              Not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
