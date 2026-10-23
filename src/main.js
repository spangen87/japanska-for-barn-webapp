(function () {
  const core = window.JapaneseAppCore;
  const curriculum = window.JapaneseCurriculum;
  const STORAGE_KEY = 'japanskaBarnApp.v2';
  const SESSION_QUESTION_COUNT = 10;
  let pendingLearnFocus = false;
  let lastSpokenCard = '';

  const BADGES = [
    { id: 'hiragana_beginner', icon: '🌸', name: 'Hiragana-nybörjare', rule: 'Lås upp första hiragana-gruppen.' },
    { id: 'hiragana_master', icon: '🗻', name: 'Hiragana-mästare', rule: 'Alla hiragana på nivå 3+.' },
    { id: 'fast_lightning', icon: '⚡', name: 'Snabb som blixten', rule: '10 rätt i rad i en session.' },
    { id: 'perfect_session', icon: '🎯', name: 'Perfekt session', rule: '100% rätt i en övningssession.' }
  ];

  const ALPHABETS = {
    hiragana: buildAlphabet(curriculum.hiragana),
    katakana: buildAlphabet(curriculum.katakana)
  };

  const app = document.getElementById('app');
  let state = loadState();

  function buildAlphabet(data) {
    const groups = data.groups.map(function (group) {
      return group.items.map(function (item) {
        return {
          char: item.char,
          romaji: item.romaji,
          isRuleExample: Boolean(group.teaches),
          mnemonic: item.mnemonic || item.tip || (item.char + ' (' + item.romaji + ') - koppla tecknet till ljudet ' + item.romaji + '.'),
          tip: pronunciationTip(item.romaji)
        };
      });
    });

    return { name: data.name, groups: groups, chars: groups.flat(), wordGroups: data.wordGroups };
  }

  function pronunciationTip(romaji) {
    const rule = curriculum.pronunciationTips.find(function (candidate) {
      return candidate.match.test(romaji);
    });
    return rule ? rule.tip : '';
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
        hiragana: new Array(ALPHABETS.hiragana.groups.length).fill(false),
        katakana: new Array(ALPHABETS.katakana.groups.length).fill(false)
      },
      completedWordLessons: {
        hiragana: new Array(ALPHABETS.hiragana.wordGroups.length).fill(false),
        katakana: new Array(ALPHABETS.katakana.wordGroups.length).fill(false)
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
      merged.learn = clampLearnPosition(merged.learn);
      return merged;
    } catch (error) {
      return createInitialState();
    }
  }

  // Saved positions can outlive edits to the curriculum; keep them inside the current data.
  function clampLearnPosition(learn) {
    const alphabetId = ALPHABETS[learn.alphabet] ? learn.alphabet : 'hiragana';
    const alphabet = ALPHABETS[alphabetId];
    const unit = learn.unit === 'words' ? 'words' : 'group';
    const groupIndex = clampIndex(learn.groupIndex, alphabet.groups.length);
    const wordGroupIndex = clampIndex(learn.wordGroupIndex, alphabet.wordGroups.length);
    const cardCount = unit === 'words'
      ? alphabet.wordGroups[wordGroupIndex].words.length
      : alphabet.groups[groupIndex].length;
    const moved = alphabetId !== learn.alphabet || groupIndex !== learn.groupIndex || wordGroupIndex !== learn.wordGroupIndex;
    return {
      ...learn,
      quiz: moved ? null : learn.quiz,
      alphabet: alphabetId,
      unit: unit,
      groupIndex: groupIndex,
      wordGroupIndex: wordGroupIndex,
      cardIndex: clampIndex(learn.cardIndex, cardCount)
    };
  }

  function clampIndex(value, length) {
    const index = Number.isInteger(value) ? value : 0;
    return Math.min(Math.max(index, 0), length - 1);
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Storage can be blocked or full (private mode, school devices); the app still works without saving.
    }
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

  // Voices that tend to sound natural; any Japanese voice is used if none of these exist.
  const PREFERRED_VOICE_NAMES = /Google|Kyoko|O-Ren|Otoya|Hattori|Nanami|Haruka|Ayumi/i;

  function getVoices() {
    const synth = window.speechSynthesis;
    return synth && typeof synth.getVoices === 'function' ? synth.getVoices() : [];
  }

  function getJapaneseVoice() {
    const voices = getVoices().filter(function (voice) {
      return /^ja/i.test(voice.lang);
    });
    return voices.find(function (voice) {
      return PREFERRED_VOICE_NAMES.test(voice.name);
    }) || voices.find(function (voice) {
      return /^ja[-_]JP$/i.test(voice.lang);
    }) || voices[0] || null;
  }

  // 'unknown' while the browser is still loading its voice list.
  function getVoiceStatus() {
    if (!('speechSynthesis' in window)) {
      return 'missing';
    }
    if (!getVoices().length) {
      return 'unknown';
    }
    return getJapaneseVoice() ? 'ok' : 'missing';
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    const voice = getJapaneseVoice();
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function startLearnQuiz() {
    const learn = state.learn;
    let questions = [];
    if (learn.unit === 'words') {
      const words = getCurrentLearnWords();
      questions = shuffled(words).map(function (wordObj) {
        const options = buildOptions(withoutCategoriesOf(words, wordObj.meaning), wordObj.meaning, function (item) {
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
      const groupChars = alphabet.groups[learn.groupIndex];
      // Same-group distractors train the differences that matter; small groups borrow from earlier groups.
      const optionPool = groupChars.length >= 4
        ? groupChars
        : alphabet.groups.slice(0, learn.groupIndex + 1).flat().filter(function (item) {
          return !item.isRuleExample;
        });

      // Small groups ask each item twice, so one slip does not fail the quiz.
      const quizChars = groupChars.length < 5 ? core.pickRounds(groupChars, groupChars.length * 2) : shuffled(groupChars);
      questions = quizChars.map(function (charObj) {
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


    state.learn.quiz = {
      index: 0,
      correct: 0,
      done: false,
      feedback: '',
      answered: null,
      questions: questions
    };
  }

  function startPracticeSession() {
    const practice = state.practice;
    if (practice.level === 'lookalike') {
      const lookAlikeQuestions = buildLookAlikeQuestions(SESSION_QUESTION_COUNT);
      if (!lookAlikeQuestions.length) {
        state.practice.session = null;
        state.practice.notice = 'Lär dig fler tecken först – här övar du på tecken som liknar varandra.';
        return;
      }
      state.practice.session = {
        index: 0,
        correct: 0,
        streak: 0,
        bestStreak: 0,
        done: false,
        feedback: '',
        answered: null,
        reveal: false,
        questions: lookAlikeQuestions
      };
      state.practice.notice = '';
      return;
    }

    if (practice.level === 'words') {
      const wordPool = getUnlockedWords(practice.alphabet);
      const distinctMeanings = new Set(wordPool.map(function (item) {
        return item.meaning;
      }));
      if (distinctMeanings.size < 4) {
        state.practice.session = null;
        const groupWord = practice.alphabet === 'mixed' ? 'grupper' : practice.alphabet + 'grupper';
        state.practice.notice = 'Klara fler ' + groupWord + ' i Lär dig för att låsa upp ord.';
        return;
      }
      const questions = buildWordQuestions(wordPool, SESSION_QUESTION_COUNT);
      state.practice.session = {
        index: 0,
        correct: 0,
        streak: 0,
        bestStreak: 0,
        done: false,
        feedback: '',
        answered: null,
        reveal: false,
        questions: questions
      };
      state.practice.notice = '';
      return;
    }

    if (practice.mode === 'sound_to_char' && getVoiceStatus() === 'missing') {
      state.practice.session = null;
      state.practice.notice = 'Ljud → Tecken behöver en japansk röst på enheten. Välj Tecken → Ljud så länge.';
      return;
    }

    const pool = getPracticePool(practice.alphabet);
    const distinctSounds = new Set(pool.map(soundOf));
    if (distinctSounds.size < 4) {
      state.practice.session = null;
      state.practice.notice = 'Öppna Lär dig och gå igenom minst 4 tecken med olika ljud först.';
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
      answered: null,
      reveal: false,
      questions: questions
    };
    state.practice.notice = '';
  }

  function isSeen(char) {
    return Boolean(state.seenChars.hiragana[char] || state.seenChars.katakana[char]);
  }

  // Asks which of a set of look-alike kana makes a sound; only sets the child has fully seen.
  function buildLookAlikeQuestions(count) {
    const romajiOf = {};
    ALPHABETS.hiragana.chars.concat(ALPHABETS.katakana.chars).forEach(function (item) {
      romajiOf[item.char] = item.romaji;
    });
    const items = curriculum.lookAlikes
      .filter(function (set) {
        return set.every(isSeen);
      })
      .flatMap(function (set) {
        return set.map(function (char) {
          return { char: char, set: set };
        });
      });
    if (!items.length) {
      return [];
    }
    return core.pickRounds(items, count).map(function (item) {
      return {
        char: item.char,
        romaji: romajiOf[item.char],
        prompt: 'Vilket tecken är ' + romajiOf[item.char] + '?',
        answer: item.char,
        options: shuffled(item.set),
        mode: 'lookalike'
      };
    });
  }

  function buildWordQuestions(pool, count) {
    return core.pickRounds(pool, count).map(function (wordObj) {
      return createWordQuestion(wordObj, pool);
    });
  }

  function createWordQuestion(wordObj, pool) {
    const options = buildOptions(withoutCategoriesOf(pool, wordObj.meaning), wordObj.meaning, function (item) {
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

  // Leaves out words whose meaning is the category of the answer, such as "djur" when the answer is "hund".
  function withoutCategoriesOf(words, meaning) {
    return words.filter(function (item) {
      const members = curriculum.categories[item.meaning];
      return !members || !members.includes(meaning);
    });
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

  function getCurrentLearnWordGroup() {
    const groups = ALPHABETS[state.learn.alphabet].wordGroups;
    return groups[state.learn.wordGroupIndex] || groups[0];
  }

  function getCurrentLearnWords() {
    return getCurrentLearnWordGroup().words;
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

  function pickPracticeChars(pool, count, alphabetChoice) {
    // Weak, often-missed and due characters come first in each round.
    return core.pickRounds(pool, count, function (charObj) {
      const progress = getProgressEntry(charObj.char, alphabetChoice);
      const due = progress.nextReview <= todayKey() ? 2 : 0;
      const weak = Math.max(0, 6 - progress.level);
      return weak + progress.timesWrong * 0.3 + due + 1;
    });
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
      const options = buildOptions(oneCharPerSound(pool, charObj), charObj.char, function (item) {
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

  // を is written "wo" but pronounced "o", so it counts as the same sound as お.
  function soundOf(item) {
    return item.romaji === 'wo' ? 'o' : item.romaji;
  }

  // Keeps the answer plus one random character per other sound, so no two options sound alike.
  function oneCharPerSound(pool, answerItem) {
    const shuffled = pool.slice();
    shuffle(shuffled);
    const usedSounds = new Set([soundOf(answerItem)]);
    return [answerItem].concat(shuffled.filter(function (item) {
      const sound = soundOf(item);
      if (usedSounds.has(sound)) {
        return false;
      }
      usedSounds.add(sound);
      return true;
    }));
  }

  function buildOptions(pool, answer, pickFn) {
    return core.buildOptions(pool, answer, pickFn);
  }

  function shuffled(items) {
    const copy = items.slice();
    shuffle(copy);
    return copy;
  }

  function shuffle(items) {
    core.shuffle(items);
  }

  function answerLearnQuiz(value) {
    const quiz = state.learn.quiz;
    if (!quiz || quiz.done || quiz.answered) {
      return;
    }

    const question = quiz.questions[quiz.index];
    const correct = question.answer === value;
    if (correct) {
      quiz.correct += 1;
      quiz.feedback = '✅ Rätt!';
    } else {
      quiz.feedback = '❌ Inte riktigt. Rätt svar: ' + question.answer;
    }
    quiz.answered = { value: value, correct: correct };

    render();
  }

  function nextLearnQuizQuestion() {
    const quiz = state.learn.quiz;
    if (!quiz || quiz.done || !quiz.answered) {
      return;
    }

    quiz.answered = null;
    quiz.feedback = '';
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
      updateStreak();
      unlockBadges();
      markProgressUpdated();
    }

    render();
  }

  function answerPractice(value) {
    const session = state.practice.session;
    if (!session || session.done || session.answered) {
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
    session.answered = { value: value, correct: correct };

    render();
  }

  function nextPracticeQuestion() {
    const session = state.practice.session;
    if (!session || session.done || !session.answered) {
      return;
    }

    session.answered = null;
    session.feedback = '';
    session.index += 1;
    if (session.index >= session.questions.length) {
      session.done = true;
      updateStreak();
      unlockBadges();
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
      : ALPHABETS[learn.alphabet].groups[learn.groupIndex].length - 1;
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
    } else if (state.view === 'romaji') {
      renderRomajiGuide();
    } else {
      renderProgress();
    }

    announce(currentFeedback());

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

  // The announcer lives outside #app so screen readers hear changes even though the app redraws.
  function announce(text) {
    const announcer = document.getElementById('announcer');
    if (announcer && announcer.textContent !== text) {
      announcer.textContent = text;
    }
  }

  function currentFeedback() {
    const quiz = state.learn.quiz;
    const session = state.practice.session;
    if (state.view === 'learn' && quiz && quiz.answered) {
      return quiz.feedback;
    }
    if (state.view === 'practice' && session && session.answered) {
      return session.feedback;
    }
    return '';
  }

  function topBarHtml() {
    const days = core.getActiveStreak(state.streak, todayKey());
    return '<div class="topbar"><h1>Japanska för barn</h1><div class="streak-pill">🔥 Streak: ' + days + (days === 1 ? ' dag' : ' dagar') + '</div></div>';
  }

  function optionButtonsHtml(question, answered, action) {
    return '<div class="options-grid">' + question.options.map(function (option) {
      let resultClass = '';
      if (answered && option === question.answer) {
        resultClass = ' correct';
      } else if (answered && option === answered.value) {
        resultClass = ' wrong';
      }
      return '<button class="btn-soft option-btn' + resultClass + '" data-action="' + action + '" data-value="' + option + '"' + langAttr(option) + (answered ? ' disabled' : '') + '>' + option + '</button>';
    }).join('') + '</div>';
  }

  // Long words get a smaller size so they fit on one line on a phone.
  function bigCharHtml(text) {
    const lengthClass = Array.from(text).length > 5 ? ' long' : '';
    return '<p class="big-char' + lengthClass + '"' + langAttr(text) + '>' + text + '</p>';
  }

  // Marks Japanese text so screen readers and fonts treat it as Japanese.
  function langAttr(text) {
    return /[\u3040-\u30ff]/.test(text) ? ' lang="ja"' : '';
  }

  function toggleButtonHtml(active, action, value, label, disabled) {
    return '<button class="btn-soft toggle-btn ' + (active ? 'active' : '') + '" data-action="' + action + '" data-value="' + value + '" aria-pressed="' + (active ? 'true' : 'false') + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }

  function voiceWarningHtml() {
    if (getVoiceStatus() !== 'missing') {
      return '';
    }
    return '<article class="card voice-warning" role="status"><strong>🔇 Ingen japansk röst hittades.</strong> ' +
      '<span class="muted">Ljudet fungerar inte på den här enheten. Be en vuxen installera en japansk röst i enhetens inställningar ' +
      '(på iPad: Inställningar → Hjälpmedel → Talat innehåll → Röster) eller prova Chrome eller Safari.</span></article>';
  }

  function feedbackHtml(text, answered) {
    const resultClass = answered ? (answered.correct ? ' ok' : ' bad') : '';
    return '<p class="feedback' + resultClass + '">' + (text || '') + '</p>';
  }

  function nextButtonHtml(answered, action, isLastQuestion) {
    if (!answered) {
      return '';
    }
    return '<button class="btn-main" data-action="' + action + '">' + (isLastQuestion ? 'Se resultat' : 'Nästa →') + '</button>';
  }

  function renderIntro() {
    app.innerHTML =
      '<section class="intro-screen card">' +
      '<p class="intro-japanese" lang="ja">こんにちは</p>' +
      '<p class="intro-romaji">Kon-ni-chi-wa!</p>' +
      '<p class="muted">Välkommen till japanska för barn.</p>' +
      '<p class="muted">Psst! Här låter <span lang="ja">は</span> som "wa".</p>' +
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
      '<button class="btn-soft" data-action="go-romaji">📖 Så läser du romaji</button>' +
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
    const group = isWordUnit ? null : alphabet.groups[learn.groupIndex];
    const wordList = getCurrentLearnWords();
    const current = isWordUnit
      ? wordList[learn.cardIndex]
      : group[learn.cardIndex];

    if (!isWordUnit && !learn.quiz) {
      if (!state.seenChars[learn.alphabet][current.char]) {
        markProgressUpdated();
      }
      state.seenChars[learn.alphabet][current.char] = true;
    }

    // Speak a card when it is first shown, not on every redraw (such as hiding the group list).
    const cardKey = [learn.alphabet, learn.unit, learn.groupIndex, learn.wordGroupIndex, learn.cardIndex].join('|');
    if (!learn.quiz && cardKey !== lastSpokenCard) {
      speak(isWordUnit ? current.word : current.char);
    }
    lastSpokenCard = learn.quiz ? '' : cardKey;

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
          '<p class="muted" lang="ja" style="font-family:var(--jp-font)">' + sample + '</p>' +
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
        '<h4>⭐ Nya ord ' + (wordIndex + 1) + ' ' + (done ? '✅' : unlocked ? '' : '🔒') + '</h4>' +
        '<p class="muted" lang="ja" style="font-family:var(--jp-font)">' + wordGroup.words.map(function (item) {
          return item.word;
        }).join(' ') + '</p>' +
        '<button class="btn-soft" data-action="pick-word-lesson" data-word-group-index="' + wordIndex + '" ' + (unlocked ? '' : 'disabled') + '>Välj</button>' +
        '</div>'
      );
    }

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
          quizResultButtonsHtml(pct >= 80, isWordQuiz) + '</article>';
      } else {
        const q = quiz.questions[quiz.index];
        if (quiz.answered) {
          speak(q.promptChar);
        }
        learnBody =
          '<article class="card"><h3>Mini-quiz (' + (quiz.index + 1) + '/' + quiz.questions.length + ')</h3>' +
          bigCharHtml(q.promptChar) +
          optionButtonsHtml(q, quiz.answered, 'answer-learn-quiz') +
          feedbackHtml(quiz.feedback, quiz.answered) +
          nextButtonHtml(quiz.answered, 'next-learn-quiz', quiz.index === quiz.questions.length - 1) +
          '</article>';
      }
    } else {
      learnBody =
        '<article class="card learn-focus-card" id="learn-focus" tabindex="-1">' +
        '<h3>' + (isWordUnit ? alphabet.name + ' – nya ord efter grupp ' + getCurrentLearnWordGroup().afterGroup : alphabet.name + ' Grupp ' + (learn.groupIndex + 1)) + '</h3>' +
        (isWordUnit ? '<p class="word-emoji" aria-hidden="true">' + current.emoji + '</p>' : '') +
        bigCharHtml(isWordUnit ? current.word : current.char) +
        '<p class="romaji">' + current.romaji + '</p>' +
        (isWordUnit
          ? '<p><strong>Betydelse:</strong> ' + current.meaning + '</p>'
          : '<p><strong>Minnesknep:</strong> ' + current.mnemonic + '</p>') +
        '<p class="muted">' + (isWordUnit
          ? 'Lyssna på ordet och säg både japanska och svenska högt.'
          : current.tip
            ? current.tip + ' <button class="link-btn" data-action="go-romaji">📖 Så läser du romaji</button>'
            : 'Tryck på ljudknappen flera gånger och härma uttalet.') + '</p>' +
        '<div class="action-row" style="grid-template-columns:repeat(4,minmax(0,1fr));">' +
        '<button class="btn-soft" data-action="learn-prev">← Förra</button>' +
        '<button class="btn-soft" data-action="learn-speak">🔊 Ljud</button>' +
        '<button class="btn-soft" data-action="learn-next">Nästa →</button>' +
        '<button class="btn-main" data-action="start-learn-quiz">' + (isWordUnit ? 'Starta ord-quiz' : 'Starta mini-quiz') + '</button>' +
        '</div></article>';
    }

    app.innerHTML =
      topBarHtml() +
      voiceWarningHtml() +
      '<section class="learn-layout">' +
      '<article class="card"><div class="alphabet-toggle">' +
      toggleButtonHtml(learn.alphabet === 'hiragana', 'set-learn-alphabet', 'hiragana', 'Hiragana') +
      toggleButtonHtml(learn.alphabet === 'katakana', 'set-learn-alphabet', 'katakana', 'Katakana') +
      '<button class="btn-soft" data-action="toggle-groups">' + (learn.groupsCollapsed ? 'Visa grupper' : 'Minimera grupper') + '</button>' +
      '<button class="btn-soft" data-action="go-home">Hem</button>' +
      '</div></article>' +
      (learn.groupsCollapsed ? '' : '<article class="card group-grid">' + groupCards + '</article>') +
      learnBody +
      '</section>';
  }

  // After a passed group quiz the new words come first; after a passed word quiz, the next group.
  function quizResultButtonsHtml(passed, isWordQuiz) {
    const learn = state.learn;
    const alphabet = ALPHABETS[learn.alphabet];
    if (!passed) {
      return '<div class="quiz-result-actions"><button class="btn-main" data-action="retry-learn-quiz">Försök igen</button>' +
        '<button class="btn-soft" data-action="close-learn-quiz">Tillbaka till gruppen</button></div>';
    }
    const wordGroupIndex = isWordQuiz ? -1 : alphabet.wordGroups.findIndex(function (group, index) {
      return group.afterGroup === learn.groupIndex + 1 && !state.completedWordLessons[learn.alphabet][index];
    });
    const wordButton = wordGroupIndex >= 0
      ? '<button class="btn-main" data-action="open-word-group" data-word-group-index="' + wordGroupIndex + '">⭐ Nya ord →</button>'
      : '';
    const nextGroupIndex = isWordQuiz ? getCurrentLearnWordGroup().afterGroup : learn.groupIndex + 1;
    const nextGroupButton = nextGroupIndex < alphabet.groups.length
      ? '<button class="' + (wordButton ? 'btn-soft' : 'btn-main') + '" data-action="next-group" data-group-index="' + nextGroupIndex + '">Nästa grupp →</button>'
      : '';
    return '<div class="quiz-result-actions">' + wordButton + nextGroupButton +
      '<button class="btn-soft" data-action="close-learn-quiz">Tillbaka</button></div>';
  }

  function renderRomajiGuide() {
    const guide = curriculum.romajiGuide;
    app.innerHTML =
      topBarHtml() +
      '<section class="progress-layout">' +
      '<article class="card"><button class="btn-soft" data-action="go-home">Hem</button></article>' +
      '<article class="card"><h2>📖 Så läser du romaji</h2><p>' + guide.intro + '</p>' +
      '<table class="romaji-guide"><thead><tr><th>Romaji</th><th>Säg så här</th><th>Inte så här</th></tr></thead><tbody>' +
      guide.rows.map(function (row) {
        return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td><td class="muted">' + row[2] + '</td></tr>';
      }).join('') +
      '</tbody></table><p class="muted">' + guide.outro + '</p></article>' +
      '</section>';
  }

  function renderPractice() {
    const practice = state.practice;
    const isWordLevel = practice.level === 'words';
    const isLookAlikeLevel = practice.level === 'lookalike';

    let sessionBody =
      '<article class="card"><h3>Öva</h3><p>' + (isWordLevel
        ? 'Träna enkla japanska ord. Sessionen innehåller '
        : isLookAlikeLevel
          ? 'Träna på tecken som är lätta att blanda ihop. Sessionen innehåller '
          : 'Välj läge och alfabet. Sessionen innehåller ') + SESSION_QUESTION_COUNT + ' frågor.</p>' +
      '<div class="mode-toggle">' +
      toggleButtonHtml(practice.level === 'chars', 'set-practice-level', 'chars', 'Tecken') +
      toggleButtonHtml(practice.level === 'words', 'set-practice-level', 'words', 'Enkla ord') +
      toggleButtonHtml(practice.level === 'lookalike', 'set-practice-level', 'lookalike', 'Lika tecken') +
      '</div>' +
      (isLookAlikeLevel
        ? '<p class="muted" style="margin-top:8px;">Tecken som liknar varandra – titta noga på skillnaden!</p>'
        : '') +
      (isWordLevel
        ? '<p class="muted" style="margin-top:8px;">Öva orden du har låst upp i Lär dig.</p>'
        : '') +
      (isWordLevel || isLookAlikeLevel
        ? ''
        :
      '<div class="mode-toggle">' +
      toggleButtonHtml(practice.mode === 'char_to_romaji', 'set-practice-mode', 'char_to_romaji', 'Tecken → Ljud') +
      toggleButtonHtml(practice.mode === 'sound_to_char', 'set-practice-mode', 'sound_to_char', 'Ljud → Tecken', getVoiceStatus() === 'missing') +
      '</div>') +
      (isLookAlikeLevel
        ? ''
        : '<div class="alphabet-toggle" style="margin-top:8px;">' +
          toggleButtonHtml(practice.alphabet === 'hiragana', 'set-practice-alphabet', 'hiragana', 'Hiragana') +
          toggleButtonHtml(practice.alphabet === 'katakana', 'set-practice-alphabet', 'katakana', 'Katakana') +
          toggleButtonHtml(practice.alphabet === 'mixed', 'set-practice-alphabet', 'mixed', 'Blandat') +
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
          '<button class="btn-main" data-action="start-practice" data-value="again">Kör igen</button></article>';
      } else {
        const q = session.questions[session.index];
        if (q.mode === 'word_to_meaning') {
          speak(q.word);
        } else if (q.mode === 'sound_to_char' || q.mode === 'lookalike' || session.answered) {
          speak(q.char);
        }

        sessionBody +=
          '<article class="card"><h3>Fråga ' + (session.index + 1) + '/' + session.questions.length + '</h3>' +
          '<p><strong>' + q.prompt + '</strong></p>' +
          bigCharHtml(q.mode === 'char_to_romaji' ? q.char : q.mode === 'word_to_meaning' ? q.word : q.mode === 'lookalike' ? q.romaji : '🔊') +
          // Romaji stays hidden until the answer, so the child has to read the kana.
          (q.mode === 'word_to_meaning' && session.answered ? '<p class="romaji">' + q.romaji + '</p>' : '') +
          '<div class="action-row" style="grid-template-columns:repeat(2,minmax(0,1fr));">' +
          (q.mode !== 'char_to_romaji' ? '<button class="btn-soft" data-action="repeat-sound">🔊 Spela igen</button>' : '<div></div>') +
          '<div></div></div>' +
          optionButtonsHtml(q, session.answered, 'answer-practice') +
          feedbackHtml(session.feedback, session.answered) +
          nextButtonHtml(session.answered, 'next-practice', session.index === session.questions.length - 1) +
          '</article>';
      }
    }

    app.innerHTML =
      topBarHtml() +
      voiceWarningHtml() +
      '<section class="practice-layout">' +
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

    const hiraTotal = ALPHABETS.hiragana.chars.length;
    const kataTotal = ALPHABETS.katakana.chars.length;

    app.innerHTML =
      topBarHtml() +
      '<section class="progress-layout">' +
      '<article class="card"><button class="btn-soft" data-action="go-home">Hem</button></article>' +
      '<article class="card"><h3>Framsteg</h3>' + circles +
      '<p class="muted">Upptäckta: Hiragana ' + getSeenCount('hiragana') + '/' + hiraTotal + ', Katakana ' + getSeenCount('katakana') + '/' + kataTotal + '</p>' +
      '<p class="muted">Mästarnivå (L3+): Hiragana ' + getLearnedCount('hiragana') + '/' + hiraTotal + ', Katakana ' + getLearnedCount('katakana') + '/' + kataTotal + '</p>' +
      '<p class="muted">Senast uppdaterad: ' + formatUpdatedAt(state.progressUpdatedAt) + '</p></article>' +
      '<article class="card"><h3>Streak-kalender (senaste 28 dagar)</h3>' + calendar + '</article>' +
      '<article class="card"><h3>Badges</h3><div class="badge-grid">' + badges + '</div></article>' +
      '<article class="card"><h3>Hiragana nivåer</h3>' + hiraGrid + '</article>' +
      '<article class="card"><h3>Katakana nivåer</h3>' + kataGrid + '</article>' +
      '<article class="card"><h3>För föräldrar</h3><p class="muted">Börja om från början, till exempel när ett syskon ska använda appen.</p>' +
      '<button class="btn-soft" data-action="reset-progress">Nollställ framsteg</button></article>' +
      '</section>';
  }

  function progressCircleHtml(label, pct) {
    return '<div class="circle" style="background:conic-gradient(#4fc9a6 ' + pct + '%, #e9f0fb ' + pct + '% 100%)"><div>' + label + '<br>' + pct + '%</div></div>';
  }

  function renderCharLevelGrid(alphabetId) {
    const alphabet = ALPHABETS[alphabetId];
    return '<div class="char-grid">' + alphabet.chars.map(function (item) {
      const level = state.progress[alphabetId][item.char].level;
      const lengthClass = Array.from(item.char).length >= 3 ? ' long' : '';
      return '<div class="char-pill"><div class="jp' + lengthClass + '" lang="ja">' + item.char + '</div><div>L' + level + '</div></div>';
    }).join('') + '</div>';
  }

  function renderCalendar() {
    const history = new Set(state.streak.history);
    const days = [];
    const today = todayKey();

    for (let i = 27; i >= 0; i -= 1) {
      const key = datePlusDays(today, -i);
      const label = String(Number(key.slice(8, 10)));
      days.push('<div class="day-cell ' + (history.has(key) ? 'active' : '') + '">' + label + '</div>');
    }

    return '<div class="calendar">' + days.join('') + '</div>';
  }

  // Where keyboard focus goes after an action, since every render replaces the buttons.
  const FOCUS_AFTER = {
    'answer-practice': ['[data-action="next-practice"]'],
    'answer-learn-quiz': ['[data-action="next-learn-quiz"]'],
    'next-practice': ['[data-action="answer-practice"]', '[data-action="start-practice"][data-value="again"]'],
    'next-learn-quiz': ['[data-action="answer-learn-quiz"]', '[data-action="open-word-group"]', '[data-action="next-group"]',
      '[data-action="retry-learn-quiz"]', '[data-action="close-learn-quiz"]'],
    'next-group': ['#learn-focus'],
    'open-word-group': ['#learn-focus'],
    'pick-group': ['#learn-focus'],
    'pick-word-lesson': ['#learn-focus'],
    'start-practice': ['[data-action="answer-practice"]'],
    'start-learn-quiz': ['[data-action="answer-learn-quiz"]'],
    'retry-learn-quiz': ['[data-action="answer-learn-quiz"]']
  };

  function restoreFocus(action, value) {
    const selectors = (FOCUS_AFTER[action] || []).concat(
      value ? ['[data-action="' + action + '"][data-value="' + value + '"]'] : [],
      ['[data-action="' + action + '"]']
    );
    for (let i = 0; i < selectors.length; i += 1) {
      const element = app.querySelector(selectors[i]);
      if (element) {
        element.focus();
        return;
      }
    }
  }

  // Browsers load their voices after the page; redraw so the voice warning appears or disappears.
  if ('speechSynthesis' in window && typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', function () {
      if (state.view === 'learn' || state.view === 'practice') {
        render();
      }
    });
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
    } else if (action === 'go-romaji') {
      setView('romaji');
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
        speak(getCurrentLearnWords()[state.learn.cardIndex].word);
      } else {
        speak(ALPHABETS[state.learn.alphabet].groups[state.learn.groupIndex][state.learn.cardIndex].char);
      }
    } else if (action === 'start-learn-quiz') {
      startLearnQuiz();
      render();
    } else if (action === 'answer-learn-quiz') {
      answerLearnQuiz(value);
    } else if (action === 'next-learn-quiz') {
      nextLearnQuizQuestion();
    } else if (action === 'open-word-group') {
      const wordGroupIndex = Number(target.dataset.wordGroupIndex || 0);
      if (isWordGroupUnlocked(state.learn.alphabet, wordGroupIndex)) {
        state.learn.unit = 'words';
        state.learn.wordGroupIndex = wordGroupIndex;
        state.learn.cardIndex = 0;
        state.learn.quiz = null;
        pendingLearnFocus = true;
        render();
      }
    } else if (action === 'next-group') {
      state.learn.unit = 'group';
      state.learn.groupIndex = Math.min(Number(target.dataset.groupIndex || 0), ALPHABETS[state.learn.alphabet].groups.length - 1);
      state.learn.cardIndex = 0;
      state.learn.quiz = null;
      pendingLearnFocus = true;
      render();
    } else if (action === 'retry-learn-quiz') {
      startLearnQuiz();
      render();
    } else if (action === 'reset-progress') {
      if (window.confirm('Vill du nollställa alla framsteg? Det går inte att ångra.')) {
        state = createInitialState();
        state.view = 'progress';
        render();
      }
    } else if (action === 'close-learn-quiz') {
      state.learn.quiz = null;
      render();
    } else if (action === 'set-practice-mode') {
      state.practice.mode = value;
      state.practice.notice = '';
      render();
    } else if (action === 'set-practice-level') {
      state.practice.level = value === 'words' || value === 'lookalike' ? value : 'chars';
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
    } else if (action === 'next-practice') {
      nextPracticeQuestion();
    } else if (action === 'repeat-sound') {
      const session = state.practice.session;
      if (session && !session.done) {
        const q = session.questions[session.index];
        if (q.mode === 'word_to_meaning') {
          speak(q.word);
        } else {
          speak(q.char);
        }
      }
    }
    restoreFocus(action, value);
  });

  render();
})();
