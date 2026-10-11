# Kursplan och ordlistor – implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ersätta de gamla ordlistorna och radtabellerna med en kursplan med 21 grupper i hiragana och 22 i katakana. Varje ordgrupp ska låsas upp direkt efter sin teckengrupp.

**Architecture:** All kursdata flyttar till en ny fil, `src/curriculum.js`. Den följer samma mönster som `app-core.js`, alltså `window.JapaneseCurriculum` i webbläsaren och `module.exports` i Node. `main.js` läser grupper och ordgrupper därifrån. Ren upplåsningslogik läggs i `app-core.js`. Datatester garanterar att varje ord bara innehåller tecken som har lärts ut.

**Tech Stack:** Statisk HTML/CSS/JS utan beroenden. Tester körs med Nodes inbyggda testrunner (`npm test` kör `node --test`), och `main.js` testas i en `vm`-sandlåda med en enkel DOM-stubbe.

**Spec:** `docs/superpowers/specs/2026-10-11-kursplan-och-ordlistor-design.md`

## Global Constraints

- Inga nya beroenden. `npm test` (`node --test`) ska vara grön efter varje task.
- Koden i `src/` skrivs som befintlig kod: `function () {}`, `const`/`let`, strängkonkatenering för HTML och UMD-mönstret `(function (globalScope) { … })(typeof window !== 'undefined' ? window : globalThis)`.
- All text i gränssnittet är på svenska.
- Lagringsnyckeln är `japanskaBarnApp.v2`. Gammal data under `v1` ignoreras.
- Romajin följer kanan: おう skrivs ou, えい skrivs ei, ー blir dubbel vokal, ん skrivs alltid n och っ dubblar konsonanten.
- `afterGroup` är 1-baserat, precis som "Grupp N" i gränssnittet. Varje ordgrupp har 4–6 ord.
- Ordgrupper är frivilliga och påverkar aldrig upplåsningen av teckengrupper.

## Review Focus

1. **Blandad teckenövning med kombinationer** som finns i båda alfabeten (きゃ/キャ = kya) ska ge fyra unika svarsalternativ. Test i Task 2.
2. **Framsteg sparade under den gamla nyckeln `v1`** ska ignoreras: appen startar från noll utan att krascha. Test i Task 2.
3. **Miniquizen för grupper med 3 tecken** (や, わ, だ) ska fortfarande ge 4 svarsalternativ, med påfyllning från tidigare grupper. Test i Task 2.
4. **Öva → Enkla ord → Blandat** ska ta med upplåsta katakanaord, inte bara hiragana. Test i Task 3.
5. **Ljudknappen i en katakana-ordgrupp** ska säga katakanaordet på kortet. Test i Task 3.

## Filöversikt

| Fil | Ansvar | Task |
|---|---|---|
| `src/curriculum.js` (ny) | Teckengrupper, ordgrupper och genererade tipsrader | 1 |
| `test/curriculum.test.js` (ny) | Datavalidering och tipsrader | 1 |
| `src/app-core.js` | `isWordGroupUnlocked` (ren funktion) | 3 |
| `test/app-core.test.js` | Test av `isWordGroupUnlocked` | 3 |
| `src/main.js` | Läser kursplanen, sköter upplåsning, grupplista, ordkort och ordövning | 2, 3 |
| `test/main.test.js` | Testselen laddar kursplanen, plus beteendetester | 2, 3 |
| `index.html` | Laddar `curriculum.js` | 2 |
| `styles.css` | Stil för ordgruppskort och emoji | 3 |

---

### Task 0: Committa spec och plan

- [ ] **Step 1: Commit**

```bash
git add docs/superpowers/specs/2026-10-11-kursplan-och-ordlistor-design.md docs/superpowers/plans/2026-10-11-kursplan-och-ordlistor.md
git commit -m "Spec och plan för kursplan och ordlistor"
```

---

### Task 1: Kursplanefil med datatester

**Files:**
- Create: `src/curriculum.js`
- Create: `test/curriculum.test.js`

**Interfaces:**
- Consumes: ingenting.
- Produces: `JapaneseCurriculum` (`require('../src/curriculum.js')` i Node), med formen:
  ```
  { hiragana: { name: 'Hiragana', groups: Group[21], wordGroups: WordGroup[25] },
    katakana: { name: 'Katakana', groups: Group[22], wordGroups: WordGroup[17] } }
  Group     = { items: { char: string, romaji: string, tip: string }[], teaches?: string[] }
  WordGroup = { afterGroup: number /* 1-baserat */, words: { word, romaji, meaning, emoji }[] }
  ```
  - `groups[10]` (Grupp 11) är regelgruppen och har `teaches`: `['っ']` i hiragana och `['ッ', 'ー']` i katakana.
  - `tip` är tom för grundtecknen. För grupp 11–22 innehåller den en färdig tipsrad.

- [ ] **Step 1: Skriv de fallerande testerna**

