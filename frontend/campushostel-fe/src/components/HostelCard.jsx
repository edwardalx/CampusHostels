/**
 * HostelCard Component
 *
 * Individual hostel card with image, info, rating, tag, and action buttons.
 *
 * Props:
 * - hostel: {
 *     id: number,
 *     name: string,
 *     location: string,
 *     price: number,
 *     rating: number,
 *     image: string,
 *     tag: 'Student Favorite' | 'Party Friendly' | null,
 *     isFavorite: boolean
 *   }
 * - onLike: (id: number, isFavorite: boolean) => void
 * - onViewDetails: (id: number) => void
 */

import React, { useState } from "react";
import { Heart, MapPin, Star } from "lucide-react";
import { redirect, useNavigate, useParams, Link } from "react-router-dom";
import { ShowRate } from "./RateReview/Rate";
import { ReviewHostelPage } from "../pages/ReviewHostelPage";
import { likeProperty, unlikeProperty } from "../services/AuthServices";

export default function HostelCard({
  hostel = {
    id: 1,
    name: "Hostel Name",
    location: "Location",
    price: 15,
    rating: 4.5,
    imageUrl:
      "http://images.campushostels.duckdns.org/campus-hostels/rooms/Room11.jpeg",
    tag: "Student Favorite",
    isFavorite: false,
  },
  onLike = () => {},
  onToggleReviewForm = () => {},
  userLikedHostels,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  // const handleLike = (e) => {
  //   e.stopPropagation();
  //   // setIsFavorite(!isFavorite);
  //   // onLike(hostel.id, !isFavorite);
  //   const payload = {
  //     propertyId: hostel.id,
  //     tenantId: JSON.parse(localStorage.getItem("user")).tenantId,
  //   };
  //   if (isFavorite || userLikedHostels.includes(hostel.id)) {
  //     try {
  //       unlikeProperty(payload);
  //     } catch (error) {
  //       console.error("Error unliking property:", error);
  //     }
  //   } else {
  //     try {
  //       likeProperty(payload);
  //     } catch (error) {
  //       console.error("Error liking property:", error);
  //     }
  //   }
  // };

  const navigate = useNavigate();
  const handleViewDetails = () => {
    // localStorage.setItem("selectedHostel", JSON.stringify(hostel.id));
    navigate(`/hostel/${hostel.id}`);
  };
  const getTagColor = (tag) => {
    if (tag === "Student Favorite") return "bg-cyan-500";
    if (tag === "Party Friendly") return "bg-purple-500";
    return "bg-gray-400";
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-yellow-400";
    if (rating >= 4) return "text-yellow-400";
    return "text-yellow-300";
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-video sm:aspect-square">
        <Link to={`/hostel/${hostel.id}`}>
          <img
            src={hostel.imageUrl}
            alt={hostel.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        {/* Tag Badge */}
        {/* {hostel.tag && (
          <div
            className={`absolute top-3 left-3 ${getTagColor(
              hostel.tag,
            )} text-white text-xs sm:text-sm font-medium px-3 py-1 rounded-full`}
          >
            {hostel.tag}
          </div>
        )} */}

        {/* Like Button */}
        <button
          onClick={() => onLike(hostel)}
          className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={`transition-colors ${
              userLikedHostels?.includes(hostel.id)
                ? "fill-red-500 text-red-500"
                : "text-gray-400"
            }`}
          />
        </button>
      </div>

      {/* Content Container */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        {/* Name */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {hostel.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-4">
          <MapPin size={16} className="flex-shrink-0 text-teal-500" />
          <span className="line-clamp-1">{hostel.location}</span>
        </div>

        {/* Price and Button Row */}
        <div className="flex items-center justify-between  mt-auto pt-5 border-t border-gray-200">
          <div className="flex flex-col">
            {/* Rating Section */}
            {hostel.averageRating > 0 ? (
              <ShowRate hostel={hostel} isReviews={false} />
            ) : (
              <p className="italic text-gray-600 text-sm">
                No ratings available
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-l font-bold text-gray-900">
                GH₵{hostel.startingPrice}
              </span>
              <span className="text-sm text-gray-600 font-medium">/month</span>
            </div>
          </div>
          <button
            onClick={handleViewDetails}
            className="!border !border-black px-5 py-2 m-2 bg-primary-teal text-white text-sm font-semibold rounded-full hover:bg-teal-500 transition-colors duration-200 whitespace-nowrap shadow-sm hover:shadow-md flex-shrink-0"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
