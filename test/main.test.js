// The app runs in Sweden; date bugs only show up with a positive UTC offset.
process.env.TZ = 'Europe/Stockholm';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const curriculum = require('../src/curriculum.js');

const ROOT = path.join(__dirname, '..');
const STORAGE_KEY = 'japanskaBarnApp.v2';

// Runs the real app scripts against a minimal DOM stub so click flows can be tested.
// options: voices (speechSynthesis.getVoices result), failStorageWrites, confirm (answer to window.confirm).
function loadApp(savedState, extraStorage, options) {
  const opts = options || {};
  const storage = { ...extraStorage };
  if (savedState) {
    storage[STORAGE_KEY] = JSON.stringify(savedState);
  }
  const spoken = [];
  const voicesUsed = [];
  const focused = [];
  const announcer = { textContent: '' };
  // A fake canvas that records drawing calls, so the writing pad can be tested.
  const drawn = [];
  const canvasHandlers = {};
  const canvas = {
    width: 600,
    height: 600,
    getContext: () => ({
      beginPath: () => drawn.push('begin'),
      moveTo: () => {},
      lineTo: () => drawn.push('line'),
      stroke: () => drawn.push('stroke')
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }),
    addEventListener: (type, fn) => {
      canvasHandlers[type] = fn;
    },
    setPointerCapture: () => {}
  };
  const appElement = {
    innerHTML: '',
    listener: null,
    // Finds the selector's attributes in one rendered tag, so focus tests fail when the target is missing.
    querySelector: (selector) => {
      const wanted = [...selector.matchAll(/\[([\w-]+)="([^"]*)"\]/g)].map((m) => m[1] + '="' + m[2] + '"')
        .concat([...selector.matchAll(/#([\w-]+)/g)].map((m) => 'id="' + m[1] + '"'));
      const tags = appElement.innerHTML.match(/<[^>]+>/g) || [];
      const found = tags.some((tag) => wanted.every((attr) => tag.includes(attr)));
      return found ? { focus: () => focused.push(selector) } : null;
    },
    addEventListener: function (type, fn) {
      this.listener = fn;
    }
  };
  const context = {
    document: {
      getElementById: (id) => (id === 'announcer' ? announcer : id === 'writing-canvas' ? canvas : appElement)
    },
    localStorage: {
      getItem: (key) => (key in storage ? storage[key] : null),
      removeItem: (key) => {
        delete storage[key];
      },
      setItem: (key, value) => {
        if (opts.failStorageWrites) {
          throw new Error('QuotaExceededError');
        }
        storage[key] = String(value);
      }
    },
    speechSynthesis: {
      cancel: () => {},
      getVoices: () => context.voices,
      addEventListener: (type, fn) => {
        context.voiceListener = fn;
      },
      speak: (utterance) => {
        spoken.push(utterance.text);
        voicesUsed.push(utterance.voice);
      }
    },
    confirm: (text) => (context.confirmHook ? context.confirmHook(text) : opts.confirm !== false),
    // A list of answers is used one prompt at a time.
    prompt: () => (Array.isArray(opts.prompt) ? (opts.prompt.length ? opts.prompt.shift() : null) : opts.prompt === undefined ? null : opts.prompt),
    devicePixelRatio: opts.devicePixelRatio || 1,
    SpeechSynthesisUtterance: function (text) {
      this.text = text;
    },
    requestAnimationFrame: () => {}
  };
  context.window = context;
  context.voices = opts.voices || [];
  vm.createContext(context);
  ['src/app-core.js', 'src/curriculum.js', 'src/main.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });

  return {
    spoken: spoken,
    voicesUsed: voicesUsed,
    focused: focused,
    announced: () => announcer.textContent,
    stored: (key) => (key in storage ? JSON.parse(storage[key]) : null),
    canvas: canvas,
    drawn: drawn,
    pointer: (type, event) => canvasHandlers[type](event),
    // Like click, but fails when no such button is on screen.
    clickVisible: (action, value) => {
      const attr = 'data-action="' + action + '"' + (value ? ' data-value="' + value + '"' : '');
      assert.ok(appElement.innerHTML.includes(attr), 'no button ' + attr);
      context.clickEvent = { target: { closest: () => ({ dataset: { action: action, value: value } }) } };
      vm.runInContext('document.getElementById("app").listener(clickEvent)', context, { timeout: 1000 });
    },
    // Simulates the browser finishing loading its voices.
    voicesChanged: (voices) => {
      context.voices = voices;
      vm.runInContext('voiceListener()', context, { timeout: 1000 });
    },
    setConfirm: (fn) => {
      context.confirmHook = fn;
    },
    markHtml: () => {
      appElement.innerHTML = 'MARK';
    },
    html: () => appElement.innerHTML,
    state: () => JSON.parse(storage[STORAGE_KEY]),
    click: (action, dataset) => {
      context.clickEvent = {
        target: { closest: () => ({ dataset: { action: action, ...dataset } }) }
      };
      // Timeout turns an infinite loop into a test failure instead of a hung test run.
      vm.runInContext('document.getElementById("app").listener(clickEvent)', context, { timeout: 1000 });
    }
  };
}

const SEEN_FIRST_HIRAGANA_ROW = {
  seenChars: { hiragana: { あ: true, い: true, う: true, え: true, お: true } }
};

function completedUpTo(count, total) {
  return Array.from({ length: total || 21 }, (_, i) => i < count);
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function finishPracticeSession(app) {
  let session = app.state().practice.session;
  while (!session.done) {
    app.click('answer-practice', { value: session.questions[session.index].answer });
    app.click('next-practice');
    session = app.state().practice.session;
  }
}

function finishLearnQuiz(app) {
  let quiz = app.state().learn.quiz;
  while (!quiz.done) {
    app.click('answer-learn-quiz', { value: quiz.questions[quiz.index].answer });
    app.click('next-learn-quiz');
    quiz = app.state().learn.quiz;
  }
}

test('intro romaji keeps the ん in こんにちは', () => {
  const app = loadApp();
  assert.match(app.html(), /Kon-ni-chi-wa/);
});

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

test('mixed practice with fewer than four distinct sounds shows a notice instead of freezing', () => {
  const app = loadApp({
    practice: { alphabet: 'mixed', level: 'chars', mode: 'char_to_romaji' },
    seenChars: {
      hiragana: { あ: true, い: true, う: true },
      katakana: { ア: true, イ: true, ウ: true }
    }
  });
  app.click('go-practice');
  app.click('start-practice');

  const practice = app.state().practice;
  assert.equal(practice.session, null);
  assert.notEqual(practice.notice, '');
});

test('mixed practice options are unique when hiragana and katakana share sounds', () => {
  const app = loadApp({
    practice: { alphabet: 'mixed', level: 'chars', mode: 'char_to_romaji' },
    seenChars: {
      hiragana: { あ: true, い: true, う: true, え: true, お: true },
      katakana: { ア: true, イ: true, ウ: true, エ: true, オ: true }
    }
  });
  app.click('go-practice');
  app.click('start-practice');

  app.state().practice.session.questions.forEach((question) => {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(question.options.includes(question.answer), true);
  });
});

test('practice keeps the answered question on screen with right and wrong options marked', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];
  const wrong = question.options.find((option) => option !== question.answer);

  app.click('answer-practice', { value: wrong });

  assert.equal(app.state().practice.session.index, 0);
  assert.match(app.html(), new RegExp('option-btn correct"[^>]*>' + question.answer + '<'));
  assert.match(app.html(), new RegExp('option-btn wrong"[^>]*>' + wrong + '<'));
  assert.match(app.html(), /class="feedback bad"/);
});

test('practice moves to the next question when the child presses next', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];

  app.click('answer-practice', { value: question.answer });
  app.click('next-practice');

  assert.equal(app.state().practice.session.index, 1);
});

test('practice plays the correct character after an answer', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];

  app.click('answer-practice', { value: question.answer });

  assert.equal(app.spoken.at(-1), question.char);
});

