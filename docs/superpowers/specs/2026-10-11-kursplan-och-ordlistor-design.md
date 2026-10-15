# Kursplan och ordlistor – design

**Datum:** 2026-10-11
**Ärenden:** #8, #9 och #11. Berör också delar av #12 och #15.

## Mål

Barn på 8–10 år ska kunna läsa riktiga japanska ord så tidigt som möjligt, och bara möta tecken de redan har lärt sig. Orden ska vara konkreta, roliga och passa åldern.

**Klart när:**
- Varje ord i appen går att läsa med de tecken som lärts ut före ordets grupp.
- Det finns inga vuxna eller abstrakta ord.
- Nya ord dyker upp efter i stort sett varje godkänd teckengrupp.

## Beslut

| Fråga | Beslut |
|---|---|
| Målgrupp | 8–10 år, läser svenska själva |
| Sparade framsteg | Alla börjar om (ny lagringsnyckel) |
| Nya tecken (゛ ゜ ゃゅょ っ ー) | Kommer efter de tio grundraderna |
| Ordens roll | Frivillig bonus som inte låser nästa teckengrupp |
| Ordteman | Djur och natur, mat och godis, skola/hem/familj, Japan och popkultur |
| Struktur | Handplockade ordgrupper i en kursplanefil, kontrollerade av tester |

## Kursupplägg

| Grupp | Hiragana | Katakana | Nytt begrepp |
|---|---|---|---|
| 1–10 | あ-raden … わ-raden (som nu) | ア-raden … ワ-raden (som nu) | grundtecknen |
| 11 | きて · きって · いえ · いいえ · ゆき · ゆうき | ケーキ · ノート · スキー · コーヒー · ロケット · ホッケー | litet っ och långa vokaler |
| 12 | が ぎ ぐ げ ご | ガ ギ グ ゲ ゴ | ゛: k blir g |
| 13 | ざ じ ず ぜ ぞ | ザ ジ ズ ゼ ゾ | ゛: s blir z |
| 14 | だ で ど | ダ デ ド | ゛: t blir d |
| 15 | ば び ぶ べ ぼ | バ ビ ブ ベ ボ | ゛: h blir b |
| 16 | ぱ ぴ ぷ ぺ ぽ | パ ピ プ ペ ポ | ゜: h blir p |
| 17 | きゃ きゅ きょ しゃ しゅ しょ | キャ … ショ | små ゃゅょ |
| 18 | ちゃ ちゅ ちょ にゃ にゅ にょ | チャ … ニョ | |
| 19 | ひゃ ひゅ ひょ みゃ みゅ みょ | ヒャ … ミョ | |
| 20 | りゃ りゅ りょ ぎゃ ぎゅ ぎょ | リャ … ギョ | |
| 21 | じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ | ジャ … ピョ | |
| 22 | – | ティ ディ ファ フィ フォ ジェ ウェ | ljud som bara finns i lånord |

Totalt blir det 108 lektionsposter i hiragana och 115 i katakana.

**Detaljer**
- **ぢ och づ tas inte med.** De låter exakt som じ och ず, så ljudfrågorna skulle bli omöjliga att svara rätt på.
- **Grupp 11 innehåller ordpar** som bara skiljer sig åt på regeln, så att barnet tränar både öra och öga på skillnaden. Varje post har en egen tipsrad:
  - きて, *"kom!"*, mot きって, *"frimärke"*. Det lilla っ gör en kort paus.
  - いえ, *"hus"*, mot いいえ, *"nej"*. Dubbla い ger ett långt i.
  - ゆき, *"snö"*, mot ゆうき, *"mod"*. Med ett う efter blir ljudet längre.
  - Katakana: ー förlänger ljudet före, och ッ gör en kort paus.
- **Gruppen lär ut regeln, inte nya former.** När den är klar räknas っ (och ッ och ー i katakana) som kända tecken i ordkontrollen.
- **ウェ** finns med i grupp 22 så att スウェーデン (Sverige) går att läsa.
- **Tipsraden skapas automatiskt** för grupp 12–22:
  - ゛ och ゜: "か + ゛ = が: k blir g". じ får tillägget "uttalas ji".
  - ゃゅょ: "き + litet ゃ = きゃ: säg ki-a snabbt, så blir det kya".
  - Lånordsljud: "テ + litet ィ = ティ (ti)".
- Grundtecknens minnesknep ändras inte här. Det tas i #13.

## Ordlistor

