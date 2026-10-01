// Image URLs are stored in the database as absolute addresses from whichever
// environment uploaded them (live host, images.* host, localhost:5080...), or as
// bare "/campus-hostels/<category>/<file>" paths. Re-base them on this
// environment's image host so they resolve wherever the app is running.
const imageBaseUrl = (
  import.meta.env.VITE_IMAGE_BASE_URL ?? "https://campushostels.duckdns.org/image-service"
).replace(/\/$/, "");

const storagePrefix = "/campus-hostels/";

export function resolveImageUrl(url) {
  if (!url) return url;
  const index = url.indexOf(storagePrefix);
  if (index === -1) return url;
  return `${imageBaseUrl}${url.slice(index)}`;
}
