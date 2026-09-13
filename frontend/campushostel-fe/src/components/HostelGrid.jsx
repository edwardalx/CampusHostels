/**
 * HostelGrid Component
 *
 * Responsive grid layout for displaying multiple hostel cards.
 * Includes loading states and empty states.
 *
 * Props:
 * - hostels: HostelCard[] - Array of hostel data objects
 * - isLoading: boolean - Show loading skeleton cards
 * - isEmpty: boolean - Show empty state message
 * - onCardAction: { onLike, onViewDetails } - Callback handlers
 */

import React from "react";
import HostelCard from "./HostelCard";
import { SkeletonCard } from "./SkeletonCard";

export default function HostelGrid({
  hostels = [],
  isLoading = false,
  isEmpty = false,
  userLikedHostels = [],
  onCardAction = {
    onLike: () => {},
    onViewDetails: () => {},
    onToggleReviewForm: () => {},
  },
}) {
  //  const handleViewDetails = () => {
  //   localStorage.setItem("selectedHostel", hostel);
  //   navigate(`/hostel/${hostel.id}`);
  // };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-16 px-4">
        <h3 className="text-xl sm:text-2xl font-bold text-secondary-dark-gray mb-2">
          No hostels found
        </h3>
        <p className="text-secondary-gray">
          Try adjusting your search filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {hostels.map((hostel) => (
        <HostelCard
          key={hostel.id}
          hostel={hostel}
          onLike={onCardAction.onLike}
          onViewDetails={onCardAction.onViewDetails}
          onToggleReviewForm={onCardAction.onToggleReviewForm}
          userLikedHostels={userLikedHostels}
        />
      ))}
    </div>
  );
}
