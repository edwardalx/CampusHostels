import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";

export function Tile({ hostel ={}, unit ={} }) {
  const { hostelId, roomId } = useParams();
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/payments/hostel/${hostel.id}/room/${unit.id}`);
  };
  const handleTouch = (e) => {
    localStorage.setItem("selectedRoom", JSON.stringify(unit));
  };

  const handleRightClick = () => {
    localStorage.setItem("selectedRoom", JSON.stringify(unit));
  };
  return (
    <div>
      <Link
        to={`/payments/hostel/${hostel.id}/room/${unit.id}`}
        className="tile"
        onTouchStart={handleTouch}
        onContextMenu={handleRightClick}
      >
        <div className="transition-all duration-500 rounded-lg shadow-md overflow-hidden flex flex-col  size:full  hover:translate-x-2 hover:shadow-xl">
          <img
            src={unit.imageUrl}
            alt={unit.id}
            className="m-auto w-full h-full object-contain"
          />
        </div>
        <div className="p-.5 flex flex-col gap-.5">
          <p className="text-xs text-gray-600 font-bold">Room{unit.id}</p>
          <div className="flex items-center justify-between gap-3 m-4">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[rgba(1,1,1,.06)] border border-blue-200 text-sm">
              <span>💷</span> <span>£{unit.cost}</span>
            </div>
            <div
              onClick={handleClick}
              className="ml-auto text-sm bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded"
              aria-label={`Buy ${unit.id}`}
            >
              Pay
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
