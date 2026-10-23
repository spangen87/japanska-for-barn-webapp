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
      // Only a review on or after its due date moves the level, so one session cannot reach mastery.
      if (entry.nextReview <= today) {
        next.level = Math.min(5, next.level + 1);
        const spacing = [0, 1, 2, 4, 7][next.level - 1] || 7;
        next.nextReview = datePlusDays(today, spacing);
      }
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

  // Draws count items in rounds: every item once (heavier first, by weight) before any repeats,
  // and never two items with the same key (by default the item itself) in a row.
  function pickRounds(items, count, weightOf, keyOf) {
    const weight = weightOf || function () {
      return 1;
    };
    const key = keyOf || function (item) {
      return item;
    };
    const picked = [];
    let remaining = [];
    while (picked.length < count && items.length) {
      if (!remaining.length) {
        remaining = items.slice();
      }
      const last = picked[picked.length - 1];
      const differs = function (item) {
        return picked.length === 0 || key(item) !== key(last);
      };
      const fresh = remaining.filter(differs);
      if (fresh.length) {
        const choice = weightedChoice(fresh, weight);
        remaining.splice(remaining.indexOf(choice), 1);
        picked.push(choice);
      } else {
        // Only same-key items are left in this round: borrow one from the next round instead.
        const others = items.filter(differs);
        picked.push(weightedChoice(others.length ? others : remaining, weight));
      }
    }
    return picked;
  }

  function weightedChoice(items, weight) {
    const total = items.reduce(function (sum, item) {
      return sum + weight(item);
    }, 0);
    if (total <= 0) {
      return items[Math.floor(Math.random() * items.length)];
    }
    let random = Math.random() * total;
    for (let i = 0; i < items.length; i += 1) {
      random -= weight(items[i]);
      if (random < 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
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
    pickRounds: pickRounds,
    shuffle: shuffle,
    updateStreak: updateStreak
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.JapaneseAppCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
