// utils/diff.js

// Break text into lowercase word tokens
export function tokenizeWords(text) {
  if (!text) return [];
  const arr = String(text).match(/\w+/g);
  return arr ? arr.map((w) => w.toLowerCase()) : [];
}

// Convert array of words to frequency map { word: count }
export function freqMap(words) {
  const m = {};
  for (const w of words) {
    m[w] = (m[w] || 0) + 1;
  }
  return m;
}

// Main diff function: finds added & removed words
export function diffWords(oldText, newText) {
  const oldWords = tokenizeWords(oldText);
  const newWords = tokenizeWords(newText);

  const oldMap = freqMap(oldWords);
  const newMap = freqMap(newWords);

  const added = [];
  const removed = [];

  // Added words
  for (const w in newMap) {
    if (newMap[w] > (oldMap[w] || 0)) {
      added.push(w);
    }
  }

  // Removed words
  for (const w in oldMap) {
    if (oldMap[w] > (newMap[w] || 0)) {
      removed.push(w);
    }
  }

  return {
    addedWords: added,
    removedWords: removed,
  };
}
