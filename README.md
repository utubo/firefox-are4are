#![logo](https://github.com/utubo/are4are/raw/master/src/icons/are4are-32.png)アレを見やすくするアレ

やっつけ

AndroidのFirefoxのアドオンです  
ふたばっぽいページを見やすく加工します  
設定画面でURLを追加すれば保管庫とかでも動きます  
でもフレームには対応してませんごめん

##インストール
以下のどれかをインストール  
 - おすすめ(githubにプッシュしたやつ)  
<http://x123.x0.to/~rawgit/are.xpi>
 - 最新だけど超不安定バグあり(自宅サーバに上げてテストする用)  
<http://utb.dip.jp:8001/~utb/temp/are.xpi>
 - 承認済みだけど古い  
<https://addons.mozilla.org/ja/firefox/addon/アレを見やすくするアレ/>  

※未承認のアドオンをいれるにはFirefoxで`about:config`を開いて`xpinstall.signatures.required`を`false`に設定

##外部URLの登録
###手順
カタログ設定画面からアドオンの設定画面にいけるので  
「外部板」の欄にURLを貼り付けて開き直せばOK

###詳細な手順
1. 外部スレッドを開いてURLをコピーしておく
1. ふたばのカタログを開いてちょっと上にスクロールさせる
1. 「設定」リンクをクリック
1. 「アレを見やすくするアレ - 設定」というリンクがあるのでクリック
1. 外部板の欄にURLをペーストする(自動で正規表現になります)
1. 「保存」を押す
1. スレッドを再読み込みすれば適用されるよ

 - ダメなときは正規表現を修正してね  
 - 暫定的に以下のURLにアクセスして設定ページを開けるようにしました  
<http://x123.x0.to/~are/>

##承認済みバージョンとの違い
(ver4.8→ver4.9)
 - 機能追加
   - なし
 - バグ修正
   - ぽかん庫のAタグが開けないバグを修正

