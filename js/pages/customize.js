import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const themes={midnight:{accent:'#f2b83f',bg:'#0d0918',card:'#171126'},sakura:{accent:'#ff8fb3',bg:'#1a0e18',card:'#281625'},ocean:{accent:'#5cc8ff',bg:'#07141d',card:'#0e202b'},neon:{accent:'#b78cff',bg:'#10071a',card:'#1d102b'},forest:{accent:'#75d69a',bg:'#07150f',card:'#10241a'}};
let user=null,profile={};
const form=document.querySelector('#customForm'), themeButtons=document.querySelectorAll('[data-theme]'), nicknameInput=document.querySelector('#nickname'), bioInput=document.querySelector('#bio'), preview=document.querySelector('#profilePreview'), message=document.querySelector('#customMessage');

onAuthStateChanged(auth,async u=>{if(!u){location.href='index.html';return;}user=u;await loadProfile();});

async function loadProfile(){
 const snap=await getDoc(doc(db,'users',user.uid));
 profile=snap.exists()?snap.data():{};
 nicknameInput.value=profile.nickname||user.displayName||'';
 bioInput.value=profile.bio||'';
 applyTheme(profile.theme||'midnight');
 document.querySelector('#avatarPreview').src=profile.avatarPath||'assets/avatars/avatar01.svg';
 updatePreview();
}

themeButtons.forEach(btn=>btn.onclick=()=>{applyTheme(btn.dataset.theme);updatePreview();});
nicknameInput.oninput=updatePreview;bioInput.oninput=updatePreview;

form.onsubmit=async e=>{
 e.preventDefault();if(!user)return;
 const btn=document.querySelector('#saveCustomization');btn.disabled=true;message.textContent='Saving...';
 try{
  const data={nickname:nicknameInput.value.trim(),bio:bioInput.value.trim(),theme:selectedTheme(),updatedAt:serverTimestamp()};
  await setDoc(doc(db,'users',user.uid),data,{merge:true});
  profile={...profile,...data};message.textContent='Saved ✓';
 }catch(err){console.error(err);message.textContent='Save failed';alert(err?.message||'Could not save profile style.');}
 finally{btn.disabled=false;}
};

function selectedTheme(){return document.querySelector('[data-theme].selected')?.dataset.theme||profile.theme||'midnight';}
function applyTheme(theme){themeButtons.forEach(b=>b.classList.toggle('selected',b.dataset.theme===theme));const t=themes[theme]||themes.midnight;document.documentElement.style.setProperty('--accent',t.accent);document.documentElement.style.setProperty('--page-bg',t.bg);document.documentElement.style.setProperty('--card-bg',t.card);}
function updatePreview(){const t=themes[selectedTheme()]||themes.midnight;preview.style.background=t.bg;document.querySelector('#previewName').textContent=nicknameInput.value.trim()||'Your nickname';document.querySelector('#previewBio').textContent=bioInput.value.trim()||'Your bio will appear here.';}
