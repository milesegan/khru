import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeProgress, STUDY_CATEGORY_OPTIONS } from "../lib/study";
import type {
  StudyCategory,
  StudyDecks,
  StudyMode,
  StudyProgress,
} from "../types";

const LEGACY_PROGRESS_STORAGE_KEY = "khru-study-progress-v2";
const LEGACY_SELECTION_STORAGE_KEY = "khru-study-selection-v1";

export const STUDY_STORAGE_KEY = "khru-study-v1";
export const STUDY_STORAGE_VERSION = 1;

type StudySelection = {
  mode: StudyMode;
  category: StudyCategory;
};

type PersistedStudyState = StudySelection & {
  // Kept exactly as stored so a deck change can normalize it against the
  // current items instead of dropping entries for cards that moved decks.
  progress: StudyProgress | null;
};

type StudyActions = {
  setMode: (mode: StudyMode) => void;
  setCategory: (category: StudyCategory) => void;
  setCurrentItemId: (itemId: string) => void;
  setRevealedCardKey: (cardKey: string) => void;
  setProgress: (progress: StudyProgress) => void;
};

type StudyState = PersistedStudyState & {
  currentItemId: string;
  revealedCardKey: string;
  actions: StudyActions;
};

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
  selection: Partial<StudySelection> | null | undefined,
): StudySelection {
  const mode = selection?.mode === "conversation" ? "conversation" : "words";

  return {
    mode,
    category: normalizeCategoryForMode(mode, selection?.category),
  };
}

export function createInitialStudyState(): Omit<StudyState, "actions"> {
  return {
    mode: "words",
    category: "all",
    currentItemId: "",
    revealedCardKey: "",
    progress: null,
  };
}

function readStoredJSON<Value>(storage: Storage, key: string): Value | null {
  const raw = storage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Value;
  } catch {
    return null;
  }
}

/**
 * Folds the two pre-zustand localStorage keys into the single persisted store
 * entry so existing study progress survives the migration. Runs only when the
 * store has never been written.
 */
export function migrateLegacyStudyState(storage: Storage) {
  if (storage.getItem(STUDY_STORAGE_KEY)) {
    return;
  }

  const legacyProgress = readStoredJSON<StudyProgress>(
    storage,
    LEGACY_PROGRESS_STORAGE_KEY,
  );
  const legacySelection = readStoredJSON<Partial<StudySelection>>(
    storage,
    LEGACY_SELECTION_STORAGE_KEY,
  );

  if (!legacyProgress && !legacySelection) {
    return;
  }

  const persistedState: PersistedStudyState = {
    ...normalizeSelection(legacySelection),
    progress: legacyProgress,
  };

  storage.setItem(
    STUDY_STORAGE_KEY,
    JSON.stringify({ state: persistedState, version: STUDY_STORAGE_VERSION }),
  );
}

// Resolved lazily so the legacy fold-in happens on the persist read rather
// than as an import-time side effect.
const studyStorage = createJSONStorage<PersistedStudyState>(() => ({
  getItem: (key) => {
    migrateLegacyStudyState(window.localStorage);
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    // Revealing and advancing a card go through the store too, so skip the
    // write when the persisted slice itself has not moved.
    if (window.localStorage.getItem(key) === value) {
      return;
    }

    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    window.localStorage.removeItem(key);
  },
}));

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      ...createInitialStudyState(),
      actions: {
        setMode: (mode) =>
          set((state) => ({
            mode,
            category: normalizeCategoryForMode(mode, state.category),
          })),
        setCategory: (category) =>
          set((state) => ({
            category: normalizeCategoryForMode(state.mode, category),
          })),
        setCurrentItemId: (currentItemId) => set({ currentItemId }),
        setRevealedCardKey: (revealedCardKey) => set({ revealedCardKey }),
        setProgress: (progress) => set({ progress }),
      },
    }),
    {
      name: STUDY_STORAGE_KEY,
      version: STUDY_STORAGE_VERSION,
      storage: studyStorage,
      partialize: (state): PersistedStudyState => ({
        mode: state.mode,
        category: state.category,
        progress: state.progress,
      }),
      merge: (persistedState, currentState): StudyState => {
        const persisted = (persistedState ??
          {}) as Partial<PersistedStudyState>;

        return {
          ...currentState,
          ...normalizeSelection(persisted),
          progress: persisted.progress ?? null,
        };
      },
    },
  ),
);

export function useStudyActions() {
  return useStudyStore((state) => state.actions);
}

/**
 * Persisted progress reshaped against the decks currently in play, so cards
 * added or removed since the last visit still get a progress entry.
 */
export function useStudyProgress(decks: StudyDecks): StudyProgress {
  const storedProgress = useStudyStore((state) => state.progress);

  return useMemo(
    () => normalizeProgress(decks, storedProgress),
    [decks, storedProgress],
  );
}