test('learn quiz shows feedback on the answered question before moving on', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('start-learn-quiz');
  const question = app.state().learn.quiz.questions[0];

  app.click('answer-learn-quiz', { value: question.answer });
  assert.equal(app.state().learn.quiz.index, 0);
  assert.match(app.html(), /class="feedback ok"/);

  app.click('next-learn-quiz');
  assert.equal(app.state().learn.quiz.index, 1);
});

test('streak calendar marks today when the child practised today', () => {
  const today = localDateKey(new Date());
  const app = loadApp({ streak: { current: 1, best: 1, lastDate: today, history: [today] } });
  app.click('go-progress');

  const cells = [...app.html().matchAll(/<div class="day-cell ([^"]*)">(\d+)<\/div>/g)];
  const todayCell = cells.at(-1);
  assert.equal(todayCell[2], String(new Date().getDate()));
  assert.equal(todayCell[1], 'active');
});

test('streak pill shows zero after a missed day', () => {
  const longAgo = localDateKey(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
  const app = loadApp({ streak: { current: 5, best: 5, lastDate: longAgo, history: [longAgo] } });
  app.click('start-game');

  assert.match(app.html(), /Streak: 0 dagar/);
});

test('streak pill uses singular for one day', () => {
  const today = localDateKey(new Date());
  const app = loadApp({ streak: { current: 1, best: 1, lastDate: today, history: [today] } });
  app.click('start-game');

  assert.match(app.html(), /Streak: 1 dag</);
});

test('starting a practice session does not count towards the streak', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');

  assert.equal(app.state().streak.lastDate, null);
});

test('finishing a practice session counts towards the streak', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  finishPracticeSession(app);

  assert.equal(app.state().streak.lastDate, localDateKey(new Date()));
  assert.equal(app.state().streak.current, 1);
});

test('finishing a learn quiz counts towards the streak', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('start-learn-quiz');
  finishLearnQuiz(app);

  assert.equal(app.state().streak.lastDate, localDateKey(new Date()));
});

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
  const answers = unlocked.flatMap((word) => [word.meaning, word.emoji]);
  app.state().practice.session.questions.forEach((question) => {
    assert.ok(words.includes(question.word), question.word);
    question.options.forEach((option) => assert.ok(answers.includes(option), option));
  });
});

test('practice words shows a notice when no words are unlocked', () => {
  const app = loadApp({ practice: { alphabet: 'hiragana', level: 'words' } });
  app.click('go-practice');
  app.click('start-practice');

  assert.equal(app.state().practice.session, null);
  assert.match(app.state().practice.notice, /Klara fler hiraganagrupper/);
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

// を is written "wo" but speech says "o", so it sounds like お.
const SOUND_OF = {};
['hiragana', 'katakana'].forEach((alphabetId) => {
  curriculum[alphabetId].groups.forEach((group) => {
    group.items.forEach((item) => {
      SOUND_OF[item.char] = item.romaji === 'wo' ? 'o' : item.romaji;
    });
  });
});

test('listening practice needs four different sounds, not just four characters', () => {
  const app = loadApp({
    practice: { alphabet: 'mixed', level: 'chars', mode: 'sound_to_char' },
    seenChars: {
      hiragana: { あ: true, い: true, う: true },
      katakana: { ア: true, イ: true, ウ: true }
    }
  });
  app.click('go-practice');
  app.click('start-practice');

  assert.equal(app.state().practice.session, null);
});

test('listening practice never offers two characters that sound the same', () => {
  const app = loadApp({
    practice: { alphabet: 'mixed', level: 'chars', mode: 'sound_to_char' },
    seenChars: {
      hiragana: { あ: true, い: true, う: true, え: true, お: true, を: true },
      katakana: { ア: true, イ: true, ウ: true, エ: true }
    }
  });
  app.click('go-practice');
  app.click('start-practice');

  app.state().practice.session.questions.forEach((question) => {
    const sounds = question.options.map((option) => SOUND_OF[option]);
    assert.equal(new Set(sounds).size, sounds.length, question.options.join(' '));
  });
});

test('a saved word card position past the end of its group does not break Lär dig', () => {
  const words = curriculum.hiragana.wordGroups[0].words;
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 9 } });
  app.click('go-learn');

  assert.ok(app.html().includes(words[words.length - 1].word));
});

