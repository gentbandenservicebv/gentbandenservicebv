import { cacheLife, cacheTag } from "next/cache";

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number; // Unix timestamp
  relative_time_description: string;
  profile_photo_url: string;
  author_url: string;
}

export interface PlaceReviewsResult {
  reviews: GoogleReview[];
  rating: number;        // aggregate e.g. 4.9
  user_ratings_total: number; // total review count
  name: string;          // business name
  url: string;           // Google Maps URL
}

/**
 * Fetches Google Place details (reviews + aggregate) via the Places API (legacy).
 * Cached for 24 hours via `use cache` / `cacheLife('days')`.
 */
export async function fetchGoogleReviews(): Promise<PlaceReviewsResult | null> {
  "use cache";
  cacheLife("days");
  cacheTag("google-reviews");

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error("[google-reviews] Missing GOOGLE_MAPS_API_KEY or GOOGLE_PLACE_ID");
    return null;
  }

  const fields = [
    "name",
    "rating",
    "user_ratings_total",
    "reviews",
    "url",
  ].join(",");

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&language=nl` +
    `&reviews_sort=newest` +
    `&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[google-reviews] HTTP error", res.status);
      return null;
    }

    const json = await res.json();

    if (json.status !== "OK") {
      console.error("[google-reviews] Places API error:", json.status, json.error_message);
      return null;
    }

    const result = json.result;

    return {
      reviews: (result.reviews ?? []) as GoogleReview[],
      rating: result.rating ?? 0,
      user_ratings_total: result.user_ratings_total ?? 0,
      name: result.name ?? "Gent Bandenservice BV",
      url: result.url ?? "https://maps.google.com",
    };
  } catch (err) {
    console.error("[google-reviews] fetch failed:", err);
    return null;
  }
}

