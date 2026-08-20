import type {
  ConversationStudyCategory,
  StudyCategory,
  StudyDecks,
  StudyEntry,
  StudyMode,
  StudyProgress,
  StudyProgressEntry,
  StudyRating,
  WordStudyCategory,
} from "../types";

export const STUDY_MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: "words", label: "Words" },
  { value: "conversation", label: "Conversation" },
];

export const STUDY_CATEGORY_OPTIONS: Record<
  StudyMode,
  { value: StudyCategory; label: string }[]
> = {
  words: [
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
  ],
  conversation: [
    { value: "all", label: "All cards" },
    { value: "practice", label: "Compounds & phrases" },
    { value: "greetings", label: "Greetings" },
    { value: "courtesy", label: "Courtesy" },
    { value: "introductions", label: "Introductions" },
    { value: "needs", label: "Needs & requests" },
    { value: "directions", label: "Directions" },
    { value: "time", label: "Time & days" },
  ],
};

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

const WORD_CATEGORY_TAGS: Record<
  Exclude<WordStudyCategory, "all">,
  string[]
> = {
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

const CONVERSATION_CATEGORY_TAGS: Record<
  Exclude<ConversationStudyCategory, "all">,
  string[]
> = {
  practice: ["practice"],
  greetings: ["greetings"],
  courtesy: ["courtesy"],
  introductions: ["introductions"],
  needs: ["needs"],
  directions: ["directions"],
  time: ["time"],
};

const CATEGORY_TAGS_BY_MODE = {
  words: WORD_CATEGORY_TAGS,
  conversation: CONVERSATION_CATEGORY_TAGS,
} satisfies Record<StudyMode, Record<string, string[]>>;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function createInitialProgress(decks: StudyDecks): StudyProgress {
  return {
    words: createInitialModeProgress(decks.words),
    conversation: createInitialModeProgress(decks.conversation),
  };
}

export function createInitialProgressEntry(): StudyProgressEntry {
  return {
    familiarity: 0,
    exposureCount: 0,
    lastRating: null,
    lastReviewedAt: null,
    dueAt: null,
  };
}

export function normalizeProgress(
  decks: StudyDecks,
  progress: StudyProgress | null | undefined,
): StudyProgress {
  const fallback = createInitialProgress(decks);

  if (!progress) {
    return fallback;
  }

  return {
    words: normalizeModeProgress(decks.words, progress.words, fallback.words),
    conversation: normalizeModeProgress(
      decks.conversation,
      progress.conversation,
      fallback.conversation,
    ),
  };
}

export function applyRating(
  progress: StudyProgress,
  mode: StudyMode,
  itemId: string,
  rating: StudyRating,
  now = new Date(),
): StudyProgress {
  const current = progress[mode][itemId];

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
    ...progress,
    [mode]: {
      ...progress[mode],
      [itemId]: updated,
    },
  };
}

export function getDueStudyItems(
  items: StudyEntry[],
  progress: StudyProgress,
  mode: StudyMode,
  now = new Date(),
  query = "",
  category: StudyCategory = "all",
  random = Math.random,
): StudyEntry[] {
  const normalized = normalizeSearchText(query.trim());

  const dueItems = items
    .filter((item) => {
      const haystack = `${item.thai} ${item.transliteration} ${item.meaning}`;
      const matchesQuery =
        !normalized || normalizeSearchText(haystack).includes(normalized);
      const matchesSelectedCategory = matchesCategory(item, mode, category);
      const record = progress[mode][item.id];
      const dueAt = record?.dueAt
        ? new Date(record.dueAt).getTime()
        : Number.NEGATIVE_INFINITY;
      return (
        matchesQuery &&
        matchesSelectedCategory &&
        !isKnownItem(progress, mode, item.id) &&
        dueAt <= now.getTime()
      );
    })
    .sort((left, right) => {
      const leftProgress = progress[mode][left.id];
      const rightProgress = progress[mode][right.id];

      if (leftProgress.familiarity !== rightProgress.familiarity) {
        return leftProgress.familiarity - rightProgress.familiarity;
      }

      if (leftProgress.exposureCount !== rightProgress.exposureCount) {
        return leftProgress.exposureCount - rightProgress.exposureCount;
      }

      return left.thai.localeCompare(right.thai);
    });

  return shuffleStudyItems(dueItems, progress, mode, now, random);
}

