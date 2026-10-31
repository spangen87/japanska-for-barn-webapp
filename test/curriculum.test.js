const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/curriculum.js');

const SMALL_KANA = new Set(Array.from('ゃゅょャュョァィゥェォ'));
const LONG_VOWEL = /aa|ii|uu|ee|oo|ou|ei/;
const RULE_GROUP = 11;

// Splits text into readable units: a kana plus any small kana that follows it.
function splitUnits(text) {
  const chars = Array.from(text);
  const units = [];
  chars.forEach((ch) => {
    if (SMALL_KANA.has(ch) && units.length) {
      units[units.length - 1] += ch;
    } else {
      units.push(ch);
    }
  });
  return units;
}

function indexUnits(alphabet) {
  const groupOf = {};
  const romajiOf = {};
  alphabet.groups.forEach((group, index) => {
    if (group.teaches) {
      group.teaches.forEach((unit) => {
        groupOf[unit] = index + 1;
      });
      return;
    }
    group.items.forEach((item) => {
      groupOf[item.char] = index + 1;
      romajiOf[item.char] = item.romaji;
    });
  });
  return { groupOf, romajiOf };
}

function romanize(text, romajiOf) {
  const units = splitUnits(text);
  let out = '';
  units.forEach((unit, i) => {
    if (unit === 'っ' || unit === 'ッ') {
      const next = romajiOf[units[i + 1]] || '?';
      out += next[0] === 'c' ? 't' : next[0];
    } else if (unit === 'ー') {
      out += out[out.length - 1];
    } else {
      out += unit in romajiOf ? romajiOf[unit] : '?' + unit + '?';
    }
  });
  return out;
}

function allWords(alphabet) {
  return alphabet.wordGroups.flatMap((group) => group.words.map((word) => ({ afterGroup: group.afterGroup, ...word })));
}

test('hiragana has 21 lesson groups with 108 items', () => {
  const groups = curriculum.hiragana.groups;
  assert.equal(groups.length, 21);
  assert.equal(groups.reduce((n, group) => n + group.items.length, 0), 108);
});

test('katakana has 22 lesson groups with 115 items', () => {
  const groups = curriculum.katakana.groups;
  assert.equal(groups.length, 22);
  assert.equal(groups.reduce((n, group) => n + group.items.length, 0), 115);
});

test('voiced kana tips name the base kana and the sound change', () => {
  const groups = curriculum.hiragana.groups;
  assert.equal(groups[11].items[0].tip, 'か + ゛ = が: k blir g.');
  assert.equal(groups[12].items[1].tip, 'し + ゛ = じ: s blir z (uttalas ji).');
  assert.equal(groups[15].items[0].tip, 'は + ゜ = ぱ: h blir p.');
});

test('combination tips explain how to say the sound', () => {
  assert.equal(curriculum.hiragana.groups[16].items[0].tip, 'き + litet ゃ = きゃ: säg ki-a snabbt, så blir det kya.');
  assert.equal(curriculum.katakana.groups[16].items[3].tip, 'シ + litet ャ = シャ: säg shi-a snabbt, så blir det sha.');
});

test('loanword sound tips show how the small kana combines', () => {
  assert.equal(curriculum.katakana.groups[21].items[0].tip, 'テ + litet ィ = ティ (ti). Ljudet finns bara i lånord.');
});

test('categories only name meanings that exist in the word lists', () => {
  const meanings = new Set(['hiragana', 'katakana'].flatMap((id) => allWords(curriculum[id]).map((word) => word.meaning)));
  Object.keys(curriculum.categories).forEach((category) => {
    assert.ok(meanings.has(category), category);
    curriculum.categories[category].forEach((member) => assert.ok(meanings.has(member), member));
  });
});

test('every base kana in both alphabets has a mnemonic', () => {
  ['hiragana', 'katakana'].forEach((alphabetId) => {
    const missing = curriculum[alphabetId].groups.slice(0, 10)
      .flatMap((group) => group.items)
      .filter((item) => !item.mnemonic)
      .map((item) => item.char);
    assert.deepEqual(missing, []);
  });
});

test('look-alike sets only use kana from the curriculum', () => {
  const chars = new Set(['hiragana', 'katakana'].flatMap((id) => curriculum[id].groups.flatMap((group) => group.items.map((item) => item.char))));
  curriculum.lookAlikes.forEach((set) => {
    assert.ok(set.length >= 2, set.join());
    set.forEach((char) => assert.ok(chars.has(char), char));
  });
});

