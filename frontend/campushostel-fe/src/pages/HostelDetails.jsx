import React, { useState, useEffect } from "react";
import {
  getHostelById,
  getUnitsByPropertyId,
} from "../services/HostelServices";
import { useParams } from "react-router-dom";
import { SkeletonCard } from "../components/SkeletonCard";
import { Tile } from "../components/UnitTile";
import { resolveImageUrl } from "../utils/imageUrl";
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
import { GetPropertyRatings } from "../services/OtherServices";

export default function HostelDetails() {
  const [selectedHostel, setSelectedHostel] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { id: routeId } = useParams();
  const hostelId = Number(routeId);
  useEffect(() => {
    async function fetchHostelDetails() {
      setLoading(true);
      try {
        const response = await getHostelById(hostelId);
        setSelectedHostel(response);
      } catch (error) {
        console.warn("Error fetching hostel details:", error);
        setError("Failed to load hostel details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchHostelDetails();
    localStorage.removeItem("tenancy");
  }, [hostelId]);

  useEffect(() => {
    async function fetchUnits() {
      try {
        const response = await getUnitsByPropertyId(hostelId);
        setUnits(response);
      } catch (error) {
        console.warn("Error fetching hostel units:", error);
        setError("Failed to load hostel units. Please try again later.");
      }
    }
    fetchUnits();
  }, [hostelId]);

  React.useEffect(() => {
    if (!selectedHostel?.id) return;

    async function fetchReviews() {
      try {
        const data = await GetPropertyRatings(selectedHostel.id);
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }

    fetchReviews();
  }, [selectedHostel?.id]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-2 sm:gap-5 sm:px-6 sm:py-12 lg:grid-cols-3 lg:gap-6 lg:px-8 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-1 flex-col bg-secondary-light-gray">
        {/* Main Content */}
        <main className="flex-grow">
          {/* Header Section */}
          <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 border-b border-slate-200 bg-white/95 backdrop-blur md:top-16">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => window.history.back()}
                  className="flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-ink hover:bg-slate-100"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  onClick={() =>
                    document
                      .querySelector("[data-rooms-section]")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="min-h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-slate-800 active:scale-95"
                >
                  Book now
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="mx-4 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6 lg:mx-8">
              {error}
            </p>
          )}
          {!selectedHostel && <p className="p-6 text-secondary-gray">No hostel found.</p>}

          {selectedHostel?.imageUrl && (
            <div className="relative aspect-[16/10] max-h-[440px] w-full overflow-hidden bg-slate-200 sm:aspect-[21/9]">
              <img
                src={resolveImageUrl(selectedHostel.imageUrl)}
                alt={selectedHostel.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent"></div>
            </div>
          )}

          {/* Property Header Info */}
          {selectedHostel && (
            <div className={`relative border-b border-slate-200 bg-white ${selectedHostel.imageUrl ? "-mt-6 rounded-t-[2rem] sm:mt-0 sm:rounded-none" : ""}`}>
              <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Name and Location */}
                <div className="mb-6">
                  <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-ink capitalize sm:text-4xl">
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
                          {reviews.length || "12"} reviews
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
                {selectedHostel.amenities &&
                  selectedHostel.amenities.length > 0 && (
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
                      {selectedHostel.amenities.includes("parking") && (
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
            className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {units?.map((unit) => (
                <Tile key={unit.id} hostel={selectedHostel} unit={unit} />
              ))}
            </div>
          </section>

          {/* Reviews Section */}
          <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          Based on {reviews.length || "12"} reviews
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
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-primary-teal bg-white px-6 text-sm font-semibold text-primary-teal hover:bg-teal-50"
              >
                <MessageSquare size={18} />
                Leave a review
              </button>
            </div>

            {/* Reviews List */}
            {reviews && reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review, idx) => (
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
                  className="min-h-12 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-slate-800"
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-4xl animate-sheet-up overflow-y-auto rounded-t-[2rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-float sm:rounded-[2rem] sm:p-8"
          >
            <ReviewHostelPage
              hostel={selectedHostel}
              reviews={reviews}
              onClose={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