**Konventioner**
- Romajin följer kanan: おう skrivs ou, えい skrivs ei, ー blir dubbel vokal, ん skrivs alltid n (enpitsu, tenpura) och っ dubblar konsonanten (kitte, mittsu). Samma regler som i dag.
- Ord med långa vokaler kommer tidigast efter grupp 11.
- Varje ord har en emoji som visas på ordkortet. Bildquizen i #12 ingår inte.
- Inom ett alfabet förekommer varje ord, betydelse och emoji bara en gång.

**Värt att känna till**
- Några djurnamn (きりん, わに, ぞう) skrivs ofta med katakana i Japan, men hiragana är vanligt i barnböcker. ラッコ ligger i katakanalistan.
- **Ord med dubbel betydelse** behåller bara den barnvänliga: はな blomma (också näsa), あめ regn (också godis), ひ eld (också sol), かえる groda (också "gå hem").
- **Flaggorna** 🇫🇮 🇸🇪 visas som bokstäverna FI och SE på Windows.
- **Grupp 19** (ひゃ, みゃ …) har inga egna ord eftersom de kombinationerna är ovanliga i barnord. ひゃく kommer efter grupp 20.

### Hiragana (125 ord i 25 ordgrupper)

| Efter grupp | Ord | Romaji | Svenska | Bild |
|---|---|---|---|---|
| **1** | いえ | ie | hus | 🏠 |
|  | あお | ao | blå | 🔵 |
|  | うえ | ue | upp | ⬆️ |
|  | え | e | bild | 🖼️ |
| **2** | き | ki | träd | 🌳 |
|  | あか | aka | röd | 🔴 |
|  | かお | kao | ansikte | 😊 |
|  | えき | eki | station | 🚉 |
|  | こえ | koe | röst | 🗣️ |
| **3** | すし | sushi | sushi | 🍣 |
|  | おかし | okashi | godis | 🍬 |
|  | うし | ushi | ko | 🐄 |
|  | いす | isu | stol | 🪑 |
|  | かさ | kasa | paraply | ☂️ |
|  | すいか | suika | vattenmelon | 🍉 |
| **4** | て | te | hand | ✋ |
|  | くち | kuchi | mun | 👄 |
|  | あし | ashi | fot | 🦶 |
|  | たこ | tako | bläckfisk | 🐙 |
|  | ちかてつ | chikatetsu | tunnelbana | 🚇 |
| **5** | いぬ | inu | hund | 🐶 |
|  | ねこ | neko | katt | 🐱 |
|  | さかな | sakana | fisk | 🐟 |
|  | にく | niku | kött | 🥩 |
|  | きのこ | kinoko | svamp | 🍄 |
|  | なつ | natsu | sommar | ☀️ |
| **6** | はな | hana | blomma | 🌷 |
|  | ほし | hoshi | stjärna | ⭐ |
|  | ふね | fune | båt | 🚢 |
|  | ひ | hi | eld | 🔥 |
|  | ふく | fuku | kläder | 👕 |
| **7** | め | me | öga | 👁️ |
|  | みみ | mimi | öra | 👂 |
|  | くま | kuma | björn | 🐻 |
|  | うみ | umi | hav | 🌊 |
|  | あめ | ame | regn | 🌧️ |
|  | むし | mushi | insekt | 🐛 |
| **8** | やま | yama | berg | ⛰️ |
|  | ゆき | yuki | snö | ❄️ |
|  | ゆめ | yume | dröm | 💭 |
|  | やさい | yasai | grönsaker | 🥦 |
|  | もも | momo | persika | 🍑 |
| **9 (1)** | さる | saru | apa | 🐒 |
|  | とり | tori | fågel | 🐦 |
|  | りす | risu | ekorre | 🐿️ |
|  | かえる | kaeru | groda | 🐸 |
|  | くるま | kuruma | bil | 🚗 |
| **9 (2)** | そら | sora | himmel | 🌤️ |
|  | しろ | shiro | vit | ⚪ |
|  | くろ | kuro | svart | ⚫ |
|  | さくら | sakura | körsbärsblomma | 🌸 |
|  | よる | yoru | natt | 🌙 |
|  | いろ | iro | färg | 🎨 |
| **10** | わに | wani | krokodil | 🐊 |
|  | にわとり | niwatori | höna | 🐔 |
|  | きりん | kirin | giraff | 🦒 |
|  | みかん | mikan | mandarin | 🍊 |
|  | ほん | hon | bok | 📖 |
| **11 (1)** | おかあさん | okaasan | mamma | 👩 |
|  | おとうさん | otousan | pappa | 👨 |
|  | おにいさん | oniisan | storebror | 👦 |
|  | おねえさん | oneesan | storasyster | 👧 |
|  | せんせい | sensei | lärare | 🧑‍🏫 |
| **11 (2)** | ひこうき | hikouki | flygplan | ✈️ |
|  | とけい | tokei | klocka | ⏰ |
|  | ろうそく | rousoku | ljus | 🕯️ |
|  | せっけん | sekken | tvål | 🧼 |
|  | みっつ | mittsu | tre saker | 3️⃣ |
| **12** | りんご | ringo | äpple | 🍎 |
|  | たまご | tamago | ägg | 🥚 |
|  | おにぎり | onigiri | risboll | 🍙 |
|  | ごはん | gohan | ris, mat | 🍚 |
|  | めがね | megane | glasögon | 👓 |
|  | がっこう | gakkou | skola | 🏫 |
| **13** | ぞう | zou | elefant | 🐘 |
|  | みず | mizu | vatten | 💧 |
|  | かぜ | kaze | vind | 💨 |
|  | かぞく | kazoku | familj | 👨‍👩‍👧 |
|  | ちず | chizu | karta | 🗺️ |
|  | ひつじ | hitsuji | får | 🐑 |
| **14 (1)** | ともだち | tomodachi | kompis | 🤝 |
|  | こども | kodomo | barn | 🧒 |
|  | からだ | karada | kropp | 🧍 |
|  | でんわ | denwa | telefon | ☎️ |
|  | まど | mado | fönster | 🪟 |
| **14 (2)** | くだもの | kudamono | frukt | 🍇 |
|  | みどり | midori | grön | 🟢 |
|  | うどん | udon | udon-nudlar | 🍜 |
|  | ふとん | futon | futon (säng) | 🛏️ |
| **15 (1)** | ぶた | buta | gris | 🐷 |
|  | へび | hebi | orm | 🐍 |
|  | えび | ebi | räka | 🦐 |
|  | どうぶつ | doubutsu | djur | 🐾 |
| **15 (2)** | かばん | kaban | väska | 🎒 |
|  | ゆび | yubi | finger | ☝️ |
|  | ぼうし | boushi | mössa | 🧢 |
|  | べんとう | bentou | matlåda | 🍱 |
| **16** | えんぴつ | enpitsu | blyertspenna | ✏️ |
|  | たんぽぽ | tanpopo | maskros | 🌼 |
|  | てんぷら | tenpura | tempura | 🍤 |
|  | さんぽ | sanpo | promenad | 🚶 |
|  | ぴかぴか | pikapika | glänsande | ✨ |
| **17 (1)** | でんしゃ | densha | tåg | 🚃 |
|  | じてんしゃ | jitensha | cykel | 🚲 |
|  | しゃしん | shashin | foto | 📷 |
|  | いしゃ | isha | läkare | 🩺 |
|  | きゅうり | kyuuri | gurka | 🥒 |
| **17 (2)** | きょう | kyou | idag | 📅 |
|  | しゅくだい | shukudai | läxa | 📝 |
|  | としょかん | toshokan | bibliotek | 📚 |
|  | じしょ | jisho | ordbok | 📕 |
| **18** | おちゃ | ocha | grönt te | 🍵 |
|  | おもちゃ | omocha | leksak | 🧸 |
|  | ちょうちょ | choucho | fjäril | 🦋 |
|  | ちゃいろ | chairo | brun | 🟤 |
| **20** | りゅう | ryuu | drake | 🐉 |
|  | りょうり | ryouri | matlagning | 🍳 |
|  | ぎゅうにゅう | gyuunyuu | mjölk | 🥛 |
|  | きんぎょ | kingyo | guldfisk | 🐠 |
|  | ひゃく | hyaku | hundra | 💯 |
| **21** | じゃんけん | janken | sten, sax, påse | ✊ |
|  | びょういん | byouin | sjukhus | 🏥 |
|  | じゅうどう | juudou | judo | 🥋 |
|  | じょうず | jouzu | duktig | 👍 |
|  | たんじょうび | tanjoubi | födelsedag | 🎂 |

