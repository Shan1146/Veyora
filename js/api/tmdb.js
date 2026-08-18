const TMDB_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZjQ1NDQxYmYyZTc5Y2ExMmE0Zjk1YTFkYzU0NTFjMyIsIm5iZiI6MTc4Njk3NzMxMC4yMzcsInN1YiI6IjZhODMxYzFlMTA2YzgwNjI3Nzk1ODFlMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.UBMLp4FKHWViofdTT145UwXpnFhMvk9D5EdUjaPc20Q";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

async function request(path, params = {}) {
  if (TMDB_ACCESS_TOKEN === "YOUR_TMDB_ACCESS_TOKEN") {
    throw new Error("Add your TMDB Bearer token in js/api/tmdb.js first.");
  }
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k,v]) => v !== "" && v != null && url.searchParams.set(k,v));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`, accept: "application/json" }
  });
  if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
  return res.json();
}

export async function searchMovies(query) {
  return request("/search/movie", { query, include_adult:"false", language:"en-US", page:1 });
}

export async function searchTV(query) {
  return request("/search/tv", { query, language:"en-US", page:1 });
}

export const poster = path => path ? IMG + path : "assets/images/default-poster.svg";

export async function trendingTMDB(mediaType = "all") {
  return request(`/trending/${mediaType}/week`, { language:"en-US" });
}
export async function popularTMDB(mediaType = "movie") {
  return request(`/${mediaType}/popular`, { language:"en-US", page:1 });
}
