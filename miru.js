(()=>{'use strict';
const CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vRqBole4i2mxRQPC6VsDdrRVXZQmLFDVmBoE0y0TkEDcpCd_J71F0IZol81MEX4qzN6EkbcI8RIIoeu/pub?gid=1696967938&single=true&output=csv';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function yt(s){try{const u=new URL(s);let id='';if(u.hostname==='youtu.be')id=u.pathname.slice(1);if(/(^|\.)youtube\.com$/.test(u.hostname))id=u.searchParams.get('v')||u.pathname.split('/')[2]||'';return /^[\w-]{11}$/.test(id)?id:'';}catch{return '';}}
function clean(r){const id=yt(r.url),meta=window.MIRU_VERIFIED?.[id];return {...r,url:safeURL(r.url),id,era:meta?.era||r.era,provider:r.provider||meta?.provider||''};}
function valid(r){return r.url&&(!/youtu(?:\.be|be\.com)/.test(r.url)||r.id);}
let rows=(window.MIRU_SNAPSHOT||[]).map(clean).filter(valid),mode='',era='',slide=0;
function csv(text){const out=[];let r=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){v+='"';i++;}else if(c==='"')q=false;else v+=c;}else if(c==='"')q=true;else if(c===','){r.push(v);v='';}else if(c==='\n'){r.push(v);out.push(r);r=[];v='';}else if(c!=='\r')v+=c;}r.push(v);if(r.some(Boolean))out.push(r);return out;}
function loadRows(text){const raw=csv(text),h=(raw.shift()||[]).map(s=>s.trim().replace(/^\uFEFF/,''));if(!h.includes('タイトル'))throw Error('invalid CSV');return raw.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()]))).filter(r=>!['false','0','no','off','下書き','非公開'].includes((r['公開']||'').toLowerCase())&&(r['掲載先']||'').includes('観る')&&r['タイトル']).map(r=>clean({title:r['タイトル'],kind:r['種別'],era:r['時代'],desc:r['ひとこと説明'],url:r['URL'],thumb:r['サムネイルURL'],provider:r['提供'],duration:r['時間'],date:r['公開日']||'',format:r['形式']||'',order:r['表示順']?Number(r['表示順']):9999})).filter(valid);}
function thumb(r){const url=safeURL(r.thumb)||(r.id?(window.MIRU_LOCAL_THUMBS?.[r.id]||'https://i.ytimg.com/vi/'+r.id+'/hqdefault.jpg'):'');return `<div class="video-image"><div class="type-cover" aria-hidden="true"><span>${esc(r.era)}時代</span><strong>${esc(r.title.replace(/^[0-9０-９]+\s+/, ''))}</strong><span>日本史 ／ ${esc(r.kind)}</span></div>${url?`<img src="${esc(url)}" alt="" loading="lazy">`:''}<span class="play" aria-hidden="true">▶</span>${r.duration?`<span class="duration">${esc(r.duration)}</span>`:''}</div>`;}
function card(r,feature=false,side=false){return `<article class="video-card ${feature?'feature-card':''} ${side?'side-card':''}"><a href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(r.title)}をYouTubeなどの掲載先で開く">${thumb(r)}<div class="video-info"><div class="video-meta"><span>${esc(r.kind)}</span>${r.format?`<span>${esc(r.format)}</span>`:''}<span>${esc(r.era)}</span></div><h${feature?'2':'3'}>${esc(r.title)}</h${feature?'2':'3'}>${feature?`<p>${esc(r.desc)}</p>`:''}${r.date?`<time class="material-date">${esc(r.date)} 公開</time>`:''}<span class="video-provider">${esc(r.provider)}</span></div></a></article>`;}
function imageFallback(){document.querySelectorAll('.video-image img').forEach(img=>{img.addEventListener('error',()=>img.remove(),{once:true});if(img.complete&&!img.naturalWidth)img.remove();});}
function feature(){const picks=rows.filter(r=>r.kind==='授業動画');const list=picks.length?picks:rows;if(!list.length){$('.featured').hidden=true;return;}$('.featured').hidden=false;slide=((slide%list.length)+list.length)%list.length;const shown=list.length===1?[{r:list[0],side:false}]:[{r:list[(slide-1+list.length)%list.length],side:true},{r:list[slide],side:false},{r:list[(slide+1)%list.length],side:true}];$('#filmstrip').innerHTML=shown.map(x=>card(x.r,true,x.side)).join('');$('#slide-count').textContent=String(slide+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0');$('#previous').disabled=$('#next').disabled=list.length<2;imageFallback();}
function urlState(){if(location.protocol==='file:')return;const u=new URL(location.href);for(const[k,v]of Object.entries({mode,era})){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);}
const catalog=window.MaterialsUI({list:'#video-list',controls:'.video-filters',render});
const tools=document.querySelector('.material-tools');
if(tools) document.querySelector('.video-filters').after(tools);
function updateEraCounts(){
  const available=rows.filter(r=>!mode||r.kind.includes(mode));
  document.querySelectorAll('[data-era]').forEach(button=>{
    const value=button.dataset.era;
    const count=available.filter(r=>!value||String(r.era||'').replace(/時代/g,'')===value).length;
    const label=value||'すべての時代';
    button.innerHTML=`<span>${esc(label)}</span><small aria-hidden="true">${count}</small>`;
    button.setAttribute('aria-label',`${label}、${count}本`);
    button.dataset.empty=String(count===0);
  });
}
function render(){updateEraCounts();document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.mode)));document.querySelectorAll('[data-era]').forEach(b=>b.setAttribute('aria-pressed',String(era===b.dataset.era)));const shown=catalog.filter(rows.filter(r=>(!mode||r.kind.includes(mode))&&(!era||String(r.era||'').replace(/時代/g,'')===era)));$('#count').textContent=(era?era+' ／ ':'')+shown.length+'本';const batch=catalog.slice(shown);$('#video-list').innerHTML=shown.length?batch.map(r=>card(r)).join(''):`<div class="empty"><p>${era?esc(era)+'の動画は、現在の条件では見つかりません。':'条件に合う動画がありません。'}別の時代を選ぶか、検索条件を変更してください。</p><button id="reset">すべての動画を見る</button></div>`;$('#reset')?.addEventListener('click',()=>{catalog.reset();mode='';era='';urlState();render();});imageFallback();}
document.addEventListener('materials-reset',()=>{catalog.reset();mode='';era='';urlState();render();});
const q=new URLSearchParams(location.search);if(['授業動画','おすすめ動画'].includes(q.get('mode')))mode=q.get('mode');if([...document.querySelectorAll('[data-era]')].some(b=>b.dataset.era===q.get('era')))era=q.get('era');
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;urlState();render();}));document.querySelectorAll('[data-choose]').forEach(a=>a.addEventListener('click',()=>{mode=a.dataset.choose;era='';urlState();render();}));document.querySelectorAll('[data-era]').forEach(b=>b.addEventListener('click',()=>{era=b.dataset.era;urlState();render();}));$('#previous').addEventListener('click',()=>{slide--;feature();});$('#next').addEventListener('click',()=>{slide++;feature();});render();feature();
window.MaterialsUI.load({url:CSV,status:$('#data-status'),apply:text=>{rows=loadRows(text);render();feature();}});
})();
