(function(){
"use strict";

const CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vTGfy6nXuXVIFiazfphIAJT7by7hcBLolbP6DHFrIxqrbyB8ucFAlzIRUGuK3BERm9p1IFCi07cvgPu/pub?gid=1464622297&single=true&output=csv";

const state={all:[],filtered:[],q:"",era:""};

function clean(v){return (v==null?"":String(v)).trim()}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function parseCSV(text){
  const out=[];let row=[],f="",q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c=='"'&&text[i+1]=='"'){f+='"';i++}
      else if(c=='"'){q=false}else f+=c;
    }else{
      if(c=='"')q=true;
      else if(c==","){row.push(f);f=""}
      else if(c=="\n"){row.push(f);out.push(row);row=[];f=""}
      else if(c!="\r")f+=c;
    }
  }
  row.push(f);if(row.length>1||row[0])out.push(row);return out;
}
function toObjects(rows){
  if(!rows.length)return[];
  const h=rows[0].map(clean);
  return rows.slice(1).map(r=>{
    const o={};h.forEach((k,i)=>o[k]=clean(r[i]));
    return {
      date:o["公開日"]||o["日付"]||"",
      kind:o["種別"]||o["種類"]||"",
      era:o["時代"]||"",
      title:o["タイトル"]||o["教材名"]||"",
      url:o["URL"]||o["リンク"]||"",
      desc:o["ひとこと説明"]||o["説明"]||o["概要"]||""
    }
  }).filter(x=>x.title&&x.url);
}
function dateVal(s){
  const m=/(\d{4})[\/.\-年](\d{1,2})[\/.\-月](\d{1,2})/.exec(s||"");
  return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():0;
}
function isFuture(s){
  const t=dateVal(s);if(!t)return false;
  const n=new Date();const today=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();
  return t>today;
}
function ytid(url){
  try{
    const u=new URL(url);
    if(u.hostname.includes("youtu.be"))return u.pathname.split("/").filter(Boolean)[0]||"";
    if(u.hostname.includes("youtube.com")){
      if(u.searchParams.get("v"))return u.searchParams.get("v");
      const p=u.pathname.split("/").filter(Boolean);const i=p.indexOf("shorts");
      if(i>=0)return p[i+1]||"";
    }
  }catch(e){}
  return "";
}
function eras(rows){return [...new Set(rows.map(x=>x.era).filter(Boolean))]}

function pageRows(page,rows){
  if(page==="theater") return rows.filter(x=>/動画|映像/.test(x.kind)||!!ytid(x.url));
  if(page==="archive") return rows.filter(x=>/史料|資料|一次|文献/.test(x.kind));
  if(page==="inquiry") return rows.filter(x=>/探究|問い|課題|研究/.test(x.kind));
  if(page==="library") return rows.filter(x=>!(/動画|映像|史料|資料|一次|文献|探究|問い|課題|研究/.test(x.kind)||!!ytid(x.url)));
  return rows;
}

function initFilters(baseRows,render){
  const q=document.querySelector("#q");
  const holder=document.querySelector("#eraPills");
  const count=document.querySelector("#count");
  if(q) q.addEventListener("input",()=>{state.q=q.value.trim().toLowerCase();apply()});
  if(holder){
    const e=eras(baseRows);
    holder.innerHTML='<button class="pill active" data-era="">すべて</button>'+e.map(v=>`<button class="pill" data-era="${esc(v)}">${esc(v)}</button>`).join("");
    holder.querySelectorAll(".pill").forEach(b=>b.addEventListener("click",()=>{
      holder.querySelectorAll(".pill").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");state.era=b.dataset.era||"";apply();
    }));
  }
  function apply(){
    const rows=baseRows.filter(x=>{
      if(state.era&&x.era!==state.era)return false;
      if(state.q&&!(`${x.title} ${x.desc} ${x.era} ${x.kind}`.toLowerCase().includes(state.q)))return false;
      return true;
    }).sort((a,b)=>dateVal(b.date)-dateVal(a.date));
    state.filtered=rows;if(count)count.textContent=rows.length;render(rows);
  }
  apply();
}

