import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  createInitialProgress,
  normalizeProgress,
  STORAGE_KEY,
} from "../lib/study";
import type { StudyCategory, StudyProgress, WordEntry } from "../types";

type ProgressUpdate =
  | StudyProgress
  | ((currentProgress: StudyProgress) => StudyProgress);

const progressStorage = createJSONStorage<StudyProgress | null>(
  () => window.localStorage,
);

export const wordsAtom = atom<WordEntry[]>([]);
export const queryAtom = atom("");
export const categoryAtom = atom<StudyCategory>("all");
export const currentWordIdAtom = atom("");
export const revealedCardKeyAtom = atom("");

const storedProgressAtom = atomWithStorage<StudyProgress | null>(
  STORAGE_KEY,
  null,
  progressStorage,
  { getOnInit: true },
);

export const progressAtom = atom(
  (get) => normalizeProgress(get(wordsAtom), get(storedProgressAtom)),
  (get, set, update: ProgressUpdate) => {
    const words = get(wordsAtom);
    const currentProgress = normalizeProgress(words, get(storedProgressAtom));
    const nextProgress =
      typeof update === "function" ? update(currentProgress) : update;

    set(storedProgressAtom, normalizeProgress(words, nextProgress));
  },
);

export function getInitialProgress(words: WordEntry[]) {
  return createInitialProgress(words);
}
