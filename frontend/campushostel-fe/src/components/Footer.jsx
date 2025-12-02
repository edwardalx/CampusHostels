/**
 * Footer Component
 * 
 * Footer with navigation links and social media icons.
 * 
 * Props:
 * - links: string[] - Footer link labels
 * - onLinkClick: (link: string) => void - Called when a link is clicked
 * - socials: { icon: Component, url: string }[] - Social media links
 */

import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

export default function Footer({ 
  links = ['Home', 'About', 'Company', 'Links', 'Contact'],
  onLinkClick = () => {},
  socials = [
    { id: 'facebook', icon: 'facebook', url: 'https://facebook.com' },
    { id: 'instagram', icon: 'instagram', url: 'https://instagram.com' },
    { id: 'youtube', icon: 'youtube', url: 'https://youtube.com' },
  ]
}) {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-8">
          
          {/* Links Section */}
          <nav className="flex flex-wrap gap-6 sm:gap-8">
            {links.map((link) => (
              <button
                key={link}
                onClick={() => onLinkClick(link)}
                className="text-secondary-dark-gray text-sm font-medium hover:text-primary-teal transition-colors"
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socials.map((social) => {
              const IconComponent = socialIcons[social.icon];
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-gray hover:text-primary-teal transition-colors"
                  aria-label={social.id}
                >
                  {IconComponent && <IconComponent size={20} />}
                </a>
              );
            })}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-secondary-gray text-sm">
            &copy; 2025 CampusHostels. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
