import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  createInitialProgress,
  normalizeProgress,
  STORAGE_KEY,
  STUDY_CATEGORY_OPTIONS,
} from "../lib/study";
import type {
  StudyCategory,
  StudyDecks,
  StudyMode,
  StudyProgress,
} from "../types";

type ProgressUpdate =
  | StudyProgress
  | ((currentProgress: StudyProgress) => StudyProgress);
type StudySelection = {
  mode: StudyMode;
  category: StudyCategory;
};

const progressStorage = createJSONStorage<StudyProgress | null>(
  () => window.localStorage,
);
const selectionStorage = createJSONStorage<StudySelection | null>(
  () => window.localStorage,
);
const STUDY_SELECTION_STORAGE_KEY = "khru-study-selection-v1";

function normalizeCategoryForMode(
  mode: StudyMode,
  category: StudyCategory | null | undefined,
): StudyCategory {
  const categoryOptions = STUDY_CATEGORY_OPTIONS[mode];
  const matchingCategory = categoryOptions.find(
    (option) => option.value === category,
  )?.value;

  return matchingCategory ?? "all";
}

function normalizeSelection(
  selection: StudySelection | null | undefined,
): StudySelection {
  const mode = selection?.mode === "conversation" ? "conversation" : "words";

  return {
    mode,
    category: normalizeCategoryForMode(mode, selection?.category),
  };
}

export const studyDecksAtom = atom<StudyDecks>({
  words: [],
  conversation: [],
});
export const currentItemIdAtom = atom("");
export const revealedCardKeyAtom = atom("");

const storedSelectionAtom = atomWithStorage<StudySelection | null>(
  STUDY_SELECTION_STORAGE_KEY,
  null,
  selectionStorage,
  { getOnInit: true },
);

export const modeAtom = atom(
  (get) => normalizeSelection(get(storedSelectionAtom)).mode,
  (get, set, nextMode: StudyMode) => {
    const currentSelection = normalizeSelection(get(storedSelectionAtom));

    set(storedSelectionAtom, {
      mode: nextMode,
      category: normalizeCategoryForMode(nextMode, currentSelection.category),
    });
  },
);

export const categoryAtom = atom(
  (get) => {
    const selection = normalizeSelection(get(storedSelectionAtom));
    return normalizeCategoryForMode(selection.mode, selection.category);
  },
  (get, set, nextCategory: StudyCategory) => {
    const currentSelection = normalizeSelection(get(storedSelectionAtom));

    set(storedSelectionAtom, {
      ...currentSelection,
      category: normalizeCategoryForMode(currentSelection.mode, nextCategory),
    });
  },
);

const storedProgressAtom = atomWithStorage<StudyProgress | null>(
  STORAGE_KEY,
  null,
  progressStorage,
  { getOnInit: true },
);

export const progressAtom = atom(
  (get) => normalizeProgress(get(studyDecksAtom), get(storedProgressAtom)),
  (get, set, update: ProgressUpdate) => {
    const decks = get(studyDecksAtom);
    const currentProgress = normalizeProgress(decks, get(storedProgressAtom));
    const nextProgress =
      typeof update === "function" ? update(currentProgress) : update;

    set(storedProgressAtom, normalizeProgress(decks, nextProgress));
  },
);

export function getInitialProgress(decks: StudyDecks) {
  return createInitialProgress(decks);
}
