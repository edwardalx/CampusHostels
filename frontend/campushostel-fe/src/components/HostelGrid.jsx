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
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="card mx-auto max-w-md px-6 py-14 text-center">
        <h3 className="mb-2 text-xl font-bold text-ink sm:text-2xl">
          No hostels found
        </h3>
        <p className="text-secondary-gray">
          Try adjusting your search filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
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
