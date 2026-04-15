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

import React, { useState, useCallback, useEffect, use } from "react";
import { Await, useNavigate, useParams } from "react-router-dom";
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

export default function HomePage() {
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(
    JSON.parse(sessionStorage.getItem("storedHostelId")) || null,
  );
  // const [rating, setRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [userLikedHostels, setUserLikedHostels] = useState([]);
  const [likeStatus, setLikeStatus] = useState(false);
  const storeUser = JSON.parse(localStorage.getItem("user"));
  let links = ["Home", "About", "Contact"];
  const navigate = useNavigate();
  //fetch hostels
  useEffect(() => {
    try {
      setIsLoading(true);
      const fetchHostels = async () => {
        const response = await getHostels();
        if (response.length > 0) {
          setHostels(response);
          setIsLoading(false);
        }
      };
      fetchHostels();
      // localStorage.clear();
    } catch (error) {
      console.warn("Error fetching hostels:", error);
      setIsEmpty(true);
    }
    localStorage.removeItem("tenancy");
    // finally {
    //   if (hostels.length > 0) {
    //     setIsLoading(false);
    //   }
    //   setTimeout(() => {
    //     setIsLoading(false);
    //   }, 600);
    // }
  }, [showReviewForm]);
  const updateReviewForm = (value) => {
    setShowReviewForm(value);
    sessionStorage.setItem("showReviewForm", value);
  };
  useEffect(() => {
    const storedValue = sessionStorage.getItem("showReviewForm");
    if (storedValue !== null) {
      updateReviewForm(storedValue === "true");
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("showReviewForm", showReviewForm);
  }, [showReviewForm]);

  useEffect(() => {
    console.log("selectedHostel:", selectedHostel);
    console.log("showReviewForm:", showReviewForm);
  }, [selectedHostel, showReviewForm]);

  useEffect(() => {
    const fetchLikedHostels = async () => {
      if (storeUser && storeUser.tenantId) {
        try {
          const likedHostels = await getLikedHostels(storeUser.tenantId);
          setUserLikedHostels(likedHostels.likedHostelIds);
        } catch (error) {
          console.error("Error fetching liked hostels:", error);
        }
      }
    };

    fetchLikedHostels();
  }, [likeStatus]);

  // Handle search filters
  const handleSearch = useCallback((filters) => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      let results = hostels;

      // Filter by location
      if (filters.location) {
        results = results.filter(
          (h) =>
            h.location.toLowerCase().includes(filters.location.toLowerCase()) ||
            h.name.toLowerCase().includes(filters.location.toLowerCase()),
        );
      }

      // Filter by price (parse and compare)
      if (filters.price) {
        const maxPrice = parseInt(filters.price) || Infinity;
        results = results.filter((h) => h.price <= maxPrice);
      }

      setFilteredHostels(results);
      setIsLoading(false);
    }, 600);
  }, []);

  // Handle hostel like/favorite
  const handleHostelLike = useCallback((hostelId, isFavorite) => {
    setFilteredHostels((prev) =>
      prev.map((h) => (h.id === hostelId ? { ...h, isFavorite } : h)),
    );
  }, []);

  // Handle view details
  const handleViewDetails = useCallback(
    (hostelId) => {
      const hostel = filteredHostels.find((h) => h.id === hostelId);
      console.log("View details for:", hostel);
      // Navigate to detail page: navigate(`/hostel/${hostelId}`)
    },
    [filteredHostels],
  );

  // Handle filter button click
  const handleFilterClick = () => {
    console.log("Open filter modal");
    // Implement filter modal here
  };

  // Handle navigation
  const handleNavClick = (link) => {
    setActiveNavLink(link);
    console.log("Navigate to:", link);
    if (link === "HOME") {
      navigate(`/`);
    }
    if (link === "HISTORY") {
      navigate(`/payment-history`);
    }
    if (link === "TENANCY") {
      navigate(`/tenancy`);
    }
    // Implement routing: navigate(`/${link.toLowerCase()}`)
  };

  // Handle auth
  // const handleLogin = () => {
  //   console.log("Navigate to login");
  //   navigate("/login");
  // };

  // const handleSignUp = () => {
  //   console.log("Navigate to sign up");
  //   navigate("/register");
  // };

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
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

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
          {/* Section Title */}
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-dark-gray mb-2">
              <span className="text-primary-teal">EXPLORE</span>{" "}
              <span className="text-primary-coral">HOSTELS & CO-LIVING</span>
            </h2>
            <div className="flex flex-row items-center justify-between">
              <p className="text-secondary-gray text-sm sm:text-base">
                {!isLoading ? hostels.length : ""} Properties available
              </p>
              <h4 className="text-secondary-gray text-sm sm:text-base ml-auto">
                {storeUser ? (
                  <>
                    Welcome,{" "}
                    {<span className="font-bold">{storeUser.fname}</span>}{" "}
                    !{" "}
                  </>
                ) : (
                  ""
                )}
                {/* Welcome,{" "}{storeUser ? storeUser.fname : "Guest"}! */}
              </h4>
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
                onViewDetails: handleViewDetails,
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
