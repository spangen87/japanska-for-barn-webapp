(function () {
  const core = window.JapaneseAppCore;
  const STORAGE_KEY = 'japanskaBarnApp.v1';
  const SESSION_QUESTION_COUNT = 10;
  const WORD_GROUP_SIZE = 5;
  let pendingLearnFocus = false;

  const HIRAGANA_ROWS = [
    [['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o']],
    [['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko']],
    [['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so']],
    [['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to']],
    [['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no']],
    [['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho']],
    [['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo']],
    [['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo']],
    [['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro']],
    [['わ', 'wa'], ['を', 'wo'], ['ん', 'n']]
  ];

  const KATAKANA_ROWS = [
    [['ア', 'a'], ['イ', 'i'], ['ウ', 'u'], ['エ', 'e'], ['オ', 'o']],
    [['カ', 'ka'], ['キ', 'ki'], ['ク', 'ku'], ['ケ', 'ke'], ['コ', 'ko']],
    [['サ', 'sa'], ['シ', 'shi'], ['ス', 'su'], ['セ', 'se'], ['ソ', 'so']],
    [['タ', 'ta'], ['チ', 'chi'], ['ツ', 'tsu'], ['テ', 'te'], ['ト', 'to']],
    [['ナ', 'na'], ['ニ', 'ni'], ['ヌ', 'nu'], ['ネ', 'ne'], ['ノ', 'no']],
    [['ハ', 'ha'], ['ヒ', 'hi'], ['フ', 'fu'], ['ヘ', 'he'], ['ホ', 'ho']],
    [['マ', 'ma'], ['ミ', 'mi'], ['ム', 'mu'], ['メ', 'me'], ['モ', 'mo']],
    [['ヤ', 'ya'], ['ユ', 'yu'], ['ヨ', 'yo']],
    [['ラ', 'ra'], ['リ', 'ri'], ['ル', 'ru'], ['レ', 're'], ['ロ', 'ro']],
    [['ワ', 'wa'], ['ヲ', 'wo'], ['ン', 'n']]
  ];

  const MNEMONIC_OVERRIDES = {
    'あ': "Ser ut som ett A med snirkel, tänk 'aah!'.",
    'き': 'Ser ut som en nyckel, key = ki.',
    'さ': 'Som ett paraply i vinden: sa!',
    'ね': 'Som en sovande katt (neko).',
    'の': 'En virvel som säger no-no.',
    'し': "Låter ungefär som 'sji' på svenska.",
    'つ': "Låter som 'tsoo', kort och mjukt.",
    'ふ': "Mjuk 'fu', nästan lite 'hu'.",
    'シ': "Katakana 'shi', samma ljud som し.",
    'ツ': "Katakana 'tsu', tänk kort 'tsoo'.",
    'フ': "Katakana 'fu', mjukt och lätt."
  };

  const PRONUNCIATION_TIPS = {
    shi: "Uttalas ungefär som 'sji'.",
    tsu: "Uttalas 'tsoo', kort.",
    fu: "Mjuk 'f', nästan som 'hu'.",
    chi: "Låter ungefär som 'tji'."
  };

  const BADGES = [
    { id: 'hiragana_beginner', icon: '🌸', name: 'Hiragana-nybörjare', rule: 'Lås upp första hiragana-gruppen.' },
    { id: 'hiragana_master', icon: '🗻', name: 'Hiragana-mästare', rule: 'Alla hiragana på nivå 3+.' },
    { id: 'fast_lightning', icon: '⚡', name: 'Snabb som blixten', rule: '10 rätt i rad i en session.' },
    { id: 'perfect_session', icon: '🎯', name: 'Perfekt session', rule: '100% rätt i en övningssession.' }
  ];
  const SIMPLE_WORDS = [
    { word: 'ねこ', romaji: 'neko', meaning: 'katt' },
    { word: 'いぬ', romaji: 'inu', meaning: 'hund' },
    { word: 'みず', romaji: 'mizu', meaning: 'vatten' },
    { word: 'やま', romaji: 'yama', meaning: 'berg' },
    { word: 'そら', romaji: 'sora', meaning: 'himmel' },

    { word: 'はな', romaji: 'hana', meaning: 'blomma' },
    { word: 'き', romaji: 'ki', meaning: 'träd' },
    { word: 'うみ', romaji: 'umi', meaning: 'hav' },
    { word: 'かわ', romaji: 'kawa', meaning: 'flod' },
    { word: 'ゆき', romaji: 'yuki', meaning: 'snö' },

    { word: 'あさ', romaji: 'asa', meaning: 'morgon' },
    { word: 'ひる', romaji: 'hiru', meaning: 'mitt på dagen' },
    { word: 'よる', romaji: 'yoru', meaning: 'natt' },
    { word: 'あめ', romaji: 'ame', meaning: 'regn' },
    { word: 'かぜ', romaji: 'kaze', meaning: 'vind' },

    { word: 'ごはん', romaji: 'gohan', meaning: 'mat' },
    { word: 'おちゃ', romaji: 'ocha', meaning: 'te' },
    { word: 'りんご', romaji: 'ringo', meaning: 'äpple' },
    { word: 'たまご', romaji: 'tamago', meaning: 'ägg' },
    { word: 'さかな', romaji: 'sakana', meaning: 'fisk' },

    { word: 'ともだち', romaji: 'tomodachi', meaning: 'kompis' },
    { word: 'せんせい', romaji: 'sensei', meaning: 'lärare' },
    { word: 'がくせい', romaji: 'gakusei', meaning: 'elev' },
    { word: 'かぞく', romaji: 'kazoku', meaning: 'familj' },
    { word: 'こども', romaji: 'kodomo', meaning: 'barn' },

    { word: 'くるま', romaji: 'kuruma', meaning: 'bil' },
    { word: 'でんしゃ', romaji: 'densha', meaning: 'tåg' },
    { word: 'じてんしゃ', romaji: 'jitensha', meaning: 'cykel' },
    { word: 'えき', romaji: 'eki', meaning: 'station' },
    { word: 'みち', romaji: 'michi', meaning: 'väg' },

    { word: 'いえ', romaji: 'ie', meaning: 'hus' },
    { word: 'へや', romaji: 'heya', meaning: 'rum' },
    { word: 'まど', romaji: 'mado', meaning: 'fönster' },
    { word: 'つくえ', romaji: 'tsukue', meaning: 'skrivbord' },
    { word: 'いす', romaji: 'isu', meaning: 'stol' },

    { word: 'とけい', romaji: 'tokei', meaning: 'klocka' },
    { word: 'えんぴつ', romaji: 'enpitsu', meaning: 'penna' },
    { word: 'ほん', romaji: 'hon', meaning: 'bok' },
    { word: 'てがみ', romaji: 'tegami', meaning: 'brev' },
    { word: 'しんぶん', romaji: 'shinbun', meaning: 'tidning' },

    { word: 'たんじょうび', romaji: 'tanjoubi', meaning: 'födelsedag' },
    { word: 'しゅくだい', romaji: 'shukudai', meaning: 'läxa' },
    { word: 'べんきょう', romaji: 'benkyou', meaning: 'studier' },
    { word: 'びょういん', romaji: 'byouin', meaning: 'sjukhus' },
    { word: 'としょかん', romaji: 'toshokan', meaning: 'bibliotek' },

    { word: 'じしょ', romaji: 'jisho', meaning: 'ordbok' },
    { word: 'せいかつ', romaji: 'seikatsu', meaning: 'vardag' },
    { word: 'ぶんか', romaji: 'bunka', meaning: 'kultur' },
    { word: 'けいけん', romaji: 'keiken', meaning: 'erfarenhet' },
    { word: 'しょうらい', romaji: 'shourai', meaning: 'framtid' }
  ];
  const SIMPLE_WORDS_KATAKANA = [
    { word: 'バス', romaji: 'basu', meaning: 'buss' },
    { word: 'パン', romaji: 'pan', meaning: 'bröd' },
    { word: 'テレビ', romaji: 'terebi', meaning: 'tv' },
    { word: 'ジュース', romaji: 'juusu', meaning: 'juice' },
    { word: 'ケーキ', romaji: 'keeki', meaning: 'tårta' },

    { word: 'アイス', romaji: 'aisu', meaning: 'glass' },
    { word: 'コーヒー', romaji: 'koohii', meaning: 'kaffe' },
    { word: 'サラダ', romaji: 'sarada', meaning: 'sallad' },
    { word: 'ピザ', romaji: 'piza', meaning: 'pizza' },
    { word: 'チーズ', romaji: 'chiizu', meaning: 'ost' },

    { word: 'カメラ', romaji: 'kamera', meaning: 'kamera' },
    { word: 'タクシー', romaji: 'takushii', meaning: 'taxi' },
    { word: 'ホテル', romaji: 'hoteru', meaning: 'hotell' },
    { word: 'ピアノ', romaji: 'piano', meaning: 'piano' },
    { word: 'ギター', romaji: 'gitaa', meaning: 'gitarr' },

    { word: 'スマホ', romaji: 'sumaho', meaning: 'smartphone' },
    { word: 'パソコン', romaji: 'pasokon', meaning: 'dator' },
    { word: 'ゲーム', romaji: 'geemu', meaning: 'spel' },
    { word: 'アプリ', romaji: 'apuri', meaning: 'app' },
    { word: 'インターネット', romaji: 'intaanetto', meaning: 'internet' },

    { word: 'シャツ', romaji: 'shatsu', meaning: 'skjorta' },
    { word: 'スカート', romaji: 'sukaato', meaning: 'kjol' },
    { word: 'ジャケット', romaji: 'jaketto', meaning: 'jacka' },
    { word: 'スニーカー', romaji: 'suniikaa', meaning: 'sneakers' },
    { word: 'リュック', romaji: 'ryukku', meaning: 'ryggsäck' },

    { word: 'レストラン', romaji: 'resutoran', meaning: 'restaurang' },
    { word: 'スーパー', romaji: 'suupaa', meaning: 'stormarknad' },
    { word: 'コンビニ', romaji: 'konbini', meaning: 'närbutik' },
    { word: 'エレベーター', romaji: 'erebeetaa', meaning: 'hiss' },
    { word: 'エスカレーター', romaji: 'esukareetaa', meaning: 'rulltrappa' },

    { word: 'スポーツ', romaji: 'supootsu', meaning: 'sport' },
    { word: 'サッカー', romaji: 'sakkaa', meaning: 'fotboll' },
    { word: 'テニス', romaji: 'tenisu', meaning: 'tennis' },
    { word: 'プール', romaji: 'puuru', meaning: 'pool' },
    { word: 'トレーニング', romaji: 'toreeningu', meaning: 'träning' },

    { word: 'プロジェクト', romaji: 'purojekuto', meaning: 'projekt' },
    { word: 'スケジュール', romaji: 'sukejuuru', meaning: 'schema' },
    { word: 'プレゼン', romaji: 'purezen', meaning: 'presentation' },
    { word: 'アイデア', romaji: 'aidea', meaning: 'idé' },
    { word: 'コミュニケーション', romaji: 'komyunikeeshon', meaning: 'kommunikation' },

    { word: 'システム', romaji: 'shisutemu', meaning: 'system' },
    { word: 'データ', romaji: 'deeta', meaning: 'data' },
    { word: 'アルゴリズム', romaji: 'arugorizumu', meaning: 'algoritm' },
    { word: 'パフォーマンス', romaji: 'pafoomansu', meaning: 'prestanda' },
    { word: 'プラットフォーム', romaji: 'purattofoomu', meaning: 'plattform' },

    { word: 'イノベーション', romaji: 'inobeeshon', meaning: 'innovation' },
    { word: 'マネジメント', romaji: 'manejimento', meaning: 'ledning' },
    { word: 'ストラテジー', romaji: 'sutoratejii', meaning: 'strategi' },
    { word: 'グローバル', romaji: 'guroobaru', meaning: 'global' },
    { word: 'サステナビリティ', romaji: 'sasutenabiriti', meaning: 'hållbarhet' }
  ];

  const ALPHABETS = {
    hiragana: buildAlphabet('Hiragana', HIRAGANA_ROWS),
    katakana: buildAlphabet('Katakana', KATAKANA_ROWS)
  };

  const app = document.getElementById('app');
  let state = loadState();

  function buildAlphabet(name, rows) {
    const chars = rows.flat().map(function (entry) {
      const character = entry[0];
      const romaji = entry[1];
      return {
        char: character,
        romaji: romaji,
        mnemonic: MNEMONIC_OVERRIDES[character] || (character + ' (' + romaji + ') - koppla tecknet till ljudet ' + romaji + '.'),
        tip: PRONUNCIATION_TIPS[romaji] || ''
      };
    });

    return { name: name, rows: rows, chars: chars };
  }

  function createProgressMap(chars) {
    return core.createProgressMap(chars, todayKey());
  }

  function createSeenMap(chars) {
    const map = {};
    chars.forEach(function (item) {
      map[item.char] = false;
    });
    return map;
  }

  function createInitialState() {
    return {
      view: 'intro',
      learn: {
        alphabet: 'hiragana',
        unit: 'group',
        groupIndex: 0,
        wordGroupIndex: 0,
        cardIndex: 0,
        quiz: null,
        groupsCollapsed: false
      },
      practice: {
        alphabet: 'hiragana',
        level: 'chars',
        mode: 'char_to_romaji',
        session: null,
        notice: ''
      },
      progress: {
        hiragana: createProgressMap(ALPHABETS.hiragana.chars),
        katakana: createProgressMap(ALPHABETS.katakana.chars)
      },
      seenChars: {
        hiragana: createSeenMap(ALPHABETS.hiragana.chars),
        katakana: createSeenMap(ALPHABETS.katakana.chars)
      },
      completedGroups: {
        hiragana: new Array(ALPHABETS.hiragana.rows.length).fill(false),
        katakana: new Array(ALPHABETS.katakana.rows.length).fill(false)
      },
      completedWordLessons: {
        hiragana: new Array(Math.ceil(SIMPLE_WORDS.length / WORD_GROUP_SIZE)).fill(false),
        katakana: new Array(Math.ceil(SIMPLE_WORDS_KATAKANA.length / WORD_GROUP_SIZE)).fill(false)
      },
      streak: {
        current: 0,
        best: 0,
        lastDate: null,
        history: []
      },
      badges: [],
      progressUpdatedAt: null
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createInitialState();
      }
      const parsed = JSON.parse(raw);
      const baseline = createInitialState();
      const merged = deepMerge(baseline, parsed);
      merged.view = 'intro';
      return merged;
    } catch (error) {
      return createInitialState();
    }
  }

  function deepMerge(base, source) {
    if (!source || typeof source !== 'object') {
      return base;
    }
    const result = Array.isArray(base) ? base.slice() : { ...base };

    Object.keys(source).forEach(function (key) {
      if (!(key in result)) {
        return;
      }
      if (Array.isArray(result[key])) {
        result[key] = Array.isArray(source[key]) ? source[key] : result[key];
      } else if (result[key] && typeof result[key] === 'object') {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function markProgressUpdated() {
    state.progressUpdatedAt = new Date().toISOString();
  }

  function formatUpdatedAt(isoString) {
    if (!isoString) {
      return 'Inte uppdaterat ännu';
    }
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return 'Inte uppdaterat ännu';
    }
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function datePlusDays(dateStr, days) {
    return core.datePlusDays(dateStr, days);
  }

  function updateStreak() {
    state.streak = core.updateStreak(state.streak, todayKey());
  }

  function setView(view) {
    state.view = view;
    render();
  }

  function getAlphabetData(id) {
    return ALPHABETS[id];
  }

  function getLearnedCount(alphabetId) {
    return core.getLearnedCount(state.progress[alphabetId], 3);
  }

  function getSeenCount(alphabetId) {
    return Object.keys(state.seenChars[alphabetId]).filter(function (char) {
      return Boolean(state.seenChars[alphabetId][char]);
    }).length;
  }

  function getProgressPercent(alphabetId) {
    const total = ALPHABETS[alphabetId].chars.length;
    return core.getProgressPercent(state.progress[alphabetId], total, 3);
  }

  function getSeenPercent(alphabetId) {
    const total = ALPHABETS[alphabetId].chars.length;
    if (!total) {
      return 0;
    }
    return Math.round((getSeenCount(alphabetId) / total) * 100);
  }

  function isGroupUnlocked(alphabetId, groupIndex) {
    return core.isGroupUnlocked(state.completedGroups[alphabetId], groupIndex);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function startLearnQuiz() {
    const learn = state.learn;
    let questions = [];
    if (learn.unit === 'words') {
      const words = getCurrentLearnWords();
      questions = words.map(function (wordObj) {
        const options = buildOptions(words, wordObj.meaning, function (item) {
          return item.meaning;
        });
        return {
          promptChar: wordObj.word,
          answer: wordObj.meaning,
          options: options,
          type: 'word'
        };
      });
    } else {
      const alphabet = getAlphabetData(learn.alphabet);
      const groupChars = alphabet.rows[learn.groupIndex].map(function (entry) {
        return findCharBySymbol(alphabet, entry[0]);
      });

      questions = groupChars.map(function (charObj) {
        const options = buildOptions(alphabet.chars, charObj.romaji, function (item) {
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

    shuffle(questions);

    state.learn.quiz = {
      index: 0,
      correct: 0,
      done: false,
      feedback: '',
      questions: questions
    };
  }

  function startPracticeSession() {
    const practice = state.practice;
    if (practice.level === 'words') {
      const questions = buildWordQuestions(SESSION_QUESTION_COUNT);
      state.practice.session = {
        index: 0,
        correct: 0,
        streak: 0,
        bestStreak: 0,
        done: false,
        feedback: '',
        reveal: false,
        questions: questions
      };
      state.practice.notice = '';
      updateStreak();
      return;
    }

    const pool = getPracticePool(practice.alphabet);
    if (pool.length < 4) {
      state.practice.session = null;
      state.practice.notice = 'Öppna Lär dig och gå igenom minst 4 tecken först.';
      return;
    }

    const picked = pickPracticeChars(pool, SESSION_QUESTION_COUNT, practice.alphabet);

    const questions = picked.map(function (charObj) {
      return createPracticeQuestion(charObj, practice.mode, practice.alphabet);
    });

    state.practice.session = {
      index: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      done: false,
      feedback: '',
      reveal: false,
      questions: questions
    };
    state.practice.notice = '';
    updateStreak();
  }

  function buildWordQuestions(count) {
    const source = SIMPLE_WORDS.slice();
    shuffle(source);
    const picked = [];
    for (let i = 0; i < count; i += 1) {
      picked.push(source[i % source.length]);
    }

    return picked.map(function (wordObj) {
      return createWordQuestion(wordObj);
    });
  }

  function createWordQuestion(wordObj) {
    const options = buildOptions(SIMPLE_WORDS, wordObj.meaning, function (item) {
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

  function getPracticePool(alphabetChoice) {
    if (alphabetChoice === 'mixed') {
      return ALPHABETS.hiragana.chars
        .filter(function (item) {
          return state.seenChars.hiragana[item.char];
        })
        .concat(
          ALPHABETS.katakana.chars.filter(function (item) {
            return state.seenChars.katakana[item.char];
          })
        );
    }
    return ALPHABETS[alphabetChoice].chars.filter(function (item) {
      return state.seenChars[alphabetChoice][item.char];
    });
  }

  function getLearnWordList(alphabetId) {
    return alphabetId === 'katakana' ? SIMPLE_WORDS_KATAKANA : SIMPLE_WORDS;
  }

  function getLearnWordGroups(alphabetId) {
    const words = getLearnWordList(alphabetId);
    const groups = [];
    for (let i = 0; i < words.length; i += WORD_GROUP_SIZE) {
      groups.push(words.slice(i, i + WORD_GROUP_SIZE));
    }
    return groups;
  }

  function getCurrentLearnWords() {
    const groups = getLearnWordGroups(state.learn.alphabet);
    return groups[state.learn.wordGroupIndex] || groups[0] || [];
  }

  function isWordLessonUnlocked(alphabetId) {
    return state.completedGroups[alphabetId].every(function (done) {
      return done;
    });
  }

  function isWordGroupUnlocked(alphabetId, wordGroupIndex) {
    if (!isWordLessonUnlocked(alphabetId)) {
      return false;
    }
    if (wordGroupIndex === 0) {
      return true;
    }
    return Boolean(state.completedWordLessons[alphabetId][wordGroupIndex - 1]);
  }

  function pickPracticeChars(pool, count, alphabetChoice) {
    const scored = pool.map(function (charObj) {
      const progress = getProgressEntry(charObj.char, alphabetChoice);
      const due = progress.nextReview <= todayKey() ? 2 : 0;
      const weak = Math.max(0, 6 - progress.level);
      const weight = weak + progress.timesWrong * 0.3 + due + 1;
      return { charObj: charObj, weight: weight };
    });

    const picked = [];
    for (let i = 0; i < count; i += 1) {
      picked.push(weightedPick(scored));
    }

    return picked;
  }

  function weightedPick(items) {
    const totalWeight = items.reduce(function (sum, item) {
      return sum + item.weight;
    }, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i += 1) {
      random -= items[i].weight;
      if (random <= 0) {
        return items[i].charObj;
      }
    }
    return items[items.length - 1].charObj;
  }

  function getProgressEntry(char, alphabetChoice) {
    if (state.progress.hiragana[char]) {
      return state.progress.hiragana[char];
    }
    if (state.progress.katakana[char]) {
      return state.progress.katakana[char];
    }
    return { level: 1, timesCorrect: 0, timesWrong: 0, nextReview: todayKey() };
  }

  function createPracticeQuestion(charObj, mode, alphabetChoice) {
    const pool = getPracticePool(alphabetChoice);

    if (mode === 'sound_to_char') {
      const options = buildOptions(pool, charObj.char, function (item) {
        return item.char;
      });
      return {
        char: charObj.char,
        romaji: charObj.romaji,
        prompt: 'Lyssna och välj rätt tecken',
        answer: charObj.char,
        options: options,
        mode: mode
      };
    }

    const options = buildOptions(pool, charObj.romaji, function (item) {
      return item.romaji;
    });
    return {
      char: charObj.char,
      romaji: charObj.romaji,
      prompt: 'Välj rätt romaji',
      answer: charObj.romaji,
      options: options,
      mode: mode
    };
  }

  function buildOptions(pool, answer, pickFn) {
    const values = new Set([answer]);
    while (values.size < 4) {
      const candidate = pickFn(pool[Math.floor(Math.random() * pool.length)]);
      values.add(candidate);
      if (values.size === pool.length) {
        break;
      }
    }
    const options = Array.from(values);
    shuffle(options);
    return options;
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
  }

  function findCharBySymbol(alphabet, symbol) {
    return alphabet.chars.find(function (item) {
      return item.char === symbol;
    });
  }

  function answerLearnQuiz(value) {
    const quiz = state.learn.quiz;
    if (!quiz || quiz.done) {
      return;
    }

    const question = quiz.questions[quiz.index];
    const correct = question.answer === value;
    if (correct) {
      quiz.correct += 1;
      quiz.feedback = 'Rätt!';
    } else {
      quiz.feedback = 'Inte riktigt. Rätt svar: ' + question.answer;
    }

    quiz.index += 1;
    if (quiz.index >= quiz.questions.length) {
      quiz.done = true;
      const percent = Math.round((quiz.correct / quiz.questions.length) * 100);
      if (percent >= 80) {
        if (state.learn.unit === 'words') {
          state.completedWordLessons[state.learn.alphabet][state.learn.wordGroupIndex] = true;
        } else {
          state.completedGroups[state.learn.alphabet][state.learn.groupIndex] = true;
        }
      }
      unlockBadges();
      markProgressUpdated();
      saveState();
    }

    render();
  }

  function answerPractice(value) {
    const session = state.practice.session;
    if (!session || session.done) {
      return;
    }

    const question = session.questions[session.index];
    const correct = value === question.answer;

    if (question.mode !== 'word_to_meaning') {
      applyReview(question.char, correct);
    }

    if (correct) {
      session.correct += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      session.feedback = '✅ Rätt svar!';
    } else {
      session.streak = 0;
      session.feedback = '❌ Fel, rätt svar är ' + question.answer;
    }

    session.index += 1;
    if (session.index >= session.questions.length) {
      session.done = true;
      unlockBadges();
      saveState();
    }

    render();
  }

  function applyReview(char, correct) {
    const today = todayKey();
    const group = state.progress.hiragana[char] ? 'hiragana' : state.progress.katakana[char] ? 'katakana' : null;
    const data = group ? state.progress[group][char] : null;
    if (!data) {
      return;
    }
    state.seenChars[group][char] = true;
    state.progress[group][char] = core.applyReview(data, correct, today);
    markProgressUpdated();
  }

  function unlockBadges() {
    if (state.completedGroups.hiragana[0]) {
      addBadge('hiragana_beginner');
    }

    const allHiraganaStrong = Object.keys(state.progress.hiragana).every(function (char) {
      return state.progress.hiragana[char].level >= 3;
    });
    if (allHiraganaStrong) {
      addBadge('hiragana_master');
    }

    const session = state.practice.session;
    if (session && session.done && session.bestStreak >= 10) {
      addBadge('fast_lightning');
    }

    if (session && session.done && session.correct === session.questions.length) {
      addBadge('perfect_session');
    }
  }

  function addBadge(id) {
    if (!state.badges.includes(id)) {
      state.badges.push(id);
    }
  }

  function goNextLearnCard(step) {
    const learn = state.learn;
    const maxIndex = learn.unit === 'words'
      ? getCurrentLearnWords().length - 1
      : ALPHABETS[learn.alphabet].rows[learn.groupIndex].length - 1;
    learn.cardIndex = Math.min(maxIndex, Math.max(0, learn.cardIndex + step));
  }

  function render() {
    saveState();
    if (state.view === 'intro') {
      renderIntro();
    } else if (state.view === 'home') {
      renderHome();
    } else if (state.view === 'learn') {
      renderLearn();
    } else if (state.view === 'practice') {
      renderPractice();
    } else {
      renderProgress();
    }

    if (pendingLearnFocus && state.view === 'learn') {
      pendingLearnFocus = false;
      requestAnimationFrame(function () {
        const focusCard = document.getElementById('learn-focus');
        if (focusCard) {
          focusCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  function topBarHtml() {
    return '<div class="topbar"><h1>Japanska för barn</h1><div class="streak-pill">🔥 Streak: ' + state.streak.current + ' dagar</div></div>';
  }

  function renderIntro() {
    app.innerHTML =
      '<section class="intro-screen card">' +
      '<p class="intro-japanese" lang="ja">こんにちは</p>' +
      '<p class="intro-romaji">Ko ni chi wa!</p>' +
      '<p class="muted">Välkommen till japanska för barn.</p>' +
      '<button class="btn-main" data-action="start-game">Starta</button>' +
      '</section>';
  }

  function renderHome() {
    app.innerHTML =
      topBarHtml() +
      '<section class="home-grid">' +
      '<article class="card hero"><div class="avatar" aria-hidden="true">😊</div><div><h2>Hej! Redo att träna japanska?</h2><p class="muted">Lär dig tecken steg för steg med ljud, quiz och badges.</p></div></article>' +
      '<article class="card action-row">' +
      '<button class="btn-main" data-action="go-learn">🎓 Lär dig</button>' +
      '<button class="btn-main" data-action="go-practice">🎮 Öva</button>' +
      '<button class="btn-main" data-action="go-progress">⭐ Mina framsteg</button>' +
      '</article>' +
      '<article class="card progress-wrap">' +
      progressBarHtml('Hiragana (upptäckta)', getSeenCount('hiragana'), ALPHABETS.hiragana.chars.length, getSeenPercent('hiragana')) +
      progressBarHtml('Katakana (upptäckta)', getSeenCount('katakana'), ALPHABETS.katakana.chars.length, getSeenPercent('katakana')) +
      '</article>' +
      '</section>';
  }

  function progressBarHtml(label, done, total, percent) {
    return (
      '<div><div class="progress-label"><span>' + label + '</span><span>' + done + '/' + total + '</span></div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + percent + '%"></div></div></div>'
    );
  }

  function renderLearn() {
    const learn = state.learn;
    const alphabet = ALPHABETS[learn.alphabet];
    const isWordUnit = learn.unit === 'words';
    const group = isWordUnit ? null : alphabet.rows[learn.groupIndex];
    const wordGroups = getLearnWordGroups(learn.alphabet);
    const wordList = wordGroups[learn.wordGroupIndex] || wordGroups[0] || [];
    const current = isWordUnit
      ? wordList[learn.cardIndex]
      : findCharBySymbol(alphabet, group[learn.cardIndex][0]);

    if (!isWordUnit && !learn.quiz) {
      if (!state.seenChars[learn.alphabet][current.char]) {
        markProgressUpdated();
      }
      state.seenChars[learn.alphabet][current.char] = true;
    }

    if (!learn.quiz) {
      speak(isWordUnit ? current.word : current.char);
    }

    const groupCards = alphabet.rows
      .map(function (row, index) {
        const unlocked = isGroupUnlocked(learn.alphabet, index);
        const done = state.completedGroups[learn.alphabet][index];
        const sample = row.map(function (entry) {
          return entry[0];
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
    const wordsCard = wordGroups.map(function (words, index) {
      const unlocked = isWordGroupUnlocked(learn.alphabet, index);
      const done = state.completedWordLessons[learn.alphabet][index];
      return (
        '<div class="group-card ' + (unlocked ? '' : 'locked') + '">' +
        '<h4>Ordgrupp ' + (index + 1) + ' ' + (done ? '✅' : unlocked ? '' : '🔒') + '</h4>' +
        '<p class="muted" style="font-family:var(--jp-font)">' + words.map(function (item) {
          return item.word;
        }).join(' ') + '</p>' +
        '<button class="btn-soft" data-action="pick-word-lesson" data-word-group-index="' + index + '" ' + (unlocked ? '' : 'disabled') + '>Välj</button>' +
        '</div>'
      );
    }).join('');

    let learnBody = '';
    if (learn.quiz) {
      const quiz = learn.quiz;
      if (quiz.done) {
        const pct = Math.round((quiz.correct / quiz.questions.length) * 100);
        const isWordQuiz = learn.unit === 'words';
        const celebrationClass = pct >= 100 ? 'perfect' : pct >= 80 ? 'great' : 'try-again';
        const celebrationText = pct >= 100
          ? 'Wow! Perfekt resultat! Du är en riktig stjärna! 🌟'
          : pct >= 80
            ? 'Snyggt jobbat! Gruppen är godkänd! 🎉'
            : 'Bra kämpat! Försök igen så fixar du det! 💪';
        learnBody =
          '<article class="card">' +
          '<div class="quiz-celebration ' + celebrationClass + '">' +
          '<div class="confetti confetti-1"></div><div class="confetti confetti-2"></div><div class="confetti confetti-3"></div>' +
          '<h3>Mini-quiz klart</h3>' +
          '<p class="celebration-text">' + celebrationText + '</p>' +
          '<p>Resultat: <strong>' + pct + '%</strong> (' + quiz.correct + '/' + quiz.questions.length + ')</p>' +
          '</div>' +
          '<p class="muted">' + (isWordQuiz
            ? 'Minst 80% krävs för att klara orddelen.'
            : 'Minst 80% krävs för att låsa upp nästa grupp.') + '</p>' +
          '<button class="btn-main" data-action="close-learn-quiz">Tillbaka till gruppen</button></article>';
      } else {
        const q = quiz.questions[quiz.index];
        learnBody =
          '<article class="card"><h3>Mini-quiz (' + (quiz.index + 1) + '/' + quiz.questions.length + ')</h3>' +
          '<p class="big-char">' + q.promptChar + '</p>' +
          '<div class="options-grid">' +
          q.options.map(function (option) {
            return '<button class="btn-soft" data-action="answer-learn-quiz" data-value="' + option + '">' + option + '</button>';
          }).join('') +
          '</div><p class="feedback">' + (quiz.feedback || '') + '</p></article>';
      }
    } else {
      learnBody =
        '<article class="card learn-focus-card" id="learn-focus">' +
        '<h3>' + (isWordUnit ? alphabet.name + ' Ordgrupp ' + (learn.wordGroupIndex + 1) : alphabet.name + ' Grupp ' + (learn.groupIndex + 1)) + '</h3>' +
        '<p class="big-char">' + (isWordUnit ? current.word : current.char) + '</p>' +
        '<p class="romaji">' + (isWordUnit ? current.romaji + ' - ' + current.meaning : current.romaji) + '</p>' +
        (isWordUnit
          ? '<p><strong>Betydelse:</strong> ' + current.meaning + '</p>'
          : '<p><strong>Minnesknep:</strong> ' + current.mnemonic + '</p>') +
        '<p class="muted">' + (isWordUnit ? 'Lyssna på ordet och säg både japanska och svenska högt.' : (current.tip || 'Tryck på ljudknappen flera gånger och härma uttalet.')) + '</p>' +
        '<div class="action-row" style="grid-template-columns:repeat(4,minmax(0,1fr));">' +
        '<button class="btn-soft" data-action="learn-prev">← Förra</button>' +
        '<button class="btn-soft" data-action="learn-speak">🔊 Ljud</button>' +
        '<button class="btn-soft" data-action="learn-next">Nästa →</button>' +
        '<button class="btn-main" data-action="start-learn-quiz">' + (isWordUnit ? 'Starta ord-quiz' : 'Starta mini-quiz') + '</button>' +
        '</div></article>';
    }

    app.innerHTML =
      topBarHtml() +
      '<section class="learn-layout">' +
      '<article class="card"><div class="alphabet-toggle">' +
      '<button class="btn-soft toggle-btn ' + (learn.alphabet === 'hiragana' ? 'active' : '') + '" data-action="set-learn-alphabet" data-value="hiragana">Hiragana</button>' +
      '<button class="btn-soft toggle-btn ' + (learn.alphabet === 'katakana' ? 'active' : '') + '" data-action="set-learn-alphabet" data-value="katakana">Katakana</button>' +
      '<button class="btn-soft" data-action="toggle-groups">' + (learn.groupsCollapsed ? 'Visa grupper' : 'Minimera grupper') + '</button>' +
      '<button class="btn-soft" data-action="go-home">Hem</button>' +
      '</div></article>' +
      (learn.groupsCollapsed ? '' : '<article class="card group-grid">' + groupCards + wordsCard + '</article>') +
      learnBody +
      '</section>';
  }

  function renderPractice() {
    const practice = state.practice;
    const isWordLevel = practice.level === 'words';
    const quickModeMenu =
      '<article class="card practice-quick-menu">' +
      '<div class="practice-quick-row">' +
      '<span class="muted"><strong>Snabbval nivå:</strong></span>' +
      '<button class="btn-soft toggle-btn ' + (practice.level === 'chars' ? 'active' : '') + '" data-action="set-practice-level" data-value="chars">Tecken</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.level === 'words' ? 'active' : '') + '" data-action="set-practice-level" data-value="words">Enkla ord</button>' +
      '</div>' +
      (isWordLevel
        ? ''
        : '<div class="practice-quick-row">' +
      '<span class="muted"><strong>Snabbval spelläge:</strong></span>' +
      '<button class="btn-soft toggle-btn ' + (practice.mode === 'char_to_romaji' ? 'active' : '') + '" data-action="set-practice-mode" data-value="char_to_romaji">Tecken → Ljud</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.mode === 'sound_to_char' ? 'active' : '') + '" data-action="set-practice-mode" data-value="sound_to_char">Ljud → Tecken</button>' +
      '</div>') +
      '</article>';

    let sessionBody =
      '<article class="card"><h3>Öva</h3><p>' + (isWordLevel
        ? 'Träna enkla japanska ord. Sessionen innehåller '
        : 'Välj läge och alfabet. Sessionen innehåller ') + SESSION_QUESTION_COUNT + ' frågor.</p>' +
      '<div class="mode-toggle">' +
      '<button class="btn-soft toggle-btn ' + (practice.level === 'chars' ? 'active' : '') + '" data-action="set-practice-level" data-value="chars">Tecken</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.level === 'words' ? 'active' : '') + '" data-action="set-practice-level" data-value="words">Enkla ord</button>' +
      '</div>' +
      (isWordLevel
        ? '<p class="muted" style="margin-top:8px;">Öva vanliga nybörjarord med japanska ord till svenska betydelser.</p>'
        : '') +
      (isWordLevel
        ? ''
        :
      '<div class="mode-toggle">' +
      '<button class="btn-soft toggle-btn ' + (practice.mode === 'char_to_romaji' ? 'active' : '') + '" data-action="set-practice-mode" data-value="char_to_romaji">Tecken → Ljud</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.mode === 'sound_to_char' ? 'active' : '') + '" data-action="set-practice-mode" data-value="sound_to_char">Ljud → Tecken</button>' +
      '</div>') +
      (isWordLevel
        ? ''
        :
      '<div class="alphabet-toggle" style="margin-top:8px;">' +
      '<button class="btn-soft toggle-btn ' + (practice.alphabet === 'hiragana' ? 'active' : '') + '" data-action="set-practice-alphabet" data-value="hiragana">Hiragana</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.alphabet === 'katakana' ? 'active' : '') + '" data-action="set-practice-alphabet" data-value="katakana">Katakana</button>' +
      '<button class="btn-soft toggle-btn ' + (practice.alphabet === 'mixed' ? 'active' : '') + '" data-action="set-practice-alphabet" data-value="mixed">Blandat</button>' +
      '</div>') +
      (practice.notice ? '<p class="feedback bad">' + practice.notice + '</p>' : '') +
      '<div style="margin-top:10px;"><button class="btn-main" data-action="start-practice">Starta session</button></div></article>';

    const session = practice.session;
    if (session) {
      if (session.done) {
        const pct = Math.round((session.correct / session.questions.length) * 100);
        sessionBody +=
          '<article class="card"><h3>Resultat</h3>' +
          '<p><strong>' + pct + '% rätt</strong> (' + session.correct + '/' + session.questions.length + ')</p>' +
          '<p class="muted">Bästa streak i sessionen: ' + session.bestStreak + '</p>' +
          '<button class="btn-main" data-action="start-practice">Kör igen</button></article>';
      } else {
        const q = session.questions[session.index];
        if (q.mode === 'sound_to_char') {
          speak(q.char);
        } else if (q.mode === 'word_to_meaning') {
          speak(q.word);
        }

        sessionBody +=
          '<article class="card"><h3>Fråga ' + (session.index + 1) + '/' + session.questions.length + '</h3>' +
          '<p><strong>' + q.prompt + '</strong></p>' +
          '<p class="big-char">' + (q.mode === 'char_to_romaji' ? q.char : q.mode === 'word_to_meaning' ? q.word : '🔊') + '</p>' +
          (q.mode === 'word_to_meaning' ? '<p class="romaji">' + q.romaji + '</p>' : '') +
          '<div class="action-row" style="grid-template-columns:repeat(2,minmax(0,1fr));">' +
          (q.mode === 'sound_to_char' || q.mode === 'word_to_meaning' ? '<button class="btn-soft" data-action="repeat-sound">🔊 Spela igen</button>' : '<div></div>') +
          '<div></div></div>' +
          '<div class="options-grid">' +
          q.options.map(function (option) {
            return '<button class="btn-soft option-btn" data-action="answer-practice" data-value="' + option + '">' + option + '</button>';
          }).join('') +
          '</div><p class="feedback">' + (session.feedback || '') + '</p></article>';
      }
    }

    app.innerHTML =
      topBarHtml() +
      '<section class="practice-layout">' +
      quickModeMenu +
      '<article class="card"><button class="btn-soft" data-action="go-home">Hem</button></article>' +
      sessionBody +
      '</section>';
  }

  function renderProgress() {
    const hiraPct = getSeenPercent('hiragana');
    const kataPct = getSeenPercent('katakana');
    const circles =
      '<div class="circle-row">' +
      progressCircleHtml('Hiragana upptäckta', hiraPct) +
      progressCircleHtml('Katakana upptäckta', kataPct) +
      '</div>';

    const hiraGrid = renderCharLevelGrid('hiragana');
    const kataGrid = renderCharLevelGrid('katakana');
    const calendar = renderCalendar();
    const badges = BADGES.map(function (badge) {
      const unlocked = state.badges.includes(badge.id);
      return '<div class="badge-item ' + (unlocked ? 'unlocked' : '') + '"><strong>' + badge.icon + ' ' + badge.name + '</strong><div class="muted">' + badge.rule + '</div></div>';
    }).join('');

    app.innerHTML =
      topBarHtml() +
      '<section class="progress-layout">' +
      '<article class="card"><button class="btn-soft" data-action="go-home">Hem</button></article>' +
      '<article class="card"><h3>Framsteg</h3>' + circles +
      '<p class="muted">Upptäckta: Hiragana ' + getSeenCount('hiragana') + '/46, Katakana ' + getSeenCount('katakana') + '/46</p>' +
      '<p class="muted">Mästarnivå (L3+): Hiragana ' + getLearnedCount('hiragana') + '/46, Katakana ' + getLearnedCount('katakana') + '/46</p>' +
      '<p class="muted">Senast uppdaterad: ' + formatUpdatedAt(state.progressUpdatedAt) + '</p></article>' +
      '<article class="card"><h3>Streak-kalender (senaste 28 dagar)</h3>' + calendar + '</article>' +
      '<article class="card"><h3>Badges</h3><div class="badge-grid">' + badges + '</div></article>' +
      '<article class="card"><h3>Hiragana nivåer</h3>' + hiraGrid + '</article>' +
      '<article class="card"><h3>Katakana nivåer</h3>' + kataGrid + '</article>' +
      '</section>';
  }

  function progressCircleHtml(label, pct) {
    return '<div class="circle" style="background:conic-gradient(#4fc9a6 ' + pct + '%, #e9f0fb ' + pct + '% 100%)"><div>' + label + '<br>' + pct + '%</div></div>';
  }

  function renderCharLevelGrid(alphabetId) {
    const alphabet = ALPHABETS[alphabetId];
    return '<div class="char-grid">' + alphabet.chars.map(function (item) {
      const level = state.progress[alphabetId][item.char].level;
      return '<div class="char-pill"><div class="jp">' + item.char + '</div><div>L' + level + '</div></div>';
    }).join('') + '</div>';
  }

  function renderCalendar() {
    const history = new Set(state.streak.history);
    const days = [];
    const today = new Date(todayKey() + 'T00:00:00');

    for (let i = 27; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = String(d.getDate());
      days.push('<div class="day-cell ' + (history.has(key) ? 'active' : '') + '">' + label + '</div>');
    }

    return '<div class="calendar">' + days.join('') + '</div>';
  }

  app.addEventListener('click', function (event) {
    const target = event.target.closest('[data-action]');
    if (!target) {
      return;
    }

    const action = target.dataset.action;
    const value = target.dataset.value;

    if (action === 'start-game') {
      setView('home');
    } else if (action === 'go-home') {
      setView('home');
    } else if (action === 'go-learn') {
      setView('learn');
    } else if (action === 'go-practice') {
      setView('practice');
    } else if (action === 'go-progress') {
      setView('progress');
    } else if (action === 'set-learn-alphabet') {
      state.learn.alphabet = value;
      state.learn.unit = 'group';
      state.learn.groupIndex = 0;
      state.learn.wordGroupIndex = 0;
      state.learn.cardIndex = 0;
      state.learn.quiz = null;
      state.learn.groupsCollapsed = false;
      render();
    } else if (action === 'toggle-groups') {
      state.learn.groupsCollapsed = !state.learn.groupsCollapsed;
      render();
    } else if (action === 'pick-group') {
      const groupIndex = Number(target.dataset.groupIndex || 0);
      if (isGroupUnlocked(state.learn.alphabet, groupIndex)) {
        state.learn.unit = 'group';
        state.learn.groupIndex = groupIndex;
        state.learn.cardIndex = 0;
        state.learn.quiz = null;
        state.learn.groupsCollapsed = true;
        pendingLearnFocus = true;
        render();
      }
    } else if (action === 'pick-word-lesson') {
      const wordGroupIndex = Number(target.dataset.wordGroupIndex || 0);
      if (isWordGroupUnlocked(state.learn.alphabet, wordGroupIndex)) {
        state.learn.unit = 'words';
        state.learn.wordGroupIndex = wordGroupIndex;
        state.learn.cardIndex = 0;
        state.learn.quiz = null;
        state.learn.groupsCollapsed = true;
        pendingLearnFocus = true;
        render();
      }
    } else if (action === 'learn-prev') {
      goNextLearnCard(-1);
      render();
    } else if (action === 'learn-next') {
      goNextLearnCard(1);
      render();
    } else if (action === 'learn-speak') {
      if (state.learn.unit === 'words') {
        const words = getLearnWordList(state.learn.alphabet);
        speak(words[state.learn.cardIndex].word);
      } else {
        const alphabet = ALPHABETS[state.learn.alphabet];
        const symbol = alphabet.rows[state.learn.groupIndex][state.learn.cardIndex][0];
        const charObj = findCharBySymbol(alphabet, symbol);
        speak(charObj.char);
      }
    } else if (action === 'start-learn-quiz') {
      startLearnQuiz();
      render();
    } else if (action === 'answer-learn-quiz') {
      answerLearnQuiz(value);
    } else if (action === 'close-learn-quiz') {
      state.learn.quiz = null;
      render();
    } else if (action === 'set-practice-mode') {
      state.practice.mode = value;
      state.practice.notice = '';
      render();
    } else if (action === 'set-practice-level') {
      state.practice.level = value === 'words' ? 'words' : 'chars';
      state.practice.session = null;
      state.practice.notice = '';
      render();
    } else if (action === 'set-practice-alphabet') {
      state.practice.alphabet = value;
      state.practice.notice = '';
      render();
    } else if (action === 'start-practice') {
      startPracticeSession();
      render();
    } else if (action === 'answer-practice') {
      answerPractice(value);
    } else if (action === 'repeat-sound') {
      const session = state.practice.session;
      if (session && !session.done) {
        const q = session.questions[session.index];
        if (q.mode === 'word_to_meaning') {
          speak(q.word);
        } else if (q.mode === 'sound_to_char') {
          speak(q.char);
        } else {
          speak(q.romaji);
        }
      }
    }
  });

  render();
})();
