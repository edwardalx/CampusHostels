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

import React, { useState, useCallback } from 'react';
import { Header, HeroSection, SearchBar, HostelGrid, Footer } from '../components';

// Mock hostel data
const MOCK_HOSTELS = [
  {
    id: 1,
    name: 'Talbot Bridge House',
    location: 'Location',
    price: 15,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
    tag: 'Student Favorite',
    isFavorite: false,
  },
  {
    id: 2,
    name: 'Koo Bonsu Inn',
    location: 'London',
    price: 15,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1455849318169-8d29a90db1c5?w=400&h=300&fit=crop',
    tag: 'Party Friendly',
    isFavorite: false,
  },
  {
    id: 3,
    name: 'The Social Hub',
    location: 'Location',
    price: 15,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=300&fit=crop',
    tag: 'Student Favorite',
    isFavorite: false,
  },
  {
    id: 4,
    name: 'Campus Vibes',
    location: 'London',
    price: 20,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    tag: 'Party Friendly',
    isFavorite: false,
  },
  {
    id: 5,
    name: 'The Social Hub',
    location: 'Location',
    price: 20,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1512235099567-e47a9e7da5e4?w=400&h=300&fit=crop',
    tag: null,
    isFavorite: false,
  },
  {
    id: 6,
    name: 'Koo Bonsu Inn',
    location: 'Koo Bonsu',
    price: 10,
    rating: 4.1,
    image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=400&h=300&fit=crop',
    tag: 'Party Friendly',
    isFavorite: false,
  },
  {
    id: 7,
    name: 'Campus Vibes',
    location: 'Location',
    price: 10,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=400&h=300&fit=crop',
    tag: 'Student Favorite',
    isFavorite: false,
  },
  {
    id: 8,
    name: 'Campus Vibes',
    location: 'Riar Bonsu',
    price: 20,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop',
    tag: 'Party Friendly',
    isFavorite: false,
  },
];

export default function HomePage() {
  const [hostels, setHostels] = useState(MOCK_HOSTELS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeNavLink, setActiveNavLink] = useState('HOME');
  const [filteredHostels, setFilteredHostels] = useState(MOCK_HOSTELS);

  // Handle search filters
  const handleSearch = useCallback((filters) => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      let results = MOCK_HOSTELS;

      // Filter by location
      if (filters.location) {
        results = results.filter(h =>
          h.location.toLowerCase().includes(filters.location.toLowerCase()) ||
          h.name.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      // Filter by price (parse and compare)
      if (filters.price) {
        const maxPrice = parseInt(filters.price) || Infinity;
        results = results.filter(h => h.price <= maxPrice);
      }

      setFilteredHostels(results);
      setIsLoading(false);
    }, 600);
  }, []);

  // Handle hostel like/favorite
  const handleHostelLike = useCallback((hostelId, isFavorite) => {
    setFilteredHostels(prev =>
      prev.map(h =>
        h.id === hostelId ? { ...h, isFavorite } : h
      )
    );
  }, []);

  // Handle view details
  const handleViewDetails = useCallback((hostelId) => {
    const hostel = filteredHostels.find(h => h.id === hostelId);
    console.log('View details for:', hostel);
    // Navigate to detail page: navigate(`/hostel/${hostelId}`)
  }, [filteredHostels]);

  // Handle filter button click
  const handleFilterClick = () => {
    console.log('Open filter modal');
    // Implement filter modal here
  };

  // Handle navigation
  const handleNavClick = (link) => {
    setActiveNavLink(link);
    console.log('Navigate to:', link);
    // Implement routing: navigate(`/${link.toLowerCase()}`)
  };

  // Handle auth
  const handleLogin = () => {
    console.log('Navigate to login');
    // navigate('/login')
  };

  const handleSignUp = () => {
    console.log('Navigate to sign up');
    // navigate('/signup')
  };

  // Handle footer links
  const handleFooterLink = (link) => {
    console.log('Footer link clicked:', link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary-light-gray">
      {/* Header */}
      <Header
        activeLink={activeNavLink}
        onNavClick={handleNavClick}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
      />

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
              <span className="text-primary-teal">EXPLORE</span>
              {' '}
              <span className="text-primary-coral">HOSTELS & CO-LIVING</span>
            </h2>
            <p className="text-secondary-gray text-sm sm:text-base">
              {filteredHostels.length} properties available
            </p>
          </div>

          {/* Grid */}
          <HostelGrid
            hostels={filteredHostels}
            isLoading={isLoading}
            isEmpty={filteredHostels.length === 0}
            onCardAction={{
              onLike: handleHostelLike,
              onViewDetails: handleViewDetails,
            }}
          />
        </section>
      </main>

      {/* Footer */}
      <Footer
        links={['Home', 'About', 'Company', 'Links', 'Contact']}
        onLinkClick={handleFooterLink}
        socials={[
          { id: 'facebook', icon: 'facebook', url: 'https://facebook.com' },
          { id: 'instagram', icon: 'instagram', url: 'https://instagram.com' },
          { id: 'youtube', icon: 'youtube', url: 'https://youtube.com' },
        ]}
      />
    </div>
  );
}
