(() => {
  const trigger = document.querySelector('.site-menu-button');
  const old = document.getElementById('siteDrawer');
  if (!trigger || !old) return;
  const pages = [
    ['manabu', '学ぶ', '授業プリント・スライド', 'materials'],
    ['tou', '問う', '一問一答・一文論述・年代整序', 'prints'],
    ['kitaeru', '鍛える', '演習プリント・入試問題', 'materials'],
    ['miru', '観る', '授業動画・おすすめ動画', 'materials'],
    ['shiraberu', '調べる', '史料・文献・画像のデータベース', ''],
    ['meguru', '巡る', '日々の記録・本や記事', 'entries']
  ];
  const menu = document.createElement('dialog');
  menu.id = 'siteDrawer';
  menu.className = 'site-drawer editorial-menu';
  menu.setAttribute('aria-labelledby', 'contents-title');
  menu.innerHTML = `<div class="contents-bar"><a href="index.html" aria-label="歴史する トップへ"><img src="header-brand.png" alt="歴史する"></a><button type="button" class="contents-close" aria-label="目次を閉じる" autofocus><span aria-hidden="true">×</span></button></div><div class="contents-layout"><div class="contents-heading"><p>日本史の授業と、その周辺。</p><h2 id="contents-title">目次</h2><a class="contents-home" href="index.html">トップページへ <span aria-hidden="true">↗</span></a></div><nav class="contents-rows" aria-label="ページを選ぶ">${pages.map(([id,title,desc,anchor], i) => `<div class="contents-row"><a class="contents-destination" href="${id}.html" ${document.body.classList.contains('page-'+id)?'aria-current="page"':''}><span class="contents-number">0${i+1}</span><span class="contents-name">${title}</span><span class="contents-description">${desc}</span><span class="contents-arrow" aria-hidden="true">↗</span></a>${anchor?`<a class="contents-shortcut" href="${id}.html#${anchor}">${id==='meguru'?'記録一覧':'教材一覧'}へ</a>`:''}</div>`).join('')}</nav></div>`;
  old.replaceWith(menu);
  trigger.addEventListener('click', () => {
    menu.showModal();
    document.body.classList.add('menu-open');
    trigger.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('.contents-close').addEventListener('click', () => menu.close());
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.close()));
  menu.addEventListener('close', () => {
    document.body.classList.remove('menu-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({preventScroll:true});
  });
  window.addEventListener('pageshow', () => {
    if (menu.open) menu.close();
    document.body.classList.remove('menu-open');
    trigger.setAttribute('aria-expanded', 'false');
  });
})();