function renderLibrary(rows){
  const el=document.querySelector("#content");
  if(!rows.length)return el.innerHTML=empty("教材がまだありません","スプレッドシートの「種別」にプリント・演習などを追加すると、ここに並びます。");
  el.innerHTML=rows.map(x=>`<a class="book" href="${esc(x.url)}" target="_blank" rel="noopener">
    <div class="meta">${x.kind?`<span class="tag">${esc(x.kind)}</span>`:""}<span>${esc(x.era)}</span><span>${esc(x.date)}</span></div>
    <h3>${esc(x.title)}</h3><p>${esc(x.desc||"授業教材を開く")}</p></a>`).join("");
}
function renderTheater(rows){
  const el=document.querySelector("#content");
  if(!rows.length)return el.innerHTML=empty("映像がまだありません","YouTubeリンク、または「種別」を動画・映像にした教材がここに並びます。");
  el.innerHTML=rows.map(x=>{const id=ytid(x.url);return `<a class="film" href="${esc(x.url)}" target="_blank" rel="noopener">
    <div class="frame">${id?`<img loading="lazy" alt="" src="https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg">`:""}<span class="play"></span></div>
    <div class="film-body"><div class="reel">${esc(x.era||"HISTORY FILM")}</div><h3>${esc(x.title)}</h3><p>${esc(x.desc||x.kind||"映像教材")}</p></div></a>`}).join("");
}
function renderArchive(rows){
  const el=document.querySelector("#content");
  if(!rows.length)return el.innerHTML=empty("史料がまだありません","「種別」を史料・資料などにした教材が、史料カードとしてここに並びます。");
  el.innerHTML=rows.map(x=>`<a class="doc" href="${esc(x.url)}" target="_blank" rel="noopener">
    <div class="meta">${x.kind?`<span class="tag">${esc(x.kind)}</span>`:""}<span>${esc(x.era)}</span></div>
    <h3>${esc(x.title)}</h3><p>${esc(x.desc||"史料を読む")}</p><span class="stamp">OPEN DOCUMENT ↗</span></a>`).join("");
}
function renderInquiry(rows){
  const el=document.querySelector("#content");
  if(!rows.length)return el.innerHTML=empty("探究テーマは準備中です","「種別」を探究・問い・課題などにした教材が、問いのカードとしてここに並びます。");
  el.innerHTML=rows.map(x=>`<a class="question" href="${esc(x.url)}" target="_blank" rel="noopener">
    <span class="qmark">?</span><div class="meta">${x.kind?`<span class="tag">${esc(x.kind)}</span>`:""}<span>${esc(x.era)}</span></div>
    <h3>${esc(x.title)}</h3>
    <div class="question-footer"><span>${esc(x.desc||"問いをひらく")}</span><span>↗</span></div></a>`).join("");
}
function empty(a,b){return `<div class="empty"><strong>${esc(a)}</strong>${esc(b)}</div>`}

async function boot(){
  const page=document.body.dataset.page;
  if(!page)return;
  const content=document.querySelector("#content");
  try{
    const res=await fetch(CSV_URL,{cache:"no-store"});
    if(!res.ok)throw new Error();
    const rows=toObjects(parseCSV(await res.text())).filter(x=>!isFuture(x.date));
    const base=pageRows(page,rows);
    const renderer={library:renderLibrary,theater:renderTheater,archive:renderArchive,inquiry:renderInquiry}[page];
    initFilters(base,renderer);
  }catch(e){
    if(content)content.innerHTML=empty("データを読み込めませんでした","再読み込みするか、時間を置いてもう一度お試しください。");
  }
}
document.addEventListener("DOMContentLoaded",boot);
})();