test('a saved lesson group past the end of the curriculum falls back to the last group', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 30, cardIndex: 0 } });
  app.click('go-learn');

  assert.equal(app.state().learn.groupIndex, 20);
});

test('a saved unknown alphabet falls back to hiragana', () => {
  const app = loadApp({ learn: { alphabet: 'kanji', unit: 'group', groupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');

  assert.equal(app.state().learn.alphabet, 'hiragana');
});

test('a practice session never shows the same character twice in a row', () => {
  for (let run = 0; run < 5; run += 1) {
    const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
    app.click('go-practice');
    app.click('start-practice');

    const chars = app.state().practice.session.questions.map((question) => question.char);
    chars.forEach((char, i) => assert.notEqual(char, chars[i - 1], chars.join(' ')));
    chars.forEach((char) => assert.ok(chars.filter((c) => c === char).length <= 2, chars.join(' ')));
  }
});

test('practice words reshuffle each round instead of repeating a fixed cycle', () => {
  const orders = [];
  for (let run = 0; run < 6; run += 1) {
    const app = loadApp({
      completedGroups: { hiragana: completedUpTo(1) },
      practice: { alphabet: 'hiragana', level: 'words' }
    });
    app.click('go-practice');
    app.click('start-practice');
    const words = app.state().practice.session.questions.map((question) => question.word);
    orders.push(words.slice(0, 4).join() === words.slice(4, 8).join());
  }

  assert.ok(orders.includes(false));
});

test('word quizzes never offer the right answer\'s category as a wrong option', () => {
  const wordGroupIndex = curriculum.hiragana.wordGroups.findIndex((group) => group.words.some((word) => word.meaning === 'djur'));
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: wordGroupIndex, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  app.state().learn.quiz.questions.forEach((question) => {
    question.options.forEach((option) => {
      const members = curriculum.categories[option] || [];
      assert.ok(!members.includes(question.answer), question.answer + ' / ' + option);
    });
  });
});

test('quizzes for small groups never borrow whole words from the rule group', () => {
  const ruleRomaji = curriculum.hiragana.groups[10].items.map((item) => item.romaji);
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 13, cardIndex: 0 } });
  app.click('go-learn');
  for (let run = 0; run < 10; run += 1) {
    app.click('start-learn-quiz');
    app.state().learn.quiz.questions.forEach((question) => {
      question.options.forEach((option) => assert.ok(!ruleRomaji.includes(option), option));
    });
  }
});

test('mixed practice words uses unlocked words from both alphabets', () => {
  const hiraganaWords = curriculum.hiragana.wordGroups[0].words.map((word) => word.word);
  const katakanaWords = curriculum.katakana.wordGroups[0].words.map((word) => word.word);
  const app = loadApp({
    completedGroups: {
      hiragana: completedUpTo(curriculum.hiragana.wordGroups[0].afterGroup),
      katakana: completedUpTo(curriculum.katakana.wordGroups[0].afterGroup, 22)
    },
    practice: { alphabet: 'mixed', level: 'words' }
  });
  app.click('go-practice');
  app.click('start-practice');

  const words = app.state().practice.session.questions.map((question) => question.word);
  assert.ok(words.some((word) => hiraganaWords.includes(word)), words.join(' '));
  assert.ok(words.some((word) => katakanaWords.includes(word)), words.join(' '));
});

test('each word group card has its own number', () => {
  const app = loadApp();
  app.click('go-learn');

  const numbers = [...app.html().matchAll(/<h4>⭐ Nya ord (\d+)/g)].map((match) => match[1]);
  assert.equal(new Set(numbers).size, curriculum.hiragana.wordGroups.length);
});

test('the practice words notice says which alphabet needs more groups', () => {
  const app = loadApp({ practice: { alphabet: 'katakana', level: 'words' } });
  app.click('go-practice');
  app.click('start-practice');

  assert.match(app.state().practice.notice, /katakanagrupper/);
});

test('long lesson items get a compact style in the progress view', () => {
  const app = loadApp();
  app.click('go-progress');

  assert.match(app.html(), /class="jp long"[^>]*>いいえ</);
  assert.match(app.html(), /class="jp"[^>]*>あ</);
});

test('long words get a smaller style on the word card', () => {
  const wordGroupIndex = curriculum.katakana.wordGroups.findIndex((group) => group.words.some((word) => word.word === 'ジェットコースター'));
  const cardIndex = curriculum.katakana.wordGroups[wordGroupIndex].words.findIndex((word) => word.word === 'ジェットコースター');
  const app = loadApp({ learn: { alphabet: 'katakana', unit: 'words', wordGroupIndex: wordGroupIndex, cardIndex: cardIndex } });
  app.click('go-learn');

  assert.match(app.html(), /class="big-char long"[^>]*>ジェットコースター</);
});

function failLearnQuiz(app) {
  let quiz = app.state().learn.quiz;
  while (!quiz.done) {
    const question = quiz.questions[quiz.index];
    app.click('answer-learn-quiz', { value: question.options.find((option) => option !== question.answer) });
    app.click('next-learn-quiz');
    quiz = app.state().learn.quiz;
  }
}

test('passing a group quiz offers a button that opens the next group', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('start-learn-quiz');
  finishLearnQuiz(app);
  assert.match(app.html(), /data-action="next-group" data-group-index="1"/);

  app.click('next-group', { groupIndex: '1' });
  assert.equal(app.state().learn.groupIndex, 1);
  assert.equal(app.state().learn.quiz, null);
});