Skapa `test/curriculum.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/curriculum.js');

const SMALL_KANA = new Set(Array.from('ゃゅょャュョァィゥェォ'));
const LONG_VOWEL = /aa|ii|uu|ee|oo|ou|ei/;
const RULE_GROUP = 11;

// Splits text into readable units: a kana plus any small kana that follows it.
function splitUnits(text) {
  const chars = Array.from(text);
  const units = [];
  chars.forEach((ch) => {
    if (SMALL_KANA.has(ch) && units.length) {
      units[units.length - 1] += ch;
    } else {
      units.push(ch);
    }
  });
  return units;
}

function indexUnits(alphabet) {
  const groupOf = {};
  const romajiOf = {};
  alphabet.groups.forEach((group, index) => {
    if (group.teaches) {
      group.teaches.forEach((unit) => {
        groupOf[unit] = index + 1;
      });
      return;
    }
    group.items.forEach((item) => {
      groupOf[item.char] = index + 1;
      romajiOf[item.char] = item.romaji;
    });
  });
  return { groupOf, romajiOf };
}

function romanize(text, romajiOf) {
  const units = splitUnits(text);
  let out = '';
  units.forEach((unit, i) => {
    if (unit === 'っ' || unit === 'ッ') {
      const next = romajiOf[units[i + 1]] || '?';
      out += next[0] === 'c' ? 't' : next[0];
    } else if (unit === 'ー') {
      out += out[out.length - 1];
    } else {
      out += unit in romajiOf ? romajiOf[unit] : '?' + unit + '?';
    }
  });
  return out;
}

function allWords(alphabet) {
  return alphabet.wordGroups.flatMap((group) => group.words.map((word) => ({ afterGroup: group.afterGroup, ...word })));
}

test('hiragana has 21 lesson groups with 108 items', () => {
  const groups = curriculum.hiragana.groups;
  assert.equal(groups.length, 21);
  assert.equal(groups.reduce((n, group) => n + group.items.length, 0), 108);
});

test('katakana has 22 lesson groups with 115 items', () => {
  const groups = curriculum.katakana.groups;
  assert.equal(groups.length, 22);
  assert.equal(groups.reduce((n, group) => n + group.items.length, 0), 115);
});

test('voiced kana tips name the base kana and the sound change', () => {
  const groups = curriculum.hiragana.groups;
  assert.equal(groups[11].items[0].tip, 'か + ゛ = が: k blir g.');
  assert.equal(groups[12].items[1].tip, 'し + ゛ = じ: s blir z (uttalas ji).');
  assert.equal(groups[15].items[0].tip, 'は + ゜ = ぱ: h blir p.');
});

test('combination tips explain how to say the sound', () => {
  assert.equal(curriculum.hiragana.groups[16].items[0].tip, 'き + litet ゃ = きゃ: säg ki-a snabbt, så blir det kya.');
  assert.equal(curriculum.katakana.groups[16].items[3].tip, 'シ + litet ャ = シャ: säg shi-a snabbt, så blir det sha.');
});

test('loanword sound tips show how the small kana combines', () => {
  assert.equal(curriculum.katakana.groups[21].items[0].tip, 'テ + liten ィ = ティ (ti). Ljudet finns bara i lånord.');
});

['hiragana', 'katakana'].forEach((alphabetId) => {
  const alphabet = curriculum[alphabetId];
  const { groupOf, romajiOf } = indexUnits(alphabet);

  test(alphabetId + ': rule group items have romaji that matches their kana', () => {
    const wrong = alphabet.groups[RULE_GROUP - 1].items
      .filter((item) => romanize(item.char, romajiOf) !== item.romaji)
      .map((item) => item.char);
    assert.deepEqual(wrong, []);
  });

  test(alphabetId + ': every word has romaji that matches its kana', () => {
    const wrong = allWords(alphabet)
      .filter((word) => romanize(word.word, romajiOf) !== word.romaji)
      .map((word) => word.word + ' ' + word.romaji + ' (väntat ' + romanize(word.word, romajiOf) + ')');
    assert.deepEqual(wrong, []);
  });

  test(alphabetId + ': every word only uses kana taught up to its group', () => {
    const tooEarly = allWords(alphabet)
      .filter((word) => Math.max(...splitUnits(word.word).map((unit) => groupOf[unit] || Infinity)) > word.afterGroup)
      .map((word) => word.word);
    assert.deepEqual(tooEarly, []);
  });

  test(alphabetId + ': words with long vowels come after the rule group', () => {
    const tooEarly = allWords(alphabet)
      .filter((word) => LONG_VOWEL.test(word.romaji) && word.afterGroup < RULE_GROUP)
      .map((word) => word.word);
    assert.deepEqual(tooEarly, []);
  });

  test(alphabetId + ': lesson items, words, meanings and emoji are never repeated', () => {
    const items = alphabet.groups.flatMap((group) => group.items.map((item) => item.char));
    const words = allWords(alphabet);
    [items, words.map((w) => w.word), words.map((w) => w.meaning), words.map((w) => w.emoji)].forEach((values) => {
      const repeated = values.filter((value, i) => values.indexOf(value) !== i);
      assert.deepEqual(repeated, []);
    });
  });

  test(alphabetId + ': every word group has 4 to 6 words and follows an existing group', () => {
    alphabet.wordGroups.forEach((group) => {
      assert.ok(group.words.length >= 4 && group.words.length <= 6, 'storlek ' + group.words.length);
      assert.ok(group.afterGroup >= 1 && group.afterGroup <= alphabet.groups.length, 'afterGroup ' + group.afterGroup);
    });
  });
});
```

- [ ] **Step 2: Kör testerna och se dem fallera**

Run: `node --test test/curriculum.test.js`
Expected: FAIL med `Cannot find module '../src/curriculum.js'`.

- [ ] **Step 3: Skapa kursplanefilen**

Skapa `src/curriculum.js`. Ordlistorna är exakt de som godkändes i specen.

