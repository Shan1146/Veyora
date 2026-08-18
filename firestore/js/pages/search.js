import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { addToWatchlist } from "../firebase/firestore.js";
import { searchAll } from "../api/search.js";

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const results = document.querySelector("#results");
const status = document.querySelector("#searchStatus");
const filters = document.querySelectorAll("[data-category]");

let category = "all";
let currentUser = null;

onAuthStateChanged(auth, user => { currentUser = user; });

filters.forEach(button => {
    button.addEventListener("click", () => {
        filters.forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        category = button.dataset.category;
        if (input.value.trim()) runSearch();
    });
});

form.addEventListener("submit", event => {
    event.preventDefault();
    runSearch();
});

async function runSearch() {
    const query = input.value.trim();
    if (!query) return;

    results.innerHTML = "";
    status.textContent = "Searching...";

    try {
        const items = await searchAll(query, category);
        status.textContent = `${items.length} result${items.length === 1 ? "" : "s"} found.`;

        if (!items.length) {
            results.innerHTML = "<p class='empty'>No results found.</p>";
            return;
        }

        items.forEach(item => {
            const card = document.createElement("article");
            card.className = "media-card";
            card.innerHTML = `
                <img src="${escapeAttr(item.poster)}" alt="${escapeAttr(item.title)} poster" loading="lazy">
                <div class="media-info">
                    <span class="badge">${escapeHtml(label(item.type))}</span>
                    <h2>${escapeHtml(item.title)}</h2>
                    <p>${escapeHtml(item.year || "Year unknown")} ${item.rating ? `• ⭐ ${Number(item.rating).toFixed(1)}` : ""}</p>
                    <p class="description">${escapeHtml(item.description || "No description available.")}</p>
                    <div class="card-buttons"><button class="details-btn">Details</button><button class="add-btn">+ Library</button></div>
                </div>
            `;

            card.querySelector(".details-btn").addEventListener("click", () => {
                const params = new URLSearchParams({
                    source: item.source,
                    id: item.externalId,
                    type: item.type
                });
                window.location.href = `title.html?${params}`;
            });

            card.querySelector(".add-btn").addEventListener("click", async event => {
                const button = event.currentTarget;
                if (!currentUser) {
                    window.location.href = "index.html";
                    return;
                }

                button.disabled = true;
                button.textContent = "Adding...";
                try {
                    const result = await addToWatchlist(db, currentUser.uid, {
                        ...item,
                        status: "plan_to_watch"
                    });
                    button.textContent = result.alreadyExists ? "✓ Added" : "✓ Saved";
                    button.classList.add("added");
                } catch (error) {
                    console.error(error);
                    button.disabled = false;
                    button.textContent = "Try again";
                    alert("Could not add this title. Check your Firestore rules.");
                }
            });

            results.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        status.textContent = "Search failed.";
        results.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    }
}

function label(type) {
    return type === "anime" ? "Anime" : type === "movie" ? "Movie" : "TV / Drama";
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }
