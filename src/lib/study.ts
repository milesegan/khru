import type { StudyProgress, StudyRating, WordEntry } from "../types";

export const STORAGE_KEY = "khru-study-progress";

const RATING_INTERVALS: Record<StudyRating, number> = {
  again: 5 * 60 * 1000,
  okay: 12 * 60 * 60 * 1000,
  known: 3 * 24 * 60 * 60 * 1000,
};

const FAMILIARITY_SHIFT: Record<StudyRating, number> = {
  again: -1,
  okay: 1,
  known: 2,
};

export function createInitialProgress(words: WordEntry[]): StudyProgress {
  return {
    words: Object.fromEntries(
      words.map((word) => [
        word.id,
        {
          familiarity: 0,
          exposureCount: 0,
          lastRating: null,
          lastReviewedAt: null,
          dueAt: null,
        },
      ]),
    ),
  };
}

export function applyRating(
  progress: StudyProgress,
  wordId: string,
  rating: StudyRating,
  now = new Date(),
): StudyProgress {
  const current = progress.words[wordId];

  if (!current) {
    return progress;
  }

  const familiarity = Math.max(
    0,
    Math.min(5, current.familiarity + FAMILIARITY_SHIFT[rating]),
  );
  const updated = {
    ...current,
    familiarity,
    exposureCount: current.exposureCount + 1,
    lastRating: rating,
    lastReviewedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + RATING_INTERVALS[rating]).toISOString(),
  };

  return {
    words: {
      ...progress.words,
      [wordId]: updated,
    },
  };
}

export function getDueWords(
  words: WordEntry[],
  progress: StudyProgress,
  now = new Date(),
  query = "",
  random = Math.random,
): WordEntry[] {
  const normalized = query.trim().toLowerCase();

  const dueWords = words
    .filter((word) => {
      const haystack =
        `${word.thai} ${word.transliteration} ${word.meaning}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const record = progress.words[word.id];
      const dueAt = record?.dueAt
        ? new Date(record.dueAt).getTime()
        : Number.NEGATIVE_INFINITY;
      return matchesQuery && dueAt <= now.getTime();
    })
    .sort((left, right) => {
      const leftProgress = progress.words[left.id];
      const rightProgress = progress.words[right.id];

      if (leftProgress.familiarity !== rightProgress.familiarity) {
        return leftProgress.familiarity - rightProgress.familiarity;
      }

      if (leftProgress.exposureCount !== rightProgress.exposureCount) {
        return leftProgress.exposureCount - rightProgress.exposureCount;
      }

      return left.thai.localeCompare(right.thai);
    });

  const shuffledDueWords: WordEntry[] = [];
  let groupStart = 0;

  while (groupStart < dueWords.length) {
    const firstWord = dueWords[groupStart];
    const firstProgress = progress.words[firstWord.id];
    let groupEnd = groupStart + 1;

    while (groupEnd < dueWords.length) {
      const nextWord = dueWords[groupEnd];
      const nextProgress = progress.words[nextWord.id];

      if (
        nextProgress.familiarity !== firstProgress.familiarity ||
        nextProgress.exposureCount !== firstProgress.exposureCount
      ) {
        break;
      }

      groupEnd += 1;
    }

    const group = [...dueWords.slice(groupStart, groupEnd)];

    for (let index = group.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const current = group[index];
      group[index] = group[swapIndex];
      group[swapIndex] = current;
    }

    shuffledDueWords.push(...group);
    groupStart = groupEnd;
  }

  return shuffledDueWords;
}

export function getMatchingWords(words: WordEntry[], query = ""): WordEntry[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return words;
  }

  return words.filter((word) => {
    const haystack =
      `${word.thai} ${word.transliteration} ${word.meaning}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function loadProgress(
  words: WordEntry[],
  storage: Storage,
): StudyProgress {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialProgress(words);
  }

  try {
    const parsed = JSON.parse(raw) as StudyProgress;
    const fallback = createInitialProgress(words);

    return {
      words: Object.fromEntries(
        words.map((word) => [
          word.id,
          {
            ...fallback.words[word.id],
            ...parsed.words?.[word.id],
          },
        ]),
      ),
    };
  } catch {
    return createInitialProgress(words);
  }
}

export function saveProgress(progress: StudyProgress, storage: Storage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function countKnownWords(progress: StudyProgress) {
  return Object.values(progress.words).filter((word) => word.familiarity >= 2)
    .length;
}
