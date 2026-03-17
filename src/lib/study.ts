import type {
  StudyCategory,
  StudyProgress,
  StudyRating,
  WordEntry,
} from "../types";

export const STORAGE_KEY = "khru-study-progress";
export const STUDY_CATEGORIES: { value: StudyCategory; label: string }[] = [
  { value: "all", label: "All words" },
  { value: "basics", label: "Basics" },
  { value: "people", label: "People" },
  { value: "food", label: "Food & drink" },
  { value: "places", label: "Places & travel" },
  { value: "time", label: "Time & numbers" },
  { value: "actions", label: "Actions" },
  { value: "describing", label: "Describing" },
  { value: "home", label: "Home & things" },
  { value: "body", label: "Body" },
  { value: "signs", label: "Signs" },
];

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

const CATEGORY_TAGS: Record<Exclude<StudyCategory, "all">, string[]> = {
  basics: [
    "pronoun",
    "greeting",
    "particle",
    "question",
    "pointer",
    "connector",
    "response",
    "politeness",
  ],
  people: ["people", "family", "pronoun"],
  food: ["food", "drink"],
  places: ["place", "transport", "money", "technology", "language"],
  time: ["time", "calendar", "number"],
  actions: ["verb"],
  describing: ["adjective", "adverb", "feeling", "quantifier"],
  home: ["home", "object", "clothes"],
  body: ["body"],
  signs: ["sign"],
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function createInitialProgress(words: WordEntry[]): StudyProgress {
  return {
    words: Object.fromEntries(
      words.map((word) => [word.id, createInitialWordProgress()]),
    ),
  };
}

export function createInitialWordProgress() {
  return {
    familiarity: 0,
    exposureCount: 0,
    lastRating: null,
    lastReviewedAt: null,
    dueAt: null,
  };
}

export function normalizeProgress(
  words: WordEntry[],
  progress: StudyProgress | null | undefined,
): StudyProgress {
  const fallback = createInitialProgress(words);

  if (!progress) {
    return fallback;
  }

  return {
    words: Object.fromEntries(
      words.map((word) => [
        word.id,
        {
          ...fallback.words[word.id],
          ...progress.words?.[word.id],
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
  category: StudyCategory = "all",
  random = Math.random,
): WordEntry[] {
  const normalized = normalizeSearchText(query.trim());

  const dueWords = words
    .filter((word) => {
      const haystack = `${word.thai} ${word.transliteration} ${word.transliterationMarked} ${word.meaning}`;
      const matchesQuery =
        !normalized || normalizeSearchText(haystack).includes(normalized);
      const matchesSelectedCategory = matchesCategory(word, category);
      const record = progress.words[word.id];
      const dueAt = record?.dueAt
        ? new Date(record.dueAt).getTime()
        : Number.NEGATIVE_INFINITY;
      return (
        matchesQuery &&
        matchesSelectedCategory &&
        !isKnownWord(progress, word.id) &&
        dueAt <= now.getTime()
      );
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

  return shuffleStudyWords(dueWords, progress, now, random);
}

export function getStudyWords(
  words: WordEntry[],
  progress: StudyProgress,
  now = new Date(),
  query = "",
  category: StudyCategory = "all",
  random = Math.random,
): WordEntry[] {
  const normalized = normalizeSearchText(query.trim());

  const studyWords = words
    .filter((word) => {
      const haystack = `${word.thai} ${word.transliteration} ${word.transliterationMarked} ${word.meaning}`;
      const matchesQuery =
        !normalized || normalizeSearchText(haystack).includes(normalized);

      return (
        matchesQuery &&
        matchesCategory(word, category) &&
        !isKnownWord(progress, word.id)
      );
    })
    .sort((left, right) => {
      const leftProgress = progress.words[left.id];
      const rightProgress = progress.words[right.id];
      const leftDueAt = getDueAtTime(leftProgress);
      const rightDueAt = getDueAtTime(rightProgress);
      const leftIsDue = leftDueAt <= now.getTime();
      const rightIsDue = rightDueAt <= now.getTime();

      if (leftIsDue !== rightIsDue) {
        return leftIsDue ? -1 : 1;
      }

      if (leftProgress.familiarity !== rightProgress.familiarity) {
        return leftProgress.familiarity - rightProgress.familiarity;
      }

      if (leftProgress.exposureCount !== rightProgress.exposureCount) {
        return leftProgress.exposureCount - rightProgress.exposureCount;
      }

      if (leftDueAt !== rightDueAt) {
        return leftDueAt - rightDueAt;
      }

      return left.thai.localeCompare(right.thai);
    });

  return shuffleStudyWords(studyWords, progress, now, random);
}

export function getMatchingWords(
  words: WordEntry[],
  query = "",
  category: StudyCategory = "all",
): WordEntry[] {
  const normalized = normalizeSearchText(query.trim());

  return words.filter((word) => {
    const haystack = `${word.thai} ${word.transliteration} ${word.transliterationMarked} ${word.meaning}`;
    const matchesQuery =
      !normalized || normalizeSearchText(haystack).includes(normalized);
    return matchesQuery && matchesCategory(word, category);
  });
}

export function matchesCategory(word: WordEntry, category: StudyCategory) {
  if (category === "all") {
    return true;
  }

  return CATEGORY_TAGS[category].some((tag) => word.tags.includes(tag));
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
    return normalizeProgress(words, parsed);
  } catch {
    return createInitialProgress(words);
  }
}

export function saveProgress(progress: StudyProgress, storage: Storage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function countKnownWords(progress: StudyProgress) {
  return Object.values(progress.words).filter(
    (word) => word.lastRating === "known",
  ).length;
}

export function resetProgressForWordIds(
  progress: StudyProgress,
  wordIds: string[],
): StudyProgress {
  if (wordIds.length === 0) {
    return progress;
  }

  return {
    words: Object.fromEntries(
      Object.entries(progress.words).map(([wordId, wordProgress]) => [
        wordId,
        wordIds.includes(wordId) ? createInitialWordProgress() : wordProgress,
      ]),
    ),
  };
}

export function isKnownWord(progress: StudyProgress, wordId: string) {
  return progress.words[wordId]?.lastRating === "known";
}

function getDueAtTime(wordProgress: StudyProgress["words"][string]) {
  return wordProgress?.dueAt
    ? new Date(wordProgress.dueAt).getTime()
    : Number.NEGATIVE_INFINITY;
}

function shuffleStudyWords(
  words: WordEntry[],
  progress: StudyProgress,
  now: Date,
  random: () => number,
) {
  const shuffledWords: WordEntry[] = [];
  let groupStart = 0;

  while (groupStart < words.length) {
    const firstWord = words[groupStart];
    const firstProgress = progress.words[firstWord.id];
    const firstDueAt = getDueAtTime(firstProgress);
    const firstIsDue = firstDueAt <= now.getTime();
    let groupEnd = groupStart + 1;

    while (groupEnd < words.length) {
      const nextWord = words[groupEnd];
      const nextProgress = progress.words[nextWord.id];
      const nextDueAt = getDueAtTime(nextProgress);
      const nextIsDue = nextDueAt <= now.getTime();

      if (
        nextIsDue !== firstIsDue ||
        nextProgress.familiarity !== firstProgress.familiarity ||
        nextProgress.exposureCount !== firstProgress.exposureCount
      ) {
        break;
      }

      groupEnd += 1;
    }

    const group = [...words.slice(groupStart, groupEnd)];

    for (let index = group.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const current = group[index];
      group[index] = group[swapIndex];
      group[swapIndex] = current;
    }

    shuffledWords.push(...group);
    groupStart = groupEnd;
  }

  return shuffledWords;
}
