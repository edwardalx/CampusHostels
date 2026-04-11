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
}) {
  const [isFavorite, setIsFavorite] = useState(hostel.isFavorite);
  const handleLike = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onLike(hostel.id, !isFavorite);
  };
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
  const handleRateClick = (e) => {
    e.stopPropagation();
    onToggleReviewForm(true, hostel);
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
          onClick={handleLike}
          className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={`transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      {/* Content Container */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        {/* Name */}
        <h3 className="text-base sm:text-lg font-bold !text-gray-600 mb-1 line-clamp-1">
          {hostel.name}
        </h3>

        {/* Location */}
        <div className="flex justify-between">
          <div className="flex items-center gap-1 !text-gray-600 text-sm mb-3">
            <MapPin size={16} className="flex-shrink-0" />
            <span className="line-clamp-1 ">{hostel.location}</span>
          </div>
          <div className="cursor-pointer text-xs mb-3 font-bold bg-gradient-to-r from-yellow-400 to-teal-600 bg-clip-text text-transparent">
            <span
              className="line-clamp-1"
              onClick={handleRateClick}
            >
              Rate Us
            </span>
          </div>
        </div>

        {/* Rating and Price Row */}
        <ShowRate hostel={hostel} isReviews={false} />
        {/* <div className="flex items-center justify-between mb-4 gap-2">
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
            <span className="text-xs text-gray-600 ml-1">{hostel.rating}</span>
          </div>
          <div className="text-xs font-bold bg-gradient-to-r from-teal-400 to-yellow-600 bg-clip-text text-transparent">
            <p>Overall Rating: {hostel.rating}</p>
          </div>
        </div> */}

        {/* Price and Button Row */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-gray-400">
          <div className="flex text-teal-400">
            <p className="text-xs text-gray-600">From: </p>
            GH₵{hostel.startingPrice}
            <p className="text-base sm:text-lg font-bold text-gray-600">
              <span className="text-xs font-normal">/Month</span>
            </p>
          </div>
          <button
            // onClick={() => onViewDetails(hostel.id)}
            onClick={handleViewDetails}
            style={{
              backgroundColor: "#06B6D4",
              color: "white",
            }}
            className="px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-full hover:opacity-90 transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
