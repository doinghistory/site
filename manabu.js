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
function fromCSV(text){const csv=parseCSV(text);const heads=(csv.shift()||[]).map(s=>s.trim().replace(/^\uFEFF/,''));if(!heads.includes('タイトル')&&!heads.includes('教材名'))throw new Error('invalid CSV');return csv.map(row=>Object.fromEntries(heads.map((h,i)=>[h,(row[i]||'').trim()]))).filter(r=>!['false','0','no','off','非公開','下書き'].includes((r['公開']||'').toLowerCase())&&(!r['掲載先']||r['掲載先'].includes('学ぶ'))&&(r['タイトル']||r['教材名'])).map(r=>({title:r['タイトル']||r['教材名'],era:r['時代'],kind:r['種別']||r['種類']||'教材',desc:r['ひとこと説明']||r['説明']||'',url:validUrl(r['URL']||r['リンク']),date:r['公開日']||'',order:r['表示順']?Number(r['表示順']):9999}));}
function setURL(){if(location.protocol==='file:')return;const u=new URL(location.href);for(const [k,v]of Object.entries({era:sub||major,kind})){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);}
function setEra(e){major=e;sub='';setURL();render();}
function render(){
$('#era-nav').innerHTML=Object.entries(labels).map(([e,l])=>`<button type="button" data-major="${e}" aria-pressed="${e===major}">${l}</button>`).join('');
$('#era-nav').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setEra(b.dataset.major)));
$('#selected-era').textContent=sub||(major?labels[major]:'すべての時代');
$('#suberas').innerHTML=major?['',...eras[major]].map(s=>`<button type="button" data-sub="${s}" aria-pressed="${s===sub}">${s||'すべて'}</button>`).join(''):'';
$('#suberas').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{sub=b.dataset.sub;setURL();render();}));
document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
const filtered=rows.filter(r=>(!major||group(r.era)===major)&&(!sub||normalize(r.era).includes(sub))&&(!kind||r.kind.includes(kind))).sort((a,b)=>(a.order??9999)-(b.order??9999));
$('#result-count').textContent=`${filtered.length}件`;
$('#material-list').innerHTML=filtered.length?filtered.map((r,i)=>{const number=r.title.match(/^\s*(\d+)[.．\s]*/);const title=number?r.title.slice(number[0].length):r.title;const url=validUrl(r.url);return `<article class="material"><span class="material-number">${esc(number?number[1]:String(i+1).padStart(2,'0'))}</span><div><div class="material-meta"><span>${esc(r.era)}</span><span>${esc(r.kind)}</span></div><h4>${url?`<a class="open-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a>`:esc(title)}</h4><p>${esc(r.desc)}</p></div>${url?'<span class="row-arrow" aria-hidden="true">↗</span>':'<span class="unavailable">準備中</span>'}</article>`;}).join(''):'<div class="empty"><h4>教材は準備中です。</h4><p>この条件に合う教材は、まだ登録されていません。</p><button id="reset" type="button">すべての教材を見る</button></div>';
$('#reset')?.addEventListener('click',()=>{major='';sub='';kind='';setURL();render();});
}
document.querySelectorAll('[data-era]').forEach(a=>a.addEventListener('click',()=>setEra(a.dataset.era)));
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kind;setURL();render();}));
const params=new URLSearchParams(location.search),initial=normalize(params.get('era'));if(initial){major=eras[initial]?initial:group(initial);sub=major&&eras[major].includes(initial)?initial:'';}if(['プリント','スライド'].includes(params.get('kind')))kind=params.get('kind');
render();
if(location.protocol!=='file:'){
const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
fetch(CSV_URL,{signal:controller.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.text();}).then(t=>{rows=fromCSV(t);$('#data-status').textContent='';render();}).catch(()=>{$('#data-status').textContent='取得できないため、2026年9月23日時点の教材情報を表示しています。';}).finally(()=>clearTimeout(timeout));
}else{$('#data-status').textContent='2026年9月23日時点の教材情報';}
})();
