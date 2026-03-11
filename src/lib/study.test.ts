import { describe, expect, it, vi } from "vitest";
import {
  applyRating,
  createInitialProgress,
  getDueWords,
  loadProgress,
  saveProgress,
  STORAGE_KEY,
} from "./study";
import type { StudyProgress, WordEntry } from "../types";

const words: WordEntry[] = [
  {
    id: "chan",
    thai: "ฉัน",
    transliteration: "chan",
    meaning: "I; me",
    patternNote: "Test note",
    difficulty: 1,
    tags: ["pronoun"],
  },
  {
    id: "baan",
    thai: "บ้าน",
    transliteration: "baan",
    meaning: "house",
    patternNote: "Test note",
    difficulty: 1,
    tags: ["place"],
  },
];

describe("study helpers", () => {
  it("creates progress for every word", () => {
    const progress = createInitialProgress(words);

    expect(Object.keys(progress.words)).toEqual(["chan", "baan"]);
    expect(progress.words.chan.familiarity).toBe(0);
  });

  it("keeps failed words due sooner than known words", () => {
    const start = createInitialProgress(words);
    const now = new Date("2026-03-11T10:00:00.000Z");

    const afterKnown = applyRating(start, "chan", "known", now);
    const afterAgain = applyRating(afterKnown, "baan", "again", now);
    const queue = getDueWords(
      words,
      afterAgain,
      new Date("2026-03-11T10:06:00.000Z"),
    );

    expect(queue.map((word) => word.id)).toEqual(["baan"]);
  });

  it("searches across Thai, transliteration, and meaning", () => {
    const progress = createInitialProgress(words);

    expect(
      getDueWords(words, progress, new Date(), "house").map((word) => word.id),
    ).toEqual(["baan"]);
    expect(
      getDueWords(words, progress, new Date(), "chan").map((word) => word.id),
    ).toEqual(["chan"]);
    expect(
      getDueWords(words, progress, new Date(), "ฉัน").map((word) => word.id),
    ).toEqual(["chan"]);
  });

  it("falls back to fresh progress when storage data is corrupt", () => {
    const storage = {
      getItem: vi.fn(() => "{nope"),
      setItem: vi.fn(),
    } as unknown as Storage;

    const progress = loadProgress(words, storage);

    expect(progress.words.chan.exposureCount).toBe(0);
  });

  it("saves study progress under the stable key", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    } as unknown as Storage;
    const progress: StudyProgress = createInitialProgress(words);

    saveProgress(progress, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(progress),
    );
  });
});
