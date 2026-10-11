// The app runs in Sweden; date bugs only show up with a positive UTC offset.
process.env.TZ = 'Europe/Stockholm';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const STORAGE_KEY = 'japanskaBarnApp.v1';

// Runs the real app scripts against a minimal DOM stub so click flows can be tested.
function loadApp(savedState) {
  const storage = {};
  if (savedState) {
    storage[STORAGE_KEY] = JSON.stringify(savedState);
  }
  const spoken = [];
  const appElement = {
    innerHTML: '',
    listener: null,
    addEventListener: function (type, fn) {
      this.listener = fn;
    }
  };
  const context = {
    document: { getElementById: () => appElement },
    localStorage: {
      getItem: (key) => (key in storage ? storage[key] : null),
      setItem: (key, value) => {
        storage[key] = String(value);
      }
    },
    speechSynthesis: {
      cancel: () => {},
      speak: (utterance) => spoken.push(utterance.text)
    },
    SpeechSynthesisUtterance: function (text) {
      this.text = text;
    },
    requestAnimationFrame: () => {}
  };
  context.window = context;
  vm.createContext(context);
  ['src/app-core.js', 'src/main.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });

  return {
    spoken: spoken,
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

  assert.equal(app.spoken.at(-1), 'あさ');
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
