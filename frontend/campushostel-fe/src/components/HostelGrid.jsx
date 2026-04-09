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

import React from 'react';
import HostelCard from './HostelCard';
import {SkeletonCard}  from './SkeletonCard';

// const SkeletonCard = () => (
//   <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse flex flex-col h-full">
//     <div className="aspect-video sm:aspect-square bg-gray-300"></div>
//     <div className="p-4 sm:p-5 space-y-3">
//       <div className="h-4 bg-gray-300 rounded w-3/4"></div>
//       <div className="h-3 bg-gray-300 rounded w-1/2"></div>
//       <div className="h-3 bg-gray-300 rounded w-1/3"></div>
//     </div>
//   </div>
// );

export default function HostelGrid({ 
  hostels = [],
  isLoading = false,
  isEmpty = false,
  onCardAction = {
    onLike: () => {},
    onViewDetails: () => {},
  }
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
        />
      ))}
    </div>
  );
}
