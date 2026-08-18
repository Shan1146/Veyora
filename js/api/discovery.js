import { discoverAnime, poster as animePoster } from './jikan.js';
import { trendingTMDB, poster as tmdbPoster } from './tmdb.js';
export async function getDiscovery() {
 const [anime, trending] = await Promise.allSettled([discoverAnime(), trendingTMDB('all')]);
 return {
  anime: anime.status==='fulfilled' ? anime.value.data.map(x=>({id:`jikan_${x.mal_id}`,source:'jikan',externalId:x.mal_id,title:x.title,poster:animePoster(x),type:'anime',score:x.score||null,genres:(x.genres||[]).map(g=>g.name)})) : [],
  trending: trending.status==='fulfilled' ? trending.value.results.map(x=>({id:`tmdb_${x.id}`,source:'tmdb',externalId:x.id,title:x.title||x.name,poster:tmdbPoster(x.poster_path),type:x.media_type==='tv'?'tv':'movie',score:x.vote_average||null,genres:x.genre_ids||[]})) : []
 };
}
export function recommend(items, watched) {
 const seen=new Set(watched.map(x=>`${x.source}_${x.externalId}`));
 const types=new Set(watched.map(x=>x.type));
 const genres=new Set(watched.flatMap(x=>x.genres||[]));
 return items.filter(x=>!seen.has(`${x.source}_${x.externalId}`)).map(x=>({...x, _score:(types.has(x.type)?3:0)+(x.genres||[]).filter(g=>genres.has(g)).length*4+(x.score||0)/10})).sort((a,b)=>b._score-a._score).slice(0,12);
}
