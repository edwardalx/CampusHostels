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
import { Heart } from "lucide-react";
import { AuthContext } from "../zu-store/AuthContext";
import { useContext } from "react";

export default function HomePage() {
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(
    JSON.parse(sessionStorage.getItem("storedHostelId")) || null,
  );
  // const [rating, setRating] = useState(0);
  const { storeUser, setStoreUser } = useContext(AuthContext);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [userLikedHostels, setUserLikedHostels] = useState([]);
  const [likeStatus, setLikeStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
    if (!storeUser?.tenantId) {
      setUserLikedHostels([]);
      return;
    }

    const fetchLikedHostels = async () => {
      const likedHostels = await getLikedHostels(storeUser.tenantId);
      setUserLikedHostels(likedHostels.likedHostelIds);
    };

    fetchLikedHostels();
  }, [likeStatus, storeUser]);

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
                    <div className="flex items-center gap-1 text-sm text-teal-600">
                      <Heart
                        size={16}
                        className="fill-green-500 text-green-500"
                      />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  <span className="inline-flex items-center bg-gray-300 px-3 py-1.5 rounded-full text-sm font-semibold text-secondary-dark-gray">
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
