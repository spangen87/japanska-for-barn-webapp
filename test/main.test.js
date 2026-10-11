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
