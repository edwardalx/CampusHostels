/**
 * HostelCard Component
 *
 * Property card: image with favourite button and rating chip, name, location and price.
 *
 * Props:
 * - hostel: { id, name, location, startingPrice, averageRating, imageUrl }
 * - onLike: (hostel) => void
 * - userLikedHostels: number[] - ids the signed-in user has favourited
 */

import { useState } from "react";
import { Heart, Home, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveImageUrl } from "../utils/imageUrl";

export default function HostelCard({
  hostel = {
    id: 1,
    name: "Hostel Name",
    location: "Location",
    startingPrice: 0,
    averageRating: 0,
    imageUrl: "",
  },
  onLike = () => {},
  userLikedHostels = [],
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLiked = userLikedHostels?.includes(hostel.id);
  const imageSrc = resolveImageUrl(hostel.imageUrl);
  const hasRating = hostel.averageRating > 0;

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link to={`/hostel/${hostel.id}`} className="block h-full" aria-label={`View ${hostel.name}`}>
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={hostel.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-hero-gradient">
              <Home size={40} className="text-white/60" aria-hidden="true" />
            </div>
          )}
        </Link>

        {hasRating && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur">
            <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
            {Number(hostel.averageRating).toFixed(1)}
          </span>
        )}

        <button
          type="button"
          onClick={() => onLike(hostel)}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur transition-transform active:scale-90"
        >
          <Heart
            size={20}
            className={isLiked ? "fill-primary-orange text-primary-orange" : "text-slate-400"}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <h3 className="line-clamp-2 text-lg leading-snug font-bold text-ink capitalize">
            <Link to={`/hostel/${hostel.id}`}>{hostel.name}</Link>
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-secondary-gray">
            <MapPin size={15} className="shrink-0 text-primary-teal" aria-hidden="true" />
            <span className="line-clamp-1">{hostel.location}</span>
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-secondary-gray uppercase">From</p>
            <p className="text-xl leading-none font-extrabold text-ink">
              GH₵{hostel.startingPrice}
              <span className="ml-1 text-sm font-medium text-secondary-gray">/month</span>
            </p>
            {!hasRating && <p className="mt-1 text-xs text-secondary-gray italic">No ratings yet</p>}
          </div>
          <Link
            to={`/hostel/${hostel.id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:scale-95"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
