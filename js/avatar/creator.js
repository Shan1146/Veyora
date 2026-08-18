import { requireAuth } from "../utils/guards.js";
import { getUserProfile, updateUserProfile } from "../firebase/profile.js";
import { avatarDataUri, AVATAR_DEFAULTS } from "./renderer.js";

const user=await requireAuth();
let profile=await getUserProfile(user.uid);
let config={...AVATAR_DEFAULTS,...(profile.avatarConfig||{})};
const preview=document.querySelector('#avatar-preview');
const thumb=document.querySelector('#avatar-thumb');
const msg=document.querySelector('#save-message');

const optionSets={
  face:[0,1,2,3], skin:[0,1,2,3,4], hair:[0,1,2,3], eyes:[0,1,2,3], expression:[0,1,2,3], clothes:[0,1,2,3,4,5], accessory:[0,1,2,3], hat:[0,1,2,3], background:[0,1,2,3,4,5]
};
function render(){
  const uri=avatarDataUri(config); preview.src=uri; thumb.src=uri;
  for(const [key,vals] of Object.entries(optionSets)) document.querySelectorAll(`[data-key="${key}"]`).forEach((b,i)=>b.classList.toggle('selected',Number(b.dataset.value)===Number(config[key])));
}
document.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{config[b.dataset.key]=Number(b.dataset.value);render();});
document.querySelector('#randomize').onclick=()=>{for(const [k,vals] of Object.entries(optionSets))config[k]=vals[Math.floor(Math.random()*vals.length)];render();};
document.querySelector('#reset').onclick=()=>{config={...AVATAR_DEFAULTS};render();};
document.querySelector('#save-avatar').onclick=async()=>{try{document.querySelector('#save-avatar').disabled=true;msg.textContent='Saving...';await updateUserProfile(user.uid,{avatarConfig:config,avatarUrl:avatarDataUri(config)});profile={...profile,avatarConfig:config};msg.textContent='Avatar saved ✓';}catch(e){console.error(e);msg.textContent='Save failed';alert(e.message||'Could not save avatar.');}finally{document.querySelector('#save-avatar').disabled=false;}};
render();
