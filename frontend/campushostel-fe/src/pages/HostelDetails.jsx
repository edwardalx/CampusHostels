import React, { use, useState, useEffect } from "react";
import {
  getHostelById,
  getUnitsByPropertyId,
} from "../services/HostelServices";
import { useNavigate, useParams } from "react-router-dom";
import { SkeletonCard } from "../components/SkeletonCard";
import { HeroSection } from "../components";
import { Tile } from "../components/UnitTile";
// import { Tile2 } from "../components/UnitTile2";
import {
  ArrowLeft,
  MapPin,
  Star,
  Wifi,
  Zap,
  Lock,
  ParkingCircle,
  MessageSquare,
} from "lucide-react";
import { ReviewHostelPage } from "./ReviewHostelPage";

export default function HostelDetails() {
  const [selectedHostel, setSelectedHostel] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { id: routeId } = useParams();
  // let storedHostel = JSON.parse(localStorage.getItem("selectedHostel"));
  const hostelId = Number(routeId);
  const selectedHostelNameUpper = selectedHostel.name
    ? selectedHostel.name.toUpperCase()
    : "";
  useEffect(() => {
    try {
      setLoading(true);

      const fetchHostelDetails = async () => {
        const response = await getHostelById(hostelId || storedHostel);
        setSelectedHostel(response);
      };
      fetchHostelDetails();
    } catch (error) {
      console.warn("Error fetching hostel details:", error);
      setError("Failed to load hostel details. Please try again later.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
    localStorage.removeItem("tenancy");
  }, [hostelId]);

  useEffect(() => {
    try {
      // storedHostel = JSON.parse(storedHostel);
      const fetchUnits = async () => {
        const response = await getUnitsByPropertyId(hostelId || storedHostel);
        setUnits(response);
      };
      fetchUnits();
    } catch (error) {
      console.warn("Error fetching hostel details:", error);
      setError("Failed to load hostel units. Please try again later.");
    }
  }, [hostelId]);
  console.log("units", units);
  console.log("selectedHostel", selectedHostel);
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col min-h-screen bg-secondary-light-gray">
        {/* Main Content */}
        <main className="flex-grow">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 text-primary-teal hover:text-teal-600 font-medium text-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  Back to listings
                </button>
                <button
                  onClick={() =>
                    document
                      .querySelector("[data-rooms-section]")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="px-6 py-2.5 bg-primary-teal text-white font-semibold rounded-full hover:bg-teal-600 transition-colors text-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {loading && <div>Loading hostel details...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!selectedHostel && <p>No hostel found.</p>}

          {/* Property Header Info */}
          {selectedHostel && (
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Name and Location */}
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {selectedHostel.name}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin size={18} className="text-teal-500" />
                    <span className="text-lg">{selectedHostel.location}</span>
                  </div>
                </div>

                {/* Rating, Reviews, and Availability */}
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    {selectedHostel.averageRating > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={`${
                                i < Math.floor(selectedHostel.averageRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {selectedHostel.averageRating?.toFixed(1) || "4.5"} ·{" "}
                          {selectedHostel.reviewCount || "12"} reviews
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No ratings yet
                      </span>
                    )}
                  </div>
                  <div className="inline-block bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold">
                    {units?.filter((u) => u.availability).length || 0} rooms
                    available
                  </div>
                </div>

                {/* Amenities */}
                {selectedHostel.amenities && selectedHostel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {selectedHostel.amenities.includes("wifi") && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm">
                        <Wifi size={16} />
                          <span>Free WiFi</span>
                        </div>
                      )}
                      {selectedHostel.amenities.includes("electricity") && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm">
                          <Zap size={16} />
                          <span>24h Electricity</span>
                        </div>
                      )}
                      {selectedHostel.amenities.includes("security") && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm">
                          <Lock size={16} />
                          <span>Security</span>
                        </div>
                      )}
                      {!selectedHostel.amenities.includes("parking") && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm">
                          <ParkingCircle size={16} />
                          <span>Parking</span>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Available Rooms Section */}
          <section
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            data-rooms-section
          >
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Available Rooms
              </h2>
              <p className="text-gray-600">
                Select a room and proceed to booking
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {units?.map((unit) => (
                <Tile key={unit.id} hostel={selectedHostel} unit={unit} />
              ))}
            </div>
          </section>

          {/* Reviews Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Reviews
                </h2>
                <div className="flex items-center gap-4">
                  {selectedHostel.averageRating > 0 ? (
                    <>
                      <div className="text-4xl font-bold text-gray-900">
                        {selectedHostel.averageRating?.toFixed(1) || "4.5"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={`${
                                i < Math.floor(selectedHostel.averageRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          Based on {selectedHostel.reviewCount || "12"} reviews
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">
                      No reviews yet. Be the first to review!
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 px-6 py-2.5 border-2 border-primary-teal text-primary-teal font-semibold rounded-full hover:bg-teal-50 transition-colors text-sm"
              >
                <MessageSquare size={18} />
                Leave a review
              </button>
            </div>

            {/* Reviews List */}
            {selectedHostel.reviews && selectedHostel.reviews.length > 0 ? (
              <div className="space-y-6">
                {selectedHostel.reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="pb-6 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {review.userName || "Anonymous"}
                          </span>
                          <span className="text-sm text-gray-600">
                            {review.date || "Recently"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={`${
                                i < (review.rating || 5)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment || ""}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare
                  size={48}
                  className="mx-auto text-gray-300 mb-4"
                />
                <p className="text-gray-600 mb-4">
                  No reviews yet. Be the first to share your experience!
                </p>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-2.5 bg-primary-teal text-white font-semibold rounded-full hover:bg-teal-600 transition-colors text-sm"
                >
                  Leave a review
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Review Modal */}
      {showReviewForm && (
        <div
          onClick={() => setShowReviewForm(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          >
            <ReviewHostelPage
              hostel={selectedHostel}
              onClose={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