```js
(function (globalScope) {
  // Each lesson row is written as '<kana><romaji>' tokens. Katakana rows are derived from these.
  const BASE_ROWS = [
    'あa いi うu えe おo',
    'かka きki くku けke こko',
    'さsa しshi すsu せse そso',
    'たta ちchi つtsu てte とto',
    'なna にni ぬnu ねne のno',
    'はha ひhi ふfu へhe ほho',
    'まma みmi むmu めme もmo',
    'やya ゆyu よyo',
    'らra りri るru れre ろro',
    'わwa をwo んn'
  ];

  // ぢ and づ are left out on purpose: they sound exactly like じ and ず.
  const VOICED_ROWS = [
    { row: 'がga ぎgi ぐgu げge ごgo', mark: '゛', change: 'k blir g' },
    { row: 'ざza じji ずzu ぜze ぞzo', mark: '゛', change: 's blir z' },
    { row: 'だda でde どdo', mark: '゛', change: 't blir d' },
    { row: 'ばba びbi ぶbu べbe ぼbo', mark: '゛', change: 'h blir b' },
    { row: 'ぱpa ぴpi ぷpu ぺpe ぽpo', mark: '゜', change: 'h blir p' }
  ];

  const COMBO_ROWS = [
    'きゃkya きゅkyu きょkyo しゃsha しゅshu しょsho',
    'ちゃcha ちゅchu ちょcho にゃnya にゅnyu にょnyo',
    'ひゃhya ひゅhyu ひょhyo みゃmya みゅmyu みょmyo',
    'りゃrya りゅryu りょryo ぎゃgya ぎゅgyu ぎょgyo',
    'じゃja じゅju じょjo びゃbya びゅbyu びょbyo ぴゃpya ぴゅpyu ぴょpyo'
  ];

  const LOANWORD_ROW = 'ティti ディdi ファfa フィfi フォfo ジェje ウェwe';

  // Group 11 teaches a rule (small っ and long vowels) through word pairs instead of new shapes.
  const HIRAGANA_RULE_ITEMS = [
    { char: 'きて', romaji: 'kite', tip: "Betyder 'kom!'. Jämför med きって." },
    { char: 'きって', romaji: 'kitte', tip: 'Lilla っ gör en kort paus: ki–tte. Betyder frimärke.' },
    { char: 'いえ', romaji: 'ie', tip: 'Betyder hus. Jämför med いいえ.' },
    { char: 'いいえ', romaji: 'iie', tip: 'Dubbla い ger ett långt i: i-i-e. Betyder nej.' },
    { char: 'ゆき', romaji: 'yuki', tip: 'Betyder snö. Jämför med ゆうき.' },
    { char: 'ゆうき', romaji: 'yuuki', tip: 'Med ett う efter blir ljudet längre: yu-u-ki. Betyder mod.' }
  ];

  const KATAKANA_RULE_ITEMS = [
    { char: 'ケーキ', romaji: 'keeki', tip: 'ー gör ljudet före längre: ke-e-ki. Betyder tårta.' },
    { char: 'ノート', romaji: 'nooto', tip: 'ー förlänger o: no-o-to. Betyder anteckningsbok.' },
    { char: 'スキー', romaji: 'sukii', tip: 'ー förlänger i: su-ki-i. Betyder skidor.' },
    { char: 'コーヒー', romaji: 'koohii', tip: 'Två ー: ko-o-hi-i. Betyder kaffe.' },
    { char: 'ロケット', romaji: 'roketto', tip: 'Lilla ッ gör en kort paus före t: roke–tto. Betyder raket.' },
    { char: 'ホッケー', romaji: 'hokkee', tip: 'ッ ger en paus och ー förlänger: ho–kke-e. Betyder hockey.' }
  ];

  function words(afterGroup, list) {
    return {
      afterGroup: afterGroup,
      words: list.map(function (entry) {
        return { word: entry[0], romaji: entry[1], meaning: entry[2], emoji: entry[3] };
      })
    };
  }

  const HIRAGANA_WORD_GROUPS = [
    words(1, [
      ['いえ', 'ie', 'hus', '🏠'],
      ['あお', 'ao', 'blå', '🔵'],
      ['うえ', 'ue', 'upp', '⬆️'],
      ['え', 'e', 'bild', '🖼️']
    ]),
    words(2, [
      ['き', 'ki', 'träd', '🌳'],
      ['あか', 'aka', 'röd', '🔴'],
      ['かお', 'kao', 'ansikte', '😊'],
      ['えき', 'eki', 'station', '🚉'],
      ['こえ', 'koe', 'röst', '🗣️']
    ]),
    words(3, [
      ['すし', 'sushi', 'sushi', '🍣'],
      ['おかし', 'okashi', 'godis', '🍬'],
      ['うし', 'ushi', 'ko', '🐄'],
      ['いす', 'isu', 'stol', '🪑'],
      ['かさ', 'kasa', 'paraply', '☂️'],
      ['すいか', 'suika', 'vattenmelon', '🍉']
    ]),
    words(4, [
      ['て', 'te', 'hand', '✋'],
      ['くち', 'kuchi', 'mun', '👄'],
      ['あし', 'ashi', 'fot', '🦶'],
      ['たこ', 'tako', 'bläckfisk', '🐙'],
      ['ちかてつ', 'chikatetsu', 'tunnelbana', '🚇']
    ]),
    words(5, [
      ['いぬ', 'inu', 'hund', '🐶'],
      ['ねこ', 'neko', 'katt', '🐱'],
      ['さかな', 'sakana', 'fisk', '🐟'],
      ['にく', 'niku', 'kött', '🥩'],
      ['きのこ', 'kinoko', 'svamp', '🍄'],
      ['なつ', 'natsu', 'sommar', '☀️']
    ]),
    words(6, [
      ['はな', 'hana', 'blomma', '🌷'],
      ['ほし', 'hoshi', 'stjärna', '⭐'],
      ['ふね', 'fune', 'båt', '🚢'],
      ['ひ', 'hi', 'eld', '🔥'],
      ['ふく', 'fuku', 'kläder', '👕']
    ]),
    words(7, [
      ['め', 'me', 'öga', '👁️'],
      ['みみ', 'mimi', 'öra', '👂'],
      ['くま', 'kuma', 'björn', '🐻'],
      ['うみ', 'umi', 'hav', '🌊'],
      ['あめ', 'ame', 'regn', '🌧️'],
      ['むし', 'mushi', 'insekt', '🐛']
    ]),
    words(8, [
      ['やま', 'yama', 'berg', '⛰️'],
      ['ゆき', 'yuki', 'snö', '❄️'],
      ['ゆめ', 'yume', 'dröm', '💭'],
      ['やさい', 'yasai', 'grönsaker', '🥦'],
      ['もも', 'momo', 'persika', '🍑']
    ]),
    words(9, [
      ['さる', 'saru', 'apa', '🐒'],
      ['とり', 'tori', 'fågel', '🐦'],
      ['りす', 'risu', 'ekorre', '🐿️'],
      ['かえる', 'kaeru', 'groda', '🐸'],
      ['くるま', 'kuruma', 'bil', '🚗']
    ]),
    words(9, [
      ['そら', 'sora', 'himmel', '🌤️'],
      ['しろ', 'shiro', 'vit', '⚪'],
      ['くろ', 'kuro', 'svart', '⚫'],
      ['さくら', 'sakura', 'körsbärsblomma', '🌸'],
      ['よる', 'yoru', 'natt', '🌙'],
      ['いろ', 'iro', 'färg', '🎨']
    ]),
    words(10, [
      ['わに', 'wani', 'krokodil', '🐊'],
      ['にわとり', 'niwatori', 'höna', '🐔'],
      ['きりん', 'kirin', 'giraff', '🦒'],
      ['みかん', 'mikan', 'mandarin', '🍊'],
      ['ほん', 'hon', 'bok', '📖']
    ]),
    words(11, [
      ['おかあさん', 'okaasan', 'mamma', '👩'],
      ['おとうさん', 'otousan', 'pappa', '👨'],
      ['おにいさん', 'oniisan', 'storebror', '👦'],
      ['おねえさん', 'oneesan', 'storasyster', '👧'],
      ['せんせい', 'sensei', 'lärare', '🧑‍🏫']
    ]),
    words(11, [
      ['ひこうき', 'hikouki', 'flygplan', '✈️'],
      ['とけい', 'tokei', 'klocka', '⏰'],
      ['ろうそく', 'rousoku', 'ljus', '🕯️'],
      ['せっけん', 'sekken', 'tvål', '🧼'],
      ['みっつ', 'mittsu', 'tre saker', '3️⃣']
    ]),
    words(12, [
      ['りんご', 'ringo', 'äpple', '🍎'],
      ['たまご', 'tamago', 'ägg', '🥚'],
      ['おにぎり', 'onigiri', 'risboll', '🍙'],
      ['ごはん', 'gohan', 'ris, mat', '🍚'],
      ['めがね', 'megane', 'glasögon', '👓'],
      ['がっこう', 'gakkou', 'skola', '🏫']
    ]),
    words(13, [
      ['ぞう', 'zou', 'elefant', '🐘'],
      ['みず', 'mizu', 'vatten', '💧'],
      ['かぜ', 'kaze', 'vind', '💨'],
      ['かぞく', 'kazoku', 'familj', '👨‍👩‍👧'],
      ['ちず', 'chizu', 'karta', '🗺️'],
      ['ひつじ', 'hitsuji', 'får', '🐑']
    ]),
    words(14, [
      ['ともだち', 'tomodachi', 'kompis', '🤝'],
      ['こども', 'kodomo', 'barn', '🧒'],
      ['からだ', 'karada', 'kropp', '🧍'],
      ['でんわ', 'denwa', 'telefon', '☎️'],
      ['まど', 'mado', 'fönster', '🪟']
    ]),
    words(14, [
      ['くだもの', 'kudamono', 'frukt', '🍇'],
      ['みどり', 'midori', 'grön', '🟢'],
      ['うどん', 'udon', 'udon-nudlar', '🍜'],
      ['ふとん', 'futon', 'futon (säng)', '🛏️']
    ]),
    words(15, [
      ['ぶた', 'buta', 'gris', '🐷'],
      ['へび', 'hebi', 'orm', '🐍'],
      ['えび', 'ebi', 'räka', '🦐'],
      ['どうぶつ', 'doubutsu', 'djur', '🐾']
    ]),
    words(15, [
      ['かばん', 'kaban', 'väska', '🎒'],
      ['ゆび', 'yubi', 'finger', '☝️'],
      ['ぼうし', 'boushi', 'mössa', '🧢'],
      ['べんとう', 'bentou', 'matlåda', '🍱']
    ]),
    words(16, [
      ['えんぴつ', 'enpitsu', 'blyertspenna', '✏️'],
      ['たんぽぽ', 'tanpopo', 'maskros', '🌼'],
      ['てんぷら', 'tenpura', 'tempura', '🍤'],
      ['さんぽ', 'sanpo', 'promenad', '🚶'],
      ['ぴかぴか', 'pikapika', 'glänsande', '✨']
    ]),
    words(17, [
      ['でんしゃ', 'densha', 'tåg', '🚃'],
      ['じてんしゃ', 'jitensha', 'cykel', '🚲'],
      ['しゃしん', 'shashin', 'foto', '📷'],
      ['いしゃ', 'isha', 'läkare', '🩺'],
      ['きゅうり', 'kyuuri', 'gurka', '🥒']
    ]),
    words(17, [
      ['きょう', 'kyou', 'idag', '📅'],
      ['しゅくだい', 'shukudai', 'läxa', '📝'],
      ['としょかん', 'toshokan', 'bibliotek', '📚'],
      ['じしょ', 'jisho', 'ordbok', '📕']
    ]),
    words(18, [
      ['おちゃ', 'ocha', 'te', '🍵'],
      ['おもちゃ', 'omocha', 'leksak', '🧸'],
      ['ちょうちょ', 'choucho', 'fjäril', '🦋'],
      ['ちゃいろ', 'chairo', 'brun', '🟤']
    ]),
    words(20, [
      ['りゅう', 'ryuu', 'drake', '🐉'],
      ['りょうり', 'ryouri', 'matlagning', '🍳'],
      ['ぎゅうにゅう', 'gyuunyuu', 'mjölk', '🥛'],
      ['きんぎょ', 'kingyo', 'guldfisk', '🐠'],
      ['ひゃく', 'hyaku', 'hundra', '💯']
    ]),
    words(21, [
      ['じゃんけん', 'janken', 'sten, sax, påse', '✊'],
      ['びょういん', 'byouin', 'sjukhus', '🏥'],
      ['じゅうどう', 'juudou', 'judo', '🥋'],
      ['じょうず', 'jouzu', 'duktig', '👍'],
      ['たんじょうび', 'tanjoubi', 'födelsedag', '🎂']
    ])
  ];

  const KATAKANA_WORD_GROUPS = [
    words(5, [
      ['アイス', 'aisu', 'glass', '🍦'],
      ['ココア', 'kokoa', 'varm choklad', '☕'],
      ['テニス', 'tenisu', 'tennis', '🎾'],
      ['ネクタイ', 'nekutai', 'slips', '👔']
    ]),
    words(7, [
      ['トマト', 'tomato', 'tomat', '🍅'],
      ['ハム', 'hamu', 'skinka', '🍖'],
      ['ナイフ', 'naifu', 'kniv', '🔪'],
      ['マスク', 'masuku', 'munskydd', '😷'],
      ['アニメ', 'anime', 'anime', '🎬']
    ]),
    words(9, [
      ['カメラ', 'kamera', 'kamera', '📸'],
      ['ホテル', 'hoteru', 'hotell', '🏨'],
      ['トイレ', 'toire', 'toalett', '🚽'],
      ['クリスマス', 'kurisumasu', 'jul', '🎄'],
      ['コアラ', 'koara', 'koala', '🐨'],
      ['ミルク', 'miruku', 'mjölk', '🥛']
    ]),
    words(10, [
      ['メロン', 'meron', 'melon', '🍈'],
      ['レモン', 'remon', 'citron', '🍋'],
      ['ライオン', 'raion', 'lejon', '🦁'],
      ['マラソン', 'marason', 'maraton', '🏃'],
      ['アメリカ', 'amerika', 'USA', '🗽']
    ]),
    words(11, [
      ['サッカー', 'sakkaa', 'fotboll', '⚽'],
      ['タクシー', 'takushii', 'taxi', '🚕'],
      ['ヨーヨー', 'yooyoo', 'jojo', '🪀'],
      ['ヨット', 'yotto', 'segelbåt', '⛵'],
      ['ラッコ', 'rakko', 'havsutter', '🦦']
    ]),
    words(11, [
      ['カレー', 'karee', 'curry', '🍛'],
      ['ホットケーキ', 'hottokeeki', 'pannkaka', '🥞'],
      ['セーター', 'seetaa', 'tröja', '🧶'],
      ['ネックレス', 'nekkuresu', 'halsband', '📿']
    ]),
    words(12, [
      ['ゲーム', 'geemu', 'spel', '🎮'],
      ['ギター', 'gitaa', 'gitarr', '🎸'],
      ['ゴリラ', 'gorira', 'gorilla', '🦍'],
      ['ガム', 'gamu', 'tuggummi', '🍬']
    ]),
    words(13, [
      ['チーズ', 'chiizu', 'ost', '🧀'],
      ['ザリガニ', 'zarigani', 'kräfta', '🦞'],
      ['ゼリー', 'zerii', 'gelé', '🍮'],
      ['ジーンズ', 'jiinzu', 'jeans', '👖']
    ]),
    words(14, [
      ['サラダ', 'sarada', 'sallad', '🥗'],
      ['ドーナツ', 'doonatsu', 'munk', '🍩'],
      ['ドア', 'doa', 'dörr', '🚪'],
      ['カード', 'kaado', 'kort', '🃏'],
      ['ダンス', 'dansu', 'dans', '💃']
    ]),
    words(15, [
      ['バス', 'basu', 'buss', '🚌'],
      ['バナナ', 'banana', 'banan', '🍌'],
      ['バター', 'bataa', 'smör', '🧈'],
      ['ベッド', 'beddo', 'säng', '🛏️'],
      ['テレビ', 'terebi', 'tv', '📺']
    ]),
    words(15, [
      ['ボール', 'booru', 'boll', '🏀'],
      ['ロボット', 'robotto', 'robot', '🤖'],
      ['ゾンビ', 'zonbi', 'zombie', '🧟'],
      ['ボタン', 'botan', 'knapp', '🔘'],
      ['バイオリン', 'baiorin', 'fiol', '🎻']
    ]),
    words(16, [
      ['パン', 'pan', 'bröd', '🍞'],
      ['パンダ', 'panda', 'panda', '🐼'],
      ['ペンギン', 'pengin', 'pingvin', '🐧'],
      ['ピザ', 'piza', 'pizza', '🍕'],
      ['ポテト', 'poteto', 'pommes frites', '🍟'],
      ['パイナップル', 'painappuru', 'ananas', '🍍']
    ]),
    words(16, [
      ['ピアノ', 'piano', 'piano', '🎹'],
      ['プール', 'puuru', 'simbassäng', '🏊'],
      ['ペン', 'pen', 'penna', '🖊️'],
      ['プレゼント', 'purezento', 'present', '🎁'],
      ['スプーン', 'supuun', 'sked', '🥄']
    ]),
    words(17, [
      ['シャツ', 'shatsu', 'skjorta', '👕'],
      ['シャワー', 'shawaa', 'dusch', '🚿'],
      ['キャンプ', 'kyanpu', 'tältläger', '⛺'],
      ['キャベツ', 'kyabetsu', 'vitkål', '🥬'],
      ['シャンプー', 'shanpuu', 'schampo', '🧴']
    ]),
    words(18, [
      ['チョコレート', 'chokoreeto', 'choklad', '🍫'],
      ['チャンピオン', 'chanpion', 'mästare', '🏆'],
      ['ニュース', 'nyuusu', 'nyheter', '📰'],
      ['メニュー', 'menyuu', 'meny', '📋'],
      ['チューリップ', 'chuurippu', 'tulpan', '🌷']
    ]),
    words(21, [
      ['ジュース', 'juusu', 'juice', '🧃'],
      ['ジャム', 'jamu', 'sylt', '🍓'],
      ['ジャケット', 'jaketto', 'jacka', '🧥'],
      ['ジャンプ', 'janpu', 'hopp', '🤸'],
      ['ギョーザ', 'gyooza', 'dumplings', '🥟']
    ]),
    words(22, [
      ['パーティー', 'paatii', 'fest', '🎉'],
      ['フォーク', 'fooku', 'gaffel', '🍴'],
      ['ソファ', 'sofa', 'soffa', '🛋️'],
      ['ジェットコースター', 'jettokoosutaa', 'berg-och-dalbana', '🎢'],
      ['フィンランド', 'finrando', 'Finland', '🇫🇮'],
      ['スウェーデン', 'suweeden', 'Sverige', '🇸🇪']
    ])
  ];

  function toKatakana(text) {
    return Array.from(text).map(function (ch) {
      const code = ch.charCodeAt(0);
      return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch;
    }).join('');
  }

  function keepAsIs(text) {
    return text;
  }

  function parseRow(row) {
    return row.split(' ').map(function (token) {
      const match = token.match(/^([^a-z]+)([a-z]+)$/);
      return { char: match[1], romaji: match[2], tip: '' };
    });
  }

  function voicedTip(item, mark, change) {
    const base = String.fromCharCode(item.char.charCodeAt(0) - (mark === '゛' ? 1 : 2));
    const extra = item.romaji === 'ji' ? ' (uttalas ji)' : '';
    return base + ' + ' + mark + ' = ' + item.char + ': ' + change + extra + '.';
  }

  function comboTip(item, romajiOf) {
    const first = item.char[0];
    const vowel = item.romaji.slice(-1);
    return first + ' + litet ' + item.char[1] + ' = ' + item.char + ': säg ' + romajiOf[first] + '-' + vowel + ' snabbt, så blir det ' + item.romaji + '.';
  }

  function loanwordTip(item) {
    return item.char[0] + ' + liten ' + item.char[1] + ' = ' + item.char + ' (' + item.romaji + '). Ljudet finns bara i lånord.';
  }

  function buildKanaGroups(convert, ruleGroup) {
    const base = BASE_ROWS.map(function (row) {
      return { items: parseRow(convert(row)) };
    });
    const voiced = VOICED_ROWS.map(function (entry) {
      return {
        items: parseRow(convert(entry.row)).map(function (item) {
          item.tip = voicedTip(item, entry.mark, entry.change);
          return item;
        })
      };
    });
    const romajiOf = {};
    base.concat(voiced).forEach(function (group) {
      group.items.forEach(function (item) {
        romajiOf[item.char] = item.romaji;
      });
    });
    const combo = COMBO_ROWS.map(function (row) {
      return {
        items: parseRow(convert(row)).map(function (item) {
          item.tip = comboTip(item, romajiOf);
          return item;
        })
      };
    });
    return base.concat([ruleGroup], voiced, combo);
  }

  const curriculum = {
    hiragana: {
      name: 'Hiragana',
      groups: buildKanaGroups(keepAsIs, { items: HIRAGANA_RULE_ITEMS, teaches: ['っ'] }),
      wordGroups: HIRAGANA_WORD_GROUPS
    },
    katakana: {
      name: 'Katakana',
      groups: buildKanaGroups(toKatakana, { items: KATAKANA_RULE_ITEMS, teaches: ['ッ', 'ー'] }).concat([{
        items: parseRow(LOANWORD_ROW).map(function (item) {
          item.tip = loanwordTip(item);
          return item;
        })
      }]),
      wordGroups: KATAKANA_WORD_GROUPS
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
  }
  globalScope.JapaneseCurriculum = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Kör testerna och se dem passera**

Run: `npm test`
Expected: PASS för alla tester, varav 17 nya i `test/curriculum.test.js`. De befintliga testerna påverkas inte.

- [ ] **Step 5: Commit**

```bash
git add src/curriculum.js test/curriculum.test.js
git commit -m "Lägg till kursplanefil med teckengrupper och ordlistor"
```

---

### Task 2: `main.js` läser teckengrupperna från kursplanen

**Files:**
- Modify: `index.html` (scripttaggarna)
- Modify: `src/main.js`. Berörs: `STORAGE_KEY`, `HIRAGANA_ROWS` och `KATAKANA_ROWS` (tas bort), `ALPHABETS`/`buildAlphabet`, `createInitialState`, `startLearnQuiz`, `findCharBySymbol` (tas bort), `goNextLearnCard`, `renderLearn`, `renderProgress` och klickhanteraren för `learn-speak`.
- Test: `test/main.test.js`

**Interfaces:**
- Consumes: `window.JapaneseCurriculum` från Task 1.
- Produces: `ALPHABETS[id]` har formen `{ name, groups: CharObj[][], chars: CharObj[] }`, där `CharObj = { char, romaji, mnemonic, tip }`. `alphabet.rows` finns inte längre. Task 3 lägger till `wordGroups` på samma objekt.

- [ ] **Step 1: Uppdatera testselen**

Ändra i `test/main.test.js`:

1. Lägg till importen överst, efter `const vm = require('node:vm');`:
```js
const curriculum = require('../src/curriculum.js');
```

2. Byt nyckeln:
```js
const STORAGE_KEY = 'japanskaBarnApp.v2';
```

3. Ersätt de första raderna i `loadApp` så att den tar emot extra lagringsposter:
```js
function loadApp(savedState, extraStorage) {
  const storage = { ...extraStorage };
  if (savedState) {
    storage[STORAGE_KEY] = JSON.stringify(savedState);
  }
```

4. Ladda kursplanen före `main.js`:
```js
  ['src/app-core.js', 'src/curriculum.js', 'src/main.js'].forEach((file) => {
```

- [ ] **Step 2: Skriv de fallerande testerna**

Lägg till sist i `test/main.test.js`:

```js
test('a combination group card shows the generated tip', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 16, cardIndex: 0 } });
  app.click('go-learn');

  assert.match(app.html(), /き \+ litet ゃ = きゃ/);
});

