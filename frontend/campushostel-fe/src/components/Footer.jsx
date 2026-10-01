/**
 * Footer Component
 *
 * Footer with navigation links and social media icons.
 *
 * Props:
 * - links: string[] - Footer link labels
 * - onLinkClick: (link: string) => void - Called when a link is clicked
 * - socials: { id, icon, url }[] - Social media links
 */

import { Facebook, Instagram, Youtube } from "lucide-react";

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

export default function Footer({
  links = ["Home", "About", "Contact"],
  onLinkClick = () => {},
  socials = [
    { id: "facebook", icon: "facebook", url: "https://facebook.com" },
    { id: "instagram", icon: "instagram", url: "https://instagram.com" },
    { id: "youtube", icon: "youtube", url: "https://youtube.com" },
  ],
}) {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <button
                key={link}
                type="button"
                onClick={() => onLinkClick(link)}
                className="min-h-10 text-sm font-semibold text-secondary-gray hover:text-primary-teal"
              >
                {link}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {socials.map((social) => {
              const IconComponent = socialIcons[social.icon];
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-secondary-gray transition-colors hover:bg-teal-50 hover:text-primary-teal"
                  aria-label={social.id}
                >
                  {IconComponent && <IconComponent size={20} />}
                </a>
              );
            })}
          </div>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-secondary-gray">
          &copy; {new Date().getFullYear()} CampusHostels. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
