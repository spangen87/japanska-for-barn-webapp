const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/app-core.js');

test('createProgressMap initializes each character at level 1', () => {
  const chars = [{ char: 'あ' }, { char: 'い' }];
  const map = core.createProgressMap(chars, '2026-02-27');

  assert.deepEqual(map['あ'], {
    level: 1,
    timesCorrect: 0,
    timesWrong: 0,
    nextReview: '2026-02-27'
  });
  assert.deepEqual(map['い'], {
    level: 1,
    timesCorrect: 0,
    timesWrong: 0,
    nextReview: '2026-02-27'
  });
});

test('updateStreak increments on consecutive day and updates best', () => {
  const streak = {
    current: 3,
    best: 3,
    lastDate: '2026-02-26',
    history: ['2026-02-24', '2026-02-25', '2026-02-26']
  };

  const next = core.updateStreak(streak, '2026-02-27');
  assert.equal(next.current, 4);
  assert.equal(next.best, 4);
  assert.equal(next.lastDate, '2026-02-27');
  assert.equal(next.history.includes('2026-02-27'), true);
});

test('updateStreak resets when day gap is larger than one day', () => {
  const streak = {
    current: 8,
    best: 8,
    lastDate: '2026-02-20',
    history: ['2026-02-20']
  };

  const next = core.updateStreak(streak, '2026-02-27');
  assert.equal(next.current, 1);
  assert.equal(next.best, 8);
});

test('applyReview raises level and sets spaced nextReview when correct', () => {
  const entry = {
    level: 2,
    timesCorrect: 4,
    timesWrong: 1,
    nextReview: '2026-02-26'
  };
  const next = core.applyReview(entry, true, '2026-02-27');

  assert.equal(next.level, 3);
  assert.equal(next.timesCorrect, 5);
  assert.equal(next.nextReview, '2026-03-01');
});

test('applyReview lowers level and sets nextReview to today when wrong', () => {
  const entry = {
    level: 3,
    timesCorrect: 6,
    timesWrong: 0,
    nextReview: '2026-03-03'
  };
  const next = core.applyReview(entry, false, '2026-02-27');

  assert.equal(next.level, 2);
  assert.equal(next.timesWrong, 1);
  assert.equal(next.nextReview, '2026-02-27');
});

test('isGroupUnlocked only unlocks next group after previous is completed', () => {
  const completed = [true, false, false];
  assert.equal(core.isGroupUnlocked(completed, 0), true);
  assert.equal(core.isGroupUnlocked(completed, 1), true);
  assert.equal(core.isGroupUnlocked(completed, 2), false);
});

test('getProgressPercent uses threshold correctly', () => {
  const progress = {
    あ: { level: 3 },
    い: { level: 2 },
    う: { level: 5 },
    え: { level: 1 }
  };

  const percent = core.getProgressPercent(progress, 4, 3);
  assert.equal(percent, 50);
});
