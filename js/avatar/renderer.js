export const AVATAR_DEFAULTS = { face:0, skin:1, hair:0, hairColor:'#17131f', eyes:0, expression:0, clothes:0, accessory:0, hat:0, background:0 };

const skins=['#f8d6c0','#efc09f','#d99b78','#b97552','#7f4d35'];
const hairColors=['#17131f','#3a2417','#7b4b2a','#d8d8dc','#6c3bd1','#1d4e89','#b52e42'];
const bgs=[['#17112a','#3c2670'],['#341526','#8b3d67'],['#0d2634','#155f7a'],['#182b1e','#3f7650'],['#20142d','#6d2ca4'],['#0d0d12','#45404d']];

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hairPath(h){
  const paths=[
    'M72 116 Q80 40 150 30 Q220 38 228 116 L210 94 Q200 64 176 60 Q145 82 116 58 Q96 72 88 112 Z',
    'M66 116 Q70 48 150 32 Q230 46 234 116 Q213 80 184 76 Q160 96 132 72 Q105 93 66 116 Z',
    'M70 115 Q88 38 150 38 Q214 42 230 114 L204 92 Q178 74 160 80 Q134 92 108 76 Q90 94 70 115 Z',
    'M60 112 Q74 35 150 26 Q228 38 240 112 L214 82 Q180 68 150 76 Q112 64 82 92 Z'
  ]; return paths[h%paths.length];
}
function eyes(variant){
  const ys=[92,95,98,94][variant%4];
  return `<g fill="#211a2b"><ellipse cx="120" cy="${ys}" rx="13" ry="9"/><ellipse cx="180" cy="${ys}" rx="13" ry="9"/></g><g fill="#fff"><circle cx="116" cy="${ys-2}" r="3"/><circle cx="176" cy="${ys-2}" r="3"/></g><g fill="#8b5cf6"><circle cx="120" cy="${ys+1}" r="6"/><circle cx="180" cy="${ys+1}" r="6"/></g>`;
}
function mouth(expression){
  if(expression===1)return '<path d="M140 139 Q150 147 160 139" fill="none" stroke="#6b3944" stroke-width="3" stroke-linecap="round"/>';
  if(expression===2)return '<path d="M140 142 Q150 136 160 142" fill="none" stroke="#6b3944" stroke-width="3" stroke-linecap="round"/>';
  if(expression===3)return '<ellipse cx="150" cy="141" rx="7" ry="5" fill="#6b3944"/>';
  return '<path d="M141 140 Q150 143 159 140" fill="none" stroke="#6b3944" stroke-width="3" stroke-linecap="round"/>';
}
function clothes(c){
  const colors=['#17131f','#f0f0f0','#202632','#eee4f0','#191919','#6d3bd1'];
  const col=colors[c%colors.length];
  return `<path d="M78 205 Q82 174 111 166 L150 185 L189 166 Q218 174 222 205 L222 250 L78 250 Z" fill="${col}"/>`+
    (c===0?'<path d="M132 174 L150 205 L168 174" fill="none" stroke="#aaa" stroke-width="4"/><path d="M130 175 L125 218" stroke="#aaa" stroke-width="3"/><path d="M170 175 L175 218" stroke="#aaa" stroke-width="3"/>':'');
}
function accessory(a){
  if(a===1)return '<circle cx="204" cy="152" r="10" fill="none" stroke="#d7b34a" stroke-width="4"/>';
  if(a===2)return '<path d="M104 100 L108 100 M192 100 L196 100" stroke="#d7b34a" stroke-width="4"/><circle cx="105" cy="100" r="13" fill="none" stroke="#222" stroke-width="4"/><circle cx="195" cy="100" r="13" fill="none" stroke="#222" stroke-width="4"/>';
  if(a===3)return '<path d="M130 184 Q150 205 170 184" fill="none" stroke="#d7b34a" stroke-width="4"/><circle cx="150" cy="204" r="6" fill="#d7b34a"/>';
  return '';
}
function hat(h){
  if(h===1)return '<path d="M78 63 Q150 15 222 63 L214 79 Q150 56 86 79 Z" fill="#15131d"/><rect x="83" y="61" width="134" height="16" rx="7" fill="#24202e"/>';
  if(h===2)return '<path d="M78 72 Q150 35 222 72 L213 89 Q150 64 87 89 Z" fill="#eee"/>';
  if(h===3)return '<path d="M70 68 Q150 18 230 68 L222 82 Q150 53 78 82 Z" fill="#6d3bd1"/><circle cx="215" cy="48" r="10" fill="#f2b83f"/>';
  return '';
}

export function avatarSvg(config={}){
  const c={...AVATAR_DEFAULTS,...config};
  const bg=bgs[c.background%bgs.length];
  const skin=skins[c.skin%skins.length];
  const hair=hairColors[c.hairColorIndex!=null?c.hairColorIndex:0] || c.hairColor || hairColors[0];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs><rect width="300" height="300" rx="44" fill="url(#g)"/><circle cx="150" cy="128" r="103" fill="#ffffff" opacity=".06"/><g>${clothes(c.clothes)}<rect x="127" y="154" width="46" height="36" rx="15" fill="${skin}"/><circle cx="150" cy="116" r="70" fill="${skin}"/><path d="${hairPath(c.hair)}" fill="${hair}"/>${eyes(c.eyes)}${mouth(c.expression)}${accessory(c.accessory)}${hat(c.hat)}<circle cx="100" cy="129" r="5" fill="#e99a9a" opacity=".35"/><circle cx="200" cy="129" r="5" fill="#e99a9a" opacity=".35"/></g></svg>`;
  return svg;
}
export function avatarDataUri(config){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(avatarSvg(config));}
