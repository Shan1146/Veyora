// VEYORA - TMDB API
// Add your TMDB Bearer token locally before testing.
// Do NOT commit a real token to a public repository.

const TMDB_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCIdIkpXVCJ9.eyJuYmYiOjE0ODM1NzM4MzUsInZlcnNpb24iOjEsInN1YiI6IjRiYzg4OTJhMDE3YTNjMGY5MjAwMDAwMiIsImF1ZCI6IlNmODc4NTdiZTIwOWQzNTE5ODMzYjMwMGExM2QwZTEyIiwic2NvcGVzIjpbImFwaV9yZWFkIiwiYXBpX3dyaXRlIl0sImp0aSI6Ijg4In0.b76OiEs10gdp9oNOoGpBJ94nO9Zi17Y7SvAXJQW8nH2";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";

async function tmdbRequest(path, params = {}) {
    if (!TMDB_ACCESS_TOKEN || TMDB_ACCESS_TOKEN === "YOUR_TMDB_ACCESS_TOKEN") {
        throw new Error("TMDB API token is not configured.");
    }

    const url = new URL(`${TMDB_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status}`);
    }

    return response.json();
}

export async function searchTMDB(query, type = "multi") {
    const endpoint = type === "movie" ? "/search/movie"
        : type === "tv" ? "/search/tv"
        : "/search/multi";

    return tmdbRequest(endpoint, {
        query,
        include_adult: "false",
        language: "en-US",
        page: 1
    });
}

export async function getTMDBDetails(id, type) {
    const endpoint = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
    return tmdbRequest(endpoint, {
        append_to_response: "credits,genres",
        language: "en-US"
    });
}

export function tmdbPoster(path) {
    return path ? `${TMDB_IMAGE_URL}${path}` : "../assets/images/default-poster.svg";
}

export function tmdbBackdrop(path) {
    return path ? `${TMDB_BACKDROP_URL}${path}` : "";
}
