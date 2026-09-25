(() => {
'use strict';
const CSV_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vRqBole4i2mxRQPC6VsDdrRVXZQmLFDVmBoE0y0TkEDcpCd_J71F0IZol81MEX4qzN6EkbcI8RIIoeu/pub?gid=1696967938&single=true&output=csv';
const eras={'古代':['旧石器','縄文','弥生','古墳','飛鳥','奈良','平安'],'中世':['鎌倉','南北朝','室町','戦国'],'近世':['安土桃山','江戸','幕末'],'近代':['明治','大正','昭和戦前'],'現代':['戦後','平成','令和']};
const labels={'':'すべて','古代':'原始・古代',中世:'中世',近世:'近世',近代:'近代',現代:'現代'};
let rows=window.MATERIALS_SNAPSHOT||[],major='',sub='',kind='';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalize(s){return String(s||'').replace(/時代/g,'').replace(/\s/g,'').replace(/安土・桃山/g,'安土桃山').replace(/昭和前期|昭和・戦前|戦前昭和/g,'昭和戦前').replace(/昭和後期|昭和・戦後|昭和戦後/g,'戦後');}
function group(s){s=normalize(s);return Object.keys(eras).find(e=>s.includes(e)||eras[e].some(x=>s.includes(x)))||'';}
function validUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function parseCSV(text){const result=[];let row=[],field='',quote=false;for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quote=false;else field+=c;}else if(c==='"')quote=true;else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field);result.push(row);row=[];field='';}else if(c!=='\r')field+=c;}row.push(field);if(row.some(Boolean))result.push(row);return result;}
function fromCSV(text){const csv=parseCSV(text);const heads=(csv.shift()||[]).map(s=>s.trim().replace(/^\uFEFF/,''));if(!heads.includes('タイトル')&&!heads.includes('教材名'))throw new Error('invalid CSV');return csv.map(row=>Object.fromEntries(heads.map((h,i)=>[h,(row[i]||'').trim()]))).filter(r=>!['false','0','no','off','非公開','下書き'].includes((r['公開']||'').toLowerCase())&&(!r['掲載先']||r['掲載先'].includes('学ぶ'))&&(r['タイトル']||r['教材名'])).map(r=>({title:r['タイトル']||r['教材名'],era:r['時代'],kind:r['種別']||r['種類']||'教材',desc:r['ひとこと説明']||r['説明']||'',url:validUrl(r['URL']||r['リンク']),date:r['公開日']||'',format:r['形式']||'',order:r['表示順']?Number(r['表示順']):9999}));}
function setURL(){if(location.protocol==='file:')return;const u=new URL(location.href);for(const [k,v]of Object.entries({era:sub||major,kind})){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);}
function setEra(e){major=e;sub='';setURL();render();}
const catalog=window.MaterialsUI({list:'#material-list',controls:'.type-nav',render});
function render(){
$('#era-nav').innerHTML=Object.entries(labels).map(([e,l])=>`<button type="button" data-major="${e}" aria-pressed="${e===major}">${l}</button>`).join('');
$('#era-nav').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setEra(b.dataset.major)));
$('#selected-era').textContent=sub||(major?labels[major]:'すべての時代');
$('#suberas').innerHTML=major?['',...eras[major]].map(s=>`<button type="button" data-sub="${s}" aria-pressed="${s===sub}">${s||'すべて'}</button>`).join(''):'';
$('#suberas').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{sub=b.dataset.sub;setURL();render();}));
document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
const filtered=catalog.filter(rows.filter(r=>(!major||group(r.era)===major)&&(!sub||normalize(r.era).includes(sub))&&(!kind||r.kind.includes(kind))));
$('#result-count').textContent=`${filtered.length}件`;
const batch=catalog.slice(filtered);$('#material-list').innerHTML=filtered.length?batch.map((r,i)=>{const number=r.title.match(/^\s*(\d+)[.．\s]*/);const title=number?r.title.slice(number[0].length):r.title;const url=validUrl(r.url);return `<article class="material"><span class="material-number">${esc(number?number[1]:'')}</span><div><div class="material-meta"><span>${esc(r.era)}</span><span>${esc(r.kind)}</span>${r.format?`<span>${esc(r.format)}</span>`:''}</div><h4>${url?`<a class="open-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a>`:esc(title)}</h4><p>${esc(r.desc)}</p>${r.date?`<time class="material-date">${esc(r.date)} 公開</time>`:''}</div>${url?'<span class="row-arrow" aria-hidden="true">↗</span>':'<span class="unavailable">準備中</span>'}</article>`;}).join(''):'<div class="empty"><h4>条件に合う教材がありません。</h4><p>キーワードや時代、教材の種類を変えてお試しください。</p><button id="reset" type="button">すべての教材を見る</button></div>';
$('#reset')?.addEventListener('click',()=>{catalog.reset();major='';sub='';kind='';setURL();render();});
}
document.addEventListener('materials-reset',()=>{catalog.reset();major='';sub='';kind='';setURL();render();});
document.querySelectorAll('[data-era]').forEach(a=>a.addEventListener('click',()=>setEra(a.dataset.era)));
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kind;setURL();render();}));
const params=new URLSearchParams(location.search),initial=normalize(params.get('era'));if(initial){major=eras[initial]?initial:group(initial);sub=major&&eras[major].includes(initial)?initial:'';}if(['プリント','スライド'].includes(params.get('kind')))kind=params.get('kind');
render();
window.MaterialsUI.load({url:CSV_URL,status:$('#data-status'),apply:text=>{rows=fromCSV(text);render();}});
})();
