/**
 * HomePage Component
 *
 * Full-page composition of Header, HeroSection, SearchBar, HostelGrid, and Footer.
 * Includes mock data, state management, and responsive design.
 *
 * Features:
 * - Responsive layout (mobile, tablet, desktop)
 * - Mock hostel data for preview
 * - Search functionality (ready for API integration)
 * - Like/favorite toggle
 * - Loading and empty states
 * - Accessibility compliant
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHostels } from "../services/HostelServices";
import {
  getLikedHostels,
  likeProperty,
  unlikeProperty,
} from "../services/AuthServices";
import { HeroSection, SearchBar, HostelGrid, Footer } from "../components";
import { SkeletonCard } from "../components/SkeletonCard";
import { ReviewHostelPage } from "./ReviewHostelPage";
import { PrivateRoute } from "../components/ProtectedRoute";
import { Heart, Info } from "lucide-react";
import { AuthContext } from "../zu-store/AuthContextInstance";
import { useContext } from "react";

export default function HomePage() {
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(
    JSON.parse(sessionStorage.getItem("storedHostelId")) || null,
  );
  const { storeUser, setStoreUser } = useContext(AuthContext);
  // Hydrate from sessionStorage at init time (not in a post-mount effect) so
  // there's no extra render just to restore a previously-open review modal.
  const [showReviewForm, setShowReviewForm] = React.useState(() => {
    const storedValue = sessionStorage.getItem("showReviewForm");
    return storedValue !== null ? storedValue === "true" : false;
  });
  const [userLikedHostels, setUserLikedHostels] = useState([]);
  const [likeStatus, setLikeStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  let links = ["Home", "About", "Contact"];
  const navigate = useNavigate();
  //fetch hostels once on mount
  useEffect(() => {
    async function fetchHostels() {
      try {
        const response = await getHostels();
        setHostels(response);
        setIsEmpty(response.length === 0);
      } catch (error) {
        console.warn("Error fetching hostels:", error);
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHostels();
    localStorage.removeItem("tenancy");
  }, []);

  useEffect(() => {
    sessionStorage.setItem("showReviewForm", showReviewForm);
  }, [showReviewForm]);

  useEffect(() => {
    async function fetchLikedHostels() {
      if (!storeUser?.tenantId) {
        setUserLikedHostels([]);
        return;
      }
      try {
        const likedHostels = await getLikedHostels(storeUser.tenantId);
        setUserLikedHostels(likedHostels.likedHostelIds);
      } catch (error) {
        console.error("Error fetching liked hostels:", error);
      }
    }

    fetchLikedHostels();
  }, [likeStatus, storeUser]);

  // Handle footer links
  const handleFooterLink = (link) => {
    if (link === "Home") {
      navigate(`/`);
      console.log("Navigating to Home");
    }
    if (link === "About") {
      navigate("/about");
    }
    if (link === "Contact") {
      navigate("/contact");
    }
  };
  const handleCloseReviewPage = () => {
    setShowReviewForm(false);
    setSelectedHostel(null);
    sessionStorage.clear();
  };
  const handleLike = async (hostel) => {
    if (!storeUser && likeStatus) {
      setErrorMessage("");
      console.log("Like status is true, resetting to false");
      setLikeStatus(false);
      return;
    }
    if (!storeUser && !likeStatus) {
      setErrorMessage("Please login to like a property.");
      console.warn("User not logged in. Cannot like hostel.");
      setLikeStatus(!likeStatus);
      return;
    }

    const payload = {
      propertyId: hostel.id,
      tenantId: storeUser.tenantId,
    };

    try {
      if (userLikedHostels.includes(hostel.id)) {
        await unlikeProperty(payload);
      } else {
        await likeProperty(payload);
      }

      setLikeStatus((prev) => !prev);
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };
  useEffect(() => {
    setStoreUser(
      localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null,
    );
  }, [selectedHostel, showReviewForm]);

  return (
    <div className="flex flex-col min-h-screen bg-secondary-light-gray">
      {/* Header */}

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section with Search Bar */}
        <HeroSection
          title="EXPLORE HOSTELS & CO-LIVING"
          subtitle="Find your perfect student accommodation"
        >
          {/* <SearchBar
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
          /> */}
        </HeroSection>

        {/* Hostel Grid Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Section Subtitle with Property Count */}
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Section */}
              <div className="flex items-center justify-between gap-3 w-full">
                {/* Spans */}
                <div className="flex justify-between w-full">
                  <span className="inline-flex items-center bg-secondary-light-gray px-3 py-1.5 rounded-full text-sm font-bold text-secondary-dark-gray">
                    {!isLoading && "Available properties"}
                  </span>
                  {/* Error Message */}
                  {!storeUser && errorMessage && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                      <Info size={16} />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  <span className="inline-flex items-center bg-teal-50 px-3 py-1.5 rounded-full text-sm font-semibold text-teal-700">
                    {!isLoading && `${hostels.length} Listings`}
                  </span>
                </div>
              </div>

              {/* Right Section */}
              {storeUser && (
                <p className="text-secondary-gray text-sm">
                  Welcome,{" "}
                  <span className="font-bold text-gray-900">
                    {storeUser.fname}
                  </span>
                  !
                </p>
              )}
            </div>
          </div>
          {/* Grid */}
          {!isLoading ? (
            <HostelGrid
              hostels={hostels}
              isLoading={isLoading}
              isEmpty={isEmpty}
              userLikedHostels={userLikedHostels}
              onCardAction={{
                onLike: (hostel) => {
                  handleLike(hostel);
                },
                onToggleReviewForm: (value, hostel) => {
                  setShowReviewForm(value);
                  setSelectedHostel(hostel);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
        </section>
        {showReviewForm && selectedHostel && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleCloseReviewPage}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* <button
                onClick={() => {
                  setShowReviewForm(false);
                  setSelectedHostel(null);
                }}
                className="absolute top-4 right-4 text-2xl font-bold bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                ×
              </button> */}
              <PrivateRoute>
                <ReviewHostelPage
                  hostel={selectedHostel}
                  onClose={handleCloseReviewPage}
                />
              </PrivateRoute>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        links={links}
        onLinkClick={handleFooterLink}
        socials={[
          { id: "facebook", icon: "facebook", url: "https://facebook.com" },
          { id: "instagram", icon: "instagram", url: "https://instagram.com" },
          { id: "youtube", icon: "youtube", url: "https://youtube.com" },
        ]}
      />
    </div>
  );
}
