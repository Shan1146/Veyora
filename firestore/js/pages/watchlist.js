import { auth, db } from "../firebase/config.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    getWatchlist,
    updateWatchlistItem,
    removeFromWatchlist
} from "../firebase/firestore.js";

const grid = document.querySelector("#libraryGrid");
const statusEl = document.querySelector("#libraryStatus");
const statsEl = document.querySelector("#stats");
let user = null;
let typeFilter = "all";
let statusFilter = "all";

document.querySelectorAll("#typeTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#typeTabs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        typeFilter = btn.dataset.type;
        loadLibrary();
    });
});

document.querySelectorAll("#statusTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#statusTabs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        statusFilter = btn.dataset.status;
        loadLibrary();
    });
});

onAuthStateChanged(auth, async currentUser => {
    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }
    user = currentUser;
    await loadLibrary();
});

async function loadLibrary() {
    if (!user) return;
    statusEl.textContent = "Loading your library...";
    grid.innerHTML = "";

    try {
        const all = await getWatchlist(db, user.uid);
        renderStats(all);

        let items = all;
        if (typeFilter !== "all") items = items.filter(i => i.type === typeFilter);
        if (statusFilter === "favorites") items = items.filter(i => i.favorite);
        else if (statusFilter !== "all") items = items.filter(i => i.status === statusFilter);

        statusEl.textContent = `${items.length} title${items.length === 1 ? "" : "s"}`;

        if (!items.length) {
            grid.innerHTML = `
                <div class="empty-library">
                    <div class="empty-icon">📚</div>
                    <h2>Your library is empty here</h2>
                    <p>Search for anime, K-dramas, or movies and add them to your library.</p>
                    <a class="primary-link" href="search.html">Search titles</a>
                </div>`;
            return;
        }

        items.forEach(renderCard);
    } catch (error) {
        console.error(error);
        statusEl.textContent = "Couldn't load your library.";
        grid.innerHTML = `<div class="empty-library"><h2>Something went wrong</h2><p>${escapeHtml(error.message)}</p></div>`;
    }
}

function renderStats(items) {
    const anime = items.filter(i => i.type === "anime").length;
    const drama = items.filter(i => i.type === "tv").length;
    const movies = items.filter(i => i.type === "movie").length;
    const completed = items.filter(i => i.status === "completed").length;
    const favorites = items.filter(i => i.favorite).length;

    statsEl.innerHTML = `
        <div><strong>${items.length}</strong><span>Total</span></div>
        <div><strong>${anime}</strong><span>Anime</span></div>
        <div><strong>${drama}</strong><span>K-Dramas</span></div>
        <div><strong>${movies}</strong><span>Movies</span></div>
        <div><strong>${completed}</strong><span>Completed</span></div>
        <div><strong>${favorites}</strong><span>Favorites</span></div>
    `;
}

function renderCard(item) {
    const card = document.createElement("article");
    card.className = "library-card";
    card.innerHTML = `
        <img src="${escapeAttr(item.poster || "assets/images/default-poster.svg")}" alt="${escapeAttr(item.title)} poster" loading="lazy">
        <div class="library-card-body">
            <span class="type-pill">${typeLabel(item.type)}</span>
            <h2>${escapeHtml(item.title)}</h2>
            <label>Status
                <select class="status-select">
                    ${option("watching", item.status, "Watching")}
                    ${option("completed", item.status, "Completed")}
                    ${option("plan_to_watch", item.status, "Plan to Watch")}
                    ${option("on_hold", item.status, "On Hold")}
                    ${option("dropped", item.status, "Dropped")}
                </select>
            </label>
            <label>Progress
                <input class="progress-input" type="number" min="0" value="${Number(item.progress || 0)}">
            </label>
            <label>Rating
                <select class="rating-select">
                    <option value="">No rating</option>
                    ${[1,2,3,4,5].map(n => `<option value="${n}" ${Number(item.rating) === n ? "selected" : ""}>${"★".repeat(n)}</option>`).join("")}
                </select>
            </label>
            <div class="card-actions">
                <button class="favorite-btn ${item.favorite ? "selected" : ""}" title="Favorite">${item.favorite ? "❤️" : "♡"}</button>
                <button class="save-btn">Save</button>
                <button class="remove-btn">Remove</button>
            </div>
        </div>
    `;

    const statusSelect = card.querySelector(".status-select");
    const progressInput = card.querySelector(".progress-input");
    const ratingSelect = card.querySelector(".rating-select");
    const favoriteBtn = card.querySelector(".favorite-btn");

    favoriteBtn.addEventListener("click", () => {
        favoriteBtn.classList.toggle("selected");
        favoriteBtn.textContent = favoriteBtn.classList.contains("selected") ? "❤️" : "♡";
    });

    card.querySelector(".save-btn").addEventListener("click", async () => {
        const button = card.querySelector(".save-btn");
        button.disabled = true;
        button.textContent = "Saving...";
        try {
            await updateWatchlistItem(db, user.uid, item.id, {
                status: statusSelect.value,
                progress: Math.max(0, Number(progressInput.value || 0)),
                rating: ratingSelect.value ? Number(ratingSelect.value) : null,
                favorite: favoriteBtn.classList.contains("selected")
            });
            button.textContent = "Saved ✓";
            setTimeout(() => {
                button.textContent = "Save";
                button.disabled = false;
            }, 900);
        } catch (error) {
            console.error(error);
            button.textContent = "Failed";
            button.disabled = false;
        }
    });

    card.querySelector(".remove-btn").addEventListener("click", async () => {
        if (!confirm(`Remove "${item.title}" from your library?`)) return;
        try {
            await removeFromWatchlist(db, user.uid, item.id);
            card.remove();
            await loadLibrary();
        } catch (error) {
            console.error(error);
            alert("Could not remove this title.");
        }
    });

    grid.appendChild(card);
}

function option(value, current, label) {
    return `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
}
function typeLabel(type) {
    return type === "anime" ? "🎌 Anime" : type === "movie" ? "🎬 Movie" : "🇰🇷 K-Drama";
}
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function escapeAttr(value) { return escapeHtml(value); }
