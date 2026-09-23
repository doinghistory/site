(()=>{
  const button=document.querySelector(".site-menu-button");
  const drawer=document.getElementById("siteDrawer");
  if(!button||!drawer) return;
  const setOpen=(open)=>{
    document.body.classList.toggle("menu-open",open);
    button.setAttribute("aria-expanded",open?"true":"false");
    button.setAttribute("aria-label",open?"目次を閉じる":"目次を開く");
  };
  button.addEventListener("click",()=>setOpen(!document.body.classList.contains("menu-open")));
  drawer.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setOpen(false)));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setOpen(false)});
  window.addEventListener("pageshow",()=>setOpen(false));
})();