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
