import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getWatchlist, updateWatchlistItem, removeFromWatchlist } from "../firebase/watchlist.js";

let user, type="all", status="all", allItems=[];
const library=document.querySelector("#library"), statusEl=document.querySelector("#status"), stats=document.querySelector("#stats");
const searchBox=document.querySelector("#librarySearch"), sortBox=document.querySelector("#librarySort");
searchBox?.addEventListener("input",()=>load()); sortBox?.addEventListener("change",()=>load());

document.querySelectorAll("#typeFilters button").forEach(b=>b.onclick=()=>{setActive("#typeFilters",b);type=b.dataset.type;load()});
document.querySelectorAll("#statusFilters button").forEach(b=>b.onclick=()=>{setActive("#statusFilters",b);status=b.dataset.status;load()});
onAuthStateChanged(auth,u=>{ if(!u){location.href="index.html";return;} user=u;load(); });

async function load(){
  library.innerHTML=""; statusEl.textContent="Loading...";
  try{
    const all=allItems.length?allItems:await getWatchlist(db,user.uid); allItems=all;
    stats.innerHTML=`<div><b>${all.length}</b><span>Total</span></div><div><b>${all.filter(x=>x.type==="anime").length}</b><span>Anime</span></div><div><b>${all.filter(x=>x.type==="tv").length}</b><span>K-Drama</span></div><div><b>${all.filter(x=>x.type==="movie").length}</b><span>Movies</span></div><div><b>${all.filter(x=>x.status==="completed").length}</b><span>Completed</span></div>`;
    let items=all.filter(x=>(type==="all"||x.type===type)&&(status==="all"||(status==="favorites"?x.favorite:x.status===status))).filter(x=>!searchBox?.value || String(x.title||"").toLowerCase().includes(searchBox.value.toLowerCase()));
    const sort=sortBox?.value||"updated"; items.sort((a,b)=>sort==="title"?String(a.title).localeCompare(String(b.title)):sort==="rating"?(Number(b.rating||0)-Number(a.rating||0)):0);
    statusEl.textContent=`${items.length} title${items.length===1?"":"s"}`;
    if(!items.length){library.innerHTML=`<div class="empty">Your library is empty here.<br><br><a class="primary" href="search.html">Search titles</a></div>`;return;}
    items.forEach(render);
  }catch(e){console.error(e);statusEl.textContent="";library.innerHTML=`<div class="empty">Could not load your library.<br>${safe(e.message)}</div>`}
}
function render(x){
  const c=document.createElement("article");c.className="card";
  c.innerHTML=`<img src="${safe(x.poster||"assets/images/default-poster.svg")}" alt="${safe(x.title)}"><div class="card-body"><span class="pill">${label(x.type)}</span><h2>${safe(x.title)}</h2>
  <label>Status<select class="status"><option value="watching">Watching</option><option value="completed">Completed</option><option value="plan_to_watch">Plan to Watch</option><option value="on_hold">On Hold</option><option value="dropped">Dropped</option></select></label>
  <label>Progress<input class="progress" type="number" min="0" value="${Number(x.progress||0)}"></label>
  <label>Rating<select class="rating"><option value="">No rating</option><option value="1">★</option><option value="2">★★</option><option value="3">★★★</option><option value="4">★★★★</option><option value="5">★★★★★</option></select></label>
  <button class="fav">${x.favorite?"❤️":"♡"} Favorite</button> <button class="save">Save</button> <button class="remove">Remove</button></div>`;
  const s=c.querySelector(".status"),p=c.querySelector(".progress"),r=c.querySelector(".rating"),f=c.querySelector(".fav");
  s.value=x.status||"plan_to_watch"; if(x.rating)r.value=x.rating;
  f.onclick=()=>{x.favorite=!x.favorite;f.textContent=x.favorite?"❤️ Favorite":"♡ Favorite"};
  c.querySelector(".save").onclick=async()=>{await updateWatchlistItem(db,user.uid,x.id,{status:s.value,progress:Number(p.value||0),rating:r.value?Number(r.value):null,favorite:x.favorite});allItems=[];load()};
  c.querySelector(".remove").onclick=async()=>{if(confirm(`Remove "${x.title}"?`)){await removeFromWatchlist(db,user.uid,x.id);allItems=[];load()}};
  library.appendChild(c);
}
function setActive(sel,b){document.querySelectorAll(sel+" button").forEach(x=>x.classList.remove("active"));b.classList.add("active")}
function label(t){return t==="anime"?"🎌 Anime":t==="movie"?"🎬 Movie":"🇰🇷 K-Drama"}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
