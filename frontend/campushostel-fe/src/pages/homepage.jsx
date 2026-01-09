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

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHostels } from "../services/HostelServices";
import { HeroSection, SearchBar, HostelGrid, Footer } from "../components";

export default function HomePage() {
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [filteredHostels, setFilteredHostels] = useState([]);
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
    } catch (error) {
      console.warn("Error fetching hostels:", error);
      setIsEmpty(true);
    } 
    // finally {
    //   if (hostels.length > 0) {
    //     setIsLoading(false);
    //   }
    //   setTimeout(() => {
    //     setIsLoading(false);
    //   }, 600);
    // }
  }, []);

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
            h.name.toLowerCase().includes(filters.location.toLowerCase())
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
      prev.map((h) => (h.id === hostelId ? { ...h, isFavorite } : h))
    );
  }, []);

  // Handle view details
  const handleViewDetails = useCallback(
    (hostelId) => {
      const hostel = filteredHostels.find((h) => h.id === hostelId);
      console.log("View details for:", hostel);
      // Navigate to detail page: navigate(`/hostel/${hostelId}`)
    },
    [filteredHostels]
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
    console.log("Footer link clicked:", link);
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
          <SearchBar
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
          />
        </HeroSection>

        {/* Hostel Grid Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Section Title */}
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-dark-gray mb-2">
              <span className="text-primary-teal">EXPLORE</span>{" "}
              <span className="text-primary-coral">HOSTELS & CO-LIVING</span>
            </h2>
            <p className="text-secondary-gray text-sm sm:text-base">
              {hostels.length} properties available
            </p>
          </div>

          {/* Grid */}
          {hostels.length > 0 && (
            <HostelGrid
              hostels={hostels}
              isLoading={isLoading}
              isEmpty={isEmpty}
              onCardAction={{
                onLike: handleHostelLike,
                onViewDetails: handleViewDetails,
              }}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer
        links={["Home", "About", "Company", "Links", "Contact"]}
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