test('failing a group quiz offers to try again', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('start-learn-quiz');
  failLearnQuiz(app);
  assert.doesNotMatch(app.html(), /data-action="next-group"/);

  app.click('retry-learn-quiz');
  assert.equal(app.state().learn.quiz.index, 0);
  assert.equal(app.state().learn.quiz.done, false);
});

test('quizzes for groups with fewer than five items ask each item twice', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 7, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  assert.equal(app.state().learn.quiz.questions.length, 6);
});

test('the word card shows the meaning only once', () => {
  const word = curriculum.hiragana.wordGroups[0].words[0];
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');

  assert.equal(app.html().split(word.meaning).length - 1, 1);
});

test('practice shows the level buttons only once', () => {
  const app = loadApp();
  app.click('go-practice');

  assert.equal(app.html().split('data-action="set-practice-level" data-value="words"').length - 1, 1);
});

test('showing or hiding the group list does not replay the sound', () => {
  const app = loadApp();
  app.click('go-learn');
  const spokenBefore = app.spoken.length;
  app.click('toggle-groups');
  app.click('toggle-groups');

  assert.equal(app.spoken.length, spokenBefore);
});

test('resetting progress clears completed groups once the parent confirms', () => {
  const app = loadApp({ completedGroups: { hiragana: completedUpTo(3) } });
  app.click('go-progress');
  app.click('reset-progress');

  assert.equal(app.state().completedGroups.hiragana.some(Boolean), false);
});

test('progress is kept when the parent cancels the reset', () => {
  const app = loadApp({ completedGroups: { hiragana: completedUpTo(3) } }, null, { confirm: false });
  app.click('go-progress');
  app.click('reset-progress');

  assert.equal(app.state().completedGroups.hiragana[0], true);
});

test('after answering, keyboard focus moves to the next button', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];
  app.click('answer-practice', { value: question.answer });

  assert.equal(app.focused.at(-1), '[data-action="next-practice"]');
});

test('answer feedback is announced through the permanent announcer', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  assert.equal(app.announced(), '');

  const question = app.state().practice.session.questions[0];
  app.click('answer-practice', { value: question.answer });
  assert.equal(app.announced(), app.state().practice.session.feedback);
});

test('japanese text is marked with lang="ja"', () => {
  const app = loadApp({ ...SEEN_FIRST_HIRAGANA_ROW, practice: { alphabet: 'hiragana', level: 'chars', mode: 'sound_to_char' } });
  app.click('go-learn');
  assert.match(app.html(), /class="big-char" lang="ja">あ</);

  app.click('go-practice');
  app.click('start-practice');
  assert.match(app.html(), /class="btn-soft option-btn"[^>]*lang="ja"/);
});

test('the app keeps working when saving progress fails', () => {
  const app = loadApp(null, null, { failStorageWrites: true });
  app.click('start-game');
  app.click('go-learn');

  assert.match(app.html(), /Grupp 1/);
});

test('toggle buttons tell screen readers which one is selected', () => {
  const app = loadApp();
  app.click('go-learn');

  assert.match(app.html(), /data-action="set-learn-alphabet" data-value="hiragana" aria-pressed="true"/);
  assert.match(app.html(), /data-action="set-learn-alphabet" data-value="katakana" aria-pressed="false"/);
});

const SWEDISH_VOICE = { lang: 'sv-SE', name: 'Alva' };

test('a warning is shown when the device has no japanese voice', () => {
  const app = loadApp(null, null, { voices: [SWEDISH_VOICE] });
  app.click('start-game');
  app.click('go-learn');
  assert.match(app.html(), /Ingen japansk röst/);

  app.click('go-practice');
  assert.match(app.html(), /Ingen japansk röst/);
});

test('no voice warning is shown while the voice list is still loading', () => {
  const app = loadApp(null, null, { voices: [] });
  app.click('start-game');
  app.click('go-learn');

  assert.doesNotMatch(app.html(), /Ingen japansk röst/);
});

test('listening practice cannot start without a japanese voice', () => {
  const app = loadApp(
    { ...SEEN_FIRST_HIRAGANA_ROW, practice: { alphabet: 'hiragana', level: 'chars', mode: 'sound_to_char' } },
    null,
    { voices: [SWEDISH_VOICE] }
  );
  app.click('go-practice');
  assert.match(app.html(), /data-value="sound_to_char" aria-pressed="true" disabled/);

  app.click('start-practice');
  assert.equal(app.state().practice.session, null);
  assert.match(app.state().practice.notice, /japansk röst/);
});

test('speech uses the best available japanese voice', () => {
  const app = loadApp(null, null, {
    voices: [SWEDISH_VOICE, { lang: 'ja-JP', name: 'Eddy' }, { lang: 'ja-JP', name: 'Kyoko' }]
  });
  app.click('start-game');
  app.click('go-learn');

  assert.equal(app.voicesUsed.at(-1).name, 'Kyoko');
});

test('speech falls back to any japanese voice', () => {
  const app = loadApp(null, null, { voices: [SWEDISH_VOICE, { lang: 'ja_JP', name: 'Eddy' }] });
  app.click('start-game');
  app.click('go-learn');

  assert.equal(app.voicesUsed.at(-1).name, 'Eddy');
});

test('passing a group quiz leads to the word lesson it unlocked', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('start-learn-quiz');
  finishLearnQuiz(app);
  app.click('open-word-group', { wordGroupIndex: '0' });

  assert.equal(app.state().learn.unit, 'words');
  assert.equal(app.state().learn.wordGroupIndex, 0);
});

