import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { addToWatchlist } from "../firebase/watchlist.js";
import { searchAnime, poster as animePoster } from "../api/jikan.js";
import { searchMovies, searchTV, poster as tmdbPoster } from "../api/tmdb.js";

let user = null, type = "all";
const form = document.querySelector("#searchForm");
const input = document.querySelector("#query");
const results = document.querySelector("#results");
const status = document.querySelector("#status");

onAuthStateChanged(auth, u => user = u);

document.querySelectorAll(".filters button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    type = btn.dataset.type;
    if (input.value.trim()) run();
  };
});

form.onsubmit = e => { e.preventDefault(); run(); };

async function run() {
  const q = input.value.trim();
  if (!q) return;
  results.innerHTML = "";
  status.textContent = "Searching...";

  try {
    let items = [];
    if (type === "all" || type === "anime") {
      try {
        const data = await searchAnime(q);
        items.push(...(data.data || []).map(a => ({
          source: String(a.mal_id).startsWith("anilist-") ? "anilist" : "jikan",
          externalId: a.mal_id,
          type:"anime",
          title:a.title,
          year:a.year || a.aired?.from?.slice(0,4) || "",
          rating:a.score,
          poster:animePoster(a),
          description:a.synopsis || ""
        })));
      } catch (animeError) {
        console.warn("Anime search unavailable:", animeError);
        status.textContent = "Anime search is temporarily unavailable. Trying the other categories...";
      }
    }
    if (type === "all" || type === "tv") {
      const data = await searchTV(q);
      items.push(...(data.results || []).map(t => ({
        source:"tmdb", externalId:t.id, type:"tv", title:t.name,
        year:t.first_air_date?.slice(0,4) || "", rating:t.vote_average,
        poster:tmdbPoster(t.poster_path), description:t.overview || ""
      })));
    }
    if (type === "all" || type === "movie") {
      const data = await searchMovies(q);
      items.push(...(data.results || []).map(m => ({
        source:"tmdb", externalId:m.id, type:"movie", title:m.title,
        year:m.release_date?.slice(0,4) || "", rating:m.vote_average,
        poster:tmdbPoster(m.poster_path), description:m.overview || ""
      })));
    }

    status.textContent = `${items.length} result${items.length === 1 ? "" : "s"} found`;
    if (!items.length) {
      results.innerHTML = "<div class='empty'>No results found.</div>";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${safe(item.poster)}" alt="${safe(item.title)}" loading="lazy">
        <div class="card-body">
          <span class="pill">${label(item.type)}</span>
          <h2>${safe(item.title)}</h2>
          <p>${safe(item.year || "Year unknown")} ${item.rating ? "• ⭐ " + Number(item.rating).toFixed(1) : ""}</p>
          <p class="desc">${safe(item.description || "No description available.")}</p>
          <button class="add">＋ Add to My Library</button>
        </div>`;
      card.querySelector(".add").onclick = async e => {
        if (!user) { location.href = "index.html"; return; }
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = "Saving...";
        try {
          const r = await addToWatchlist(db, user.uid, item);
          e.currentTarget.textContent = r.alreadyExists ? "✓ Already in Library" : "✓ Added";
        } catch(err) {
          console.error(err);
          e.currentTarget.disabled = false;
          e.currentTarget.textContent = "Try again";
          alert("Could not save to Firestore.\n\n" + (err?.code ? err.code + "\n" : "") + (err?.message || "Unknown error") + "\n\nOpen F12 → Console for the full error.");
        }
      };
      results.appendChild(card);
    });
  } catch(err) {
    console.error(err);
    status.textContent = "";
    results.innerHTML = `<div class="empty">${safe(err.message)}</div>`;
  }
}
function label(t) { return t==="anime"?"🎌 Anime":t==="movie"?"🎬 Movie":"🇰🇷 K-Drama"; }
function safe(v) { return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
