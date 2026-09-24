# 歴史する — GitHub Pages 用サイト

このフォルダの中身を、GitHub の `doinghistory/site` リポジトリの **ルート** に配置してください。`index.html` と６ページ（`manabu.html`, `tou.html`, `kitaeru.html`, `miru.html`, `shiraberu.html`, `meguru.html`）が同じ階層にあります。公開後は `https://doinghistory.github.io/site/` で確認できます。

## 教材スプレッドシート

公開CSV: https://docs.google.com/spreadsheets/d/e/2PACX-1vRqBole4i2mxRQPC6VsDdrRVXZQmLFDVmBoE0y0TkEDcpCd_J71F0IZol81MEX4qzN6EkbcI8RIIoeu/pub?gid=1696967938&single=true&output=csv

トップと「学ぶ」「問う」「鍛える」「観る」は公開CSVを表示時に取得します。各行の「掲載先」を該当ページ名にし、公開を TRUE にします。未入力URLの行は「準備中」です。失敗時は2026年9月23日時点の内蔵データを表示します。スプシ更新は公開CSVの反映に伴い次の表示から読み込まれます。

「調べる」は公開資料サイトの登録データを `shiraberu-data.js` で管理します。「巡る」は `meguru-data.js` の見本記事を実際の日記原稿に差し替えてください。写真も見本で、クレジットはページ内にあります。

## 配置時の注意

ZIPを展開して **中のファイルと assets フォルダ** をリポジトリのルートにアップロードしてください。フォルダを一段余計に作るとページ間リンクが動きません。トップの見た目は既存版を維持しています。公開サイトの更新やGitHubへのpushはまだ行っていません。