test('the rule group card shows its own tip', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 10, cardIndex: 0 } });
  app.click('go-learn');

  assert.match(app.html(), /Jämför med きって/);
});

test('progress view counts every hiragana lesson item', () => {
  const app = loadApp();
  app.click('go-progress');

  assert.match(app.html(), /Hiragana 0\/108/);
});

test('learn quiz for a three-item group still offers four options', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 7, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  app.state().learn.quiz.questions.forEach((question) => {
    assert.equal(question.options.length, 4);
  });
});

test('learn quiz for the rule group takes its options from the same group', () => {
  const ruleRomaji = curriculum.hiragana.groups[10].items.map((item) => item.romaji);
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 10, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  app.state().learn.quiz.questions.forEach((question) => {
    question.options.forEach((option) => assert.ok(ruleRomaji.includes(option), option));
  });
});

test('progress saved under the old storage key is ignored', () => {
  const oldProgress = { completedGroups: { hiragana: [true, true, true] } };
  const app = loadApp(null, { 'japanskaBarnApp.v1': JSON.stringify(oldProgress) });
  app.click('go-learn');
  app.click('pick-group', { groupIndex: '2' });

  assert.equal(app.state().learn.groupIndex, 0);
});

test('mixed practice options stay unique for combinations found in both alphabets', () => {
  const app = loadApp({
    practice: { alphabet: 'mixed', level: 'chars', mode: 'char_to_romaji' },
    seenChars: {
      hiragana: { きゃ: true, きゅ: true, きょ: true, しゃ: true },
      katakana: { キャ: true, キュ: true, キョ: true, シャ: true }
    }
  });
  app.click('go-practice');
  app.click('start-practice');

  app.state().practice.session.questions.forEach((question) => {
    assert.equal(new Set(question.options).size, 4);
  });
});
```

- [ ] **Step 3: Kör testerna och se dem fallera**

Run: `npm test`
Expected: FAIL. De nya testerna fallerar eftersom grupp 11–21 inte finns och "/46" är hårdkodat. Befintliga tester som sparar ett utgångsläge fallerar också, eftersom de nu skriver till `v2`, som appen ännu inte läser. `test/curriculum.test.js` och `test/app-core.test.js` går igenom.

- [ ] **Step 4: Ladda kursplanen i `index.html`**

```html
    <script src="./src/app-core.js"></script>
    <script src="./src/curriculum.js"></script>
    <script src="./src/main.js"></script>
