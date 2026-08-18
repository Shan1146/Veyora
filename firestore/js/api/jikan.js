// VEYORA - Jikan API
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

async function jikanRequest(path, params = {}) {
    const url = new URL(`${JIKAN_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Jikan request failed: ${response.status}`);
    }

    return response.json();
}

export async function searchAnime(query) {
    return jikanRequest("/anime", {
        q: query,
        limit: 20,
        sfw: true
    });
}

export async function getAnimeDetails(id) {
    return jikanRequest(`/anime/${id}/full`);
}

export function animePoster(anime) {
    return anime?.images?.jpg?.large_image_url
        || anime?.images?.jpg?.image_url
        || "../assets/images/default-poster.svg";
}