### Katakana (84 ord i 17 ordgrupper)

| Efter grupp | Ord | Romaji | Svenska | Bild |
|---|---|---|---|---|
| **5** | アイス | aisu | glass | 🍦 |
|  | ココア | kokoa | varm choklad | ☕ |
|  | テニス | tenisu | tennis | 🎾 |
|  | ネクタイ | nekutai | slips | 👔 |
| **7** | トマト | tomato | tomat | 🍅 |
|  | ハム | hamu | skinka | 🍖 |
|  | ナイフ | naifu | kniv | 🔪 |
|  | マスク | masuku | munskydd | 😷 |
|  | アニメ | anime | anime | 🎬 |
| **9** | カメラ | kamera | kamera | 📸 |
|  | ホテル | hoteru | hotell | 🏨 |
|  | トイレ | toire | toalett | 🚽 |
|  | クリスマス | kurisumasu | jul | 🎄 |
|  | コアラ | koara | koala | 🐨 |
|  | ミルク | miruku | mjölk | 🥛 |
| **10** | メロン | meron | melon | 🍈 |
|  | レモン | remon | citron | 🍋 |
|  | ライオン | raion | lejon | 🦁 |
|  | マラソン | marason | maraton | 🏃 |
|  | アメリカ | amerika | USA | 🗽 |
| **11 (1)** | サッカー | sakkaa | fotboll | ⚽ |
|  | タクシー | takushii | taxi | 🚕 |
|  | ヨーヨー | yooyoo | jojo | 🪀 |
|  | ヨット | yotto | segelbåt | ⛵ |
|  | ラッコ | rakko | havsutter | 🦦 |
| **11 (2)** | カレー | karee | curry | 🍛 |
|  | ホットケーキ | hottokeeki | pannkaka | 🥞 |
|  | セーター | seetaa | tröja | 🧶 |
|  | ネックレス | nekkuresu | halsband | 📿 |
| **12** | ゲーム | geemu | spel | 🎮 |
|  | ギター | gitaa | gitarr | 🎸 |
|  | ゴリラ | gorira | gorilla | 🦍 |
|  | ガム | gamu | tuggummi | 🍬 |
| **13** | チーズ | chiizu | ost | 🧀 |
|  | ザリガニ | zarigani | kräfta | 🦞 |
|  | ゼリー | zerii | gelé | 🍮 |
|  | ジーンズ | jiinzu | jeans | 👖 |
| **14** | サラダ | sarada | sallad | 🥗 |
|  | ドーナツ | doonatsu | munk | 🍩 |
|  | ドア | doa | dörr | 🚪 |
|  | カード | kaado | kort | 🃏 |
|  | ダンス | dansu | dans | 💃 |
| **15 (1)** | バス | basu | buss | 🚌 |
|  | バナナ | banana | banan | 🍌 |
|  | バター | bataa | smör | 🧈 |
|  | ベッド | beddo | säng | 🛏️ |
|  | テレビ | terebi | tv | 📺 |
| **15 (2)** | ボール | booru | boll | 🏀 |
|  | ロボット | robotto | robot | 🤖 |
|  | ゾンビ | zonbi | zombie | 🧟 |
|  | ボタン | botan | knapp | 🔘 |
|  | バイオリン | baiorin | fiol | 🎻 |
| **16 (1)** | パン | pan | bröd | 🍞 |
|  | パンダ | panda | panda | 🐼 |
|  | ペンギン | pengin | pingvin | 🐧 |
|  | ピザ | piza | pizza | 🍕 |
|  | ポテト | poteto | pommes frites | 🍟 |
|  | パイナップル | painappuru | ananas | 🍍 |
| **16 (2)** | ピアノ | piano | piano | 🎹 |
|  | プール | puuru | simbassäng | 🏊 |
|  | ペン | pen | penna | 🖊️ |
|  | プレゼント | purezento | present | 🎁 |
|  | スプーン | supuun | sked | 🥄 |
| **17** | シャツ | shatsu | skjorta | 👕 |
|  | シャワー | shawaa | dusch | 🚿 |
|  | キャンプ | kyanpu | tältläger | ⛺ |
|  | キャベツ | kyabetsu | vitkål | 🥬 |
|  | シャンプー | shanpuu | schampo | 🧴 |
| **18** | チョコレート | chokoreeto | choklad | 🍫 |
|  | チャンピオン | chanpion | mästare | 🏆 |
|  | ニュース | nyuusu | nyheter | 📰 |
|  | メニュー | menyuu | meny | 📋 |
|  | チューリップ | chuurippu | tulpan | 🌷 |
| **21** | ジュース | juusu | juice | 🧃 |
|  | ジャム | jamu | sylt | 🍓 |
|  | ジャケット | jaketto | jacka | 🧥 |
|  | ジャンプ | janpu | hopp | 🤸 |
|  | ギョーザ | gyooza | dumplings | 🥟 |
| **22** | パーティー | paatii | fest | 🎉 |
|  | フォーク | fooku | gaffel | 🍴 |
|  | ソファ | sofa | soffa | 🛋️ |
|  | ジェットコースター | jettokoosutaa | berg-och-dalbana | 🎢 |
|  | フィンランド | finrando | Finland | 🇫🇮 |
|  | スウェーデン | suweeden | Sverige | 🇸🇪 |