test('passing a word quiz offers the next lesson group', () => {
  const afterGroup = curriculum.hiragana.wordGroups[0].afterGroup;
  const app = loadApp({
    completedGroups: { hiragana: completedUpTo(afterGroup) },
    learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 }
  });
  app.click('go-learn');
  app.click('start-learn-quiz');
  finishLearnQuiz(app);
  app.click('next-group', { groupIndex: String(afterGroup) });

  assert.equal(app.state().learn.unit, 'group');
  assert.equal(app.state().learn.groupIndex, afterGroup);
});

test('a doubled small-group quiz never asks the same character twice in a row', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 7, cardIndex: 0 } });
  app.click('go-learn');
  for (let run = 0; run < 10; run += 1) {
    app.click('start-learn-quiz');
    const prompts = app.state().learn.quiz.questions.map((question) => question.promptChar);
    prompts.forEach((prompt, i) => assert.notEqual(prompt, prompts[i - 1], prompts.join(' ')));
  }
});

test('after the last practice question focus goes to the play-again button', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  finishPracticeSession(app);

  assert.equal(app.focused.at(-1), '[data-action="start-practice"][data-value="again"]');
});

test('a saved quiz is dropped when its saved position no longer exists', () => {
  const app = loadApp({
    learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 30, cardIndex: 0, quiz: { index: 0, correct: 0, done: false, feedback: '', answered: null, questions: [] } }
  });
  app.click('go-learn');

  assert.equal(app.state().learn.quiz, null);
});

test('the home page links to the romaji guide', () => {
  const app = loadApp();
  app.click('start-game');
  assert.match(app.html(), /data-action="go-romaji"/);

  app.click('go-romaji');
  assert.match(app.html(), /Så läser du romaji/);
  assert.match(app.html(), /tjugo/);
});

test('a card with a tricky sound shows its tip and a link to the guide', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 1, cardIndex: 1 } });
  app.click('go-learn');

  assert.match(app.html(), /Hårt k som i/);
  assert.match(app.html(), /data-action="go-romaji"/);
});

test('base kana cards show the new mnemonic', () => {
  const app = loadApp();
  app.click('go-learn');

  assert.match(app.html(), /tandläkaren/);
});

test('look-alike practice only asks about sets the child has seen', () => {
  const app = loadApp({
    practice: { alphabet: 'hiragana', level: 'lookalike' },
    seenChars: { katakana: { シ: true, ツ: true, ソ: true, ン: true } }
  });
  app.click('go-practice');
  app.click('start-practice');

  const allowed = [['シ', 'ツ'], ['ソ', 'ン']];
  app.state().practice.session.questions.forEach((question) => {
    const set = allowed.find((pair) => pair.includes(question.answer));
    assert.ok(set, question.answer);
    assert.deepEqual(question.options.slice().sort(), set.slice().sort());
  });
});

test('look-alike practice needs at least one seen set', () => {
  const app = loadApp({ practice: { alphabet: 'hiragana', level: 'lookalike' } });
  app.click('go-practice');
  app.click('start-practice');

  assert.equal(app.state().practice.session, null);
  assert.match(app.state().practice.notice, /Lär dig fler tecken/);
});

test('word practice hides the romaji until the child has answered', () => {
  const app = loadApp({
    completedGroups: { hiragana: completedUpTo(2) },
    practice: { alphabet: 'hiragana', level: 'words' }
  });
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];
  assert.doesNotMatch(app.html(), new RegExp('<p class="romaji">' + question.romaji + '<'));

  app.click('answer-practice', { value: question.answer });
  assert.match(app.html(), new RegExp('<p class="romaji">' + question.romaji + '<'));
});

test('a practice question is spoken once even when the page redraws', () => {
  const app = loadApp({ ...SEEN_FIRST_HIRAGANA_ROW, practice: { alphabet: 'hiragana', level: 'chars', mode: 'sound_to_char' } });
  app.click('go-practice');
  app.click('start-practice');
  const spokenBefore = app.spoken.length;
  app.click('set-practice-alphabet', { value: 'hiragana' });

  assert.equal(app.spoken.length, spokenBefore);
});

test('speech prefers a voice that works offline', () => {
  const app = loadApp(null, null, {
    voices: [{ lang: 'ja-JP', name: 'Google 日本語', localService: false }, { lang: 'ja-JP', name: 'Kyoko', localService: true }]
  });
  app.click('start-game');
  app.click('go-learn');

  assert.equal(app.voicesUsed.at(-1).name, 'Kyoko');
});

test('the voice warning is not re-announced as a live region', () => {
  const app = loadApp(null, null, { voices: [SWEDISH_VOICE] });
  app.click('start-game');
  app.click('go-learn');

  assert.match(app.html(), /Ingen japansk röst/);
  assert.doesNotMatch(app.html(), /role="status"/);
});

test('mixed listening practice never plays the same sound twice in a row', () => {
  const app = loadApp({
    practice: { alphabet: 'mixed', level: 'chars', mode: 'sound_to_char' },
    seenChars: {
      hiragana: { あ: true, い: true, う: true, え: true, お: true },
      katakana: { ア: true, イ: true, ウ: true, エ: true, オ: true }
    }
  });
  app.click('go-practice');
  for (let run = 0; run < 5; run += 1) {
    app.click('start-practice');
    const sounds = app.state().practice.session.questions.map((question) => SOUND_OF[question.char]);
    sounds.forEach((sound, i) => assert.notEqual(sound, sounds[i - 1], sounds.join(' ')));
  }
});

test('a word quiz still offers four options when a category option is left out', () => {
  const wordGroupIndex = curriculum.hiragana.wordGroups.findIndex((group) => group.words.some((word) => word.meaning === 'djur'));
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: wordGroupIndex, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  app.state().learn.quiz.questions.forEach((question) => {
    assert.equal(question.options.length, 4, question.answer);
  });
});

