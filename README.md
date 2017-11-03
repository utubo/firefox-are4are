# ![](https://github.com/utubo/are4are/raw/master/src/icons/are4are-32.png)アレを見やすくするアレ

![screenshot](https://addons.cdn.mozilla.net/user-media/previews/full/181/181630.png)

やっつけ

AndroidのFirefoxのアドオンです  
ふたばっぽいページを見やすく加工します  
設定画面でURLを追加すれば保管庫とかでも動きます  
でもフレームには対応してませんごめん

## インストール
以下のどれかをインストール  
 - ベータ版(おすすめ)(黄色の「Firefoxへ追加」ボタン)  
<https://addons.mozilla.org/ja/firefox/addon/アレを見やすくするアレ/versions/beta>  
 - 正式版(気が向いたときに更新するので**古いです**)(緑色の「Firefoxへ追加」ボタン)  
<https://addons.mozilla.org/ja/firefox/addon/アレを見やすくするアレ/>  
 - テスト用自宅サーバ未署名版(最新だけど超不安定バグあり)  
<http://utb.dip.jp:8001/~utb/temp/are.xpi>  
※未署名のアドオンをいれるにはFirefoxで`about:config`を開いて`xpinstall.signatures.required`を`false`に設定

## 外部URLの登録
### 手順
アドオンの設定画面で「外部板」に外部板のスレッドのURLを貼り付けて開き直せばOK  
(Firefox56の人は、カタログの設定ページから または http://x123.x0.to/~are/ にアクセスするとアドオンの設定画面を開けます)

### 詳細な手順
1. 外部板で適当なスレッドを開いておく
1. アドオンの設定画面を開く(Firefox56の人はカタログの設定ページから開けます)
1. 「開いてるタブから追加」ボタンを押して、外部板タブを選択する(自動で正規表現に変換して追加されます)
1. 「保存」を押す
1. スレッドを再読み込みすれば適用されるよ(ダメなときは正規表現を修正してね)

