// VEYORA Anime API
// Jikan can occasionally return 502/503/504. We retry it and fall back to AniList.

const JIKAN_BASE = "https://api.jikan.moe/v4";
const ANILIST_URL = "https://graphql.anilist.co";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function jikanRequest(path, params = {}, attempts = 3) {
  const url = new URL(JIKAN_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) url.searchParams.set(k, v);
  });

  let lastError;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url);

      if (res.ok) return await res.json();

      // Retry temporary server/rate-limit errors.
      if ([429, 500, 502, 503, 504].includes(res.status)) {
        lastError = new Error(`Jikan temporary error (${res.status})`);
        await sleep(700 * (attempt + 1));
        continue;
      }

      throw new Error(`Jikan request failed (${res.status})`);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await sleep(700 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("Jikan request failed");
}

async function aniListSearch(query) {
  const gql = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: ANIME, isAdult: false) {
          id
          title { romaji english native }
          coverImage { large medium }
          seasonYear
          averageScore
          description(asHtml: false)
          episodes
        }
      }
    }
  `;

  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query: gql,
      variables: { search: query }
    })
  });

  if (!res.ok) {
    throw new Error(`Anime search temporarily unavailable (${res.status})`);
  }

  const json = await res.json();

  return (json.data?.Page?.media || []).map(a => ({
    mal_id: `anilist-${a.id}`,
    title: a.title?.english || a.title?.romaji || a.title?.native || "Unknown title",
    year: a.seasonYear || null,
    score: a.averageScore ? a.averageScore / 10 : null,
    synopsis: a.description || "",
    episodes: a.episodes || null,
    images: {
      jpg: {
        large_image_url: a.coverImage?.large,
        image_url: a.coverImage?.medium
      }
    }
  }));
}

export async function searchAnime(query) {
  try {
    const data = await jikanRequest("/anime", {
      q: query,
      limit: 20,
      sfw: true
    });

    return data;
  } catch (jikanError) {
    console.warn("Jikan failed; using AniList fallback:", jikanError);

    const fallback = await aniListSearch(query);

    return { data: fallback };
  }
}

export const poster = anime =>
  anime?.images?.jpg?.large_image_url ||
  anime?.images?.jpg?.image_url ||
  "assets/images/default-poster.svg";

export async function discoverAnime(kind = "popular") {
  const path = kind === "airing" ? "/top/anime" : "/top/anime";
  return jikanRequest(path, { limit: 12, filter: kind === "airing" ? "airing" : "bypopularity", sfw:true });
}
