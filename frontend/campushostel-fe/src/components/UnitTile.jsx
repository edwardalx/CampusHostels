import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";

export function Tile({ hostel = {}, unit = {} }) {
  const { hostelId, roomId } = useParams();
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/payments/hostel/${hostel.id}/room/${unit.id}`);
  };
  // const handleTouch = (e) => {
  //   localStorage.setItem("selectedRoom", JSON.stringify(unit));
  // };

  // const handleRightClick = () => {
  //   localStorage.setItem("selectedRoom", JSON.stringify(unit));
  // };
  return (
    <div>
      <Link
        to={`${unit.availability ? `/payments/hostel/${hostel.id}/room/${unit.id}` : ""}`}
        className="tile block bg-white rounded-2xl overflow-hidden shadow-md h-full cursor-pointer"
        // onTouchStart={handleTouch}
        // onContextMenu={handleRightClick}
      >
        <div className="relative transition-all duration-500 rounded-lg overflow-hidden h-58 hover:translate-x-2 hover:shadow-xl">
          <img
            src={unit.imageUrl}
            alt={unit.id}
            className={`w-full h-full object-cover transition-all duration-500 ${
              !unit.availability ? "opacity-60 grayscale" : ""
            }`}
          />

          {!unit.availability && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm text-white font-semibold px-4 py-2 rounded-lg shadow-lg">
                Currently Unavailable
              </div>
            </div>
          )}
        </div>
        <div className="relative p-.5 flex flex-col gap-.5">
          <p className="text-xs text-gray-600 font-bold">
            Room{unit.roomNumber}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[rgba(1,1,1,.06)] border border-blue-200 text-sm">
              <span>💷</span>
              <span>GH₵{unit.cost}</span>
            </div>
            <div className="flex justify-center text-xs bg-green-500/50 text-green-700 w-[110px] px-2 py-1 rounded">
              {unit.bedsLeft === 1 && (
                <span className="">
                  Almost sold out
                </span>
              )}
            </div>
            <button
              onClick={handleClick}
              disabled={!unit.availability}
              className={`text-sm ${unit.availability ? "bg-pink-500" : "bg-gray-400 cursor-not-allowed opacity-60"} hover:bg-pink-600 text-white px-3 py-1 rounded`}
            >
              Pay
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
