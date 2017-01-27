#![](https://github.com/utubo/are4are/raw/master/src/icons/are4are-32.png)アレを見やすくするアレ

![screenshot](https://addons.cdn.mozilla.net/user-media/previews/full/181/181630.png)

やっつけ

AndroidのFirefoxのアドオンです  
ふたばっぽいページを見やすく加工します  
設定画面でURLを追加すれば保管庫とかでも動きます  
でもフレームには対応してませんごめん

##インストール
以下のどれかをインストール  
 - ベータ版(おすすめ)  
<https://addons.mozilla.org/firefox/downloads/latest-beta/%E3%82%A2%E3%83%AC%E3%82%92%E8%A6%8B%E3%82%84%E3%81%99%E3%81%8F%E3%81%99%E3%82%8B%E3%82%A2%E3%83%AC/addon-642710-latest.xpi?src=dp-btn-devchannel>  
 - 正式版(気が向いたときに更新するので**古いです**)(緑色の「Firefoxへ追加」ボタン)  
<https://addons.mozilla.org/ja/firefox/addon/アレを見やすくするアレ/>  
 - テスト用自宅サーバ未署名版(最新だけど超不安定バグあり)  
<http://utb.dip.jp:8001/~utb/temp/are.xpi>  
※未署名のアドオンをいれるにはFirefoxで`about:config`を開いて`xpinstall.signatures.required`を`false`に設定

##外部URLの登録
###手順
カタログ設定画面からアドオンの設定画面にいけるので  
「外部板」に外部板のスレッドのURLを貼り付けて開き直せばOK

###詳細な手順
1. 外部板のスレッドのURLをコピーしておく
1. [設定](http://x123.x0.to/~are/)を開く(カタログの設定ページからも開けます)
1. 外部板の欄にURLをペーストする(自動で正規表現になります)
1. 「保存」を押す
1. スレッドを再読み込みすれば適用されるよ(ダメなときは正規表現を修正してね)