```

- [ ] **Step 5: Ändra toppen av `src/main.js`**

Ersätt de första raderna, upp till och med hela `KATAKANA_ROWS`-blocket (rad 1–32), med:

```js
(function () {
  const core = window.JapaneseAppCore;
  const curriculum = window.JapaneseCurriculum;
  const STORAGE_KEY = 'japanskaBarnApp.v2';
  const SESSION_QUESTION_COUNT = 10;
  const WORD_GROUP_SIZE = 5;
  let pendingLearnFocus = false;
```

(`WORD_GROUP_SIZE` och ordlistorna finns kvar tills Task 3.)

- [ ] **Step 6: Bygg alfabeten från kursplanen**

Ersätt `ALPHABETS` och `buildAlphabet`:

```js
  const ALPHABETS = {
    hiragana: buildAlphabet(curriculum.hiragana),
    katakana: buildAlphabet(curriculum.katakana)
  };
```

```js
  function buildAlphabet(data) {
    const groups = data.groups.map(function (group) {
      return group.items.map(function (item) {
        return {
          char: item.char,
          romaji: item.romaji,
          mnemonic: MNEMONIC_OVERRIDES[item.char] || item.tip || (item.char + ' (' + item.romaji + ') - koppla tecknet till ljudet ' + item.romaji + '.'),
          tip: PRONUNCIATION_TIPS[item.romaji] || ''
        };
      });
    });

    return { name: data.name, groups: groups, chars: groups.flat() };
  }
```

I `createInitialState`:

```js
      completedGroups: {
        hiragana: new Array(ALPHABETS.hiragana.groups.length).fill(false),
        katakana: new Array(ALPHABETS.katakana.groups.length).fill(false)
      },
```

- [ ] **Step 7: Miniquizen tar distraktorer från samma grupp**

I `startLearnQuiz` ersätter du `else`-grenen (teckenquizen):

```js
    } else {
      const alphabet = getAlphabetData(learn.alphabet);
      const groupChars = alphabet.groups[learn.groupIndex];
      // Same-group distractors train the differences that matter; small groups borrow from earlier groups.
      const optionPool = groupChars.length >= 4
        ? groupChars
        : alphabet.groups.slice(0, learn.groupIndex + 1).flat();

      questions = groupChars.map(function (charObj) {
        const options = buildOptions(optionPool, charObj.romaji, function (item) {
          return item.romaji;
        });

        return {
          promptChar: charObj.char,
          answer: charObj.romaji,
          options: options,
          type: 'char'
        };
      });
    }
```

Ta bort funktionen `findCharBySymbol`, som inte längre används.

- [ ] **Step 8: Byt `rows` mot `groups` i Lär dig**

`goNextLearnCard`:

```js
    const maxIndex = learn.unit === 'words'
      ? getCurrentLearnWords().length - 1
      : ALPHABETS[learn.alphabet].groups[learn.groupIndex].length - 1;
```

Början av `renderLearn`:

```js
    const group = isWordUnit ? null : alphabet.groups[learn.groupIndex];
    const wordGroups = getLearnWordGroups(learn.alphabet);
    const wordList = wordGroups[learn.wordGroupIndex] || wordGroups[0] || [];
    const current = isWordUnit
      ? wordList[learn.cardIndex]
      : group[learn.cardIndex];
```

`groupCards` i `renderLearn`:

```js
    const groupCards = alphabet.groups
      .map(function (items, index) {
        const unlocked = isGroupUnlocked(learn.alphabet, index);
        const done = state.completedGroups[learn.alphabet][index];
        const sample = items.map(function (item) {
          return item.char;
        }).join(' ');
        return (
          '<div class="group-card ' + (unlocked ? '' : 'locked') + '">' +
          '<h4>Grupp ' + (index + 1) + ' ' + (done ? '✅' : unlocked ? '' : '🔒') + '</h4>' +
          '<p class="muted" style="font-family:var(--jp-font)">' + sample + '</p>' +
          '<button class="btn-soft" data-action="pick-group" data-group-index="' + index + '" ' + (unlocked ? '' : 'disabled') + '>Välj</button>' +
          '</div>'
        );
      })
      .join('');
```

Teckengrenen i klickhanteraren för `learn-speak`:

```js
      } else {
        speak(ALPHABETS[state.learn.alphabet].groups[state.learn.groupIndex][state.learn.cardIndex].char);
      }
