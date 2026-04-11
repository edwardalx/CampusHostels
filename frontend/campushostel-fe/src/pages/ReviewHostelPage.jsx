import React from "react";
import { ShowRate, SetRate } from "../components/RateReview/Rate";
import {
  GetPropertyRatings,
  submitRatingReview,
} from "../services/OtherServices";
import { getHostelById } from "../services/HostelServices";
import { X } from "lucide-react";

export function ReviewHostelPage({ hostel, onClose = () => {} }) {
  const [reviews, setReviews] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [selectedRating, setSelectedRating] = React.useState(0);
  const [storedHostel, setStoredHostel] = React.useState(
    sessionStorage.getItem("storedHostelId")
      ? JSON.parse(sessionStorage.getItem("storedHostelId"))
      : hostel,
  );

  React.useEffect(() => {
    if (!storedHostel?.id || !hostel?.id) return;

    async function fetchReviews() {
      try {
        const data = await GetPropertyRatings(storedHostel.id || hostel.id);
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }

    fetchReviews();
  }, [storedHostel?.id, hostel?.id]);

  React.useEffect(() => {
    async function fetchHostel() {
      try {
        const data = await getHostelById(storedHostel.id || hostel.id);
        // Update hostel's average rating if needed
        if (data) {
          hostel = data;
        }
      } catch (error) {
        console.error("Error fetching hostel details:", error);
      }
    }
    fetchHostel();
  }, [reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const payload = {
      score:
        formData.get("Rate") ||
        JSON.parse(sessionStorage.getItem("selectedRating")),
      comment: formData.get("Comment"),
    };

    try {
      const result = await submitRatingReview(payload, hostel.id);
      setMessage(result.message || "Review submitted successfully!");
      const updated = await GetPropertyRatings(hostel.id);
      setReviews(updated);

      e.target.reset();
    } catch (error) {
      console.error(error);
    }
  };

  if (!hostel) return null;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* LEFT: Reviews */}
      <div className="space-y-4">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-bold">{hostel.name}</h2>
          <p className="text-sm opacity-90">
            Overall Rating: {hostel.averageRating ?? 0}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="bg-gray-50 rounded-xl p-4 border max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 mb-3">Latest Reviews</h3>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">
              No reviews yet. Be the first to rate this hostel ⭐
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-3 rounded-lg shadow-sm mb-3 border-l-4 border-teal-400"
              >
                <p className="text-gray-700 text-sm">
                  {review.comment || "No comment provided"}
                </p>

                <div className="mt-2">
                  <ShowRate hostel={review} isReviews={true} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Review Form */}
      <form
        onSubmit={handleSubmitReview}
        className="space-y-4 bg-white rounded-xl p-5 shadow-lg border"
      >
        <h3 className="text-lg font-bold text-gray-700">Leave a Review</h3>

        {/* Rating */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Your Rating
          </label>
          <div className="mt-2">
            <SetRate
              hostel={hostel}
              onSetRating={setSelectedRating}
              selectedRating={selectedRating}
            />
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium text-gray-600">Comment</label>

          <textarea
            name="Comment"
            rows="4"
            className="w-full mt-2 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 text-gray-700"
            placeholder="Share your experience..."
          />
        </div>
        {message && <div className="text-green-500 text-xs">{message}</div>}

        {/* Button */}
        <button
          type="submit"
          className={`w-full ${selectedRating > 0 ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-gray-400'} text-white font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition`}
        >
          Submit Review
        </button>
      </form>
      <button
        onClick={onClose}
        className="absolute top-3 right-4 p-2 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl transition-all"
      >
        <X size={18} className="text-gray-700" />
      </button>
    </div>
  );
}
