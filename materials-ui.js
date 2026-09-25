(() => {
  'use strict';
  const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96));
  const date = value => Date.parse(String(value || '').replace(/\//g, '-')) || 0;
  window.MaterialsUI = function ({ list, controls, render }) {
    const params = new URLSearchParams(location.search);
    let query = params.get('q') || '', sort = params.get('sort') || '', ready = params.get('ready') === '1', page = 1, lastRows = [];
    const host = document.querySelector(controls), target = document.querySelector(list);
    const toolbar = document.createElement('div');
    toolbar.className = 'material-tools';
    toolbar.innerHTML = '<label class="material-search" for="material-query">教材名・キーワード<input id="material-query" type="search" placeholder="例：室町文化、57" autocomplete="off"></label><div class="material-options"><label for="material-sort">並び順<select id="material-sort"><option value="">授業順</option><option value="new">新しい順</option><option value="title">教材名順</option></select></label><label class="ready-toggle"><input id="material-ready" type="checkbox">公開済みのみ</label><button type="button" class="clear-materials">条件をリセット</button></div>';
    host.before(toolbar);
    const input = toolbar.querySelector('input[type=search]'), select = toolbar.querySelector('select'), checkbox = toolbar.querySelector('input[type=checkbox]');
    input.value = query; select.value = ['', 'new', 'title'].includes(sort) ? sort : ''; sort = select.value; checkbox.checked = ready;
    const summary = document.createElement('p');
    summary.className = 'material-summary'; summary.setAttribute('role', 'status');
    target.before(summary);
    const pager = document.createElement('nav');
    pager.className = 'material-pagination'; pager.setAttribute('aria-label', '教材一覧のページ'); target.after(pager);
    const sync = () => {
      if (location.protocol === 'file:') return;
      const url = new URL(location.href);
      for (const [key, value] of Object.entries({q:query,sort,ready:ready?'1':''})) value ? url.searchParams.set(key,value) : url.searchParams.delete(key);
      history.replaceState(null,'',url);
    };
    const update = () => { page = 1; sync(); render(); };
    input.addEventListener('input', () => {query=input.value; update();});
    select.addEventListener('change', () => {sort=select.value; update();});
    checkbox.addEventListener('change', () => {ready=checkbox.checked; update();});
    toolbar.querySelector('button').addEventListener('click', () => document.dispatchEvent(new Event('materials-reset')));
    pager.addEventListener('click', event => {
      const button = event.target.closest('button[data-page]');
      if (!button) return;
      page = Number(button.dataset.page); render();
      target.setAttribute('tabindex','-1'); target.focus({preventScroll:true});
      summary.scrollIntoView({block:'start',behavior:'instant'});
    });
    return {
      reset() {query='';sort='';ready=false;page=1;input.value='';select.value='';checkbox.checked=false;sync();},
      filter(rows) {
        const words=normalize(query.trim()).split(/\s+/).filter(Boolean);
        const result = rows.filter(r => (!ready || r.url) && words.every(w => normalize([r.title,r.era,r.kind,r.desc,r.provider].join(' ')).includes(w)));
        result.sort((a,b) => {
          if (sort==='new') return date(b.date)-date(a.date) || (a.order??9999)-(b.order??9999);
          if (sort==='title') return a.title.localeCompare(b.title,'ja',{numeric:true});
          return Number(!a.url)-Number(!b.url) || (a.order??9999)-(b.order??9999) || a.title.localeCompare(b.title,'ja',{numeric:true});
        });
        if (result.length!==lastRows.length || result.some((r,i)=>r!==lastRows[i])) page=1;
        lastRows=result;
        return result;
      },
      slice(rows) {
        const pages=Math.max(1,Math.ceil(rows.length/20)); page=Math.min(page,pages);
        const start=(page-1)*20, published=rows.filter(r=>r.url).length;
        summary.textContent=rows.length?`${rows.length}件中 ${start+1}–${Math.min(start+20,rows.length)}件${published<rows.length?` ／ 準備中 ${rows.length-published}件`:''}`:'該当する教材はありません';
        pager.hidden=pages===1;
        pager.innerHTML=`<button type="button" data-page="${page-1}" ${page===1?'disabled':''} aria-label="前の20件">← 前へ</button><span>${page} / ${pages}</span><button type="button" data-page="${page+1}" ${page===pages?'disabled':''} aria-label="次の20件">次へ →</button>`;
        return rows.slice(start,start+20);
      }
    };
  };
  window.MaterialsUI.load = ({url, status, apply}) => {
    if (location.protocol === 'file:') {
      status.textContent = '2026年9月24日時点の教材情報です。最新情報は公開サイトでご確認ください。';
      return;
    }
    const load = async () => {
      status.textContent = '教材情報を更新しています。';
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 9000);
      try {
        const response = await fetch(url, {signal:controller.signal,cache:'no-store'});
        if (!response.ok) throw new Error('教材を取得できませんでした');
        apply(await response.text());
        status.textContent = '';
      } catch {
        status.textContent = '最新情報を取得できません。2026年9月24日時点の教材情報を表示しています。 ';
        const retry = document.createElement('button');
        retry.type = 'button'; retry.textContent = '再読み込み';
        retry.addEventListener('click', load, {once:true}); status.append(retry);
      } finally { clearTimeout(timer); }
    };
    load();
  };
})();
