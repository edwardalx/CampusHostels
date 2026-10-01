// Image URLs are stored in the database as absolute addresses from whichever
// environment uploaded them (live host, images.* host, localhost:5080...), or as
// bare "/campus-hostels/<category>/<file>" paths. Re-base them on this
// environment's image host so they resolve wherever the app is running.
const imageBaseUrl = (
  import.meta.env.VITE_IMAGE_BASE_URL ?? "https://campushostels.duckdns.org/image-service"
).replace(/\/$/, "");

const storagePrefix = "/campus-hostels/";

// Older images live on the legacy image server, which nginx serves under /image-files/. The new
// image server (/image-service/) does not hold them, so those URLs must be used exactly as stored.
const legacyPrefix = "/image-files/";

export function resolveImageUrl(url) {
  if (!url) return url;
  if (url.includes(legacyPrefix)) return url;
  const index = url.indexOf(storagePrefix);
  if (index === -1) return url;
  return `${imageBaseUrl}${url.slice(index)}`;
}
