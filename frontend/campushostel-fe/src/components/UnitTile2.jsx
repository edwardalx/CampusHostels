import { useNavigate } from "react-router-dom";

export function Tile2({ hostel = {}, unit = {} }) {
  const navigate = useNavigate();

  const goToPayment = () => {
    localStorage.setItem("selectedRoom", JSON.stringify(unit));
    navigate(`/payments/hostel/${hostel.id}/room/${unit.id}`);
  };

  const handlePayClick = (e) => {
    e.stopPropagation(); // prevent card click
    goToPayment();
  };

  return (
    <div
      onClick={goToPayment}
      onContextMenu={(e) => {
        e.preventDefault();
        localStorage.setItem("selectedRoom", JSON.stringify(unit));
      }}
      className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col h-full cursor-pointer transition-all duration-500 hover:translate-x-2 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative aspect-video sm:aspect-square overflow-hidden">
        {unit.imageUrl && (
          <img
            src={unit.imageUrl}
            alt={`Room ${unit.id}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">
          Room {unit.id}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-[rgba(1,1,1,.06)] border border-blue-200 text-sm">
            <span>💷</span>
            <span>£{unit.cost}</span>
          </div>

          <button
            onClick={handlePayClick}
            className="text-sm bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}
