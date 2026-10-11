(function (globalScope) {
  function datePlusDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function createProgressMap(chars, today) {
    const map = {};
    chars.forEach(function (item) {
      map[item.char] = {
        level: 1,
        timesCorrect: 0,
        timesWrong: 0,
        nextReview: today
      };
    });
    return map;
  }

  function updateStreak(streak, today) {
    if (streak.lastDate === today) {
      return { ...streak };
    }

    const yesterday = datePlusDays(today, -1);
    const current = streak.lastDate === yesterday ? streak.current + 1 : 1;
    const best = Math.max(streak.best, current);
    const history = streak.history.includes(today)
      ? streak.history.slice()
      : streak.history.concat(today).slice(-42);

    return {
      ...streak,
      current: current,
      best: best,
      lastDate: today,
      history: history
    };
  }

  function getActiveStreak(streak, today) {
    if (streak.lastDate === today || streak.lastDate === datePlusDays(today, -1)) {
      return streak.current;
    }
    return 0;
  }

  function applyReview(entry, correct, today) {
    const next = { ...entry };
    if (correct) {
      next.timesCorrect += 1;
      next.level = Math.min(5, next.level + 1);
      const spacing = [0, 1, 2, 4, 7][next.level - 1] || 7;
      next.nextReview = datePlusDays(today, spacing);
    } else {
      next.timesWrong += 1;
      next.level = Math.max(1, next.level - 1);
      next.nextReview = today;
    }
    return next;
  }

  function isGroupUnlocked(completedGroups, groupIndex) {
    if (groupIndex === 0) {
      return true;
    }
    return Boolean(completedGroups[groupIndex - 1]);
  }

  function isWordGroupUnlocked(completedGroups, afterGroup) {
    return Boolean(completedGroups[afterGroup - 1]);
  }

  function getLearnedCount(progressMap, threshold) {
    const levelThreshold = Number.isInteger(threshold) ? threshold : 3;
    return Object.keys(progressMap).filter(function (char) {
      return progressMap[char].level >= levelThreshold;
    }).length;
  }

  function getProgressPercent(progressMap, total, threshold) {
    if (!total) {
      return 0;
    }
    const learned = getLearnedCount(progressMap, threshold);
    return Math.round((learned / total) * 100);
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
  }

  function buildOptions(pool, answer, pickFn) {
    const distractors = Array.from(new Set(pool.map(pickFn))).filter(function (value) {
      return value !== answer;
    });
    shuffle(distractors);
    const options = [answer].concat(distractors.slice(0, 3));
    shuffle(options);
    return options;
  }

  const api = {
    applyReview: applyReview,
    buildOptions: buildOptions,
    createProgressMap: createProgressMap,
    datePlusDays: datePlusDays,
    getActiveStreak: getActiveStreak,
    getLearnedCount: getLearnedCount,
    getProgressPercent: getProgressPercent,
    isGroupUnlocked: isGroupUnlocked,
    isWordGroupUnlocked: isWordGroupUnlocked,
    shuffle: shuffle,
    updateStreak: updateStreak
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.JapaneseAppCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
