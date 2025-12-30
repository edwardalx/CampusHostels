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
import { useNavigate, useParams } from "react-router-dom";


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
  onViewDetails = () => {},
}) {
  const [isFavorite, setIsFavorite] = useState(hostel.isFavorite);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onLike(hostel.id, !isFavorite);
  };
  const navigate = useNavigate();
  const handleViewDetails = () => {
    localStorage.setItem("selectedHostel", JSON.stringify(hostel.id));
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
        <img
          src={hostel.imageUrl}
          alt={hostel.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Tag Badge */}
        {hostel.tag && (
          <div
            className={`absolute top-3 left-3 ${getTagColor(
              hostel.tag
            )} text-white text-xs sm:text-sm font-medium px-3 py-1 rounded-full`}
          >
            {hostel.tag}
          </div>
        )}

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
        <h3 className="text-base sm:text-lg font-bold text-secondary-dark-gray mb-1 line-clamp-1">
          {hostel.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-secondary-gray text-sm mb-3">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="line-clamp-1">{hostel.location}</span>
        </div>

        {/* Rating and Price Row */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={`${
                  i < Math.floor(hostel.rating)
                    ? "fill-accent-gold text-accent-gold"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-xs text-secondary-gray ml-1">
              {hostel.rating}
            </span>
          </div>
        </div>

        {/* Price and Button Row */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-gray-200">
          <div className="flex">
            <p className="text-xs text-secondary-gray">From</p>
              GH₵{hostel.startingPrice} 
            <p className="text-base sm:text-lg font-bold text-secondary-dark-gray">
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