export function getStudyItems(
  items: StudyEntry[],
  progress: StudyProgress,
  mode: StudyMode,
  now = new Date(),
  query = "",
  category: StudyCategory = "all",
  random = Math.random,
): StudyEntry[] {
  const normalized = normalizeSearchText(query.trim());

  const studyItems = items
    .filter((item) => {
      const haystack = `${item.thai} ${item.transliteration} ${item.meaning}`;
      const matchesQuery =
        !normalized || normalizeSearchText(haystack).includes(normalized);

      return (
        matchesQuery &&
        matchesCategory(item, mode, category) &&
        !isKnownItem(progress, mode, item.id)
      );
    })
    .sort((left, right) => {
      const leftProgress = progress[mode][left.id];
      const rightProgress = progress[mode][right.id];
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

  return shuffleStudyItems(studyItems, progress, mode, now, random);
}

export function getMatchingItems(
  items: StudyEntry[],
  mode: StudyMode,
  query = "",
  category: StudyCategory = "all",
): StudyEntry[] {
  const normalized = normalizeSearchText(query.trim());

  return items.filter((item) => {
    const haystack = `${item.thai} ${item.transliteration} ${item.meaning}`;
    const matchesQuery =
      !normalized || normalizeSearchText(haystack).includes(normalized);
    return matchesQuery && matchesCategory(item, mode, category);
  });
}

export function matchesCategory(
  item: StudyEntry,
  mode: StudyMode,
  category: StudyCategory,
) {
  if (category === "all") {
    return true;
  }

  const categoryTags = (
    CATEGORY_TAGS_BY_MODE[mode] as Record<string, string[]>
  )[category];
  return categoryTags
    ? categoryTags.some((tag: string) => item.tags.includes(tag))
    : false;
}

export function countKnownItems(progress: StudyProgress, mode: StudyMode) {
  return Object.values(progress[mode]).filter(
    (item) => item.lastRating === "known",
  ).length;
}

export function resetProgressForItemIds(
  progress: StudyProgress,
  mode: StudyMode,
  itemIds: string[],
): StudyProgress {
  if (itemIds.length === 0) {
    return progress;
  }

  const resetIds = new Set(itemIds);

  return {
    ...progress,
    [mode]: Object.fromEntries(
      Object.entries(progress[mode]).map(([itemId, itemProgress]) => [
        itemId,
        resetIds.has(itemId) ? createInitialProgressEntry() : itemProgress,
      ]),
    ),
  };
}

export function isKnownItem(
  progress: StudyProgress,
  mode: StudyMode,
  itemId: string,
) {
  return progress[mode][itemId]?.lastRating === "known";
}

function createInitialModeProgress(items: StudyEntry[]) {
  return Object.fromEntries(
    items.map((item) => [item.id, createInitialProgressEntry()]),
  );
}

function normalizeModeProgress(
  items: StudyEntry[],
  progress: Record<string, StudyProgressEntry> | undefined,
  fallback: Record<string, StudyProgressEntry>,
) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        ...fallback[item.id],
        ...progress?.[item.id],
      },
    ]),
  );
}

function getDueAtTime(progressEntry: StudyProgressEntry | undefined) {
  return progressEntry?.dueAt
    ? new Date(progressEntry.dueAt).getTime()
    : Number.NEGATIVE_INFINITY;
}

function shuffleStudyItems(
  items: StudyEntry[],
  progress: StudyProgress,
  mode: StudyMode,
  now: Date,
  random: () => number,
) {
  const shuffledItems: StudyEntry[] = [];
  let groupStart = 0;

  while (groupStart < items.length) {
    const firstItem = items[groupStart];
    const firstProgress = progress[mode][firstItem.id];
    const firstDueAt = getDueAtTime(firstProgress);
    const firstIsDue = firstDueAt <= now.getTime();
    let groupEnd = groupStart + 1;

    while (groupEnd < items.length) {
      const nextItem = items[groupEnd];
      const nextProgress = progress[mode][nextItem.id];
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

    const group = [...items.slice(groupStart, groupEnd)];

    for (let index = group.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const current = group[index];
      group[index] = group[swapIndex];
      group[swapIndex] = current;
    }

    shuffledItems.push(...group);
    groupStart = groupEnd;
  }

  return shuffledItems;
}