## Teknisk design

### Data: `src/curriculum.js` (ny fil)

Filen exporteras på samma sätt som `app-core.js`, som `window.JapaneseCurriculum` i webbläsaren och som `module.exports` i Node.

```js
{
  hiragana: {
    name: 'Hiragana',
    groups: [                        // index 0 = "Grupp 1"
      { items: [{ char: 'あ', romaji: 'a', tip: '' }, ...] },
      { items: [...], teaches: ['っ'] },   // grupp 11
      ...
    ],
    wordGroups: [
      { afterGroup: 1, words: [{ word: 'いえ', romaji: 'ie', meaning: 'hus', emoji: '🏠' }, ...] },
      ...
    ]
  },
  katakana: { ... }
}
```

- `afterGroup` är 1-baserat, precis som "Grupp N" i gränssnittet.
- Katakanans grundrader och grupperna med ゛, ゜ och ゃゅょ skapas ur hiraganan genom att teckenkoden flyttas +0x60, så att tabellerna inte behöver skrivas två gånger. Grupp 11 och grupp 22 skrivs för hand.
- Tipsraderna för grupp 12–22 skapas av en hjälpfunktion i samma fil.

### Ändringar i `src/main.js`

- **Bort:** `HIRAGANA_ROWS`, `KATAKANA_ROWS`, `SIMPLE_WORDS`, `SIMPLE_WORDS_KATAKANA` och `WORD_GROUP_SIZE`.
- **`buildAlphabet`** läser grupperna från kursplanen, och `alphabet.rows` byter namn till `alphabet.groups`. Minnesknepstexten väljs i ordningen `MNEMONIC_OVERRIDES[char]`, sedan postens `tip`, sedan standardtexten.
- **Upplåsning:**
  - En teckengrupp låses upp som i dag.
  - En ordgrupp låses upp när `completedGroups[alphabet][afterGroup - 1]` är sann.
  - Ordgrupper påverkar aldrig upplåsningen av teckengrupper.