```

- [ ] **Step 9: Räkna ut totalerna i Mina framsteg**

I `renderProgress` lägger du till före `app.innerHTML =`:

```js
    const hiraTotal = ALPHABETS.hiragana.chars.length;
    const kataTotal = ALPHABETS.katakana.chars.length;
```

och ersätter de två raderna med "/46":

```js
      '<p class="muted">Upptäckta: Hiragana ' + getSeenCount('hiragana') + '/' + hiraTotal + ', Katakana ' + getSeenCount('katakana') + '/' + kataTotal + '</p>' +
      '<p class="muted">Mästarnivå (L3+): Hiragana ' + getLearnedCount('hiragana') + '/' + hiraTotal + ', Katakana ' + getLearnedCount('katakana') + '/' + kataTotal + '</p>' +
```

- [ ] **Step 10: Kör testerna och se dem passera**

Run: `node --check src/main.js && npm test`
Expected: PASS för alla tester.

- [ ] **Step 11: Commit**

```bash
git add index.html src/main.js test/main.test.js
git commit -m "Läs teckengrupper från kursplanen och byt lagringsnyckel"
```

---

### Task 3: Ordgrupper efter sin teckengrupp, emoji och ordövning

**Files:**
- Modify: `src/app-core.js` (ny funktion `isWordGroupUnlocked`)
- Modify: `src/main.js`. Berörs: `WORD_GROUP_SIZE`, `SIMPLE_WORDS` och `SIMPLE_WORDS_KATAKANA` (tas bort), `buildAlphabet`, `createInitialState`, `startPracticeSession`, `buildWordQuestions`, `createWordQuestion`, ordgruppsfunktionerna, `renderLearn` och `renderPractice`.
- Modify: `styles.css`
- Test: `test/app-core.test.js`, `test/main.test.js`

**Interfaces:**
- Consumes: `ALPHABETS[id].groups` från Task 2 och `curriculum[id].wordGroups` från Task 1.
- Produces:
  - `core.isWordGroupUnlocked(completedGroups: boolean[], afterGroup: number): boolean`
  - `ALPHABETS[id].wordGroups` med formen `WordGroup[]`
  - i `main.js`: `getUnlockedWords(alphabetChoice: 'hiragana' | 'katakana' | 'mixed'): Word[]`

- [ ] **Step 1: Skriv de fallerande testerna**

Lägg till sist i `test/app-core.test.js`:

```js
test('isWordGroupUnlocked opens a word group once its lesson group is completed', () => {
  assert.equal(core.isWordGroupUnlocked([true, false], 1), true);
  assert.equal(core.isWordGroupUnlocked([true, false], 2), false);
});
```

Lägg till en hjälpfunktion i `test/main.test.js`, direkt efter `SEEN_FIRST_HIRAGANA_ROW`:

```js
function completedUpTo(count, total) {
  return Array.from({ length: total || 21 }, (_, i) => i < count);
}
```

Ersätt det befintliga testet `sound button in a later word group speaks the word on the current card` med:

```js
test('sound button in a later word group speaks the word on the current card', () => {
  const app = loadApp({
    learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 2, cardIndex: 0 }
  });
  app.click('go-learn');
  app.click('learn-speak');

  assert.equal(app.spoken.at(-1), curriculum.hiragana.wordGroups[2].words[0].word);
});

