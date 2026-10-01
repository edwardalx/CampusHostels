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
import { HeroSection, HostelGrid, Footer } from "../components";
import { SkeletonCard } from "../components/SkeletonCard";
import { ReviewHostelPage } from "./ReviewHostelPage";
import { PrivateRoute } from "../components/ProtectedRoute";
import { Info } from "lucide-react";
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
    <div className="flex flex-1 flex-col bg-secondary-light-gray">
      <main className="flex-grow">
        <HeroSection
          eyebrow={storeUser?.fname ? `Hi ${storeUser.fname} 👋` : ""}
          title="Find your perfect student home"
          subtitle="Browse verified hostels and co-living spaces near campus."
        />

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3 sm:mb-8">
            <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Available properties
            </h2>
            {!isLoading && (
              <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-primary-teal-dark sm:text-sm">
                {hostels.length} {hostels.length === 1 ? "listing" : "listings"}
              </span>
            )}
          </div>

          {!storeUser && errorMessage && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            >
              <Info size={18} className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
        </section>

        {showReviewForm && selectedHostel && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={handleCloseReviewPage}
          >
            <div
              className="relative max-h-[92vh] w-full max-w-4xl animate-sheet-up overflow-y-auto rounded-t-[2rem] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-float sm:rounded-[2rem] sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
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