- **Grupplistan i Lär dig** visar varje ordgrupp ("⭐ Nya ord" plus några exempelord) direkt efter sin teckengrupp, i stället för samlat sist.
- **Ordkortet** visar emojin stort ovanför ordet.
- **Öva → Enkla ord:**
  - Orden hämtas bara från upplåsta ordgrupper i det valda alfabetet, eller i båda vid Blandat. Alfabetsknapparna visas därför även för ord.
  - Finns färre än 4 olika betydelser visas beskedet: "Klara fler grupper i Lär dig för att låsa upp ord."
- **Lagringsnyckeln** blir `japanskaBarnApp.v2`.
- **Mina framsteg** räknar ut antalet poster från datan i stället för att visa den hårdkodade siffran "/46".
- **Badges** ändras inte. "Hiragana-mästare" kräver därmed nivå 3+ på alla 108 hiraganaposter. Fler och bättre badges hör till #20.
- `index.html` laddar `curriculum.js` före `main.js`.

### Tester

**Ny fil, `test/curriculum.test.js`.** Den bygger på valideringsskriptet som kontrollerade den här specen och testar att:
- romajin stämmer med kanan för alla ord och alla poster i grupp 11
- varje ord bara innehåller tecken som lärts ut i grupp ≤ `afterGroup`
- ord med långa vokaler (aa, ii, uu, ee, oo, ou, ei) har `afterGroup` ≥ 11
- ingen lektionspost förekommer i mer än en grupp, och inget ord, ingen betydelse och ingen emoji förekommer två gånger inom ett alfabet
- varje ordgrupp har 4–6 ord.

**`test/main.test.js`.** Testselen laddar också `curriculum.js`. Nya tester kontrollerar att:
- en ordgrupp är låst innan dess teckengrupp är klar och öppen efteråt
- nästa teckengrupp öppnas även om ordgruppen inte är gjord
- ordgruppskortet ligger direkt efter sin teckengrupp i grupplistan
- Öva → Enkla ord bara använder upplåsta ord, och visar beskedet när inga ord finns.

Det befintliga testet för ljudknappen läser det förväntade ordet ur kursplanen i stället för att ha det hårdkodat.

## Utanför scope

- **#10** Romaji-guide för svenska barn.
- **#12** Bildquiz. Här visas bara emojin.
- **#13** Nya minnesknep för grundtecknen.
- **#15** Resten av ärendet: dölja romaji och spara framsteg per ord.
- **#6** Ändringar i repetitionssystemet.
