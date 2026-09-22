doinghistory multi-room prototype

内容
- prototype.html : 4つの入口を確認するための試作トップ
- library.html   : 教材書庫
- theater.html   : 映像室
- archive.html   : 史料室
- inquiry.html   : 探究室
- doinghistory.css : 共通デザイン
- doinghistory.js  : Googleスプレッドシート読込・検索・絞り込み

使い方
1. まず prototype.html をブラウザで開いて4ページの雰囲気を確認。
2. 採用する場合は、上記7ファイルをGitHub Pagesのリポジトリ直下に置く。
3. 現在の index.html の #gates にある各リンク先を、
   library.html / theater.html / archive.html / inquiry.html
   に変更する。

データ連携
現在の materials.html で使っていた公開Googleスプレッドシートを引き続き読み込みます。
「種別」の文字で自動振り分けします。
- 動画/映像 または YouTube URL → 映像室
- 史料/資料/一次/文献 → 史料室
- 探究/問い/課題/研究 → 探究室
- それ以外 → 教材書庫

注意
この試作は既存の index.html を上書きしません。
