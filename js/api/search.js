import { searchAnime, animePoster } from "./jikan.js";
import { searchTMDB, tmdbPoster } from "./tmdb.js";

export async function searchAll(query, category = "all") {
    const tasks = [];

    if (category === "all" || category === "anime") {
        tasks.push(
            searchAnime(query).then(data =>
                (data.data || []).map(item => ({
                    source: "jikan",
                    externalId: item.mal_id,
                    type: "anime",
                    title: item.title,
                    year: item.year || item.aired?.from?.slice(0, 4) || "",
                    rating: item.score,
                    poster: animePoster(item),
                    description: item.synopsis || ""
                }))
            )
        );
    }

    if (category === "all" || category === "movie") {
        tasks.push(
            searchTMDB(query, "movie").then(data =>
                (data.results || []).map(item => ({
                    source: "tmdb",
                    externalId: item.id,
                    type: "movie",
                    title: item.title,
                    year: item.release_date?.slice(0, 4) || "",
                    rating: item.vote_average,
                    poster: tmdbPoster(item.poster_path),
                    description: item.overview || ""
                }))
            )
        );
    }

    if (category === "all" || category === "tv" || category === "drama") {
        tasks.push(
            searchTMDB(query, "tv").then(data =>
                (data.results || []).map(item => ({
                    source: "tmdb",
                    externalId: item.id,
                    type: "tv",
                    title: item.name,
                    year: item.first_air_date?.slice(0, 4) || "",
                    rating: item.vote_average,
                    poster: tmdbPoster(item.poster_path),
                    description: item.overview || ""
                }))
            )
        );
    }

    const groups = await Promise.all(tasks);
    return groups.flat();
}
