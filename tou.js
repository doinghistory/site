(()=>{'use strict';
const CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vRqBole4i2mxRQPC6VsDdrRVXZQmLFDVmBoE0y0TkEDcpCd_J71F0IZol81MEX4qzN6EkbcI8RIIoeu/pub?gid=1696967938&single=true&output=csv';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/時代|\s/g,'').replace(/安土・桃山/g,'安土桃山').replace(/昭和前期|昭和・戦前/g,'昭和戦前').replace(/昭和後期|昭和・戦後/g,'戦後');
function safeURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
let rows=window.TOU_SNAPSHOT||[],mode='',era='';
const ERA_GROUPS={
'原始・古代':['旧石器','縄文','弥生','古墳','飛鳥','奈良','平安'],
'中世':['鎌倉','南北朝','室町','戦国'],
'近世':['安土桃山','江戸','幕末'],
'近代':['明治','大正','昭和戦前'],
'現代':['戦後','平成','令和']
};
const groupOf=value=>Object.hasOwn(ERA_GROUPS,value)?value:Object.keys(ERA_GROUPS).find(k=>ERA_GROUPS[k].includes(value))||'';
const matchesEra=(item,value)=>{
 if(!value)return true;
 const actual=norm(item||'');
 if(Object.hasOwn(ERA_GROUPS,value))return actual.includes(norm(value))||ERA_GROUPS[value].some(t=>actual.includes(norm(t)));
 return actual.includes(norm(value));
};
let drawnEraGroup=null;
function renderEraOptions(){
 const group=groupOf(era);
 document.querySelectorAll('[data-era-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.eraGroup===group)));
 const detail=$('#era-detail');
 if(!detail)return;
 detail.hidden=!group;
 if(drawnEraGroup!==group){
   detail.innerHTML=group?['<button type="button" data-era-detail="'+group+'">全期間</button>',...ERA_GROUPS[group].map(t=>'<button type="button" data-era-detail="'+t+'">'+t+'</button>')].join(''):'';
   drawnEraGroup=group;
 }
 detail.querySelectorAll('[data-era-detail]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.eraDetail===era)));
}
function csv(text){const out=[];let r=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){v+='"';i++;}else if(c==='"')q=false;else v+=c;}else if(c==='"')q=true;else if(c===','){r.push(v);v='';}else if(c==='\n'){r.push(v);out.push(r);r=[];v='';}else if(c!=='\r')v+=c;}r.push(v);if(r.some(Boolean))out.push(r);return out;}
function loadRows(text){const raw=csv(text),h=(raw.shift()||[]).map(s=>s.trim().replace(/^\uFEFF/,''));if(!h.includes('タイトル')&&!h.includes('教材名'))throw Error('invalid CSV');return raw.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()]))).filter(r=>!['false','0','no','off','下書き','非公開'].includes((r['公開']||'').toLowerCase())&&(!r['掲載先']||r['掲載先'].includes('問う'))&&['一問一答','一文論述','年代整序'].some(k=>(r['種別']||r['種類']||'').includes(k))&&(r['タイトル']||r['教材名'])).map(r=>({title:r['タイトル']||r['教材名'],kind:r['種別']||r['種類'],era:r['時代'],desc:r['ひとこと説明']||r['説明']||'',url:safeURL(r['URL']||r['リンク']),date:r['公開日']||'',format:r['形式']||'',order:r['表示順']?Number(r['表示順']):9999}));}
function updateURL(){if(location.protocol==='file:')return;const u=new URL(location.href);for(const[k,v]of Object.entries({mode,era})){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);}
const catalog={filter:rs=>rs.slice().sort((a,b)=>Number(!a.url)-Number(!b.url)||(a.order??9999)-(b.order??9999)||a.title.localeCompare(b.title,'ja',{numeric:true})),slice:rs=>rs,reset:()=>{}};
function render(){document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.mode)));const legacy=$('#era');if(legacy)legacy.value=era;renderEraOptions();const visible=catalog.filter(rows.filter(r=>(!mode||r.kind.includes(mode))&&matchesEra(r.era,era)));$('#count').textContent=visible.length+'件';const batch=catalog.slice(visible);$('#print-list').innerHTML=visible.length?batch.map(r=>{const url=safeURL(r.url),video=url&&/(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(url).hostname);return `<article class="print-item"><div><div class="item-meta"><span>${esc(r.era)}</span><span>${esc(r.kind)}</span>${r.format?`<span>${esc(r.format)}</span>`:''}</div><h3>${url?`<a class="print-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(r.title)}</a>`:esc(r.title)}</h3><p>${esc(r.desc)}</p>${r.date?`<time class="material-date">${esc(r.date)} 公開</time>`:''}${video?'<span class="link-note">登録されているリンク先：動画</span>':''}</div>${url?'<span class="item-arrow" aria-hidden="true">↗</span>':'<span class="pending">準備中</span>'}</article>`;}).join(''):'<div class="empty"><p>条件に合う教材がありません。検索条件を変えてお試しください。</p><button id="reset">すべての教材を見る</button></div>';$('#reset')?.addEventListener('click',()=>{catalog.reset();mode='';era='';updateURL();render();});}
document.addEventListener('materials-reset',()=>{catalog.reset();mode='';era='';updateURL();render();});
const p=new URLSearchParams(location.search);if(['一問一答','一文論述','年代整序'].includes(p.get('mode')))mode=p.get('mode');
const validEra=p.get('era');if(validEra&&(Object.hasOwn(ERA_GROUPS,validEra)||Object.values(ERA_GROUPS).some(items=>items.includes(validEra))))era=validEra;
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;updateURL();render();}));
$('#era')?.addEventListener('change',e=>{era=e.target.value;updateURL();render();});
document.querySelectorAll('[data-era-group]').forEach(b=>b.addEventListener('click',()=>{era=b.dataset.eraGroup;updateURL();render();}));
$('#era-detail')?.addEventListener('click',event=>{const b=event.target.closest('button[data-era-detail]');if(!b)return;era=b.dataset.eraDetail;updateURL();render();});
render();
if(location.protocol!=='file:'){fetch(CSV,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('fetch');return r.text()}).then(text=>{rows=loadRows(text);render();$('#data-status').textContent='';}).catch(()=>{$('#data-status').textContent='最新の教材情報を取得できないため、保存済みの一覧を表示しています。';});}
})();