test('single kana questions never offer whole rule-group words as options', () => {
  const ruleRomaji = curriculum.hiragana.groups[10].items.map((item) => item.romaji);
  const seen = { あ: true, い: true, う: true, え: true, お: true };
  curriculum.hiragana.groups[10].items.forEach((item) => {
    seen[item.char] = true;
  });
  const app = loadApp({ practice: { alphabet: 'hiragana', level: 'chars', mode: 'char_to_romaji' }, seenChars: { hiragana: seen } });
  app.click('go-practice');
  for (let run = 0; run < 5; run += 1) {
    app.click('start-practice');
    app.state().practice.session.questions
      .filter((question) => !ruleRomaji.includes(question.answer))
      .forEach((question) => question.options.forEach((option) => assert.ok(!ruleRomaji.includes(option), option)));
  }
});

const UNLOCK_FIRST_TWO_HIRAGANA_GROUPS = {
  completedGroups: { hiragana: completedUpTo(2) },
  practice: { alphabet: 'hiragana', level: 'words' }
};

test('answering a word question updates that word\'s progress', () => {
  const app = loadApp(UNLOCK_FIRST_TWO_HIRAGANA_GROUPS);
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];
  app.click('answer-practice', { value: question.answer });

  assert.equal(app.state().wordProgress[question.word].timesCorrect, 1);
});

test('word practice puts weak words first more often', () => {
  const unlocked = curriculum.hiragana.wordGroups.filter((group) => group.afterGroup <= 2).flatMap((group) => group.words);
  const weakWord = unlocked[0].word;
  const wordProgress = {};
  unlocked.forEach((word) => {
    wordProgress[word.word] = { level: 5, timesCorrect: 9, timesWrong: 0, nextReview: '2999-01-01' };
  });
  wordProgress[weakWord] = { level: 1, timesCorrect: 0, timesWrong: 5, nextReview: '2000-01-01' };

  let weakFirst = 0;
  for (let run = 0; run < 150; run += 1) {
    const app = loadApp({ ...UNLOCK_FIRST_TWO_HIRAGANA_GROUPS, wordProgress: wordProgress });
    app.click('go-practice');
    app.click('start-practice');
    if (app.state().practice.session.questions[0].word === weakWord) {
      weakFirst += 1;
    }
  }
  // Without weighting each of the nine words would come first about 11% of the time.
  assert.ok(weakFirst > 150 * 0.25, String(weakFirst));
});

test('the progress view shows how many words are learned', () => {
  const app = loadApp({ wordProgress: { ねこ: { level: 3, timesCorrect: 2, timesWrong: 0, nextReview: '2026-10-25' } } });
  app.click('go-progress');

  assert.match(app.html(), /Ord på nivå 3\+: 1\/209/);
});

const EMOJI_OF = {};
['hiragana', 'katakana'].forEach((alphabetId) => {
  curriculum[alphabetId].wordGroups.forEach((group) => group.words.forEach((word) => {
    EMOJI_OF[word.word] = word.emoji;
  }));
});
const ALL_EMOJI = new Set(Object.values(EMOJI_OF));

test('word practice mixes picture questions with meaning questions', () => {
  const app = loadApp(UNLOCK_FIRST_TWO_HIRAGANA_GROUPS);
  app.click('go-practice');
  app.click('start-practice');

  const questions = app.state().practice.session.questions;
  const pictures = questions.filter((question) => question.mode === 'word_to_picture');
  assert.ok(pictures.length >= 4 && pictures.length < questions.length, String(pictures.length));
  pictures.forEach((question) => {
    assert.equal(question.answer, EMOJI_OF[question.word]);
    question.options.forEach((option) => assert.ok(ALL_EMOJI.has(option), option));
  });
});

test('the learn word quiz includes picture questions', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  const pictures = app.state().learn.quiz.questions.filter((question) => question.kind === 'picture');
  assert.ok(pictures.length >= 1);
  pictures.forEach((question) => assert.equal(question.answer, EMOJI_OF[question.promptChar]));
});

test('picture answers count towards the word\'s progress', () => {
  const app = loadApp(UNLOCK_FIRST_TWO_HIRAGANA_GROUPS);
  app.click('go-practice');
  app.click('start-practice');
  let session = app.state().practice.session;
  while (session.questions[session.index].mode !== 'word_to_picture') {
    app.click('answer-practice', { value: session.questions[session.index].answer });
    app.click('next-practice');
    session = app.state().practice.session;
  }
  const question = session.questions[session.index];
  const before = (app.state().wordProgress[question.word] || { timesCorrect: 0 }).timesCorrect;
  app.click('answer-practice', { value: question.answer });

  assert.equal(app.state().wordProgress[question.word].timesCorrect, before + 1);
  assert.match(app.html(), /option-btn picture-option/);
});

test('finishing the first katakana group earns Katakana-nybörjare', () => {
  const app = loadApp({ learn: { alphabet: 'katakana', unit: 'group', groupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');
  finishLearnQuiz(app);

  assert.ok(app.state().badges.includes('katakana_beginner'));
  assert.match(app.html(), /Ny badge/);
});

test('Snabb som blixten needs 20 correct in a row, across sessions', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  finishPracticeSession(app);
  assert.ok(!app.state().badges.includes('fast_lightning'));

  app.click('start-practice');
  finishPracticeSession(app);
  assert.ok(app.state().badges.includes('fast_lightning'));
});

test('passing a word quiz earns Första orden', () => {
  const app = loadApp({
    completedGroups: { hiragana: completedUpTo(1) },
    learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 }
  });
  app.click('go-learn');
  app.click('start-learn-quiz');
  finishLearnQuiz(app);

  assert.ok(app.state().badges.includes('first_words'));
});

test('practising three days in a row earns the streak badge', () => {
  const yesterday = localDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const app = loadApp({ ...SEEN_FIRST_HIRAGANA_ROW, streak: { current: 2, best: 2, lastDate: yesterday, history: [yesterday] } });
  app.click('go-practice');
  app.click('start-practice');
  finishPracticeSession(app);

  assert.ok(app.state().badges.includes('streak_3'));
});

test('the 50th correct answer earns its badge', () => {
  const app = loadApp({ ...SEEN_FIRST_HIRAGANA_ROW, stats: { totalCorrect: 45, runStreak: 0 } });
  app.click('go-practice');
  app.click('start-practice');
  finishPracticeSession(app);

  assert.equal(app.state().stats.totalCorrect, 55);
  assert.ok(app.state().badges.includes('correct_50'));
});

test('the progress view lists all the badges', () => {
  const app = loadApp();
  app.click('go-progress');

  assert.ok((app.html().match(/class="badge-item/g) || []).length >= 13);
});

test('big characters use a handwriting-style font', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(html, /family=Klee\+One/);
  assert.match(css, /\.big-char \{[^}]*font-family: var\(--jp-hand-font\)/);
});

test('the writing pad shows the current character to trace', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 1, cardIndex: 1 } });
  app.click('go-learn');
  assert.doesNotMatch(app.html(), /writing-pad/);

  app.click('toggle-writing');
  assert.match(app.html(), /<span class="writing-guide" lang="ja"[^>]*>き<\/span>/);
  assert.match(app.html(), /<canvas id="writing-canvas"/);

  app.click('toggle-writing');
  assert.doesNotMatch(app.html(), /writing-pad/);
});