test('sound button in a katakana word group speaks the katakana word', () => {
  const app = loadApp({
    learn: { alphabet: 'katakana', unit: 'words', wordGroupIndex: 1, cardIndex: 2 }
  });
  app.click('go-learn');
  app.click('learn-speak');

  assert.equal(app.spoken.at(-1), curriculum.katakana.wordGroups[1].words[2].word);
});
```

Lägg till sist i `test/main.test.js`:

```js
test('a word group stays locked until its lesson group is completed', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('pick-word-lesson', { wordGroupIndex: '0' });

  assert.equal(app.state().learn.unit, 'group');
});

test('a word group opens when its lesson group is completed', () => {
  const app = loadApp({ completedGroups: { hiragana: completedUpTo(1) } });
  app.click('go-learn');
  app.click('pick-word-lesson', { wordGroupIndex: '0' });

  assert.equal(app.state().learn.unit, 'words');
});

test('the next lesson group opens without doing the word group', () => {
  const app = loadApp({ completedGroups: { hiragana: completedUpTo(1) } });
  app.click('go-learn');
  app.click('pick-group', { groupIndex: '1' });

  assert.equal(app.state().learn.groupIndex, 1);
});

test('each word group card is listed right after its lesson group', () => {
  const app = loadApp();
  app.click('go-learn');

  const html = app.html();
  const firstGroup = html.indexOf('data-group-index="0"');
  const firstWords = html.indexOf('data-word-group-index="0"');
  const secondGroup = html.indexOf('data-group-index="1"');
  assert.ok(firstGroup < firstWords && firstWords < secondGroup);
});

test('a word card shows the word emoji', () => {
  const word = curriculum.hiragana.wordGroups[0].words[0];
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');

  assert.ok(app.html().includes(word.emoji));
});

test('practice words only uses words from unlocked word groups', () => {
  const unlocked = curriculum.hiragana.wordGroups
    .filter((group) => group.afterGroup <= 2)
    .flatMap((group) => group.words);
  const app = loadApp({
    completedGroups: { hiragana: completedUpTo(2) },
    practice: { alphabet: 'hiragana', level: 'words' }
  });
  app.click('go-practice');
  app.click('start-practice');

  const words = unlocked.map((word) => word.word);
  const meanings = unlocked.map((word) => word.meaning);
  app.state().practice.session.questions.forEach((question) => {
    assert.ok(words.includes(question.word), question.word);
    question.options.forEach((option) => assert.ok(meanings.includes(option), option));
  });
});

test('practice words shows a notice when no words are unlocked', () => {
  const app = loadApp({ practice: { alphabet: 'hiragana', level: 'words' } });
  app.click('go-practice');
  app.click('start-practice');

  assert.equal(app.state().practice.session, null);
  assert.match(app.state().practice.notice, /Klara fler grupper/);
});

test('mixed practice words includes unlocked katakana words', () => {
  const katakanaWords = curriculum.katakana.wordGroups
    .filter((group) => group.afterGroup <= 5)
    .flatMap((group) => group.words.map((word) => word.word));
  const app = loadApp({
    completedGroups: { katakana: completedUpTo(5, 22) },
    practice: { alphabet: 'mixed', level: 'words' }
  });
  app.click('go-practice');
  app.click('start-practice');

  app.state().practice.session.questions.forEach((question) => {
    assert.ok(katakanaWords.includes(question.word), question.word);
  });
});
```

- [ ] **Step 2: Kör testerna och se dem fallera**

Run: `npm test`
Expected: FAIL. Orsaker:
- `core.isWordGroupUnlocked is not a function`.
- Ljudknappstestet väntar sig すし men får あさ från den gamla listan.
- Ordgrupperna är låsta tills alla grupper är klara.
- Ordkorten ligger sist i grupplistan och saknar emoji.
- Ordövningen använder alla gamla hiraganaord.
- Två av de nya testerna går redan igenom och skyddar beteenden som inte får gå sönder: "stays locked" och "next lesson group opens".

- [ ] **Step 3: Lägg till `isWordGroupUnlocked` i `src/app-core.js`**

Lägg funktionen efter `isGroupUnlocked`:

```js
  function isWordGroupUnlocked(completedGroups, afterGroup) {
    return Boolean(completedGroups[afterGroup - 1]);
  }
```

och lägg till i `api`-objektet, efter `isGroupUnlocked: isGroupUnlocked,`:

```js
    isWordGroupUnlocked: isWordGroupUnlocked,
```

- [ ] **Step 4: Ta bort de gamla ordlistorna i `src/main.js`**

- Ta bort raden `const WORD_GROUP_SIZE = 5;`.
- Ta bort hela `SIMPLE_WORDS`- och `SIMPLE_WORDS_KATAKANA`-blocken.
- I `buildAlphabet` ändrar du return-raden till:

```js
    return { name: data.name, groups: groups, chars: groups.flat(), wordGroups: data.wordGroups };
```

I `createInitialState`:

```js
      completedWordLessons: {
        hiragana: new Array(ALPHABETS.hiragana.wordGroups.length).fill(false),
        katakana: new Array(ALPHABETS.katakana.wordGroups.length).fill(false)
      },
```

- [ ] **Step 5: Ersätt ordgruppsfunktionerna**

Ersätt `getLearnWordList`, `getLearnWordGroups`, `getCurrentLearnWords`, `isWordLessonUnlocked` och `isWordGroupUnlocked` med:

```js
  function getCurrentLearnWords() {
    const groups = ALPHABETS[state.learn.alphabet].wordGroups;
    return (groups[state.learn.wordGroupIndex] || groups[0]).words;
  }

  function isWordGroupUnlocked(alphabetId, wordGroupIndex) {
    const group = ALPHABETS[alphabetId].wordGroups[wordGroupIndex];
    return Boolean(group) && core.isWordGroupUnlocked(state.completedGroups[alphabetId], group.afterGroup);
  }

  function getUnlockedWords(alphabetChoice) {
    const alphabetIds = alphabetChoice === 'mixed' ? ['hiragana', 'katakana'] : [alphabetChoice];
    return alphabetIds.flatMap(function (alphabetId) {
      return ALPHABETS[alphabetId].wordGroups
        .filter(function (group, index) {
          return isWordGroupUnlocked(alphabetId, index);
        })
        .flatMap(function (group) {
          return group.words;
        });
    });
  }
