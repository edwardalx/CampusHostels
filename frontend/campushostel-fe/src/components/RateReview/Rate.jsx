import React from "react";
import { Star } from "lucide-react";

export function ShowRate({ hostel, isReviews }) {
  const rating = hostel?.score ?? hostel?.averageRating ?? 0;

  return (
    <div>
      {" "}
      {/* Rating and Price Row */}
      <div className="flex items-center justify-left  gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              //   onClick={() => handleRatingClick(i + 1)}
              className={`cursor-pointer ${
                i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <div className="text-xs font-bold bg-gradient-to-r from-teal-400 to-yellow-600 bg-clip-text text-transparent">
          {!isReviews ? (
            <p> {hostel.averageRating}</p>
          ) : (
            <p>Rating: {hostel.score}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SetRate({ hostel, onSetRating = () => {}, selectedRating }) {
  const handleRatingClick = (rating) => {
    onSetRating(rating);
    console.log("Selected rating:", rating);
    sessionStorage.setItem("selectedRating", rating);
  };
  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              onClick={() => handleRatingClick(i + 1)}
              className={`cursor-pointer ${
                i < selectedRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-xs text-gray-600 ml-1">{selectedRating}</span>
        </div>
        <div className="text-xs font-bold bg-gradient-to-r from-teal-400 to-yellow-600 bg-clip-text text-transparent">
          <p>Overall Rating: {hostel.averageRating}</p>
        </div>
      </div>
    </>
  );
}