test('the writing pad follows the card when the child moves on', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 1, cardIndex: 1 } });
  app.click('go-learn');
  app.click('toggle-writing');
  app.click('learn-next');

  assert.match(app.html(), /<span class="writing-guide" lang="ja"[^>]*>く<\/span>/);
});

test('loading voices does not redraw the page (and wipe the writing pad) when nothing changes', () => {
  const japanese = [{ lang: 'ja-JP', name: 'Kyoko', localService: true }];
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 1, cardIndex: 1 } }, null, { voices: japanese });
  app.click('go-learn');
  app.click('toggle-writing');
  app.markHtml();
  app.voicesChanged(japanese);

  assert.equal(app.html(), 'MARK');
});

test('the voice warning appears once the browser reports no japanese voice', () => {
  const app = loadApp(null, null, { voices: [] });
  app.click('start-game');
  app.click('go-learn');
  app.voicesChanged([SWEDISH_VOICE]);

  assert.match(app.html(), /Ingen japansk röst/);
});

test('voices finishing loading do not redraw the page when the warning stays hidden', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 1, cardIndex: 1 } }, null, { voices: [] });
  app.click('go-learn');
  app.click('toggle-writing');
  app.markHtml();
  app.voicesChanged([{ lang: 'ja-JP', name: 'Kyoko', localService: true }]);

  assert.equal(app.html(), 'MARK');
});

test('a parent can add a child, and each child keeps their own progress', () => {
  const app = loadApp({ completedGroups: { hiragana: completedUpTo(3) } }, null, { prompt: ['Leo', 'Ella'] });
  app.click('add-profile');

  const profiles = app.stored('japanskaBarnApp.profiles');
  assert.equal(profiles.list.length, 2);
  const ella = profiles.list.find((profile) => profile.name === 'Ella');
  assert.equal(profiles.active, ella.id);
  assert.equal(app.stored(STORAGE_KEY + ':' + ella.id).completedGroups.hiragana[0], false);
  assert.match(app.html(), /Ella/);

  app.clickVisible('switch-profile');
  app.clickVisible('choose-profile', 'default');
  assert.equal(app.state().completedGroups.hiragana[0], true);
});

test('cancelling the name question adds no child', () => {
  const app = loadApp(null, null, { prompt: null });
  app.click('add-profile');

  const profiles = app.stored('japanskaBarnApp.profiles');
  assert.ok(!profiles || profiles.list.length === 1);
});

test('the intro lets the child choose who is playing', () => {
  const app = loadApp(null, { 'japanskaBarnApp.profiles': JSON.stringify({ active: 'default', list: [{ id: 'default', name: 'Leo' }, { id: 'p2', name: 'Ella' }] }) });

  assert.match(app.html(), /data-action="choose-profile" data-value="default"[^>]*>[^<]*Leo/);
  assert.match(app.html(), /data-action="choose-profile" data-value="p2"[^>]*>[^<]*Ella/);
});

test('Snabb som blixten is earned even if the run of 20 breaks before the session ends', () => {
  const app = loadApp({ ...SEEN_FIRST_HIRAGANA_ROW, stats: { totalCorrect: 15, runStreak: 15 } });
  app.click('go-practice');
  app.click('start-practice');
  let session = app.state().practice.session;
  while (!session.done) {
    const question = session.questions[session.index];
    const value = session.index < 5 ? question.answer : question.options.find((option) => option !== question.answer);
    app.click('answer-practice', { value: value });
    app.click('next-practice');
    session = app.state().practice.session;
  }

  assert.ok(app.state().badges.includes('fast_lightning'));
});

test('picture questions never offer a member of the word\'s own category', () => {
  const meaningOfEmoji = {};
  curriculum.hiragana.wordGroups.forEach((group) => group.words.forEach((word) => {
    meaningOfEmoji[word.emoji] = word.meaning;
  }));
  const app = loadApp({ completedGroups: { hiragana: completedUpTo(16) }, practice: { alphabet: 'hiragana', level: 'words' } });
  app.click('go-practice');
  for (let run = 0; run < 40; run += 1) {
    app.click('start-practice');
    app.state().practice.session.questions
      .filter((question) => question.mode === 'word_to_picture')
      .forEach((question) => {
        const members = curriculum.categories[meaningOfEmoji[question.answer]] || [];
        question.options.forEach((option) => assert.ok(!members.includes(meaningOfEmoji[option]), question.word + ' / ' + option));
      });
  }
});

test('word cards do not offer the writing pad', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');

  assert.doesNotMatch(app.html(), /data-action="toggle-writing"/);
});