test('every pronunciation tip matches at least one lesson item', () => {
  const romaji = ['hiragana', 'katakana'].flatMap((id) => curriculum[id].groups.flatMap((group) => group.items.map((item) => item.romaji)));
  curriculum.pronunciationTips.forEach((rule) => {
    assert.ok(romaji.some((value) => rule.match.test(value)), String(rule.match));
  });
});

test('the romaji guide covers the tricky letters', () => {
  const covered = curriculum.romajiGuide.rows.map((row) => row[0]).join(' ');
  ['u', 'o', 'ki', 'gi', 'ya', 'ji', 'shi', 'chi', 'tsu', 'z', 'r', 'fu', 'w'].forEach((letters) => {
    assert.ok(covered.includes(letters), letters);
  });
});

test('lesson groups and word groups have ids that are unique within each alphabet', () => {
  ['hiragana', 'katakana'].forEach((alphabetId) => {
    const groupIds = curriculum[alphabetId].groups.map((group) => group.id);
    const wordGroupIds = curriculum[alphabetId].wordGroups.map((group) => group.id);
    assert.equal(new Set(groupIds).size, groupIds.length);
    assert.equal(new Set(wordGroupIds).size, wordGroupIds.length);
    groupIds.concat(wordGroupIds).forEach((id) => assert.ok(id));
  });
});

test('penguins count as birds', () => {
  assert.ok(curriculum.categories['fågel'].includes('pingvin'));
});

['hiragana', 'katakana'].forEach((alphabetId) => {
  const alphabet = curriculum[alphabetId];
  const { groupOf, romajiOf } = indexUnits(alphabet);

  test(alphabetId + ': rule group items have romaji that matches their kana', () => {
    const wrong = alphabet.groups[RULE_GROUP - 1].items
      .filter((item) => romanize(item.char, romajiOf) !== item.romaji)
      .map((item) => item.char);
    assert.deepEqual(wrong, []);
  });

  test(alphabetId + ': every word has romaji that matches its kana', () => {
    const wrong = allWords(alphabet)
      .filter((word) => romanize(word.word, romajiOf) !== word.romaji)
      .map((word) => word.word + ' ' + word.romaji + ' (väntat ' + romanize(word.word, romajiOf) + ')');
    assert.deepEqual(wrong, []);
  });

  test(alphabetId + ': every word only uses kana taught up to its group', () => {
    const tooEarly = allWords(alphabet)
      .filter((word) => Math.max(...splitUnits(word.word).map((unit) => groupOf[unit] || Infinity)) > word.afterGroup)
      .map((word) => word.word);
    assert.deepEqual(tooEarly, []);
  });

  test(alphabetId + ': rule group items only use kana taught up to the rule group', () => {
    const tooEarly = alphabet.groups[RULE_GROUP - 1].items
      .filter((item) => Math.max(...splitUnits(item.char).map((unit) => groupOf[unit] || Infinity)) > RULE_GROUP)
      .map((item) => item.char);
    assert.deepEqual(tooEarly, []);
  });

  test(alphabetId + ': words with long vowels come after the rule group', () => {
    const tooEarly = allWords(alphabet)
      .filter((word) => LONG_VOWEL.test(word.romaji) && word.afterGroup < RULE_GROUP)
      .map((word) => word.word);
    assert.deepEqual(tooEarly, []);
  });

  test(alphabetId + ': lesson items, words, meanings and emoji are never repeated', () => {
    const items = alphabet.groups.flatMap((group) => group.items.map((item) => item.char));
    const words = allWords(alphabet);
    [items, words.map((w) => w.word), words.map((w) => w.meaning), words.map((w) => w.emoji)].forEach((values) => {
      const repeated = values.filter((value, i) => values.indexOf(value) !== i);
      assert.deepEqual(repeated, []);
    });
  });

  test(alphabetId + ': no word meaning reads like another word\'s romaji', () => {
    const words = allWords(alphabet);
    const clashes = words
      .filter((word) => words.some((other) => other !== word && other.romaji === word.meaning))
      .map((word) => word.word + ' "' + word.meaning + '"');
    assert.deepEqual(clashes, []);
  });

  test(alphabetId + ': every word group has 4 to 6 words and follows an existing group', () => {
    alphabet.wordGroups.forEach((group) => {
      assert.ok(group.words.length >= 4 && group.words.length <= 6, 'storlek ' + group.words.length);
      assert.ok(group.afterGroup >= 1 && group.afterGroup <= alphabet.groups.length, 'afterGroup ' + group.afterGroup);
    });
  });
});
