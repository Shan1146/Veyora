import { auth, db } from '../firebase/config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import { getWatchlist } from '../firebase/watchlist.js';
import { getDiscovery, recommend } from '../api/discovery.js';
const $=s=>document.querySelector(s), esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function card(x){return `<a class="card" href="search.html?q=${encodeURIComponent(x.title)}"><img src="${esc(x.poster)}" alt=""><div class="card-body"><span class="pill">${x.type==='anime'?'🎌 Anime':x.type==='movie'?'🎬 Movie':'📺 TV'}</span><h2>${esc(x.title)}</h2>${x.score?`<p>⭐ ${Number(x.score).toFixed(1)}</p>`:''}</div></a>`}
function render(id,items,empty='Nothing here yet.'){$(id).innerHTML=items.length?items.map(card).join(''):`<p>${empty}</p>`}
$('#homeSearch').onsubmit=e=>{e.preventDefault();const q=$('#homeQuery').value.trim();location.href=q?'search.html?q='+encodeURIComponent(q):'search.html'};
onAuthStateChanged(auth,async u=>{if(!u){location.href='index.html';return} $('#welcome').textContent=`Welcome, ${u.displayName||'there'}.`;
 try { const [library,discovery]=await Promise.all([getWatchlist(db,u.uid),getDiscovery()]);
  $('#libraryStatus').textContent=library.length?`${library.length} title${library.length===1?'':'s'} in your library.`:'Start building your library.';
  render('#preview',library.slice(0,8)); render('#continue',library.filter(x=>x.status==='watching').slice(0,8),'Mark a title as Watching to continue here.');
  render('#because',recommend([...discovery.anime,...discovery.trending],library),'Save a few titles to unlock personalized recommendations.');
  render('#trending',discovery.trending.slice(0,12)); render('#anime',discovery.anime.slice(0,12));
 } catch(e){console.error(e);$('#libraryStatus').textContent='Some discovery content could not load. Please try again.'}
});
