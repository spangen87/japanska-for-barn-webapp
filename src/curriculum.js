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
      id: list[0][0],
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
      ['おちゃ', 'ocha', 'grönt te', '🍵'],
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

  // Shape-and-sound mnemonics for the base kana, in Swedish for 8–10-year-olds.
  const MNEMONICS = {
    'あ': 'Ett A med en stor snirkel runt om – säg \'aaa!\' som hos tandläkaren.',
    'い': 'Två istappar som hänger bredvid varandra – i som i is.',
    'う': 'Ett litet streck överst och en stor böj – någon som håller sig om magen och säger \'oo\'.',
    'え': 'Ett litet streck överst och en sicksack med svans – en dansare som tar ett steg: e!',
    'お': 'Nästan som あ, men med en liten prick uppe till höger. Bollen flög iväg – \'Å nej!\'',
    'か': 'Som ett k med en extra pinne bredvid – ka!',
    'き': 'Ser ut som en nyckel – på engelska key: ki!',
    'く': 'Som en fågelnäbb – göken säger ku-ku!',
    'け': 'En pinne till vänster och en ketchupflaska till höger – ke som i ketchup.',
    'こ': 'Två korvar på grillen – ko som i korv.',
    'さ': 'Ett sugrör som sticker ner i ett glas – sa som i saft.',
    'し': 'Ser ut som en fiskekrok som hänger i vattnet – shi!',
    'す': 'Ett streck med en ögla i mitten – en surfare som gör en loop: su!',
    'せ': 'Ett staket med en böjd stolpe – se upp för staketet: se!',
    'そ': 'Ett sicksackspår som slutar i en båge – sorken springer: so!',
    'た': 'Ser ut som bokstäverna t och a bredvid varandra – ta!',
    'ち': 'Som en spegelvänd 5:a – fem chips: chi!',
    'つ': 'Ser ut som en våg – tsunami börjar med tsu!',
    'て': 'Som ett T som böjer sig – te!',
    'と': 'Som en tå med en sticka i – aj, min tå: to!',
    'な': 'Ett kors och en liten knut – en nalle med armarna i kors: na!',
    'に': 'En pinne och två korta streck – och ni betyder två på japanska!',
    'ぬ': 'Snurriga nudlar med en ätpinne – nu som i nudlar.',
    'ね': 'Som en sovande katt med svansen i en ögla – neko betyder katt: ne!',
    'の': 'Som en förbudsskylt – no!',
    'は': 'Ser ut som ett H och ett a som sitter ihop – ha!',
    'ひ': 'Ser ut som en stor flinande mun – hi hi!',
    'ふ': 'Fyra små delar som ett berg med snö – Fuji-berget: fu!',
    'へ': 'Ett hustak – he som i hem.',
    'ほ': 'Som は men med ett extra streck – tomten säger ho ho ho!',
    'ま': 'Ett kors med två armar och en ögla – mamma kramar: ma!',
    'み': 'Svängen och slängen sjunger – do-re-mi!',
    'む': 'En ko med horn och svans – muu!',
    'め': 'Ett öga med ögonfransar – me betyder öga på japanska!',
    'も': 'En fiskekrok med två maskar – \'mo-ore!\' säger fisken.',
    'や': 'Ett jakthorn som tutar \'ja!\' – ya låter som ja.',
    'ゆ': 'En fisk som simmar runt i en ring – yu låter som \'ju\'.',
    'よ': 'Ett snöre med en jojo – yo!',
    'ら': 'En rappare med keps – ra!',
    'り': 'Två grässtrån bredvid varandra – ri som i risfält.',
    'る': 'Som ろ men med en liten ögla i slutet – en rund ögla: ru!',
    'れ': 'Som ね men utan öglan – en löpare som reser iväg: re!',
    'ろ': 'Som る men utan ögla – en rak väg att ro på: ro!',
    'わ': 'Som れ men slutar i en mjuk båge – vattnet virvlar: wa!',
    'を': 'En figur som slänger sig framåt – \'wo-oo!\' Skrivs wo, men låter som o.',
    'ん': 'Ser ut som ett handskrivet n – n!',
    'ア': 'Som en yxa med kort skaft – a!',
    'イ': 'Ett i som lutar sig mot en vägg – i!',
    'ウ': 'Som う fast kantig, med ett litet tak – oo!',
    'エ': 'Ett I med tak och golv – e!',
    'オ': 'Ett plustecken som tappar ett ben snett – \'å nej!\': o.',
    'カ': 'Som か fast utan extra pinne – ka!',
    'キ': 'Som き fast kantig – en nyckel: ki!',
    'ク': 'Som く fast kantig – göken: ku!',
    'ケ': 'Som ett K som ramlat lite – ke som i ketchup.',
    'コ': 'En halv låda – som こ fast med hörn: ko!',
    'サ': 'Som さ fast kantig – ett sugrör i ett glas: sa!',
    'シ': 'Prickarna sitter till vänster och strecket svischar UPPÅT – shi! (Jämför ツ.)',
    'ス': 'En skidåkare i backen – ssssu!',
    'セ': 'Som せ fast kantig – se upp för staketet!',
    'ソ': 'Strecken faller NERÅT, uppifrån – so! (Jämför ン.)',
    'タ': 'Som ク med ett extra streck i mitten – ta!',
    'チ': 'Ett T med en hatt – chi!',
    'ツ': 'Prickarna sitter ovanpå och strecket faller NERÅT som en tsunamivåg – tsu! (Jämför シ.)',
    'テ': 'Ett T med ett tak – te!',
    'ト': 'Ett T med bara en arm – to (som tå)!',
    'ナ': 'Ett plustecken som lutar – na!',
    'ニ': 'Två streck – och ni betyder två!',
    'ヌ': 'Som ス med ett extra streck – nudlar med ätpinne: nu!',
    'ネ': 'En liten sittande katt – neko: ne!',
    'ノ': 'Bara ett enda snett streck – no, inget mer!',
    'ハ': 'Två streck som skrattar – ha ha!',
    'ヒ': 'Som ett liggande h – hi!',
    'フ': 'Ett hörn som blåser i vinden – fu!',
    'ヘ': 'Precis som へ – ett hustak: he som i hem.',
    'ホ': 'Ett kors med två ben – tomtens ho ho!',
    'マ': 'En 7:a med en liten hake – ma!',
    'ミ': 'Tre streck – mi-mi-mi, som en sångövning!',
    'ム': 'Ett triangelhus där kon bor – muu!',
    'メ': 'Ett kryss över ögat – me betyder öga!',
    'モ': 'Som も fast kantig – mo!',
    'ヤ': 'Som や fast kantig – ja!',
    'ユ': 'Ett U som vänt sig – yu låter som \'ju\'.',
    'ヨ': 'Som ett spegelvänt E – yo!',
    'ラ': 'Som ら fast kantig – ra!',
    'リ': 'Som り fast rakare – ri!',
    'ル': 'Två ben, där det ena har en krok – en rutschkana: ru!',
    'レ': 'Ser ut som en bock ✓ – rätt: re!',
    'ロ': 'En fyrkant – en roddbåt sedd uppifrån: ro!',
    'ワ': 'Som ウ fast utan pricken överst – wa!',
    'ヲ': 'Som フ med ett extra streck – skrivs wo, men låter som o.',
    'ン': 'Pricken sitter nere och strecket svischar UPPÅT – n! (Jämför ソ.)'
  };

  // Kana that children mix up, practised side by side in Öva → Lika tecken.
  const LOOK_ALIKES = [
    ['シ', 'ツ'],
    ['ソ', 'ン'],
    ['ぬ', 'め'],
    ['ね', 'れ', 'わ'],
    ['る', 'ろ'],
    ['は', 'ほ'],
    ['さ', 'ち'],
    ['き', 'さ'],
    ['い', 'り'],
    ['ク', 'タ'],
    ['ウ', 'ワ']
  ];

  // How Swedish children should read romaji; shown on the page "Så läser du romaji".
  const ROMAJI_GUIDE = {
    intro: 'Romaji är japanska ljud skrivna med våra bokstäver. Men japanska läses inte som svenska! De här bokstäverna är knepigast:',
    rows: [
      ['u', 'som o i <em>bo</em>, men utan att runda läpparna', 'inte som u i <em>hus</em>'],
      ['o', 'som å i <em>båt</em>', 'inte som o i <em>ko</em>'],
      ['ki, ke', 'alltid hårt k, som i <em>kaka</em>', 'inte "tji" som i <em>kind</em>'],
      ['gi, ge', 'alltid hårt g, som i <em>gata</em>', 'inte "ji" som i <em>ge</em>'],
      ['ya, yu, yo', 'y låter som svenskt j: <em>ja</em>, <em>ju</em>, <em>jå</em>', 'inte som y i <em>yxa</em>'],
      ['ji, ja, ju, jo', 'som j i engelska <em>jeans</em>: "dji"', 'inte som j i <em>ja</em>'],
      ['shi, sha', 'som tj-ljudet i <em>tjugo</em>', 'inte som sj i <em>sjö</em>'],
      ['chi, cha', 'som i engelska <em>chips</em>', ''],
      ['tsu', 'ts som i <em>katts</em>', ''],
      ['z', 'ett surrande s, som ett bi: zzz', 'inte som ett vanligt s'],
      ['r', 'en lätt studs med tungan, mitt emellan r och l', 'inte ett rullande r'],
      ['fu', 'blås lätt mellan läpparna', 'inte ett hårt f'],
      ['w', 'som w i engelska <em>water</em>', 'inte som v'],
      ['aa, ii, uu, ee, ou', 'håll ljudet dubbelt så länge', ''],
      ['kk, tt, pp, ss', 'gör en kort paus innan', '']
    ],
    outro: 'Tips: Tryck på 🔊 och härma. Ljudet är alltid rätt, även när bokstäverna lurar dig!'
  };

  // Card tips for sounds Swedish readers get wrong; the first matching rule wins.
  const PRONUNCIATION_TIPS = [
    { match: /^shi$/, tip: "Som tj-ljudet i 'tjugo' eller 'kind', ungefär som engelska 'she'." },
    { match: /^tsu$/, tip: "'ts' som i 'katts', plus ett kort u." },
    { match: /^fu$/, tip: "Mjuk 'f', nästan som 'hu'." },
    { match: /^chi$/, tip: "Som i engelska 'chips' eller 'cheese'." },
    { match: /^wo$/, tip: "Skrivs 'wo' men låter som 'o'." },
    { match: /^(k[ie]|ky)/, tip: "Hårt k som i 'kaka' – inte 'tji'." },
    { match: /^(g[ie]|gy)/, tip: "Hårt g som i 'gata' – inte 'ji'." },
    { match: /^y/, tip: 'y låter som svenskt j.' },
    { match: /^j/, tip: "Som j i engelska 'jeans': 'dji'." },
    { match: /^z/, tip: 'Surrande s, som ett bi: zzz.' },
    { match: /^r/, tip: 'En lätt studs med tungan, mitt emellan r och l.' },
    { match: /^u$/, tip: "Som o i 'bo', men utan runda läppar." },
    { match: /^o$/, tip: "Som å i 'båt'." }
  ];

  // A category meaning is never offered as a wrong option for one of its members ("djur" for "hund").
  const CATEGORIES = {
    djur: ['hund', 'katt', 'ko', 'bläckfisk', 'fisk', 'björn', 'insekt', 'apa', 'fågel', 'ekorre', 'groda', 'krokodil', 'höna',
      'giraff', 'elefant', 'får', 'gris', 'orm', 'räka', 'fjäril', 'guldfisk', 'drake', 'koala', 'lejon', 'havsutter',
      'gorilla', 'kräfta', 'panda', 'pingvin'],
    fisk: ['guldfisk'],
    fågel: ['höna', 'pingvin'],
    insekt: ['fjäril'],
    blomma: ['körsbärsblomma', 'maskros', 'tulpan'],
    frukt: ['vattenmelon', 'persika', 'mandarin', 'äpple', 'melon', 'citron', 'banan', 'ananas'],
    grönsaker: ['gurka', 'vitkål', 'tomat'],
    kläder: ['mössa', 'slips', 'tröja', 'jeans', 'skjorta', 'jacka'],
    färg: ['blå', 'röd', 'vit', 'svart', 'grön', 'brun'],
    familj: ['mamma', 'pappa', 'storebror', 'storasyster'],
    kropp: ['hand', 'mun', 'fot', 'öga', 'öra', 'finger', 'ansikte']
  };

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
    return item.char[0] + ' + litet ' + item.char[1] + ' = ' + item.char + ' (' + item.romaji + '). Ljudet finns bara i lånord.';
  }

  function buildKanaGroups(convert, ruleGroup) {
    const base = BASE_ROWS.map(function (row) {
      return {
        items: parseRow(convert(row)).map(function (item) {
          item.mnemonic = MNEMONICS[item.char];
          return item;
        })
      };
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
    return withIds(base.concat([ruleGroup], voiced, combo));
  }

  // A group's id is its first item, so saved progress follows the group even if groups move.
  function withIds(groups) {
    return groups.map(function (group) {
      group.id = group.items[0].char;
      return group;
    });
  }

  const curriculum = {
    hiragana: {
      name: 'Hiragana',
      groups: buildKanaGroups(keepAsIs, { items: HIRAGANA_RULE_ITEMS, teaches: ['っ'] }),
      wordGroups: HIRAGANA_WORD_GROUPS
    },
    katakana: {
      name: 'Katakana',
      groups: buildKanaGroups(toKatakana, { items: KATAKANA_RULE_ITEMS, teaches: ['ッ', 'ー'] }).concat(withIds([{
        items: parseRow(LOANWORD_ROW).map(function (item) {
          item.tip = loanwordTip(item);
          return item;
        })
      }])),
      wordGroups: KATAKANA_WORD_GROUPS
    },
    categories: CATEGORIES,
    lookAlikes: LOOK_ALIKES,
    romajiGuide: ROMAJI_GUIDE,
    pronunciationTips: PRONUNCIATION_TIPS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
  }
  globalScope.JapaneseCurriculum = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