```

- [ ] **Step 6: Ordövningen använder upplåsta ord**

Ordgrenen överst i `startPracticeSession`:

```js
    if (practice.level === 'words') {
      const wordPool = getUnlockedWords(practice.alphabet);
      const distinctMeanings = new Set(wordPool.map(function (item) {
        return item.meaning;
      }));
      if (distinctMeanings.size < 4) {
        state.practice.session = null;
        state.practice.notice = 'Klara fler grupper i Lär dig för att låsa upp ord.';
        return;
      }
      const questions = buildWordQuestions(wordPool, SESSION_QUESTION_COUNT);
```

(Resten av grenen, från `state.practice.session = {` och framåt, ändras inte.)

Ersätt `buildWordQuestions` och `createWordQuestion`:

```js
  function buildWordQuestions(pool, count) {
    const source = pool.slice();
    shuffle(source);
    const picked = [];
    for (let i = 0; i < count; i += 1) {
      picked.push(source[i % source.length]);
    }

    return picked.map(function (wordObj) {
      return createWordQuestion(wordObj, pool);
    });
  }

  function createWordQuestion(wordObj, pool) {
    const options = buildOptions(pool, wordObj.meaning, function (item) {
      return item.meaning;
    });
    return {
      word: wordObj.word,
      romaji: wordObj.romaji,
      prompt: 'Vad betyder ordet?',
      answer: wordObj.meaning,
      options: options,
      mode: 'word_to_meaning'
    };
  }
```

- [ ] **Step 7: Lär dig visar ordgrupper efter sin teckengrupp, med emoji**

Början av `renderLearn` (ersätter raderna med `wordGroups` och `wordList`):

```js
    const group = isWordUnit ? null : alphabet.groups[learn.groupIndex];
    const wordList = getCurrentLearnWords();
```

Ersätt `groupCards` och `wordsCard` med:

```js
    const groupCards = alphabet.groups
      .map(function (items, index) {
        const unlocked = isGroupUnlocked(learn.alphabet, index);
        const done = state.completedGroups[learn.alphabet][index];
        const sample = items.map(function (item) {
          return item.char;
        }).join(' ');
        const wordCards = alphabet.wordGroups
          .map(function (wordGroup, wordIndex) {
            return wordGroup.afterGroup === index + 1 ? wordGroupCardHtml(wordGroup, wordIndex) : '';
          })
          .join('');
        return (
          '<div class="group-card ' + (unlocked ? '' : 'locked') + '">' +
          '<h4>Grupp ' + (index + 1) + ' ' + (done ? '✅' : unlocked ? '' : '🔒') + '</h4>' +
          '<p class="muted" style="font-family:var(--jp-font)">' + sample + '</p>' +
          '<button class="btn-soft" data-action="pick-group" data-group-index="' + index + '" ' + (unlocked ? '' : 'disabled') + '>Välj</button>' +
          '</div>' +
          wordCards
        );
      })
      .join('');

    function wordGroupCardHtml(wordGroup, wordIndex) {
      const unlocked = isWordGroupUnlocked(learn.alphabet, wordIndex);
      const done = state.completedWordLessons[learn.alphabet][wordIndex];
      return (
        '<div class="group-card word-group-card ' + (unlocked ? '' : 'locked') + '">' +
        '<h4>⭐ Nya ord ' + (done ? '✅' : unlocked ? '' : '🔒') + '</h4>' +
        '<p class="muted" style="font-family:var(--jp-font)">' + wordGroup.words.map(function (item) {
          return item.word;
        }).join(' ') + '</p>' +
        '<button class="btn-soft" data-action="pick-word-lesson" data-word-group-index="' + wordIndex + '" ' + (unlocked ? '' : 'disabled') + '>Välj</button>' +
        '</div>'
      );
    }
```

Grupplistan i `app.innerHTML` för `renderLearn`:

```js
      (learn.groupsCollapsed ? '' : '<article class="card group-grid">' + groupCards + '</article>') +
```

Rubriken och emojin i ordkortet (de två första raderna efter `'<article class="card learn-focus-card" id="learn-focus">' +`):

```js
        '<h3>' + (isWordUnit ? alphabet.name + ' – nya ord efter grupp ' + (alphabet.wordGroups[learn.wordGroupIndex] || alphabet.wordGroups[0]).afterGroup : alphabet.name + ' Grupp ' + (learn.groupIndex + 1)) + '</h3>' +
        (isWordUnit ? '<p class="word-emoji" aria-hidden="true">' + current.emoji + '</p>' : '') +
```

- [ ] **Step 8: Öva visar alfabetsval även för ord**

I `renderPractice` ersätter du ordtexten:

```js
      (isWordLevel
        ? '<p class="muted" style="margin-top:8px;">Öva orden du har låst upp i Lär dig.</p>'
        : '') +
```

och visar alfabetsknapparna oavsett nivå, så att det tredje `isWordLevel`-villkoret försvinner:

```js
      '<div class="alphabet-toggle" style="margin-top:8px;">' +
      '<button class="btn-soft toggle-btn ' + (practice.alphabet === 'hiragana' ? 'active' : '') + '" data-action="set-practice-alphabet" data-value="hiragana">Hiragana</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.alphabet === 'katakana' ? 'active' : '') + '" data-action="set-practice-alphabet" data-value="katakana">Katakana</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.alphabet === 'mixed' ? 'active' : '') + '" data-action="set-practice-alphabet" data-value="mixed">Blandat</button>' +
      '</div>' +
```

- [ ] **Step 9: Stil för ordgruppskort och emoji**

Lägg till efter `.group-card h4` i `styles.css`:

```css
.word-group-card {
  background: #fff8e8;
  border-color: #ffd98d;
}

.word-emoji {
  font-size: clamp(2.4rem, 9vw, 3.4rem);
  text-align: center;
  margin: 4px 0 0;
  line-height: 1;
}
```

- [ ] **Step 10: Kör testerna och se dem passera**

Run: `node --check src/main.js && grep -n "SIMPLE_WORDS\|WORD_GROUP_SIZE\|getLearnWordGroups\|isWordLessonUnlocked\|\.rows" src/main.js; npm test`
Expected: Inga träffar från `grep`, och PASS för alla tester. Kör `npm test` tre gånger, eftersom frågorna slumpas.

- [ ] **Step 11: Commit**

```bash
git add src/app-core.js src/main.js styles.css test/app-core.test.js test/main.test.js
git commit -m "Ordgrupper efter sin teckengrupp, emoji på ordkort och ordövning med upplåsta ord"
```

- [ ] **Step 12: Visuell kontroll**

Starta `npm start` och öppna http://localhost:5173. Kontrollera att:
- grupplistan i Lär dig visar "⭐ Nya ord" direkt efter grupp 1
- ordkortet visar emojin ovanför ordet
- grupp 17 visar tipsraden "き + litet ゃ = きゃ …"
- Öva → Enkla ord → Blandat fungerar.

Rapportera eventuella layoutproblem i stället för att lämna dem.
