/**
 * SearchBar Component
 * 
 * Horizontal search bar with Location, Dates, Guests, Filters inputs and Search button.
 * 
 * Props:
 * - onSearch: (filters) => void - Called when Search button clicked
 * - onFilterClick: () => void - Called when Filters button clicked
 * - placeholder: { location, dates, guests } - Placeholder texts
 */

import React, { useState } from 'react';
import { MapPin, Calendar, Users, Settings, Search } from 'lucide-react';

export default function SearchBar({ 
  onSearch = () => {}, 
  onFilterClick = () => {},
  placeholder = {
    location: 'Location',
    dates: 'Dates',
    guests: 'Guests'
  }
}) {
  const [filters, setFilters] = useState({
    location: '',
    dates: '',
    guests: '',
  });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-4xl mx-auto">
      
      {/* Location Input */}
      <div className="flex items-center gap-2 px-3 py-2 sm:flex-1">
        <MapPin size={20} className="text-secondary-gray flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder.location}
          value={filters.location}
          onChange={(e) => handleChange('location', e.target.value)}
          className="w-full bg-transparent text-sm sm:text-base outline-none text-secondary-dark-gray placeholder-secondary-gray"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

      {/* Dates Input */}
      <div className="flex items-center gap-2 px-3 py-2 sm:flex-1">
        <Calendar size={20} className="text-secondary-gray flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder.dates}
          value={filters.dates}
          onChange={(e) => handleChange('dates', e.target.value)}
          className="w-full bg-transparent text-sm sm:text-base outline-none text-secondary-dark-gray placeholder-secondary-gray"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

      {/* Guests Input */}
      <div className="flex items-center gap-2 px-3 py-2 sm:flex-1">
        <Users size={20} className="text-secondary-gray flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder.guests}
          value={filters.guests}
          onChange={(e) => handleChange('guests', e.target.value)}
          className="w-full bg-transparent text-sm sm:text-base outline-none text-secondary-dark-gray placeholder-secondary-gray"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

      {/* Filters Button */}
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center gap-2 px-4 py-2 text-secondary-dark-gray hover:bg-secondary-light-gray rounded-lg transition-colors flex-shrink-0"
        aria-label="Open filters"
      >
        <Settings size={20} />
        <span className="hidden sm:inline text-sm font-medium">Filters</span>
      </button>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-orange text-white rounded-full hover:bg-orange-600 transition-colors font-medium flex-shrink-0 whitespace-nowrap"
      >
        <Search size={20} />
        <span className="hidden sm:inline text-sm">Search</span>
      </button>
    </div>
  );
}
