(()=>{'use strict';
const CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vRqBole4i2mxRQPC6VsDdrRVXZQmLFDVmBoE0y0TkEDcpCd_J71F0IZol81MEX4qzN6EkbcI8RIIoeu/pub?gid=1696967938&single=true&output=csv';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/時代|\s/g,'').replace(/安土・桃山/g,'安土桃山').replace(/昭和前期|昭和・戦前/g,'昭和戦前').replace(/昭和後期|昭和・戦後/g,'戦後');
function safeURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
let rows=window.KITAERU_SNAPSHOT||[],mode='',era='';
function csv(text){const out=[];let r=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){v+='"';i++;}else if(c==='"')q=false;else v+=c;}else if(c==='"')q=true;else if(c===','){r.push(v);v='';}else if(c==='\n'){r.push(v);out.push(r);r=[];v='';}else if(c!=='\r')v+=c;}r.push(v);if(r.some(Boolean))out.push(r);return out;}
function loadRows(text){const raw=csv(text),h=(raw.shift()||[]).map(s=>s.trim().replace(/^\uFEFF/,''));if(!h.includes('タイトル')&&!h.includes('教材名'))throw Error('invalid CSV');return raw.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()]))).filter(r=>!['false','0','no','off','下書き','非公開'].includes((r['公開']||'').toLowerCase())&&(!r['掲載先']||r['掲載先'].includes('鍛える'))&&['演習プリント','演習','正誤','組合せ','空欄','過去問','模試','模擬試験','入試'].some(k=>(r['種別']||r['種類']||'').includes(k))&&(r['タイトル']||r['教材名'])).map(r=>({title:r['タイトル']||r['教材名'],kind:r['種別']||r['種類'],era:r['時代'],desc:r['ひとこと説明']||r['説明']||'',url:safeURL(r['URL']||r['リンク']),date:r['公開日']||'',format:r['形式']||'',order:r['表示順']?Number(r['表示順']):9999}));}
function modeOf(s){if(/模試|模擬試験|模擬テスト/.test(s))return '模試過去問';if(/過去問|大学入試|入試問題/.test(s))return '過去問演習';return '演習プリント';}
function updateURL(){if(location.protocol==='file:')return;const u=new URL(location.href);for(const[k,v]of Object.entries({mode,era})){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);}
const catalog=window.MaterialsUI({list:'#print-list',controls:'.materials .type-nav',render});
// 検索・並び順・公開状態は必要なときだけ開く。共有の MaterialsUI は変更しない。
const extra=$('#catalogue-extra'),toolbar=$('.materials .material-tools');
if(extra&&toolbar)extra.append(toolbar);
function render(){
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.mode)));
  document.querySelectorAll('.practice-tile[data-choose]').forEach(a=>{
    if(mode===a.dataset.choose){a.dataset.active='true';a.setAttribute('aria-current','true');}
    else{delete a.dataset.active;a.removeAttribute('aria-current');}
  });
  $('#current-mode').textContent=mode||'すべての教材';
  $('#era').value=era;
  const visible=catalog.filter(rows.filter(r=>(!mode||modeOf(r.kind)===mode)&&(!era||norm(r.era).includes(era))));
  $('#count').textContent=visible.length+' 件';
  const batch=catalog.slice(visible);
  const cols=$('.catalogue-columns');
  if(cols)cols.hidden=visible.length===0;
  const advanced=Boolean(era||$('#material-query')?.value.trim()||$('#material-ready')?.checked||$('#material-sort')?.value);
  const filterPanel=$('#catalogue-filter');
  if(filterPanel){filterPanel.dataset.active=String(advanced);}
  const emptyText=advanced?'条件に合う教材がありません。':mode?'この分類には、まだ教材がありません。':'現在、掲載されている教材はありません。';
  const resetMarkup=(mode||advanced)?'<button id="reset" type="button">すべての教材を見る</button>':'';
  $('#print-list').innerHTML=visible.length?batch.map(r=>{
    const url=safeURL(r.url);
    const video=url&&/(^|\\.)(youtube\\.com|youtu\\.be)$/.test(new URL(url).hostname);
    const number=String(visible.indexOf(r)+1).padStart(2,'0');
    return `<article class="print-item">
      <span class="print-item-index" aria-hidden="true">${number}</span>
      <div class="print-item-main">
        <div class="item-meta">${r.era?'<span>'+esc(r.era)+'</span>':''}${r.kind?'<span>'+esc(r.kind)+'</span>':''}</div>
        <h3>${url?'<a class="print-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+'</a>':esc(r.title)}</h3>
        ${r.desc?'<p>'+esc(r.desc)+'</p>':''}
      </div>
      <div class="print-item-side">
        ${r.format?'<span class="print-format">'+esc(r.format)+'</span>':''}
        ${r.date?'<time>'+esc(r.date)+'</time>':''}
        ${video?'<span>動画リンク</span>':''}
      </div>
      ${url?'<span class="item-arrow" aria-hidden="true">↗</span>':'<span class="pending">準備中</span>'}
    </article>`;
  }).join(''):`<div class="empty"><p>${emptyText}</p>${resetMarkup}</div>`;
  $('#reset')?.addEventListener('click',()=>{catalog.reset();mode='';era='';updateURL();render();});
}
document.addEventListener('materials-reset',()=>{catalog.reset();mode='';era='';updateURL();render();});
const p=new URLSearchParams(location.search);if(['演習プリント','過去問演習','模試過去問'].includes(p.get('mode')))mode=p.get('mode');if([...$('#era').options].some(o=>o.value===p.get('era')))era=p.get('era');
if(['q','sort','ready','era'].some(key=>p.has(key)))$('#catalogue-filter').open=true;
document.querySelectorAll('[data-choose]').forEach(a=>a.addEventListener('click',()=>{mode=a.dataset.choose;era='';updateURL();render();}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;updateURL();render();}));$('#era').addEventListener('change',e=>{era=e.target.value;updateURL();render();});render();
window.MaterialsUI.load({url:CSV,status:$('#data-status'),apply:text=>{rows=loadRows(text);render();}});
})();