test('picture feedback names the meaning of the right picture', () => {
  const app = loadApp(UNLOCK_FIRST_TWO_HIRAGANA_GROUPS);
  app.click('go-practice');
  app.click('start-practice');
  let session = app.state().practice.session;
  while (session.questions[session.index].mode !== 'word_to_picture') {
    app.click('answer-practice', { value: session.questions[session.index].answer });
    app.click('next-practice');
    session = app.state().practice.session;
  }
  const question = session.questions[session.index];
  app.click('answer-practice', { value: question.options.find((option) => option !== question.answer) });

  const word = curriculum.hiragana.wordGroups.flatMap((group) => group.words).find((item) => item.word === question.word);
  assert.match(app.state().practice.session.feedback, new RegExp(word.meaning));
});

test('the learn quiz says what to choose', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'words', wordGroupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');
  app.click('start-learn-quiz');

  assert.match(app.html(), /Vad betyder ordet\?|Vilken bild passar ordet\?/);
});

test('the reset question names the child', () => {
  let asked = '';
  const app = loadApp(null, { 'japanskaBarnApp.profiles': JSON.stringify({ active: 'default', list: [{ id: 'default', name: 'Leo' }] }) }, { confirm: false });
  app.setConfirm((text) => {
    asked = text;
    return false;
  });
  app.click('start-game');
  app.click('go-progress');
  app.click('reset-progress');

  assert.match(asked, /Leo/);
});

test('adding a second child first asks the name of the child already playing', () => {
  const app = loadApp(null, null, { prompt: ['Leo', 'Ella'] });
  app.click('add-profile');

  assert.deepEqual(app.stored('japanskaBarnApp.profiles').list.map((profile) => profile.name), ['Leo', 'Ella']);
});

test('a parent can rename the active child', () => {
  const app = loadApp(null, { 'japanskaBarnApp.profiles': JSON.stringify({ active: 'default', list: [{ id: 'default', name: 'Leo' }] }) }, { prompt: 'Leopold' });
  app.click('start-game');
  app.click('go-progress');
  app.clickVisible('rename-profile');

  assert.equal(app.stored('japanskaBarnApp.profiles').list[0].name, 'Leopold');
});

test('a parent can remove a child and their saved progress', () => {
  const profiles = { active: 'p2', list: [{ id: 'default', name: 'Leo' }, { id: 'p2', name: 'Ella' }] };
  const app = loadApp(null, {
    'japanskaBarnApp.profiles': JSON.stringify(profiles),
    [STORAGE_KEY + ':p2']: JSON.stringify({ completedGroups: { hiragana: completedUpTo(2) } })
  });
  app.click('start-game');
  app.click('go-progress');
  app.clickVisible('remove-profile');

  const saved = app.stored('japanskaBarnApp.profiles');
  assert.deepEqual(saved.list.map((profile) => profile.name), ['Leo']);
  assert.equal(saved.active, 'default');
  assert.equal(app.stored(STORAGE_KEY + ':p2'), null);
});

test('the only child cannot be removed', () => {
  const app = loadApp();
  app.click('start-game');
  app.click('go-progress');

  assert.doesNotMatch(app.html(), /data-action="remove-profile"/);
});

test('a profile name with HTML is shown as text', () => {
  const app = loadApp(null, { 'japanskaBarnApp.profiles': JSON.stringify({ active: 'default', list: [{ id: 'default', name: '<b>Leo</b>' }] }) });

  assert.match(app.html(), /&lt;b&gt;Leo&lt;\/b&gt;/);
  assert.doesNotMatch(app.html(), /<b>Leo<\/b>/);
});

test('an answered learn quiz question is not spoken again when the page redraws', () => {
  const app = loadApp();
  app.click('go-learn');
  app.click('start-learn-quiz');
  const question = app.state().learn.quiz.questions[0];
  app.click('answer-learn-quiz', { value: question.answer });
  const spokenAfterAnswer = app.spoken.length;
  app.click('toggle-groups');

  assert.equal(app.spoken.length, spokenAfterAnswer);
});

test('an answered practice question is spoken once and not again on redraw', () => {
  const app = loadApp(SEEN_FIRST_HIRAGANA_ROW);
  app.click('go-practice');
  app.click('start-practice');
  const question = app.state().practice.session.questions[0];
  const before = app.spoken.length;
  app.click('answer-practice', { value: question.answer });
  assert.equal(app.spoken.length, before + 1);

  app.click('set-practice-alphabet', { value: 'hiragana' });
  assert.equal(app.spoken.length, before + 1);
});

test('completed groups follow the group, not its position, in saved progress', () => {
  const app = loadApp({
    completedGroups: { hiragana: completedUpTo(0) },
    completedGroupIds: { hiragana: ['か'], katakana: [] }
  });
  app.click('go-learn');

  assert.equal(app.state().completedGroups.hiragana[1], true);
  assert.deepEqual(app.state().completedGroupIds.hiragana, ['か']);
});

test('the writing pad matches the screen resolution', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 0, cardIndex: 0 } }, null, { devicePixelRatio: 3 });
  app.click('go-learn');
  app.click('toggle-writing');

  assert.equal(app.canvas.width, 900);
});

test('the writing pad draws a dot on tap and follows only one finger', () => {
  const app = loadApp({ learn: { alphabet: 'hiragana', unit: 'group', groupIndex: 0, cardIndex: 0 } });
  app.click('go-learn');
  app.click('toggle-writing');
  app.pointer('pointerdown', { clientX: 100, clientY: 100, pointerId: 1 });
  assert.ok(app.drawn.includes('stroke'));

  const before = app.drawn.length;
  app.pointer('pointerdown', { clientX: 10, clientY: 10, pointerId: 2 });
  app.pointer('pointermove', { clientX: 20, clientY: 20, pointerId: 2 });
  assert.equal(app.drawn.length, before);

  app.pointer('pointermove', { clientX: 120, clientY: 120, pointerId: 1 });
  assert.ok(app.drawn.length > before);
});
