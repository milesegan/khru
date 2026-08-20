import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  migrateLegacyStudyState,
  STUDY_STORAGE_KEY,
  STUDY_STORAGE_VERSION,
  useStudyStore,
} from "./study";
import type { StudyProgress } from "../types";

// Spelled out rather than imported: these keys are a storage contract with
// installs that predate the store, so the test should fail if they drift.
const LEGACY_PROGRESS_STORAGE_KEY = "khru-study-progress-v2";
const LEGACY_SELECTION_STORAGE_KEY = "khru-study-selection-v1";

const legacyProgress: StudyProgress = {
  words: {
    chan: {
      familiarity: 2,
      exposureCount: 3,
      lastRating: "known",
      lastReviewedAt: "2026-01-01T00:00:00.000Z",
      dueAt: "2026-01-04T00:00:00.000Z",
    },
  },
  conversation: {},
};

function readPersistedState() {
  const raw = window.localStorage.getItem(STUDY_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("study store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("migrateLegacyStudyState", () => {
    it("folds the legacy progress and selection keys into the store entry", () => {
      window.localStorage.setItem(
        LEGACY_PROGRESS_STORAGE_KEY,
        JSON.stringify(legacyProgress),
      );
      window.localStorage.setItem(
        LEGACY_SELECTION_STORAGE_KEY,
        JSON.stringify({ mode: "conversation", category: "directions" }),
      );

      migrateLegacyStudyState(window.localStorage);

      expect(readPersistedState()).toEqual({
        version: STUDY_STORAGE_VERSION,
        state: {
          mode: "conversation",
          category: "directions",
          progress: legacyProgress,
        },
      });
    });

    it("drops a legacy category that does not belong to the legacy mode", () => {
      window.localStorage.setItem(
        LEGACY_SELECTION_STORAGE_KEY,
        JSON.stringify({ mode: "conversation", category: "signs" }),
      );

      migrateLegacyStudyState(window.localStorage);

      expect(readPersistedState().state).toEqual({
        mode: "conversation",
        category: "all",
        progress: null,
      });
    });

    it("ignores unreadable legacy values", () => {
      window.localStorage.setItem(LEGACY_PROGRESS_STORAGE_KEY, "{not json");
      window.localStorage.setItem(LEGACY_SELECTION_STORAGE_KEY, "{not json");

      migrateLegacyStudyState(window.localStorage);

      expect(readPersistedState()).toBeNull();
    });

    it("leaves an already migrated store entry untouched", () => {
      const persisted = JSON.stringify({
        version: STUDY_STORAGE_VERSION,
        state: { mode: "words", category: "food", progress: null },
      });

      window.localStorage.setItem(STUDY_STORAGE_KEY, persisted);
      window.localStorage.setItem(
        LEGACY_PROGRESS_STORAGE_KEY,
        JSON.stringify(legacyProgress),
      );

      migrateLegacyStudyState(window.localStorage);

      expect(window.localStorage.getItem(STUDY_STORAGE_KEY)).toBe(persisted);
    });
  });

  describe("persistence", () => {
    it("writes the selection and progress but not the ephemeral card state", () => {
      const { setCategory, setCurrentItemId, setProgress, setRevealedCardKey } =
        useStudyStore.getState().actions;

      setCategory("food");
      setProgress(legacyProgress);
      setCurrentItemId("chan");
      setRevealedCardKey("words:chan");

      expect(readPersistedState().state).toEqual({
        mode: "words",
        category: "food",
        progress: legacyProgress,
      });
    });

    it("does not rewrite storage when only the card state moves", () => {
      const { setCurrentItemId, setProgress, setRevealedCardKey } =
        useStudyStore.getState().actions;

      setProgress(legacyProgress);

      const setItemSpy = vi.spyOn(window.localStorage, "setItem");

      setCurrentItemId("chan");
      setRevealedCardKey("words:chan");

      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it("restores a stored selection and progress on rehydrate", async () => {
      window.localStorage.setItem(
        STUDY_STORAGE_KEY,
        JSON.stringify({
          version: STUDY_STORAGE_VERSION,
          state: {
            mode: "conversation",
            category: "greetings",
            progress: legacyProgress,
          },
        }),
      );

      await useStudyStore.persist.rehydrate();

      expect(useStudyStore.getState()).toMatchObject({
        mode: "conversation",
        category: "greetings",
        progress: legacyProgress,
      });
    });

    it("rehydrates straight from the legacy keys", async () => {
      window.localStorage.setItem(
        LEGACY_PROGRESS_STORAGE_KEY,
        JSON.stringify(legacyProgress),
      );
      window.localStorage.setItem(
        LEGACY_SELECTION_STORAGE_KEY,
        JSON.stringify({ mode: "conversation", category: "directions" }),
      );

      await useStudyStore.persist.rehydrate();

      expect(useStudyStore.getState()).toMatchObject({
        mode: "conversation",
        category: "directions",
        progress: legacyProgress,
      });
    });

    it("falls back to the default mode when the stored mode is unknown", async () => {
      window.localStorage.setItem(
        STUDY_STORAGE_KEY,
        JSON.stringify({
          version: STUDY_STORAGE_VERSION,
          state: { mode: "sentences", category: "signs" },
        }),
      );

      await useStudyStore.persist.rehydrate();

      expect(useStudyStore.getState()).toMatchObject({
        mode: "words",
        category: "signs",
        progress: null,
      });
    });
  });

  describe("selection actions", () => {
    it("keeps the category valid for the selected mode", () => {
      const { setCategory, setMode } = useStudyStore.getState().actions;

      setCategory("signs");
      setMode("conversation");

      expect(useStudyStore.getState().category).toBe("all");

      setCategory("greetings");
      setMode("words");

      expect(useStudyStore.getState().category).toBe("all");
    });

    it("keeps a category shared by both modes across a mode switch", () => {
      const { setCategory, setMode } = useStudyStore.getState().actions;

      setCategory("time");
      setMode("conversation");

      expect(useStudyStore.getState().category).toBe("time");
    });

    it("ignores a category the current mode does not offer", () => {
      const { setCategory } = useStudyStore.getState().actions;

      setCategory("greetings");

      expect(useStudyStore.getState().category).toBe("all");
    });
  });
});
